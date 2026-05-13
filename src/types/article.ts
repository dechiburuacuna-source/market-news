export type Category   = 'Mining' | 'Energy' | 'Data Centers'
export type Location   = 'Chile' | 'Italy' | 'Poland' | 'Mexico' | 'Spain' | 'Global'
export type SourceType = 'Institutional' | 'Press' | 'Conglomerado' | 'Market Advisor'

export interface Article {
  id: string
  title: string
  title_es: string
  source: string
  source_type: SourceType
  location: Location
  category: Category
  date: string           // YYYY-MM-DD
  url: string
  content?: string
  extended_description: string
  extended_description_es: string
  short_summary: string[]
  short_summary_es: string[]
  created_at: string
  processed: boolean
}

export interface ArticleFilters {
  category?: Category | 'all'
  locations?: Location[]
  sourceType?: SourceType | null
  source?: string | null
  lang?: 'en' | 'es'
}

export interface IngestResult {
  fetched: number
  new_articles: number
  processed: number
  errors: string[]
  duration_ms: number
}

export interface Metrics {
  byCategory:   Record<Category, number>
  byLocation:   Record<Location, number>
  bySourceType: Record<SourceType, number>
  bySource:     Record<string, number>
}
