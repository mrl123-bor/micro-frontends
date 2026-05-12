/** 页面品牌名：优先 .env 的 VITE_APP_TITLE */
export const APP_TITLE =
  (import.meta.env.VITE_APP_TITLE as string | undefined)?.trim() || '后台管理系统'

/** 当前业务环境标识 */
export const APP_ENV =
  (import.meta.env.VITE_APP_ENV as string | undefined)?.trim() ||
  import.meta.env.MODE

/**
 * 接口前缀：
 * - 优先 VITE_APP_BASE_API（新配置）
 * - 回退 VITE_API_BASE（兼容旧配置）
 * - 默认 /api
 * 值为 '/' 或空时返回空串，表示同源根路径。
 */
export function resolveAxiosBaseURL(): string {
  const raw = String(
    import.meta.env.VITE_APP_BASE_API ?? import.meta.env.VITE_API_BASE ?? '/api',
  ).trim()
  if (raw === '' || raw === '/') return ''
  return raw.replace(/\/+$/, '')
}
