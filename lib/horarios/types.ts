import { z } from 'zod'
import shows from '@/data/horarios-shows.json'

export const functionSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
})

export const syncShowSchema = z.object({
  id: z.string().min(1),
  checkedAt: z.string().datetime(),
  funciones: z.array(functionSchema).max(200),
})

export const syncInputSchema = z.object({
  shows: z.array(syncShowSchema).min(1).max(shows.length),
})

export type HorariosFunction = z.infer<typeof functionSchema>

export type StoredFunction = HorariosFunction & {
  status: 'active' | 'removed'
  firstSeenAt: string
  lastSeenAt: string
  removedAt?: string
}

export type StoredShow = {
  id: string
  name: string
  source: string
  url: string
  lastSuccessfulCheckAt: string | null
  funciones: StoredFunction[]
}

export type HorariosStore = {
  version: 1
  updatedAt: string | null
  shows: StoredShow[]
}

export type PublicShow = Pick<StoredShow, 'id' | 'name' | 'lastSuccessfulCheckAt'> & {
  funciones: HorariosFunction[]
}

export type HorariosPublicData = {
  shows: PublicShow[]
}

export const showCatalog = shows

