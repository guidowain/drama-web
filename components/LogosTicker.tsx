import type { Logo } from '@/lib/types'

type Props = {
  logos: Logo[]
}

export default function LogosTicker({ logos }: Props) {
  const doubled = [...logos, ...logos]

  return (
    <div className="overflow-hidden py-10 md:py-14 bg-black border-y border-white/10">
      <div className="ticker-track-logos gap-20 md:gap-28 px-10">
        {doubled.map((logo, i) => (
          <div
            key={i}
            className="shrink-0 flex items-center justify-center h-16 md:h-24"
          >
            {logo.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo.src} alt={logo.alt} className="h-14 md:h-20 w-auto object-contain" />
            ) : (
              <span className="text-white font-bold text-xl md:text-3xl uppercase tracking-widest whitespace-nowrap">
                {logo.alt}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
