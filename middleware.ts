import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

function getSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('Falta configurar JWT_SECRET.')
  }
  return new TextEncoder().encode(process.env.JWT_SECRET)
}

function withPathnameHeader(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isApi = pathname.startsWith('/api/')

  if (pathname === '/admin/login') {
    return withPathnameHeader(request)
  }

  // Lecturas públicas: el sitio renderiza estos datos en /proyectos y el home.
  const publicReads = ['/api/admin/site', '/api/admin/proyectos']
  if (request.method === 'GET' && publicReads.includes(pathname)) {
    return withPathnameHeader(request)
  }

  const token = request.cookies.get('admin-token')?.value

  if (!token) {
    if (isApi) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  try {
    await jwtVerify(token, getSecret())
    return withPathnameHeader(request)
  } catch {
    if (isApi) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }
    const response = NextResponse.redirect(new URL('/admin/login', request.url))
    response.cookies.delete('admin-token')
    return response
  }
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/upload'],
}
