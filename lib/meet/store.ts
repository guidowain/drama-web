import { randomBytes } from 'crypto'
import {
  meetResponseSchema,
  meetingSchema,
  type Meeting,
  type MeetResponse,
  type MeetingSummary,
} from './types'

/**
 * Persistencia de Drama Meet.
 *
 * Los datos viven en un repo de GitHub aparte del sitio, por dos razones:
 *
 * 1. Privacidad. drama-web es público; acá se guardan nombres y mails de gente
 *    que responde una invitación. Van a un repo privado propio.
 * 2. Deploys. Si esto commiteara en drama-web, cada respuesta de un invitado
 *    redeployaría la web entera. En un repo aparte, nada de esto toca el sitio.
 *
 * Cada respuesta es un archivo propio, así una nunca sobrescribe a otra. Aun así
 * GitHub serializa los commits por rama: dos escrituras simultáneas, aunque sean
 * a archivos distintos, devuelven 409 porque la segunda quedó desactualizada
 * respecto del head. Por eso `commit` reintenta con backoff releyendo el sha.
 *
 * En local, sin repo configurado, se usa el filesystem para desarrollar sin
 * depender de nada.
 */

const PREFIX = 'meet'
const MAX_RESPONSES_PER_MEETING = 300
const GITHUB_API = 'https://api.github.com'
const MAX_COMMIT_RETRIES = 6

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const meetingPath = (meetingId: string) => `${PREFIX}/${meetingId}/meeting.json`
const responsesPrefix = (meetingId: string) => `${PREFIX}/${meetingId}/responses/`
const responsePath = (meetingId: string, responseId: string) =>
  `${responsesPrefix(meetingId)}${responseId}.json`

type Driver = {
  readJson: (path: string) => Promise<unknown | null>
  writeJson: (path: string, data: unknown) => Promise<void>
  listPaths: (prefix: string) => Promise<string[]>
  remove: (paths: string[]) => Promise<void>
}

/* -------------------------------------------------------------------------- */
/* Driver: repo privado de GitHub                                             */
/* -------------------------------------------------------------------------- */

function githubConfig() {
  const repo = process.env.MEET_GITHUB_REPO
  const token =
    process.env.MEET_GITHUB_TOKEN || process.env.GITHUB_CONTENT_TOKEN || process.env.GITHUB_TOKEN

  if (!repo || !token) return null

  return { repo, token, branch: process.env.MEET_GITHUB_BRANCH || 'main' }
}

