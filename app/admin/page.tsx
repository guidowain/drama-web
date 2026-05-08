import { getProjects } from '@/lib/api'
import { getAnalyticsSummary } from '@/lib/google-analytics'

export default async function AdminDashboard() {
  const projects = await getProjects()
  const analytics = await getAnalyticsSummary()
  const published = projects.filter((p) => p.published).length
  const drafts = projects.length - published

  return (
    <div className="p-8 md:p-12">
      <div className="mb-10">
        <h1 className="text-white font-black text-4xl uppercase tracking-tight mb-1">Dashboard</h1>
        <p className="text-white/30 text-sm">Bienvenido al panel de administración de Drama.</p>
      </div>

      <div className="flex flex-wrap gap-5 mb-10">
        <div className="bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 min-w-[120px]">
          <p className="text-white font-black text-3xl">{projects.length}</p>
          <p className="text-white/30 text-xs uppercase tracking-widest mt-0.5">Proyectos</p>
        </div>
        <div className="bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 min-w-[120px]">
          <p className="text-green-400 font-black text-3xl">{published}</p>
          <p className="text-white/30 text-xs uppercase tracking-widest mt-0.5">Publicados</p>
        </div>
        <div className="bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 min-w-[120px]">
          <p className="text-white/50 font-black text-3xl">{drafts}</p>
          <p className="text-white/30 text-xs uppercase tracking-widest mt-0.5">Borradores</p>
        </div>
      </div>

      <section className="max-w-6xl overflow-hidden rounded-2xl border border-white/5 bg-zinc-900">
        <div className="h-1 bg-gradient-to-r from-[#F504FF] via-[#FE796D] to-[#FCC028]" />
        <div className="p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-white font-black text-xl uppercase tracking-tight">Analytics</h2>
            <p className="text-white/30 text-sm">Tráfico e interacciones del sitio.</p>
          </div>
          {analytics.configured ? (
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-300">
              Conectado
            </span>
          ) : (
            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-300">
              Pendiente
            </span>
          )}
        </div>

        {analytics.error ? (
          <div className="rounded-xl border border-white/5 bg-black/20 p-4">
            <p className="text-sm text-white/65">{analytics.error}</p>
            {analytics.serviceAccountEmail ? (
              <p className="mt-3 text-xs text-white/35">
                Service account: <span className="font-mono text-white/55">{analytics.serviceAccountEmail}</span>
              </p>
            ) : null}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <AnalyticsStat label="Usuarios" value={formatNumber(analytics.metrics.activeUsers)} />
              <AnalyticsStat label="Sesiones" value={formatNumber(analytics.metrics.sessions)} />
              <AnalyticsStat label="Vistas" value={formatNumber(analytics.metrics.screenPageViews)} />
              <AnalyticsStat label="Tiempo prom." value={formatDuration(analytics.metrics.averageSessionDuration)} />
              <AnalyticsStat label="Interacciones" value={formatNumber(analytics.metrics.eventCount)} />
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <VisitPeriodCard
                label="Vistas del día"
                value={analytics.visits.today}
              />
              <VisitPeriodCard
                label="Vistas de la semana"
                value={analytics.visits.week}
              />
              <VisitPeriodCard
                label="Vistas del mes"
                value={analytics.visits.month}
              />
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-3">
              <AnalyticsList
                title="Páginas más visitadas"
                empty="Todavía no hay páginas para mostrar."
                items={analytics.topPages.map((page) => ({
                  label: pageLabel(page.path),
                  value: formatNumber(page.views),
                }))}
              />
              <AnalyticsList
                title="Interacciones"
                empty="Todavía no hay interacciones para mostrar."
                items={analytics.events.map((event) => ({
                  label: interactionLabel(event.name),
                  value: formatNumber(event.count),
                }))}
              />
              <AnalyticsList
                title="Proyectos abiertos"
                empty="Registrá project_slug como dimensión personalizada en GA4 para ver este ranking."
                items={analytics.projects.map((project) => ({
                  label: projectLabel(project.name),
                  value: formatNumber(project.opens),
                }))}
              />
            </div>
          </>
        )}
        </div>
      </section>
    </div>
  )
}

function AnalyticsStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 px-4 py-3">
      <p className="text-white font-black text-2xl">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/30">{label}</p>
    </div>
  )
}

function VisitPeriodCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-5">
      <p className="text-[11px] font-black uppercase tracking-widest text-white/35">{label}</p>
      <p className="mt-3 text-4xl font-black leading-none text-white">{formatNumber(value)}</p>
    </div>
  )
}

function AnalyticsList({
  title,
  empty,
  items,
}: {
  title: string
  empty: string
  items: Array<{ label: string; detail?: string; value: string }>
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-4">
      <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-white/45">{title}</h3>
      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={`${item.label}-${item.value}`} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white/80">{item.label}</p>
                {item.detail ? <p className="truncate text-xs text-white/30">{item.detail}</p> : null}
              </div>
              <p className="shrink-0 text-sm font-black text-white">{item.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-white/35">{empty}</p>
      )}
    </div>
  )
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(value)
}

function formatDuration(seconds: number) {
  if (!seconds) return '0s'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)

  if (!minutes) return `${remainingSeconds}s`
  return `${minutes}m ${remainingSeconds}s`
}

function pageLabel(path: string) {
  const labels: Record<string, string> = {
    '/': 'Home',
    '/home': 'Home',
    '/proyectos': 'Proyectos',
    '/sobre-nosotros': 'Sobre nosotros',
    '/sumate': 'Sumate',
    '/calculadora': 'Calculadora',
  }

  return labels[path] ?? (path.replace(/^\//, '').replace(/-/g, ' ') || 'Home')
}

function interactionLabel(name: string) {
  const labels: Record<string, string> = {
    fan_mode_open: 'Aperturas de Fun Mode',
    project_modal_open: 'Aperturas de proyectos',
  }

  return labels[name] ?? name
}

function projectLabel(slug: string) {
  return slug.replace(/-/g, ' ')
}
