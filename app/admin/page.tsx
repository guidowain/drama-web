import Link from 'next/link'
import { getProjects } from '@/lib/api'

const cards = [
  {
    label: 'Home',
    href: '/admin/home',
    desc: 'Hero, servicios, logos y contacto',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'Proyectos',
    href: '/admin/proyectos',
    desc: 'Crear, editar y publicar proyectos',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    label: 'Sobre Nosotros',
    href: '/admin/sobre-nosotros',
    desc: 'Quiénes somos, imagen y equipo',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Ajustes',
    href: '/admin/ajustes',
    desc: 'Redes sociales y contacto',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

export default async function AdminDashboard() {
  const projects = await getProjects()
  const published = projects.filter((p) => p.published).length
  const drafts = projects.length - published

  return (
    <div className="p-8 md:p-12">
      <div className="mb-10">
        <h1 className="text-white font-black text-4xl uppercase tracking-tight mb-1">Dashboard</h1>
        <p className="text-white/30 text-sm">Bienvenido al panel de administración de Drama.</p>
      </div>

      <div className="flex gap-5 mb-10">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group block bg-zinc-900 hover:bg-zinc-800/80 border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-200"
          >
            <div className="text-white/50 group-hover:text-white transition-colors mb-4">
              {card.icon}
            </div>
            <h2 className="text-white font-black text-lg uppercase tracking-tight mb-1">
              {card.label}
            </h2>
            <p className="text-white/30 text-sm leading-relaxed">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
