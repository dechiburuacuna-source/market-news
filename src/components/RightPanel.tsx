'use client'
import type { Article, Category, Location, SourceType } from '@/types/article'

interface RightPanelProps { selected: Article | null; filtered: Article[]; lang: 'en' | 'es' }

const TX: Record<string, Record<string, string>> = {
  en: {
    panel: 'Summary & Metrics', noSel: 'Select a headline to view AI-generated insights',
    keyIns: 'Key Insights', read: 'Read full article →', published: 'Published',
    aggMet: 'Feed Metrics', byCat: 'By Section', byLoc: 'By Region',
    bySrcType: 'By Source Type', srcBreak: 'Sources',
    inst: 'Institutional', press: 'Press', conglomerado: 'Trade Assoc.', marketAdvisor: 'Mkt Advisor',
    dc: 'Data Centers', mining: 'Mining', energy: 'Energy',
    noUrl: 'URL not available',
  },
  es: {
    panel: 'Resumen y Métricas', noSel: 'Selecciona un titular para ver el análisis de IA',
    keyIns: 'Puntos Clave', read: 'Leer artículo completo →', published: 'Publicado',
    aggMet: 'Métricas del Feed', byCat: 'Por Sección', byLoc: 'Por Región',
    bySrcType: 'Por Tipo de Fuente', srcBreak: 'Fuentes',
    inst: 'Institucional', press: 'Prensa', conglomerado: 'Conglomerado', marketAdvisor: 'Asesor',
    dc: 'Data Centers', mining: 'Minería', energy: 'Energía',
    noUrl: 'URL no disponible',
  },
}

const LOCATIONS: Location[] = ['Chile','Italy','Poland','Mexico','Spain','Global']
const CATEGORIES: Category[] = ['Mining','Energy','Data Centers']
const LOC_COLORS = ['#7D5A00','#1A5C3A','#1A3A5C','#922B21','#3D1A6E','#2C2C2C']
const CAT_COLORS: Record<Category, string> = {
  Mining: 'var(--mining-ink)', Energy: 'var(--energy-ink)', 'Data Centers': 'var(--dc-ink)',
}

function Bar({ label, val, max, color }: { label: string; val: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((val / max) * 100) : 0
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="font-mono text-xxs w-[72px] flex-shrink-0 truncate" style={{ color: 'var(--ink-muted)' }}>{label}</span>
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--paper-3)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="font-mono text-xxs w-4 text-right" style={{ color: 'var(--ink-faint)' }}>{val}</span>
    </div>
  )
}

function fmtDate(ds: string, lang: 'en' | 'es'): string {
  try {
    return new Date(ds + 'T12:00:00').toLocaleDateString(
      lang === 'es' ? 'es-CL' : 'en-US',
      { day: 'numeric', month: 'long', year: 'numeric' }
    )
  } catch { return ds }
}

function isValidUrl(url: string | undefined): boolean {
  if (!url || url === '#' || url === '') return false
  try { new URL(url); return true } catch { return false }
}

