'use client'

import { useState, useEffect } from 'react'
import type { FaqItem, SiteSettings } from '@/lib/types'

export default function AdminSobreNosotrosPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/site').then((r) => r.json()).then(setSettings)
  }, [])

  async function handleSave() {
    if (!settings) return
    setSaving(true)
    await fetch('/api/admin/site', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function update(changes: Partial<SiteSettings['about']>) {
    if (!settings) return
    setSettings({ ...settings, about: { ...settings.about, ...changes } })
  }

  function updateFaq(index: number, changes: Partial<FaqItem>) {
    if (!settings) return

    update({
      faqs: settings.about.faqs.map((faq, i) => (
        i === index ? { ...faq, ...changes } : faq
      )),
    })
  }

  function addFaq() {
    if (!settings) return
    update({ faqs: [...settings.about.faqs, { question: '', answer: '' }] })
  }

  function removeFaq(index: number) {
    if (!settings) return
    update({ faqs: settings.about.faqs.filter((_, i) => i !== index) })
  }

  function moveFaq(from: number, to: number) {
    if (!settings || to < 0 || to >= settings.about.faqs.length || from === to) return

    const next = [...settings.about.faqs]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    update({ faqs: next })
  }

  if (!settings) return <div className="p-10 text-white/30">Cargando...</div>

  return (
    <div className="p-8 md:p-10 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-white font-black text-3xl uppercase">Sobre Nosotros</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="gradient-bg text-black font-black text-sm uppercase tracking-widest px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar'}
        </button>
      </div>

      <div className="space-y-5">
        <Field label="Título principal">
          <textarea
            value={settings.about.title}
            onChange={(e) => update({ title: e.target.value })}
            rows={2}
            placeholder={'SOMOS\nDRAMA'}
            className="admin-textarea"
          />
        </Field>
        <Field label="Imagen (URL)">
          <input
            type="text"
            value={settings.about.image}
            onChange={(e) => update({ image: e.target.value })}
            placeholder="/uploads/equipo.jpg"
            className="admin-input"
          />
        </Field>
        <Field label="Alt de la imagen">
          <input
            type="text"
            value={settings.about.imageAlt}
            onChange={(e) => update({ imageAlt: e.target.value })}
            className="admin-input"
          />
        </Field>
        <Field label="Título sección 1">
          <input
            type="text"
            value={settings.about.quienesSomosTitle}
            onChange={(e) => update({ quienesSomosTitle: e.target.value })}
            className="admin-input"
          />
        </Field>
        <Field label="Texto sección 1">
          <textarea
            value={settings.about.quienesSomos}
            onChange={(e) => update({ quienesSomos: e.target.value })}
            rows={4}
            className="admin-textarea"
          />
        </Field>
        <Field label="Título sección 2">
          <input
            type="text"
            value={settings.about.comoTrabajamosTitle}
            onChange={(e) => update({ comoTrabajamosTitle: e.target.value })}
            className="admin-input"
          />
        </Field>
        <Field label="Texto sección 2">
          <textarea
            value={settings.about.comoTrabajamos}
            onChange={(e) => update({ comoTrabajamos: e.target.value })}
            rows={4}
            className="admin-textarea"
          />
        </Field>
        <Field label="Título sección 3">
          <input
            type="text"
            value={settings.about.queDiferenciaTitle}
            onChange={(e) => update({ queDiferenciaTitle: e.target.value })}
            className="admin-input"
          />
        </Field>
        <Field label="Texto sección 3">
          <textarea
            value={settings.about.queDiferencia}
            onChange={(e) => update({ queDiferencia: e.target.value })}
            rows={4}
            className="admin-textarea"
          />
        </Field>

        <div className="pt-5 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-white font-black text-xl uppercase">Preguntas frecuentes</h2>
            <button
              type="button"
              onClick={addFaq}
              className="bg-white text-black font-black text-xs uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-white/90 transition-colors"
            >
              Agregar
            </button>
          </div>

          <div className="space-y-4">
            {settings.about.faqs.map((faq, index) => (
              <div key={index} className="min-w-0 rounded-xl bg-zinc-900/70 border border-white/10 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="min-w-0 text-white/40 text-xs uppercase tracking-wider break-words">
                    Pregunta {index + 1}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveFaq(index, index - 1)}
                      disabled={index === 0}
                      className="text-white/70 text-xs font-bold uppercase px-2 py-1 rounded border border-white/10 disabled:opacity-30"
                    >
                      Subir
                    </button>
                    <button
                      type="button"
                      onClick={() => moveFaq(index, index + 1)}
                      disabled={index === settings.about.faqs.length - 1}
                      className="text-white/70 text-xs font-bold uppercase px-2 py-1 rounded border border-white/10 disabled:opacity-30"
                    >
                      Bajar
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFaq(index)}
                      className="text-red-300 text-xs font-bold uppercase px-2 py-1 rounded border border-red-300/20"
                    >
                      Borrar
                    </button>
                  </div>
                </div>

                <Field label="Pregunta">
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => updateFaq(index, { question: e.target.value })}
                    className="admin-input"
                  />
                </Field>
                <Field label="Respuesta">
                  <textarea
                    value={faq.answer}
                    onChange={(e) => updateFaq(index, { answer: e.target.value })}
                    rows={4}
                    className="admin-textarea"
                  />
                </Field>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">{label}</label>
      {children}
    </div>
  )
}
