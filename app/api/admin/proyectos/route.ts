import { NextRequest, NextResponse } from 'next/server'
import { getProjects, saveProjects } from '@/lib/api'
import { generateId } from '@/lib/utils'
import type { Proyecto } from '@/lib/types'
import { isAdminRequest, requireAdmin } from '@/lib/auth'

/** Pública: la usa /proyectos. El admin lee fresco; el resto, desde el cache. */
export async function GET() {
  const projects = await getProjects({ cached: !(await isAdminRequest()) })
  return NextResponse.json(projects)
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  const body = await request.json()
  const projects = await getProjects()

  const newProject: Proyecto = {
    id: generateId(),
    name: body.name,
    slug: body.slug,
    year: Number(body.year),
    featured: Boolean(body.featured),
    published: Boolean(body.published),
    tags: Array.isArray(body.tags) ? body.tags : [],
    coverImage: body.coverImage || '',
    coverImageAlt: body.coverImageAlt || '',
    contentBlocks: Array.isArray(body.contentBlocks) ? body.contentBlocks : [],
    seoTitle: body.seoTitle || '',
    seoDescription: body.seoDescription || '',
    excerpt: body.excerpt || '',
    translations: body.translations || {},
  }

  projects.push(newProject)
  await saveProjects(projects)
  return NextResponse.json(newProject, { status: 201 })
}
