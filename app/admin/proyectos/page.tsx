'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Proyecto } from '@/lib/types'
import { isVideoUrl } from '@/lib/media'
import { useUnsavedChanges } from '@/lib/use-unsaved-changes'

type ViewMode = 'grid' | 'list'
type StatusFilter = 'all' | 'published' | 'draft'

const VIEW_STORAGE_KEY = 'drama-admin-projects-view'

export default function AdminProyectosPage() {
  const [projects, setProjects] = useState<Proyecto[]>([])
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [view, setView] = useState<ViewMode>('grid')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [savingOrder, setSavingOrder] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [busyIds, setBusyIds] = useState<string[]>([])
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY)
    if (stored === 'grid' || stored === 'list') setView(stored)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/admin/proyectos')
        if (!res.ok) throw new Error('No se pudieron cargar los proyectos.')
        const data: Proyecto[] = await res.json()
        if (cancelled) return
        setProjects(data)
        setSavedIds(data.map((project) => project.id))
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar los proyectos.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  function changeView(next: ViewMode) {
    setView(next)
    window.localStorage.setItem(VIEW_STORAGE_KEY, next)
  }

  const isDirty = useMemo(
    () => projects.length === savedIds.length && projects.some((project, index) => project.id !== savedIds[index]),
    [projects, savedIds]
  )

  useUnsavedChanges(isDirty, 'Reordenaste proyectos y no guardaste el orden. Si salís ahora se pierde. ¿Salir igual?')

  // Reordenar un subconjunto filtrado es ambiguo: sólo se arrastra sobre la lista completa.
  const canReorder = !query.trim() && statusFilter === 'all'

  const visibleProjects = useMemo(() => {
    const term = query.trim().toLowerCase()
    return projects.filter((project) => {
      if (statusFilter === 'published' && !project.published) return false
      if (statusFilter === 'draft' && project.published) return false
      if (!term) return true
      return (
        project.name.toLowerCase().includes(term) ||
        project.slug.toLowerCase().includes(term) ||
        String(project.year).includes(term) ||
        project.tags.some((tag) => tag.toLowerCase().includes(term))
      )
    })
  }, [projects, query, statusFilter])

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    setProjects((current) => {
      const from = current.findIndex((project) => project.id === active.id)
      const to = current.findIndex((project) => project.id === over.id)
      if (from === -1 || to === -1) return current
      return arrayMove(current, from, to)
    })
    setOrderError(null)
  }

  function moveBy(id: string, direction: -1 | 1) {
    setProjects((current) => {
      const from = current.findIndex((project) => project.id === id)
      const to = from + direction
      if (from === -1 || to < 0 || to >= current.length) return current
      return arrayMove(current, from, to)
    })
    setOrderError(null)
  }

  async function saveOrder() {
    setSavingOrder(true)
    setOrderError(null)
    const ids = projects.map((project) => project.id)

    try {
      const res = await fetch('/api/admin/proyectos/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'No se pudo guardar el orden.')
      }
      setSavedIds(ids)
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : 'No se pudo guardar el orden.')
    } finally {
      setSavingOrder(false)
    }
  }

  function discardOrder() {
    setProjects((current) => {
      const byId = new Map(current.map((project) => [project.id, project]))
      const restored = savedIds.map((id) => byId.get(id)).filter(Boolean) as Proyecto[]
      return restored.length === current.length ? restored : current
    })
    setOrderError(null)
  }

  async function handleTogglePublish(project: Proyecto) {
    const nextPublished = !project.published
    setBusyIds((current) => [...current, project.id])
    setProjects((current) =>
      current.map((item) => (item.id === project.id ? { ...item, published: nextPublished } : item))
    )

    try {
      const res = await fetch(`/api/admin/proyectos/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: nextPublished }),
      })
      if (!res.ok) throw new Error('fallo')
    } catch {
      // Revertimos sólo esta fila: no hace falta recargar toda la lista.
      setProjects((current) =>
        current.map((item) => (item.id === project.id ? { ...item, published: !nextPublished } : item))
      )
      setOrderError(`No se pudo cambiar el estado de "${project.name}".`)
    } finally {
      setBusyIds((current) => current.filter((id) => id !== project.id))
    }
  }

  async function handleDelete(project: Proyecto) {
    setBusyIds((current) => [...current, project.id])

    try {
      const res = await fetch(`/api/admin/proyectos/${project.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('fallo')
      setProjects((current) => current.filter((item) => item.id !== project.id))
      setSavedIds((current) => current.filter((id) => id !== project.id))
      setConfirmingDelete(null)
    } catch {
      setOrderError(`No se pudo eliminar "${project.name}".`)
    } finally {
      setBusyIds((current) => current.filter((id) => id !== project.id))
    }
  }

  const activeProject = activeId ? projects.find((project) => project.id === activeId) ?? null : null

  return (
    <div className="p-8 md:p-10 pb-32 md:pb-28">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-white font-black text-3xl uppercase">Proyectos</h1>
          <p className="text-white/30 text-xs mt-1">
            {projects.length} {projects.length === 1 ? 'proyecto' : 'proyectos'} · el orden acá es el orden del sitio
          </p>
        </div>
        <Link
          href="/admin/proyectos/nuevo"
          className="gradient-bg text-black font-black text-sm uppercase tracking-widest px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
        >
          + Nuevo proyecto
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, slug, año o tag..."
          className="admin-input flex-1 min-w-[200px] max-w-sm"
        />

        <div className="flex rounded-lg border border-white/10 p-0.5">
          {([
            ['all', 'Todos'],
            ['published', 'Publicados'],
            ['draft', 'Borradores'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                statusFilter === value ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex rounded-lg border border-white/10 p-0.5">
          <button
            type="button"
            onClick={() => changeView('grid')}
            className={`px-2.5 py-1.5 rounded-md transition-colors ${
              view === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
            }`}
            aria-label="Ver como grilla"
            aria-pressed={view === 'grid'}
            title="Grilla"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => changeView('list')}
            className={`px-2.5 py-1.5 rounded-md transition-colors ${
              view === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
            }`}
            aria-label="Ver como lista"
            aria-pressed={view === 'list'}
            title="Lista"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {!canReorder && !loading && !loadError && (
        <p className="mb-4 text-xs text-amber-300/70">
          Estás filtrando: limpiá la búsqueda y el filtro para poder reordenar.
        </p>
      )}

      {loading ? (
        <SkeletonGrid view={view} />
      ) : loadError ? (
        <p className="text-red-400 text-sm">{loadError}</p>
      ) : visibleProjects.length === 0 ? (
        <p className="text-white/30 text-sm">
          {projects.length === 0 ? 'Todavía no hay proyectos.' : 'Ningún proyecto coincide con la búsqueda.'}
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext
            items={visibleProjects.map((project) => project.id)}
            strategy={view === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
          >
            {/* Misma estructura que /proyectos (1 col mobile, 2 desktop, portadas 1:1) para que
                el orden y el emparejado por fila coincidan, pero a escala reducida: acá sólo
                hay que reconocer el diseño, no verlo a tamaño real. */}
            <div
              className={
                view === 'grid'
                  ? 'grid w-full max-w-2xl grid-cols-1 items-stretch gap-4 md:grid-cols-2 md:gap-5'
                  : 'space-y-3'
              }
            >
              {visibleProjects.map((project) => (
                <SortableProject
                  key={project.id}
                  project={project}
                  view={view}
                  canReorder={canReorder}
                  position={projects.findIndex((item) => item.id === project.id) + 1}
                  busy={busyIds.includes(project.id)}
                  confirming={confirmingDelete === project.id}
                  onRequestDelete={() => setConfirmingDelete(project.id)}
                  onCancelDelete={() => setConfirmingDelete(null)}
                  onConfirmDelete={() => handleDelete(project)}
                  onTogglePublish={() => handleTogglePublish(project)}
                  onMoveUp={() => moveBy(project.id, -1)}
                  onMoveDown={() => moveBy(project.id, 1)}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeProject ? (
              <div className="rounded-xl border border-white/20 bg-zinc-900 shadow-2xl shadow-black/60 rotate-1 overflow-hidden">
                {view === 'grid' ? (
                  <div className="w-56">
                    <div className="aspect-square">
                      <Cover project={activeProject} />
                    </div>
                    <p className="truncate px-3 py-2 text-xs font-bold text-white">{activeProject.name}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                      <Cover project={activeProject} />
                    </div>
                    <p className="text-sm font-bold text-white">{activeProject.name}</p>
                  </div>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Barra de guardado: sólo aparece con cambios pendientes */}
      {(isDirty || orderError) && (
        <div className="fixed inset-x-0 bottom-[4.5rem] z-50 px-4 md:bottom-6 md:left-56 md:px-8">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/95 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur">
            {orderError ? (
              <p className="flex-1 text-sm font-medium text-red-400">{orderError}</p>
            ) : (
              <p className="flex-1 text-sm text-white/70">
                <span className="font-bold text-white">Orden sin guardar.</span> Los cambios todavía no están en el sitio.
              </p>
            )}

            {isDirty && (
              <>
                <button
                  type="button"
                  onClick={discardOrder}
                  disabled={savingOrder}
                  className="rounded-lg px-3 py-2 text-xs font-bold text-white/50 transition-colors hover:text-white disabled:opacity-40"
                >
                  Descartar
                </button>
                <button
                  type="button"
                  onClick={saveOrder}
                  disabled={savingOrder}
                  className="gradient-bg rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {savingOrder ? 'Guardando...' : 'Guardar orden'}
                </button>
              </>
            )}

            {!isDirty && orderError && (
              <button
                type="button"
                onClick={() => setOrderError(null)}
                className="rounded-lg px-3 py-2 text-xs font-bold text-white/50 transition-colors hover:text-white"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SortableProject({
  project,
  view,
  canReorder,
  position,
  busy,
  confirming,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  onTogglePublish,
  onMoveUp,
  onMoveDown,
}: {
  project: Proyecto
  view: ViewMode
  canReorder: boolean
  position: number
  busy: boolean
  confirming: boolean
  onRequestDelete: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
  onTogglePublish: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
    disabled: !canReorder,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  }

  const gripIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
    </svg>
  )

  const dragHandle = canReorder ? (
    <button
      type="button"
      {...attributes}
      {...listeners}
      className="cursor-grab touch-none rounded-md p-1 text-white/25 transition-colors hover:bg-white/10 hover:text-white active:cursor-grabbing"
      aria-label={`Reordenar ${project.name}`}
      title="Arrastrar para reordenar"
    >
      {gripIcon}
    </button>
  ) : null

  const publishButton = (
    <button
      type="button"
      onClick={onTogglePublish}
      disabled={busy}
      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors disabled:opacity-50 ${
        project.published
          ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
          : 'bg-zinc-800 text-white/40 hover:text-white'
      }`}
    >
      {busy ? '···' : project.published ? 'Publicado' : 'Borrador'}
    </button>
  )

  const deleteControl = confirming ? (
    <span className="flex items-center gap-1">
      <button
        type="button"
        onClick={onConfirmDelete}
        disabled={busy}
        className="rounded-lg bg-red-500/15 px-2 py-1 text-[11px] font-bold text-red-400 transition-colors hover:bg-red-500/25 disabled:opacity-50"
      >
        {busy ? '···' : 'Eliminar'}
      </button>
      <button
        type="button"
        onClick={onCancelDelete}
        className="rounded-lg px-2 py-1 text-[11px] font-bold text-white/40 transition-colors hover:text-white"
      >
        No
      </button>
    </span>
  ) : (
    <button
      type="button"
      onClick={onRequestDelete}
      className="danger-x"
      aria-label={`Eliminar ${project.name}`}
      title="Eliminar"
    >
      ×
    </button>
  )

  if (view === 'grid') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="group relative overflow-hidden rounded-xl border border-white/5 bg-zinc-900 transition-colors hover:border-white/20"
      >
        {/* La portada entera es la zona de arrastre: agarrás el afiche donde quieras. */}
        <div
          {...attributes}
          {...listeners}
          aria-label={canReorder ? `Reordenar ${project.name}` : undefined}
          title={canReorder ? 'Arrastrá el afiche para reordenar' : undefined}
          className={`relative aspect-square select-none ${
            canReorder ? 'cursor-grab touch-none active:cursor-grabbing' : ''
          }`}
        >
          <Cover project={project} />
          <span className="absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-black text-white/80 backdrop-blur">
            {position}
          </span>
          {!project.published && (
            <span className="absolute right-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur">
              Borrador
            </span>
          )}
          {canReorder && (
            <span className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-black/60 p-1 text-white/70 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
              {gripIcon}
            </span>
          )}
        </div>

        <div className="p-3">
          <h3 className="truncate text-sm font-bold text-white">{project.name}</h3>
          <p className="mt-0.5 truncate text-[11px] text-white/30">
            {project.year}
            {project.featured && ' · ⭐'}
          </p>

          <div className="mt-2.5 flex items-center justify-between gap-2">
            {publishButton}
            <div className="flex items-center gap-1">
              <Link
                href={`/admin/proyectos/${project.id}`}
                className="rounded-lg bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-white/60 transition-colors hover:bg-zinc-700 hover:text-white"
              >
                Editar
              </Link>
              {deleteControl}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative flex items-center gap-4 rounded-xl border border-white/5 bg-zinc-900 px-5 py-4 pr-12 transition-colors hover:border-white/20"
    >
      <div className="flex shrink-0 items-center gap-1">
        {dragHandle}
        <span className="w-5 text-right text-[11px] font-black text-white/25">{position}</span>
      </div>

      {canReorder && (
        <div className="flex shrink-0 flex-col gap-1">
          <button type="button" onClick={onMoveUp} className="icon-mini" aria-label={`Subir ${project.name}`} title="Subir">↑</button>
          <button type="button" onClick={onMoveDown} className="icon-mini" aria-label={`Bajar ${project.name}`} title="Bajar">↓</button>
        </div>
      )}

      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
        <Cover project={project} />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-bold text-white">{project.name}</h3>
        <p className="mt-0.5 text-xs text-white/30">
          {project.year} · {project.slug}
          {project.featured && ' · ⭐ Destacado'}
        </p>
      </div>

      <div className="hidden shrink-0 gap-1 md:flex">
        {project.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-white/50">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {publishButton}
        <Link
          href={`/admin/proyectos/${project.id}`}
          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-zinc-700 hover:text-white"
        >
          Editar
        </Link>
      </div>

      <div className="absolute right-3 top-3">{deleteControl}</div>
    </div>
  )
}

function Cover({ project }: { project: Proyecto }) {
  if (!project.coverImage) return <div className="gradient-bg h-full w-full opacity-40" />

  if (isVideoUrl(project.coverImage)) {
    return (
      <video
        src={project.coverImage}
        className="pointer-events-none h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        controls={false}
        preload="metadata"
      />
    )
  }

  // draggable={false}: sin esto el navegador arranca su propio drag de imagen y pisa el de dnd-kit.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={project.coverImage} alt="" draggable={false} className="pointer-events-none h-full w-full object-cover" />
}

function SkeletonGrid({ view }: { view: ViewMode }) {
  const items = Array.from({ length: view === 'grid' ? 4 : 6 })

  if (view === 'grid') {
    return (
      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        {items.map((_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border border-white/5 bg-zinc-900">
            <div className="aspect-square animate-pulse bg-white/5" />
            <div className="space-y-2 p-3">
              <div className="h-3 w-3/4 animate-pulse rounded bg-white/5" />
              <div className="h-2 w-1/3 animate-pulse rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((_, index) => (
        <div key={index} className="flex items-center gap-4 rounded-xl border border-white/5 bg-zinc-900 px-5 py-4">
          <div className="h-12 w-12 shrink-0 animate-pulse rounded-lg bg-white/5" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded bg-white/5" />
            <div className="h-2 w-1/4 animate-pulse rounded bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  )
}
