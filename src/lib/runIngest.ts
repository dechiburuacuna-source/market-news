import { fetchAllRSSFeeds } from '@/lib/rss'
import { searchAllWebSources, WEB_SEARCH_SOURCES } from '@/lib/webSearchIngest'
import { processArticlesBatch } from '@/lib/openai'
import { upsertArticle, articleExistsByUrl, makeId, purgeOldArticles, purgeAllArticles } from '@/lib/storage'
import { RSS_SOURCES } from '@/lib/sources'
import type { Article, Category, Location, IngestResult } from '@/types/article'

export interface IngestOptions {
  fullRefresh?: boolean
}

export async function runIngest(opts: IngestOptions = {}): Promise<IngestResult> {
  const startTime = Date.now()
  const result: IngestResult = { fetched: 0, new_articles: 0, processed: 0, errors: [], duration_ms: 0, articles: [] }

  try {
    if (opts.fullRefresh) {
      const deleted = await purgeAllArticles()
      console.log(`[Ingest] Full refresh — cleared ${deleted} existing articles`)
    } else {
      const purged = await purgeOldArticles()
      console.log(`[Ingest] Purged ${purged} articles older than 5 days`)
    }

    // 1a. RSS feeds
    console.log(`[Ingest] Fetching RSS from ${RSS_SOURCES.length} sources...`)
    const { articles: rssArticles, failed: rssFailed } = await fetchAllRSSFeeds(RSS_SOURCES)
    if (rssFailed.length) console.log(`[Ingest] RSS failed: ${rssFailed.join(', ')}`)

    // 1b. Gemini + Google Search (real-time)
    let webArticles: typeof rssArticles = []
    if (process.env.GEMINI_API_KEY) {
      console.log(`[Ingest] Gemini searching ${WEB_SEARCH_SOURCES.length} sources...`)
      const { articles: wa, failed: webFailed } = await searchAllWebSources()
      webArticles = wa
      if (webFailed.length) result.errors.push(`Gemini no results: ${webFailed.join(', ')}`)
    } else {
      result.errors.push('GEMINI_API_KEY not set — web search skipped')
    }

    // 1c. Merge and deduplicate
    const seen = new Set<string>()
    const allRaw = [...rssArticles, ...webArticles].filter(a => {
      if (!a.url || seen.has(a.url)) return false
      seen.add(a.url)
      return true
    })
    result.fetched = allRaw.length
    console.log(`[Ingest] Fetched ${allRaw.length} total (RSS: ${rssArticles.length}, Web: ${webArticles.length})`)

    // 2. Filter new articles only
    const newRaw = []
    for (const raw of allRaw) {
      try {
        if (opts.fullRefresh || !(await articleExistsByUrl(raw.url))) newRaw.push(raw)
      } catch { result.errors.push(`URL check failed: ${raw.url}`) }
    }
    result.new_articles = newRaw.length
    console.log(`[Ingest] ${newRaw.length} new articles to process`)

    if (newRaw.length === 0) {
      result.duration_ms = Date.now() - startTime
      return result
    }

    // 3. GPT-4o-mini: classify + bilingual summaries.
    // processArticle now returns a fallback object instead of null, so every
    // raw article gets a Processed result (even if AI is unavailable).
    const processed = process.env.OPENAI_API_KEY
      ? await processArticlesBatch(newRaw, 3, (done, total) => {
          console.log(`[Ingest] AI processing: ${done}/${total}`)
        })
      : (() => {
          result.errors.push('OPENAI_API_KEY not set — using basic fallback')
          return newRaw.map(raw => ({
            raw,
            processed: {
              title_es: raw.title,
              category: (raw.categories[0] || 'Energy') as Category,
              location: raw.location as Location,
              extended_description:    raw.content?.slice(0, 400) || raw.title,
              extended_description_es: raw.content?.slice(0, 400) || raw.title,
              short_summary:    [raw.title.slice(0, 140)],
              short_summary_es: [raw.title.slice(0, 140)],
            },
          }))
        })()

    // 4. Store and collect results
    const storedArticles: Article[] = []
    for (const { raw, processed: fields } of processed) {
      if (!fields) { result.errors.push(`AI failed: ${raw.url}`); continue }
      const article: Article = {
        id: makeId(),
        title: raw.title, title_es: fields.title_es,
        source: raw.source, source_type: raw.source_type,
        location: fields.location, category: fields.category,
        date: raw.date,
        url: raw.url, content: raw.content,
        extended_description: fields.extended_description,
        extended_description_es: fields.extended_description_es,
        short_summary: fields.short_summary,
        short_summary_es: fields.short_summary_es,
        created_at: new Date().toISOString(), processed: true,
      }
      try {
        await upsertArticle(article)
        storedArticles.push(article)
        result.processed++
      } catch {
        // Storage failed (e.g. no Supabase, read-only filesystem) —
        // still include in result.articles so the frontend can display them.
        storedArticles.push(article)
        result.processed++
        result.errors.push(`Store failed: ${raw.url}`)
      }
    }

    // Always return articles in the response so the frontend can display them
    // even if storage is unavailable (no Supabase on Vercel)
    result.articles = storedArticles.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

  } catch (err) {
    const msg = (err as Error).message
    console.error('[Ingest] Fatal:', msg)
    result.errors.push(`Fatal: ${msg}`)
  }

  result.duration_ms = Date.now() - startTime
  console.log(`[Ingest] Done in ${result.duration_ms}ms — stored ${result.processed} articles`)
  return result
}
