import type { Proyecto, SiteSettings } from './types'
import { put, list } from '@vercel/blob'

export async function getProjects(): Promise<Proyecto[]> {
  try {
    const blobs = await list({ prefix: 'data/projects.json' })

    if (!blobs.blobs.length) {
      return []
    }

    const res = await fetch(blobs.blobs[0].url)
    return await res.json()
  } catch {
    return []
  }
}

export async function getPublishedProjects(): Promise<Proyecto[]> {
  const projects = await getProjects()
  return projects.filter((p) => p.published)
}

export async function getProjectBySlug(slug: string): Promise<Proyecto | undefined> {
  const projects = await getProjects()
  return projects.find((p) => p.slug === slug && p.published)
}

export async function saveProjects(projects: Proyecto[]) {
  const blob = await put('data/projects.json', JSON.stringify(projects, null, 2), {
    access: 'public',
    contentType: 'application/json',
  })

  return blob.url
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const blobs = await list({ prefix: 'data/site.json' })

    if (!blobs.blobs.length) {
      return {} as SiteSettings
    }

    const res = await fetch(blobs.blobs[0].url)
    return await res.json()
  } catch {
    return {} as SiteSettings
  }
}

export async function saveSiteSettings(settings: SiteSettings) {
  const blob = await put('data/site.json', JSON.stringify(settings, null, 2), {
    access: 'public',
    contentType: 'application/json',
  })

  return blob.url
}
