import { createSign } from 'crypto'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

const tokenCache = new Map<string, {
  accessToken: string
  expiresAt: number
}>()

const oauthTokenCache = new Map<string, {
  accessToken: string
  expiresAt: number
}>()

type GoogleAccessTokenOptions = {
  subject?: string
  serviceAccountKey?: string
  serviceAccountKeyEnv?: string
  cacheKey?: string
}

export async function getGoogleAccessToken(scope: string, subjectOrOptions?: string | GoogleAccessTokenOptions) {
  const options = typeof subjectOrOptions === 'string'
    ? { subject: subjectOrOptions }
    : subjectOrOptions ?? {}
  const subject = options.subject
  const usesSpecificServiceAccount = Boolean(options.serviceAccountKeyEnv || options.serviceAccountKey)
  const serviceAccountKey = options.serviceAccountKeyEnv
    ? process.env[options.serviceAccountKeyEnv]
    : options.serviceAccountKey
  const cacheKey = options.cacheKey || `${scope}:${subject ?? ''}:${options.serviceAccountKeyEnv ?? (serviceAccountKey ? 'custom' : 'default')}`
  const cachedToken = tokenCache.get(cacheKey)

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken
  }

  const serviceAccount = parseServiceAccountKey(usesSpecificServiceAccount ? serviceAccountKey : process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
  const clientEmail = serviceAccount?.clientEmail || (!usesSpecificServiceAccount ? process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL : '')
  const privateKey = normalizePrivateKey(serviceAccount?.privateKey || (!usesSpecificServiceAccount ? process.env.GOOGLE_PRIVATE_KEY : ''))

  if (!clientEmail || !privateKey) {
    const envHint = options.serviceAccountKeyEnv || 'GOOGLE_SERVICE_ACCOUNT_KEY'
    throw new Error(`Falta configurar ${envHint} o las credenciales separadas de Google.`)
  }

  const now = Math.floor(Date.now() / 1000)
  const assertion = signJwt(
    {
      alg: 'RS256',
      typ: 'JWT',
    },
    {
      iss: clientEmail,
      scope,
      aud: GOOGLE_TOKEN_URL,
      exp: now + 3600,
      iat: now,
      ...(subject ? { sub: subject } : {}),
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

  tokenCache.set(cacheKey, {
    accessToken: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in ?? 3600) * 1000,
  })

  return data.access_token
}

export async function getGoogleOAuthAccessToken({
  clientId,
  clientSecret,
  refreshToken,
  cacheKey,
}: {
  clientId: string
  clientSecret: string
  refreshToken: string
  cacheKey: string
}) {
  const cachedToken = oauthTokenCache.get(cacheKey)

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.access_token) {
    throw new Error(data?.error_description || 'No pudimos refrescar el acceso OAuth de Google.')
  }

  oauthTokenCache.set(cacheKey, {
    accessToken: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in ?? 3600) * 1000,
  })

  return data.access_token
}

export function getGoogleServiceAccountEmail() {
  const serviceAccount = parseServiceAccountKey(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
  return serviceAccount?.clientEmail || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL || ''
}

export function base64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function signJwt(header: Record<string, unknown>, payload: Record<string, unknown>, privateKey: string) {
  const encodedHeader = base64Url(JSON.stringify(header))
  const encodedPayload = base64Url(JSON.stringify(payload))
  const unsignedToken = `${encodedHeader}.${encodedPayload}`
  const signature = createSign('RSA-SHA256').update(unsignedToken).sign(privateKey)

  return `${unsignedToken}.${base64Url(signature)}`
}

function normalizePrivateKey(value?: string) {
  if (!value) return ''
  return value
    .replace(/\\\r?\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r/g, '')
    .replace(/\\\s*$/, '')
    .trim()
}

function parseServiceAccountKey(value?: string) {
  if (!value) return null

  try {
    const parsed = JSON.parse(value)
    const data = typeof parsed === 'string' ? JSON.parse(parsed) : parsed

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
