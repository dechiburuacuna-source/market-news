import type { Category, Location, SourceType } from '@/types/article'

export interface SourceDef {
  name: string
  location: Location
  source_type: SourceType
  rss: string | null
  categories: Category[]
  lang?: 'es' | 'en' | 'it' | 'pl'
  rss_fallbacks?: string[]
}

export const TRUSTED_SOURCES: SourceDef[] = [
  // ── Chile Institutional ────────────────────────────────────────────────────
  { name: 'Cochilco',                    location: 'Chile', source_type: 'Institutional', rss: 'https://www.cochilco.cl/rss.xml',               rss_fallbacks: ['https://www.cochilco.cl/feed/'],        categories: ['Mining'],           lang: 'es' },
  { name: 'Sernageomin',                 location: 'Chile', source_type: 'Institutional', rss: 'https://www.sernageomin.cl/feed/',               categories: ['Mining'],                                  lang: 'es' },
  { name: 'Ministerio de Mineria',       location: 'Chile', source_type: 'Institutional', rss: null,                                            categories: ['Mining'],                                  lang: 'es' },
  { name: 'Ministerio de Energia Chile', location: 'Chile', source_type: 'Institutional', rss: 'https://energia.gob.cl/feed/',                   rss_fallbacks: ['https://www.energia.gob.cl/rss.xml'],   categories: ['Energy'],           lang: 'es' },
  { name: 'Comision Nacional de Energia',location: 'Chile', source_type: 'Institutional', rss: 'https://www.cne.cl/feed/',                       rss_fallbacks: ['https://www.cne.cl/rss.xml'],           categories: ['Energy'],           lang: 'es' },
  { name: 'Coordinador Electrico Nacional', location: 'Chile', source_type: 'Institutional', rss: null,                                         categories: ['Energy'],                                  lang: 'es' },

  // ── Chile Conglomerados ────────────────────────────────────────────────────
  { name: 'ACERA',   location: 'Chile', source_type: 'Conglomerado', rss: null,                        categories: ['Energy'],           lang: 'es' },
  { name: 'ACENOR',  location: 'Chile', source_type: 'Conglomerado', rss: 'https://acenor.cl/feed/',   rss_fallbacks: ['https://www.acenor.cl/feed/'], categories: ['Energy'],           lang: 'es' },
  { name: 'ACEN',    location: 'Chile', source_type: 'Conglomerado', rss: null,                        categories: ['Energy', 'Mining'], lang: 'es' },
  { name: 'SOFOFA',  location: 'Chile', source_type: 'Conglomerado', rss: 'https://www.sofofa.cl/feed/', rss_fallbacks: ['https://sofofa.cl/noticias/feed/'], categories: ['Mining', 'Energy'], lang: 'es' },

  // ── Chile Press ────────────────────────────────────────────────────────────
  { name: 'Revista Electricidad', location: 'Chile', source_type: 'Press', rss: 'https://www.revistaei.cl/feed/',     rss_fallbacks: ['https://revistaei.cl/feed/rss/'],  categories: ['Energy'],           lang: 'es' },
  { name: 'Diario Financiero',    location: 'Chile', source_type: 'Press', rss: 'https://www.df.cl/noticias/rss.xml', rss_fallbacks: ['https://www.df.cl/feed/'],          categories: ['Mining', 'Energy'], lang: 'es' },
  { name: 'La Tercera',           location: 'Chile', source_type: 'Press', rss: 'https://www.latercera.com/feed/',    rss_fallbacks: ['https://www.latercera.com/rss.xml'],categories: ['Mining', 'Energy'], lang: 'es' },
  { name: 'Emol',                 location: 'Chile', source_type: 'Press', rss: 'https://www.emol.com/rss/noticias.xml', rss_fallbacks: ['https://www.emol.com/rss/economia.xml'], categories: ['Mining', 'Energy'], lang: 'es' },
  { name: 'Economia y Negocios',  location: 'Chile', source_type: 'Press', rss: 'https://www.economiaynegocios.cl/feed/', rss_fallbacks: ['https://www.economiaynegocios.cl/rss.xml'], categories: ['Mining', 'Energy', 'Data Centers'], lang: 'es' },
  { name: 'BNamericas',           location: 'Chile', source_type: 'Press', rss: 'https://www.bnamericas.com/rss/',    categories: ['Mining', 'Energy'],                    lang: 'en' },

  // ── Global Market Advisors ─────────────────────────────────────────────────
  { name: 'Aurora Energy Research', location: 'Global', source_type: 'Market Advisor', rss: null, categories: ['Energy', 'Data Centers'], lang: 'en' },
  { name: 'Afry',                   location: 'Global', source_type: 'Market Advisor', rss: null, categories: ['Energy', 'Mining'],       lang: 'en' },
  { name: 'DNV',                    location: 'Global', source_type: 'Market Advisor', rss: 'https://www.dnv.com/news/rss.xml', rss_fallbacks: ['https://www.dnv.com/news/feed.xml'], categories: ['Energy', 'Data Centers'], lang: 'en' },
  { name: 'Ember',                  location: 'Global', source_type: 'Market Advisor', rss: 'https://ember-climate.org/feed/', rss_fallbacks: ['https://ember-energy.org/feed/'], categories: ['Energy'], lang: 'en' },
  { name: 'Lazard',                 location: 'Global', source_type: 'Market Advisor', rss: null, categories: ['Energy', 'Mining'],       lang: 'en' },
  { name: 'Wood Mackenzie',         location: 'Global', source_type: 'Market Advisor', rss: 'https://www.woodmac.com/feed/', rss_fallbacks: ['https://woodmackenzie.com/feed/'], categories: ['Energy', 'Mining', 'Data Centers'], lang: 'en' },
  { name: 'BloombergNEF',           location: 'Global', source_type: 'Market Advisor', rss: null, categories: ['Energy', 'Mining', 'Data Centers'], lang: 'en' },

  // ── Italy ──────────────────────────────────────────────────────────────────
  { name: "Ministero dell'Ambiente", location: 'Italy', source_type: 'Institutional', rss: 'https://www.mase.gov.it/rss.xml',         categories: ['Energy'], lang: 'it' },
  { name: 'Terna',                   location: 'Italy', source_type: 'Institutional', rss: 'https://www.terna.it/it/media/notizie/rss.xml', categories: ['Energy'], lang: 'it' },
  { name: 'Il Sole 24 Ore',          location: 'Italy', source_type: 'Press',         rss: 'https://www.ilsole24ore.com/rss/notizie.xml', rss_fallbacks: ['https://www.ilsole24ore.com/rss/home.xml'], categories: ['Energy'], lang: 'it' },
  { name: 'Energia Oltre',           location: 'Italy', source_type: 'Press',         rss: 'https://www.energiaoltre.it/feed/',       categories: ['Energy'], lang: 'it' },

  // ── Poland ─────────────────────────────────────────────────────────────────
  { name: 'Ministry of Climate Poland', location: 'Poland', source_type: 'Institutional', rss: null,                          categories: ['Energy'], lang: 'pl' },
  { name: 'PSE',                        location: 'Poland', source_type: 'Institutional', rss: null,                          categories: ['Energy'], lang: 'pl' },
  { name: 'BiznesAlert',                location: 'Poland', source_type: 'Press',         rss: 'https://biznesalert.pl/feed/', rss_fallbacks: ['https://biznesalert.pl/feed/rss/'], categories: ['Energy'], lang: 'pl' },
  { name: 'Warsaw Business Journal',    location: 'Poland', source_type: 'Press',         rss: 'https://wbj.pl/feed',         rss_fallbacks: ['https://wbj.pl/rss'], categories: ['Energy'], lang: 'en' },

  // ── Mexico ─────────────────────────────────────────────────────────────────
  { name: 'SENER',           location: 'Mexico', source_type: 'Institutional', rss: null,                                              categories: ['Energy'],           lang: 'es' },
  { name: 'CFE',             location: 'Mexico', source_type: 'Institutional', rss: null,                                              categories: ['Energy'],           lang: 'es' },
  { name: 'El Financiero',   location: 'Mexico', source_type: 'Press',         rss: 'https://www.elfinanciero.com.mx/arc/outboundfeeds/rss/', rss_fallbacks: ['https://www.elfinanciero.com.mx/rss/feed.xml'], categories: ['Energy', 'Mining'], lang: 'es' },
  { name: 'Energia Hoy',     location: 'Mexico', source_type: 'Press',         rss: 'https://energiahoy.com/feed/',                    categories: ['Energy'],           lang: 'es' },

  // ── Spain ──────────────────────────────────────────────────────────────────
  { name: 'MITECO',        location: 'Spain', source_type: 'Institutional', rss: null,                                              categories: ['Energy'],           lang: 'es' },
  { name: 'Red Electrica', location: 'Spain', source_type: 'Institutional', rss: 'https://www.ree.es/es/sala-de-prensa/noticias-y-novedades/rss', rss_fallbacks: ['https://www.ree.es/rss.xml'], categories: ['Energy'], lang: 'es' },
  { name: 'El Pais',       location: 'Spain', source_type: 'Press',         rss: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada', rss_fallbacks: ['https://elpais.com/rss/elpais/economia.xml'], categories: ['Energy', 'Mining'], lang: 'es' },
  { name: 'Expansion',     location: 'Spain', source_type: 'Press',         rss: 'https://e00-expansion.uecdn.es/rss/portada.xml', rss_fallbacks: ['https://www.expansion.com/rss/portada.xml'], categories: ['Energy'], lang: 'es' },

  // ── Global Institutional & Press ───────────────────────────────────────────
  { name: 'IEA',                 location: 'Global', source_type: 'Institutional', rss: 'https://www.iea.org/api/news/rss',          rss_fallbacks: ['https://www.iea.org/rss/news.xml'],      categories: ['Energy', 'Mining', 'Data Centers'], lang: 'en' },
  { name: 'World Bank',          location: 'Global', source_type: 'Institutional', rss: 'https://blogs.worldbank.org/energy/feed',   rss_fallbacks: ['https://www.worldbank.org/en/news/rss'], categories: ['Energy', 'Mining'],                  lang: 'en' },
  { name: 'Reuters',             location: 'Global', source_type: 'Press',         rss: 'https://feeds.reuters.com/reuters/businessNews', categories: ['Mining', 'Energy', 'Data Centers'],      lang: 'en' },
  { name: 'Mining.com',          location: 'Global', source_type: 'Press',         rss: 'https://www.mining.com/feed/',              rss_fallbacks: ['https://mining.com/rss.xml'],            categories: ['Mining'],                            lang: 'en' },
  { name: 'Data Center Dynamics',location: 'Global', source_type: 'Press',         rss: 'https://www.datacenterdynamics.com/en/rss/',rss_fallbacks: ['https://www.datacenterdynamics.com/rss.xml'], categories: ['Data Centers'],                  lang: 'en' },
  { name: 'TechCrunch',          location: 'Global', source_type: 'Press',         rss: 'https://techcrunch.com/feed/',              categories: ['Data Centers'],                            lang: 'en' },
]

export const RSS_SOURCES        = TRUSTED_SOURCES.filter(s => s.rss !== null)
export const ALL_LOCATIONS      = ['Chile', 'Italy', 'Poland', 'Mexico', 'Spain', 'Global'] as const
export const ALL_CATEGORIES     = ['Mining', 'Energy', 'Data Centers'] as const
export const ALL_SOURCE_TYPES   = ['Institutional', 'Press', 'Conglomerado', 'Market Advisor'] as const

export const SOURCES_BY_LOCATION = TRUSTED_SOURCES.reduce((acc, s) => {
  if (!acc[s.location]) acc[s.location] = []
  acc[s.location].push(s.name)
  return acc
}, {} as Record<string, string[]>)
