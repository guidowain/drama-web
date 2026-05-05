import type { ServiceCategory } from '@/lib/presupuestador/types'

export const servicesCatalog: ServiceCategory[] = [
  {
    id: 'identidad',
    name: 'Identidad y dirección de arte',
    services: [
      'Creación de identidad visual',
      'Gestión de identidad visual',
      'Rediseño de identidad visual',
      'Creación de manual de marca',
      'Participación en Creatividad y Estrategia',
    ].map((label, index) => ({ id: `identidad-${index}`, label })),
  },
  {
    id: 'grafica',
    name: 'Gráfica',
    services: [
      'Creación de piezas para redes sociales',
      'Creación de piezas para vía pública',
      'Creación de programa de mano',
      'Creación de piezas gráficas para pauta publicitaria',
      'Diseño de KV principal y adaptaciones',
      'Diseño de plantillas para redes sociales',
      'Retoque de fotografías',
      'Composición con AI para fotos de producto',
    ].map((label, index) => ({ id: `grafica-${index}`, label })),
  },
  {
    id: 'contenido',
    name: 'Contenido digital',
    services: [
      'Animaciones sencillas para redes sociales',
      'Animación de logo',
      'Diseño y animación de pantallas',
      'Coordinación de animaciones complejas',
      'Community manager always on',
      'Apoyo en edición de videos',
    ].map((label, index) => ({ id: `contenido-${index}`, label })),
  },
]
