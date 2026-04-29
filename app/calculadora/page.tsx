import type { Metadata } from 'next'
import IpcCalculator from './IpcCalculator'

export const metadata: Metadata = {
  title: 'Calculadora IPC - Drama',
  description: 'Calculadora de ajuste de presupuesto por IPC.',
}

export default function CalculadoraPage() {
  return <IpcCalculator />
}
