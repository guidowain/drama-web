export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function whatsappLink(phone: string, message?: string) {
  const clean = phone.replace(/\D/g, '')
  const msg = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${clean}${msg}`
}
