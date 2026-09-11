import { randomBytes } from 'crypto'
import { del, get, list, put } from '@vercel/blob'
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
 * A diferencia del resto del sitio (que guarda JSON commiteando contra la API de
 * GitHub, y por lo tanto dispara un deploy en cada escritura), las reuniones se
 * guardan en Vercel Blob: los invitados escriben en cualquier momento y nada de
 * eso toca el repo ni redeploya la web.
 *
 * Cada respuesta vive en su propio blob, así dos personas que responden al mismo
 * tiempo nunca se pisan entre sí.
 *
 * En local, si no hay BLOB_READ_WRITE_TOKEN, se usa el filesystem para poder
 * desarrollar sin provisionar nada.
 */

const PREFIX = 'meet'
const MAX_RESPONSES_PER_MEETING = 300

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
/* Driver: Vercel Blob                                                        */
/* -------------------------------------------------------------------------- */

const blobDriver: Driver = {
  async readJson(path) {
    // useCache:false evita leer una versión vieja del CDN justo después de escribir.
    const result = await get(path, { access: 'private', useCache: false })
    if (!result || result.statusCode !== 200) return null
    return await new Response(result.stream).json()
  },

  async writeJson(path, data) {
    await put(path, JSON.stringify(data), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
      contentType: 'application/json',
    })
  },

  async listPaths(prefix) {
    const paths: string[] = []
    let cursor: string | undefined

    do {
      const page = await list({ prefix, cursor, limit: 1000 })
      paths.push(...page.blobs.map((blob) => blob.pathname))
      cursor = page.hasMore ? page.cursor : undefined
    } while (cursor)

    return paths
  },

  async remove(paths) {
    if (paths.length) await del(paths)
  },
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
      await Promise.all(
        paths.map(async (relative) => rm(await absolute(relative), { force: true }))
      )
    },
  }
}

/* -------------------------------------------------------------------------- */

export function meetStorageMode(): 'blob' | 'filesystem' {
  return process.env.BLOB_READ_WRITE_TOKEN ? 'blob' : 'filesystem'
}

function driver(): Driver {
  if (process.env.BLOB_READ_WRITE_TOKEN) return blobDriver

  if (process.env.VERCEL) {
    // El filesystem de una función es efímero: guardar ahí perdería las respuestas
    // en silencio. Mejor romper fuerte y con una instrucción concreta.
    throw new Error(
      'Falta BLOB_READ_WRITE_TOKEN. Creá el store con `vercel blob create-store drama-meet` y volvé a deployar.'
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
