import { NextResponse } from 'next/server'
import { getArticles } from '@/lib/storage'
import { MOCK_ARTICLES } from '@/lib/mockData'
import { isSupabaseConfigured } from '@/lib/supabase'
import type { ArticleFilters, Category, Location, SourceType } from '@/types/article'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const filters: ArticleFilters = {
    category: (searchParams.get('category') as Category | 'all') || 'all',
    locations: searchParams.getAll('location') as Location[],
    sourceType: (searchParams.get('sourceType') as SourceType) || null,
    source: searchParams.get('source') || null,
  }

  try {
    const articles = await getArticles(filters)

    // Only fall back to mock data when running WITHOUT Supabase (local dev).
    // When Supabase IS configured but empty, return 0 articles so the UI
    // shows a loading/empty state while the post-deploy ingest runs.
    if (articles.length === 0 && !isSupabaseConfigured()) {
      const mock = MOCK_ARTICLES.filter(a => {
        if (filters.category && filters.category !== 'all' && a.category !== filters.category) return false
        if (filters.locations?.length && !filters.locations.includes(a.location)) return false
        if (filters.sourceType && a.source_type !== filters.sourceType) return false
        if (filters.source && a.source !== filters.source) return false
        return true
      })
      return NextResponse.json({ articles: mock, total: mock.length, source: 'mock' })
    }

    return NextResponse.json({ articles, total: articles.length })
  } catch (err) {
    console.error('[/api/articles]', err)
    // On error and no Supabase: return mock as last resort
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ articles: MOCK_ARTICLES, total: MOCK_ARTICLES.length, source: 'mock' })
    }
    return NextResponse.json({ articles: [], total: 0 })
  }
}
