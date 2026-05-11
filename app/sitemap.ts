import type { MetadataRoute } from 'next'
import { getPublishedProjects } from '@/lib/api'

const SITE_URL = 'https://drama.com.ar'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getPublishedProjects()

  const projectUrls: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${SITE_URL}/proyectos/${project.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/proyectos`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/nosotros`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...projectUrls,
  ]
}
