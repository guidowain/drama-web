'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import type { DramaWord } from '@/lib/types'

type ProjectOption = {
  id: string
  name: string
  coverImage: string
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createWord(): DramaWord {
  return {
    id: createId('dramadle'),
    word: '',
    projectId: '',
  }
}

function normalizeBeforeSave(words: DramaWord[]) {
  return words.map((w) => ({
    ...w,
    word: w.word.toUpperCase().trim(),
    projectId: w.projectId.trim(),
  }))
}

function validateWords(words: DramaWord[]) {
  for (let index = 0; index < words.length; index += 1) {
    const number = index + 1
    const entry = words[index]

    if (!/^[A-ZÁÉÍÓÚÜÑ]{5}$/.test(entry.word.toUpperCase().trim())) {
      return `La palabra ${number} debe tener exactamente 5 letras (solo letras, sin espacios ni números).`
    }

    if (!entry.projectId.trim()) {
      return `La palabra ${number} necesita una obra asociada.`
    }
  }

  return ''
}

export default function AdminDramadlePage() {
  const [words, setWords] = useState<DramaWord[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const wordCount = words.length
  const canSave = useMemo(() => !saving && !loading, [loading, saving])

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/dramadle').then((response) => {
        if (!response.ok) throw new Error('No se pudo cargar el Dramadle')
        return response.json()
      }),
      fetch('/api/admin/proyectos').then((response) => {
        if (!response.ok) throw new Error('No se pudieron cargar los proyectos')
        return response.json()
      }),
    ])
      .then(([dramaData, projectsData]) => {
        setWords(Array.isArray(dramaData) ? dramaData : [])
        setProjects(
          Array.isArray(projectsData)
            ? projectsData
                .filter((project) => project?.id && project?.name && project?.coverImage)
                .map((project) => ({
                  id: project.id,
                  name: project.name,
                  coverImage: project.coverImage,
                }))
                .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
            : []
        )
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'No se pudo cargar el Dramadle')
      })
      .finally(() => setLoading(false))
  }, [])

  function updateWord(id: string, changes: Partial<DramaWord>) {
    setWords((current) =>
      current.map((w) => (w.id === id ? { ...w, ...changes } : w))
    )
  }

  function addWord() {
    setWords((current) => [...current, createWord()])
  }

  function removeWord(id: string) {
    setWords((current) => current.filter((w) => w.id !== id))
  }

  async function handleSave() {
    setError('')
    const normalized = normalizeBeforeSave(words)
    const validationError = validateWords(normalized)

    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/admin/dramadle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalized),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'No se pudo guardar el Dramadle')
      }

      const saved = await response.json()
      setWords(Array.isArray(saved) ? saved : [])
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el Dramadle')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-10 text-white/30">Cargando...</div>

  return (
    <div className="p-8 md:p-10 max-w-3xl">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between mb-8">
        <div>
          <h1 className="text-white font-black text-3xl uppercase">Dramadle</h1>
          <p className="text-white/30 text-sm mt-1">
            Cada día se usa una palabra distinta, rotando en orden. Agregá palabras de 5 letras y asocialas a una obra.
          </p>
        </div>

        <DramadleActions
          canSave={canSave}
          saving={saving}
          saved={saved}
          onAddWord={addWord}
          onSave={handleSave}
        />
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
          {error}
        </div>
      )}

      {wordCount === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-zinc-900 p-8 text-center">
          <p className="text-white/40 text-sm mb-5">Todavía no hay palabras cargadas.</p>
          <button
            type="button"
            onClick={addWord}
            className="bg-white text-black font-black text-sm uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors"
          >
            Agregar la primera
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {words.map((entry, index) => {
            const project = projects.find((p) => p.id === entry.projectId)

            return (
              <div
                key={entry.id}
                className="relative rounded-2xl border border-white/5 bg-zinc-900 p-4 pr-12 flex items-center gap-4"
              >
                <button
                  type="button"
                  onClick={() => removeWord(entry.id)}
                  className="danger-x absolute right-4 top-1/2 -translate-y-1/2"
                  aria-label={`Eliminar palabra ${index + 1}`}
                  title="Eliminar"
                >
                  ×
                </button>

                <span className="text-white/20 text-xs font-black w-5 shrink-0 text-right">
                  {index + 1}
                </span>

                <input
                  type="text"
                  value={entry.word}
                  maxLength={5}
                  onChange={(event) =>
                    updateWord(entry.id, { word: event.target.value.toUpperCase() })
                  }
                  className="admin-input w-28 font-black text-center text-lg tracking-[0.3em] uppercase shrink-0"
                  placeholder="OBRAS"
                  spellCheck={false}
                />

                <select
                  value={entry.projectId}
                  onChange={(event) => updateWord(entry.id, { projectId: event.target.value })}
                  className="admin-input flex-1 min-w-0"
                >
                  <option value="">Elegir obra...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                {project?.coverImage && (
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10">
                    <Image
                      src={project.coverImage}
                      alt={project.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
              </div>
            )
          })}

          <div className="flex justify-end border-t border-white/5 pt-6 mt-6">
            <DramadleActions
              canSave={canSave}
              saving={saving}
              saved={saved}
              onAddWord={addWord}
              onSave={handleSave}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function DramadleActions({
  canSave,
  saving,
  saved,
  onAddWord,
  onSave,
}: {
  canSave: boolean
  saving: boolean
  saved: boolean
  onAddWord: () => void
  onSave: () => void
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={onAddWord}
        className="bg-white text-black font-black text-sm uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors"
      >
        Agregar palabra
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={!canSave}
        className="gradient-bg text-black font-black text-sm uppercase tracking-widest px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar'}
      </button>
    </div>
  )
}
