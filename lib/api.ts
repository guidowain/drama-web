import fs from 'fs'
import path from 'path'
import type { Proyecto, SiteSettings } from './types'

const DATA_DIR = path.join(process.cwd(), 'data')

function readLocalJSON<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'))
}

async function getBlob<T>(name: string): Promise<T | null> {
  const { list } = await import('@vercel/blob')
  const { blobs } = await list({ prefix: `data/${name}` })
  if (blobs.length === 0) return null
  const res = await fetch(blobs[0].url, { cache: 'no-store' })
  return res.json()
}

async function setBlob(name: string, data: unknown): Promise<void> {
  const { put } = await import('@vercel/blob')
  await put(`data/${name}`, JSON.stringify(data), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
  })
}

export async function getProjects(): Promise<Proyecto[]> {
  const projects = await getBlob<Proyecto[]>('projects.json')
  if (projects) return projects
  return readLocalJSON<Proyecto[]>('projects.json')
}

export async function getPublishedProjects(): Promise<Proyecto[]> {
  const projects = await getProjects()
  return projects.filter((p) => p.published)
}

export async function getProjectBySlug(slug: string): Promise<Proyecto | undefined> {
  const projects = await getProjects()
  return projects.find((p) => p.slug === slug && p.published)
}

export async function saveProjects(projects: Proyecto[]): Promise<void> {
  await setBlob('projects.json', projects)
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const settings = await getBlob<SiteSettings>('site.json')
  if (settings) return settings
  return readLocalJSON<SiteSettings>('site.json')
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  await setBlob('site.json', settings)
}
