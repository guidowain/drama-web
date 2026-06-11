import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Proyectos | Drama',
  description:
    'Proyectos de diseño y comunicación para teatro, musicales y entretenimiento: identidad visual, gráfica, retoque y campañas para producciones en Buenos Aires.',
}

export default function ProyectosLayout({ children }: { children: React.ReactNode }) {
  return children
}
