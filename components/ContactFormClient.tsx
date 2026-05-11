'use client'

import { useState } from 'react'
import { useSiteCopy } from '@/lib/LocaleContext'

type Props = {
  whatsapp: string
}

export default function ContactFormClient({ whatsapp }: Props) {
  const copy = useSiteCopy()
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', mensaje: '' })
  const [sent, setSent] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const msg = `${copy.contactForm.whatsappIntro} ${form.nombre} ${form.apellido} (${form.email}).\n\n${form.mensaje}`
    const clean = whatsapp.replace(/\D/g, '')
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank')
    setSent(true)
    setTimeout(() => setSent(false), 4000)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          name="nombre"
          placeholder={copy.contactForm.firstName}
          required
          value={form.nombre}
          onChange={handleChange}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30"
        />
        <input
          name="apellido"
          placeholder={copy.contactForm.lastName}
          value={form.apellido}
          onChange={handleChange}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30"
        />
      </div>
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        value={form.email}
        onChange={handleChange}
        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30"
      />
      <textarea
        name="mensaje"
        placeholder={copy.contactForm.message}
        required
        rows={3}
        value={form.mensaje}
        onChange={handleChange}
        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30 resize-none"
      />
      <button
        type="submit"
        className="gradient-bg text-black font-black text-sm uppercase tracking-wider py-3 rounded-lg hover:opacity-90 transition-opacity"
      >
        {sent ? copy.contactForm.sent : copy.contactForm.send}
      </button>
    </form>
  )
}
