'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  CURRENT_STATUS_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  FOUND_US_OPTIONS,
  ROLE_OPTIONS,
  SKILL_OPTIONS,
  TOOL_OPTIONS,
  WORK_EXPERIENCE_OPTIONS,
} from '@/lib/sumate-options'

type FormState = {
  fullName: string
  age: string
  location: string
  role: string
  experienceLevel: string
  currentStatus: string[]
  skills: string[]
  tools: string[]
  workExperience: string[]
  coverLetter: string
  portfolio: string
  salaryExpectation: string
  email: string
  foundUs: string[]
}

const EMPTY_FORM: FormState = {
  fullName: '',
  age: '',
  location: '',
  role: '',
  experienceLevel: '',
  currentStatus: [],
  skills: [],
  tools: [],
  workExperience: [],
  coverLetter: '',
  portfolio: '',
  salaryExpectation: '',
  email: '',
  foundUs: [],
}

export default function SumateForm({ instagramUrl }: { instagramUrl: string }) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [origin, setOrigin] = useState({ x: 50, y: 50 })
  const [shareFeedback, setShareFeedback] = useState('')
  const submitRef = useRef<HTMLButtonElement>(null)

  const isSending = status === 'sending'
  const canShowDevPreview = process.env.NODE_ENV !== 'production'
  const selectedCounts = useMemo(
    () => ({
      skills: form.skills.length,
      tools: form.tools.length,
    }),
    [form.skills.length, form.tools.length]
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  const showSuccess = useCallback((source?: HTMLElement | null) => {
    if (source && typeof window !== 'undefined') {
      const rect = source.getBoundingClientRect()
      setOrigin({
        x: ((rect.left + rect.width / 2) / window.innerWidth) * 100,
        y: ((rect.top + rect.height / 2) / window.innerHeight) * 100,
      })
    }

    setExpanded(false)
    setStatus('sent')
    setForm(EMPTY_FORM)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setExpanded(true)
      })
    })
  }, [])

  useEffect(() => {
    if (!canShowDevPreview || typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    if (params.get('gracias') === '1') {
      showSuccess()
    }
  }, [canShowDevPreview, showSuccess])

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function toggleArray(field: keyof Pick<FormState, 'currentStatus' | 'skills' | 'tools' | 'workExperience' | 'foundUs'>, value: string, max?: number) {
    setForm((current) => {
      const values = current[field]
      const exists = values.includes(value)

      if (!exists && max && values.length >= max) return current

      return {
        ...current,
        [field]: exists ? values.filter((item) => item !== value) : [...values, value],
      }
    })
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')
    setError('')

    try {
      const response = await fetch('/api/sumate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'No pudimos enviar el formulario.')
      }

      showSuccess(submitRef.current)
    } catch (submitError) {
      setStatus('error')
      setError(submitError instanceof Error ? submitError.message : 'No pudimos enviar el formulario.')
    }
  }

  async function handleShare() {
    if (typeof window === 'undefined') return

    const url = `${window.location.origin}/sumate`
    const title = 'Sumate a Drama'
    const text = 'Compartir esta búsqueda.'

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url })
        return
      }

      await navigator.clipboard.writeText(url)
      setShareFeedback('Link copiado')
    } catch {
      setShareFeedback('No pudimos compartirlo. Probá copiando la URL.')
    }
  }

  if (status === 'sent') {
    return (
      <div className="fixed inset-0 z-[501] flex overflow-y-auto px-5 py-24 text-black md:px-10">
        {mounted && createPortal(
          <div
            aria-hidden
            className="fixed inset-0 z-[500] pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, #F504FF 0%, #FE8B97 28%, #FE796D 50%, #FCC028 75%, #FED791 100%)',
              backgroundSize: '250% 250%',
              animation: 'gradient-live 6s ease infinite',
              clipPath: `circle(${expanded ? '200%' : '0%'} at ${origin.x}% ${origin.y}%)`,
              opacity: 1,
              transition: 'clip-path 0.75s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />,
          document.body
        )}

        <div className="relative z-[1] mx-auto flex w-full max-w-4xl flex-col items-start justify-center gap-7 self-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-black/55">
            Solicitud enviada
          </p>
          <div className="space-y-5">
            <h2 className="max-w-3xl text-5xl font-black uppercase leading-none md:text-7xl">
              ¡Gracias por sumarte!
            </h2>
            <p className="max-w-2xl text-lg font-semibold leading-snug text-black/72 md:text-2xl">
              Recibimos tu solicitud. La vamos a revisar y, si aparece una oportunidad que matchee con tu perfil, te escribimos.
            </p>
          </div>

          <div className="grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-16 w-full items-center justify-center gap-3 rounded-lg bg-white px-6 py-4 text-center font-enriq text-xs font-black uppercase tracking-[0.14em] transition-opacity hover:opacity-90"
            >
              <span className="text-black">Seguinos en Instagram</span>
              <IconInstagram />
            </a>
            <button
              type="button"
              onClick={handleShare}
              className="flex min-h-16 w-full items-center justify-center gap-3 rounded-lg bg-white px-6 py-4 text-center font-enriq text-xs font-black uppercase tracking-[0.14em] text-black transition-opacity hover:opacity-90"
            >
              <span>Compartir esta búsqueda</span>
              <IconShare />
            </button>
          </div>

          {shareFeedback && (
            <p className="text-sm font-bold text-black/60">{shareFeedback}</p>
          )}

          <Link
            href="/home"
            className="mx-auto mt-5 rounded-lg bg-black px-7 py-4 font-enriq text-xs font-black uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-85"
          >
            Volver a Drama
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.3fr_0.7fr]">
        <TextInput
          label="Nombre completo"
          value={form.fullName}
          onChange={(value) => updateField('fullName', value)}
          required
          placeholder="Tu nombre y apellido"
        />
        <TextInput
          label="Edad"
          type="number"
          value={form.age}
          onChange={(value) => updateField('age', value)}
          required
          min={16}
          max={99}
          placeholder="Ej. 28"
        />
      </div>

      <TextInput
        label="Ubicación"
        value={form.location}
        onChange={(value) => updateField('location', value)}
        required
        placeholder="Ciudad, País"
      />

      <OptionSection label="Rol" required>
        <SingleChoice
          options={ROLE_OPTIONS}
          value={form.role}
          onChange={(value) => updateField('role', value)}
          name="role"
        />
      </OptionSection>

      <OptionSection label="Nivel de experiencia" required>
        <SingleChoice
          options={EXPERIENCE_LEVEL_OPTIONS}
          value={form.experienceLevel}
          onChange={(value) => updateField('experienceLevel', value)}
          name="experienceLevel"
        />
      </OptionSection>

      <OptionSection label="Estado actual" description="Podés seleccionar más de una opción." required>
        <MultiChoice
          options={CURRENT_STATUS_OPTIONS}
          values={form.currentStatus}
          onToggle={(value) => toggleArray('currentStatus', value)}
        />
      </OptionSection>

      <OptionSection label="Habilidades" description="Podés seleccionar hasta 10 opciones." hint={`${selectedCounts.skills}/10`} required>
        <MultiChoice
          options={SKILL_OPTIONS}
          values={form.skills}
          onToggle={(value) => toggleArray('skills', value, 10)}
        />
      </OptionSection>

      <OptionSection label="Herramientas" description="Podés seleccionar hasta 10 opciones." hint={`${selectedCounts.tools}/10`} required>
        <MultiChoice
          options={TOOL_OPTIONS}
          values={form.tools}
          onToggle={(value) => toggleArray('tools', value, 10)}
        />
      </OptionSection>

      <OptionSection label="Experiencia laboral" description="Podés seleccionar más de una opción." required>
        <MultiChoice
          options={WORK_EXPERIENCE_OPTIONS}
          values={form.workExperience}
          onToggle={(value) => toggleArray('workExperience', value)}
        />
      </OptionSection>

      <TextArea
        label="Carta de presentación"
        value={form.coverLetter}
        onChange={(value) => updateField('coverLetter', value)}
        required
        placeholder="Contanos quién sos, cómo pensás, por qué estás acá y cuál es tu vínculo con el entretenimiento."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextInput
          label="Portfolio"
          value={form.portfolio}
          onChange={(value) => updateField('portfolio', value)}
          required
          placeholder="Link a tu portfolio, Behance, Drive, Instagram, sitio, etc."
        />
        <TextInput
          label="Contacto (email)"
          type="email"
          value={form.email}
          onChange={(value) => updateField('email', value)}
          required
          placeholder="tu@email.com"
        />
      </div>

      <TextInput
        label="Pretensión salarial / Tarifa por hora"
        value={form.salaryExpectation}
        onChange={(value) => updateField('salaryExpectation', value)}
        placeholder="Opcional. Ej: USD 800-1200/mes, ARS 5000/hora"
      />

      <OptionSection label="¿Cómo nos encontraste?" description="Podés seleccionar más de una opción." required>
        <MultiChoice
          options={FOUND_US_OPTIONS}
          values={form.foundUs}
          onToggle={(value) => toggleArray('foundUs', value)}
        />
      </OptionSection>

      {status === 'error' && (
        <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      )}

      <button
        ref={submitRef}
        type="submit"
        disabled={isSending}
        className="gradient-bg w-full rounded-lg px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto md:min-w-56"
      >
        {isSending ? 'Enviando...' : 'Enviar'}
      </button>

      {canShowDevPreview && (
        <button
          type="button"
          onClick={(event) => showSuccess(event.currentTarget)}
          className="block text-left text-xs font-bold uppercase tracking-[0.14em] text-white/30 transition-colors hover:text-white/65"
        >
          Probar pantalla de gracias
        </button>
      )}
    </form>
  )
}

