import { SignJWT, jwtVerify } from 'jose'

function getSecret() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET || 'drama-default-secret-change-in-prod'
  )
}

export async function createToken(username: string) {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload
  } catch {
    return null
  }
}

export function checkCredentials(username: string, password: string) {
  const validUser = process.env.ADMIN_USERNAME || 'admin'
  const validPass = process.env.ADMIN_PASSWORD || 'drama2024'
  return username === validUser && password === validPass
}
