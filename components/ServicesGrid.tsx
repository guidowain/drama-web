'use client'

import { useEffect, useRef, useState } from 'react'

type ServiceInfo = {
  name: string
  items: string[]
  icon: React.ReactNode
}

type Props = {
  services: ServiceInfo[]
}

export default function ServicesGrid({ services }: Props) {
  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
      {services.map((service) => (
        <ServiceCard
          key={service.name}
          name={service.name}
          items={service.items}
          icon={service.icon}
        />
      ))}
    </div>
  )
}

function ServiceCard({
  name,
  items,
  icon,
}: {
  name: string
  items: string[]
  icon: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isPeeking, setIsPeeking] = useState(false)
  const hasPeekedRef = useRef(false)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const syncMedia = () => {
      setIsMobile(media.matches)
      if (!media.matches) setIsFlipped(false)
    }

    syncMedia()
    media.addEventListener('change', syncMedia)
    return () => media.removeEventListener('change', syncMedia)
  }, [])

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (isMobile) {
          setIsFlipped(entry.isIntersecting && entry.intersectionRatio >= 0.45)
          return
        }

        if (entry.isIntersecting && entry.intersectionRatio >= 0.35 && !hasPeekedRef.current) {
          hasPeekedRef.current = true
          setIsPeeking(true)
          window.setTimeout(() => setIsPeeking(false), 1200)
        }
      },
      { threshold: [0, 0.35, 0.45, 0.7] },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [isMobile])

  return (
    <div
      ref={ref}
      className={`flip-card h-72 md:h-80 rounded-2xl ${isFlipped ? 'is-flipped' : ''} ${isPeeking ? 'is-peeking' : ''}`}
    >
      <div className="flip-card-inner rounded-2xl">
        {/* Front */}
        <div className="flip-card-front glass-card rounded-2xl flex flex-col items-center justify-center gap-4 p-6 overflow-hidden">
          <div className="text-white opacity-80">{icon}</div>
          <h3
            className="text-white font-black uppercase tracking-tight text-center leading-none w-full"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 3.4rem)' }}
          >
            {name}
          </h3>
        </div>

        {/* Back */}
        <div className="flip-card-back glass-card rounded-2xl flex flex-col justify-center gap-2 p-6">
          <h3 className="text-white font-black text-3xl md:text-4xl uppercase mb-4 leading-none tracking-tight">
            {name}
          </h3>
          <ul className="columns-2 gap-x-8 space-y-2">
            {items.map((item) => (
              <li key={item} className="flex items-center gap-2 text-white/80 text-sm md:text-base break-inside-avoid leading-snug">
                <span className="w-1.5 h-1.5 rounded-full gradient-bg shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
