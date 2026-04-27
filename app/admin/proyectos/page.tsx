'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Proyecto } from '@/lib/types'
import { isVideoUrl } from '@/lib/media'

export default function AdminProyectosPage() {
  const [projects, setProjects] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchProjects() {
    const res = await fetch('/api/admin/proyectos')
    const data = await res.json()
    setProjects(data)
    setLoading(false)
  }

  useEffect(() => { fetchProjects() }, [])

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este proyecto?')) return
    await fetch(`/api/admin/proyectos/${id}`, { method: 'DELETE' })
    fetchProjects()
  }

  async function handleTogglePublish(project: Proyecto) {
    await fetch(`/api/admin/proyectos/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !project.published }),
    })
    fetchProjects()
  }

  async function handleMoveProject(index: number, direction: -1 | 1) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= projects.length) return

    const reordered = [...projects]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(nextIndex, 0, moved)
    setProjects(reordered)

    const res = await fetch('/api/admin/proyectos/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: reordered.map((project) => project.id) }),
    })

    if (!res.ok) {
      fetchProjects()
      alert('No se pudo guardar el orden. Probá de nuevo.')
    }
  }

  return (
    <div className="p-8 md:p-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-white font-black text-3xl uppercase">Proyectos</h1>
        <Link
          href="/admin/proyectos/nuevo"
          className="gradient-bg text-black font-black text-sm uppercase tracking-widest px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
        >
          + Nuevo proyecto
        </Link>
      </div>

      {loading ? (
        <p className="text-white/30">Cargando...</p>
      ) : (
        <div className="space-y-3">
          {projects.map((project, index) => (
            <div
              key={project.id}
              className="flex items-center gap-4 bg-zinc-900 border border-white/5 rounded-xl px-5 py-4"
            >
              {/* Order controls */}
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleMoveProject(index, -1)}
                  disabled={index === 0}
                  className="text-[10px] px-2 py-1 rounded-md bg-zinc-800 text-white/60 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-25 disabled:pointer-events-none"
                >
                  Subir
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveProject(index, 1)}
                  disabled={index === projects.length - 1}
                  className="text-[10px] px-2 py-1 rounded-md bg-zinc-800 text-white/60 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-25 disabled:pointer-events-none"
                >
                  Bajar
                </button>
              </div>

              {/* Cover thumbnail */}
              <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden shrink-0">
                {project.coverImage ? (
                  isVideoUrl(project.coverImage) ? (
                    <video
                      src={project.coverImage}
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls={false}
                      preload="metadata"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={project.coverImage} alt="" className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="w-full h-full gradient-bg opacity-40" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold truncate">{project.name}</h3>
                <p className="text-white/30 text-xs mt-0.5">
                  {project.year} · {project.slug}
                  {project.featured && ' · ⭐ Destacado'}
                </p>
              </div>

              {/* Tags */}
              <div className="hidden md:flex gap-1 shrink-0">
                {project.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-white/50">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleTogglePublish(project)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    project.published
                      ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                      : 'bg-zinc-800 text-white/30 hover:text-white'
                  }`}
                >
                  {project.published ? 'Publicado' : 'Borrador'}
                </button>
                <Link
                  href={`/admin/proyectos/${project.id}`}
                  className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-white/60 hover:text-white hover:bg-zinc-700 transition-colors font-medium"
                >
                  Editar
                </Link>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="text-xs px-3 py-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
