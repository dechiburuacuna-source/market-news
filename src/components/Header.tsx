'use client'
import type { SortOrder } from './Dashboard'

const TX: Record<string, Record<string, string>> = {
  en: {
    updated: 'Updated', fetch: 'Search News', fetching: 'Searching…',
    mining: 'Mining', energy: 'Energy', dc: 'Data Centers',
    newestFirst: 'Newest first', oldestFirst: 'Oldest first',
    tagline: 'Trusted sources · AI-summarized · Gemini Search',
    articles: 'articles',
  },
  es: {
    updated: 'Actualizado', fetch: 'Buscar Noticias', fetching: 'Buscando…',
    mining: 'Minería', energy: 'Energía', dc: 'Data Centers',
    newestFirst: 'Más recientes', oldestFirst: 'Más antiguos',
    tagline: 'Fuentes confiables · Resumido por IA · Búsqueda Gemini',
    articles: 'artículos',
  },
}

interface HeaderProps {
  lang: 'en' | 'es'; onLangChange: (l: 'en' | 'es') => void
  onFetchNews: () => void; ingesting: boolean; ingestMsg: string | null
  lastUpdated: string | null
  sortOrder: SortOrder; onSortChange: (s: SortOrder) => void
  articleCount: number
}

export default function Header({
  lang, onLangChange, onFetchNews, ingesting, ingestMsg,
  lastUpdated, sortOrder, onSortChange, articleCount,
}: HeaderProps) {
  const t = TX[lang]
  const today = new Date().toLocaleDateString(lang === 'es' ? 'es-CL' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const sectionLabel = lang === 'en'
    ? 'Mining · Energy · Data Centers'
    : 'Minería · Energía · Data Centers'

  return (
    <header style={{ background: 'var(--paper)', borderBottom: '1px solid var(--rule)', flexShrink: 0 }}>

      {/* ── Top utility bar ─────────────────────────────── */}
      <div style={{ background: 'var(--ink-black)', borderBottom: '1px solid var(--rule)' }}
        className="px-4 md:px-6 py-1 flex items-center justify-between gap-3">

        {/* Left: status / ingest message */}
        <span className="font-mono text-xxs tracking-widest uppercase flex items-center gap-1.5 flex-shrink-0 min-w-0"
          style={{ color: 'var(--rule)' }}>
          {ingesting ? (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0"
              style={{ animation: 'blink 0.6s infinite' }} />
          ) : (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"
              style={{ boxShadow: '0 0 4px #4ade80', animation: 'blink 2s infinite' }} />
          )}
          <span className="truncate">
            {ingestMsg
              ? ingestMsg
              : lastUpdated
                ? `${t.updated} ${lastUpdated}`
                : 'Live'}
          </span>
          {!ingestMsg && (
            <span className="hidden md:inline flex-shrink-0" style={{ color: 'var(--rule-dark)' }}>
              &nbsp;·&nbsp;{articleCount} {t.articles}
            </span>
          )}
        </span>

        {/* Right: sort + fetch news + language */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* Sort order toggle */}
          <div className="hidden md:flex items-center rounded overflow-hidden"
            style={{ border: '1px solid var(--rule-dark)' }}>
            {(['desc', 'asc'] as SortOrder[]).map(s => (
              <button key={s} onClick={() => onSortChange(s)}
                className="font-mono text-xxs px-2.5 py-0.5 transition-all flex items-center gap-1"
                style={{
                  color:      sortOrder === s ? 'var(--ink-black)' : 'var(--rule)',
                  background: sortOrder === s ? 'white' : 'transparent',
                  fontWeight: sortOrder === s ? '600' : '400',
                }}>
                <span>{s === 'desc' ? '↓' : '↑'}</span>
                <span>{s === 'desc' ? t.newestFirst : t.oldestFirst}</span>
              </button>
            ))}
          </div>

          <div className="h-3 w-px hidden md:block" style={{ background: 'var(--rule-dark)' }} />

          {/* Fetch news button */}
          <button
            onClick={onFetchNews}
            disabled={ingesting}
            className="font-mono text-xxs tracking-widest uppercase transition-colors disabled:opacity-40 px-2 py-0.5 rounded"
            style={{
              color: ingesting ? 'var(--rule-dark)' : 'white',
              background: ingesting ? 'transparent' : 'var(--accent-red)',
              border: '1px solid',
              borderColor: ingesting ? 'var(--rule-dark)' : 'var(--accent-red)',
            }}
          >
            {ingesting ? t.fetching : t.fetch}
          </button>

          <div className="h-3 w-px" style={{ background: 'var(--rule-dark)' }} />

          {/* Language toggle */}
          <div className="flex rounded overflow-hidden" style={{ border: '1px solid var(--rule-dark)' }}>
            {(['en', 'es'] as const).map(l => (
              <button key={l} onClick={() => onLangChange(l)}
                className="font-mono text-xxs px-2.5 py-0.5 tracking-widest uppercase transition-all"
                style={{
                  color:      lang === l ? 'var(--ink-black)' : 'var(--rule)',
                  background: lang === l ? 'white' : 'transparent',
                  fontWeight: lang === l ? '600' : '400',
                }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Masthead ─────────────────────────────────────── */}
      <div className="px-4 md:px-6 py-3 md:py-4 text-center"
        style={{ borderBottom: '4px solid var(--ink-black)' }}>
        <div className="flex items-center justify-center gap-4 md:gap-8 mb-1.5">
          <div className="hidden md:block flex-1 h-px" style={{ background: 'var(--rule)' }} />
          <h1 className="font-display font-black tracking-tight leading-none select-none"
            style={{ color: 'var(--ink-black)', fontSize: 'clamp(1.75rem, 4vw, 3.5rem)' }}>
            Industry<span style={{ color: 'var(--accent-red)' }}>·</span>Intelligence
          </h1>
          <div className="hidden md:block flex-1 h-px" style={{ background: 'var(--rule)' }} />
        </div>
        <p className="font-sans text-xxs md:text-xs tracking-[0.18em] uppercase capitalize"
          style={{ color: 'var(--ink-muted)' }}>
          {today}
          <span className="mx-2" style={{ color: 'var(--rule)' }}>·</span>
          {sectionLabel}
        </p>
      </div>

      {/* ── Section nav ──────────────────────────────────── */}
      <div className="hidden md:flex items-center px-4 md:px-6 py-1.5 gap-6 border-b"
        style={{ borderColor: 'var(--rule)' }}>
        {[
          { color: 'var(--mining-ink)', label: t.mining },
          { color: 'var(--energy-ink)', label: t.energy },
          { color: 'var(--dc-ink)',     label: t.dc },
        ].map(s => (
          <span key={s.label} className="font-sans text-xs font-semibold tracking-wide uppercase"
            style={{ color: s.color }}>
            {s.label}
          </span>
        ))}
        <div className="flex-1" />
        <span className="font-mono text-xxs" style={{ color: 'var(--ink-faint)' }}>
          {t.tagline}
        </span>
      </div>
    </header>
  )
}
