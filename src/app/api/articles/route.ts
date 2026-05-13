import { NextResponse } from 'next/server'
import { getArticles } from '@/lib/storage'
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
    return NextResponse.json({ articles, total: articles.length })
  } catch (err) {
    console.error('[/api/articles]', err)
    return NextResponse.json({ articles: [], total: 0 })
  }
}
