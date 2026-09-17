import { mkdir, readFile, rename, writeFile } from 'fs/promises'
import { randomBytes } from 'crypto'
import path from 'path'
import { showCatalog, type HorariosStore, type StoredShow } from './types'

const GITHUB_API = 'https://api.github.com'
const STORE_PATH = 'horarios/schedule.json'

function emptyStore(): HorariosStore {
  return {
    version: 1,
    updatedAt: null,
    shows: showCatalog.map((show) => ({
      ...show,
      lastSuccessfulCheckAt: null,
      funciones: [],
    })),
  }
}

function normalize(raw: unknown): HorariosStore {
  if (!raw || typeof raw !== 'object') return emptyStore()
  const candidate = raw as Partial<HorariosStore>
  if (candidate.version !== 1 || !Array.isArray(candidate.shows)) return emptyStore()

  const byId = new Map(candidate.shows.map((show) => [show.id, show]))
  return {
    version: 1,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : null,
    shows: showCatalog.map((catalogShow) => {
      const saved = byId.get(catalogShow.id) as StoredShow | undefined
      return {
        ...catalogShow,
        lastSuccessfulCheckAt:
          saved && typeof saved.lastSuccessfulCheckAt === 'string' ? saved.lastSuccessfulCheckAt : null,
        funciones: saved && Array.isArray(saved.funciones) ? saved.funciones : [],
      }
    }),
  }
}

function githubConfig() {
  const repo = process.env.HORARIOS_GITHUB_REPO
  const token =
    process.env.HORARIOS_GITHUB_TOKEN || process.env.GITHUB_CONTENT_TOKEN || process.env.GITHUB_TOKEN
  if (!repo || !token) return null
  return { repo, token, branch: process.env.HORARIOS_GITHUB_BRANCH || 'main' }
}

function githubUrl(repo: string) {
  const encoded = STORE_PATH.split('/').map(encodeURIComponent).join('/')
  return `${GITHUB_API}/repos/${repo}/contents/${encoded}`
}

function githubHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

async function readGithub(config: NonNullable<ReturnType<typeof githubConfig>>) {
  const response = await fetch(`${githubUrl(config.repo)}?ref=${config.branch}`, {
    headers: githubHeaders(config.token),
    cache: 'no-store',
  })

  if (response.status === 404) return emptyStore()
  if (!response.ok) throw new Error(`GitHub ${response.status} leyendo horarios.`)

  const payload = await response.json()
  const content = Buffer.from(String(payload.content).replace(/\n/g, ''), 'base64').toString('utf-8')
  return normalize(JSON.parse(content))
}

async function writeGithub(
  config: NonNullable<ReturnType<typeof githubConfig>>,
  data: HorariosStore
) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const current = await fetch(`${githubUrl(config.repo)}?ref=${config.branch}`, {
      headers: githubHeaders(config.token),
      cache: 'no-store',
    })
    const sha = current.ok ? String((await current.json()).sha) : null

    const response = await fetch(githubUrl(config.repo), {
      method: 'PUT',
      headers: { ...githubHeaders(config.token), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'horarios: actualizar funciones',
        branch: config.branch,
        content: Buffer.from(JSON.stringify(data, null, 2), 'utf-8').toString('base64'),
        ...(sha ? { sha } : {}),
      }),
    })

    if (response.ok) return
    if (![409, 422].includes(response.status) || attempt === 4) {
      throw new Error(`GitHub ${response.status} guardando horarios.`)
    }
    await new Promise((resolve) => setTimeout(resolve, 150 * 2 ** attempt))
  }
}

function localPath() {
  return process.env.HORARIOS_DATA_FILE || path.join(process.cwd(), '.horarios-data', 'schedule.json')
}

export function horariosStorageMode(): 'github' | 'filesystem' {
  return githubConfig() ? 'github' : 'filesystem'
}

let localWriteQueue: Promise<unknown> = Promise.resolve()

export async function readHorariosStore() {
  const config = githubConfig()
  if (config) return readGithub(config)

  if (process.env.VERCEL) {
    throw new Error('Falta HORARIOS_GITHUB_REPO para guardar los horarios en producción.')
  }

  try {
    return normalize(JSON.parse(await readFile(localPath(), 'utf-8')))
  } catch {
    return emptyStore()
  }
}

export async function writeHorariosStore(data: HorariosStore) {
  const config = githubConfig()
  if (config) return writeGithub(config, data)

  if (process.env.VERCEL) {
    throw new Error('Falta HORARIOS_GITHUB_REPO para guardar los horarios en producción.')
  }

  const operation = localWriteQueue.then(async () => {
    const file = localPath()
    await mkdir(path.dirname(file), { recursive: true })
    const temporary = `${file}.${randomBytes(8).toString('hex')}.tmp`
    await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, { encoding: 'utf-8', mode: 0o600 })
    await rename(temporary, file)
  })
  localWriteQueue = operation.catch(() => {})
  return operation
}
