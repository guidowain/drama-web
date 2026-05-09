'use client'

import { useState, useEffect } from 'react'
import type { FaqItem, LocaleCode, SiteSettings, SiteSettingsTranslation } from '@/lib/types'
import LanguageTabs from '@/components/admin/LanguageTabs'

export default function AdminNosotrosPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [activeLocale, setActiveLocale] = useState<LocaleCode>('es')
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

  function updateTranslation(changes: NonNullable<SiteSettingsTranslation['about']>) {
    if (!settings || activeLocale === 'es') return
    const locale = activeLocale
    const currentTranslation = settings.translations?.[locale] ?? {}

    setSettings({
      ...settings,
      translations: {
        ...settings.translations,
        [locale]: {
          ...currentTranslation,
          about: {
            ...currentTranslation.about,
            ...changes,
          },
        },
      },
    })
  }

  function updateFaq(index: number, changes: Partial<FaqItem>) {
    if (!settings) return

    update({
      faqs: settings.about.faqs.map((faq, i) => (
        i === index ? { ...faq, ...changes } : faq
      )),
    })
  }

  function updateTranslatedFaq(index: number, changes: Partial<FaqItem>) {
    if (!settings || activeLocale === 'es') return
    const translatedFaqs = [...(settings.translations?.[activeLocale]?.about?.faqs ?? [])]
    translatedFaqs[index] = {
      ...translatedFaqs[index],
      ...changes,
    }
    updateTranslation({ faqs: translatedFaqs })
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

  const isBaseLocale = activeLocale === 'es'
  const translatedAbout = isBaseLocale ? null : settings.translations?.[activeLocale]?.about

  return (
    <div className="p-8 md:p-10 max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-white font-black text-3xl uppercase">Nosotros</h1>
        <div className="flex items-center gap-3">
          <LanguageTabs value={activeLocale} onChange={setActiveLocale} />
          <button
            onClick={handleSave}
            disabled={saving}
            className="gradient-bg text-black font-black text-sm uppercase tracking-widest px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar'}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <Field label="Título principal">
          <textarea
            value={isBaseLocale ? settings.about.title : translatedAbout?.title ?? ''}
            onChange={(e) => isBaseLocale ? update({ title: e.target.value }) : updateTranslation({ title: e.target.value })}
            rows={2}
            placeholder={isBaseLocale ? 'SOMOS\nDRAMA' : settings.about.title}
            className="admin-textarea"
          />
        </Field>
        {isBaseLocale && <Field label="Imagen (URL)">
          <input
            type="text"
            value={settings.about.image}
            onChange={(e) => update({ image: e.target.value })}
            placeholder="/uploads/equipo.jpg"
            className="admin-input"
          />
        </Field>}
        <Field label="Alt de la imagen">
          <input
            type="text"
            value={isBaseLocale ? settings.about.imageAlt : translatedAbout?.imageAlt ?? ''}
            onChange={(e) => isBaseLocale ? update({ imageAlt: e.target.value }) : updateTranslation({ imageAlt: e.target.value })}
            placeholder={isBaseLocale ? undefined : settings.about.imageAlt}
            className="admin-input"
          />
        </Field>
        <Field label="Título sección 1">
          <input
            type="text"
            value={isBaseLocale ? settings.about.quienesSomosTitle : translatedAbout?.quienesSomosTitle ?? ''}
            onChange={(e) => isBaseLocale ? update({ quienesSomosTitle: e.target.value }) : updateTranslation({ quienesSomosTitle: e.target.value })}
            placeholder={isBaseLocale ? undefined : settings.about.quienesSomosTitle}
            className="admin-input"
          />
        </Field>
        <Field label="Texto sección 1">
          <textarea
            value={isBaseLocale ? settings.about.quienesSomos : translatedAbout?.quienesSomos ?? ''}
            onChange={(e) => isBaseLocale ? update({ quienesSomos: e.target.value }) : updateTranslation({ quienesSomos: e.target.value })}
            placeholder={isBaseLocale ? undefined : settings.about.quienesSomos}
            rows={4}
            className="admin-textarea"
          />
        </Field>
        <Field label="Título sección 2">
          <input
            type="text"
            value={isBaseLocale ? settings.about.comoTrabajamosTitle : translatedAbout?.comoTrabajamosTitle ?? ''}
            onChange={(e) => isBaseLocale ? update({ comoTrabajamosTitle: e.target.value }) : updateTranslation({ comoTrabajamosTitle: e.target.value })}
            placeholder={isBaseLocale ? undefined : settings.about.comoTrabajamosTitle}
            className="admin-input"
          />
        </Field>
        <Field label="Texto sección 2">
          <textarea
            value={isBaseLocale ? settings.about.comoTrabajamos : translatedAbout?.comoTrabajamos ?? ''}
            onChange={(e) => isBaseLocale ? update({ comoTrabajamos: e.target.value }) : updateTranslation({ comoTrabajamos: e.target.value })}
            placeholder={isBaseLocale ? undefined : settings.about.comoTrabajamos}
            rows={4}
            className="admin-textarea"
          />
        </Field>
        <Field label="Título sección 3">
          <input
            type="text"
            value={isBaseLocale ? settings.about.queDiferenciaTitle : translatedAbout?.queDiferenciaTitle ?? ''}
            onChange={(e) => isBaseLocale ? update({ queDiferenciaTitle: e.target.value }) : updateTranslation({ queDiferenciaTitle: e.target.value })}
            placeholder={isBaseLocale ? undefined : settings.about.queDiferenciaTitle}
            className="admin-input"
          />
        </Field>
        <Field label="Texto sección 3">
          <textarea
            value={isBaseLocale ? settings.about.queDiferencia : translatedAbout?.queDiferencia ?? ''}
            onChange={(e) => isBaseLocale ? update({ queDiferencia: e.target.value }) : updateTranslation({ queDiferencia: e.target.value })}
            placeholder={isBaseLocale ? undefined : settings.about.queDiferencia}
            rows={4}
            className="admin-textarea"
          />
        </Field>

        <div className="pt-5 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-white font-black text-xl uppercase">Preguntas frecuentes</h2>
            {isBaseLocale && <button
              type="button"
              onClick={addFaq}
              className="bg-white text-black font-black text-xs uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-white/90 transition-colors"
            >
              Agregar
            </button>}
          </div>

          <div className="space-y-4">
            {settings.about.faqs.map((faq, index) => (
              <div key={index} className="relative min-w-0 rounded-xl bg-zinc-900/70 border border-white/10 p-4 pr-12 space-y-3">
                {isBaseLocale && <button
                  type="button"
                  onClick={() => removeFaq(index)}
                  className="danger-x absolute right-3 top-3"
                  aria-label={`Borrar pregunta ${index + 1}`}
                  title="Borrar"
                >
                  ×
                </button>}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="min-w-0 text-white/40 text-xs uppercase tracking-wider break-words">
                    Pregunta {index + 1}
                  </span>
                  {isBaseLocale && <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveFaq(index, index - 1)}
                      disabled={index === 0}
                      className="icon-mini"
                      aria-label={`Subir pregunta ${index + 1}`}
                      title="Subir"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveFaq(index, index + 1)}
                      disabled={index === settings.about.faqs.length - 1}
                      className="icon-mini"
                      aria-label={`Bajar pregunta ${index + 1}`}
                      title="Bajar"
                    >
                      ↓
                    </button>
                  </div>}
                </div>

                <Field label="Pregunta">
                  <input
                    type="text"
                    value={isBaseLocale ? faq.question : translatedAbout?.faqs?.[index]?.question ?? ''}
                    onChange={(e) => isBaseLocale ? updateFaq(index, { question: e.target.value }) : updateTranslatedFaq(index, { question: e.target.value })}
                    placeholder={isBaseLocale ? undefined : faq.question}
                    className="admin-input"
                  />
                </Field>
                <Field label="Respuesta">
                  <textarea
                    value={isBaseLocale ? faq.answer : translatedAbout?.faqs?.[index]?.answer ?? ''}
                    onChange={(e) => isBaseLocale ? updateFaq(index, { answer: e.target.value }) : updateTranslatedFaq(index, { answer: e.target.value })}
                    placeholder={isBaseLocale ? undefined : faq.answer}
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
