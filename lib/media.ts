import type { ContentBlock, Proyecto } from './types'

const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov', 'm4v']

export function isVideoUrl(url?: string) {
  if (!url) return false

  const cleanUrl = url.split('?')[0]?.toLowerCase() || ''
  const extension = cleanUrl.split('.').pop() || ''

  return cleanUrl.includes('/video/upload/') || VIDEO_EXTENSIONS.includes(extension)
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
