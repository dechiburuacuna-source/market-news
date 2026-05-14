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
  "extended_description": "4-6 sentence English paragraph adding context, market significance, and implications for industry professionals",
  "extended_description_es": "Same paragraph in Spanish",
  "short_summary": [
    "Bullet 1 EN — Headline insight: WHAT happened (verb + key fact, 18-28 words)",
    "Bullet 2 EN — Market/financial impact or scale: numbers, capacity, investment, price",
    "Bullet 3 EN — Strategic or technical detail: who is involved, technology, timeline",
    "Bullet 4 EN — Wider context: regulation, competitive position, or what to watch next"
  ],
  "short_summary_es": [
    "Punto 1 ES — Insight principal: QUÉ pasó (verbo + hecho clave, 18-28 palabras)",
    "Punto 2 ES — Impacto de mercado/financiero o escala: números, capacidad, inversión, precio",
    "Punto 3 ES — Detalle estratégico o técnico: quién está involucrado, tecnología, plazos",
    "Punto 4 ES — Contexto: regulación, posición competitiva, o qué observar"
  ]
}
Rules:
- single best-fit category
- location = geographic focus of the article
- ALWAYS provide at least 2 bullets per language; ideally 4. If content is thin, infer from title + context to fill at least 2.
- bullets must be substantive intelligence — no fluff, no headline repetition
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

/** Build at least 2 bullets from title + content. Used when AI is unavailable or returns too few. */
function deriveBullets(raw: RawArticle): string[] {
  const title    = raw.title.trim()
  const content  = (raw.content || '').trim()
  const sentences = splitSentences(content, 4)
  // Always start with the title (compressed) as the headline bullet
  const bullets: string[] = [title.length > 200 ? title.slice(0, 197) + '…' : title]
  for (const s of sentences) {
    if (!bullets.some(b => b.toLowerCase().includes(s.toLowerCase().slice(0, 40)))) {
      bullets.push(s.length > 220 ? s.slice(0, 217) + '…' : s)
    }
    if (bullets.length >= 4) break
  }
  // Guarantee at least 2 bullets — if content was empty, derive a second one
  if (bullets.length < 2) {
    bullets.push(`${raw.source} — ${raw.location} (${raw.date})`)
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

    let shortEn = Array.isArray(parsed.short_summary)    ? parsed.short_summary.slice(0, 5).map(String).filter(s => s.trim().length > 0)    : []
    let shortEs = Array.isArray(parsed.short_summary_es) ? parsed.short_summary_es.slice(0, 5).map(String).filter(s => s.trim().length > 0) : []

    // Guarantee at least 2 bullets per language — pad from title/content if AI returned fewer
    if (shortEn.length < 2) shortEn = [...shortEn, ...deriveBullets(raw)].slice(0, 4)
    if (shortEs.length < 2) shortEs = [...shortEs, ...deriveBullets(raw)].slice(0, 4)

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
