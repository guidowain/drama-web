export interface ContentBlock {
  id: string
  type: 'image' | 'imageImage' | 'imageText' | 'text'
  title?: string
  text?: string
  image?: string
  imageAlt?: string
  imageScale?: number
  imageShowMuteButton?: boolean
  image2?: string
  image2Alt?: string
  image2Scale?: number
  image2ShowMuteButton?: boolean
  imageSide?: 'left' | 'right' | 'auto'
  order: number
}

export interface Proyecto {
  id: string
  name: string
  slug: string
  year: number
  featured: boolean
  published: boolean
  tags: string[]
  coverImage: string
  coverImageAlt: string
  seoTitle: string
  seoDescription: string
  excerpt: string
  contentBlocks: ContentBlock[]
}

export interface ServiceInfo {
  name: string
  description: string
  items: string[]
}

export interface Logo {
  src: string
  alt: string
  scale?: number
}

export interface ContactSettings {
  instagram: string
  whatsapp: string
  mail: string
}

export interface SiteSettings {
  home: {
    heroVideo: string
    heroLine1: string
    heroLine2: string
    services: {
      design: ServiceInfo
      communication: ServiceInfo
    }
    logos: Logo[]
  }
  about: {
    title: string
    image: string
    imageAlt: string
    quienesSomosTitle: string
    quienesSomos: string
    comoTrabajamosTitle: string
    comoTrabajamos: string
    queDiferenciaTitle: string
    queDiferencia: string
  }
  settings: ContactSettings
}
