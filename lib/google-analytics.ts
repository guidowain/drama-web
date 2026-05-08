import { getGoogleAccessToken, getGoogleOAuthAccessToken, getGoogleServiceAccountEmail } from './google-auth'

const GA_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'
const GA_API_BASE = 'https://analyticsdata.googleapis.com/v1beta'

const NON_ADMIN_FILTER = {
  notExpression: {
    filter: {
      fieldName: 'pagePath',
      stringFilter: {
        matchType: 'BEGINS_WITH',
        value: '/admin',
      },
    },
  },
}

type RunReportResponse = {
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>
    metricValues?: Array<{ value?: string }>
  }>
  totals?: Array<{
    metricValues?: Array<{ value?: string }>
  }>
}

export type AnalyticsSummary = {
  configured: boolean
  serviceAccountEmail: string
  propertyId: string
  rangeLabel: string
  metrics: {
    activeUsers: number
    sessions: number
    screenPageViews: number
    averageSessionDuration: number
    eventCount: number
  }
  visits: {
    today: number
    week: number
    month: number
  }
  topPages: Array<{
    path: string
    title: string
    views: number
  }>
  events: Array<{
    name: string
    count: number
  }>
  devices: Array<{
    name: string
    count: number
  }>
  sources: Array<{
    name: string
    count: number
  }>
  projects: Array<{
    name: string
    opens: number
  }>
  error?: string
}

const EMPTY_METRICS: AnalyticsSummary['metrics'] = {
  activeUsers: 0,
  sessions: 0,
  screenPageViews: 0,
  averageSessionDuration: 0,
  eventCount: 0,
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID || ''
  const hasOAuthCredentials = Boolean(
    process.env.GOOGLE_ANALYTICS_CLIENT_ID &&
    process.env.GOOGLE_ANALYTICS_CLIENT_SECRET &&
    process.env.GOOGLE_ANALYTICS_REFRESH_TOKEN
  )
  const serviceAccountEmail = getGoogleServiceAccountEmail()
  const base: AnalyticsSummary = {
    configured: Boolean(propertyId && (hasOAuthCredentials || serviceAccountEmail)),
    serviceAccountEmail,
    propertyId,
    rangeLabel: 'Últimos 30 días',
    metrics: EMPTY_METRICS,
    visits: {
      today: 0,
      week: 0,
      month: 0,
    },
    topPages: [],
    events: [],
    devices: [],
    sources: [],
    projects: [],
  }

  if (!propertyId) {
    return {
      ...base,
      error: 'Falta configurar GOOGLE_ANALYTICS_PROPERTY_ID.',
    }
  }

  if (!hasOAuthCredentials && !serviceAccountEmail) {
    return {
      ...base,
      error: 'Falta configurar OAuth de Google Analytics o un service account de Google.',
    }
  }

  try {
    const [summary, topPages, events, devices, sources, todayVisits, weekVisits, monthVisits, projects] = await Promise.all([
      runReport(propertyId, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'eventCount' },
        ],
        dimensionFilter: NON_ADMIN_FILTER,
      }),
      runReport(propertyId, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        metrics: [{ name: 'screenPageViews' }],
        dimensionFilter: NON_ADMIN_FILTER,
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 5,
      }),
      runReport(propertyId, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          andGroup: {
            expressions: [
              NON_ADMIN_FILTER,
              {
                filter: {
                  fieldName: 'eventName',
                  inListFilter: {
                    values: ['fan_mode_open'],
                  },
                },
              },
            ],
          },
        },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      }),
      runReport(propertyId, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'sessions' }],
        dimensionFilter: NON_ADMIN_FILTER,
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),
      runReport(propertyId, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }],
        dimensionFilter: NON_ADMIN_FILTER,
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 6,
      }),
      getViews(propertyId, 'today'),
      getViews(propertyId, '7daysAgo'),
      getViews(propertyId, '30daysAgo'),
      getProjectEvents(propertyId),
    ])

    const metricValues = summary.totals?.[0]?.metricValues ?? summary.rows?.[0]?.metricValues ?? []

    return {
      ...base,
      configured: true,
      metrics: {
        activeUsers: numberValue(metricValues[0]?.value),
        sessions: numberValue(metricValues[1]?.value),
        screenPageViews: numberValue(metricValues[2]?.value),
        averageSessionDuration: numberValue(metricValues[3]?.value),
        eventCount: numberValue(metricValues[4]?.value),
      },
      visits: {
        today: todayVisits,
        week: weekVisits,
        month: monthVisits,
      },
      topPages: mergePages(topPages.rows ?? []),
      events: (events.rows ?? []).map((row) => ({
        name: row.dimensionValues?.[0]?.value || 'Evento',
        count: numberValue(row.metricValues?.[0]?.value),
      })),
      devices: (devices.rows ?? []).map((row) => ({
        name: row.dimensionValues?.[0]?.value || 'unknown',
        count: numberValue(row.metricValues?.[0]?.value),
      })),
      sources: (sources.rows ?? []).map((row) => ({
        name: row.dimensionValues?.[0]?.value || 'Unassigned',
        count: numberValue(row.metricValues?.[0]?.value),
      })),
      projects,
    }
  } catch (error) {
    return {
      ...base,
      error: error instanceof Error ? error.message : 'No se pudo leer Google Analytics.',
    }
  }
}

