import type { ContactSettings, Proyecto, SiteSettings } from './types'

const GITHUB_OWNER = process.env.GITHUB_OWNER || 'guidowain'
const GITHUB_REPO = process.env.GITHUB_REPO || 'drama-web'
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_CONTENT_TOKEN

const PROJECTS_PATH = 'data/projects.json'
const SITE_PATH = 'data/site.json'

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
  },
  about: {
    title: 'SOMOS\nDRAMA',
    image: '',
    imageAlt: 'El equipo de Drama',
    quienesSomosTitle: 'QUIÉNES SOMOS',
    quienesSomos:
      'Somos Drama, una agencia de diseño y comunicación especializada en entretenimiento. Trabajamos con productoras, teatros y artistas para contar historias que conectan.',
    comoTrabajamosTitle: 'CÓMO TRABAJAMOS',
    comoTrabajamos:
      'Nos involucramos en cada proyecto desde el inicio, entendiendo la esencia del espectáculo para traducirla en diseño y comunicación que resuena con el público.',
    queDiferenciaTitle: 'QUÉ NOS DIFERENCIA',
    queDiferencia:
      'Vivimos el teatro y el entretenimiento. Eso nos da una perspectiva única para crear piezas que hablan el mismo idioma que el público al que querés llegar.',
  },
  settings: {
    instagram: 'https://instagram.com/drama.com.ar',
    whatsapp: 'https://wa.me/5491163357223',
    mail: 'LOS@drama.com.ar',
  },
}

function normalizeSiteSettings(raw: unknown): SiteSettings {
  const data = raw && typeof raw === 'object' ? (raw as Partial<SiteSettings>) : {}
  const legacyHome = data.home as (Partial<SiteSettings['home']> & { contact?: Partial<ContactSettings> }) | undefined
  const { contact: legacyContact, ...homeData } = legacyHome ?? {}
  const normalizedLogos = Array.isArray(data.home?.logos)
    ? data.home.logos.map((logo) => ({
        src: logo?.src ?? '',
        alt: logo?.alt ?? '',
        scale: typeof logo?.scale === 'number' ? logo.scale : 1,
      }))
    : DEFAULT_SITE_SETTINGS.home.logos

  return {
    home: {
      ...DEFAULT_SITE_SETTINGS.home,
      ...homeData,
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
      logos: normalizedLogos,
    },
    about: {
      ...DEFAULT_SITE_SETTINGS.about,
      ...data.about,
    },
    settings: {
      instagram: data.settings?.instagram ?? legacyContact?.instagram ?? DEFAULT_SITE_SETTINGS.settings.instagram,
      whatsapp: data.settings?.whatsapp ?? legacyContact?.whatsapp ?? DEFAULT_SITE_SETTINGS.settings.whatsapp,
      mail: data.settings?.mail ?? legacyContact?.mail ?? DEFAULT_SITE_SETTINGS.settings.mail,
    },
  }
}

function getGithubHeaders() {
  if (!GITHUB_TOKEN) {
    throw new Error('Missing GITHUB_TOKEN or GITHUB_CONTENT_TOKEN')
  }

  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

function getGithubFileUrl(path: string) {
  return `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`
}

async function readGithubJson<T>(path: string, fallback: T): Promise<{ data: T; sha?: string }> {
  try {
    const res = await fetch(`${getGithubFileUrl(path)}?ref=${GITHUB_BRANCH}`, {
      headers: getGithubHeaders(),
      cache: 'no-store',
    })

    if (res.status === 404) {
      return { data: fallback }
    }

    if (!res.ok) {
      console.error('GitHub read error:', await res.text())
      return { data: fallback }
    }

    const payload = await res.json()
    const decoded = Buffer.from(String(payload.content).replace(/\n/g, ''), 'base64').toString('utf-8')

    return {
      data: JSON.parse(decoded) as T,
      sha: payload.sha,
    }
  } catch (error) {
    console.error('GitHub read error:', error)
    return { data: fallback }
  }
}

async function writeGithubJson(path: string, data: unknown, message: string) {
  const existing = await readGithubJson(path, null)

  const body: {
    message: string
    content: string
    branch: string
    sha?: string
  } = {
    message,
    content: Buffer.from(JSON.stringify(data, null, 2), 'utf-8').toString('base64'),
    branch: GITHUB_BRANCH,
  }

  if (existing.sha) {
    body.sha = existing.sha
  }

  const res = await fetch(getGithubFileUrl(path), {
    method: 'PUT',
    headers: {
      ...getGithubHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error('GitHub write error:', errorText)
    throw new Error('GitHub write failed')
  }

  return await res.json()
}

export async function getProjects(): Promise<Proyecto[]> {
  const { data } = await readGithubJson<Proyecto[]>(PROJECTS_PATH, [])
  return Array.isArray(data) ? data : []
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
  return await writeGithubJson(PROJECTS_PATH, projects, 'Update projects data')
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const { data } = await readGithubJson<SiteSettings>(SITE_PATH, DEFAULT_SITE_SETTINGS)
  return normalizeSiteSettings(data)
}

export async function saveSiteSettings(settings: SiteSettings) {
  return await writeGithubJson(SITE_PATH, normalizeSiteSettings(settings), 'Update site settings')
}
