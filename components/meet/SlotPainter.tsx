'use client'

import { useMemo, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import GridFrame from './GridFrame'
import { dayLabel, slotKey, splitSlotKey, timeAt, type AxisSlot } from '@/lib/meet/slots'

type Props = {
  dates: string[]
  axis: AxisSlot[]
  value: Set<string>
  onChange: (updater: (previous: Set<string>) => Set<string>) => void
  /** Si se pasa, solo estas franjas se pueden pintar; el resto queda rayado. */
  enabled?: Set<string>
  variant?: 'editor' | 'guest'
}

type Anchor = { dateIndex: number; minIndex: number }

/**
 * Grilla pintable: se arrastra para marcar franjas, como seleccionar celdas en
 * una planilla.
 *
 * El arrastre rellena todo el rectángulo entre la celda donde se apretó y la
 * celda de abajo del cursor, en vez de ir pintando las que va tocando. Eso lo
 * hace independiente de cuántos `pointermove` dispare el navegador — un arrastre
 * rápido no deja huecos — y de paso permite pintar un bloque de varios días de
 * una sola pasada.
 *
 * El valor lo define el primer toque: si esa celda estaba prendida, todo el
 * trazo apaga; si estaba apagada, todo el trazo prende.
 */
export default function SlotPainter({ dates, axis, value, onChange, enabled, variant = 'editor' }: Props) {
  const paintRef = useRef<boolean | null>(null)
  const anchorRef = useRef<Anchor | null>(null)
  const baseRef = useRef<Set<string>>(new Set())

  const dateIndex = useMemo(() => {
    const map = new Map<string, number>()
    dates.forEach((date, index) => map.set(date, index))
    return map
  }, [dates])

  const minIndex = useMemo(() => {
    const map = new Map<number, number>()
    axis.forEach((slot, index) => map.set(slot.min, index))
    return map
  }, [axis])

  function anchorAt(event: ReactPointerEvent<HTMLDivElement>) {
    const element = document.elementFromPoint(event.clientX, event.clientY)
    const key = element?.closest?.('[data-k]')?.getAttribute('data-k')
    if (!key) return null

    const { date, min } = splitSlotKey(key)
    const dIndex = dateIndex.get(date)
    const mIndex = minIndex.get(min)
    if (dIndex === undefined || mIndex === undefined) return null

    return { key, anchor: { dateIndex: dIndex, minIndex: mIndex } }
  }

  /** Aplica el valor del trazo a todo el rectángulo anclado en el primer toque. */
  function paintTo(target: Anchor) {
    const anchor = anchorRef.current
    const paint = paintRef.current
    if (!anchor || paint === null) return

    const next = new Set(baseRef.current)
    const [fromDate, toDate] = sorted(anchor.dateIndex, target.dateIndex)
    const [fromMin, toMin] = sorted(anchor.minIndex, target.minIndex)

    for (let d = fromDate; d <= toDate; d += 1) {
      for (let m = fromMin; m <= toMin; m += 1) {
        const key = slotKey(dates[d], axis[m].min)
        if (enabled && !enabled.has(key)) continue
        if (paint) next.add(key)
        else next.delete(key)
      }
    }

    onChange(() => next)
  }

  const surface = {
    onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => {
      const hit = anchorAt(event)
      if (!hit) return

      event.preventDefault()
      // Capturamos el puntero para que el arrastre siga funcionando aunque el
      // dedo se vaya de la celda original — sin esto, en touch todos los eventos
      // quedan pegados al primer elemento tocado.
      event.currentTarget.setPointerCapture(event.pointerId)

      paintRef.current = !value.has(hit.key)
      anchorRef.current = hit.anchor
      baseRef.current = new Set(value)
      paintTo(hit.anchor)
    },
    onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => {
      if (paintRef.current === null) return
      const hit = anchorAt(event)
      if (hit) paintTo(hit.anchor)
    },
    onPointerUp: () => {
      paintRef.current = null
      anchorRef.current = null
    },
    onPointerCancel: () => {
      paintRef.current = null
      anchorRef.current = null
    },
  }

  return (
    <GridFrame
      dates={dates}
      axis={axis}
      surface={surface}
      renderCell={(key, date, minutes) => {
        if (enabled && !enabled.has(key)) {
          return <div key={key} className="meet-cell meet-cell-off" aria-hidden="true" />
        }

        const on = value.has(key)
        const idle = variant === 'guest' ? ' meet-cell-idle-soft' : ''

        return (
          <div
            key={key}
            data-k={key}
            role="button"
            aria-pressed={on}
            aria-label={`${dayLabel(date)} ${timeAt(minutes)}`}
            className={`meet-cell meet-cell-paintable${on ? ' meet-cell-on' : idle}`}
          />
        )
      }}
    />
  )
}

function sorted(a: number, b: number): [number, number] {
  return a <= b ? [a, b] : [b, a]
}
