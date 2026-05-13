'use client'
import type { Article } from '@/types/article'

interface ArticleCardProps {
  article: Article; selected: boolean; lang: 'en' | 'es'; onClick: () => void; index: number
}

const CAT_COLORS: Record<string, string> = {
  Mining: 'var(--mining-ink)', Energy: 'var(--energy-ink)', 'Data Centers': 'var(--dc-ink)',
}
const CAT_BG: Record<string, string> = {
  Mining: 'rgba(125,90,0,0.07)', Energy: 'rgba(26,92,58,0.07)', 'Data Centers': 'rgba(26,58,92,0.07)',
}
const CAT_LABELS: Record<string, Record<string, string>> = {
  en: { Mining: 'Mining', Energy: 'Energy', 'Data Centers': 'Data Centers' },
  es: { Mining: 'Minería', Energy: 'Energía', 'Data Centers': 'Data Centers' },
}

// Source type badge styles
const ST_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  Institutional:   { text: '#3D1A6E', bg: 'rgba(61,26,110,0.07)',  border: 'rgba(61,26,110,0.22)' },
  Press:           { text: '#6E3D1A', bg: 'rgba(110,61,26,0.07)', border: 'rgba(110,61,26,0.22)' },
  Conglomerado:    { text: '#1A5C3A', bg: 'rgba(26,92,58,0.07)',   border: 'rgba(26,92,58,0.22)' },
  'Market Advisor':{ text: '#1A3A5C', bg: 'rgba(26,58,92,0.07)',   border: 'rgba(26,58,92,0.22)' },
}
const ST_LABELS: Record<string, Record<string, string>> = {
  en: { Institutional: 'Inst.', Press: 'Press', Conglomerado: 'Assoc.', 'Market Advisor': 'Advisor' },
  es: { Institutional: 'Inst.', Press: 'Prensa', Conglomerado: 'Agremiado', 'Market Advisor': 'Asesor' },
}

function fmtDate(ds: string, lang: 'en' | 'es'): string {
  try {
    return new Date(ds + 'T12:00:00').toLocaleDateString(
      lang === 'es' ? 'es-CL' : 'en-US',
      { day: 'numeric', month: 'short', year: 'numeric' }
    )
  } catch { return ds }
}

export default function ArticleCard({ article, selected, lang, onClick, index }: ArticleCardProps) {
  const title    = (lang === 'es' && article.title_es) ? article.title_es : article.title
  const desc     = (lang === 'es' && article.extended_description_es) ? article.extended_description_es : article.extended_description
  const cc       = CAT_COLORS[article.category] || 'var(--ink-dark)'
  const cbg      = CAT_BG[article.category]     || 'transparent'
  const catLabel = CAT_LABELS[lang]?.[article.category] ?? article.category
  const stStyle  = ST_COLORS[article.source_type] ?? ST_COLORS['Press']
  const stLabel  = ST_LABELS[lang]?.[article.source_type] ?? article.source_type

  return (
    <article
      onClick={onClick}
      style={{
        animationDelay:  `${index * 30}ms`,
        borderLeft:      `3px solid ${selected ? 'var(--accent-red)' : cc}`,
        background:       selected ? 'var(--paper-2)' : 'var(--paper)',
        cursor:           'pointer',
        transition:       'background 0.12s ease',
        borderBottom:    '1px solid var(--rule)',
      }}
      className="animate-in pl-3 pr-3 py-3 hover:bg-paper-2"
    >
      {/* Meta row */}
      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mb-1.5">
        <span className="font-sans text-xxs font-semibold tracking-[0.14em] uppercase px-1.5 py-0.5 rounded-sm"
          style={{ color: cc, background: cbg }}>
          {catLabel}
        </span>
        <span style={{ color: 'var(--rule)' }}>·</span>
        <span className="font-sans text-xxs font-medium" style={{ color: 'var(--ink-muted)' }}>
          {article.source}
        </span>
        <span style={{ color: 'var(--rule)' }}>·</span>
        <span className="font-mono text-xxs" style={{ color: 'var(--ink-faint)' }}>
          {fmtDate(article.date, lang)}
        </span>
        {/* Source type badge */}
        <span className="ml-auto font-mono text-xxs px-1.5 py-0.5 rounded-sm"
          style={{ color: stStyle.text, background: stStyle.bg, border: `1px solid ${stStyle.border}` }}>
          {stLabel}
        </span>
      </div>

      {/* Headline */}
      <h3 className="font-display font-bold leading-snug mb-1.5 line-clamp-3 md:line-clamp-2"
        style={{ color: 'var(--ink-black)', fontSize: 'clamp(0.85rem, 1.5vw, 1rem)' }}>
        {title}
      </h3>

      {/* Description — desktop */}
      {desc && (
        <p className="font-body text-xs leading-relaxed line-clamp-3 hidden md:block"
          style={{ color: 'var(--ink-body)' }}>
          {desc}
        </p>
      )}

      {/* Location + selected indicator */}
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-xxs px-1.5 py-0.5 rounded-sm"
          style={{ color: 'var(--ink-muted)', background: 'var(--paper-3)', border: '1px solid var(--rule)' }}>
          {article.location}
        </span>
        {selected && (
          <span className="font-sans text-xxs" style={{ color: 'var(--accent-red)' }}>
            Selected ◆
          </span>
        )}
      </div>
    </article>
  )
}
