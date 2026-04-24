'use client'

import { useState } from 'react'

type Props = {
  whatsapp: string
}

export default function ContactFormClient({ whatsapp }: Props) {
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', mensaje: '' })
  const [sent, setSent] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const msg = `Hola Drama! Soy ${form.nombre} ${form.apellido} (${form.email}).\n\n${form.mensaje}`
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
          placeholder="Nombre"
          required
          value={form.nombre}
          onChange={handleChange}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30"
        />
        <input
          name="apellido"
          placeholder="Apellido"
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
        placeholder="Mensaje"
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
        {sent ? '¡Enviado! 🎉' : 'Enviar'}
      </button>
    </form>
  )
}
