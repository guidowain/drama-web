'use client'

import Image from 'next/image'
import { useState } from 'react'

/**
 * Header propio de Drama Meet. La herramienta no cuelga de la web: no trae el
 * menú del sitio, solo la marca y los contactos.
 */
export default function MeetHeader() {
  const [hover, setHover] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-[72px] items-center justify-between px-5 backdrop-blur-[10px] sm:px-8" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <a
        href="https://drama.com.ar"
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-label="Drama"
        className="block h-[28px] w-[120px] shrink-0"
      >
        <span className="relative block h-[28px] w-[120px]">
          <Image
            src="/logos/Logo oficial.png"
            alt="Drama"
            width={120}
            height={28}
            priority
            className="absolute inset-0 h-[28px] w-[120px] object-contain object-left transition-opacity duration-300"
            style={{ opacity: hover ? 0 : 1 }}
          />
          <Image
            src="/logos/Logo oficial invertido.png"
            alt=""
            aria-hidden="true"
            width={120}
            height={28}
            className="absolute inset-0 h-[28px] w-[120px] object-contain object-left transition-opacity duration-300"
            style={{ opacity: hover ? 1 : 0 }}
          />
        </span>
      </a>

      <nav className="flex items-center gap-5">
        <a
          href="https://instagram.com/drama.com.ar"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="flex text-white opacity-80 transition-opacity hover:opacity-100"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
          </svg>
        </a>
        <a
          href="https://wa.me/5491163357223"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="flex text-white opacity-80 transition-opacity hover:opacity-100"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.118 1.528 5.845L.057 23.882a.5.5 0 00.613.613l6.143-1.47A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.898 0-3.68-.524-5.202-1.435l-.372-.222-3.853.922.936-3.762-.243-.386A9.963 9.963 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
          </svg>
        </a>
        <a
          href="mailto:los@drama.com.ar"
          aria-label="Mail"
          className="flex text-white opacity-80 transition-opacity hover:opacity-100"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <polyline points="2,4 12,13 22,4" />
          </svg>
        </a>
      </nav>
    </header>
  )
}
