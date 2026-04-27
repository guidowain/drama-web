import type { Metadata } from 'next'
import SumateForm from '@/components/SumateForm'

export const metadata: Metadata = {
  title: 'Sumate - Drama',
  description: 'Sumate a la red de talentos de Drama.',
}

export default function SumatePage() {
  return (
    <main className="min-h-screen bg-black pt-16 text-white md:pt-[72px]">
      <section className="gradient-bg px-5 py-12 text-black md:px-10 md:py-16">
        <div className="mx-auto grid w-full max-w-4xl gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-end">
          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-black/55">
              Queremos conocerte
            </p>
            <h1 className="max-w-3xl text-5xl font-black uppercase leading-none md:text-7xl">
              Sumate
            </h1>
          </div>
          <p className="max-w-2xl text-base font-semibold leading-snug text-black/70 md:justify-self-end md:text-xl">
            Si trabajás en diseño, comunicación, contenido, producción o estrategia para entretenimiento,
            completá el formulario y dejanos tus links.
          </p>
        </div>
      </section>

      <section className="px-5 py-10 md:px-10 md:py-16">
        <div className="mx-auto w-full max-w-4xl">
          <SumateForm />
        </div>
      </section>
    </main>
  )
}
