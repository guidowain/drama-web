import { NextResponse } from 'next/server'
import { base64Url, getGoogleAccessToken } from '@/lib/google-auth'
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

const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
const GOOGLE_GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send'

export async function POST(request: Request) {
  try {
    const payload = await request.json() as SumatePayload
    const form = validatePayload(payload)

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || 'Respuestas'

    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Falta configurar GOOGLE_SHEETS_SPREADSHEET_ID.' }, { status: 500 })
    }

    const accessToken = await getGoogleAccessToken(GOOGLE_SHEETS_SCOPE)
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

    const confirmationEmailSent = await sendConfirmationEmail(form)

    return NextResponse.json({ ok: true, confirmationEmailSent })
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

async function sendConfirmationEmail(form: ReturnType<typeof validatePayload>) {
  const gmailUser = process.env.GOOGLE_GMAIL_USER
  const gmailFrom = process.env.GOOGLE_GMAIL_FROM || gmailUser

  if (!gmailUser || !gmailFrom) {
    return false
  }

  try {
    const accessToken = await getGoogleAccessToken(GOOGLE_GMAIL_SEND_SCOPE, gmailUser)
    const message = createConfirmationEmail({
      to: form.email,
      from: gmailFrom,
      fullName: form.fullName,
    })

    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(gmailUser)}/messages/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: base64Url(message),
      }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      console.error('Gmail confirmation email failed', data?.error?.message || response.statusText)
      return false
    }

    return true
  } catch (error) {
    console.error('Gmail confirmation email failed', error)
    return false
  }
}

function createConfirmationEmail({
  to,
  from,
  fullName,
}: {
  to: string
  from: string
  fullName: string
}) {
  const subject = 'NO RESPONDER - Recibimos tu solicitud para sumarte a Drama'
  const textBody = [
    `Hola ${firstName(fullName)},`,
    '',
    'Recibimos tu solicitud para sumarte a Drama.',
    '',
    'La vamos a revisar y, si aparece una oportunidad que matchee con tu perfil, te escribimos.',
    '',
    'Seguinos, no hay drama: https://instagram.com/drama.com.ar',
    '',
    'Gracias por compartirnos tu trabajo y tus ganas.',
    '',
    'DRAMA',
  ].join('\n')
  const htmlBody = [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<style>@font-face{font-family:Enriq;src:url(https://drama.com.ar/fonts/enriq/ENRIQBlack.woff2) format("woff2");font-weight:900;font-style:normal;}</style>',
    '</head>',
    '<body style="margin:0; padding:0; background:#f5f5f5;">',
    '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f5; padding:24px 12px;">',
    '<tr>',
    '<td align="center">',
    '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; background:#ffffff; border-radius:12px; overflow:hidden; font-family:Arial, Helvetica, sans-serif;">',
    '<tr>',
    '<td style="padding:0;">',
    '<table width="100%" cellpadding="0" cellspacing="0" border="0">',
    '<tr>',
    '<td align="center" valign="middle" style="padding:24px 16px; text-align:center; background:#f08eb5 url(\'https://res.cloudinary.com/dsqre3rmd/image/upload/Fondo_drama.png\') center top / cover no-repeat;">',
    '<img src="https://res.cloudinary.com/dsqre3rmd/image/upload/Logo_drama.png" alt="DRAMA" width="160" style="display:inline-block; width:160px; max-width:70%; height:auto;">',
    '</td>',
    '</tr>',
    '</table>',
    '</td>',
    '</tr>',
    '<tr>',
    '<td style="padding:30px 24px 28px 24px; color:#222; font-size:15px; line-height:1.6;">',
    `<p style="margin:0 0 16px 0;">Hola ${escapeHtml(firstName(fullName))},</p>`,
    '<p style="margin:0 0 18px 0;">Recibimos tu solicitud para sumarte a Drama.</p>',
    '<p style="margin:0 0 22px 0;">La vamos a revisar y, si aparece una oportunidad que matchee con tu perfil, te escribimos.</p>',
    '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0 0;">',
    '<tr>',
    '<td align="center">',
    '<a href="https://instagram.com/drama.com.ar" target="_blank" style="display:inline-block; padding:14px 22px; border-radius:10px; background:#f08eb5 url(\'https://res.cloudinary.com/dsqre3rmd/image/upload/Fondo_drama.png\') center center / cover no-repeat; color:#111111; font-family:Enriq, Arial, Helvetica, sans-serif; font-size:13px; line-height:1.2; font-weight:900; letter-spacing:0.14em; text-transform:uppercase; text-align:center; text-decoration:none; white-space:nowrap;">Seguinos, no hay drama</a>',
    '</td>',
    '</tr>',
    '</table>',
    '<p style="margin:24px 0 0 0;">Gracias por compartirnos tu trabajo y tus ganas.<br>DRAMA</p>',
    '</td>',
    '</tr>',
    '</table>',
    '</td>',
    '</tr>',
    '</table>',
    '</body>',
    '</html>',
  ].join('')
  const boundary = `drama-${Date.now()}`

  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeMimeHeader(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    textBody,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    htmlBody,
    '',
    `--${boundary}--`,
  ].join('\r\n')
}

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName
}

function encodeMimeHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value).toString('base64')}?=`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