export default function RightPanel({ selected, filtered, lang }: RightPanelProps) {
  const t = TX[lang]

  // Metrics
  const catC = Object.fromEntries(CATEGORIES.map(c => [c, 0])) as Record<Category, number>
  const locC = Object.fromEntries(LOCATIONS.map(l => [l, 0])) as Record<Location, number>
  const stC: Record<SourceType, number> = { Institutional: 0, Press: 0, Conglomerado: 0, 'Market Advisor': 0 }
  const srcC: Record<string, number> = {}
  filtered.forEach(a => {
    if (catC[a.category] !== undefined) catC[a.category]++
    if (locC[a.location] !== undefined) locC[a.location]++
    if (stC[a.source_type] !== undefined) stC[a.source_type]++
    srcC[a.source] = (srcC[a.source] || 0) + 1
  })
  const mxCat = Math.max(...Object.values(catC), 1)
  const mxLoc = Math.max(...Object.values(locC), 1)
  const mxSt  = Math.max(...Object.values(stC), 1)
  const sortedSrc = Object.entries(srcC).sort(([, a], [, b]) => b - a)

  const bullets = selected
    ? ((lang === 'es' && selected.short_summary_es?.length)
        ? selected.short_summary_es
        : selected.short_summary)
    : []
  const selTitle = selected
    ? ((lang === 'es' && selected.title_es) ? selected.title_es : selected.title)
    : ''
  const hasUrl = selected ? isValidUrl(selected.url) : false

  // Category labels per language
  const catLabel = (cat: Category) =>
    lang === 'es'
      ? { Mining: 'Minería', Energy: 'Energía', 'Data Centers': 'Data Centers' }[cat]
      : cat

  return (
    <aside
      style={{ width: '268px', flexShrink: 0, background: 'var(--paper-2)', borderLeft: '1px solid var(--rule)' }}
      className="flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: '3px solid var(--ink-black)', background: 'var(--paper-3)' }}>
        <span className="font-sans text-xxs font-semibold tracking-[0.18em] uppercase"
          style={{ color: 'var(--ink-muted)' }}>
          {t.panel}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── Article Summary ───────────────────────────── */}
        {!selected ? (
          <div className="px-4 py-8 border-b text-center" style={{ borderColor: 'var(--rule)' }}>
            <div className="font-display text-4xl mb-3" style={{ color: 'var(--rule)' }}>¶</div>
            <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
              {t.noSel}
            </p>
          </div>
        ) : (
          <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--rule)' }}>
            {/* Section label */}
            <div className="font-sans text-xxs font-semibold tracking-[0.18em] uppercase mb-3 pb-1"
              style={{ color: 'var(--ink-muted)', borderBottom: '1px solid var(--rule)' }}>
              {t.keyIns}
            </div>

            {/* Article title */}
            <h4 className="font-display font-bold leading-snug mb-1"
              style={{ color: 'var(--ink-black)', fontSize: '0.88rem' }}>
              {selTitle}
            </h4>

            {/* Meta: source · date */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              <span className="font-sans text-xxs font-medium" style={{ color: 'var(--ink-muted)' }}>
                {selected.source}
              </span>
              <span style={{ color: 'var(--rule)' }}>·</span>
              <span className="font-mono text-xxs" style={{ color: 'var(--ink-faint)' }}>
                {fmtDate(selected.date, lang)}
              </span>
              <span style={{ color: 'var(--rule)' }}>·</span>
              <span className="font-mono text-xxs" style={{ color: 'var(--ink-faint)' }}>
                {selected.location}
              </span>
            </div>

            {/* Bullets */}
            {bullets.length > 0 && (
              <ul className="space-y-2 mb-4">
                {bullets.map((b, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="flex-shrink-0 mt-1 font-bold" style={{ color: 'var(--accent-red)', fontSize: '0.55rem' }}>◆</span>
                    <span className="font-body text-xs leading-snug" style={{ color: 'var(--ink-body)' }}>{b}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Read full article link */}
            {hasUrl ? (
              <a
                href={selected.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold px-3 py-1.5 rounded-sm transition-colors"
                style={{
                  color: 'white',
                  background: 'var(--accent-red)',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-dark)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent-red)')}
              >
                {t.read}
              </a>
            ) : (
              <span className="font-mono text-xxs italic" style={{ color: 'var(--ink-faint)' }}>
                {t.noUrl}
              </span>
            )}
          </div>
        )}

        {/* ── Aggregated Metrics ─────────────────────────── */}
        {filtered.length > 0 && (
          <div className="px-4 py-4">
            <div className="font-sans text-xxs font-semibold tracking-[0.18em] uppercase mb-3 pb-1"
              style={{ color: 'var(--ink-muted)', borderBottom: '2px solid var(--ink-black)' }}>
              {t.aggMet}
            </div>

            {/* By Category */}
            <div className="mb-3">
              <div className="font-mono text-xxs uppercase tracking-wide mb-2" style={{ color: 'var(--ink-faint)' }}>
                {t.byCat}
              </div>
              {CATEGORIES.map(c => (
                <Bar key={c} label={catLabel(c) ?? c} val={catC[c]} max={mxCat} color={CAT_COLORS[c]} />
              ))}
            </div>

            {/* By Location */}
            <div className="mb-3 pt-2" style={{ borderTop: '1px solid var(--rule)' }}>
              <div className="font-mono text-xxs uppercase tracking-wide mb-2" style={{ color: 'var(--ink-faint)' }}>
                {t.byLoc}
              </div>
              {LOCATIONS.map((l, i) => (
                <Bar key={l} label={l} val={locC[l]} max={mxLoc} color={LOC_COLORS[i]} />
              ))}
            </div>

            {/* By Source Type */}
            <div className="mb-3 pt-2" style={{ borderTop: '1px solid var(--rule)' }}>
              <div className="font-mono text-xxs uppercase tracking-wide mb-2" style={{ color: 'var(--ink-faint)' }}>
                {t.bySrcType}
              </div>
              <Bar label={t.inst} val={stC.Institutional} max={mxSt} color="var(--inst-ink)" />
              <Bar label={t.press} val={stC.Press} max={mxSt} color="var(--press-ink)" />
            </div>

            {/* Source Breakdown */}
            <div className="pt-2" style={{ borderTop: '2px solid var(--ink-black)' }}>
              <div className="font-mono text-xxs uppercase tracking-wide mb-2" style={{ color: 'var(--ink-faint)' }}>
                {t.srcBreak}
              </div>
              {sortedSrc.map(([src, cnt]) => (
                <div key={src} className="flex justify-between items-center py-1"
                  style={{ borderBottom: '1px solid var(--rule)' }}>
                  <span className="font-body text-xxs truncate mr-2" style={{ color: 'var(--ink-body)' }}>{src}</span>
                  <span className="font-mono text-xxs px-1 rounded flex-shrink-0"
                    style={{ color: 'var(--ink-faint)', background: 'var(--paper-3)' }}>{cnt}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
