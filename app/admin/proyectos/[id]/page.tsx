'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ContentBlockEditor from '@/components/admin/ContentBlockEditor'
import { ProjectFormFields } from '@/components/admin/ProjectFormFields'
import LanguageTabs from '@/components/admin/LanguageTabs'
import { slugify } from '@/lib/utils'
import type { Proyecto, ContentBlock, LocaleCode, ProyectoTranslation, TranslationLocale } from '@/lib/types'

export default function EditarProyectoPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeLocale, setActiveLocale] = useState<LocaleCode>('es')
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
  const [translations, setTranslations] = useState<Proyecto['translations']>({})

  useEffect(() => {
    fetch(`/api/admin/proyectos/${id}`)
      .then((r) => r.json())
      .then((data: Proyecto) => {
        setForm({
          name: data.name,
          slug: data.slug,
          year: data.year,
          featured: data.featured,
          published: data.published,
          tags: data.tags,
          coverImage: data.coverImage,
          coverImageAlt: data.coverImageAlt,
          seoTitle: data.seoTitle || '',
          seoDescription: data.seoDescription || '',
          excerpt: data.excerpt || '',
        })
        setBlocks(data.contentBlocks)
        setTranslations(data.translations ?? {})
        setLoading(false)
      })
  }, [id])

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

  function updateTranslation(changes: ProyectoTranslation) {
    if (activeLocale === 'es') return
    const locale = activeLocale
    setTranslations((current) => ({
      ...current,
      [locale]: {
        ...current?.[locale],
        ...changes,
      },
    }))
  }

  function updateTranslatedBlock(index: number, changes: NonNullable<ProyectoTranslation['contentBlocks']>[number]) {
    if (activeLocale === 'es') return
    const locale = activeLocale
    const nextBlocks = [...(translations?.[locale]?.contentBlocks ?? [])]
    nextBlocks[index] = {
      ...nextBlocks[index],
      ...changes,
    }
    updateTranslation({ contentBlocks: nextBlocks })
  }

  function addTranslatedTag() {
    if (activeLocale === 'es') return
    const t = tagInput.trim()
    const currentTags = translations?.[activeLocale]?.tags ?? []
    if (t && !currentTags.includes(t)) {
      updateTranslation({ tags: [...currentTags, t] })
    }
    setTagInput('')
  }

  function removeTranslatedTag(tag: string) {
    if (activeLocale === 'es') return
    const currentTags = translations?.[activeLocale]?.tags ?? []
    updateTranslation({ tags: currentTags.filter((t) => t !== tag) })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch(`/api/admin/proyectos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, contentBlocks: blocks, translations }),
      })
      router.push('/admin/proyectos')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-10 text-white/30">Cargando proyecto...</div>
    )
  }

  return (
    <div className="p-8 md:p-10 max-w-3xl">
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="text-white/30 hover:text-white text-sm">
          ← Volver
        </button>
        <h1 className="text-white font-black text-3xl uppercase">Editar proyecto</h1>
        <div className="ml-auto">
          <LanguageTabs value={activeLocale} onChange={setActiveLocale} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeLocale === 'es' ? (
          <>
            <ProjectFormFields
              form={form}
              tagInput={tagInput}
              onNameChange={handleNameChange}
              onChange={(changes) => setForm((f) => ({ ...f, ...changes }))}
              onTagInputChange={setTagInput}
              onAddTag={addTag}
              onRemoveTag={removeTag}
            />

            <fieldset className="space-y-3">
              <legend className="text-white/40 text-xs uppercase tracking-widest mb-3">
                Bloques de contenido
              </legend>
              <ContentBlockEditor blocks={blocks} onChange={setBlocks} />
            </fieldset>
          </>
        ) : (
          <ProjectTranslationFields
            locale={activeLocale}
            project={form}
            blocks={blocks}
            translation={translations?.[activeLocale]}
            tagInput={tagInput}
            onTagInputChange={setTagInput}
            onChange={updateTranslation}
            onAddTag={addTranslatedTag}
            onRemoveTag={removeTranslatedTag}
            onBlockChange={updateTranslatedBlock}
          />
        )}

        <div className="flex gap-3 pt-4 border-t border-white/10">
          <button
            type="submit"
            disabled={saving}
            className="gradient-bg text-black font-black text-sm uppercase tracking-widest px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
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

function ProjectTranslationFields({
  locale,
  project,
  blocks,
  translation,
  tagInput,
  onTagInputChange,
  onChange,
  onAddTag,
  onRemoveTag,
  onBlockChange,
}: {
  locale: TranslationLocale
  project: {
    name: string
    tags: string[]
    coverImageAlt: string
    seoTitle: string
    seoDescription: string
    excerpt: string
  }
  blocks: ContentBlock[]
  translation?: ProyectoTranslation
  tagInput: string
  onTagInputChange: (value: string) => void
  onChange: (changes: ProyectoTranslation) => void
  onAddTag: () => void
  onRemoveTag: (tag: string) => void
  onBlockChange: (index: number, changes: NonNullable<ProyectoTranslation['contentBlocks']>[number]) => void
}) {
  const tags = translation?.tags ?? []

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/8 bg-zinc-900/60 p-4 text-xs leading-relaxed text-white/35">
        Estás editando traducciones {locale.toUpperCase()}. La portada, el año, el slug, el orden y el layout se editan solo en ES.
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TranslatedInput
          label="Nombre del proyecto"
          value={translation?.name ?? ''}
          placeholder={project.name}
          onChange={(name) => onChange({ name })}
        />
        <TranslatedInput
          label="Alt de portada"
          value={translation?.coverImageAlt ?? ''}
          placeholder={project.coverImageAlt}
          onChange={(coverImageAlt) => onChange({ coverImageAlt })}
        />
      </div>

      <div>
        <label className="admin-label">Etiquetas</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => onTagInputChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddTag() } }}
            placeholder="Agregar etiqueta traducida..."
            className="admin-input flex-1"
          />
          <button type="button" onClick={onAddTag} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg transition-colors">
            Agregar
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {(tags.length ? tags : project.tags).map((tag, index) => (
            <span key={`${tag}-${index}`} className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 text-white text-xs rounded-full">
              {tag}
              {tags.length > 0 && (
                <button type="button" onClick={() => onRemoveTag(tag)} className="-mr-1 flex h-5 w-5 items-center justify-center rounded-full text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300">
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-white/5 space-y-4">
        <p className="text-white/20 text-[10px] uppercase tracking-widest font-bold">SEO</p>
        <TranslatedInput label="SEO Title" value={translation?.seoTitle ?? ''} placeholder={project.seoTitle} onChange={(seoTitle) => onChange({ seoTitle })} />
        <TranslatedTextarea label="SEO Description" value={translation?.seoDescription ?? ''} placeholder={project.seoDescription} onChange={(seoDescription) => onChange({ seoDescription })} rows={2} />
        <TranslatedTextarea label="Extracto" value={translation?.excerpt ?? ''} placeholder={project.excerpt} onChange={(excerpt) => onChange({ excerpt })} rows={2} />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-white/40 text-xs uppercase tracking-widest mb-3">
          Bloques de contenido
        </legend>
        {blocks.map((block, index) => (
          <div key={block.id} className="rounded-2xl border border-white/8 bg-zinc-900 p-4">
            <div className="mb-3 text-xs uppercase tracking-widest text-white/30">
              Bloque {index + 1} · {block.type}
            </div>
            <div className="space-y-3">
              <TranslatedInput label="Título" value={translation?.contentBlocks?.[index]?.title ?? ''} placeholder={block.title} onChange={(title) => onBlockChange(index, { title })} />
              <TranslatedTextarea label="Texto" value={translation?.contentBlocks?.[index]?.text ?? ''} placeholder={block.text} onChange={(text) => onBlockChange(index, { text })} rows={4} />
              <TranslatedInput label="Alt media 1" value={translation?.contentBlocks?.[index]?.imageAlt ?? ''} placeholder={block.imageAlt} onChange={(imageAlt) => onBlockChange(index, { imageAlt })} />
              {block.image2 !== undefined && (
                <TranslatedInput label="Alt media 2" value={translation?.contentBlocks?.[index]?.image2Alt ?? ''} placeholder={block.image2Alt} onChange={(image2Alt) => onBlockChange(index, { image2Alt })} />
              )}
            </div>
          </div>
        ))}
      </fieldset>
    </div>
  )
}

function TranslatedInput({ label, value, placeholder, onChange }: { label: string; value?: string; placeholder?: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="admin-label">{label}</label>
      <input type="text" value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="admin-input placeholder-white/20" />
    </div>
  )
}

function TranslatedTextarea({ label, value, placeholder, rows, onChange }: { label: string; value?: string; placeholder?: string; rows: number; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="admin-label">{label}</label>
      <textarea value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} rows={rows} className="admin-textarea placeholder-white/20" />
    </div>
  )
}
