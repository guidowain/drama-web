'use client'

import { useEffect, useMemo, useState } from 'react'
import MeetHeader from '@/components/meet/MeetHeader'
import SlotPainter from '@/components/meet/SlotPainter'
import TimezoneSelect from '@/components/meet/TimezoneSelect'
import { browserTimezone, summarize } from '@/lib/meet/slots'
import { mapSlots, projectSlots } from '@/lib/meet/timezone'
import type { Meeting, MeetResponse } from '@/lib/meet/types'

type Screen = 'invitacion' | 'responder' | 'confirmado'

const storageKey = (meetingId: string) => `drama-meet:${meetingId}`

/** Un solo mail, sin comas ni espacios de por medio. */
const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/

export default function MeetGuest({ meeting }: { meeting: Meeting }) {
  const [screen, setScreen] = useState<Screen>('invitacion')
  const [who, setWho] = useState('')
  const [email, setEmail] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [responseId, setResponseId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // Arranca en la zona de la reunión para que servidor y cliente rendericen lo
  // mismo, y pasa a la del navegador apenas monta.
  const [viewZone, setViewZone] = useState(meeting.timezone)

  useEffect(() => setViewZone(browserTimezone()), [])

  // Las franjas se guardan en la zona de quien armó la reunión; acá se
  // reexpresan en la zona que está mirando esta persona.
  const view = useMemo(
    () => projectSlots(meeting.slots, meeting.timezone, viewZone, meeting.slotMinutes),
    [meeting.slots, meeting.timezone, viewZone, meeting.slotMinutes]
  )

  const enabled = useMemo(() => new Set(view.slots), [view.slots])
  // La selección se guarda siempre en claves canónicas, así cambiar de zona no
  // la mueve de lugar.
  const selectedInView = useMemo(() => mapSlots(selected, view.toDisplay), [selected, view.toDisplay])

  const proposed = useMemo(
    () => summarize(view.slots, view.dates, meeting.slotMinutes),
    [view.slots, view.dates, meeting.slotMinutes]
  )
  const mine = useMemo(
    () => summarize(Array.from(selectedInView), view.dates, meeting.slotMinutes),
    [selectedInView, view.dates, meeting.slotMinutes]
  )

  const emailError = email.trim() !== '' && !EMAIL.test(email.trim())

  // Si esta persona ya respondió desde este navegador, la llevamos directo a su
  // confirmación con lo que había marcado, lista para editar.
  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey(meeting.id))
    if (!stored) return

    let active = true

    fetch(`/api/meet/${meeting.id}/responses/${stored}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { response: MeetResponse } | null) => {
        if (!active || !data) {
          if (active) window.localStorage.removeItem(storageKey(meeting.id))
          return
        }
        setResponseId(data.response.id)
        setWho(data.response.name)
        setEmail(data.response.email)
        setSelected(new Set(data.response.slots))
        setScreen('confirmado')
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [meeting.id])

  function go(next: Screen) {
    setScreen(next)
    setError('')
    window.scrollTo(0, 0)
  }

  async function submit() {
    setSaving(true)
    setError('')

    try {
      const res = await fetch(
        responseId
          ? `/api/meet/${meeting.id}/responses/${responseId}`
          : `/api/meet/${meeting.id}/responses`,
        {
          method: responseId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: who.trim(), email: email.trim(), slots: Array.from(selected) }),
        }
      )

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error ?? 'No pudimos guardar tu disponibilidad.')
        return
      }

      setResponseId(data.response.id)
      window.localStorage.setItem(storageKey(meeting.id), data.response.id)
      go('confirmado')
    } catch {
      setError('No pudimos guardar tu disponibilidad. Probá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const cantSubmit = selected.size === 0 || !who.trim() || emailError || saving

  return (
    <div className="meet-ui min-h-screen bg-black">
      <MeetHeader />

      <main className="min-h-screen pb-32 pt-[72px]">
        {screen === 'invitacion' ? (
          <section className="mx-auto max-w-[1024px] px-5 pt-8 sm:px-8 sm:pt-[72px]">
            <div className="meet-ticker mb-10 sm:mb-14">
              <div className="meet-ticker-track">
                {[0, 1].map((group) => (
                  <span key={group} className="flex shrink-0 items-center">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <span key={index} className="flex items-center">
                        <span>DRAMA MEET</span>
                        <span className="px-5">•</span>
                      </span>
                    ))}
                  </span>
                ))}
              </div>
            </div>

            <h1 className="meet-display text-[clamp(40px,7.5vw,90px)] leading-[0.9]">{meeting.name}</h1>
            <div className="meet-rule my-[30px]" />

            <div>
              <p className="meet-eyebrow mb-3">Días propuestos</p>
              <div className="flex max-w-[520px] flex-col gap-2.5">
                {proposed.map((entry) => (
                  <div
                    key={entry.day}
                    className="flex flex-col gap-1 border-b border-white/[0.08] pb-2.5 sm:flex-row sm:items-baseline sm:gap-4"
                  >
                    <p className="meet-display text-[15px] tracking-[0.06em] sm:min-w-[104px]">{entry.day}</p>
                    <p className="text-[15px] text-white/70">{entry.ranges}</p>
                  </div>
                ))}
              </div>
            </div>

            <button type="button" onClick={() => go('responder')} className="meet-cta meet-cta-white mt-12 px-11 py-4">
              Marcar mi disponibilidad
            </button>
          </section>
        ) : null}

        {screen === 'responder' ? (
          <section className="mx-auto max-w-[1120px] px-5 pt-8 sm:px-8 sm:pt-12">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <h1 className="meet-display mt-3 text-[clamp(28px,4.4vw,52px)] leading-[0.95]">{meeting.name}</h1>
              <TimezoneSelect value={viewZone} onChange={setViewZone} ensure={[meeting.timezone]} />
            </div>

            <div className="my-[26px] mt-[30px] grid max-w-[620px] grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                className="meet-input"
                value={who}
                onChange={(event) => setWho(event.target.value)}
                placeholder="Tu nombre"
                aria-label="Tu nombre"
                maxLength={80}
              />
              <div>
                <input
                  className="meet-input"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Tu email"
                  aria-label="Tu email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  maxLength={160}
                  aria-invalid={emailError}
                />
                {emailError ? (
                  <p className="mt-2 text-[13px] text-[#FE796D]">Poné un solo mail, sin comas.</p>
                ) : null}
              </div>
            </div>

            <div className="mb-4 flex">
              <button type="button" onClick={() => setSelected(new Set())} className="meet-ghost ml-auto">
                Limpiar todo
              </button>
            </div>

            <SlotPainter
              dates={view.dates}
              axis={view.axis}
              value={selectedInView}
              onChange={(updater) =>
                setSelected((previous) =>
                  mapSlots(updater(mapSlots(previous, view.toDisplay)), view.toCanonical)
                )
              }
              enabled={enabled}
              variant="guest"
            />

            <div className="meet-bar">
              {error ? <p className="mr-auto text-[13px] text-[#FE796D]">{error}</p> : null}
              <button type="button" onClick={submit} disabled={cantSubmit} className="meet-cta meet-cta-sm">
                {saving ? 'Enviando…' : 'Enviar disponibilidad'}
              </button>
            </div>
          </section>
        ) : null}

        {screen === 'confirmado' ? (
          <section className="mx-auto max-w-[1024px] px-5 pt-8 sm:px-8 sm:pt-[72px]">
            <div className="gradient-bg rounded-2xl p-[clamp(32px,5vw,64px)]">
              <h1 className="meet-display text-center text-[clamp(32px,6.2vw,80px)] leading-none text-black sm:text-left sm:whitespace-nowrap">
                Gracias, {(who || '').trim().split(/\s+/)[0]}.
              </h1>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-2">
              <div className="flex flex-col gap-3.5">
                {mine.map((entry) => (
                  <div
                    key={entry.day}
                    className="flex flex-col items-center gap-1 border-b border-white/[0.08] pb-3 sm:flex-row sm:items-baseline sm:gap-4"
                  >
                    <p className="meet-display text-[15px] tracking-[0.06em] sm:min-w-[104px]">{entry.day}</p>
                    <p className="text-[15px] text-white/70">{entry.ranges}</p>
                  </div>
                ))}
              </div>

              <div className="glass-card rounded-2xl p-[26px] text-center sm:text-left">
                <p className="meet-display text-[17px]">¿Te cambió la agenda?</p>
                <button type="button" onClick={() => go('responder')} className="meet-outline mt-[18px]">
                  Editar mi respuesta
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  )
}
