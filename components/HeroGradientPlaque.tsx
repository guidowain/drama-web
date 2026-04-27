'use client'

import { useRef, useCallback, useEffect, useMemo, useState } from 'react'

type Props = {
  lines: [string, string]
  children?: React.ReactNode
}

export default function HeroGradientPlaque({ lines, children }: Props) {
  const plaqueRef = useRef<HTMLDivElement>(null)
  const claimRef = useRef<HTMLParagraphElement>(null)
  const fullClaim = useMemo(() => lines.join('\n'), [lines])
  const [typedLength, setTypedLength] = useState(0)
  const [hasStartedTyping, setHasStartedTyping] = useState(false)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = plaqueRef.current
    if (!el) return
    const { left, top, width, height } = el.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    el.style.setProperty('--mx', `${x}%`)
    el.style.setProperty('--my', `${y}%`)
  }, [])

  const handleMouseLeave = useCallback(() => {
    const el = plaqueRef.current
    if (!el) return
    el.style.setProperty('--mx', '50%')
    el.style.setProperty('--my', '50%')
  }, [])

  useEffect(() => {
    const el = claimRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStartedTyping(true)
          observer.disconnect()
        }
      },
      { threshold: 0.45 }
    )

    observer.observe(el)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!hasStartedTyping) return

    setTypedLength(0)

    const interval = window.setInterval(() => {
      setTypedLength((current) => {
        if (current >= fullClaim.length) {
          window.clearInterval(interval)
          return current
        }

        return current + 1
      })
    }, 38)

    return () => window.clearInterval(interval)
  }, [fullClaim, hasStartedTyping])

  const typedLines = fullClaim.slice(0, typedLength).split('\n')

  return (
    <div
      ref={plaqueRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="hero-plaque w-full flex flex-col"
    >
      {/* Texto claim — padding arriba */}
      <div className="flex items-center justify-center pt-8 md:pt-10 pb-6 md:pb-8">
        <p
          ref={claimRef}
          aria-label={fullClaim.replace('\n', ' ')}
          className="hero-claim relative text-black font-black uppercase leading-[1.05] text-center px-6 md:px-12"
        >
          <span aria-hidden className="invisible">
            {lines[0]}<br />{lines[1]}
          </span>
          <span aria-hidden className="absolute inset-x-6 top-0 md:inset-x-12">
            {typedLines.map((line, index) => (
              <span key={index} className="block min-h-[1.05em]">
                {line}
              </span>
            ))}
          </span>
        </p>
      </div>

      {/* Slot para el ticker u otros children */}
      {children}

      {/* Padding abajo */}
      <div className="pb-6 md:pb-8" />
    </div>
  )
}
