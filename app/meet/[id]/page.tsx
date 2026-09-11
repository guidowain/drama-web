import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getMeeting } from '@/lib/meet/store'
import MeetGuest from './MeetGuest'

export const dynamic = 'force-dynamic'

type Props = { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const meeting = await getMeeting(params.id).catch(() => null)

  return {
    title: meeting ? `${meeting.name} — Drama Meet` : 'Drama Meet',
    // Los links de reunión son privados: no queremos que los indexe nadie.
    robots: { index: false, follow: false },
  }
}

export default async function MeetPage({ params }: Props) {
  const meeting = await getMeeting(params.id)
  if (!meeting) notFound()

  return <MeetGuest meeting={meeting} />
}
