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
Content: ${raw.content.slice(0, 1400)}

Source categories: ${raw.categories.join(', ')}

Return JSON with EXACTLY these fields:
{
  "title_es": "Title in Spanish (keep if already Spanish)",
  "category": "Mining" | "Energy" | "Data Centers",
  "location": "Chile" | "Italy" | "Poland" | "Mexico" | "Spain" | "Global",
  "extended_description": "3-5 sentence English paragraph adding context and significance for professionals",
  "extended_description_es": "Same paragraph in Spanish",
  "short_summary": ["Bullet 1 EN (verb + key fact, 15-25 words)", "Bullet 2 EN", "Bullet 3 EN"],
  "short_summary_es": ["Bullet 1 ES", "Bullet 2 ES", "Bullet 3 ES"]
}
Rules: single best-fit category; location = geographic focus of the article; no impact level.`
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
    return {
      title_es: String(parsed.title_es || raw.title),
      category: validCats.includes(parsed.category) ? parsed.category : (raw.categories[0] as Category) || 'Energy',
      location: validLocs.includes(parsed.location) ? parsed.location : (raw.location as Location),
      extended_description: String(parsed.extended_description || ''),
      extended_description_es: String(parsed.extended_description_es || ''),
      short_summary: Array.isArray(parsed.short_summary) ? parsed.short_summary.slice(0, 3).map(String) : [],
      short_summary_es: Array.isArray(parsed.short_summary_es) ? parsed.short_summary_es.slice(0, 3).map(String) : [],
    }
  } catch (err) {
    console.error('[OpenAI] Failed:', raw.url, (err as Error).message)
    return null
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
