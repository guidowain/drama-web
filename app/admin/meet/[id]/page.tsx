'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import SlotHeatmap from '@/components/meet/SlotHeatmap'
import TimezoneSelect from '@/components/meet/TimezoneSelect'
import { browserTimezone } from '@/lib/meet/slots'
import { mapSlots, projectSlots } from '@/lib/meet/timezone'
import type { Meeting, MeetResponse } from '@/lib/meet/types'

export default function ResultadosPage({ params }: { params: { id: string } }) {
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [responses, setResponses] = useState<MeetResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [focusKey, setFocusKey] = useState<string | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'done' | 'error'>('idle')
  const [viewZone, setViewZone] = useState('')

  useEffect(() => setViewZone(browserTimezone()), [])

  useEffect(() => {
    let active = true

    fetch(`/api/admin/meet/${params.id}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null)
        if (!active) return
        if (!res.ok) {
          setError(data?.error ?? 'No pudimos cargar la reunión.')
          return
        }
        setMeeting(data.meeting)
        setResponses(data.responses)
      })
      .catch(() => active && setError('No pudimos cargar la reunión.'))
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [params.id])

  // Las franjas se guardan en la zona con la que se armó la reunión; acá se
  // reexpresan en la que se esté mirando.
  const view = useMemo(
    () =>
      meeting
        ? projectSlots(meeting.slots, meeting.timezone, viewZone || meeting.timezone, meeting.slotMinutes)
        : null,
    [meeting, viewZone]
  )

  const enabled = useMemo(() => new Set(view?.slots ?? []), [view])

  // Franja → quiénes pueden, ya en la zona que se está mirando. Se arma una vez
  // por carga, no por celda.
  const bySlot = useMemo(() => {
    const map = new Map<string, string[]>()
    if (!view) return map

    for (const response of responses) {
      for (const slot of Array.from(mapSlots(response.slots, view.toDisplay))) {
        const names = map.get(slot)
        if (names) names.push(response.name)
        else map.set(slot, [response.name])
      }
    }
    return map
  }, [responses, view])

  // El mail es opcional para el invitado, así que puede haber respuestas sin uno.
  const emails = useMemo(() => {
    const seen = new Set<string>()
    for (const response of responses) {
      const email = response.email.trim().toLowerCase()
      if (email) seen.add(email)
    }
    return Array.from(seen)
  }, [responses])

  const sinMail = responses.length - responses.filter((r) => r.email.trim()).length

  async function copyEmails() {
    // Separados por coma: es lo que el campo "Agregar invitados" de Google
    // Calendar convierte en un invitado por cada dirección al pegarlo.
    const list = emails.join(', ')

    try {
      await navigator.clipboard.writeText(list)
      setCopyState('done')
    } catch {
      setCopyState('error')
    }

    setTimeout(() => setCopyState('idle'), 4000)
  }

  const focused = focusKey ? bySlot.get(focusKey) ?? [] : null

  if (loading) {
    return <p className="meet-ui p-6 text-sm text-white/40 md:p-12">Cargando…</p>
  }

  if (error || !meeting) {
    return (
      <div className="meet-ui p-6 md:p-12">
        <p className="text-sm text-[#FE796D]">{error || 'Esta reunión no existe.'}</p>
        <Link href="/admin/meet" className="mt-6 inline-block text-sm text-white/40 underline hover:text-white">
          Volver a Meet
        </Link>
      </div>
    )
  }

  return (
    <div className="meet-ui p-6 pb-32 md:p-12">
      <section className="mx-auto max-w-[1200px]">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <h1 className="meet-display mt-3 text-[clamp(28px,4.4vw,52px)] leading-[0.95]">{meeting.name}</h1>
          <TimezoneSelect
            value={viewZone || meeting.timezone}
            onChange={setViewZone}
            ensure={[meeting.timezone]}
          />
        </div>

        {responses.length === 0 ? (
          <p className="mt-8 text-[15px] text-white/40">Todavía no respondió nadie.</p>
        ) : (
          <>
            <div className="my-[26px] mt-[30px] flex flex-wrap items-center gap-7">
              <div className="flex flex-wrap gap-2">
                {responses.map((response) => {
                  const on = focused ? focused.includes(response.name) : false
                  const dimmed = focused ? !on : false

                  return (
                    <span
                      key={response.id}
                      className="meet-display px-3 py-[5px] text-xs font-bold tracking-[0.08em]"
                      style={{
                        border: `1px solid ${on ? '#FCC028' : 'rgba(255,255,255,0.25)'}`,
                        color: on ? '#FCC028' : dimmed ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.8)',
                      }}
                    >
                      {response.name}
                    </span>
                  )
                })}
              </div>

              {emails.length ? (
                <button type="button" onClick={copyEmails} className="meet-ghost ml-auto">
                  {copyState === 'done'
                    ? 'Copiado'
                    : `Copiar ${emails.length} ${emails.length === 1 ? 'mail' : 'mails'}`}
                </button>
              ) : null}
            </div>

            {copyState === 'error' ? (
              <p className="mb-4 select-text break-all rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-white/60">
                {emails.join(', ')}
              </p>
            ) : null}

            {sinMail ? (
              <p className="mb-5 text-[13px] text-white/35">
                {sinMail === 1 ? 'Una persona no dejó' : `${sinMail} personas no dejaron`} su mail.
              </p>
            ) : null}

            <SlotHeatmap
              dates={view?.dates ?? []}
              axis={view?.axis ?? []}
              enabled={enabled}
              bySlot={bySlot}
              total={responses.length}
              focusKey={focusKey}
              onFocus={setFocusKey}
            />
          </>
        )}
      </section>
    </div>
  )
}
