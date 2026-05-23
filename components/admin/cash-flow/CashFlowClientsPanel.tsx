'use client'

import { useMemo, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import type { CashFlowClientMovement, CashFlowClientsData } from '@/lib/cash-flow-sheets'

type Cashbox = 'Guido' | 'Mati'
type BilledBy = 'Guido' | 'Mati' | 'Nadie' | ''
type Mode = 'pending' | 'collected'

export default function CashFlowClientsPanel({ initialData }: { initialData: CashFlowClientsData }) {
  const [data, setData] = useState(initialData)
  const [selectedPending, setSelectedPending] = useState<CashFlowClientMovement | null>(null)
  const [selectedBilling, setSelectedBilling] = useState<CashFlowClientMovement | null>(null)
  const [cashbox, setCashbox] = useState<Cashbox>('Guido')
  const [billedBy, setBilledBy] = useState<BilledBy>('Nadie')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const pendingBillingTotal = useMemo(
    () => data.pendingBilling.reduce((total, movement) => total + movement.pendingAmount, 0),
    [data.pendingBilling]
  )
  const pendingCollectionTotal = useMemo(
    () => data.pendingCollection.reduce((total, movement) => total + movement.pendingAmount, 0),
    [data.pendingCollection]
  )

  function refresh() {
    return fetch('/api/admin/cash-flow/clientes', { cache: 'no-store' })
      .then((response) => response.json())
      .then((nextData: CashFlowClientsData) => setData(nextData))
  }

  function markCollected() {
    if (!selectedPending) return

    setError('')
    startTransition(async () => {
      const response = await fetch(`/api/admin/cash-flow/clientes/${selectedPending.row}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cashbox }),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(result.error || 'No se pudo marcar como cobrado.')
        return
      }

      setSelectedPending(null)
      await refresh()
    })
  }

  function markBilled() {
    if (!selectedBilling || !billedBy) return

    setError('')
    startTransition(async () => {
      const response = await fetch(`/api/admin/cash-flow/clientes/${selectedBilling.row}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billedBy }),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(result.error || 'No se pudo marcar como facturado.')
        return
      }

      setSelectedBilling(null)
      await refresh()
    })
  }

  async function createMovement(formData: FormData) {
    setError('')
    const mode = String(formData.get('mode')) as Mode
    const response = await fetch('/api/admin/cash-flow/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: formData.get('date'),
        client: formData.get('client'),
        work: formData.get('work'),
        amount: formData.get('amount'),
        mode,
        cashbox: formData.get('cashbox'),
        billedBy: formData.get('billedBy'),
      }),
    })
    const result = await response.json().catch(() => ({}))

    if (!response.ok) {
      setError(result.error || 'No se pudo crear el cobro.')
      return
    }

    setIsCreateOpen(false)
    await refresh()
  }

  return (
    <div className="grid min-h-0 gap-4 xl:grid-cols-3">
      <section className="min-h-0 rounded-xl border border-white/10 bg-zinc-900/70 p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight">Pendiente de facturación</h2>
            <p className="mt-1 text-sm font-semibold text-white/60">{money(pendingBillingTotal)}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="rounded-lg border border-white/10 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-950 transition hover:bg-zinc-200"
          >
            Nuevo cobro
          </button>
        </div>

        <div className="max-h-[calc(100vh-15rem)] min-h-[240px] overflow-auto pr-1">
          {data.pendingBilling.length ? (
            <div className="space-y-2">
              {data.pendingBilling.map((movement) => (
                <ClientMovementCard
                  key={movement.row}
                  movement={movement}
                  amount={movement.pendingAmount}
                  tone="gray"
                  actionLabel="Facturado"
                  onAction={() => {
                    setBilledBy('Nadie')
                    setSelectedBilling(movement)
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="Facturación al día" body="No hay clientes pendientes de aviso o factura." />
          )}
        </div>
      </section>

      <section className="min-h-0 rounded-xl border border-white/10 bg-zinc-900/70 p-4">
        <div className="mb-4">
          <h2 className="text-lg font-black uppercase tracking-tight">Pendiente de cobro</h2>
          <p className="mt-1 text-sm font-semibold text-amber-200">{money(pendingCollectionTotal)}</p>
        </div>

        <div className="max-h-[calc(100vh-15rem)] min-h-[240px] overflow-auto pr-1">
          {data.pendingCollection.length ? (
            <div className="space-y-2">
              {data.pendingCollection.map((movement) => (
                <ClientMovementCard
                  key={movement.row}
                  movement={movement}
                  amount={movement.pendingAmount}
                  tone="amber"
                  actionLabel="Marcar cobrado"
                  onAction={() => {
                    setCashbox('Guido')
                    setSelectedPending(movement)
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="Cobros al día" body="No hay clientes avisados pendientes de pago." />
          )}
        </div>
      </section>

      <section className="min-h-0 rounded-xl border border-white/10 bg-zinc-900/70 p-4">
        <div className="mb-4">
          <h2 className="text-lg font-black uppercase tracking-tight">Últimos cobros</h2>
        </div>

        <div className="max-h-[calc(100vh-15rem)] min-h-[240px] overflow-auto pr-1">
          {data.recentCollections.length ? (
            <div className="space-y-2">
              {data.recentCollections.map((movement) => {
                const collectedBy = movement.guidoAmount > 0 ? 'Guido' : 'Mati'
                const amount = movement.guidoAmount || movement.matiAmount

                return (
                  <ClientMovementCard
                    key={movement.row}
                    movement={movement}
                    amount={amount}
                    tone={collectedBy === 'Guido' ? 'orange' : 'pink'}
                    meta={`Caja ${collectedBy}`}
                  />
                )
              })}
            </div>
          ) : (
            <EmptyState title="Sin cobros" body="Todavía no hay cobros de clientes cargados." />
          )}
        </div>
      </section>

      {selectedPending ? (
        <Dialog title="Marcar cobrado" onClose={() => setSelectedPending(null)}>
          <div className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-black/25 p-3">
              <p className="text-sm font-black text-white">{selectedPending.client}</p>
              <p className="mt-1 text-sm text-white/50">{selectedPending.work || 'Sin obra'}</p>
              <p className="mt-3 text-2xl font-black text-amber-300">{money(selectedPending.pendingAmount)}</p>
            </div>

            <SegmentedCashbox value={cashbox} onChange={setCashbox} />

            {error ? <p className="text-sm font-semibold text-rose-300">{error}</p> : null}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setSelectedPending(null)} className="rounded-lg border border-white/10 px-3 py-2 text-sm font-black text-white/60 transition hover:text-white">
                Cancelar
              </button>
              <button type="button" onClick={markCollected} disabled={isPending} className="rounded-lg bg-white px-3 py-2 text-sm font-black text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50">
                {isPending ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </Dialog>
      ) : null}

      {selectedBilling ? (
        <Dialog title="Marcar facturado" onClose={() => setSelectedBilling(null)}>
          <div className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-black/25 p-3">
              <p className="text-sm font-black text-white">{selectedBilling.client}</p>
              <p className="mt-1 text-sm text-white/50">{selectedBilling.work || 'Sin obra'}</p>
              <p className="mt-3 text-2xl font-black text-zinc-200">{money(selectedBilling.pendingAmount)}</p>
            </div>

            <SegmentedBilledBy value={billedBy} onChange={setBilledBy} />

            {error ? <p className="text-sm font-semibold text-rose-300">{error}</p> : null}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setSelectedBilling(null)} className="rounded-lg border border-white/10 px-3 py-2 text-sm font-black text-white/60 transition hover:text-white">
                Cancelar
              </button>
              <button type="button" onClick={markBilled} disabled={isPending} className="rounded-lg bg-white px-3 py-2 text-sm font-black text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50">
                {isPending ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </Dialog>
      ) : null}

      {isCreateOpen ? (
        <CreateDialog
          error={error}
          isPending={isPending}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={(formData) => startTransition(() => void createMovement(formData))}
        />
      ) : null}
    </div>
  )
}

function ClientMovementCard({
  movement,
  amount,
  tone,
  meta,
  actionLabel,
  onAction,
}: {
  movement: CashFlowClientMovement
  amount: number
  tone: 'amber' | 'pink' | 'orange' | 'gray'
  meta?: string
  actionLabel?: string
  onAction?: () => void
}) {
  const toneClass = {
    amber: 'text-amber-300',
    pink: 'text-fuchsia-300',
    orange: 'text-orange-200',
    gray: 'text-zinc-300',
  }[tone]

  return (
    <article className="rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white">{movement.client}</p>
          <p className="mt-1 truncate text-sm font-semibold text-white/50">{movement.work || 'Sin obra'}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold uppercase tracking-wide text-white/35">
            <span>{movement.date}</span>
            {movement.billedBy ? <span>Facturado: {movement.billedBy}</span> : <span>Sin facturar</span>}
            {meta ? <span>{meta}</span> : null}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-lg font-black ${toneClass}`}>{money(amount)}</p>
          {actionLabel ? (
            <button type="button" onClick={onAction} className="mt-2 rounded-md bg-white px-2.5 py-1.5 text-xs font-black text-zinc-950 transition hover:bg-zinc-200">
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function CreateDialog({
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
  const [mode, setMode] = useState<Mode>('pending')
  const today = getArgentinaDateInputValue()

  return (
    <Dialog title="Nuevo cobro" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(new FormData(event.currentTarget))
        }}
        className="space-y-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Fecha">
            <input name="date" type="date" defaultValue={today} required className="admin-input" />
          </Field>
          <Field label="Monto">
            <input name="amount" type="number" min="1" step="1" required className="admin-input" />
          </Field>
        </div>

        <Field label="Cliente">
          <input name="client" required className="admin-input" />
        </Field>

        <Field label="Obra">
          <input name="work" className="admin-input" />
        </Field>

        <Field label="Estado">
          <select name="mode" value={mode} onChange={(event) => setMode(event.target.value as Mode)} className="admin-input">
            <option value="pending">A cobrar</option>
            <option value="collected">Cobrado</option>
          </select>
        </Field>

        {mode === 'collected' ? (
          <Field label="Caja">
            <select name="cashbox" className="admin-input">
              <option value="Guido">Caja Guido</option>
              <option value="Mati">Caja Mati</option>
            </select>
          </Field>
        ) : null}

        <Field label="Facturado por">
          <select name="billedBy" className="admin-input">
            <option value="">Sin facturar</option>
            <option value="Nadie">Nadie</option>
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

function SegmentedCashbox({ value, onChange }: { value: Cashbox; onChange: (value: Cashbox) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(['Guido', 'Mati'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-lg border px-3 py-2 text-sm font-black transition ${
            value === option
              ? 'border-emerald-300/40 bg-emerald-300/10 text-emerald-200'
              : 'border-white/10 bg-black/25 text-white/55 hover:text-white'
          }`}
        >
          Caja {option}
        </button>
      ))}
    </div>
  )
}

function SegmentedBilledBy({ value, onChange }: { value: BilledBy; onChange: (value: BilledBy) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {(['Guido', 'Mati', 'Nadie'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-lg border px-3 py-2 text-sm font-black transition ${
            value === option
              ? 'border-amber-300/40 bg-amber-300/10 text-amber-200'
              : 'border-white/10 bg-black/25 text-white/55 hover:text-white'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
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
