/**
 * Direct HTML scraper for category/section pages.
 *
 * Gemini's Google Search grounding is unreliable when we need to pull
 * articles from SPECIFIC deep paths (e.g. "/categoria/.../almacenamiento/").
 * This module fetches those URLs directly, parses their HTML, and extracts
 * article links + titles + publication dates from common WordPress / CMS
 * structures.
 */

import type { RawArticle } from './rss'
import type { WebSearchSource } from './webSearchIngest'

const FETCH_TIMEOUT_MS = 10_000
const ARTICLES_PER_SECTION = 6
const SECTION_FETCH_CONCURRENCY = 6

interface ArticleStub {
  url: string
  title: string
  date?: string
  description?: string
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const ac = new AbortController()
    const t  = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS)
    const res = await fetch(url, {
      signal: ac.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IndustryIntelBot/1.0; +https://industry-intel.app)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'es,en;q=0.9',
      },
    })
    clearTimeout(t)
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

function absolutize(href: string, base: string): string | null {
  try { return new URL(href, base).toString() } catch { return null }
}

function decodeHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/\s+/g, ' ')
    .trim()
}

function looksLikeArticleUrl(url: string, domain: string): boolean {
  const lower = url.toLowerCase()
  if (!lower.includes(domain.toLowerCase())) return false
  // Reject obvious non-article paths
  const reject = ['/categoria/', '/category/', '/tag/', '/author/', '/page/', '/seccion/',
                  '/buscar', '/search', '/wp-content/', '/wp-admin/', '/feed', '/rss',
                  '/contacto', '/about', '/login', '/subscribe', '#']
  if (reject.some(r => lower.includes(r))) return false
  // Reject pure category URLs (trailing slash on a known path)
  return true
}

/** Extract article stubs from a category listing page (WordPress-friendly). */
function extractFromListing(html: string, baseUrl: string, domain: string): ArticleStub[] {
  const results: ArticleStub[] = []
  const seen = new Set<string>()

  // Step 1: split HTML into <article>...</article> blocks (most reliable for WordPress)
  const articleRe = /<article\b[\s\S]*?<\/article>/gi
  let blocks = html.match(articleRe) || []

  // Step 2: fallback for sites that don't use <article> — split by <h2 class="entry-title">
  if (blocks.length === 0) {
    const altRe = /<h[23][^>]*class="[^"]*(?:entry-title|post-title|article-title|titulo)[^"]*"[\s\S]*?(?=<h[23][^>]*class="[^"]*(?:entry-title|post-title|article-title|titulo)|<\/main>|<\/article>|$)/gi
    blocks = html.match(altRe) || []
  }

  for (const block of blocks) {
    // Find the article link — prefer rel="bookmark", then the first <a href> inside heading
    let linkMatch = block.match(/<a[^>]+href="([^"]+)"[^>]+rel=["']bookmark["'][^>]*>([\s\S]*?)<\/a>/i)
    if (!linkMatch) linkMatch = block.match(/<h[1-4][^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i)
    if (!linkMatch) linkMatch = block.match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i)
    if (!linkMatch) continue

    const rawUrl = linkMatch[1]
    const url = absolutize(rawUrl, baseUrl)
    if (!url) continue

    const cleanUrl = url.split('#')[0].split('?')[0]
    if (!looksLikeArticleUrl(cleanUrl, domain)) continue
    if (seen.has(cleanUrl)) continue

    const title = decodeHtml(linkMatch[2])
    if (title.length < 12) continue  // probably not a real title

    // Publication date: <time datetime="..."> in the block
    let date: string | undefined
    const dt = block.match(/<time[^>]+datetime=["']([^"']+)["']/i)
    if (dt) {
      const d = new Date(dt[1])
      if (!isNaN(d.getTime()) && d <= new Date()) date = d.toISOString().split('T')[0]
    }

    // Optional description / excerpt
    let description: string | undefined
    const exc = block.match(/<(?:p|div)[^>]*class="[^"]*(?:entry-summary|excerpt|bajada|resumen)[^"]*"[^>]*>([\s\S]*?)<\/(?:p|div)>/i)
    if (exc) description = decodeHtml(exc[1]).slice(0, 400)

    seen.add(cleanUrl)
    results.push({ url: cleanUrl, title, date, description })
  }

  return results
}

/** Scrape a single section URL, returning up to N article stubs. */
async function scrapeSection(sectionUrl: string, domain: string): Promise<ArticleStub[]> {
  const html = await fetchHtml(sectionUrl)
  if (!html) return []
  return extractFromListing(html, sectionUrl, domain).slice(0, ARTICLES_PER_SECTION)
}

/** Try a section path with multiple URL variants until one returns HTML. */
async function tryFetchSection(domain: string, section: string): Promise<{ url: string; stubs: ArticleStub[] } | null> {
  const cleanSection = section.replace(/^\/|\/$/g, '')
  const bareDomain = domain.replace(/^www\./, '')
  const variants = [
    `https://www.${bareDomain}/${cleanSection}/`,
    `https://${bareDomain}/${cleanSection}/`,
    `https://www.${bareDomain}/${cleanSection}`,
    `https://${bareDomain}/${cleanSection}`,
  ]
  for (const url of variants) {
    const stubs = await scrapeSection(url, bareDomain)
    if (stubs.length > 0) return { url, stubs }
  }
  return null
}

