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
  const [activeMobileIndex, setActiveMobileIndex] = useState<number | null>(null)

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
      {services.map((service, index) => (
        <ServiceCard
          key={service.name}
          index={index}
          name={service.name}
          items={service.items}
          icon={service.icon}
          shouldHint={index === 0}
          activeMobileIndex={activeMobileIndex}
          setActiveMobileIndex={setActiveMobileIndex}
        />
      ))}
    </div>
  )
}

function ServiceCard({
  index,
  name,
  items,
  icon,
  shouldHint,
  activeMobileIndex,
  setActiveMobileIndex,
}: {
  index: number
  name: string
  items: string[]
  icon: React.ReactNode
  shouldHint: boolean
  activeMobileIndex: number | null
  setActiveMobileIndex: React.Dispatch<React.SetStateAction<number | null>>
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isNudging, setIsNudging] = useState(false)
  const hasInteractedRef = useRef(false)
  const nudgeTimerRef = useRef<number | null>(null)
  const nudgeStorageKey = 'drama-service-design-nudge-seen'

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const syncMedia = () => {
      setIsMobile(media.matches)
      if (!media.matches) setActiveMobileIndex(null)
    }

    syncMedia()
    media.addEventListener('change', syncMedia)
    return () => media.removeEventListener('change', syncMedia)
  }, [])

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (isMobile) return

    function clearNudgeTimer() {
      if (nudgeTimerRef.current) {
        window.clearTimeout(nudgeTimerRef.current)
        nudgeTimerRef.current = null
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!shouldHint || sessionStorage.getItem(nudgeStorageKey) === '1') return

        if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
          if (nudgeTimerRef.current || hasInteractedRef.current) return

          nudgeTimerRef.current = window.setTimeout(() => {
            nudgeTimerRef.current = null
            if (hasInteractedRef.current || sessionStorage.getItem(nudgeStorageKey) === '1') return

            sessionStorage.setItem(nudgeStorageKey, '1')
            setIsNudging(true)
            window.setTimeout(() => setIsNudging(false), 1800)
          }, 1000)
          return
        }

        clearNudgeTimer()
      },
      { threshold: [0, 0.35, 0.45, 0.7] },
    )

    observer.observe(element)
    return () => {
      clearNudgeTimer()
      observer.disconnect()
    }
  }, [index, isMobile, setActiveMobileIndex, shouldHint])

  useEffect(() => {
    const element = ref.current
    if (!isMobile || !element) return
    const cardElement = element

    let frameId: number | null = null

    function updateActiveCard() {
      frameId = null

      const rect = cardElement.getBoundingClientRect()
      const cardCenter = rect.top + rect.height / 2
      const centerBandTop = window.innerHeight * 0.36
      const centerBandBottom = window.innerHeight * 0.64
      const isInCenterBand = cardCenter >= centerBandTop && cardCenter <= centerBandBottom

      if (isInCenterBand) {
        setActiveMobileIndex(index)
        return
      }

      setActiveMobileIndex((current) => current === index ? null : current)
    }

    function requestUpdate() {
      if (frameId != null) return
      frameId = window.requestAnimationFrame(updateActiveCard)
    }

    requestUpdate()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      if (frameId != null) window.cancelAnimationFrame(frameId)
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      setActiveMobileIndex((current) => current === index ? null : current)
    }
  }, [index, isMobile, setActiveMobileIndex])

  function handlePointerEnter() {
    hasInteractedRef.current = true
    if (shouldHint) sessionStorage.setItem(nudgeStorageKey, '1')
    if (nudgeTimerRef.current) {
      window.clearTimeout(nudgeTimerRef.current)
      nudgeTimerRef.current = null
    }
  }

  return (
    <div
      ref={ref}
      onPointerEnter={handlePointerEnter}
      className={`flip-card h-72 select-none md:h-80 rounded-2xl ${activeMobileIndex === index ? 'is-flipped' : ''} ${isNudging ? 'is-nudging' : ''}`}
    >
      <div className="flip-card-inner rounded-2xl">
        {/* Front */}
        <div className="flip-card-front glass-card rounded-2xl flex flex-col items-center justify-center gap-4 p-6 overflow-hidden">
          <div className="service-card-icon">{icon}</div>
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
