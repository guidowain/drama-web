'use client'

import { useState, useEffect } from 'react'
import type { SiteSettings } from '@/lib/types'

export default function AdminAjustesPage() {
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

  function update(changes: Partial<SiteSettings['settings']>) {
    if (!settings) return
    setSettings({ ...settings, settings: { ...settings.settings, ...changes } })
  }

  if (!settings) return <div className="p-10 text-white/30">Cargando...</div>

  return (
    <div className="p-8 md:p-10 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-white font-black text-3xl uppercase">Ajustes</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="gradient-bg text-black font-black text-sm uppercase tracking-widest px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar'}
        </button>
      </div>

      <div className="space-y-8">
        <Section title="Redes sociales y contacto">
          <Field label="Instagram (URL completa)">
            <input
              type="url"
              value={settings.settings.instagram}
              onChange={(e) => update({ instagram: e.target.value })}
              className="admin-input"
              placeholder="https://instagram.com/drama"
            />
          </Field>
          <Field label="WhatsApp (URL wa.me)">
            <input
              type="url"
              value={settings.settings.whatsapp}
              onChange={(e) => update({ whatsapp: e.target.value })}
              className="admin-input"
              placeholder="https://wa.me/5491100000000"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={settings.settings.mail}
              onChange={(e) => update({ mail: e.target.value })}
              className="admin-input"
            />
          </Field>
        </Section>

        <Section title="Logos">
          <Field label="Logo principal (URL)">
            <input
              type="text"
              value={settings.settings.logoMain}
              onChange={(e) => update({ logoMain: e.target.value })}
              className="admin-input"
              placeholder="/logos/drama-logo.svg"
            />
          </Field>
          <Field label="Logo menú (URL)">
            <input
              type="text"
              value={settings.settings.logoMenu}
              onChange={(e) => update({ logoMenu: e.target.value })}
              className="admin-input"
            />
          </Field>
          <Field label="Favicon (URL)">
            <input
              type="text"
              value={settings.settings.favicon}
              onChange={(e) => update({ favicon: e.target.value })}
              className="admin-input"
            />
          </Field>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-white/40 text-xs font-bold uppercase tracking-widest border-b border-white/5 pb-2">
        {title}
      </h2>
      {children}
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
