'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
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
  return words.map((word) => ({
    ...word,
    word: word.word.toUpperCase().trim(),
    projectId: word.projectId.trim(),
  }))
}

function validateWords(words: DramaWord[]) {
  for (let index = 0; index < words.length; index += 1) {
    const number = index + 1
    const entry = words[index]

    if (!/^[A-ZÁÉÍÓÚÜÑ]{5}$/.test(entry.word)) {
      return `La palabra ${number} debe tener exactamente 5 letras (solo letras, sin espacios ni números).`
    }

    if (!entry.projectId.trim()) {
      return `La palabra ${number} necesita una obra para revelar al final.`
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
    setWords((current) => current.map((word) => (word.id === id ? { ...word, ...changes } : word)))
  }

  function addWord() {
    setWords((current) => [...current, createWord()])
  }

  function removeWord(id: string) {
    setWords((current) => current.filter((word) => word.id !== id))
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

      const savedWords = await response.json()
      setWords(Array.isArray(savedWords) ? savedWords : [])
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
    <div className="max-w-5xl p-8 md:p-10">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xl">
          <h1 className="text-3xl font-black uppercase text-white">Dramadle</h1>
          <p className="mt-1 text-sm text-white/30">
            Cargá palabras secretas de 5 letras. La obra elegida sólo se revela al final como contexto.
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
          <p className="mb-5 text-sm text-white/40">Todavía no hay palabras cargadas.</p>
          <button
            type="button"
            onClick={addWord}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-black uppercase tracking-widest text-black transition-colors hover:bg-white/90"
          >
            Agregar la primera
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-950/40">
          <div className="hidden grid-cols-[44px_170px_minmax(220px,1fr)_72px_36px] gap-3 border-b border-white/5 px-4 py-3 text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/25 md:grid">
            <span>#</span>
            <span>Palabra</span>
            <span>Reveal final</span>
            <span>Preview</span>
            <span />
          </div>

          {words.map((entry, index) => {
            const project = projects.find((item) => item.id === entry.projectId)

            return (
              <div
                key={entry.id}
                className="grid gap-3 border-b border-white/5 bg-zinc-900/70 p-4 last:border-b-0 md:grid-cols-[44px_170px_minmax(220px,1fr)_72px_36px] md:items-center"
              >
                <span className="text-xs font-black text-white/20 md:text-right">{index + 1}</span>

                <div>
                  <label className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white/25 md:hidden">
                    Palabra
                  </label>
                  <input
                    type="text"
                    value={entry.word}
                    maxLength={5}
                    onChange={(event) => {
                      const nextWord = event.target.value
                        .toUpperCase()
                        .replace(/[^A-ZÁÉÍÓÚÜÑ]/g, '')
                        .slice(0, 5)

                      updateWord(entry.id, { word: nextWord })
                    }}
                    className="admin-input h-11 text-center text-base font-black uppercase tracking-[0.32em]"
                    placeholder="PISTA"
                    spellCheck={false}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white/25 md:hidden">
                    Reveal final
                  </label>
                  <select
                    value={entry.projectId}
                    onChange={(event) => updateWord(entry.id, { projectId: event.target.value })}
                    className="admin-input h-11"
                  >
                    <option value="">Elegir obra para revelar al final...</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center md:justify-center">
                  {project?.coverImage ? (
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-white/10">
                      <Image
                        src={project.coverImage}
                        alt={project.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="h-11 w-11 rounded-lg border border-white/5 bg-black/20" />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeWord(entry.id)}
                  className="danger-x justify-self-start md:justify-self-center"
                  aria-label={`Eliminar palabra ${index + 1}`}
                  title="Eliminar"
                >
                  ×
                </button>
              </div>
            )
          })}

          <div className="flex justify-end p-4">
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
      <Link
        href="/proyectos?funMode=dramadle"
        target="_blank"
        className="rounded-xl border border-white/15 bg-black/20 px-5 py-2.5 text-sm font-black uppercase tracking-widest text-white transition-colors hover:border-white/35 hover:bg-white/10"
      >
        Visualizar
      </Link>
      <button
        type="button"
        onClick={onAddWord}
        className="rounded-xl bg-white px-5 py-2.5 text-sm font-black uppercase tracking-widest text-black transition-colors hover:bg-white/90"
      >
        Agregar palabra
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={!canSave}
        className="gradient-bg rounded-xl px-5 py-2.5 text-sm font-black uppercase tracking-widest text-black transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar'}
      </button>
    </div>
  )
}
