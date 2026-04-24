'use client'

import { useState } from 'react'
import type { Logo } from '@/lib/types'

type Props = {
  logos: Logo[]
}

export default function LogosTicker({ logos }: Props) {
  const [squareLogos, setSquareLogos] = useState<Record<number, boolean>>({})

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
          const isSquare = squareLogos[i]

          return (
            <div
              key={i}
              className={`shrink-0 inline-flex items-center justify-center ${
                isSquare ? 'h-24 md:h-36' : 'h-20 md:h-28'
              }`}
            >
              {logo.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className={`block h-full w-auto object-contain ${
                    isSquare
                      ? 'max-w-[160px] md:max-w-[260px]'
                      : 'max-w-[140px] md:max-w-[220px]'
                  }`}
                  onLoad={(event) => {
                    const { naturalWidth, naturalHeight } = event.currentTarget
                    if (!naturalWidth || !naturalHeight) return

                    const ratio = naturalWidth / naturalHeight
                    const nextIsSquare = ratio >= 0.9 && ratio <= 1.1

                    setSquareLogos((current) =>
                      current[i] === nextIsSquare
                        ? current
                        : { ...current, [i]: nextIsSquare }
                    )
                  }}
                  style={{
                    transform: `scale(${logo.scale ?? 1})`,
                    transformOrigin: 'center',
                  }}
                />
              ) : (
                <span className="text-white font-bold text-2xl md:text-4xl uppercase tracking-widest whitespace-nowrap">
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
