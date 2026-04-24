'use client'

import type { Logo } from '@/lib/types'

type Props = {
  logos: Logo[]
}

export default function LogosTicker({ logos }: Props) {
  if (!logos.length) return null

  const minVisibleItems = 10
  const trackLogos =
    logos.length >= minVisibleItems
      ? logos
      : Array.from({ length: Math.ceil(minVisibleItems / logos.length) }, () => logos).flat()
  const doubled = [...trackLogos, ...trackLogos]

  return (
    <div className="overflow-hidden py-10 md:py-14 bg-black border-y border-white/10">
      <div className="ticker-track-logos gap-12 md:gap-20 px-6 md:px-8">
        {doubled.map((logo, i) => {
          const scale = Math.min((logo.scale ?? 1) * 72, 100)

          return (
            <div
              key={i}
              className="shrink-0 inline-flex h-[84px] md:h-[124px] items-center justify-center px-3 md:px-4"
            >
              {logo.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="block w-auto h-auto max-h-full object-contain max-w-[180px] md:max-w-[320px]"
                  style={{
                    height: `${scale}%`,
                  }}
                />
              ) : (
                <span className="max-w-full text-center text-white font-bold text-xl md:text-3xl uppercase tracking-[0.2em] leading-none">
                  {logo.alt}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
