import { NextRequest, NextResponse } from 'next/server'
import { getProjects, saveProjects } from '@/lib/api'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const projects = await getProjects()
  const project = projects.find((p) => p.id === params.id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(project)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json()
  const projects = await getProjects()
  const index = projects.findIndex((p) => p.id === params.id)
  if (index === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  projects[index] = {
    ...projects[index],
    name: body.name ?? projects[index].name,
    slug: body.slug ?? projects[index].slug,
    year: body.year != null ? Number(body.year) : projects[index].year,
    featured: body.featured != null ? Boolean(body.featured) : projects[index].featured,
    published: body.published != null ? Boolean(body.published) : projects[index].published,
    tags: Array.isArray(body.tags) ? body.tags : projects[index].tags,
    coverImage: body.coverImage ?? projects[index].coverImage,
    coverImageAlt: body.coverImageAlt ?? projects[index].coverImageAlt,
    contentBlocks: Array.isArray(body.contentBlocks)
      ? body.contentBlocks
      : projects[index].contentBlocks,
  }

  await saveProjects(projects)
  return NextResponse.json(projects[index])
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const projects = await getProjects()
  const filtered = projects.filter((p) => p.id !== params.id)
  if (filtered.length === projects.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  await saveProjects(filtered)
  return NextResponse.json({ ok: true })
}
