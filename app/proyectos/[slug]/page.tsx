import type { Metadata } from 'next'
import { getProjectBySlug, getPublishedProjects } from '@/lib/api'
import ProyectosPage from '../page'

const SITE_URL = 'https://drama.com.ar'

export async function generateStaticParams() {
  const projects = await getPublishedProjects()
  return projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const project = await getProjectBySlug(params.slug)

  if (!project) {
    return {
      title: 'Proyecto | Drama',
      description: 'Agencia de diseño y comunicación para entretenimiento en Buenos Aires.',
    }
  }

  const title = project.seoTitle || `${project.name} | Drama`
  const description = project.seoDescription || project.excerpt || ''
  const url = `${SITE_URL}/proyectos/${project.slug}`

  const images = project.coverImage
    ? [{ url: project.coverImage, alt: project.coverImageAlt || project.name }]
    : []

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: project.coverImage ? [project.coverImage] : [],
    },
  }
}

export default function ProyectoPage() {
  return <ProyectosPage />
}
