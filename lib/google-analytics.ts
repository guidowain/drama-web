import { getGoogleAccessToken, getGoogleOAuthAccessToken, getGoogleServiceAccountEmail } from './google-auth'

const GA_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'
const GA_API_BASE = 'https://analyticsdata.googleapis.com/v1beta'

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
  topPages: Array<{
    path: string
    title: string
    views: number
  }>
  events: Array<{
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
    topPages: [],
    events: [],
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
    const [summary, topPages, events, projects] = await Promise.all([
      runReport(propertyId, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'eventCount' },
        ],
      }),
      runReport(propertyId, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 5,
      }),
      runReport(propertyId, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            inListFilter: {
              values: ['fan_mode_open', 'project_modal_open'],
            },
          },
        },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      }),
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
      topPages: (topPages.rows ?? []).map((row) => ({
        path: row.dimensionValues?.[0]?.value || '/',
        title: row.dimensionValues?.[1]?.value || 'Sin título',
        views: numberValue(row.metricValues?.[0]?.value),
      })),
      events: (events.rows ?? []).map((row) => ({
        name: row.dimensionValues?.[0]?.value || 'Evento',
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

async function getProjectEvents(propertyId: string) {
  try {
    const report = await runReport(propertyId, {
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'customEvent:project_slug' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'EXACT',
            value: 'project_modal_open',
          },
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 5,
    })

    return (report.rows ?? []).map((row) => ({
      name: row.dimensionValues?.[0]?.value || 'Sin nombre',
      opens: numberValue(row.metricValues?.[0]?.value),
    }))
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
