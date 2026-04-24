'use client'

import ImageUploader from './ImageUploader'

export function ProjectFormFields({
  form,
  tagInput,
  onNameChange,
  onChange,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
}: {
  form: {
    name: string
    slug: string
    year: number
    featured: boolean
    published: boolean
    tags: string[]
    coverImage: string
    coverImageAlt: string
    seoTitle: string
    seoDescription: string
    excerpt: string
  }
  tagInput: string
  onNameChange: (name: string) => void
  onChange: (changes: Partial<typeof form>) => void
  onTagInputChange: (v: string) => void
  onAddTag: () => void
  onRemoveTag: (tag: string) => void
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="admin-label">Nombre del proyecto</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onNameChange(e.target.value)}
            required
            className="admin-input"
            placeholder="Ej: School of Rock"
          />
        </div>
        <div>
          <label className="admin-label">Slug (URL)</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => onChange({ slug: e.target.value })}
            required
            className="admin-input"
            placeholder="school-of-rock"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="admin-label">Año</label>
          <input
            type="number"
            value={form.year}
            onChange={(e) => onChange({ year: Number(e.target.value) })}
            className="admin-input"
            min={2000}
            max={2099}
          />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <input
            type="checkbox"
            id="featured"
            checked={form.featured}
            onChange={(e) => onChange({ featured: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <label htmlFor="featured" className="text-white text-sm cursor-pointer">
            Destacado
          </label>
        </div>
        <div className="flex items-center gap-3 pt-6">
          <input
            type="checkbox"
            id="published"
            checked={form.published}
            onChange={(e) => onChange({ published: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <label htmlFor="published" className="text-white text-sm cursor-pointer">
            Publicado
          </label>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="admin-label">Etiquetas</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => onTagInputChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddTag() } }}
            placeholder="Agregar etiqueta..."
            className="admin-input flex-1"
          />
          <button
            type="button"
            onClick={onAddTag}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg transition-colors"
          >
            Agregar
          </button>
        </div>
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {form.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 text-white text-xs rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  className="text-white/40 hover:text-red-400 ml-0.5"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Cover */}
      <div>
        <label className="admin-label">Imagen de portada</label>
        <ImageUploader
          value={form.coverImage}
          onChange={(url) => onChange({ coverImage: url })}
          aspect="16/9"
          placeholder="Arrastrá la portada del proyecto o hacé click para subir"
        />
        {form.coverImage && (
          <input
            type="text"
            value={form.coverImageAlt}
            onChange={(e) => onChange({ coverImageAlt: e.target.value })}
            placeholder="Descripción de la imagen (alt)…"
            className="admin-input mt-2"
          />
        )}
      </div>

      {/* SEO */}
      <div className="pt-2 border-t border-white/5 space-y-4">
        <p className="text-white/20 text-[10px] uppercase tracking-widest font-bold">SEO</p>
        <div>
          <label className="admin-label">SEO Title</label>
          <input
            type="text"
            value={form.seoTitle}
            onChange={(e) => onChange({ seoTitle: e.target.value })}
            placeholder="Título para Google..."
            className="admin-input"
          />
        </div>
        <div>
          <label className="admin-label">SEO Description</label>
          <textarea
            value={form.seoDescription}
            onChange={(e) => onChange({ seoDescription: e.target.value })}
            placeholder="Descripción para buscadores (max 160 caracteres)..."
            maxLength={160}
            rows={2}
            className="admin-textarea"
          />
        </div>
        <div>
          <label className="admin-label">Extracto</label>
          <textarea
            value={form.excerpt}
            onChange={(e) => onChange({ excerpt: e.target.value })}
            placeholder="Texto corto para previews y redes..."
            rows={2}
            className="admin-textarea"
          />
        </div>
      </div>
    </>
  )
}
