'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { dayHead, hasGapBefore, slotKey, type AxisSlot } from '@/lib/meet/slots'

type SurfaceHandlers = {
  onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerMove?: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerUp?: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerCancel?: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerLeave?: (event: ReactPointerEvent<HTMLDivElement>) => void
}

type Props = {
  dates: string[]
  axis: AxisSlot[]
  renderCell: (key: string, date: string, minutes: number) => ReactNode
  surface?: SurfaceHandlers
}

/** De qué lado queda contenido fuera de pantalla. */
type Overflow = 'none' | 'start' | 'end' | 'both'

/**
 * El armazón de la grilla: eje horario a la izquierda, una columna por día,
 * y un separador punteado cuando dos días no son consecutivos.
 * Quién pinta o qué color tiene cada celda lo decide el que la usa.
 *
 * El eje queda fijo al costado izquierdo mientras se scrollea en horizontal,
 * para no perder de vista a qué hora corresponde cada fila.
 */
export default function GridFrame({ dates, axis, renderCell, surface }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const axisRef = useRef<HTMLDivElement>(null)
  const colsRef = useRef<HTMLDivElement>(null)
  const [overflow, setOverflow] = useState<Overflow>('none')

  // Degradé en el borde donde todavía hay días sin mostrar: en mobile entran
  // tres columnas y sin esta pista no se nota que hay más para el costado.
  const measure = useCallback(() => {
    const element = scrollerRef.current
    const inner = innerRef.current
    if (!element || !inner) return

    // Se mide el ancho real del eje y las columnas, no scrollWidth: cuando todo
    // entra, el CSS agrega un espaciador para centrar, y medir con él haría que
    // "entra" y "no entra" se alternen sin parar.
    const gap = parseFloat(getComputedStyle(inner).columnGap) || 0
    const content = (axisRef.current?.offsetWidth ?? 0) + gap + (colsRef.current?.offsetWidth ?? 0)
    if (content <= element.clientWidth + 1) return setOverflow('none')

    const max = element.scrollWidth - element.clientWidth
    if (max <= 2) return setOverflow('none')

    const atStart = element.scrollLeft <= 2
    const atEnd = element.scrollLeft >= max - 2
    setOverflow(atStart ? 'end' : atEnd ? 'start' : 'both')
  }, [])

  useEffect(() => {
    const element = scrollerRef.current
    if (!element) return

    measure()
    element.addEventListener('scroll', measure, { passive: true })

    const observer = new ResizeObserver(measure)
    observer.observe(element)

    return () => {
      element.removeEventListener('scroll', measure)
      observer.disconnect()
    }
  }, [measure, dates.length, axis.length])

  return (
    <div className="meet-grid-wrap" data-overflow={overflow}>
      <div className="meet-grid" ref={scrollerRef}>
        <div className="meet-grid-inner" ref={innerRef}>
          {/* touch-action libre: arrastrar sobre el eje scrollea la página, que
              es la única zona que queda para hacerlo cuando la grilla es alta. */}
          <div className="meet-axis" ref={axisRef} aria-hidden="true">
            {axis.map((slot) => (
              <div
                key={slot.min}
                className={`meet-axis-label${slot.onHour ? ' meet-axis-label-hour' : ''}`}
              >
                {slot.label}
              </div>
            ))}
          </div>

          <div className="meet-cols" ref={colsRef} {...surface}>
            {dates.map((date, index) => {
              const head = dayHead(date)

              return (
                <div key={date} className="meet-col-slot">
                  {hasGapBefore(dates, index) ? (
                    <div className="meet-gap" aria-hidden="true">
                      <span />
                    </div>
                  ) : null}

                  <div className="meet-col">
                    <div className="meet-col-head">
                      <p className="meet-col-wd">{head.wd}</p>
                      <p className="meet-col-date">
                        {head.num} {head.mon}
                      </p>
                    </div>
                    {axis.map((slot) => renderCell(slotKey(date, slot.min), date, slot.min))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
