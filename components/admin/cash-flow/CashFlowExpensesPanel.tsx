'use client'

import { useMemo, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import type { CashFlowCashbox, CashFlowExpenseCategory, CashFlowExpenseMovement, CashFlowExpensesData } from '@/lib/cash-flow-sheets'

type ExpenseConceptOption = {
  label: string
  custom?: boolean
}

const expenseConcepts: Record<CashFlowExpenseCategory, ExpenseConceptOption[]> = {
  Sueldos: [{ label: 'Sueldo Martu' }],
  Servicios: [
    { label: 'Google Suite' },
    { label: 'Adobe' },
    { label: 'Renovación de dominio' },
    { label: 'Otro', custom: true },
  ],
  Marketing: [
    { label: 'Publicidad Instagram' },
    { label: 'Otro', custom: true },
  ],
  Proveedores: [{ label: 'Proveedor', custom: true }],
}

const expenseCategories: CashFlowExpenseCategory[] = ['Sueldos', 'Servicios', 'Marketing', 'Proveedores']

export default function CashFlowExpensesPanel({ initialData }: { initialData: CashFlowExpensesData }) {
  const [data, setData] = useState(initialData)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function refresh() {
    return fetch('/api/admin/cash-flow/egresos', { cache: 'no-store' })
      .then((response) => response.json())
      .then((nextData: CashFlowExpensesData) => setData(nextData))
  }

  async function createExpense(formData: FormData) {
    setError('')
    const response = await fetch('/api/admin/cash-flow/egresos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: formData.get('date'),
        category: formData.get('category'),
        concept: formData.get('concept'),
        detail: formData.get('detail'),
        amount: formData.get('amount'),
        cashbox: formData.get('cashbox'),
      }),
    })
    const result = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(result.error || 'No se pudo crear el egreso.')
      return
    }

    setIsCreateOpen(false)
    await refresh()
  }

  return (
    <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(360px,0.7fr)_minmax(0,1.3fr)]">
      <section className="min-h-0 rounded-xl border border-white/10 bg-zinc-900/70 p-4">
        <div className="mb-4">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight">Mes actual</h2>
            <p className="mt-1 text-sm font-semibold text-rose-300">{money(data.total)}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 w-full rounded-lg border border-white/10 bg-white px-4 py-3 text-sm font-black uppercase tracking-wide text-zinc-950 transition hover:bg-zinc-200"
          >
            Nuevo egreso
          </button>
        </div>

        <div className="grid gap-2">
          {data.summaries.map((summary) => (
            <div key={summary.category} className="rounded-lg border border-white/10 bg-black/25 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-white">{summary.category}</p>
                </div>
                <p className="text-sm font-black text-rose-300">{money(summary.total)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="min-h-0 rounded-xl border border-white/10 bg-zinc-900/70 p-4">
        <div className="mb-4">
          <h2 className="text-lg font-black uppercase tracking-tight">Últimos egresos</h2>
        </div>

        <div className="max-h-[calc(100vh-15rem)] min-h-[240px] overflow-auto pr-1">
          {data.recentExpenses.length ? (
            <div className="space-y-2">
              {data.recentExpenses.map((expense) => (
                <ExpenseCard key={expense.row} expense={expense} />
              ))}
            </div>
          ) : (
            <EmptyState title="Sin egresos" body="Todavía no hay egresos cargados." />
          )}
        </div>
      </section>

      {isCreateOpen ? (
        <CreateExpenseDialog
          error={error}
          isPending={isPending}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={(formData) => startTransition(() => void createExpense(formData))}
        />
      ) : null}
    </div>
  )
}

function ExpenseCard({ expense }: { expense: CashFlowExpenseMovement }) {
  const paidBy = getPaidByLabel(expense)

  return (
    <article className="rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white">{expense.concept}</p>
          <p className="mt-1 truncate text-sm font-semibold text-white/50">{expense.detail || expense.category}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold uppercase tracking-wide text-white/35">
            <span>{expense.date}</span>
            <span>{expense.category}</span>
            <span>{paidBy}</span>
          </div>
        </div>
        <p className="shrink-0 text-lg font-black text-rose-300">{money(expense.amount)}</p>
      </div>
    </article>
  )
}

function getPaidByLabel(expense: CashFlowExpenseMovement) {
  if (expense.guidoAmount < 0 && expense.matiAmount < 0) return 'Pagaron Guido y Mati'
  if (expense.guidoAmount < 0) return 'Pagó Guido'
  if (expense.matiAmount < 0) return 'Pagó Mati'

  return 'Sin caja'
}

function CreateExpenseDialog({
  error,
  isPending,
  onClose,
  onSubmit,
}: {
  error: string
  isPending: boolean
  onClose: () => void
  onSubmit: (formData: FormData) => void
}) {
  const [category, setCategory] = useState<CashFlowExpenseCategory>('Sueldos')
  const [selectedConcept, setSelectedConcept] = useState(expenseConcepts.Sueldos[0].label)
  const [customConcept, setCustomConcept] = useState('')
  const today = getArgentinaDateInputValue()
  const concepts = expenseConcepts[category]
  const selectedOption = concepts.find((option) => option.label === selectedConcept) ?? concepts[0]
  const finalConcept = selectedOption.custom ? customConcept : selectedOption.label

  function updateCategory(nextCategory: CashFlowExpenseCategory) {
    setCategory(nextCategory)
    setSelectedConcept(expenseConcepts[nextCategory][0].label)
    setCustomConcept('')
  }

  return (
    <Dialog title="Nuevo egreso" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(new FormData(event.currentTarget))
        }}
        className="space-y-4"
      >
        <input type="hidden" name="concept" value={finalConcept} />

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Fecha">
            <input name="date" type="date" defaultValue={today} required className="admin-input" />
          </Field>
          <Field label="Monto">
            <input name="amount" type="number" min="1" step="1" required className="admin-input" />
          </Field>
        </div>

        <Field label="Categoría">
          <select
            name="category"
            value={category}
            onChange={(event) => updateCategory(event.target.value as CashFlowExpenseCategory)}
            className="admin-input"
          >
            {expenseCategories.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </Field>

        {category === 'Proveedores' ? (
          <Field label="Proveedor">
            <input value={customConcept} onChange={(event) => setCustomConcept(event.target.value)} required className="admin-input" />
          </Field>
        ) : (
          <Field label="Concepto">
            <select value={selectedConcept} onChange={(event) => setSelectedConcept(event.target.value)} className="admin-input">
              {concepts.map((option) => (
                <option key={option.label} value={option.label}>{option.label}</option>
              ))}
            </select>
          </Field>
        )}

        {selectedOption.custom && category !== 'Proveedores' ? (
          <Field label="Nombre del concepto">
            <input value={customConcept} onChange={(event) => setCustomConcept(event.target.value)} required className="admin-input" />
          </Field>
        ) : null}

        <Field label="Detalle">
          <input name="detail" className="admin-input" />
        </Field>

        <Field label="Pagó">
          <select name="cashbox" className="admin-input">
            <option value="Guido">Guido</option>
            <option value="Mati">Mati</option>
          </select>
        </Field>

        {error ? <p className="text-sm font-semibold text-rose-300">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-3 py-2 text-sm font-black text-white/60 transition hover:text-white">
            Cancelar
          </button>
          <button type="submit" disabled={isPending} className="rounded-lg bg-white px-3 py-2 text-sm font-black text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50">
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-zinc-950 p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-black uppercase tracking-tight">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-md border border-white/10 px-2 py-1 text-sm font-black text-white/60 hover:text-white">
            Cerrar
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-white/35">{label}</span>
      {children}
    </label>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-white/10 bg-black/20 p-6 text-center">
      <p className="text-lg font-black text-emerald-300">{title}</p>
      <p className="mt-2 text-sm font-semibold text-white/45">{body}</p>
    </div>
  )
}

function money(value?: number | null) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value ?? 0)
}

function getArgentinaDateInputValue() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  return year && month && day ? `${year}-${month}-${day}` : new Date().toISOString().slice(0, 10)
}