/** Extract the body text of an article: first paragraphs of <div class="entry-content"> or <article>. */
function extractBodyText(html: string): string {
  // Try common CMS containers first
  const bodyMatch =
    html.match(/<div[^>]+class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/<div[^>]+class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/<div[^>]+class="[^"]*article-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)
  const body = bodyMatch ? bodyMatch[1] : html
  // Pull <p> contents
  const paragraphs: string[] = []
  const pRe = /<p[^>]*>([\s\S]*?)<\/p>/gi
  let m
  while ((m = pRe.exec(body)) !== null && paragraphs.length < 6) {
    const txt = decodeHtml(m[1])
    if (txt.length > 40) paragraphs.push(txt)
  }
  return paragraphs.join(' ').slice(0, 1800)
}

/** Pull metadata (real pub date + description + body text) from an individual article page. */
async function enrichArticle(stub: ArticleStub): Promise<ArticleStub> {
  const html = await fetchHtml(stub.url)
  if (!html) return stub

  if (!stub.date) {
    const m =
      html.match(/<meta\s+property=["']article:published_time["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+name=["']pubdate["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+itemprop=["']datePublished["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<time[^>]+datetime=["']([^"']+)["']/i)
    if (m) {
      const d = new Date(m[1])
      if (!isNaN(d.getTime()) && d <= new Date()) stub.date = d.toISOString().split('T')[0]
    }
  }

  // Always try to grab the body text — gives OpenAI substantive content to summarize
  const ogDesc =
    html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1]
  const body = extractBodyText(html)
  const combined = [ogDesc ? decodeHtml(ogDesc) : '', body].filter(Boolean).join(' ').trim()
  if (combined.length > (stub.description?.length || 0)) stub.description = combined.slice(0, 1800)

  return stub
}

/** Scrape ONE source: fetch every section, dedupe by URL, enrich missing dates. */
export async function scrapeSourceSections(source: WebSearchSource): Promise<RawArticle[]> {
  if (!source.sections?.length) return []
  const domain = source.domain.replace(/^www\./, '')

  // Fetch all section pages with bounded concurrency
  const allStubs: ArticleStub[] = []
  for (let i = 0; i < source.sections.length; i += SECTION_FETCH_CONCURRENCY) {
    const batch = source.sections.slice(i, i + SECTION_FETCH_CONCURRENCY)
    const results = await Promise.all(batch.map(s => tryFetchSection(domain, s)))
    results.forEach(r => { if (r) allStubs.push(...r.stubs) })
  }

  // Dedupe by URL
  const byUrl = new Map<string, ArticleStub>()
  for (const s of allStubs) {
    if (!byUrl.has(s.url)) byUrl.set(s.url, s)
  }
  const unique = Array.from(byUrl.values())

  // Enrich any stub that lacks date OR has thin description.
  // OpenAI needs substantive text to generate 4 substantive bullets.
  const needsEnrich = unique
    .filter(s => !s.date || !s.description || (s.description?.length || 0) < 250)
    .slice(0, 20)  // cap to keep latency sane
  for (let i = 0; i < needsEnrich.length; i += SECTION_FETCH_CONCURRENCY) {
    const batch = needsEnrich.slice(i, i + SECTION_FETCH_CONCURRENCY)
    await Promise.all(batch.map(s => enrichArticle(s)))
  }

  const today = new Date().toISOString().split('T')[0]
  return unique.map(s => ({
    title:       s.title,
    url:         s.url,
    source:      source.name,
    source_type: source.source_type,
    location:    source.location,
    categories:  source.categories,
    date:        s.date || today,
    content:     s.description || s.title,
    lang:        source.lang,
  } satisfies RawArticle))
}

/** Scrape ALL sources that declared sections, in parallel batches. */
export async function scrapeAllSources(
  sources: WebSearchSource[],
  concurrency = 4
): Promise<{ articles: RawArticle[]; perSource: Record<string, number> }> {
  const targets = sources.filter(s => s.sections && s.sections.length > 0)
  const perSource: Record<string, number> = {}
  const all: RawArticle[] = []

  for (let i = 0; i < targets.length; i += concurrency) {
    const batch = targets.slice(i, i + concurrency)
    const results = await Promise.all(batch.map(async s => {
      const arts = await scrapeSourceSections(s)
      perSource[s.name] = arts.length
      console.log(`[Scraper] ${s.name}: ${arts.length} articles from ${s.sections!.length} sections`)
      return arts
    }))
    results.forEach(r => all.push(...r))
  }

  // Dedupe across sources
  const seen = new Set<string>()
  const deduped = all.filter(a => {
    if (!a.url || seen.has(a.url)) return false
    seen.add(a.url)
    return true
  })

  return { articles: deduped, perSource }
}
