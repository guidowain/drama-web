import { getGoogleAccessToken } from './google-auth'

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
const SHEETS_READONLY_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly'
const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'
const CASH_FLOW_SERVICE_ACCOUNT_ENV = 'FINANZAS_GOOGLE_SERVICE_ACCOUNT_KEY'

export type CashFlowSheetProperties = {
  sheetId: number
  title: string
  rowCount: number
  columnCount: number
}

export type CashFlowSpreadsheetMetadata = {
  spreadsheetId: string
  sheets: CashFlowSheetProperties[]
}

export type CashFlowReadSnapshot = {
  metadata: CashFlowSpreadsheetMetadata
  cashFlowPreview: string[][]
  dashboardPreview: string[][]
}

export type CashFlowDashboardMonth = {
  month: string
  billing: number
  spending: number
  margin: number | null
  profit: number
  billedByMati: number
  billedByGuido: number
  notBilled: number
}

export type CashFlowChartMonth = {
  month: string
  billing: number
}

export type CashFlowPartnerBilling = {
  month: string
  mati: number
  guido: number
}

export type CashFlowViewerData = {
  balanceText: string
  months: CashFlowDashboardMonth[]
  billingChart: CashFlowChartMonth[]
  partnerBillingChart: CashFlowPartnerBilling[]
  partnerTotals: {
    mati: number
    guido: number
  }
}

export function getCashFlowSpreadsheetId() {
  const spreadsheetId = process.env.FINANZAS_SPREADSHEET_ID

  if (!spreadsheetId) {
    throw new Error('Falta configurar FINANZAS_SPREADSHEET_ID.')
  }

  return spreadsheetId
}

export async function getCashFlowAccessToken(readonly = false) {
  return getGoogleAccessToken(readonly ? SHEETS_READONLY_SCOPE : SHEETS_SCOPE, {
    serviceAccountKeyEnv: CASH_FLOW_SERVICE_ACCOUNT_ENV,
  })
}

export async function getCashFlowSpreadsheetMetadata(): Promise<CashFlowSpreadsheetMetadata> {
  const spreadsheetId = getCashFlowSpreadsheetId()
  const accessToken = await getCashFlowAccessToken(true)
  const fields = 'sheets(properties(sheetId,title,gridProperties(rowCount,columnCount)))'
  const data = await sheetsFetch<{ sheets?: Array<{ properties?: SheetPropertiesResponse }> }>(
    `${SHEETS_API_BASE}/${spreadsheetId}?fields=${encodeURIComponent(fields)}`,
    accessToken
  )

  return {
    spreadsheetId,
    sheets: (data.sheets ?? []).map((sheet) => ({
      sheetId: Number(sheet.properties?.sheetId ?? 0),
      title: sheet.properties?.title ?? '',
      rowCount: Number(sheet.properties?.gridProperties?.rowCount ?? 0),
      columnCount: Number(sheet.properties?.gridProperties?.columnCount ?? 0),
    })),
  }
}

export async function getCashFlowRange(range: string, readonly = true) {
  const spreadsheetId = getCashFlowSpreadsheetId()
  const accessToken = await getCashFlowAccessToken(readonly)
  const data = await sheetsFetch<{ values?: string[][] }>(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueRenderOption=FORMATTED_VALUE`,
    accessToken
  )

  return data.values ?? []
}

export async function getCashFlowReadSnapshot(): Promise<CashFlowReadSnapshot> {
  const [metadata, cashFlowPreview, dashboardPreview] = await Promise.all([
    getCashFlowSpreadsheetMetadata(),
    getCashFlowRange('CashFlow!A1:L8'),
    getCashFlowRange('Dashboard!B2:I46'),
  ])

  return {
    metadata,
    cashFlowPreview,
    dashboardPreview,
  }
}

export async function getCashFlowViewerData(): Promise<CashFlowViewerData> {
  const [dashboardRows, chartRows] = await Promise.all([
    getCashFlowRange('Dashboard!B2:I46'),
    getCashFlowRange('Gráfico!A1:I18'),
  ])
  const months = parseDashboardRows(dashboardRows)

  return {
    balanceText: dashboardRows[0]?.[0] || 'Sin balance disponible',
    months,
    billingChart: parseBillingChartRows(chartRows),
    partnerBillingChart: parsePartnerBillingRows(chartRows),
    partnerTotals: {
      mati: parseMoney(chartRows[15]?.[7]),
      guido: parseMoney(chartRows[15]?.[8]),
    },
  }
}

async function sheetsFetch<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message = data?.error?.message || 'Google Sheets no aceptó la solicitud.'
    throw new Error(message)
  }

  return data as T
}

function parseDashboardRows(rows: string[][]): CashFlowDashboardMonth[] {
  return rows.slice(3)
    .filter((row) => row[0])
    .map((row) => ({
      month: row[0],
      billing: parseMoney(row[1]),
      spending: parseMoney(row[2]),
      margin: parsePercent(row[3]),
      profit: parseMoney(row[4]),
      billedByMati: parseMoney(row[5]),
      billedByGuido: parseMoney(row[6]),
      notBilled: parseMoney(row[7]),
    }))
}

function parseBillingChartRows(rows: string[][]): CashFlowChartMonth[] {
  return rows.slice(0, 12)
    .filter((row) => row[0])
    .map((row) => ({
      month: row[0],
      billing: parseMoney(row[1]),
    }))
}

function parsePartnerBillingRows(rows: string[][]): CashFlowPartnerBilling[] {
  return rows.slice(1, 13)
    .filter((row) => row[6])
    .map((row) => ({
      month: row[6],
      mati: parseMoney(row[7]),
      guido: parseMoney(row[8]),
    }))
}

function parseMoney(value: unknown) {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return 0

  const normalized = value
    .replace(/\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/^-$/, '')

  return Number(normalized || 0)
}

function parsePercent(value: unknown) {
  if (typeof value === 'number') return value
  if (typeof value !== 'string' || !value.trim()) return null

  const normalized = value.replace('%', '').replace(',', '.').trim()
  const numberValue = Number(normalized)

  return Number.isFinite(numberValue) ? numberValue / 100 : null
}

type SheetPropertiesResponse = {
  sheetId?: number
  title?: string
  gridProperties?: {
    rowCount?: number
    columnCount?: number
  }
}
