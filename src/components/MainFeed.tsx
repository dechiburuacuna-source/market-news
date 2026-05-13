'use client'
import type { Article, Category } from '@/types/article'
import type { SortOrder } from './Dashboard'
import ArticleCard from './ArticleCard'

interface MainFeedProps {
  articles: Article[]; selected: Article | null
  cat: Category | 'all'; lang: 'en' | 'es'
  sortOrder: SortOrder; ingesting: boolean
  onSelect: (a: Article) => void
  onFetchNews: () => void
}

const TX: Record<string, Record<string, string>> = {
  en: {
    all: 'Intelligence Feed', mining: 'Mining', energy: 'Energy', dc: 'Data Centers',
    articles: 'articles',
    emptyFiltered: 'No articles match the current filters.',
    emptyNoNews: 'No articles yet.',
    emptyHint: 'Click "Search News" to fetch the latest industry news via Gemini.',
    fetchBtn: 'Search News',
    searching: 'Searching…',
    newest: '↓ Newest first', oldest: '↑ Oldest first',
  },
  es: {
    all: 'Feed de Inteligencia', mining: 'Minería', energy: 'Energía', dc: 'Data Centers',
    articles: 'artículos',
    emptyFiltered: 'No hay artículos con los filtros actuales.',
    emptyNoNews: 'Aún no hay noticias.',
    emptyHint: 'Presiona "Buscar Noticias" para obtener las últimas noticias del sector vía Gemini.',
    fetchBtn: 'Buscar Noticias',
    searching: 'Buscando…',
    newest: '↓ Más recientes', oldest: '↑ Más antiguos',
  },
}

const CAT_COLORS: Record<string, string> = {
  all: 'var(--ink-black)', Mining: 'var(--mining-ink)',
  Energy: 'var(--energy-ink)', 'Data Centers': 'var(--dc-ink)',
}

export default function MainFeed({
  articles, selected, cat, lang, sortOrder, ingesting, onSelect, onFetchNews,
}: MainFeedProps) {
  const t = TX[lang]
  const title = cat === 'all' ? t.all : cat === 'Mining' ? t.mining : cat === 'Energy' ? t.energy : t.dc
  const cc = CAT_COLORS[cat]
  const sortLabel = sortOrder === 'desc' ? t.newest : t.oldest

  return (
    <main className="flex flex-col overflow-hidden flex-1"
      style={{ background: 'var(--paper)', borderRight: '1px solid var(--rule)' }}>

      {/* Feed header */}
      <div className="px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: `3px solid ${cc}`, background: 'var(--paper-2)' }}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display font-black tracking-tight"
            style={{ color: cc, fontSize: 'clamp(1rem, 2vw, 1.4rem)' }}>
            {title}
          </h2>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xxs hidden md:inline"
              style={{ color: 'var(--ink-faint)' }}>
              {sortLabel}
            </span>
            <span className="font-mono text-xxs" style={{ color: 'var(--ink-faint)' }}>
              {articles.length} {t.articles}
            </span>
          </div>
        </div>
      </div>

      {/* Article list */}
      <div className="flex-1 overflow-y-auto">
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-4">
            <div className="font-display text-4xl mb-1" style={{ color: 'var(--rule)' }}>§</div>
            <p className="font-body text-sm font-semibold" style={{ color: 'var(--ink-dark)' }}>
              {ingesting ? t.searching : t.emptyNoNews}
            </p>
            {!ingesting && (
              <>
                <p className="font-body text-xs max-w-xs" style={{ color: 'var(--ink-muted)' }}>
                  {t.emptyHint}
                </p>
                <button
                  onClick={onFetchNews}
                  className="font-mono text-xs tracking-widest uppercase px-4 py-2 rounded"
                  style={{ background: 'var(--accent-red)', color: 'white' }}
                >
                  {t.fetchBtn}
                </button>
              </>
            )}
          </div>
        ) : (
          articles.map((a, i) => (
            <ArticleCard
              key={a.id} article={a}
              selected={selected?.id === a.id}
              lang={lang} onClick={() => onSelect(a)} index={i}
            />
          ))
        )}
      </div>
    </main>
  )
}
