'use client'

import { useRef, useCallback } from 'react'

type Props = {
  lines: [string, string]
  children?: React.ReactNode
}

export default function HeroGradientPlaque({ lines, children }: Props) {
  const plaqueRef = useRef<HTMLDivElement>(null)

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

  return (
    <div
      ref={plaqueRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="hero-plaque w-full flex flex-col"
    >
      {/* Texto claim — padding arriba */}
      <div className="flex items-center justify-center pt-8 md:pt-10 pb-6 md:pb-8">
        <p className="hero-claim text-black font-black uppercase leading-[1.05] text-center px-6 md:px-12">
          {lines[0]}<br />{lines[1]}
        </p>
      </div>

      {/* Slot para el ticker u otros children */}
      {children}

      {/* Padding abajo */}
      <div className="pb-6 md:pb-8" />
    </div>
  )
}
