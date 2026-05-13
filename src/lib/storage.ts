import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import type { Article, ArticleFilters } from '@/types/article'
import { getSupabaseClient, isSupabaseConfigured } from './supabase'

const DATA_FILE = path.join(process.cwd(), 'data', 'articles.json')
const RETENTION_DAYS = 60

async function readJSON(): Promise<Article[]> {
  try { return JSON.parse(await fs.readFile(DATA_FILE, 'utf8')) }
  catch { return [] }
}
async function writeJSON(articles: Article[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
  await fs.writeFile(DATA_FILE, JSON.stringify(articles, null, 2))
}

function cutoffDate(): string {
  const d = new Date()
  d.setDate(d.getDate() - RETENTION_DAYS)
  return d.toISOString().split('T')[0]
}

export async function getArticles(filters?: ArticleFilters): Promise<Article[]> {
  return isSupabaseConfigured() ? getArticlesSupabase(filters) : getArticlesJSON(filters)
}
export async function upsertArticle(article: Article): Promise<void> {
  return isSupabaseConfigured() ? upsertArticleSupabase(article) : upsertArticleJSON(article)
}
export async function articleExistsByUrl(url: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()
    const { data } = await sb.from('articles').select('id').eq('url', url).maybeSingle()
    return !!data
  }
  return (await readJSON()).some(a => a.url === url)
}
export async function purgeOldArticles(): Promise<number> {
  const cutoff = cutoffDate()
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()
    const { count } = await sb.from('articles').delete({ count: 'exact' }).lt('date', cutoff)
    console.log('[Purge] Supabase deleted', count, 'articles older than', cutoff)
    return count || 0
  }
  const all = await readJSON()
  const kept = all.filter(a => a.date >= cutoff)
  const removed = all.length - kept.length
  if (removed > 0) { await writeJSON(kept); console.log('[Purge] JSON deleted', removed, 'old articles') }
  return removed
}
export function makeId(): string { return randomUUID() }

async function getArticlesSupabase(filters?: ArticleFilters): Promise<Article[]> {
  const sb = getSupabaseClient()
  const cutoff = cutoffDate()
  let q = sb.from('articles').select('*').eq('processed', true).gte('date', cutoff).order('date', { ascending: false }).limit(300)
  if (filters?.category && filters.category !== 'all') q = q.eq('category', filters.category)
  if (filters?.locations?.length) q = q.in('location', filters.locations)
  if (filters?.sourceType) q = q.eq('source_type', filters.sourceType)
  if (filters?.source) q = q.eq('source', filters.source)
  const { data, error } = await q
  if (error) throw error
  return (data || []) as Article[]
}

async function upsertArticleSupabase(article: Article): Promise<void> {
  const sb = getSupabaseClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await sb.from('articles').upsert(article as any, { onConflict: 'url' })
  if (error) throw error
}

function applyFilters(articles: Article[], filters?: ArticleFilters): Article[] {
  const cutoff = cutoffDate()
  return articles.filter(a => {
    if (!a.processed) return false
    if (a.date < cutoff) return false
    if (filters?.category && filters.category !== 'all' && a.category !== filters.category) return false
    if (filters?.locations?.length && !filters.locations.includes(a.location)) return false
    if (filters?.sourceType && a.source_type !== filters.sourceType) return false
    if (filters?.source && a.source !== filters.source) return false
    return true
  })
}

async function getArticlesJSON(filters?: ArticleFilters): Promise<Article[]> {
  const all = await readJSON()
  return applyFilters(all, filters).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 300)
}

async function upsertArticleJSON(article: Article): Promise<void> {
  const all = await readJSON()
  const idx = all.findIndex(a => a.url === article.url)
  if (idx >= 0) all[idx] = article; else all.unshift(article)
  await writeJSON(all.slice(0, 1000))
}
