'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import type { HorariosPublicData, PublicShow } from '@/lib/horarios/types'

type ViewState = 'loading' | 'locked' | 'ready' | 'error'

export default function HorariosClient() {
  const [state, setState] = useState<ViewState>('loading')
  const [data, setData] = useState<HorariosPublicData | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/horarios', { cache: 'no-store' })
      if (response.status === 401) {
        setState('locked')
        return
      }

      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || 'No pudimos cargar los horarios.')
      setData(payload)
      setState('ready')
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No pudimos cargar los horarios.')
      setState('error')
    }
  }, [])

  useEffect(() => {
    load()
    const refresh = window.setInterval(load, 5 * 60 * 1000)
    return () => window.clearInterval(refresh)
  }, [load])

  async function submitPin(event: React.FormEvent) {
    event.preventDefault()
    if (pin.length !== 4 || submitting) return

    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/horarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || 'No pudimos validar el PIN.')
      setPin('')
      await load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No pudimos validar el PIN.')
    } finally {
      setSubmitting(false)
    }
  }

  async function logout() {
    await fetch('/api/horarios/logout', { method: 'POST' })
    setData(null)
    setState('locked')
  }

  if (state === 'loading') return <LoadingScreen />
  if (state === 'locked') {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-black px-5 py-10 text-white">
        <div className="w-full max-w-sm">
          <Brand />
          <form onSubmit={submitPin} className="mt-12">
            <label htmlFor="horarios-pin" className="mb-3 block text-xs font-black uppercase tracking-[0.24em] text-white/40">
              PIN de acceso
            </label>
            <input
              id="horarios-pin"
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={4}
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
              aria-describedby={error ? 'pin-error' : undefined}
              className="h-16 w-full rounded-2xl border border-white/15 bg-zinc-900 px-5 text-center font-mono text-3xl font-bold tracking-[0.45em] text-white outline-none transition placeholder:text-white/15 focus:border-[#FE796D] focus:ring-4 focus:ring-[#FE796D]/15"
            />
            {error ? <p id="pin-error" className="mt-3 text-center text-sm text-rose-300">{error}</p> : null}
            <button
              type="submit"
              disabled={pin.length !== 4 || submitting}
              className="gradient-bg mt-5 min-h-12 w-full rounded-xl px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-[#FCC028]/25 disabled:cursor-not-allowed disabled:opacity-35"
            >
              {submitting ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  if (state === 'error') {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-black px-5 text-white">
        <div className="max-w-sm text-center">
          <p className="text-sm text-rose-300">{error}</p>
          <button onClick={load} className="mt-5 min-h-12 rounded-xl border border-white/15 px-5 text-sm font-bold hover:bg-white/5">
            Volver a intentar
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[100svh] bg-black px-4 py-5 text-white sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
          <Brand compact />
          <button
            type="button"
            onClick={logout}
            className="min-h-11 rounded-full border border-white/10 px-4 text-xs font-bold uppercase tracking-widest text-white/45 transition hover:border-white/25 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            Salir
          </button>
        </header>

        <div className="mb-7 mt-8 sm:mb-10 sm:mt-12">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-white/35">Cartelera interna</p>
          <h1 className="mt-2 text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl">Horarios</h1>
        </div>

        <section className="grid gap-4 md:grid-cols-2 md:gap-5">
          {(data?.shows ?? []).map((show, index) => (
            <ShowCard key={show.id} show={show} tone={index === 0 ? 'pink' : 'orange'} />
          ))}
        </section>
      </div>
    </main>
  )
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/logos/Logo ByN invertido.png"
        alt="Drama"
        width={compact ? 82 : 112}
        height={compact ? 23 : 31}
        className={compact ? 'h-6 w-auto' : 'mx-auto h-8 w-auto'}
        priority
      />
      {compact ? <span className="h-5 w-px bg-white/15" aria-hidden="true" /> : null}
      {compact ? <span className="text-xs font-black uppercase tracking-[0.22em] text-white/40">Horarios</span> : null}
    </div>
  )
}

function ShowCard({ show, tone }: { show: PublicShow; tone: 'pink' | 'orange' }) {
  const accent = tone === 'pink' ? 'from-[#F504FF] via-[#FE8B97] to-[#FE796D]' : 'from-[#FE796D] via-[#FCC028] to-[#FED791]'

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/75 shadow-2xl shadow-black/30">
      <div className={`h-1.5 bg-gradient-to-r ${accent}`} />
      <div className="p-5 sm:p-7">
        <div className="flex min-h-12 items-start justify-between gap-4">
          <h2 className="text-2xl font-black uppercase leading-none tracking-tight sm:text-3xl">{show.name}</h2>
          <Freshness value={show.lastSuccessfulCheckAt} />
        </div>

        {show.funciones.length ? (
          <ul className="mt-6 divide-y divide-white/8 border-y border-white/8">
            {show.funciones.map((funcion) => (
              <li key={`${funcion.fecha}-${funcion.hora}`} className="flex min-h-16 items-center justify-between gap-4 py-3.5">
                <span className="text-base font-bold capitalize text-white/75 sm:text-lg">{dateLabel(funcion.fecha)}</span>
                <span className="shrink-0 font-mono text-xl font-bold tabular-nums text-white sm:text-2xl">{timeLabel(funcion.hora)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center">
            <p className="text-sm text-white/35">Sin funciones futuras publicadas.</p>
          </div>
        )}
      </div>
    </article>
  )
}

function Freshness({ value }: { value: string | null }) {
  return (
    <span className="flex shrink-0 items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/30">
      <span className={`h-2 w-2 rounded-full ${value ? 'bg-emerald-400' : 'bg-white/20'}`} aria-hidden="true" />
      {value ? checkedLabel(value) : 'Pendiente'}
    </span>
  )
}

function dateLabel(value: string) {
  const date = new Date(`${value}T12:00:00-03:00`)
  const weekday = new Intl.DateTimeFormat('es-AR', { weekday: 'long', timeZone: 'America/Argentina/Buenos_Aires' }).format(date)
  const [year, month, day] = value.split('-')
  return `${weekday} ${Number(day)}/${Number(month)}`
}

function timeLabel(value: string) {
  const [hour, minute] = value.split(':')
  return minute === '00' ? `${Number(hour)}h` : `${Number(hour)}:${minute}h`
}

function checkedLabel(value: string) {
  const date = new Date(value)
  const formatter = new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires',
  })
  return formatter.format(date)
}

function LoadingScreen() {
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-black text-white">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-[#FE796D]" aria-label="Cargando" />
    </main>
  )
}

