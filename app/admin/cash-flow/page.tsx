import { getCashFlowViewerData, type CashFlowDashboardMonth } from '@/lib/cash-flow-sheets'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Cash Flow — Drama Admin' }

export default async function AdminCashFlowPage() {
  const data = await getCashFlowViewerData()
  const latest = data.months.at(-1) ?? null
  const chartMax = Math.max(...data.billingChart.map((item) => item.billing), 1)
  const notBilledTotal = data.months.slice(-12).reduce((total, month) => total + month.notBilled, 0)
  const partnerTotal = data.partnerTotals.mati + data.partnerTotals.guido + notBilledTotal
  const partnerDifference = Math.abs(data.partnerTotals.mati - data.partnerTotals.guido)
  const leadingPartner = data.partnerTotals.mati > data.partnerTotals.guido ? 'Mati' : 'Guido'
  const recentMonths = data.months.slice(-3).reverse()

  return (
    <div className="min-h-screen bg-zinc-950 p-4 text-white md:h-screen md:overflow-hidden md:p-5 xl:p-6">
      <header className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/30">Herramienta interna</p>
          <h1 className="mt-0.5 text-2xl font-black uppercase tracking-tight text-white md:text-3xl">Cash Flow</h1>
        </div>
      </header>

      <div className="grid gap-4 md:h-[calc(100vh-6.5rem)] md:grid-rows-[auto_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900/80">
          <div className="h-1 gradient-bg" />
          <div className="grid gap-3 p-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,2fr)]">
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Balance entre cajas</p>
              <p className="mt-2 text-2xl font-black leading-tight text-white md:text-3xl">{data.balanceText}</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Facturación" value={money(latest?.billing)} detail={latest?.month ?? 'Sin mes'} tone="white" />
              <MetricCard label="Gasto" value={money(latest?.spending)} detail={latest?.month ?? 'Sin mes'} tone="rose" />
              <MetricCard label="Ganancia" value={money(latest?.profit)} detail={latest?.margin == null ? 'Margen s/d' : `${percent(latest.margin)} margen`} tone="emerald" />
              <MetricCard label="Margen" value={latest?.margin == null ? '-' : percent(latest.margin)} detail={latest?.month ?? 'Sin mes'} tone="amber" />
            </div>
          </div>
        </section>

        <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <section className="min-h-0 rounded-xl border border-white/10 bg-zinc-900/70 p-4">
            <div className="mb-3">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Gráfico</p>
              <h2 className="mt-0.5 text-lg font-black uppercase tracking-tight">Facturación últimos 12 meses</h2>
            </div>

            <div className="flex h-[260px] items-end gap-2 rounded-lg border border-white/5 bg-black/25 px-3 pb-3 pt-4 sm:gap-3 sm:px-4">
              {data.billingChart.map((item) => (
                <div key={item.month} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <div className="flex h-[190px] w-full items-end">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-[#FE796D] via-[#FCC028] to-[#FED791] shadow-[0_0_22px_rgba(254,121,109,0.16)]"
                      style={{ height: `${Math.max(4, (item.billing / chartMax) * 100)}%` }}
                      title={`${item.month}: ${money(item.billing)}`}
                    />
                  </div>
                  <div className="w-full text-center">
                    <p className="truncate text-[10px] font-black text-white/70">{shortMonth(item.month)}</p>
                    <p className="mt-0.5 truncate text-[10px] text-white/35">{compactMoney(item.billing)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="min-h-0 rounded-xl border border-white/10 bg-zinc-900/70 p-4">
            <div className="mb-3">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Gráfico</p>
              <h2 className="mt-0.5 text-lg font-black uppercase tracking-tight">Facturado por persona</h2>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <MetricCard label="Mati" value={money(data.partnerTotals.mati)} detail="12 meses" tone="pink" />
              <MetricCard label="Guido" value={money(data.partnerTotals.guido)} detail="12 meses" tone="orange" />
              <MetricCard label="Sin factura" value={money(notBilledTotal)} detail="12 meses" tone="gray" />
            </div>

            <div className="mt-3 rounded-lg border border-white/5 bg-black/25 p-3">
              <div className="mb-2 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.16em] text-white/35">
                <span>Mati</span>
                <span>Sin factura</span>
                <span>Guido</span>
              </div>
              <div className="flex h-5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-[#F504FF]"
                  style={{ width: `${partnerTotal ? (data.partnerTotals.mati / partnerTotal) * 100 : 0}%` }}
                />
                <div
                  className="h-full bg-zinc-500"
                  style={{ width: `${partnerTotal ? (notBilledTotal / partnerTotal) * 100 : 0}%` }}
                />
                <div
                  className="h-full bg-[#FCC028]"
                  style={{ width: `${partnerTotal ? (data.partnerTotals.guido / partnerTotal) * 100 : 0}%` }}
                />
              </div>
              <p className="mt-3 text-sm font-semibold text-white/55">
                {partnerDifference ? `${leadingPartner} lleva ${money(partnerDifference)} más facturado en el período.` : 'Están empatados en facturación.'}
              </p>
            </div>
          </section>

          <section className="min-h-0 rounded-xl border border-white/10 bg-zinc-900/70 p-4 xl:col-span-2">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Dashboard</p>
                <h2 className="mt-0.5 text-lg font-black uppercase tracking-tight">Resumen mensual</h2>
              </div>
              <p className="text-xs font-semibold text-white/35">Últimos 3 meses</p>
            </div>

            <div className="max-h-[calc(100vh-33rem)] min-h-[160px] overflow-auto">
              <table className="w-full min-w-[860px] border-separate border-spacing-0 text-sm">
                <thead className="sticky top-0 z-10 bg-zinc-900">
                  <tr className="text-left text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                    <th className="border-b border-white/10 px-3 py-2">Mes</th>
                    <th className="border-b border-white/10 px-3 py-2 text-right">Facturación</th>
                    <th className="border-b border-white/10 px-3 py-2 text-right">Gasto</th>
                    <th className="border-b border-white/10 px-3 py-2 text-right">Margen</th>
                    <th className="border-b border-white/10 px-3 py-2 text-right">Ganancia</th>
                    <th className="border-b border-white/10 px-3 py-2 text-right">Mati</th>
                    <th className="border-b border-white/10 px-3 py-2 text-right">Guido</th>
                    <th className="border-b border-white/10 px-3 py-2 text-right">No facturado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMonths.map((month) => (
                    <SummaryRow key={month.month} month={month} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string
  value: string
  detail: string
  tone: 'white' | 'rose' | 'emerald' | 'amber' | 'pink' | 'orange' | 'gray'
}) {
  const toneClass = {
    white: 'text-white',
    rose: 'text-rose-300',
    emerald: 'text-emerald-300',
    amber: 'text-amber-300',
    pink: 'text-fuchsia-300',
    orange: 'text-orange-200',
    gray: 'text-zinc-300',
  }[tone]

  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/30">{label}</p>
      <p className={`mt-2 truncate text-xl font-black ${toneClass}`}>{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold text-white/35">{detail}</p>
    </div>
  )
}

function SummaryRow({ month }: { month: CashFlowDashboardMonth }) {
  return (
    <tr className="text-white/75 transition-colors hover:bg-white/[0.03]">
      <td className="border-b border-white/5 px-3 py-2 font-black text-white">{month.month}</td>
      <td className="border-b border-white/5 px-3 py-2 text-right font-semibold">{money(month.billing)}</td>
      <td className="border-b border-white/5 px-3 py-2 text-right font-semibold text-rose-300">{money(month.spending)}</td>
      <td className="border-b border-white/5 px-3 py-2 text-right font-semibold">{month.margin === null ? '-' : percent(month.margin)}</td>
      <td className="border-b border-white/5 px-3 py-2 text-right font-black text-emerald-300">{money(month.profit)}</td>
      <td className="border-b border-white/5 px-3 py-2 text-right font-semibold">{money(month.billedByMati)}</td>
      <td className="border-b border-white/5 px-3 py-2 text-right font-semibold">{money(month.billedByGuido)}</td>
      <td className="border-b border-white/5 px-3 py-2 text-right font-semibold text-amber-300">{money(month.notBilled)}</td>
    </tr>
  )
}

function Bar({ value, max, className }: { value: number; max: number; className: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full ${className}`}
        style={{ width: `${Math.max(value > 0 ? 3 : 0, (value / max) * 100)}%` }}
      />
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

function compactMoney(value: number) {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })}M`
  }

  return `$${Math.round(value / 1000).toLocaleString('es-AR')}k`
}

function percent(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(value)
}

function shortMonth(value: string) {
  const [year, month] = value.split('-')
  return `${month?.padStart(2, '0')}/${year?.slice(-2)}`
}
