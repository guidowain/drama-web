import { NextRequest, NextResponse } from 'next/server'
import { getProjects, saveProjects } from '@/lib/api'

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const ids: unknown[] = Array.isArray(body.ids) ? body.ids : []

  if (!ids.every((id) => typeof id === 'string')) {
    return NextResponse.json({ error: 'Invalid project order' }, { status: 400 })
  }

  const projectIds = ids as string[]
  const projects = await getProjects()
  const projectById = new Map(projects.map((project) => [project.id, project]))

  if (projectIds.length !== projects.length || projectIds.some((id) => !projectById.has(id))) {
    return NextResponse.json({ error: 'Project order does not match existing projects' }, { status: 400 })
  }

  const reordered = projectIds.map((id) => projectById.get(id)!)
  await saveProjects(reordered)

  return NextResponse.json(reordered)
}