function IconInstagram() {
  return (
    <svg
      aria-hidden
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="sumateInstagramGradient" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F504FF" />
          <stop offset="0.45" stopColor="#FE796D" />
          <stop offset="1" stopColor="#FCC028" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="url(#sumateInstagramGradient)" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="url(#sumateInstagramGradient)" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.25" fill="#FE796D" />
    </svg>
  )
}

function IconShare() {
  return (
    <svg
      aria-hidden
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="sumateShareGradient" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F504FF" />
          <stop offset="0.45" stopColor="#FE796D" />
          <stop offset="1" stopColor="#FCC028" />
        </linearGradient>
      </defs>
      <path
        d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M12 15V4M8 8l4-4 4 4"
        stroke="url(#sumateShareGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TextInput({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
  min,
  max,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  placeholder?: string
  min?: number
  max?: number
}) {
  return (
    <label className="block">
      <FieldLabel label={label} required={required} />
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder-white/25 outline-none transition-colors focus:border-white/35"
      />
    </label>
  )
}

function TextArea({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
}) {
  return (
    <label className="block">
      <FieldLabel label={label} required={required} />
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        rows={6}
        className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder-white/25 outline-none transition-colors focus:border-white/35"
      />
    </label>
  )
}

function OptionSection({
  label,
  description,
  hint,
  required,
  children,
}: {
  label: string
  description?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <fieldset>
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <legend className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">
            {label}{required ? <RequiredMark /> : null}
          </legend>
          {description && (
            <p className="mt-1 text-sm font-medium leading-snug text-white/35">
              {description}
            </p>
          )}
        </div>
        {hint && <span className="text-xs font-bold text-white/30">{hint}</span>}
      </div>
      {children}
    </fieldset>
  )
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-white/45">
      {label}{required ? <RequiredMark /> : null}
    </span>
  )
}

