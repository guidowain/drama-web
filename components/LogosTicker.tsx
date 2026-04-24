'use client'

import type { Logo } from '@/lib/types'

type Props = {
  logos: Logo[]
}

export default function LogosTicker({ logos }: Props) {
  if (!logos.length) return null

  const minVisibleItems = 10
  const repeatedLogos: Logo[] = []

  while (repeatedLogos.length < minVisibleItems) {
    repeatedLogos.push(...logos)
  }

  const trackLogos = repeatedLogos.slice(0, minVisibleItems)
  const doubled = [...trackLogos, ...trackLogos]

  return (
    <div className="overflow-hidden py-10 md:py-14 bg-black border-y border-white/10">
      <div className="ticker-track-logos gap-12 md:gap-20 px-6 md:px-8">
        {doubled.map((logo, i) => {
          return (
            <div
              key={i}
              className="shrink-0 inline-flex w-[170px] md:w-[280px] h-[84px] md:h-[124px] items-center justify-center"
            >
              {logo.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="block max-w-full max-h-full w-auto h-auto object-contain"
                  style={{
                    transform: `scale(${logo.scale ?? 1})`,
                    transformOrigin: 'center',
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
