'use client'

import { useState, useEffect } from 'react'
import type { SiteSettings, Logo } from '@/lib/types'
import ImageUploader from '@/components/admin/ImageUploader'

export default function AdminHomePage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/site').then((r) => r.json()).then(setSettings)
  }, [])

  async function persistSettings(nextSettings: SiteSettings) {
    setSaving(true)
    await fetch('/api/admin/site', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nextSettings),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleSave() {
    if (!settings) return
    await persistSettings(settings)
  }

  function updateHome(changes: Partial<SiteSettings['home']>) {
    if (!settings) return
    setSettings({ ...settings, home: { ...settings.home, ...changes } })
  }

  function updateDesign(changes: Partial<SiteSettings['home']['services']['design']>) {
    if (!settings) return
    setSettings({
      ...settings,
      home: {
        ...settings.home,
        services: {
          ...settings.home.services,
          design: { ...settings.home.services.design, ...changes },
        },
      },
    })
  }

  function updateComm(changes: Partial<SiteSettings['home']['services']['communication']>) {
    if (!settings) return
    setSettings({
      ...settings,
      home: {
        ...settings.home,
        services: {
          ...settings.home.services,
          communication: { ...settings.home.services.communication, ...changes },
        },
      },
    })
  }

  if (!settings) return <div className="p-10 text-white/30">Cargando...</div>

  return (
    <div className="p-8 md:p-10 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-white font-black text-3xl uppercase">Home</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="gradient-bg text-black font-black text-sm uppercase tracking-widest px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar'}
        </button>
      </div>

      <div className="space-y-8">
        {/* Hero */}
        <Section title="Hero">
          <AdminInput
            label="Video (URL)"
            value={settings.home.heroVideo}
            onChange={(v) => updateHome({ heroVideo: v })}
          />
          <AdminInput
            label="Línea 1 del claim"
            value={settings.home.heroLine1}
            onChange={(v) => updateHome({ heroLine1: v })}
          />
          <AdminInput
            label="Línea 2 del claim"
            value={settings.home.heroLine2}
            onChange={(v) => updateHome({ heroLine2: v })}
          />
        </Section>

        {/* Contact */}
        <Section title="Contacto">
          <AdminInput
            label="Email"
            value={settings.home.contact.mail}
            onChange={(v) => updateHome({ contact: { ...settings.home.contact, mail: v } })}
          />
          <AdminInput
            label="WhatsApp"
            value={settings.home.contact.whatsapp}
            onChange={(v) => updateHome({ contact: { ...settings.home.contact, whatsapp: v } })}
          />
          <AdminInput
            label="Instagram"
            value={settings.home.contact.instagram}
            onChange={(v) => updateHome({ contact: { ...settings.home.contact, instagram: v } })}
          />
        </Section>

        {/* Logos ticker */}
        <Section title="Logos de clientes (ticker)">
          <div className="rounded-xl bg-zinc-900/50 border border-white/5 p-4 text-white/30 text-xs leading-relaxed mb-2">
            <span className="text-white/50 font-semibold">Tamaño recomendado:</span> PNG con fondo transparente,{' '}
            <span className="text-white/50">altura 120 px</span> × ancho libre (aprox. 200–400 px).
            Se muestran en escala de grises automáticamente.
          </div>
          <LogosEditor
            logos={settings.home.logos}
            onChange={(logos) => updateHome({ logos })}
          />
        </Section>

        {/* Services */}
        <Section title="Servicio: Diseño">
          <AdminInput
            label="Nombre"
            value={settings.home.services.design.name}
            onChange={(v) => updateDesign({ name: v })}
          />
          <AdminTextarea
            label="Descripción"
            value={settings.home.services.design.description}
            onChange={(v) => updateDesign({ description: v })}
          />
          <ItemListEditor
            label="Items"
            items={settings.home.services.design.items}
            onChange={(items) => updateDesign({ items })}
          />
        </Section>

        <Section title="Servicio: Comunicación">
          <AdminInput
            label="Nombre"
            value={settings.home.services.communication.name}
            onChange={(v) => updateComm({ name: v })}
          />
          <AdminTextarea
            label="Descripción"
            value={settings.home.services.communication.description}
            onChange={(v) => updateComm({ description: v })}
          />
          <ItemListEditor
            label="Items"
            items={settings.home.services.communication.items}
            onChange={(items) => updateComm({ items })}
          />
        </Section>
      </div>
    </div>
  )
}

function LogosEditor({
  logos,
  onChange,
}: {
  logos: Logo[]
  onChange: (logos: Logo[]) => void
}) {
  function updateLogo(i: number, changes: Partial<Logo>) {
    const next = logos.map((l, j) => (j === i ? { ...l, ...changes } : l))
    onChange(next)
  }

  function removeLogo(i: number) {
    onChange(logos.filter((_, j) => j !== i))
  }

  function addLogo() {
    onChange([...logos, { src: '', alt: '' }])
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {logos.map((logo, i) => (
          <div key={i} className="relative rounded-xl border border-white/8 bg-zinc-900 p-3 space-y-2">
            {/* Remove */}
            <button
              type="button"
              onClick={() => removeLogo(i)}
              className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full bg-zinc-800 text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors text-xs z-10"
            >
              ✕
            </button>

            {/* Image uploader — square crop, checkerboard bg to see transparency */}
            <div
              className="rounded-lg overflow-hidden"
              style={{
                backgroundImage:
                  'repeating-conic-gradient(#333 0% 25%, #222 0% 50%)',
                backgroundSize: '12px 12px',
              }}
            >
              <ImageUploader
                value={logo.src}
                onChange={(url) => updateLogo(i, { src: url })}
                aspect="1/1"
                fit="contain"
                placeholder="Logo PNG"
              />
            </div>

          </div>
        ))}

        {/* Add button */}
        <button
          type="button"
          onClick={addLogo}
          className="rounded-xl border-2 border-dashed border-white/10 hover:border-white/20 bg-zinc-900/50 hover:bg-zinc-900 flex flex-col items-center justify-center gap-2 text-white/30 hover:text-white/50 transition-all min-h-[120px]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span className="text-xs">Agregar logo</span>
        </button>
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

function AdminInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-white/30"
      />
    </div>
  )
}

function AdminTextarea({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full bg-zinc-900 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-white/30 resize-none"
      />
    </div>
  )
}

function ItemListEditor({
  label,
  items,
  onChange,
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
}) {
  const [input, setInput] = useState('')

  function add() {
    const t = input.trim()
    if (t) { onChange([...items, t]); setInput('') }
  }

  return (
    <div>
      <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">{label}</label>
      <ul className="space-y-1.5 mb-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => {
                const next = [...items]
                next[i] = e.target.value
                onChange(next)
              }}
              className="flex-1 bg-zinc-900 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-white/30"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="text-white/30 hover:text-red-400 text-sm px-1"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Nuevo item..."
          className="flex-1 bg-zinc-900 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-white/30"
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg"
        >
          +
        </button>
      </div>
    </div>
  )
}
