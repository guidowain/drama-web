import { NextResponse } from 'next/server'
import { createSign } from 'crypto'
import {
  CURRENT_STATUS_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  FOUND_US_OPTIONS,
  ROLE_OPTIONS,
  SKILL_OPTIONS,
  TOOL_OPTIONS,
  WORK_EXPERIENCE_OPTIONS,
} from '@/lib/sumate-options'

export const runtime = 'nodejs'

type SumatePayload = {
  fullName?: unknown
  age?: unknown
  location?: unknown
  role?: unknown
  experienceLevel?: unknown
  currentStatus?: unknown
  skills?: unknown
  tools?: unknown
  workExperience?: unknown
  coverLetter?: unknown
  portfolio?: unknown
  salaryExpectation?: unknown
  email?: unknown
  foundUs?: unknown
}

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'

let tokenCache: {
  accessToken: string
  expiresAt: number
} | null = null

export async function POST(request: Request) {
  try {
    const payload = await request.json() as SumatePayload
    const form = validatePayload(payload)

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || 'Respuestas'

    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Falta configurar GOOGLE_SHEETS_SPREADSHEET_ID.' }, { status: 500 })
    }

    const accessToken = await getGoogleAccessToken()
    const range = encodeURIComponent(`'${sheetName}'!A:O`)
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`

    const response = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [
          [
            new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
            form.fullName,
            form.age,
            form.location,
            form.role,
            form.experienceLevel,
            form.currentStatus.join(', '),
            form.skills.join(', '),
            form.tools.join(', '),
            form.workExperience.join(', '),
            form.coverLetter,
            form.portfolio,
            form.salaryExpectation,
            form.email,
            form.foundUs.join(', '),
          ],
        ],
      }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      const message = data?.error?.message || 'Google Sheets no aceptó el envío.'
      return NextResponse.json({ error: message }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No pudimos procesar el formulario.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

function validatePayload(payload: SumatePayload) {
  const fullName = requiredString(payload.fullName, 'Nombre completo')
  const age = requiredInteger(payload.age, 'Edad')
  const location = requiredString(payload.location, 'Ubicación')
  const role = requiredOption(payload.role, ROLE_OPTIONS, 'Rol')
  const experienceLevel = requiredOption(payload.experienceLevel, EXPERIENCE_LEVEL_OPTIONS, 'Nivel de experiencia')
  const currentStatus = requiredOptions(payload.currentStatus, CURRENT_STATUS_OPTIONS, 'Estado actual')
  const skills = requiredOptions(payload.skills, SKILL_OPTIONS, 'Habilidades', 10)
  const tools = requiredOptions(payload.tools, TOOL_OPTIONS, 'Herramientas', 10)
  const workExperience = requiredOptions(payload.workExperience, WORK_EXPERIENCE_OPTIONS, 'Experiencia laboral')
  const coverLetter = requiredString(payload.coverLetter, 'Carta de presentación')
  const portfolio = requiredString(payload.portfolio, 'Portfolio')
  const salaryExpectation = optionalString(payload.salaryExpectation)
  const email = requiredEmail(payload.email, 'Contacto')
  const foundUs = requiredOptions(payload.foundUs, FOUND_US_OPTIONS, 'Cómo nos encontraste')

  if (age < 16 || age > 99) {
    throw new Error('Edad debe estar entre 16 y 99.')
  }

  return {
    fullName,
    age,
    location,
    role,
    experienceLevel,
    currentStatus,
    skills,
    tools,
    workExperience,
    coverLetter,
    portfolio,
    salaryExpectation,
    email,
    foundUs,
  }
}

function requiredString(value: unknown, label: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} es obligatorio.`)
  }

  return value.trim()
}

function optionalString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function requiredInteger(value: unknown, label: string) {
  const numberValue = typeof value === 'number' ? value : Number(value)

  if (!Number.isInteger(numberValue)) {
    throw new Error(`${label} debe ser un número entero.`)
  }

  return numberValue
}

function requiredOption(value: unknown, options: string[], label: string) {
  const stringValue = requiredString(value, label)

  if (!options.includes(stringValue)) {
    throw new Error(`${label} no es válido.`)
  }

  return stringValue
}

function requiredOptions(value: unknown, options: string[], label: string, max?: number) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${label} es obligatorio.`)
  }

  if (max && value.length > max) {
    throw new Error(`${label} acepta hasta ${max} opciones.`)
  }

  const values = value.map((item) => requiredString(item, label))
  const invalid = values.find((item) => !options.includes(item))

  if (invalid) {
    throw new Error(`${label} contiene una opción no válida.`)
  }

  return values
}

function requiredEmail(value: unknown, label: string) {
  const email = requiredString(value, label)
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailPattern.test(email)) {
    throw new Error(`${label} debe ser un email válido.`)
  }

  return email
}

async function getGoogleAccessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.accessToken
  }

  const serviceAccount = parseServiceAccountKey(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
  const clientEmail = serviceAccount?.clientEmail || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL
  const privateKey = normalizePrivateKey(serviceAccount?.privateKey || process.env.GOOGLE_PRIVATE_KEY)

  if (!clientEmail || !privateKey) {
    throw new Error('Faltan GOOGLE_SERVICE_ACCOUNT_EMAIL y/o GOOGLE_PRIVATE_KEY.')
  }

  const now = Math.floor(Date.now() / 1000)
  const assertion = signJwt(
    {
      alg: 'RS256',
      typ: 'JWT',
    },
    {
      iss: clientEmail,
      scope: GOOGLE_SHEETS_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      exp: now + 3600,
      iat: now,
    },
    privateKey
  )

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.access_token) {
    throw new Error(data?.error_description || 'No pudimos autenticar con Google.')
  }

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in ?? 3600) * 1000,
  }

  return tokenCache.accessToken
}

function signJwt(header: Record<string, unknown>, payload: Record<string, unknown>, privateKey: string) {
  const encodedHeader = base64Url(JSON.stringify(header))
  const encodedPayload = base64Url(JSON.stringify(payload))
  const unsignedToken = `${encodedHeader}.${encodedPayload}`
  const signature = createSign('RSA-SHA256').update(unsignedToken).sign(privateKey)

  return `${unsignedToken}.${base64Url(signature)}`
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function normalizePrivateKey(value?: string) {
  if (!value) return ''
  return value.replace(/\\n/g, '\n')
}

function parseServiceAccountKey(value?: string) {
  if (!value) return null

  try {
    const data = JSON.parse(value)

    if (typeof data?.client_email !== 'string' || typeof data?.private_key !== 'string') {
      return null
    }

    return {
      clientEmail: data.client_email,
      privateKey: data.private_key,
    }
  } catch {
    return null
  }
}
