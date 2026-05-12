/** 后端返回的相对路径（如 /api/uploads/...）用于 <img src> */
export function resolvePublicFileUrl(path: string | undefined | null): string {
  if (path == null || path === '') return ''
  const s = String(path).trim()
  if (s.startsWith('http') || s.startsWith('data:') || s.startsWith('//')) return s
  return s.startsWith('/') ? s : `/${s}`
}
