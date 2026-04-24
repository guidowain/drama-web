import type { Proyecto, SiteSettings } from './types'
import { put, list, del } from '@vercel/blob'

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
      whatsapp: '+5491163357223',
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
    whatsapp: 'https://wa.me/5491163357223',
    mail: 'LOS@drama.com.ar',
    logoMain: '',
    logoMenu: '',
    favicon: '',
  },
}

function normalizeSiteSettings(raw: unknown): SiteSettings {
  const data = (raw && typeof raw === 'object') ? raw as Partial<SiteSettings> : {}

  return {
    home: {
      ...DEFAULT_SITE_SETTINGS.home,
      ...data.home,
      services: {
        design: {
          ...DEFAULT_SITE_SETTINGS.home.services.design,
          ...data.home?.services?.design,
          items: data.home?.services?.design?.items ?? DEFAULT_SITE_SETTINGS.home.services.design.items,
        },
        communication: {
          ...DEFAULT_SITE_SETTINGS.home.services.communication,
          ...data.home?.services?.communication,
          items: data.home?.services?.communication?.items ?? DEFAULT_SITE_SETTINGS.home.services.communication.items,
        },
      },
      logos: data.home?.logos ?? DEFAULT_SITE_SETTINGS.home.logos,
      contact: {
        ...DEFAULT_SITE_SETTINGS.home.contact,
        ...data.home?.contact,
      },
    },
    about: {
      ...DEFAULT_SITE_SETTINGS.about,
      ...data.about,
    },
    settings: {
      ...DEFAULT_SITE_SETTINGS.settings,
      ...data.settings,
    },
  }
}

function isManagedUploadUrl(value: string | undefined): value is string {
  if (!value) return false

  try {
    const url = new URL(value)
    return url.pathname.includes('/uploads/')
  } catch {
    return false
  }
}

function collectProjectAssetUrls(projects: Proyecto[]): Set<string> {
  const urls = new Set<string>()

  for (const project of projects) {
    if (isManagedUploadUrl(project.coverImage)) {
      urls.add(project.coverImage)
    }

    for (const block of project.contentBlocks) {
      if (isManagedUploadUrl(block.image)) {
        urls.add(block.image)
      }
    }
  }

  return urls
}

function collectSiteAssetUrls(settings: SiteSettings): Set<string> {
  const urls = new Set<string>()

  if (isManagedUploadUrl(settings.about.image)) {
    urls.add(settings.about.image)
  }

  if (isManagedUploadUrl(settings.settings.logoMain)) {
    urls.add(settings.settings.logoMain)
  }

  if (isManagedUploadUrl(settings.settings.logoMenu)) {
    urls.add(settings.settings.logoMenu)
  }

  if (isManagedUploadUrl(settings.settings.favicon)) {
    urls.add(settings.settings.favicon)
  }

  for (const logo of settings.home.logos) {
    if (isManagedUploadUrl(logo.src)) {
      urls.add(logo.src)
    }
  }

  return urls
}

async function deleteOrphanedAssets(previousUrls: Set<string>, nextUrls: Set<string>) {
  const removedUrls = Array.from(previousUrls).filter((url) => !nextUrls.has(url))

  if (!removedUrls.length) return

  try {
    await del(removedUrls)
  } catch (error) {
    console.error('Blob cleanup error:', error)
  }
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
  const previousProjects = await getProjects()
  const currentSiteSettings = await getSiteSettings()

  const blob = await put('data/projects.json', JSON.stringify(projects, null, 2), {
    access: 'public',
    contentType: 'application/json',
    allowOverwrite: true,
  })

  const previousUrls = new Set([
    ...Array.from(collectProjectAssetUrls(previousProjects)),
    ...Array.from(collectSiteAssetUrls(currentSiteSettings)),
  ])
  const nextUrls = new Set([
    ...Array.from(collectProjectAssetUrls(projects)),
    ...Array.from(collectSiteAssetUrls(currentSiteSettings)),
  ])

  await deleteOrphanedAssets(previousUrls, nextUrls)

  return blob.url
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const blobs = await list({ prefix: 'data/site.json' })

    if (!blobs.blobs.length) {
      return DEFAULT_SITE_SETTINGS
    }

    const res = await fetch(blobs.blobs[0].url)
    const data = await res.json()
    return normalizeSiteSettings(data)
  } catch {
    return DEFAULT_SITE_SETTINGS
  }
}

export async function saveSiteSettings(settings: SiteSettings) {
  const previousSettings = await getSiteSettings()
  const currentProjects = await getProjects()
  const normalizedSettings = normalizeSiteSettings(settings)

  const blob = await put('data/site.json', JSON.stringify(normalizedSettings, null, 2), {
    access: 'public',
    contentType: 'application/json',
    allowOverwrite: true,
  })

  const previousUrls = new Set([
    ...Array.from(collectProjectAssetUrls(currentProjects)),
    ...Array.from(collectSiteAssetUrls(previousSettings)),
  ])
  const nextUrls = new Set([
    ...Array.from(collectProjectAssetUrls(currentProjects)),
    ...Array.from(collectSiteAssetUrls(normalizedSettings)),
  ])

  await deleteOrphanedAssets(previousUrls, nextUrls)

  return blob.url
}
