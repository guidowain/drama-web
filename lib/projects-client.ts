'use client'

import type { Proyecto } from './types'

let projectsCache: Proyecto[] | null = null
let projectsPromise: Promise<Proyecto[]> | null = null

export function fetchProjects() {
  if (projectsCache) return Promise.resolve(projectsCache)
  if (projectsPromise) return projectsPromise

  projectsPromise = fetch('/api/admin/proyectos')
    .then((response) => {
      if (!response.ok) throw new Error('No se pudieron cargar los proyectos')
      return response.json() as Promise<Proyecto[]>
    })
    .then((projects) => {
      projectsCache = projects
      return projects
    })
    .catch((error) => {
      projectsPromise = null
      throw error
    })

  return projectsPromise
}
