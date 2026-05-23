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

export type CashFlowClientMovement = {
  row: number
  date: string
  client: string
  work: string
  pendingAmount: number
  guidoAmount: number
  matiAmount: number
  billedBy: CashFlowBilledBy | ''
  category: string
  month: string
}

export type CashFlowClientsData = {
  pendingBilling: CashFlowClientMovement[]
  pendingCollection: CashFlowClientMovement[]
  recentCollections: CashFlowClientMovement[]
}

export type CashFlowBilledBy = 'Guido' | 'Mati' | 'Nadie'
export type CashFlowCashbox = 'Guido' | 'Mati'

export type CreateCashFlowClientInput = {
  date: string
  client: string
  work: string
  amount: number
  mode: 'pending' | 'collected'
  cashbox?: CashFlowCashbox
  billedBy?: CashFlowBilledBy | ''
}

export type MarkCashFlowClientCollectedInput = {
  row: number
  cashbox: CashFlowCashbox
}

export type MarkCashFlowClientBilledInput = {
  row: number
  billedBy: CashFlowBilledBy
}

export type CashFlowViewerData = {
  balanceText: string
  pendingCollectionAmount: number
  hasPendingCollection: boolean
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

async function updateCashFlowRange(range: string, values: unknown[][]) {
  const spreadsheetId = getCashFlowSpreadsheetId()
  const accessToken = await getCashFlowAccessToken(false)
  const data = await sheetsFetch<{ updatedRange?: string }>(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    accessToken,
    {
      method: 'PUT',
      body: JSON.stringify({ values }),
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )

  return data
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
  const pendingCollectionAmount = parseMoneyFromText(dashboardRows[0]?.[4])

  return {
    balanceText: dashboardRows[0]?.[0] || 'Sin balance disponible',
    pendingCollectionAmount,
    hasPendingCollection: pendingCollectionAmount > 0,
    months,
    billingChart: parseBillingChartRows(chartRows),
    partnerBillingChart: parsePartnerBillingRows(chartRows),
    partnerTotals: {
      mati: parseMoney(chartRows[15]?.[7]),
      guido: parseMoney(chartRows[15]?.[8]),
    },
  }
}

export async function getCashFlowClientsData(): Promise<CashFlowClientsData> {
  const rows = await getCashFlowRange('CashFlow!A2:L1000')
  const movements = parseClientMovementRows(rows)
  const pending = movements
    .filter((movement) => movement.pendingAmount > 0)
    .sort((a, b) => b.row - a.row)

  return {
    pendingBilling: pending.filter((movement) => !movement.billedBy),
    pendingCollection: pending.filter((movement) => movement.billedBy),
    recentCollections: movements
      .filter((movement) => movement.guidoAmount > 0 || movement.matiAmount > 0)
      .sort((a, b) => b.row - a.row)
      .slice(0, 20),
  }
}

export async function createCashFlowClientMovement(input: CreateCashFlowClientInput) {
  const row = await getFirstEmptyCashFlowRow()
  const billedBy = input.billedBy || ''
  const valuesAtoG = [[
    toSheetDate(input.date),
    input.client.trim(),
    input.work.trim(),
    input.mode === 'pending' ? input.amount : '',
    input.mode === 'collected' && input.cashbox === 'Guido' ? input.amount : '',
    input.mode === 'collected' && input.cashbox === 'Mati' ? input.amount : '',
    billedBy,
  ]]

  await Promise.all([
    updateCashFlowRange(`CashFlow!A${row}:G${row}`, valuesAtoG),
    updateCashFlowRange(`CashFlow!I${row}:I${row}`, [['Cliente']]),
  ])

  return { row }
}

export async function markCashFlowClientCollected(input: MarkCashFlowClientCollectedInput) {
  const [row] = await getCashFlowRange(`CashFlow!A${input.row}:L${input.row}`)
  const movement = parseClientMovementRow(row ?? [], input.row)

  if (!movement || movement.category !== 'Cliente' || movement.pendingAmount <= 0) {
    throw new Error('Ese cobro pendiente ya no está disponible.')
  }

  const values = [[
    '',
    input.cashbox === 'Guido' ? movement.pendingAmount : '',
    input.cashbox === 'Mati' ? movement.pendingAmount : '',
  ]]

  await updateCashFlowRange(`CashFlow!D${input.row}:F${input.row}`, values)

  return { row: input.row }
}

export async function markCashFlowClientBilled(input: MarkCashFlowClientBilledInput) {
  const [row] = await getCashFlowRange(`CashFlow!A${input.row}:L${input.row}`)
  const movement = parseClientMovementRow(row ?? [], input.row)

  if (!movement || movement.category !== 'Cliente' || movement.pendingAmount <= 0 || movement.billedBy) {
    throw new Error('Ese pendiente de facturación ya no está disponible.')
  }

  await updateCashFlowRange(`CashFlow!G${input.row}:G${input.row}`, [[input.billedBy]])

  return { row: input.row }
}

async function getFirstEmptyCashFlowRow() {
  const rows = await getCashFlowRange('CashFlow!A3:L1000')
  const index = rows.findIndex((row) => !hasEditableCashFlowValues(row))

  if (index === -1) {
    throw new Error('No quedan filas preparadas en CashFlow.')
  }

  return index + 3
}

async function sheetsFetch<T>(
  url: string,
  accessToken: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...init.headers,
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

function parseClientMovementRows(rows: string[][]) {
  return rows
    .slice(1)
    .map((row, index) => parseClientMovementRow(row, index + 3))
    .filter((movement): movement is CashFlowClientMovement => Boolean(movement))
}

function parseClientMovementRow(row: string[], rowNumber: number): CashFlowClientMovement | null {
  const category = row[8] ?? ''

  if (category !== 'Cliente') return null

  return {
    row: rowNumber,
    date: row[0] ?? '',
    client: row[1] ?? '',
    work: row[2] ?? '',
    pendingAmount: parseMoney(row[3]),
    guidoAmount: parseMoney(row[4]),
    matiAmount: parseMoney(row[5]),
    billedBy: isBilledBy(row[6]) ? row[6] : '',
    category,
    month: row[11] ?? '',
  }
}

function hasEditableCashFlowValues(row: string[]) {
  const editableIndexes = [0, 1, 2, 3, 4, 5, 6, 8]

  return editableIndexes.some((index) => String(row[index] ?? '').trim())
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

function parseMoneyFromText(value: unknown) {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return 0

  const match = value.match(/-?\$?\s*[\d.,]+/)

  return parseMoney(match?.[0])
}

function isBilledBy(value: unknown): value is CashFlowBilledBy {
  return value === 'Guido' || value === 'Mati' || value === 'Nadie'
}

function toSheetDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) return value

  return `${day}/${month}/${String(year).slice(-2)}`
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
