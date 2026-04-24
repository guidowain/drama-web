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
        {doubled.map((logo, i) => (
          <div
            key={i}
            className="shrink-0 flex items-center justify-center h-20 md:h-28"
          >
            {logo.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo.src} alt={logo.alt} className="h-16 md:h-24 w-auto object-contain" />
            ) : (
              <span className="text-white font-bold text-2xl md:text-4xl uppercase tracking-widest whitespace-nowrap">
                {logo.alt}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
