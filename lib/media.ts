import type { ContentBlock, Proyecto } from './types'

const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov', 'm4v']
const CLOUDINARY_HOST = 'res.cloudinary.com'
const CLOUDINARY_UPLOAD_MARKER = '/upload/'

type CloudinaryOptimizationOptions = {
  width?: number
  quality?: 'auto' | 'auto:eco' | 'auto:good' | 'auto:best' | number
  crop?: 'limit' | 'fit' | 'fill' | 'scale'
  format?: 'auto'
}

const DEFAULT_IMAGE_SRCSET_WIDTHS = [360, 540, 720, 960, 1200]

export function isVideoUrl(url?: string) {
  if (!url) return false

  const cleanUrl = url.split('?')[0]?.toLowerCase() || ''
  const extension = cleanUrl.split('.').pop() || ''

  return cleanUrl.includes('/video/upload/') || VIDEO_EXTENSIONS.includes(extension)
}

export function isCloudinaryUrl(url?: string) {
  if (!url) return false

  try {
    const parsed = new URL(url)
    return parsed.hostname === CLOUDINARY_HOST
  } catch {
    return false
  }
}

export function optimizedCloudinaryUrl(src: string, options: CloudinaryOptimizationOptions = {}) {
  if (!isCloudinaryUrl(src) || !src.includes(CLOUDINARY_UPLOAD_MARKER)) return src

  const { width, quality = isVideoUrl(src) ? 'auto:eco' : 'auto', crop = 'limit', format = 'auto' } = options
  const transformations = [
    format === 'auto' && !isVideoUrl(src) ? 'f_auto' : null,
    quality ? `q_${quality}` : null,
    width ? `c_${crop},w_${Math.round(width)}` : null,
  ].filter(Boolean)

  if (!transformations.length) return src

  const markerIndex = src.indexOf(CLOUDINARY_UPLOAD_MARKER)
  const uploadEndIndex = markerIndex + CLOUDINARY_UPLOAD_MARKER.length
  const rest = src.slice(uploadEndIndex)
  const firstSegment = rest.split('/')[0] || ''

  if (firstSegment.includes(',') || firstSegment.startsWith('f_') || firstSegment.startsWith('q_') || firstSegment.startsWith('c_')) {
    return src
  }

  return `${src.slice(0, uploadEndIndex)}${transformations.join(',')}/${rest}`
}

export function cloudinaryImageSrcSet(
  src: string,
  options: Omit<CloudinaryOptimizationOptions, 'width'> & { widths?: number[] } = {},
) {
  if (!isCloudinaryUrl(src) || isVideoUrl(src)) return undefined

  const widths = (options.widths || DEFAULT_IMAGE_SRCSET_WIDTHS)
    .map((width) => Math.round(width))
    .filter((width, index, list) => width > 0 && list.indexOf(width) === index)
    .sort((first, second) => first - second)

  if (widths.length === 0) return undefined

  return widths
    .map((width) => `${optimizedCloudinaryUrl(src, { ...options, width })} ${width}w`)
    .join(', ')
}

function hasMediaValue(value?: string) {
  return Boolean(value?.trim())
}

function blockHasMedia(block: ContentBlock) {
  if (block.type === 'text') return false
  if (block.type === 'imageImage') return hasMediaValue(block.image) || hasMediaValue(block.image2)
  return hasMediaValue(block.image)
}

export function hasProjectDetailMedia(project?: Pick<Proyecto, 'contentBlocks'> | null) {
  return Boolean(project?.contentBlocks?.some(blockHasMedia))
}
