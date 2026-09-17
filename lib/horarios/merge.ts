import {
  showCatalog,
  type HorariosFunction,
  type HorariosPublicData,
  type HorariosStore,
  type StoredFunction,
} from './types'

const ARGENTINA_OFFSET = '-03:00'

function timestamp(funcion: HorariosFunction) {
  return Date.parse(`${funcion.fecha}T${funcion.hora}:00${ARGENTINA_OFFSET}`)
}

function key(funcion: HorariosFunction) {
  return `${funcion.fecha}T${funcion.hora}`
}

export function isFuture(funcion: HorariosFunction, now = new Date()) {
  const value = timestamp(funcion)
  return Number.isFinite(value) && value > now.getTime()
}

export function mergeSuccessfulCheck(
  store: HorariosStore,
  input: { id: string; checkedAt: string; funciones: HorariosFunction[] },
  now = new Date()
) {
  const catalog = showCatalog.find((show) => show.id === input.id)
  if (!catalog) return store

  const previous = store.shows.find((show) => show.id === input.id)
  const previousFuture = (previous?.funciones ?? []).filter((funcion) => isFuture(funcion, now))
  const previousByKey = new Map(previousFuture.map((funcion) => [key(funcion), funcion]))
  const fresh = Array.from(
    new Map(
      input.funciones
        .filter((funcion) => isFuture(funcion, now))
        .map((funcion) => [key(funcion), funcion])
    ).values()
  ).sort((a, b) => timestamp(a) - timestamp(b))
  const freshKeys = new Set(fresh.map(key))

  const active: StoredFunction[] = fresh.map((funcion) => {
    const saved = previousByKey.get(key(funcion))
    return {
      ...funcion,
      status: 'active',
      firstSeenAt: saved?.firstSeenAt ?? input.checkedAt,
      lastSeenAt: input.checkedAt,
    }
  })

  const removed: StoredFunction[] = previousFuture
    .filter((funcion) => !freshKeys.has(key(funcion)))
    .map((funcion) => ({
      ...funcion,
      status: 'removed',
      removedAt: funcion.removedAt ?? input.checkedAt,
    }))

  const nextShow = {
    ...catalog,
    lastSuccessfulCheckAt: input.checkedAt,
    funciones: [...active, ...removed].sort((a, b) => timestamp(a) - timestamp(b)),
  }

  return {
    ...store,
    updatedAt: input.checkedAt,
    shows: showCatalog.map((show) =>
      show.id === input.id
        ? nextShow
        : store.shows.find((saved) => saved.id === show.id) ?? {
            ...show,
            lastSuccessfulCheckAt: null,
            funciones: [],
          }
    ),
  }
}

export function publicData(store: HorariosStore, now = new Date()): HorariosPublicData {
  return {
    shows: showCatalog.map((catalog) => {
      const show = store.shows.find((entry) => entry.id === catalog.id)
      return {
        id: catalog.id,
        name: catalog.name,
        lastSuccessfulCheckAt: show?.lastSuccessfulCheckAt ?? null,
        funciones: (show?.funciones ?? [])
          .filter((funcion) => funcion.status === 'active' && isFuture(funcion, now))
          .map(({ fecha, hora }) => ({ fecha, hora }))
          .sort((a, b) => timestamp(a) - timestamp(b)),
      }
    }),
  }
}

