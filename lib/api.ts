import type { Proyecto, SiteSettings } from './types'
import { put, list } from '@vercel/blob'

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  home: {
    heroVideo: '/video/Logo Drama Match cut_export_16-9.mp4',
    heroLine1: 'LA HISTORIA DEBAJO',
    heroLine2: 'DEL ESCENARIO.',
    services: {
      design: {
        name: 'DISEÑO',
        description: '',
        items: [
          'Diseño gráfico',
          'Edición de video',
          'Animaciones',
          'Webs',
          'Fotografía',
          'Retoque fotográfico',
          'Branding',
          'AI',
          '3D',
        ],
      },
      communication: {
        name: 'COMUNICACIÓN',
        description: '',
        items: [
          'Redes sociales',
          'Estrategia',
          'Creatividad',
          'Pauta publicitaria',
          'SEO',
          'Email marketing',
        ],
      },
    },
    logos: [],
    contact: {
      mail: 'LOS@drama.com.ar',
      whatsapp: '+5491153207223',
      instagram: 'https://instagram.com/drama.com.ar',
    },
  },
  about: {
    image: '',
    imageAlt: 'El equipo de Drama',
    quienesSomos:
      'Somos Drama, una agencia de comunicación y diseño especializada en entretenimiento. Trabajamos con productoras, teatros y artistas para contar historias que conectan.',
    comoTrabajamos:
      'Nos involucramos en cada proyecto desde el inicio, entendiendo la esencia del espectáculo para traducirla en comunicación y diseño que resuena con el público.',
    queDiferencia:
      'Vivimos el teatro y el entretenimiento. Eso nos da una perspectiva única para crear piezas que hablan el mismo idioma que el público al que querés llegar.',
  },
  settings: {
    instagram: 'https://instagram.com/drama.com.ar',
    whatsapp: 'https://wa.me/5491153207223',
    mail: 'LOS@drama.com.ar',
    logoMain: '',
    logoMenu: '',
    favicon: '',
  },
}

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
    allowOverwrite: true,
  })

  return blob.url
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const blobs = await list({ prefix: 'data/site.json' })

    if (!blobs.blobs.length) {
      return DEFAULT_SITE_SETTINGS
    }

    const res = await fetch(blobs.blobs[0].url)
    return await res.json()
  } catch {
    return DEFAULT_SITE_SETTINGS
  }
}

export async function saveSiteSettings(settings: SiteSettings) {
  const blob = await put('data/site.json', JSON.stringify(settings, null, 2), {
    access: 'public',
    contentType: 'application/json',
    allowOverwrite: true,
  })

  return blob.url
}