async function getViews(propertyId: string, startDate: string) {
  const report = await runReport(propertyId, {
    dateRanges: [{ startDate, endDate: 'today' }],
    metrics: [{ name: 'screenPageViews' }],
    dimensionFilter: NON_ADMIN_FILTER,
  })

  const metricValues = report.totals?.[0]?.metricValues ?? report.rows?.[0]?.metricValues ?? []
  return numberValue(metricValues[0]?.value)
}

async function getProjectEvents(propertyId: string) {
  try {
    const report = await runReport(propertyId, {
      dateRanges: [{ startDate: '2026-01-01', endDate: 'today' }],
      dimensions: [{ name: 'customEvent:project_slug' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            NON_ADMIN_FILTER,
            {
              filter: {
                fieldName: 'eventName',
                stringFilter: {
                  matchType: 'EXACT',
                  value: 'project_modal_open',
                },
              },
            },
          ],
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 5,
    })

    const projects = (report.rows ?? []).map((row) => ({
      name: row.dimensionValues?.[0]?.value || 'Sin nombre',
      opens: numberValue(row.metricValues?.[0]?.value),
    }))

    if (projects.length) {
      return projects
    }
  } catch {
    // Custom event parameters only become queryable after GA4 registers them
    // as custom dimensions. Fall back to the modal URL while that warms up.
  }

  return getProjectEventsFromUrls(propertyId)
}

async function getProjectEventsFromUrls(propertyId: string) {
  try {
    const report = await runReport(propertyId, {
      dateRanges: [{ startDate: '2026-01-01', endDate: 'today' }],
      dimensions: [{ name: 'pagePathPlusQueryString' }],
      metrics: [{ name: 'screenPageViews' }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            NON_ADMIN_FILTER,
            {
              filter: {
                fieldName: 'pagePathPlusQueryString',
                stringFilter: {
                  matchType: 'CONTAINS',
                  value: '/proyectos?slug=',
                },
              },
            },
          ],
        },
      },
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 20,
    })

    return mergeProjectUrls(report.rows ?? [])
  } catch {
    return []
  }
}

async function runReport(propertyId: string, body: Record<string, unknown>): Promise<RunReportResponse> {
  const accessToken = await getAnalyticsAccessToken()
  const response = await fetch(`${GA_API_BASE}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    next: { revalidate: 300 },
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Google Analytics no aceptó la consulta.')
  }

  return data
}

async function getAnalyticsAccessToken() {
  const clientId = process.env.GOOGLE_ANALYTICS_CLIENT_ID
  const clientSecret = process.env.GOOGLE_ANALYTICS_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_ANALYTICS_REFRESH_TOKEN

  if (clientId && clientSecret && refreshToken) {
    return getGoogleOAuthAccessToken({
      clientId,
      clientSecret,
      refreshToken,
      cacheKey: 'google-analytics',
    })
  }

  return getGoogleAccessToken(GA_SCOPE)
}

function numberValue(value?: string) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function mergePages(rows: NonNullable<RunReportResponse['rows']>) {
  const pages = new Map<string, {
    path: string
    title: string
    views: number
  }>()

  rows.forEach((row) => {
    const rawPath = row.dimensionValues?.[0]?.value || '/'
    const normalizedPath = normalizePagePath(rawPath)
    const current = pages.get(normalizedPath)
    const views = numberValue(row.metricValues?.[0]?.value)

    pages.set(normalizedPath, {
      path: normalizedPath,
      title: current?.title || row.dimensionValues?.[1]?.value || 'Sin título',
      views: (current?.views ?? 0) + views,
    })
  })

  return Array.from(pages.values())
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
}

function normalizePagePath(path: string) {
  const cleanPath = path.split('?')[0].replace(/\/$/, '') || '/'
  if (cleanPath === '/home') return '/'
  return cleanPath
}

function mergeProjectUrls(rows: NonNullable<RunReportResponse['rows']>) {
  const projects = new Map<string, number>()

  rows.forEach((row) => {
    const path = row.dimensionValues?.[0]?.value || ''
    const slug = projectSlugFromPath(path)

    if (!slug) return

    projects.set(slug, (projects.get(slug) ?? 0) + numberValue(row.metricValues?.[0]?.value))
  })

  return Array.from(projects.entries())
    .map(([name, opens]) => ({ name, opens }))
    .sort((a, b) => b.opens - a.opens)
    .slice(0, 5)
}

function projectSlugFromPath(path: string) {
  const queryString = path.split('?')[1]
  if (!queryString) return ''

  return (new URLSearchParams(queryString).get('slug') || '').split('?')[0]
}
