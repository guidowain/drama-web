'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'

export default function CTAProyectos() {
  const [visible, setVisible] = useState(false)   // controls opacity
  const [expanded, setExpanded] = useState(false) // controls clip-path
  const [origin, setOrigin] = useState({ x: 50, y: 50 })
  const [mounted, setMounted] = useState(false)
  const btnRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => { setMounted(true) }, [])

  const shouldSkipInteraction = useCallback(() => (
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: none), (pointer: coarse)').matches
  ), [])

  const handleMouseEnter = useCallback(() => {
    if (shouldSkipInteraction()) return

    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setOrigin({
        x: ((rect.left + rect.width / 2) / window.innerWidth) * 100,
        y: ((rect.top + rect.height / 2) / window.innerHeight) * 100,
      })
    }
    // Reset circle to 0 while still invisible, then expand in next frame
    setExpanded(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setExpanded(true)
        setVisible(true)
      })
    })
  }, [shouldSkipInteraction])

  const handleMouseLeave = useCallback(() => {
    if (shouldSkipInteraction()) return

    // Only fade opacity — don't collapse the circle (avoids the lag)
    setVisible(false)
  }, [shouldSkipInteraction])

  const isHovered = visible

  return (
    <div className="relative flex justify-center" style={{ zIndex: isHovered ? 501 : 1 }}>
      {mounted && createPortal(
        <div
          aria-hidden
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 500,
            pointerEvents: 'none',
            background: 'linear-gradient(135deg, #F504FF 0%, #FE8B97 28%, #FE796D 50%, #FCC028 75%, #FED791 100%)',
            backgroundSize: '250% 250%',
            animation: 'gradient-live 6s ease infinite',
            clipPath: `circle(${expanded ? '200%' : '0%'} at ${origin.x}% ${origin.y}%)`,
            transition: expanded
              ? 'clip-path 0.75s cubic-bezier(0.22, 1, 0.36, 1)'
              : 'none',
            opacity: visible ? 1 : 0,
            /* opacity fades quickly on exit, no clip-path reversal */
            transitionProperty: visible ? 'clip-path' : 'opacity',
            transitionDuration: visible ? '0.75s' : '0.22s',
            transitionTimingFunction: visible ? 'cubic-bezier(0.22, 1, 0.36, 1)' : 'ease',
          }}
        />,
        document.body
      )}

      <Link
        ref={btnRef}
        href="/proyectos"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="cta-btn"
        style={{
          position: 'relative',
          zIndex: isHovered ? 501 : 1,
          boxShadow: isHovered
            ? '0 0 0 3px rgba(255,255,255,0.9), 0 8px 40px rgba(245,4,255,0.35)'
            : '0 2px 16px rgba(0,0,0,0.15)',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        <span className={isHovered ? 'cta-btn-label-hover' : 'cta-btn-label-default'}>
          PROYECTOS
        </span>
      </Link>
    </div>
  )
}
