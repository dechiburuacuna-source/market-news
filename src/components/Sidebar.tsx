'use client'
import type { Article, Category, Location, SourceType } from '@/types/article'
import { ALL_LOCATIONS, ALL_SOURCE_TYPES } from '@/lib/sources'
import type { SortOrder } from './Dashboard'

interface SidebarProps {
  // Each set has all OTHER filters applied. Counts derived from these match
  // exactly what the feed will show when the user clicks the option.
  forCategory: Article[]
  forLocation: Article[]
  forSrcType:  Article[]
  forSource:   Article[]
  cat: Category | 'all'; locations: Location[]
  srcType: SourceType | null; source: string | null
  lang: 'en' | 'es'; sortOrder: SortOrder
  onCat: (c: Category | 'all') => void
  onLocation: (l: Location) => void
  onSrcType: (t: SourceType) => void
  onSrc: (s: string) => void
  onSortChange: (s: SortOrder) => void
}

const TX: Record<string, Record<string, string>> = {
  en: {
    nav: 'Sections', home: 'All News', mining: 'Mining', energy: 'Energy', dc: 'Data Centers',
    filters: 'Filter By', loc: 'Location', srcType: 'Source Type', src: 'Source',
    institutional: 'Institutional', press: 'Press',
    conglomerado: 'Trade Assoc.', marketAdvisor: 'Market Advisor',
    clearAll: 'Clear all',
    sortBy: 'Order By',
    newestFirst: '↓ Newest first', oldestFirst: '↑ Oldest first',
  },
  es: {
    nav: 'Secciones', home: 'Todas las Noticias', mining: 'Minería', energy: 'Energía', dc: 'Data Centers',
    filters: 'Filtrar Por', loc: 'Ubicación', srcType: 'Tipo de Fuente', src: 'Fuente',
    institutional: 'Institucional', press: 'Prensa',
    conglomerado: 'Conglomerado', marketAdvisor: 'Asesor Mercado',
    clearAll: 'Limpiar todo',
    sortBy: 'Ordenar Por',
    newestFirst: '↓ Más recientes', oldestFirst: '↑ Más antiguos',
  },
}

const SRC_TYPE_COLORS: Record<SourceType, { text: string; bg: string; border: string }> = {
  Institutional:   { text: '#3D1A6E', bg: 'rgba(61,26,110,0.08)',  border: 'rgba(61,26,110,0.25)' },
  Press:           { text: '#6E3D1A', bg: 'rgba(110,61,26,0.08)', border: 'rgba(110,61,26,0.25)' },
  Conglomerado:    { text: '#1A5C3A', bg: 'rgba(26,92,58,0.08)',   border: 'rgba(26,92,58,0.25)' },
  'Market Advisor':{ text: '#1A3A5C', bg: 'rgba(26,58,92,0.08)',   border: 'rgba(26,58,92,0.25)' },
}

const CAT_COLORS: Record<string, string> = {
  all: 'var(--ink-black)', Mining: 'var(--mining-ink)',
  Energy: 'var(--energy-ink)', 'Data Centers': 'var(--dc-ink)',
}

function countBy<T extends string>(arr: Article[], key: (a: Article) => T): Record<T, number> {
  const out: Partial<Record<T, number>> = {}
  for (const a of arr) {
    const k = key(a)
    out[k] = (out[k] || 0) + 1
  }
  return out as Record<T, number>
}

