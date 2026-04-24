import type { Logo } from '@/lib/types'

type Props = {
  logos: Logo[]
}

export default function LogosTicker({ logos }: Props) {
  const doubled = [...logos, ...logos]

  return (
    <div className="overflow-hidden py-8 md:py-10 bg-black border-y border-white/10">
      <div className="ticker-track-logos gap-16 md:gap-24 px-8">
        {doubled.map((logo, i) => (
          <div
            key={i}
            className="shrink-0 flex items-center justify-center h-10"
            style={{ filter: 'grayscale(1)', opacity: 0.6 }}
          >
            {logo.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo.src} alt={logo.alt} className="h-8 md:h-10 object-contain" />
            ) : (
              <span className="text-white font-bold text-lg md:text-xl uppercase tracking-widest whitespace-nowrap">
                {logo.alt}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
