'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ContentBlockEditor from '@/components/admin/ContentBlockEditor'
import { ProjectFormFields } from '@/components/admin/ProjectFormFields'
import { slugify } from '@/lib/utils'
import type { ContentBlock } from '@/lib/types'

export default function NuevoProyectoPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    year: new Date().getFullYear(),
    featured: false,
    published: false,
    tags: [] as string[],
    coverImage: '',
    coverImageAlt: '',
    seoTitle: '',
    seoDescription: '',
    excerpt: '',
  })
  const [tagInput, setTagInput] = useState('')
  const [blocks, setBlocks] = useState<ContentBlock[]>([])

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: slugify(name) }))
  }

  function addTag() {
    const t = tagInput.trim()
    if (t && !form.tags.includes(t)) {
      setForm((f) => ({ ...f, tags: [...f.tags, t] }))
    }
    setTagInput('')
  }

  function removeTag(tag: string) {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/proyectos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, contentBlocks: blocks }),
      })
      if (res.ok) {
        router.push('/admin/proyectos')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 md:p-10 max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="text-white/30 hover:text-white text-sm">
          ← Volver
        </button>
        <h1 className="text-white font-black text-3xl uppercase">Nuevo proyecto</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <ProjectFormFields
          form={form}
          tagInput={tagInput}
          onNameChange={handleNameChange}
          onChange={(changes) => setForm((f) => ({ ...f, ...changes }))}
          onTagInputChange={setTagInput}
          onAddTag={addTag}
          onRemoveTag={removeTag}
        />

        {/* Content blocks */}
        <fieldset className="space-y-3">
          <legend className="text-white/40 text-xs uppercase tracking-widest mb-3">
            Bloques de contenido
          </legend>
          <ContentBlockEditor blocks={blocks} onChange={setBlocks} />
        </fieldset>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <button
            type="submit"
            disabled={saving || !form.name}
            className="gradient-bg text-black font-black text-sm uppercase tracking-widest px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Crear proyecto'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl bg-zinc-800 text-white text-sm hover:bg-zinc-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
