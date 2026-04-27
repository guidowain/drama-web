'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMenu } from '@/lib/MenuContext'
import type { SiteSettings } from '@/lib/types'

type Props = {
  settings: SiteSettings['settings']
}

export default function Header({ settings }: Props) {
  const { toggle } = useMenu()

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-16 md:h-[72px] flex items-center justify-between px-5 md:px-8"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
    >
      <Link href="/" className="shrink-0 relative h-7 w-[120px] block md:hidden" aria-label="Drama — Inicio">
        <Image
          src="/logos/Logo oficial.png"
          alt="Drama"
          fill
          className="object-contain object-left"
          priority
        />
      </Link>

      <Link href="/" className="group shrink-0 relative h-7 w-[120px] hidden md:block" aria-label="Drama — Inicio">
        <Image
          src="/logos/Logo oficial.png"
          alt="Drama"
          fill
          className="object-contain object-left transition-opacity duration-300 group-hover:opacity-0"
          priority
        />
        <Image
          src="/logos/Logo oficial invertido.png"
          alt=""
          fill
          className="object-contain object-left opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      </Link>

      <nav className="flex items-center gap-4 md:gap-5">
        <a
          href={settings.instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="text-white opacity-80 hover:opacity-100 transition-opacity"
        >
          <IconInstagram />
        </a>
        <a
          href={settings.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="text-white opacity-80 hover:opacity-100 transition-opacity"
        >
          <IconWhatsApp />
        </a>
        <a
          href={`mailto:${settings.mail}`}
          aria-label="Mail"
          className="text-white opacity-80 hover:opacity-100 transition-opacity"
        >
          <IconMail />
        </a>
        <button
          onClick={toggle}
          aria-label="Abrir menú"
          className="text-white opacity-80 hover:opacity-100 transition-opacity"
        >
          <IconMenu />
        </button>
      </nav>
    </header>
  )
}

function IconInstagram() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconWhatsApp() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.118 1.528 5.845L.057 23.882a.5.5 0 00.613.613l6.143-1.47A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.898 0-3.68-.524-5.202-1.435l-.372-.222-3.853.922.936-3.762-.243-.386A9.963 9.963 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  )
}

function IconMail() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="2,4 12,13 22,4" />
    </svg>
  )
}

function IconMenu() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}
