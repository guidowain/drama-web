'use client'

import { useMemo, useState } from 'react'
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

export default function SumateForm() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  const isSending = status === 'sending'
  const selectedCounts = useMemo(
    () => ({
      skills: form.skills.length,
      tools: form.tools.length,
    }),
    [form.skills.length, form.tools.length]
  )

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

      setStatus('sent')
      setForm(EMPTY_FORM)
    } catch (submitError) {
      setStatus('error')
      setError(submitError instanceof Error ? submitError.message : 'No pudimos enviar el formulario.')
    }
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

      {status === 'sent' && (
        <p className="rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm text-white">
          Recibimos tu formulario. Gracias por sumarte.
        </p>
      )}

      <button
        type="submit"
        disabled={isSending}
        className="gradient-bg w-full rounded-lg px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto md:min-w-56"
      >
        {isSending ? 'Enviando...' : 'Enviar'}
      </button>
    </form>
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
