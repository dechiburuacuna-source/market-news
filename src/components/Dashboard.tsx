'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Article, Category, Location, SourceType } from '@/types/article'
import Header from './Header'
import Sidebar from './Sidebar'
import MainFeed from './MainFeed'
import RightPanel from './RightPanel'
import LoadingScreen from './LoadingScreen'

export type SortOrder = 'desc' | 'asc'

const TX: Record<string, Record<string, string>> = {
  en: {
    loading: 'Loading intelligence feed', connecting: 'Connecting trusted sources',
    composing: 'Composing front page', filters: '☰ Filters', close: '✕ Close',
    all: 'All', mining: 'Mining', energy: 'Energy', dc: 'DC',
    keyIns: 'Key Insights', read: 'Read full article →',
  },
  es: {
    loading: 'Cargando feed de inteligencia', connecting: 'Conectando fuentes confiables',
    composing: 'Componiendo portada', filters: '☰ Filtros', close: '✕ Cerrar',
    all: 'Todas', mining: 'Minería', energy: 'Energía', dc: 'DC',
    keyIns: 'Puntos Clave', read: 'Leer artículo →',
  },
}

export default function Dashboard() {
  const [articles,    setArticles]    = useState<Article[]>([])
  const [loading,     setLoading]     = useState(true)
  const [loadMsg,     setLoadMsg]     = useState('Loading intelligence feed')
  const [loadPct,     setLoadPct]     = useState(10)
  const [ingesting,   setIngesting]   = useState(false)
  const [ingestMsg,   setIngestMsg]   = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [selected,    setSelected]    = useState<Article | null>(null)
  const [lang,        setLang]        = useState<'en' | 'es'>('en')
  const [cat,         setCat]         = useState<Category | 'all'>('all')
  const [locations,   setLocations]   = useState<Location[]>([])
  const [srcType,     setSrcType]     = useState<SourceType | null>(null)
  const [source,      setSource]      = useState<string | null>(null)
  const [sortOrder,   setSortOrder]   = useState<SortOrder>('desc')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const fetchArticles = useCallback(async () => {
    const params = new URLSearchParams()
    if (cat !== 'all') params.set('category', cat)
    locations.forEach(l => params.append('location', l))
    if (srcType) params.set('sourceType', srcType)
    if (source)  params.set('source', source)
    const res  = await fetch(`/api/articles?${params}`)
    const data = await res.json()
    return (data.articles || []) as Article[]
  }, [cat, locations, srcType, source])

  const sortedArticles = [...articles].sort((a, b) => {
    const da = new Date(a.date).getTime()
    const db = new Date(b.date).getTime()
    return sortOrder === 'desc' ? db - da : da - db
  })

  // Initial load — just fetch what's in storage (no ingest on page load)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadMsg(TX[lang].loading)
    setLoadPct(20)
    const timer = setTimeout(async () => {
      setLoadMsg(TX[lang].connecting); setLoadPct(60)
      try {
        const arts = await fetchArticles()
        if (!cancelled) {
          setLoadPct(90); setLoadMsg(TX[lang].composing)
          setTimeout(() => {
            if (!cancelled) {
              setArticles(arts)
              setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
              setLoading(false)
            }
          }, 300)
        }
      } catch { if (!cancelled) setLoading(false) }
    }, 500)
    return () => { cancelled = true; clearTimeout(timer) }
  }, []) // eslint-disable-line

  useEffect(() => {
    if (loading) return
    fetchArticles().then(arts => { setArticles(arts); setSelected(null) })
  }, [cat, locations, srcType, source]) // eslint-disable-line

  // Trigger Gemini search + re-fetch results
  const handleFetchNews = async () => {
    setIngesting(true)
    setIngestMsg(lang === 'es' ? 'Buscando noticias con Gemini…' : 'Searching news with Gemini…')
    try {
      const res = await fetch('/api/ingest?fullRefresh=true', { method: 'POST' })
      const data = await res.json()
      const count = data.processed ?? 0
      setIngestMsg(
        lang === 'es'
          ? `Listo — ${count} artículos nuevos encontrados`
          : `Done — ${count} new articles found`
      )
      // Reload articles from storage
      const arts = await fetchArticles()
      setArticles(arts)
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      setSelected(null)
    } catch {
      setIngestMsg(lang === 'es' ? 'Error al buscar noticias' : 'Error fetching news')
    } finally {
      setIngesting(false)
      setTimeout(() => setIngestMsg(null), 5000)
    }
  }

  const handleLocation = (l: Location) =>
    setLocations(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])
  const handleSrcType  = (st: SourceType) => setSrcType(prev => prev === st ? null : st)
  const handleSrc      = (s: string)      => setSource(prev => prev === s ? null : s)

  const t = TX[lang]

  if (loading) return <LoadingScreen message={loadMsg} progress={loadPct} />

  const mobileBullets = selected
    ? ((lang === 'es' && selected.short_summary_es?.length) ? selected.short_summary_es : selected.short_summary)
    : []

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--paper)' }}>
      <Header
        lang={lang} onLangChange={setLang}
        onFetchNews={handleFetchNews} ingesting={ingesting} ingestMsg={ingestMsg}
        lastUpdated={lastUpdated}
        sortOrder={sortOrder} onSortChange={setSortOrder}
        articleCount={sortedArticles.length}
      />

      {/* Mobile filter / category bar */}
      <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b"
        style={{ borderColor: 'var(--rule)', background: 'var(--paper-2)', flexShrink: 0 }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="font-sans text-xs font-medium px-2 py-1 rounded border flex-shrink-0"
          style={{ borderColor: 'var(--rule-dark)', color: 'var(--ink-dark)' }}>
          {sidebarOpen ? t.close : t.filters}
        </button>
        <div className="flex gap-1.5 flex-wrap">
          {([['all', t.all], ['Mining', t.mining], ['Energy', t.energy], ['Data Centers', t.dc]] as const).map(([c, label]) => (
            <button key={c} onClick={() => setCat(c as Category | 'all')}
              className="font-sans text-xxs px-2 py-1 rounded border transition-all"
              style={{
                borderColor: cat === c ? 'var(--ink-dark)' : 'var(--rule)',
                background:  cat === c ? 'var(--ink-black)' : 'transparent',
                color:       cat === c ? 'white' : 'var(--ink-muted)',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className={`${sidebarOpen ? 'flex' : 'hidden'} md:flex flex-col absolute md:relative z-20 h-full shadow-xl md:shadow-none`}>
          <Sidebar
            articles={articles} filtered={sortedArticles}
            cat={cat} locations={locations} srcType={srcType} source={source}
            lang={lang} sortOrder={sortOrder}
            onCat={c => { setCat(c); setSidebarOpen(false) }}
            onLocation={handleLocation} onSrcType={handleSrcType} onSrc={handleSrc}
            onSortChange={setSortOrder}
          />
        </div>

        <MainFeed
          articles={sortedArticles} selected={selected}
          cat={cat} lang={lang} sortOrder={sortOrder}
          ingesting={ingesting}
          onSelect={setSelected}
          onFetchNews={handleFetchNews}
        />

        <div className="hidden lg:flex">
          <RightPanel selected={selected} filtered={sortedArticles} lang={lang} />
        </div>
      </div>

      {/* Mobile drawer */}
      {selected && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 max-h-60 overflow-y-auto shadow-2xl"
          style={{ background: 'var(--paper-2)', borderTop: '2px solid var(--ink-black)' }}>
          <div className="flex items-center justify-between px-4 py-2 sticky top-0"
            style={{ background: 'var(--paper-3)', borderBottom: '1px solid var(--rule)' }}>
            <span className="font-sans text-xxs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--ink-muted)' }}>{t.keyIns}</span>
            <button onClick={() => setSelected(null)} className="font-sans text-xs"
              style={{ color: 'var(--ink-muted)' }}>✕</button>
          </div>
          <div className="px-4 py-3">
            <h4 className="font-display font-bold text-sm mb-2" style={{ color: 'var(--ink-black)' }}>
              {(lang === 'es' && selected.title_es) ? selected.title_es : selected.title}
            </h4>
            <ul className="space-y-1.5 mb-3">
              {mobileBullets.map((b, i) => (
                <li key={i} className="flex gap-2">
                  <span className="flex-shrink-0 font-bold mt-1" style={{ color: 'var(--accent-red)', fontSize: '0.55rem' }}>◆</span>
                  <span className="font-body text-xs leading-snug" style={{ color: 'var(--ink-body)' }}>{b}</span>
                </li>
              ))}
            </ul>
            {selected.url && selected.url !== '#' && (
              <a href={selected.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center font-sans text-xs font-semibold px-3 py-1.5 rounded-sm"
                style={{ color: 'white', background: 'var(--accent-red)', textDecoration: 'none' }}>
                {t.read}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
