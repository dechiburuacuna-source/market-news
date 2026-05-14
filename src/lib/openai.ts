import OpenAI from 'openai'
import type { Category, Location } from '@/types/article'
import type { RawArticle } from './rss'

let _client: OpenAI | null = null
function getClient() {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _client
}

export interface ProcessedFields {
  title_es: string; category: Category; location: Location
  extended_description: string; extended_description_es: string
  short_summary: string[]; short_summary_es: string[]
}

const SYSTEM_PROMPT = `You are an industry intelligence analyst for Mining, Energy, and Data Centers.
Classify and summarize articles for a professional bilingual (EN/ES) intelligence dashboard.
Respond ONLY with valid JSON — no markdown, no explanation.`

function buildPrompt(raw: RawArticle): string {
  return `Article:
Title: ${raw.title}
Source: ${raw.source} (${raw.location}, ${raw.source_type})
Date: ${raw.date}
Language: ${raw.lang}
Content: ${raw.content.slice(0, 1800)}

Source categories: ${raw.categories.join(', ')}

Return JSON with EXACTLY these fields:
{
  "title_es": "Title in Spanish (keep if already Spanish)",
  "category": "Mining" | "Energy" | "Data Centers",
  "location": "Chile" | "Italy" | "Poland" | "Mexico" | "Spain" | "Global",
  "extended_description": "3-5 sentence English paragraph adding context, market significance, and implications for industry professionals",
  "extended_description_es": "Same paragraph in Spanish",
  "short_summary": [
    "Bullet 1 EN — THE FACT: what specifically happened (action verb + concrete subject + measurable detail). Do NOT restate the title.",
    "Bullet 2 EN — THE NUMBERS / SCALE: monetary value, MW, GW, tonnes, capacity, deadline, percentage growth, etc. Skip if no numbers exist (drop this bullet entirely).",
    "Bullet 3 EN — WHY IT MATTERS: strategic implication, regulatory consequence, competitive shift, or signal to watch."
  ],
  "short_summary_es": [
    "Punto 1 ES — EL HECHO: qué pasó específicamente (verbo de acción + sujeto concreto + dato medible). NO repitas el título.",
    "Punto 2 ES — LOS NÚMEROS / ESCALA: monto, MW, GW, toneladas, capacidad, plazo, % de crecimiento. Si no hay cifras, omite este punto completamente.",
    "Punto 3 ES — POR QUÉ IMPORTA: implicancia estratégica, consecuencia regulatoria, cambio competitivo o señal a vigilar."
  ]
}
QUALITY RULES — STRICT:
1. MAX 3 bullets. Better 2 strong bullets than 3 weak ones.
2. NO REDUNDANCY: each bullet must add information not present in the others. If two bullets would say the same thing, keep only one.
3. NO TITLE REPETITION: the first bullet cannot paraphrase the title — it must add a concrete detail the title doesn't have.
4. NO FILLER: drop bullets like "this is important for the industry" or "stakeholders are watching". If you can't write something specific, omit the bullet.
5. NO NUMBERS, NO BULLET 2: if the article truly has no numbers or scale, return only 2 bullets (fact + why-it-matters). Do not invent figures.
6. PROFESSIONAL TONE: write for an industry analyst, not a general reader.
Other rules:
- single best-fit category
- location = geographic focus of the article
- no impact level`
}

/** Split a text into sentences. Returns first N substantive sentences. */
function splitSentences(text: string, max: number): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20)
    .slice(0, max)
}

/** Normalize text for similarity comparison: lowercase, alphanumeric only. */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9áéíóúñ\s]/gi, '').replace(/\s+/g, ' ').trim()
}

/** Jaccard similarity over word sets — 0 (different) to 1 (identical). */
function similarity(a: string, b: string): number {
  const aw = new Set(normalize(a).split(' ').filter(w => w.length > 3))
  const bw = new Set(normalize(b).split(' ').filter(w => w.length > 3))
  if (aw.size === 0 || bw.size === 0) return 0
  let inter = 0
  Array.from(aw).forEach(w => { if (bw.has(w)) inter++ })
  return inter / Math.min(aw.size, bw.size)
}

/**
 * Drop bullets that are:
 *  - too similar to the title (>60% word overlap → just paraphrasing the headline)
 *  - too similar to a previous bullet (>55% word overlap → redundant)
 *  - too short or pure filler
 * Caps result at 3 bullets.
 */
