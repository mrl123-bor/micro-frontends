/** 将秒数格式化为 mm:ss 或 h:mm:ss（用于音频进度展示） */
export function formatPreviewTime(sec?: number): string {
  const total = Math.max(0, Math.floor(sec ?? 0))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  if (h > 0) return `${h}:${mm}:${ss}`
  return `${mm}:${ss}`
}
