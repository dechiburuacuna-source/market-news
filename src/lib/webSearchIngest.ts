import { GoogleGenAI } from '@google/genai'
import type { Category, Location, SourceType } from '@/types/article'
import type { RawArticle } from './rss'

let _client: GoogleGenAI | null = null
function getClient(): GoogleGenAI {
  if (!_client) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set')
    _client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  }
  return _client
}

export interface WebSearchSource {
  name: string
  location: Location
  source_type: SourceType
  categories: Category[]
  lang: string
  domain: string
  topics: string
  /** Path prefixes within the domain to deep-search (e.g. "categoria/renovables/solar"). */
  sections?: string[]
}

export const WEB_SEARCH_SOURCES: WebSearchSource[] = [
  // ── Chile Institutional ────────────────────────────────────────────────────
  {
    name: 'Ministerio de Energía Chile', location: 'Chile', source_type: 'Institutional',
    categories: ['Energy'], lang: 'es', domain: 'energia.gob.cl',
    topics: 'política energética Chile, transición energética, hidrógeno verde, descarbonización, renovables',
    sections: ['noticias', 'prensa', 'agenda-energetica'],
  },
  {
    name: 'Coordinador Eléctrico Nacional', location: 'Chile', source_type: 'Institutional',
    categories: ['Energy'], lang: 'es', domain: 'coordinador.cl',
    topics: 'Sistema Eléctrico Nacional Chile SEN, despacho económico, transmisión, generación, operación red',
    sections: ['prensa-y-comunicaciones', 'noticias', 'sala-de-prensa'],
  },
  {
    name: 'Comisión Nacional de Energía', location: 'Chile', source_type: 'Institutional',
    categories: ['Energy'], lang: 'es', domain: 'cne.cl',
    topics: 'CNE Chile, regulación eléctrica, tarifas, licitaciones suministro, normativa técnica',
    sections: ['prensa', 'noticias', 'sala-de-prensa'],
  },

  // ── Chile Conglomerados ────────────────────────────────────────────────────
  {
    name: 'ACERA', location: 'Chile', source_type: 'Conglomerado',
    categories: ['Energy'], lang: 'es', domain: 'acera.cl',
    topics: 'energías renovables Chile, solar eólica almacenamiento BESS, hidrógeno verde, transición energética',
    sections: ['noticias', 'prensa', 'comunicados', 'sala-de-prensa'],
  },
  {
    name: 'ACENOR', location: 'Chile', source_type: 'Conglomerado',
    categories: ['Energy'], lang: 'es', domain: 'acenor.cl',
    topics: 'clientes no regulados, mercado eléctrico Chile, contratos suministro, PPA',
    sections: ['noticias', 'prensa'],
  },
  {
    name: 'SOFOFA', location: 'Chile', source_type: 'Conglomerado',
    categories: ['Mining', 'Energy'], lang: 'es', domain: 'sofofa.cl',
    topics: 'industria chilena minería energía sector productivo, inversión, política industrial',
    sections: ['noticias', 'comunicados', 'prensa', 'opinion'],
  },
  {
    name: 'Asociación Chilena de Data Centers', location: 'Chile', source_type: 'Conglomerado',
    categories: ['Data Centers'], lang: 'es', domain: 'chiledatacenters.cl',
    topics: 'data centers Chile, infraestructura digital, hiperescaladores, AI infraestructura, energía y agua data centers, gremio data centers',
    sections: ['noticias', 'prensa', 'comunicados', 'sala-de-prensa', 'blog'],
  },

  // ── Chile Press ────────────────────────────────────────────────────────────
  {
    name: 'Revista Electricidad', location: 'Chile', source_type: 'Press',
    categories: ['Energy'], lang: 'es', domain: 'revistaei.cl',
    topics: 'energía eléctrica renovable Chile, solar fotovoltaica, eólica, almacenamiento BESS, transmisión, generación, hidrógeno, regulación SEN',
    sections: [
      'categoria/transicion-energetica-y-renovables',
      'categoria/transicion-energetica-y-renovables/energias-renovables',
      'categoria/transicion-energetica-y-renovables/energias-renovables/almacenamiento',
      'categoria/transicion-energetica-y-renovables/energias-renovables/solar',
      'categoria/transicion-energetica-y-renovables/energias-renovables/eolica',
      'categoria/transicion-energetica-y-renovables/hidrogeno',
      'categoria/mercado-electrico',
      'categoria/mercado-electrico/transmision',
      'categoria/mercado-electrico/generacion',
      'categoria/regulacion',
    ],
  },
  {
    name: 'Electrominería', location: 'Chile', source_type: 'Press',
    categories: ['Mining', 'Energy'], lang: 'es', domain: 'electromineria.cl',
    topics: 'electrificación minería Chile, energía minera, cobre litio sustentabilidad, proyectos eléctricos mineros, descarbonización',
    sections: ['categoria/mineria', 'categoria/energia', 'categoria/proyectos', 'noticias'],
  },
  {
    name: 'Diario Financiero', location: 'Chile', source_type: 'Press',
    categories: ['Mining', 'Energy'], lang: 'es', domain: 'df.cl',
    topics: 'minería cobre litio, energía renovable, inversión extranjera, Codelco SQM, data centers Chile',
    sections: ['mercados/empresas/mineria', 'mercados/empresas/energia', 'mercados/empresas-y-mercados', 'economia-y-politica'],
  },
  {
    name: 'La Tercera Pulso', location: 'Chile', source_type: 'Press',
    categories: ['Mining', 'Energy'], lang: 'es', domain: 'latercera.com',
    topics: 'energía renovable, minería cobre litio, electricidad Chile, transición energética, data centers',
    sections: ['pulso/empresas-y-mercados', 'pulso/mercados', 'pulso/empresas'],
  },
  {
    name: 'Emol Economía', location: 'Chile', source_type: 'Press',
    categories: ['Energy', 'Mining'], lang: 'es', domain: 'emol.com',
    topics: 'energía eléctrica renovable, minería cobre litio, electricidad Chile',
    sections: ['noticias/Economia', 'noticias/Nacional'],
  },

  // ── Global Market Advisors ─────────────────────────────────────────────────
  {
    name: 'Wood Mackenzie', location: 'Global', source_type: 'Market Advisor',
    categories: ['Energy', 'Mining', 'Data Centers'], lang: 'en', domain: 'woodmac.com',
    topics: 'energy market research, renewable energy, mining metals outlook, data center power demand, commodity forecasts',
    sections: ['horizons', 'news', 'press-releases', 'insights'],
  },
  {
    name: 'BloombergNEF', location: 'Global', source_type: 'Market Advisor',
    categories: ['Energy', 'Mining', 'Data Centers'], lang: 'en', domain: 'bnef.com',
    topics: 'clean energy investment, battery storage, EV metals, power market outlook, AI data center energy',
    sections: ['news', 'insights', 'blog'],
  },
  {
    name: 'S&P Global Commodity Insights', location: 'Global', source_type: 'Market Advisor',
    categories: ['Energy', 'Mining'], lang: 'en', domain: 'spglobal.com',
    topics: 'commodity insights, renewable power, metals mining, energy transition Platts',
    sections: [
      'commodityinsights/en/news-research/latest-news/electric-power',
      'commodityinsights/en/news-research/latest-news/metals',
      'commodityinsights/en/news-research/latest-news/energy-transition',
      'commodityinsights/en/market-insights/latest-news',
    ],
  },
  {
    name: 'Aurora Energy Research', location: 'Global', source_type: 'Market Advisor',
    categories: ['Energy', 'Data Centers'], lang: 'en', domain: 'auroraer.com',
    topics: 'Aurora Energy Research, power price forecast, renewables outlook, data center power demand',
    sections: ['insights', 'news', 'research', 'publications'],
  },
  {
    name: 'AFRY', location: 'Global', source_type: 'Market Advisor',
    categories: ['Energy', 'Mining'], lang: 'en', domain: 'afry.com',
    topics: 'AFRY energy transition consulting, power systems, renewable energy, mining advisory',
    sections: ['en/insights', 'en/news', 'en/newsroom'],
  },
  {
    name: 'DNV', location: 'Global', source_type: 'Market Advisor',
    categories: ['Energy', 'Data Centers'], lang: 'en', domain: 'dnv.com',
    topics: 'DNV energy transition outlook, offshore wind, renewables, hydrogen, data center energy',
    sections: ['news', 'feature', 'power-renewables', 'energy-transition'],
  },
  {
    name: 'EY Energy', location: 'Global', source_type: 'Market Advisor',
    categories: ['Energy', 'Mining'], lang: 'en', domain: 'ey.com',
    topics: 'EY energy report, power utilities, mining metals outlook, renewable investment',
    sections: ['en_gl/insights/energy-resources', 'en_gl/insights/mining-metals'],
  },
  {
    name: 'PwC Energy', location: 'Global', source_type: 'Market Advisor',
    categories: ['Energy', 'Mining'], lang: 'en', domain: 'pwc.com',
    topics: 'PwC energy utilities, mining outlook, renewables transition, power sector',
    sections: ['gx/en/industries/energy-utilities-resources', 'gx/en/industries/energy-utilities-resources/power-utilities'],
  },
  {
    name: 'BCG', location: 'Global', source_type: 'Market Advisor',
    categories: ['Energy', 'Mining', 'Data Centers'], lang: 'en', domain: 'bcg.com',
    topics: 'BCG energy climate decarbonization, mining metals, data centers AI infrastructure, renewables',
    sections: ['industries/energy', 'industries/mining-materials', 'publications'],
  },
  {
    name: 'McKinsey & Company', location: 'Global', source_type: 'Market Advisor',
    categories: ['Energy', 'Mining', 'Data Centers'], lang: 'en', domain: 'mckinsey.com',
    topics: 'McKinsey energy insights, mining metals, power utilities, data centers AI, sustainability',
    sections: [
      'industries/electric-power-and-natural-gas/our-insights',
      'industries/metals-and-mining/our-insights',
      'industries/oil-and-gas/our-insights',
      'capabilities/sustainability/our-insights',
    ],
  },
  {
    name: 'Ember', location: 'Global', source_type: 'Market Advisor',
    categories: ['Energy'], lang: 'en', domain: 'ember-energy.org',
    topics: 'Ember global electricity data, coal phase-out, clean power, emissions analysis',
    sections: ['insights', 'news', 'analysis'],
  },

  // ── Global Institutional & Press ───────────────────────────────────────────
  {
    name: 'IEA', location: 'Global', source_type: 'Institutional',
    categories: ['Energy', 'Mining', 'Data Centers'], lang: 'en', domain: 'iea.org',
    topics: 'IEA energy transition, renewables investment, electricity demand, critical minerals',
    sections: ['news', 'reports', 'commentaries', 'analysis'],
  },
  {
    name: 'Data Center Dynamics', location: 'Global', source_type: 'Press',
    categories: ['Data Centers'], lang: 'en', domain: 'datacenterdynamics.com',
    topics: 'data centers, hyperscalers, AI infrastructure, colocation, power demand, cooling, sustainability, Latin America data centers',
    sections: [
      'en/news',
      'en/analysis',
      'en/news/power-cooling',
      'en/news/servers-storage',
      'en/news/cloud-and-hybrid',
      'en/news/critical-environment',
      'es-la/noticias',
      'es-la/analisis',
    ],
  },
  {
    name: 'Mining.com', location: 'Global', source_type: 'Press',
    categories: ['Mining'], lang: 'en', domain: 'mining.com',
    topics: 'copper gold lithium mining, commodity prices, mining projects, electric mining',
    sections: ['news', 'markets', 'commodity/copper', 'commodity/lithium'],
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

const LOOKBACK_DAYS = 20

function getDateDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

function isValidDate(s: string): boolean {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(s)
  if (isNaN(d.getTime())) return false
  return d <= new Date()
}

function extractDateFromUrl(url: string): string | null {
  const patterns = [
    /\/(\d{4})\/(\d{2})\/(\d{2})\//,
    /[^\d](\d{4})-(\d{2})-(\d{2})[^\d]/,
    /\/(\d{4})(\d{2})(\d{2})[-_]/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) {
      const candidate = `${m[1]}-${m[2]}-${m[3]}`
      if (isValidDate(candidate)) return candidate
    }
  }
  return null
}

function bestDate(candidateDate: string, url: string): string {
  if (isValidDate(candidateDate)) return candidateDate
  const fromUrl = extractDateFromUrl(url)
  if (fromUrl) return fromUrl
  return new Date().toISOString().split('T')[0]
}

function cleanUrl(url: string): string {
  return url.replace(/\[\d+\]/g, '').trim()
}

/**
 * Extract the registered domain (last two labels) so that subdomains like
 * "about.bnef.com" or "www.revistaei.cl" all match on "bnef.com" / "revistaei.cl".
 */
function registeredDomain(domain: string): string {
  const parts = domain.replace(/^www\./, '').split('.')
  // Keep last 2 parts: bnef.com, revistaei.cl, mase.gov.it → "gov.it" is a special case
  // For ccTLD + SLD combos (gov.it, gov.pl, gob.mx) keep last 3
  const secondLevel = parts[parts.length - 2] ?? ''
  const knownSlds = ['gov', 'gob', 'com', 'org', 'net', 'co', 'ac']
  if (knownSlds.includes(secondLevel) && parts.length >= 3) {
    return parts.slice(-3).join('.')
  }
  return parts.slice(-2).join('.')
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(source: WebSearchSource): string {
  const today = new Date().toISOString().split('T')[0]
  const since = getDateDaysAgo(LOOKBACK_DAYS)
  const typeDesc = source.source_type === 'Conglomerado'
    ? 'trade association / industry group'
    : source.source_type === 'Market Advisor'
    ? 'market research and advisory firm'
    : source.source_type

  // Deep-search hints: explicit site: operators that point Google INSIDE
  // category sections, not just the homepage.
  const hasSections = source.sections && source.sections.length > 0
  const sectionBlock = hasSections
    ? `\n\nIMPORTANT — DEEP SEARCH: Do NOT just look at the homepage. Run these Google searches to find articles INSIDE the site's specific category sections:
${source.sections!.map(s => `  • site:${source.domain}/${s}`).join('\n')}

For each category section above, find the most recent articles published in the last ${LOOKBACK_DAYS} days. Spend equal effort on each section listed.`
    : ''

  return `Today is ${today}. Find the most recent articles about renewable energy, mining, data centers, and industrial sectors (last ${LOOKBACK_DAYS} days — after ${since}) from "${source.name}", a ${typeDesc}.${sectionBlock}

Focus topics: ${source.topics}

Return ONLY a valid JSON array (no markdown, no code fences) with up to 6 articles total:
[
  {
    "title": "exact article title as published",
    "url": "https://full-direct-link-to-the-article",
    "date": "YYYY-MM-DD",
    "content": "2-3 sentence summary of the article"
  }
]

Rules:
- Only include articles from domain "${source.domain}"
- Each URL must be a DIRECT link to a specific article — NOT a category page, archive index, tag page, or homepage
- Dates must be real publication dates in YYYY-MM-DD format within the last ${LOOKBACK_DAYS} days
- Prefer specific topics in: renewable energy (solar, wind, BESS storage, hydrogen), mining (copper, lithium, electric mining), data centers (AI infrastructure, hyperscaler power), industrial decarbonization
- Return [] if no recent articles were found`
}

// ── Core search function ──────────────────────────────────────────────────────

export async function searchArticlesBySource(source: WebSearchSource): Promise<RawArticle[]> {
  try {
    const ai = getClient()
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: buildPrompt(source),
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
        maxOutputTokens: 3000,
      },
    })

    // ── Step 1: extract verified URLs from groundingChunks ────────────────────
    // These are real Google Search results — guaranteed to exist
    const candidate = response.candidates?.[0]
    const regDomain = registeredDomain(source.domain)

    const groundedUris = new Set<string>(
      (candidate?.groundingMetadata?.groundingChunks ?? [])
        .map((c: { web?: { uri?: string } }) => c.web?.uri)
        .filter((uri): uri is string => !!uri && uri.toLowerCase().includes(regDomain))
    )

    // ── Step 2: parse JSON from model response for metadata ───────────────────
    const text = response.text ?? ''
    const match = text.match(/\[[\s\S]*?\](?=\s*$|\s*\n)/) ?? text.match(/\[[\s\S]*\]/)
    let modelItems: Array<{ title: string; url: string; date: string; content: string }> = []
    if (match) {
      try { modelItems = JSON.parse(match[0]) } catch { /* ignore */ }
    }

    // ── Step 3: combine grounded URIs + model items ───────────────────────────
    const candidateUrls: Array<{ uri: string; title: string; date: string; content: string }> = []

    // Grounded URIs first (real, verified by Google)
    for (const uri of Array.from(groundedUris)) {
      const matched = modelItems.find(item => {
        const cu = cleanUrl(item.url ?? '')
        return cu === uri || uri.startsWith(cu.split('?')[0]) || cu.startsWith(uri.split('?')[0])
      })
      candidateUrls.push({
        uri,
        title:   matched?.title?.trim() || '',
        date:    matched?.date || '',
        content: matched?.content?.trim() || '',
      })
    }

    // Model JSON items not already covered by grounding
    for (const item of modelItems) {
      const uri = cleanUrl(item.url ?? '')
      if (
        uri.startsWith('http') &&
        uri.toLowerCase().includes(regDomain) &&
        !candidateUrls.some(c => c.uri === uri)
      ) {
        candidateUrls.push({ uri, title: item.title?.trim() || '', date: item.date || '', content: item.content?.trim() || '' })
      }
    }

    if (candidateUrls.length === 0) return []

    // ── Step 4: enforce the lookback window — drop anything older than N days ─
    const since = getDateDaysAgo(LOOKBACK_DAYS)
    return candidateUrls
      .slice(0, 10)
      .map(c => ({ ...c, resolvedDate: bestDate(c.date, c.uri) }))
      .filter(c => c.resolvedDate >= since)
      .map(c => ({
        title:       c.title || source.name,
        url:         c.uri,
        source:      source.name,
        source_type: source.source_type,
        location:    source.location,
        categories:  source.categories,
        date:        c.resolvedDate,
        content:     c.content || c.title || source.name,
        lang:        source.lang,
      } satisfies RawArticle))

  } catch (err) {
    console.warn(`[GeminiSearch] ${source.name} failed:`, (err as Error).message)
    return []
  }
}

// ── Batch runner ─────────────────────────────────────────────────────────────

export async function searchAllWebSources(
  sources: WebSearchSource[] = WEB_SEARCH_SOURCES,
  concurrency = 3
): Promise<{ articles: RawArticle[]; failed: string[] }> {
  const allArticles: RawArticle[] = []
  const failed: string[] = []

  for (let i = 0; i < sources.length; i += concurrency) {
    const batch = sources.slice(i, i + concurrency)
    const results = await Promise.all(batch.map(async s => {
      const arts = await searchArticlesBySource(s)
      if (arts.length === 0) failed.push(s.name)
      console.log(`[GeminiSearch] ${s.name}: ${arts.length} articles`)
      return arts
    }))
    results.forEach(r => allArticles.push(...r))
    if (i + concurrency < sources.length) await new Promise(r => setTimeout(r, 800))
  }

  const seen = new Set<string>()
  return {
    articles: allArticles.filter(a => {
      if (!a.url || seen.has(a.url)) return false
      seen.add(a.url)
      return true
    }),
    failed,
  }
}
