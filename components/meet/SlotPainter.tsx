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

type Cell = { dateIndex: number; minIndex: number }

type Gesture = {
  anchor: Cell
  key: string
  startX: number
  startY: number
  touch: boolean
  /** Se activa recién cuando el dedo (o el mouse) se movió lo suficiente. */
  dragging: boolean
  /** Valor del trazo: lo fija la primera celda. */
  paint: boolean
}

/** Cuánto hay que moverse para que deje de ser un toque y pase a ser un arrastre. */
const DRAG_THRESHOLD_TOUCH = 10
const DRAG_THRESHOLD_MOUSE = 4

/**
 * Grilla pintable.
 *
 * Un toque marca una sola franja. Recién cuando el dedo se corre lo suficiente
 * empieza a arrastrar, y ahí rellena todo el rectángulo entre la celda donde
 * empezó y la de abajo del cursor. El rectángulo se recalcula desde el estado
 * original en cada movimiento, así que volver sobre los pasos deshace, y no
 * depende de cuántos `pointermove` dispare el navegador: un arrastre rápido no
 * deja huecos.
 *
 * En pantallas táctiles el gesto horizontal es del scroll, no del pincel: si el
 * movimiento arranca para el costado se abandona el trazo y no se pinta nada.
 * Sin eso, cualquier intento de correr la grilla dejaba celdas marcadas.
 */
export default function SlotPainter({ dates, axis, value, onChange, enabled, variant = 'editor' }: Props) {
  const gestureRef = useRef<Gesture | null>(null)
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

  function cellAt(event: ReactPointerEvent<HTMLDivElement>) {
    const element = document.elementFromPoint(event.clientX, event.clientY)
    const key = element?.closest?.('[data-k]')?.getAttribute('data-k')
    if (!key) return null

    const { date, min } = splitSlotKey(key)
    const dIndex = dateIndex.get(date)
    const mIndex = minIndex.get(min)
    if (dIndex === undefined || mIndex === undefined) return null

    return { key, cell: { dateIndex: dIndex, minIndex: mIndex } }
  }

  /** Aplica el valor del trazo a todo el rectángulo entre el ancla y el destino. */
  function paintTo(target: Cell) {
    const gesture = gestureRef.current
    if (!gesture) return

    const next = new Set(baseRef.current)
    const [fromDate, toDate] = sorted(gesture.anchor.dateIndex, target.dateIndex)
    const [fromMin, toMin] = sorted(gesture.anchor.minIndex, target.minIndex)

    for (let d = fromDate; d <= toDate; d += 1) {
      for (let m = fromMin; m <= toMin; m += 1) {
        const key = slotKey(dates[d], axis[m].min)
        if (enabled && !enabled.has(key)) continue
        if (gesture.paint) next.add(key)
        else next.delete(key)
      }
    }

    onChange(() => next)
  }

  const surface = {
    onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => {
      const hit = cellAt(event)
      if (!hit) return

      // Sin preventDefault: en táctil el navegador todavía tiene que poder
      // quedarse con el gesto si resulta ser un scroll lateral.
      gestureRef.current = {
        anchor: hit.cell,
        key: hit.key,
        startX: event.clientX,
        startY: event.clientY,
        touch: event.pointerType === 'touch',
        dragging: false,
        paint: !value.has(hit.key),
      }
      baseRef.current = new Set(value)
    },

    onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => {
      const gesture = gestureRef.current
      if (!gesture) return

      if (!gesture.dragging) {
        const dx = event.clientX - gesture.startX
        const dy = event.clientY - gesture.startY
        const threshold = gesture.touch ? DRAG_THRESHOLD_TOUCH : DRAG_THRESHOLD_MOUSE

        // Todavía es un toque con pulso: no tocamos nada.
        if (Math.hypot(dx, dy) < threshold) return

        // En táctil, mayormente horizontal = está scrolleando la grilla.
        if (gesture.touch && Math.abs(dx) > Math.abs(dy)) {
          gestureRef.current = null
          return
        }

        gesture.dragging = true
        // Recién ahora capturamos: el arrastre sigue aunque el dedo se vaya de
        // la celda original, que en táctil es lo que pasa siempre.
        event.currentTarget.setPointerCapture(event.pointerId)
      }

      const hit = cellAt(event)
      if (hit) paintTo(hit.cell)
    },

    onPointerUp: () => {
      const gesture = gestureRef.current
      // Nunca llegó a ser arrastre: fue un toque, marca una sola franja.
      if (gesture && !gesture.dragging) paintTo(gesture.anchor)
      gestureRef.current = null
    },

    // El navegador se quedó con el gesto (scroll): no pintamos nada.
    onPointerCancel: () => {
      gestureRef.current = null
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