export default function Sidebar({
  forCategory, forLocation, forSrcType, forSource,
  cat, locations, srcType, source, lang, sortOrder,
  onCat, onLocation, onSrcType, onSrc, onSortChange,
}: SidebarProps) {
  const t = TX[lang]

  // Counts per dimension — each respects all OTHER active filters
  const catCounts = {
    all: forCategory.length,
    Mining:         forCategory.filter(a => a.category === 'Mining').length,
    Energy:         forCategory.filter(a => a.category === 'Energy').length,
    'Data Centers': forCategory.filter(a => a.category === 'Data Centers').length,
  }
  const locCounts: Record<string, number> = countBy(forLocation, a => a.location)
  const stCounts:  Record<string, number> = countBy(forSrcType,  a => a.source_type)
  const srcCounts: Record<string, number> = countBy(forSource,   a => a.source)

  const allSources = Object.keys(srcCounts).sort()
  const hasFilters = locations.length > 0 || srcType !== null || source !== null

  const srcTypeLabel = (st: SourceType) => {
    if (st === 'Institutional')  return t.institutional
    if (st === 'Press')          return t.press
    if (st === 'Conglomerado')   return t.conglomerado
    return t.marketAdvisor
  }

  const clearAll = () => {
    locations.forEach(l => onLocation(l))
    if (srcType) onSrcType(srcType)
    if (source)  onSrc(source)
  }

  const navItems = [
    { key: 'all',          label: t.home },
    { key: 'Mining',       label: t.mining },
    { key: 'Energy',       label: t.energy },
    { key: 'Data Centers', label: t.dc },
  ] as const

  return (
    <aside className="flex flex-col overflow-y-auto"
      style={{ background: 'var(--paper-2)', borderRight: '1px solid var(--rule)', width: '260px', flexShrink: 0 }}>

      {/* ── Navigation ────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '2px solid var(--ink-black)' }}>
        <div className="font-sans text-xxs font-semibold tracking-[0.18em] uppercase mb-3"
          style={{ color: 'var(--ink-muted)' }}>{t.nav}</div>
        {navItems.map(({ key, label }) => {
          const active = cat === key
          const cc = CAT_COLORS[key]
          const count = catCounts[key as keyof typeof catCounts] ?? 0
          return (
            <button key={key} onClick={() => onCat(key as Category | 'all')}
              className="w-full flex items-center justify-between py-1.5 text-left transition-all"
              style={{ borderLeft: `3px solid ${active ? cc : 'transparent'}`, paddingLeft: '8px', background: active ? 'var(--paper-3)' : 'transparent' }}>
              <span className="font-display text-sm font-semibold" style={{ color: active ? cc : 'var(--ink-dark)' }}>{label}</span>
              <span className="font-mono text-xxs px-1 rounded"
                style={{ color: count === 0 ? 'var(--ink-faint)' : 'var(--ink-muted)', background: 'var(--paper-3)', border: '1px solid var(--rule)' }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Sort Order ────────────────────────────────────── */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--rule)' }}>
        <div className="font-sans text-xxs font-medium tracking-wide uppercase mb-2"
          style={{ color: 'var(--ink-muted)' }}>{t.sortBy}</div>
        <div className="flex rounded overflow-hidden" style={{ border: '1px solid var(--rule)' }}>
          {(['desc', 'asc'] as SortOrder[]).map(s => {
            const label = s === 'desc' ? t.newestFirst : t.oldestFirst
            const active = sortOrder === s
            return (
              <button key={s} onClick={() => onSortChange(s)}
                className="flex-1 font-mono text-xxs py-1.5 px-1 text-center transition-all leading-tight"
                style={{
                  background:  active ? 'var(--ink-black)' : 'transparent',
                  color:       active ? 'white' : 'var(--ink-muted)',
                  borderRight: s === 'desc' ? '1px solid var(--rule)' : 'none',
                  fontWeight:  active ? '600' : '400',
                }}>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-3 flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className="font-sans text-xxs font-semibold tracking-[0.18em] uppercase"
            style={{ color: 'var(--ink-muted)' }}>{t.filters}</div>
          {hasFilters && (
            <button onClick={clearAll} className="font-mono text-xxs underline"
              style={{ color: 'var(--accent-red)' }}>{t.clearAll}</button>
          )}
        </div>

        {/* Location */}
        <div className="mb-4">
          <div className="font-sans text-xxs font-medium tracking-wide uppercase mb-2 pb-1"
            style={{ color: 'var(--ink-muted)', borderBottom: '1px solid var(--rule)' }}>{t.loc}</div>
          {ALL_LOCATIONS.map(loc => {
            const n = locCounts[loc] ?? 0
            const active = locations.includes(loc as Location)
            return (
              <label key={loc} className="flex items-center justify-between gap-2 py-0.5 cursor-pointer">
                <span className="flex items-center gap-2 min-w-0">
                  <input type="checkbox" checked={active}
                    onChange={() => onLocation(loc as Location)}
                    className="w-3 h-3 cursor-pointer accent-red-700 flex-shrink-0" />
                  <span className="font-body text-xs truncate"
                    style={{ color: active ? 'var(--ink-black)' : (n === 0 ? 'var(--ink-faint)' : 'var(--ink-muted)') }}>{loc}</span>
                </span>
                <span className="font-mono text-xxs flex-shrink-0"
                  style={{ color: n === 0 ? 'var(--ink-faint)' : 'var(--ink-muted)' }}>{n}</span>
              </label>
            )
          })}
        </div>

        {/* Source Type */}
        <div className="mb-4">
          <div className="font-sans text-xxs font-medium tracking-wide uppercase mb-2 pb-1"
            style={{ color: 'var(--ink-muted)', borderBottom: '1px solid var(--rule)' }}>{t.srcType}</div>
          {(ALL_SOURCE_TYPES as readonly SourceType[]).map(st => {
            const col = SRC_TYPE_COLORS[st]
            const active = srcType === st
            const n = stCounts[st] ?? 0
            return (
              <label key={st} className="flex items-center justify-between gap-2 py-1 cursor-pointer">
                <span className="flex items-center gap-2 min-w-0">
                  <input type="checkbox" checked={active} onChange={() => onSrcType(st)}
                    className="w-3 h-3 cursor-pointer accent-red-700 flex-shrink-0" />
                  <span className="font-mono text-xxs px-1.5 py-0.5 rounded-sm truncate"
                    style={{
                      color:      active ? col.text : (n === 0 ? 'var(--ink-faint)' : 'var(--ink-muted)'),
                      background: active ? col.bg   : 'transparent',
                      border:     `1px solid ${active ? col.border : 'transparent'}`,
                      transition: 'all 0.1s',
                    }}>
                    {srcTypeLabel(st)}
                  </span>
                </span>
                <span className="font-mono text-xxs flex-shrink-0"
                  style={{ color: n === 0 ? 'var(--ink-faint)' : 'var(--ink-muted)' }}>{n}</span>
              </label>
            )
          })}
        </div>

        {/* Source — full list with per-source counts */}
        <div>
          <div className="flex items-center justify-between mb-2 pb-1"
            style={{ borderBottom: '1px solid var(--rule)' }}>
            <span className="font-sans text-xxs font-medium tracking-wide uppercase"
              style={{ color: 'var(--ink-muted)' }}>{t.src}</span>
            <span className="font-mono text-xxs" style={{ color: 'var(--ink-faint)' }}>
              {allSources.length}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            {allSources.map(s => {
              const n = srcCounts[s] ?? 0
              const active = source === s
              return (
                <label key={s} className="flex items-center justify-between gap-2 py-0.5 cursor-pointer">
                  <span className="flex items-center gap-2 min-w-0">
                    <input type="checkbox" checked={active} onChange={() => onSrc(s)}
                      className="w-3 h-3 cursor-pointer accent-red-700 flex-shrink-0" />
                    <span className="font-body text-xxs leading-snug"
                      style={{ color: active ? 'var(--ink-black)' : (n === 0 ? 'var(--ink-faint)' : 'var(--ink-muted)') }}
                      title={s}>{s}</span>
                  </span>
                  <span className="font-mono text-xxs flex-shrink-0"
                    style={{ color: n === 0 ? 'var(--ink-faint)' : 'var(--ink-muted)' }}>{n}</span>
                </label>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--rule)' }}>
        <p className="font-mono text-xxs leading-loose" style={{ color: 'var(--ink-faint)' }}>
          {lang === 'en' ? 'Manual refresh · AI-summarized' : 'Actualización manual · Resumido por IA'}
        </p>
      </div>
    </aside>
  )
}
