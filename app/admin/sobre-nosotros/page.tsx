'use client'

import { useState, useEffect } from 'react'
import type { SiteSettings } from '@/lib/types'

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
