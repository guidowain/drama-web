'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'

const navItems = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Home',
    href: '/admin/home',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'Proyectos',
    href: '/admin/proyectos',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    label: 'Nosotros',
    href: '/admin/nosotros',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Trivia',
    href: '/admin/trivia',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.1 9a3 3 0 1 1 5.8 1c-.8 1.2-2.4 1.6-2.9 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    label: 'Dramadle',
    href: '/admin/dramadle',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
        <path d="M7 15h.01M12 15h.01M17 15h.01" />
      </svg>
    ),
  },
  {
    label: 'Ajustes',
    href: '/admin/ajustes',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

const toolItems = [
  {
    label: 'Cash Flow',
    href: '/admin/cash-flow',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 15l4-4 3 3 5-7" />
      </svg>
    ),
  },
  {
    label: 'Presupuestador',
    href: '/admin/presupuestador',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
        <path d="M9 9h1" />
      </svg>
    ),
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <aside className="fixed inset-x-0 bottom-0 z-40 flex max-w-full shrink-0 flex-col border-t border-white/10 bg-zinc-950/95 shadow-[0_-18px_40px_rgba(0,0,0,0.35)] backdrop-blur md:sticky md:top-0 md:h-screen md:w-56 md:border-r md:border-t-0 md:bg-zinc-950 md:shadow-none md:backdrop-blur-none">
      {/* Gradient accent stripe */}
      <div className="h-[3px] gradient-bg shrink-0" />

      {/* Logo */}
      <div className="hidden border-b border-white/5 px-5 py-4 md:block">
        <Link href="/" target="_blank" className="block hover:opacity-70 transition-opacity">
          <Image
            src="/logos/Logo ByN invertido.png"
            alt="Drama"
            width={80}
            height={22}
            className="h-[22px] w-auto object-contain"
          />
        </Link>
        <p className="text-white/25 text-[10px] font-medium uppercase tracking-widest mt-1.5">
          Admin
        </p>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 gap-2 overflow-x-auto px-3 py-2 [scrollbar-width:none] md:block md:space-y-0.5 md:overflow-visible md:px-2.5 md:py-3 [&::-webkit-scrollbar]:hidden">
        {navItems.map((item) => {
          const isActive = item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`order-3 flex min-w-[4.75rem] flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-center text-[10px] font-bold transition-all md:order-none md:min-w-0 md:flex-row md:justify-start md:gap-2.5 md:px-3 md:text-left md:text-sm md:font-medium ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-white/40'}>{item.icon}</span>
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          )
        })}

        <div className="order-2 my-2 hidden w-px shrink-0 bg-white/10 md:order-none md:my-3 md:block md:h-px md:w-auto md:bg-white/5" />

        {toolItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`order-1 flex min-w-[6.9rem] flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-center text-[10px] font-black uppercase tracking-wide transition-all md:order-none md:min-w-0 md:flex-row md:justify-start md:gap-2.5 md:px-3 md:text-left md:text-sm ${
                isActive
                  ? 'gradient-bg text-black'
                  : 'border border-white/10 bg-white/[0.03] text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{item.icon}</span>
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          )
        })}

        <Link
          href="/"
          target="_blank"
          className="order-4 flex min-w-[4.75rem] flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-center text-[10px] font-bold text-white/40 transition-all hover:bg-white/5 hover:text-white md:hidden"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          <span className="max-w-full truncate">Ver sitio</span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="order-4 flex min-w-[4.75rem] flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-center text-[10px] font-bold text-white/40 transition-all hover:bg-white/5 hover:text-white md:hidden"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="max-w-full truncate">Salir</span>
        </button>
      </nav>

      {/* Ver sitio */}
      <div className="hidden px-2.5 pb-2 md:block">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Ver sitio
        </Link>
      </div>

      {/* Logout */}
      <div className="hidden border-t border-white/5 px-2.5 py-3 md:block">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-white/30 hover:text-white hover:bg-white/5 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