function dedupeBullets(bullets: string[], title: string): string[] {
  const FILLER_RE = /^(this is important|stakeholders|industry observers|it remains to be seen|going forward|in summary)/i
  const out: string[] = []
  for (const raw of bullets) {
    const b = raw.trim()
    if (!b || b.length < 15) continue
    if (FILLER_RE.test(b)) continue
    if (similarity(b, title) > 0.60) continue           // paraphrase of title
    if (out.some(prev => similarity(b, prev) > 0.55)) continue  // redundant vs prior bullet
    out.push(b)
    if (out.length >= 3) break
  }
  return out
}

/**
 * Build up to 3 bullets from the article body sentences. Used when AI is
 * unavailable or returns too few bullets. We deliberately DO NOT use the
 * title here — dedupeBullets() will reject anything that paraphrases it.
 */
function deriveBullets(raw: RawArticle): string[] {
  const content  = (raw.content || '').trim()
  const sentences = splitSentences(content, 6)
  const bullets: string[] = []
  for (const s of sentences) {
    if (similarity(s, raw.title) > 0.60) continue
    if (bullets.some(prev => similarity(s, prev) > 0.55)) continue
    bullets.push(s.length > 220 ? s.slice(0, 217) + '…' : s)
    if (bullets.length >= 3) break
  }
  if (bullets.length === 0) {
    bullets.push(`${raw.source} (${raw.location}) — ${raw.date}`)
  }
  return bullets
}

/** Basic fallback so an article still appears even if AI classification fails. */
function fallbackFields(raw: RawArticle): ProcessedFields {
  const content = (raw.content || raw.title).slice(0, 600)
  const bullets = deriveBullets(raw)
  return {
    title_es: raw.title,
    category: (raw.categories[0] as Category) || 'Energy',
    location: raw.location as Location,
    extended_description:    content,
    extended_description_es: content,
    short_summary:    bullets,
    short_summary_es: bullets,
  }
}

export async function processArticle(raw: RawArticle): Promise<ProcessedFields | null> {
  const client = getClient()
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildPrompt(raw) },
      ],
    })
    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}') as ProcessedFields
    const validCats: Category[] = ['Mining', 'Energy', 'Data Centers']
    const validLocs: Location[] = ['Chile', 'Italy', 'Poland', 'Mexico', 'Spain', 'Global']

    const rawEn = Array.isArray(parsed.short_summary)    ? parsed.short_summary.map(String).filter(s => s.trim().length > 0)    : []
    const rawEs = Array.isArray(parsed.short_summary_es) ? parsed.short_summary_es.map(String).filter(s => s.trim().length > 0) : []

    // Strip redundant / title-paraphrase / filler bullets, cap at 3
    let shortEn = dedupeBullets(rawEn, raw.title)
    let shortEs = dedupeBullets(rawEs, parsed.title_es || raw.title)

    // If AI failed to produce useful bullets, derive from content
    if (shortEn.length === 0) shortEn = deriveBullets(raw)
    if (shortEs.length === 0) shortEs = deriveBullets(raw)

    return {
      title_es: String(parsed.title_es || raw.title),
      category: validCats.includes(parsed.category) ? parsed.category : (raw.categories[0] as Category) || 'Energy',
      location: validLocs.includes(parsed.location) ? parsed.location : (raw.location as Location),
      extended_description: String(parsed.extended_description || ''),
      extended_description_es: String(parsed.extended_description_es || ''),
      short_summary:    shortEn,
      short_summary_es: shortEs,
    }
  } catch (err) {
    console.error('[OpenAI] Failed:', raw.url, (err as Error).message)
    return fallbackFields(raw)
  }
}

export async function processArticlesBatch(
  articles: RawArticle[], concurrency = 3,
  onProgress?: (done: number, total: number) => void
): Promise<Array<{ raw: RawArticle; processed: ProcessedFields | null }>> {
  const results: Array<{ raw: RawArticle; processed: ProcessedFields | null }> = []
  for (let i = 0; i < articles.length; i += concurrency) {
    const batch = articles.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map(async raw => ({ raw, processed: await processArticle(raw) })))
    results.push(...batchResults)
    onProgress?.(Math.min(i + concurrency, articles.length), articles.length)
    if (i + concurrency < articles.length) await new Promise(r => setTimeout(r, 400))
  }
  return results
}
