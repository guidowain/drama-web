const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov', 'm4v']

export function isVideoUrl(url?: string) {
  if (!url) return false

  const cleanUrl = url.split('?')[0]?.toLowerCase() || ''
  const extension = cleanUrl.split('.').pop() || ''

  return cleanUrl.includes('/video/upload/') || VIDEO_EXTENSIONS.includes(extension)
}
