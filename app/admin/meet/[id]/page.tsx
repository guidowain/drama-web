'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import SlotHeatmap from '@/components/meet/SlotHeatmap'
import { axisForSlots, timezoneLabel, timezoneOffset } from '@/lib/meet/slots'
import type { Meeting, MeetResponse } from '@/lib/meet/types'

export default function ResultadosPage({ params }: { params: { id: string } }) {
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [responses, setResponses] = useState<MeetResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [focusKey, setFocusKey] = useState<string | null>(null)

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

  const enabled = useMemo(() => new Set(meeting?.slots ?? []), [meeting?.slots])
  const axis = useMemo(
    () => (meeting ? axisForSlots(meeting.slots, meeting.slotMinutes) : []),
    [meeting]
  )

  // Franja → quiénes pueden. Se arma una vez por carga, no por celda.
  const bySlot = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const response of responses) {
      for (const slot of response.slots) {
        const names = map.get(slot)
        if (names) names.push(response.name)
        else map.set(slot, [response.name])
      }
    }
    return map
  }, [responses])

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
          <div className="flex items-center gap-[9px] rounded-full border border-white/[0.16] px-3.5 py-[7px]">
            <span className="gradient-bg h-[7px] w-[7px] shrink-0 rounded-full" />
            <p className="whitespace-nowrap text-xs text-white/70">
              Horarios en {timezoneLabel(meeting.timezone)} · {timezoneOffset(meeting.timezone)}
            </p>
          </div>
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
            </div>

            <SlotHeatmap
              dates={meeting.dates}
              axis={axis}
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
