import { kv } from '@vercel/kv'
import fs from 'fs'
import path from 'path'
import type { Proyecto, SiteSettings } from './types'

const DATA_DIR = path.join(process.cwd(), 'data')

function readLocalJSON<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'))
}

export async function getProjects(): Promise<Proyecto[]> {
  const projects = await kv.get<Proyecto[]>('projects')
  if (projects) return projects
  // First run: seed from local JSON
  const initial = readLocalJSON<Proyecto[]>('projects.json')
  await kv.set('projects', initial)
  return initial
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
  await kv.set('projects', projects)
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const settings = await kv.get<SiteSettings>('site')
  if (settings) return settings
  // First run: seed from local JSON
  const initial = readLocalJSON<SiteSettings>('site.json')
  await kv.set('site', initial)
  return initial
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  await kv.set('site', settings)
}
