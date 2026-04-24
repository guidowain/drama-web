import { NextRequest, NextResponse } from 'next/server'
import { getProjects, saveProjects } from '@/lib/api'
import { generateId } from '@/lib/utils'
import type { Proyecto } from '@/lib/types'

export async function GET() {
  const projects = await getProjects()
  return NextResponse.json(projects)
}

export async function POST(request: NextRequest) {
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
  }

  projects.push(newProject)
  saveProjects(projects)
  return NextResponse.json(newProject, { status: 201 })
}
