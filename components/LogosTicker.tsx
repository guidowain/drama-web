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
  const shifted = [...trackLogos.slice(Math.ceil(trackLogos.length / 2)), ...trackLogos.slice(0, Math.ceil(trackLogos.length / 2))]
  const doubledShifted = [...shifted, ...shifted]

  const renderLogo = (logo: Logo, i: number) => {
    const scale = Math.min((logo.scale ?? 1) * 72, 100)

    return (
      <div
        key={i}
        className="shrink-0 inline-flex h-[72px] items-center justify-center px-3 md:h-[124px] md:px-4"
      >
        {logo.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo.src}
            alt={logo.alt}
            className="block w-auto h-auto max-h-full object-contain max-w-[160px] md:max-w-[320px]"
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
  }

  return (
    <div className="overflow-hidden py-8 md:py-14 bg-black border-y border-white/10">
      <div className="ticker-track-logos gap-12 md:gap-20 px-6 md:px-8">
        {doubled.map(renderLogo)}
      </div>
      <div className="ticker-track-logos ticker-track-logos-alt mt-5 gap-12 px-6 md:hidden">
        {doubledShifted.map(renderLogo)}
      </div>
    </div>
  )
}