function RequiredMark() {
  return <span className="gradient-text ml-1">*</span>
}

function SingleChoice({
  options,
  value,
  onChange,
  name,
}: {
  options: string[]
  value: string
  onChange: (value: string) => void
  name: string
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const checked = value === option

        return (
        <label key={option} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={option}
            checked={checked}
            onChange={() => onChange(option)}
            required
            className="peer sr-only"
          />
          <span
            className={[
              'inline-flex rounded-full border-2 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] transition-all duration-200 hover:border-white/55',
              checked
                ? 'sumate-choice-selected border-transparent text-black shadow-[0_0_18px_rgba(254,120,109,0.22)]'
                : 'border-white/20 bg-white/5 text-white/65',
            ].join(' ')}
          >
            <span className={checked ? 'relative z-[1]' : undefined}>{option}</span>
          </span>
        </label>
        )
      })}
    </div>
  )
}

function MultiChoice({
  options,
  values,
  onToggle,
}: {
  options: string[]
  values: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const checked = values.includes(option)

        return (
          <label key={option} className="cursor-pointer">
            <input
              type="checkbox"
              value={option}
              checked={checked}
              onChange={() => onToggle(option)}
              className="peer sr-only"
            />
            <span
              className={[
                'inline-flex rounded-full border-2 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] transition-all duration-200 hover:border-white/55',
                checked
                  ? 'sumate-choice-selected border-transparent text-black shadow-[0_0_18px_rgba(254,120,109,0.22)]'
                  : 'border-white/20 bg-white/5 text-white/65',
              ].join(' ')}
            >
              <span className={checked ? 'relative z-[1]' : undefined}>{option}</span>
            </span>
          </label>
        )
      })}
    </div>
  )
}