function createGithubDriver(config: NonNullable<ReturnType<typeof githubConfig>>): Driver {
  const headers = {
    Authorization: `Bearer ${config.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  const contentsUrl = (path: string) =>
    `${GITHUB_API}/repos/${config.repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`

  /** sha actual del archivo, o null si todavía no existe. */
  async function shaOf(path: string) {
    const res = await fetch(`${contentsUrl(path)}?ref=${config.branch}`, { headers, cache: 'no-store' })
    if (!res.ok) return null
    const payload = await res.json()
    return typeof payload?.sha === 'string' ? (payload.sha as string) : null
  }

  /**
   * Escribe o borra un archivo reintentando cuando otro commit ganó la carrera.
   * El sha se relee en cada intento porque la rama pudo haber avanzado.
   */
  async function commit(
    path: string,
    method: 'PUT' | 'DELETE',
    body: (sha: string | null) => Record<string, unknown> | null
  ) {
    for (let attempt = 0; ; attempt += 1) {
      const payload = body(await shaOf(path))
      if (!payload) return

      const res = await fetch(contentsUrl(path), {
        method,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) return

      // 409/422 = la rama avanzó entre que leímos el sha y escribimos.
      const contended = res.status === 409 || res.status === 422
      if (!contended || attempt >= MAX_COMMIT_RETRIES) {
        throw new Error(`GitHub ${res.status} en ${path}: ${await res.text()}`)
      }

      await sleep(120 * 2 ** attempt + Math.random() * 250)
    }
  }

  return {
    async readJson(path) {
      const res = await fetch(`${contentsUrl(path)}?ref=${config.branch}`, { headers, cache: 'no-store' })

      if (res.status === 404) return null
      if (!res.ok) throw new Error(`GitHub ${res.status} leyendo ${path}`)

      const payload = await res.json()
      const decoded = Buffer.from(String(payload.content).replace(/\n/g, ''), 'base64').toString('utf-8')
      return JSON.parse(decoded)
    },

    async writeJson(path, data) {
      const content = Buffer.from(JSON.stringify(data, null, 2), 'utf-8').toString('base64')

      await commit(path, 'PUT', (sha) => ({
        message: `meet: ${sha ? 'actualizar' : 'crear'} ${path}`,
        content,
        branch: config.branch,
        ...(sha ? { sha } : {}),
      }))
    },

    async listPaths(prefix) {
      // El árbol completo en una sola llamada, en vez de recorrer carpeta por carpeta.
      const res = await fetch(
        `${GITHUB_API}/repos/${config.repo}/git/trees/${config.branch}?recursive=1`,
        { headers, cache: 'no-store' }
      )

      // 404/409 = repo recién creado y todavía vacío.
      if (res.status === 404 || res.status === 409) return []
      if (!res.ok) throw new Error(`GitHub ${res.status} listando ${prefix}`)

      const payload = await res.json()
      const tree: Array<{ path: string; type: string }> = Array.isArray(payload?.tree) ? payload.tree : []

      return tree.filter((entry) => entry.type === 'blob' && entry.path.startsWith(prefix)).map((entry) => entry.path)
    },

    async remove(paths) {
      // En serie: cada borrado es un commit y la rama los toma de a uno.
      for (const path of paths) {
        await commit(path, 'DELETE', (sha) =>
          sha ? { message: `meet: borrar ${path}`, branch: config.branch, sha } : null
        )
      }
    },
  }
}

/* -------------------------------------------------------------------------- */
/* Driver: filesystem (solo desarrollo local)                                 */
/* -------------------------------------------------------------------------- */

function createFsDriver(): Driver {
  const root = process.env.MEET_DATA_DIR || '.meet-data'
  const fs = () => import('fs/promises')
  const nodePath = () => import('path')

  const absolute = async (relative: string) => {
    const path = await nodePath()
    return path.join(process.cwd(), root, relative)
  }

  return {
    async readJson(relative) {
      try {
        const [{ readFile }, file] = await Promise.all([fs(), absolute(relative)])
        return JSON.parse(await readFile(file, 'utf-8'))
      } catch {
        return null
      }
    },

    async writeJson(relative, data) {
      const [{ mkdir, writeFile }, path, file] = await Promise.all([fs(), nodePath(), absolute(relative)])
      await mkdir(path.dirname(file), { recursive: true })
      await writeFile(file, JSON.stringify(data, null, 2), 'utf-8')
    },

    async listPaths(prefix) {
      const [{ readdir }, path, base] = await Promise.all([fs(), nodePath(), absolute('')])

      const walk = async (dir: string): Promise<string[]> => {
        let entries
        try {
          entries = await readdir(dir, { withFileTypes: true })
        } catch {
          return []
        }

        const nested = await Promise.all(
          entries.map(async (entry) => {
            const full = path.join(dir, entry.name)
            if (entry.isDirectory()) return walk(full)
            return [path.relative(base, full).split(path.sep).join('/')]
          })
        )

        return nested.flat()
      }

      return (await walk(base)).filter((file) => file.startsWith(prefix))
    },

    async remove(paths) {
      const { rm } = await fs()
      await Promise.all(paths.map(async (relative) => rm(await absolute(relative), { force: true })))
    },
  }
}

/* -------------------------------------------------------------------------- */

export function meetStorageMode(): 'github' | 'filesystem' {
  return githubConfig() ? 'github' : 'filesystem'
}

function driver(): Driver {
  const config = githubConfig()
  if (config) return createGithubDriver(config)

  if (process.env.VERCEL) {
    // El filesystem de una función es efímero: guardar ahí perdería las respuestas
    // en silencio. Mejor romper fuerte y con una instrucción concreta.
    throw new Error(
      'Falta MEET_GITHUB_REPO (repo privado donde se guardan las reuniones). Configurala en las env vars de Vercel.'
    )
  }

  return createFsDriver()
}

export function newResponseId() {
  return randomBytes(12).toString('base64url')
}

/* -------------------------------------------------------------------------- */
/* Reuniones                                                                  */
/* -------------------------------------------------------------------------- */

export async function getMeeting(meetingId: string): Promise<Meeting | null> {
  const raw = await driver().readJson(meetingPath(meetingId))
  if (!raw) return null

  const parsed = meetingSchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}

export async function saveMeeting(meeting: Meeting) {
  await driver().writeJson(meetingPath(meeting.id), meeting)
  return meeting
}

/** Devuelve un id libre: `avenida-pauta-q4`, y si ya existe, `avenida-pauta-q4-7f3a`. */
export async function claimMeetingId(base: string) {
  if (!(await getMeeting(base))) return base

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `${base}-${randomBytes(2).toString('hex')}`
    if (!(await getMeeting(candidate))) return candidate
  }

  return `${base}-${Date.now().toString(36)}`
}

export async function listMeetings(): Promise<MeetingSummary[]> {
  const store = driver()
  const paths = await store.listPaths(`${PREFIX}/`)

  const meetingIds = paths
    .filter((path) => path.endsWith('/meeting.json'))
    .map((path) => path.slice(PREFIX.length + 1, -'/meeting.json'.length))

  const responseCounts = new Map<string, number>()
  for (const path of paths) {
    const match = path.match(new RegExp(`^${PREFIX}/(.+)/responses/.+\\.json$`))
    if (match) responseCounts.set(match[1], (responseCounts.get(match[1]) ?? 0) + 1)
  }

  const meetings = await Promise.all(
    meetingIds.map(async (id) => {
      const meeting = await getMeeting(id)
      if (!meeting) return null
      return { ...meeting, responseCount: responseCounts.get(id) ?? 0 }
    })
  )

  return meetings
    .filter((meeting): meeting is MeetingSummary => meeting !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function deleteMeeting(meetingId: string) {
  const store = driver()
  const paths = await store.listPaths(`${PREFIX}/${meetingId}/`)
  await store.remove(paths)
}

/* -------------------------------------------------------------------------- */
/* Respuestas                                                                 */
/* -------------------------------------------------------------------------- */

export async function getResponse(meetingId: string, responseId: string): Promise<MeetResponse | null> {
  const raw = await driver().readJson(responsePath(meetingId, responseId))
  if (!raw) return null

  const parsed = meetResponseSchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}

export async function listResponses(meetingId: string): Promise<MeetResponse[]> {
  const store = driver()
  const paths = await store.listPaths(responsesPrefix(meetingId))

  const responses = await Promise.all(
    paths.map(async (path) => {
      const parsed = meetResponseSchema.safeParse(await store.readJson(path))
      return parsed.success ? parsed.data : null
    })
  )

  return responses
    .filter((response): response is MeetResponse => response !== null)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function countResponses(meetingId: string) {
  return (await driver().listPaths(responsesPrefix(meetingId))).length
}

export async function saveResponse(meetingId: string, response: MeetResponse) {
  await driver().writeJson(responsePath(meetingId, response.id), response)
  return response
}

export { MAX_RESPONSES_PER_MEETING }
