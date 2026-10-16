/**
 * Límite de pedidos por ventana fija, en memoria del proceso.
 *
 * En Vercel cada instancia tiene su propio contador y se vacía con cada cold start,
 * así que esto es una segunda barrera: la principal son las reglas de rate limit del
 * Vercel Firewall. Sirve igual para cortar ráfagas que caen en la misma instancia.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, { count: number; startedAt: number }>()

  return function isLimited(key: string) {
    const now = Date.now()

    // Limpieza perezosa para que el mapa no crezca sin techo.
    if (hits.size > 5_000) {
      hits.forEach((entry, entryKey) => {
        if (now - entry.startedAt > windowMs) hits.delete(entryKey)
      })
    }

    const entry = hits.get(key)
    if (!entry || now - entry.startedAt > windowMs) {
      hits.set(key, { count: 1, startedAt: now })
      return false
    }

    entry.count += 1
    return entry.count > limit
  }
}

export function clientIp(request: Request) {
  // En Vercel este header lo pisa la plataforma con la IP real del cliente.
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}
