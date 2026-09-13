'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import SlotPainter from '@/components/meet/SlotPainter'
import {
  MONTHS_LONG,
  WEEKDAY_INITIALS,
  browserTimezone,
  buildAxis,
  isoOf,
  timezoneLabel,
  timezoneOffset,
} from '@/lib/meet/slots'
import type { Meeting } from '@/lib/meet/types'

const STEPS = [
  ['01', 'Nombre y días'],
  ['02', 'Horarios'],
  ['03', 'Link'],
] as const

export default function NuevaReunionPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [name, setName] = useState('')
  const [dates, setDates] = useState<string[]>([])
  const [viewMonth, setViewMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1).getTime()
  })
  const [startH, setStartH] = useState(9)
  const [endH, setEndH] = useState(20)
  const [avail, setAvail] = useState<Set<string>>(new Set())
  const [timezone, setTimezone] = useState('')
  const [created, setCreated] = useState<Meeting | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // En el servidor no sabemos la zona del navegador: la resolvemos ya montados
  // para no romper la hidratación.
  useEffect(() => setTimezone(browserTimezone()), [])

  const sortedDates = useMemo(() => [...dates].sort(), [dates])
  const axis = useMemo(() => buildAxis(startH * 60, endH * 60, 30), [startH, endH])

  const monthCells = useMemo(() => buildMonthCells(viewMonth), [viewMonth])
  const monthDate = new Date(viewMonth)

  function toggleDate(date: string) {
    setDates((previous) => {
      if (!previous.includes(date)) return [...previous, date]

      // Al sacar un día también se van sus franjas, si no quedarían huérfanas.
      setAvail((slots) => {
        const next = new Set(slots)
        Array.from(slots).forEach((key) => {
          if (key.startsWith(`${date}|`)) next.delete(key)
        })
        return next
      })

      return previous.filter((entry) => entry !== date)
    })
  }

  function goStep(next: 1 | 2 | 3) {
    setStep(next)
    setError('')
    window.scrollTo(0, 0)
  }

  async function createMeeting() {
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/admin/meet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          dates: sortedDates,
          slots: Array.from(avail),
          slotMinutes: 30,
          timezone: timezone || 'America/Argentina/Buenos_Aires',
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error ?? 'No pudimos crear la reunión.')
        return
      }

      setCreated(data.meeting)
      goStep(3)
    } catch {
      setError('No pudimos crear la reunión. Probá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const link = created ? `drama.com.ar/meet/${created.id}` : ''

  function copyLink() {
    navigator.clipboard?.writeText(`https://${link}`).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="meet-ui p-6 pb-32 md:p-12">
      <section className="mx-auto max-w-[1120px]">
        <div className="mb-7 flex flex-wrap items-center gap-2 sm:mb-[34px] sm:gap-[18px]">
          {STEPS.map(([num, label], index) => {
            const position = (index + 1) as 1 | 2 | 3
            const active = step === position
            const done = step > position
            // Una vez creada la reunión ya no se vuelve atrás: el link existe.
            const locked = created !== null || position === 3

            return (
              <button
                key={num}
                type="button"
                disabled={locked}
                onClick={() => goStep(position)}
                className={`meet-step${active ? ' meet-step-active' : done ? ' meet-step-done' : ''}`}
              >
                <span className="mr-2 font-black">{num}</span>
                {label}
              </button>
            )
          })}
        </div>

        {step === 1 ? (
          <div>
            <h1 className="meet-display text-[clamp(40px,7vw,84px)] leading-[1.05]">
              Armá una
              <br />
              reunión.
            </h1>
            <div className="meet-rule mb-11 mt-[26px]" />

            <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <div className="flex flex-col gap-[26px]">
                <div>
                  <label htmlFor="meet-name" className="meet-eyebrow mb-2.5 block">
                    Nombre de la reunión
                  </label>
                  <input
                    id="meet-name"
                    className="meet-input"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Reunión"
                    maxLength={120}
                  />
                </div>
                {timezone ? (
                  <p className="text-[13px] text-white/35">
                    {timezoneLabel(timezone)} · {timezoneOffset(timezone)}
                  </p>
                ) : null}
              </div>

              <div>
                <div className="rounded-2xl border border-white/10 bg-[#111] p-[22px]">
                  <div className="mb-[18px] flex items-center justify-between">
                    <button
                      type="button"
                      className="meet-round"
                      onClick={() => setViewMonth(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1).getTime())}
                      aria-label="Mes anterior"
                    >
                      ‹
                    </button>
                    <p className="meet-display text-[15px] tracking-[0.08em]">
                      {MONTHS_LONG[monthDate.getMonth()]} {monthDate.getFullYear()}
                    </p>
                    <button
                      type="button"
                      className="meet-round"
                      onClick={() => setViewMonth(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1).getTime())}
                      aria-label="Mes siguiente"
                    >
                      ›
                    </button>
                  </div>

                  <div className="mb-[9px] grid grid-cols-7 gap-[7px]">
                    {WEEKDAY_INITIALS.map((day, index) => (
                      <span
                        key={`${day}-${index}`}
                        className="text-center text-[10px] font-bold tracking-[0.1em] text-white/30"
                      >
                        {day}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-[7px]">
                    {monthCells.map((cell, index) =>
                      cell === null ? (
                        <span key={`blank-${index}`} className="h-[38px]" />
                      ) : (
                        <button
                          key={cell.iso}
                          type="button"
                          disabled={cell.past}
                          onClick={() => toggleDate(cell.iso)}
                          aria-pressed={dates.includes(cell.iso)}
                          className={`meet-day${dates.includes(cell.iso) ? ' meet-day-on' : ''}`}
                        >
                          {cell.num}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-end gap-5">
                  <button
                    type="button"
                    className="meet-cta"
                    disabled={sortedDates.length === 0}
                    onClick={() => goStep(2)}
                  >
                    Elegir horarios
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div>
            <h1 className="meet-display text-[clamp(30px,5vw,60px)] leading-[1.05]">
              ¿Qué franjas
              <br />
              habilitás?
            </h1>

            <div className="my-[18px] mt-[30px] flex flex-wrap items-center gap-4">
              <p className="meet-eyebrow">Rango visible</p>
              <div className="flex items-center gap-2.5">
                <HourStepper
                  label={`${String(startH).padStart(2, '0')}:00`}
                  onMinus={() => setStartH((hour) => Math.max(0, hour - 1))}
                  onPlus={() => setStartH((hour) => Math.min(endH - 1, hour + 1))}
                  name="Hora de inicio"
                />
                <span className="text-[13px] text-white/35">a</span>
                <HourStepper
                  label={`${String(endH).padStart(2, '0')}:00`}
                  onMinus={() => setEndH((hour) => Math.max(startH + 1, hour - 1))}
                  onPlus={() => setEndH((hour) => Math.min(24, hour + 1))}
                  name="Hora de fin"
                />
              </div>
              <button type="button" className="meet-ghost ml-auto" onClick={() => setAvail(new Set())}>
                Limpiar todo
              </button>
            </div>

            <SlotPainter dates={sortedDates} axis={axis} value={avail} onChange={setAvail} />

            <div className="meet-bar">
              {error ? <p className="mr-auto text-[13px] text-[#FE796D]">{error}</p> : null}
              <button
                type="button"
                className="meet-cta"
                disabled={avail.size === 0 || !name.trim() || saving}
                onClick={createMeeting}
              >
                {saving ? 'Generando…' : 'Generar link'}
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 && created ? (
          <div>
            <h1 className="meet-display text-[clamp(36px,6vw,72px)] leading-[1.05]">
              Listo.
              <br />
              Mandá el link.
            </h1>

            <div className="gradient-bg mt-10 flex flex-wrap items-center justify-between gap-6 rounded-2xl p-8">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/60">
                  Link para los invitados
                </p>
                <p className="meet-display mt-2 break-all text-[clamp(18px,2.4vw,32px)] leading-[1.1] text-black">
                  {link}
                </p>
              </div>
              <button
                type="button"
                onClick={copyLink}
                className="meet-display shrink-0 whitespace-nowrap rounded-full border-2 border-black bg-black px-[34px] py-3.5 text-sm tracking-[0.1em] text-white transition-colors hover:bg-transparent hover:text-black"
              >
                {copied ? 'Copiado' : 'Copiar link'}
              </button>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href={`/admin/meet/${created.id}`} className="meet-outline">
                Ver resultados
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}

function HourStepper({
  label,
  onMinus,
  onPlus,
  name,
}: {
  label: string
  onMinus: () => void
  onPlus: () => void
  name: string
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-[#111] px-2.5 py-1.5">
      <button type="button" className="meet-round meet-round-sm" onClick={onMinus} aria-label={`${name}: restar una hora`}>
        −
      </button>
      <span className="meet-display min-w-[46px] text-center text-[15px]">{label}</span>
      <button type="button" className="meet-round meet-round-sm" onClick={onPlus} aria-label={`${name}: sumar una hora`}>
        +
      </button>
    </div>
  )
}

type MonthCell = { iso: string; num: number; past: boolean }

function buildMonthCells(viewMonth: number): (MonthCell | null)[] {
  const month = new Date(viewMonth)
  const lead = new Date(month.getFullYear(), month.getMonth(), 1).getDay()
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const today = isoOf(new Date())

  const cells: (MonthCell | null)[] = Array.from({ length: lead }, () => null)

  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = isoOf(new Date(month.getFullYear(), month.getMonth(), day))
    cells.push({ iso, num: day, past: iso < today })
  }

  return cells
}
