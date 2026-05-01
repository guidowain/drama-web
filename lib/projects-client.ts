'use client'

import type { Proyecto } from './types'
import { isVideoUrl } from './media'

let projectsCache: Proyecto[] | null = null
let projectsPromise: Promise<Proyecto[]> | null = null
const preloadedMedia = new Set<string>()

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

export function preloadFirstProjectCovers(projects: Proyecto[], count = 2) {
  projects
    .filter((project) => project.published)
    .slice(0, count)
    .forEach((project) => preloadMedia(project.coverImage))
}

function preloadMedia(src?: string) {
  if (!src || preloadedMedia.has(src)) return

  preloadedMedia.add(src)

  if (!isVideoUrl(src)) {
    const image = new Image()
    image.decoding = 'async'
    image.src = src
    return
  }

  const video = document.createElement('video')
  video.preload = 'metadata'
  video.muted = true
  video.playsInline = true
  video.src = src
}
