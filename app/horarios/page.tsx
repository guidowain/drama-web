import type { Metadata } from 'next'
import HorariosClient from './HorariosClient'

export const metadata: Metadata = {
  title: 'Horarios — Drama',
  robots: { index: false, follow: false },
}

export default function HorariosPage() {
  return <HorariosClient />
}

