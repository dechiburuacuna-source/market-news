import { NextResponse } from 'next/server'
import { getArticles } from '@/lib/storage'
import { MOCK_ARTICLES } from '@/lib/mockData'
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
    let articles = await getArticles(filters)

    // Fall back to mock data if DB is empty
    if (articles.length === 0) {
      articles = MOCK_ARTICLES.filter(a => {
        if (filters.category && filters.category !== 'all' && a.category !== filters.category) return false
        if (filters.locations?.length && !filters.locations.includes(a.location)) return false
        if (filters.sourceType && a.source_type !== filters.sourceType) return false
        if (filters.source && a.source !== filters.source) return false
        return true
      })
    }

    return NextResponse.json({ articles, total: articles.length })
  } catch (err) {
    console.error('[/api/articles]', err)
    // Always return mock data as fallback
    return NextResponse.json({ articles: MOCK_ARTICLES, total: MOCK_ARTICLES.length })
  }
}
