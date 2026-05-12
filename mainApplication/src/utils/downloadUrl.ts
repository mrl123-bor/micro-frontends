/**
 * 通过 fetch 拉取为 Blob 再触发下载，避免部分浏览器对直链直接打开而非下载。
 */
export async function downloadFromUrl(url: string, filename?: string): Promise<void> {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename || ''
    a.rel = 'noopener'
    a.click()
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
  }
}
