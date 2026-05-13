import Parser from 'rss-parser'
import type { SourceDef } from './sources'

const parser = new Parser({
  timeout: 12_000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; IndustryIntelBot/1.0)',
    Accept: 'application/rss+xml, application/xml, text/xml, */*',
  },
  customFields: { item: [['content:encoded', 'contentEncoded'], ['description', 'summary']] },
})

export interface RawArticle {
  title: string; url: string; source: string; source_type: 'Institutional' | 'Press' | 'Conglomerado' | 'Market Advisor'
  location: string; categories: string[]; date: string; content: string; lang: string
}

export interface FeedHealthResult {
  source: string; url: string; ok: boolean; error?: string; item_count?: number; latency_ms?: number
}

export async function probeFeedUrl(url: string): Promise<{ ok: boolean; error?: string; latency_ms: number }> {
  const t0 = Date.now()
  try {
    const feed = await parser.parseURL(url)
    if (!feed || !Array.isArray(feed.items)) return { ok: false, error: 'No items array', latency_ms: Date.now() - t0 }
    return { ok: true, latency_ms: Date.now() - t0 }
  } catch (err) {
    return { ok: false, error: (err as Error).message.slice(0, 100), latency_ms: Date.now() - t0 }
  }
}

export async function resolveRssUrl(source: SourceDef): Promise<string | null> {
  if (!source.rss) return null
  const candidates = [source.rss, ...(source.rss_fallbacks || [])]
  for (const url of candidates) {
    const { ok } = await probeFeedUrl(url)
    if (ok) return url
  }
  console.warn('[RSS] All URLs failed for', source.name)
  return null
}

export async function checkAllFeedHealth(sources: SourceDef[]): Promise<FeedHealthResult[]> {
  const withRSS = sources.filter(s => s.rss)
  return Promise.all(withRSS.map(async (s): Promise<FeedHealthResult> => {
    const t0 = Date.now()
    const workingUrl = await resolveRssUrl(s)
    if (!workingUrl) return { source: s.name, url: s.rss!, ok: false, error: 'No working URL', latency_ms: Date.now() - t0 }
    try {
      const feed = await parser.parseURL(workingUrl)
      return { source: s.name, url: workingUrl, ok: true, item_count: feed.items?.length || 0, latency_ms: Date.now() - t0 }
    } catch (err) {
      return { source: s.name, url: workingUrl, ok: false, error: (err as Error).message.slice(0, 100), latency_ms: Date.now() - t0 }
    }
  }))
}

export async function fetchRSSFeed(source: SourceDef): Promise<RawArticle[]> {
  const workingUrl = await resolveRssUrl(source)
  if (!workingUrl) return []
  try {
    const feed = await parser.parseURL(workingUrl)
    return feed.items.slice(0, 20)
      .filter(item => item.title && item.link)
      .map(item => {
        const content = [item.contentEncoded, item.content, item.summary, item.title]
          .filter(Boolean).join(' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000)
        return {
          title: (item.title || '').trim(), url: item.link || '',
          source: source.name, source_type: source.source_type,
          location: source.location, categories: source.categories,
          date: parseDate(item.pubDate || item.isoDate), content, lang: source.lang || 'en',
        } satisfies RawArticle
      })
  } catch (err) {
    console.warn('[RSS] Parse failed for', source.name, ':', (err as Error).message)
    return []
  }
}

export async function fetchAllRSSFeeds(
  sources: SourceDef[],
  concurrency = 5
): Promise<{ articles: RawArticle[]; failed: string[] }> {
  const withRSS = sources.filter(s => s.rss)
  const allArticles: RawArticle[] = []
  const failed: string[] = []
  for (let i = 0; i < withRSS.length; i += concurrency) {
    const batch = withRSS.slice(i, i + concurrency)
    const results = await Promise.all(batch.map(async s => {
      const arts = await fetchRSSFeed(s)
      if (arts.length === 0) failed.push(s.name)
      return arts
    }))
    results.forEach(r => allArticles.push(...r))
  }
  const seen = new Set<string>()
  const deduped = allArticles.filter(a => {
    if (!a.url || seen.has(a.url)) return false
    seen.add(a.url)
    return true
  })
  return { articles: deduped, failed }
}

function parseDate(raw: string | undefined): string {
  if (!raw) return new Date().toISOString().split('T')[0]
  try { return new Date(raw).toISOString().split('T')[0] }
  catch { return new Date().toISOString().split('T')[0] }
}
