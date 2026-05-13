import { NextResponse } from 'next/server'
import { fetchAllRSSFeeds } from '@/lib/rss'
import { searchAllWebSources, WEB_SEARCH_SOURCES } from '@/lib/webSearchIngest'
import { processArticlesBatch } from '@/lib/openai'
import { upsertArticle, articleExistsByUrl, makeId, purgeOldArticles } from '@/lib/storage'
import { RSS_SOURCES } from '@/lib/sources'
import type { Article, IngestResult } from '@/types/article'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const result: IngestResult = { fetched: 0, new_articles: 0, processed: 0, errors: [], duration_ms: 0 }

  if (!process.env.OPENAI_API_KEY) {
    result.errors.push('OPENAI_API_KEY not set — cannot run ingest')
    result.duration_ms = Date.now() - startTime
    return NextResponse.json({ success: false, ...result })
  }
  if (!process.env.GEMINI_API_KEY) {
    console.warn('[Ingest] GEMINI_API_KEY not set — web search step will be skipped')
    result.errors.push('GEMINI_API_KEY not set — web search skipped')
  }

  try {
    // 0. Purge articles older than 60 days
    const purged = await purgeOldArticles()
    console.log(`[Ingest] Purged ${purged} old articles`)

    // 1a. Fetch RSS feeds
    console.log(`[Ingest] Fetching RSS from ${RSS_SOURCES.length} sources...`)
    const { articles: rssArticles, failed: rssFailed } = await fetchAllRSSFeeds(RSS_SOURCES)
    if (rssFailed.length) console.log(`[Ingest] RSS failed for: ${rssFailed.join(', ')}`)

    // 1b. Gemini + Google Search for all web sources (real-time search)
    let webArticles: typeof rssArticles = []
    if (process.env.GEMINI_API_KEY) {
      console.log(`[Ingest] Gemini web searching ${WEB_SEARCH_SOURCES.length} sources...`)
      const { articles: wa, failed: webFailed } = await searchAllWebSources()
      webArticles = wa
      if (webFailed.length) result.errors.push(`Gemini search failed: ${webFailed.join(', ')}`)
    } else {
      console.log('[Ingest] Skipping Gemini web search — GEMINI_API_KEY not set')
    }

    // 1c. Merge and deduplicate
    const seen = new Set<string>()
    const allRaw = [...rssArticles, ...webArticles].filter(a => {
      if (!a.url || seen.has(a.url)) return false
      seen.add(a.url)
      return true
    })
    result.fetched = allRaw.length
    console.log(`[Ingest] Total fetched: ${allRaw.length} (RSS: ${rssArticles.length}, Web: ${webArticles.length})`)

    // 2. Filter new articles only
    const newRaw = []
    for (const raw of allRaw) {
      try {
        if (!(await articleExistsByUrl(raw.url))) newRaw.push(raw)
      } catch { result.errors.push(`URL check failed: ${raw.url}`) }
    }
    result.new_articles = newRaw.length
    console.log(`[Ingest] ${newRaw.length} new articles to process`)

    if (newRaw.length === 0) {
      result.duration_ms = Date.now() - startTime
      return NextResponse.json({ success: true, ...result })
    }

    // 3. Process with OpenAI GPT-4o-mini (classify + bilingual summaries)
    const processed = await processArticlesBatch(newRaw, 3, (done, total) => {
      console.log(`[Ingest] AI processing: ${done}/${total}`)
    })

    // 4. Store each processed article
    for (const { raw, processed: fields } of processed) {
      if (!fields) { result.errors.push(`AI failed: ${raw.url}`); continue }
      const article: Article = {
        id: makeId(),
        title: raw.title, title_es: fields.title_es,
        source: raw.source, source_type: raw.source_type,
        location: fields.location, category: fields.category,
        date: raw.date, url: raw.url, content: raw.content,
        extended_description: fields.extended_description,
        extended_description_es: fields.extended_description_es,
        short_summary: fields.short_summary,
        short_summary_es: fields.short_summary_es,
        created_at: new Date().toISOString(), processed: true,
      }
      try { await upsertArticle(article); result.processed++ }
      catch (err) { result.errors.push(`Store failed: ${raw.url}`) }
    }

  } catch (err) {
    const msg = (err as Error).message
    console.error('[Ingest] Fatal:', msg)
    result.errors.push(`Fatal: ${msg}`)
    result.duration_ms = Date.now() - startTime
    return NextResponse.json({ success: false, ...result }, { status: 500 })
  }

  result.duration_ms = Date.now() - startTime
  console.log(`[Ingest] Completed in ${result.duration_ms}ms — stored ${result.processed} articles`)
  return NextResponse.json({ success: true, ...result })
}
