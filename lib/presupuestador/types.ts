export type BudgetModality = 'monthly' | 'staged-monthly' | 'fixed'
export type BudgetCurrency = 'ARS' | 'USD'

export type ServiceItem = {
  id: string
  label: string
  free?: boolean
  source: 'catalog' | 'custom'
  mergedFrom?: string[]
}

export type AdjustmentClause =
  | { type: 'bimonthly-ipc'; untilSeasonEnd: boolean }
  | { type: 'monthly-ipc' }
  | { type: 'none' }
  | { type: 'custom'; text: string }

export type PaymentClause =
  | { type: 'monthly-1-5' }
  | { type: 'deposit'; percentage: number }
  | { type: 'on-delivery' }
  | { type: 'custom'; text: string }

export type BudgetConditions = {
  validity: { type: 'days' | 'date'; value: number | string }
  payment: PaymentClause
  adjustment: AdjustmentClause
  delayClause: boolean
}

export type MonthlyInvestment =
  | { type: 'monthly-total'; total: number }
  | { type: 'monthly-breakdown'; rows: InvestmentRow[] }

export type FixedInvestment = {
  type: 'fixed-options'
  options: { id: string; label: string; amount: number }[]
}

export type StageInvestment = {
  type: 'stages'
  stages: BudgetStage[]
}

export type InvestmentRow = {
  id: string
  service: string
  modality: string
  fee: number
}

export type BudgetStage = {
  id: string
  name: string
  startMonth: string
  endMonth: string
  description?: string
  services: string[]
  monthlyFee: number
}

export type BudgetDraft = {
  id: string
  status: 'draft' | 'generated'
  modality: BudgetModality
  currency: BudgetCurrency
  date: string
  client: { name: string; company?: string }
  projectName: string
  opening?: string
  understanding?: string
  services: ServiceItem[]
  notIncluded?: string[]
  investment: MonthlyInvestment | FixedInvestment | StageInvestment
  deliveryNote?: string
  conditions: BudgetConditions
  extras?: string
  createdAt: string
  updatedAt: string
}

export type ServiceCategory = {
  id: string
  name: string
  services: { id: string; label: string }[]
}
