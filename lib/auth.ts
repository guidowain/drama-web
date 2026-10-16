import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'

export const ADMIN_COOKIE = 'admin-token'

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

/** Solo el token de admin lleva `username`: un JWT de otra herramienta no alcanza. */
export function isAdminPayload(payload: JWTPayload) {
  return typeof payload.username === 'string' && payload.username.length > 0
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return isAdminPayload(payload) ? payload : null
  } catch {
    return null
  }
}

/**
 * Chequeo de sesión dentro de cada ruta de /api/admin. El middleware ya filtra,
 * pero las rutas no deben depender solo de él: si se saltea, quedaría todo abierto.
 * Devuelve la respuesta 401 a retornar, o null si la sesión es válida.
 */
export async function requireAdmin() {
  if (await isAdminRequest()) return null
  return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
}

export async function isAdminRequest() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value
  return Boolean(token && (await verifyToken(token)))
}

/** Lo mismo para las páginas de /admin que leen datos en el servidor. */
export async function requireAdminPage() {
  if (!(await isAdminRequest())) redirect('/admin/login')
}

export function checkCredentials(username: string, password: string) {
  const validUser = process.env.ADMIN_USERNAME
  const validPass = process.env.ADMIN_PASSWORD
  if (!validUser || !validPass) return false
  return username === validUser && password === validPass
}
