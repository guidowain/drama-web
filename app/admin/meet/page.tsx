'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { dayLabel } from '@/lib/meet/slots'
import type { MeetingSummary } from '@/lib/meet/types'

export default function AdminMeetPage() {
  const [meetings, setMeetings] = useState<MeetingSummary[]>([])
  const [storage, setStorage] = useState<'github' | 'filesystem' | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState('')

  useEffect(() => {
    let active = true

    fetch('/api/admin/meet')
      .then(async (res) => {
        const data = await res.json().catch(() => null)
        if (!active) return
        if (!res.ok) {
          setError(data?.error ?? 'No pudimos cargar las reuniones.')
          return
        }
        setMeetings(data.meetings)
        setStorage(data.storage)
      })
      .catch(() => active && setError('No pudimos cargar las reuniones.'))
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [])

  function copyLink(id: string) {
    navigator.clipboard?.writeText(`https://drama.com.ar/meet/${id}`).catch(() => {})
    setCopiedId(id)
    setTimeout(() => setCopiedId(''), 1600)
  }

  async function remove(meeting: MeetingSummary) {
    if (!window.confirm(`¿Borrar "${meeting.name}" y todas sus respuestas?`)) return

    const res = await fetch(`/api/admin/meet/${meeting.id}`, { method: 'DELETE' })
    if (!res.ok) {
      setError('No pudimos borrar la reunión.')
      return
    }

    setMeetings((previous) => previous.filter((entry) => entry.id !== meeting.id))
  }

  return (
    <div className="p-8 md:p-12">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 text-4xl font-black uppercase tracking-tight text-white">Meet</h1>
          <p className="text-sm text-white/30">Armá una reunión, mandá el link y mirá cuándo puede cada uno.</p>
        </div>
        <Link
          href="/admin/meet/nueva"
          className="gradient-bg rounded-full px-6 py-3 text-xs font-black uppercase tracking-widest text-black transition-opacity hover:opacity-90"
        >
          Nueva reunión
        </Link>
      </div>

      {storage === 'filesystem' ? (
        <div className="mb-6 max-w-4xl rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
          <p className="text-sm text-amber-200/80">
            Guardando en el filesystem local. Para producción falta configurar{' '}
            <span className="font-mono text-amber-100">MEET_GITHUB_REPO</span> con el repo privado donde
            van las reuniones.
          </p>
        </div>
      ) : null}

      {error ? <p className="mb-6 text-sm text-rose-300">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-white/40">Cargando…</p>
      ) : meetings.length === 0 ? (
        <p className="text-sm text-white/40">Todavía no armaste ninguna reunión.</p>
      ) : (
        <div className="max-w-4xl space-y-3">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-900"
            >
              <div className="h-1 bg-gradient-to-r from-[#F504FF] via-[#FE796D] to-[#FCC028]" />
              <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="truncate text-lg font-black uppercase tracking-tight text-white">{meeting.name}</p>
                  <p className="mt-1 text-xs text-white/35">
                    {rangeLabel(meeting.dates)} · {meeting.responseCount}{' '}
                    {meeting.responseCount === 1 ? 'respuesta' : 'respuestas'}
                  </p>
                  <p className="mt-1 truncate font-mono text-xs text-white/25">drama.com.ar/meet/{meeting.id}</p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <button type="button" onClick={() => copyLink(meeting.id)} className="mini">
                    {copiedId === meeting.id ? 'Copiado' : 'Copiar link'}
                  </button>
                  <Link href={`/admin/meet/${meeting.id}`} className="mini">
                    Resultados
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(meeting)}
                    className="danger-x"
                    aria-label={`Borrar ${meeting.name}`}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function rangeLabel(dates: string[]) {
  if (!dates.length) return ''
  if (dates.length === 1) return dayLabel(dates[0])
  return `${dayLabel(dates[0])} → ${dayLabel(dates[dates.length - 1])}`
}
