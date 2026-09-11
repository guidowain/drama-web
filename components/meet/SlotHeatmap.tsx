'use client'

import type { PointerEvent as ReactPointerEvent } from 'react'
import GridFrame from './GridFrame'
import { dayLabel, timeAt, type AxisSlot } from '@/lib/meet/slots'

type Props = {
  dates: string[]
  axis: AxisSlot[]
  enabled: Set<string>
  /** Franja → nombres de quienes pueden en esa franja. */
  bySlot: Map<string, string[]>
  total: number
  focusKey: string | null
  onFocus: (key: string | null) => void
}

/**
 * Mapa de calor de las respuestas. La franja donde coinciden todos se pinta con
 * el gradiente completo; donde coincide más de la mitad, coral. Al pasar por una
 * celda se iluminan arriba los nombres de quienes pueden en ese momento.
 */
export default function SlotHeatmap({ dates, axis, enabled, bySlot, total, focusKey, onFocus }: Props) {
  function cellAt(event: ReactPointerEvent<HTMLDivElement>) {
    const element = document.elementFromPoint(event.clientX, event.clientY)
    return element?.closest?.('[data-k]')?.getAttribute('data-k') ?? null
  }

  const surface = {
    onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => {
      const key = cellAt(event)
      if (key !== focusKey) onFocus(key)
    },
    onPointerLeave: () => onFocus(null),
  }

  return (
    <GridFrame
      dates={dates}
      axis={axis}
      surface={surface}
      renderCell={(key, date, minutes) => {
        if (!enabled.has(key)) {
          return <div key={key} className="meet-cell meet-cell-off" aria-hidden="true" />
        }

        const count = bySlot.get(key)?.length ?? 0
        const heat =
          total > 0 && count === total
            ? ' meet-cell-heat-all'
            : total > 0 && count > total / 2
              ? ' meet-cell-heat-most'
              : ''

        return (
          <div
            key={key}
            data-k={key}
            aria-label={`${dayLabel(date)} ${timeAt(minutes)} — ${count} de ${total}`}
            className={`meet-cell meet-cell-heat${heat}${focusKey === key ? ' meet-cell-focus' : ''}`}
          />
        )
      }}
    />
  )
}
