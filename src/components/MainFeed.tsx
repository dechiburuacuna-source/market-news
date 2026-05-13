'use client'
import type { Article, Category } from '@/types/article'
import type { SortOrder } from './Dashboard'
import ArticleCard from './ArticleCard'

interface MainFeedProps {
  articles: Article[]; selected: Article | null
  cat: Category | 'all'; lang: 'en' | 'es'
  sortOrder: SortOrder; onSelect: (a: Article) => void
}

const TX: Record<string, Record<string, string>> = {
  en: {
    all: 'Intelligence Feed', mining: 'Mining', energy: 'Energy', dc: 'Data Centers',
    articles: 'articles', empty: 'No articles match the current filters.',
    newest: '↓ Newest first', oldest: '↑ Oldest first',
  },
  es: {
    all: 'Feed de Inteligencia', mining: 'Minería', energy: 'Energía', dc: 'Data Centers',
    articles: 'artículos', empty: 'No hay artículos con los filtros actuales.',
    newest: '↓ Más recientes', oldest: '↑ Más antiguos',
  },
}

const CAT_COLORS: Record<string, string> = {
  all: 'var(--ink-black)', Mining: 'var(--mining-ink)',
  Energy: 'var(--energy-ink)', 'Data Centers': 'var(--dc-ink)',
}

export default function MainFeed({ articles, selected, cat, lang, sortOrder, onSelect }: MainFeedProps) {
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
            {/* Sort label indicator */}
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
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="font-display text-4xl mb-3" style={{ color: 'var(--rule)' }}>§</div>
            <p className="font-body text-sm" style={{ color: 'var(--ink-muted)' }}>{t.empty}</p>
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
