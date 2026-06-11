import { SignJWT, jwtVerify } from 'jose'

function getSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('Falta configurar JWT_SECRET.')
  }
  return new TextEncoder().encode(process.env.JWT_SECRET)
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
  const validUser = process.env.ADMIN_USERNAME
  const validPass = process.env.ADMIN_PASSWORD
  if (!validUser || !validPass) return false
  return username === validUser && password === validPass
}
