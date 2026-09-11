'use client'

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

/**
 * El armazón de la grilla: eje horario a la izquierda, una columna por día,
 * y un separador punteado cuando dos días no son consecutivos.
 * Quién pinta o qué color tiene cada celda lo decide el que la usa.
 */
export default function GridFrame({ dates, axis, renderCell, surface }: Props) {
  return (
    <div className="meet-grid">
      <div className="meet-grid-inner">
        <div className="meet-axis" aria-hidden="true">
          {axis.map((slot) => (
            <div
              key={slot.min}
              className={`meet-axis-label${slot.onHour ? ' meet-axis-label-hour' : ''}`}
            >
              {slot.label}
            </div>
          ))}
        </div>

        <div className="meet-cols" {...surface}>
          {dates.map((date, index) => {
            const head = dayHead(date)

            return (
              <div key={date} className="flex gap-[10px]">
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
  )
}
