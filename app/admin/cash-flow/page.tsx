import { getCashFlowViewerData, type CashFlowDashboardMonth } from '@/lib/cash-flow-sheets'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Cash Flow — Drama Admin' }

export default async function AdminCashFlowPage() {
  const data = await getCashFlowViewerData()
  const latest = data.latestMonth
  const chartMax = Math.max(...data.billingChart.map((item) => item.billing), 1)
  const partnerMax = Math.max(...data.partnerBillingChart.flatMap((item) => [item.mati, item.guido]), 1)
  const recentMonths = data.months.slice(-12).reverse()

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-white md:p-8 xl:p-10">
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/30">Herramienta interna</p>
          <h1 className="mt-1 text-3xl font-black uppercase tracking-tight text-white md:text-4xl">Cash Flow</h1>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/50">
          Actualizado {formatDateTime(data.updatedAt)}
        </div>
      </header>

      <section className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80">
        <div className="h-1.5 gradient-bg" />
        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)] lg:p-6">
          <div className="rounded-xl border border-white/10 bg-black/25 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Balance entre cajas</p>
            <p className="mt-4 text-3xl font-black leading-tight text-white md:text-4xl">{data.balanceText}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Facturación" value={money(latest?.billing)} detail={latest?.month ?? 'Sin mes'} tone="white" />
            <MetricCard label="Gasto" value={money(latest?.spending)} detail={latest?.month ?? 'Sin mes'} tone="rose" />
            <MetricCard label="Ganancia" value={money(latest?.profit)} detail={latest?.margin == null ? 'Margen s/d' : `${percent(latest.margin)} margen`} tone="emerald" />
            <MetricCard label="No facturado" value={money(latest?.notBilled)} detail={latest?.month ?? 'Sin mes'} tone="amber" />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <section className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 lg:p-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Gráfico</p>
              <h2 className="mt-1 text-xl font-black uppercase tracking-tight">Facturación últimos 12 meses</h2>
            </div>
            <p className="text-xs font-semibold text-white/35">Fuente: hoja Gráfico</p>
          </div>

          <div className="flex h-[330px] items-end gap-2 rounded-xl border border-white/5 bg-black/25 px-3 pb-4 pt-6 sm:gap-3 sm:px-5">
            {data.billingChart.map((item) => (
              <div key={item.month} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-3">
                <div className="flex h-[240px] w-full items-end">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-[#FE796D] via-[#FCC028] to-[#FED791] shadow-[0_0_22px_rgba(254,121,109,0.16)]"
                    style={{ height: `${Math.max(4, (item.billing / chartMax) * 100)}%` }}
                    title={`${item.month}: ${money(item.billing)}`}
                  />
                </div>
                <div className="w-full text-center">
                  <p className="truncate text-[11px] font-black text-white/70">{shortMonth(item.month)}</p>
                  <p className="mt-1 truncate text-[10px] text-white/35">{compactMoney(item.billing)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 lg:p-6">
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Gráfico</p>
            <h2 className="mt-1 text-xl font-black uppercase tracking-tight">Facturado por persona</h2>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3">
            <MetricCard label="Mati" value={money(data.partnerTotals.mati)} detail="Últimos 12 meses" tone="pink" />
            <MetricCard label="Guido" value={money(data.partnerTotals.guido)} detail="Últimos 12 meses" tone="orange" />
          </div>

          <div className="space-y-4 rounded-xl border border-white/5 bg-black/25 p-4">
            {data.partnerBillingChart.map((item) => (
              <div key={item.month}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                  <span className="font-black text-white/65">{shortMonth(item.month)}</span>
                  <span className="text-white/35">M {compactMoney(item.mati)} · G {compactMoney(item.guido)}</span>
                </div>
                <div className="grid gap-1.5">
                  <Bar value={item.mati} max={partnerMax} className="bg-[#F504FF]" />
                  <Bar value={item.guido} max={partnerMax} className="bg-[#FCC028]" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-white/10 bg-zinc-900/70 p-5 lg:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Dashboard</p>
            <h2 className="mt-1 text-xl font-black uppercase tracking-tight">Resumen mensual</h2>
          </div>
          <p className="text-xs font-semibold text-white/35">Últimos 12 meses</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                <th className="border-b border-white/10 px-3 py-3">Mes</th>
                <th className="border-b border-white/10 px-3 py-3 text-right">Facturación</th>
                <th className="border-b border-white/10 px-3 py-3 text-right">Gasto</th>
                <th className="border-b border-white/10 px-3 py-3 text-right">Margen</th>
                <th className="border-b border-white/10 px-3 py-3 text-right">Ganancia</th>
                <th className="border-b border-white/10 px-3 py-3 text-right">Mati</th>
                <th className="border-b border-white/10 px-3 py-3 text-right">Guido</th>
                <th className="border-b border-white/10 px-3 py-3 text-right">No facturado</th>
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
  tone: 'white' | 'rose' | 'emerald' | 'amber' | 'pink' | 'orange'
}) {
  const toneClass = {
    white: 'text-white',
    rose: 'text-rose-300',
    emerald: 'text-emerald-300',
    amber: 'text-amber-300',
    pink: 'text-fuchsia-300',
    orange: 'text-orange-200',
  }[tone]

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">{label}</p>
      <p className={`mt-3 truncate text-2xl font-black ${toneClass}`}>{value}</p>
      <p className="mt-1 text-xs font-semibold text-white/35">{detail}</p>
    </div>
  )
}

function SummaryRow({ month }: { month: CashFlowDashboardMonth }) {
  return (
    <tr className="text-white/75 transition-colors hover:bg-white/[0.03]">
      <td className="border-b border-white/5 px-3 py-3 font-black text-white">{month.month}</td>
      <td className="border-b border-white/5 px-3 py-3 text-right font-semibold">{money(month.billing)}</td>
      <td className="border-b border-white/5 px-3 py-3 text-right font-semibold text-rose-300">{money(month.spending)}</td>
      <td className="border-b border-white/5 px-3 py-3 text-right font-semibold">{month.margin === null ? '-' : percent(month.margin)}</td>
      <td className="border-b border-white/5 px-3 py-3 text-right font-black text-emerald-300">{money(month.profit)}</td>
      <td className="border-b border-white/5 px-3 py-3 text-right font-semibold">{money(month.billedByMati)}</td>
      <td className="border-b border-white/5 px-3 py-3 text-right font-semibold">{money(month.billedByGuido)}</td>
      <td className="border-b border-white/5 px-3 py-3 text-right font-semibold text-amber-300">{money(month.notBilled)}</td>
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(value))
}
