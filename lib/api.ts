import fs from 'fs'
import path from 'path'
import type { Proyecto, SiteSettings } from './types'

const DATA_DIR = path.join(process.cwd(), 'data')
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json')
const SITE_FILE = path.join(DATA_DIR, 'site.json')

function readJSON<T>(filePath: string): T {
  const content = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(content)
}

function writeJSON(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export function getProjects(): Proyecto[] {
  return readJSON<Proyecto[]>(PROJECTS_FILE)
}

export function getPublishedProjects(): Proyecto[] {
  return getProjects().filter((p) => p.published)
}

export function getProjectBySlug(slug: string): Proyecto | undefined {
  return getProjects().find((p) => p.slug === slug && p.published)
}

export function saveProjects(projects: Proyecto[]) {
  writeJSON(PROJECTS_FILE, projects)
}

export function getSiteSettings(): SiteSettings {
  return readJSON<SiteSettings>(SITE_FILE)
}

export function saveSiteSettings(settings: SiteSettings) {
  writeJSON(SITE_FILE, settings)
}
