import type { AxiosRequestConfig } from 'axios'
import { ElLoading } from 'element-plus'
import { toast } from '@/utils/toast'
import service from './request'

/** 对象 → application/x-www-form-urlencoded（若依 / nest-admin 常用） */
export function stringifyFormParams(params: Record<string, unknown> | undefined): string {
  if (!params || typeof params !== 'object') return ''
  const parts: string[] = []
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue
    const encKey = encodeURIComponent(key)
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === null || item === undefined || item === '') continue
        parts.push(`${encKey}=${encodeURIComponent(String(item))}`)
      }
    } else if (typeof value === 'object') {
      for (const [k2, v2] of Object.entries(value as Record<string, unknown>)) {
        if (v2 === null || v2 === undefined || v2 === '') continue
        parts.push(
          `${encodeURIComponent(`${key}[${k2}]`)}=${encodeURIComponent(String(v2))}`,
        )
      }
    } else {
      parts.push(`${encKey}=${encodeURIComponent(String(value))}`)
    }
  }
  return parts.join('&')
}

function triggerSaveAs(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** 从 Content-Disposition 解析文件名 */
export function parseFilenameFromDisposition(
  disposition: string | undefined,
  fallback: string,
): string {
  if (!disposition) return fallback
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(disposition)
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1].trim().replace(/^["']|["']$/g, ''))
    } catch {
      return fallback
    }
  }
  const plain = /filename="?([^";\n]+)"?/i.exec(disposition)
  if (plain?.[1]) return plain[1].trim()
  return fallback
}

/**
 * 判断 Blob 是否为后端返回的 JSON 错误体（而非文件流）
 */
async function blobAsJsonError(blob: Blob): Promise<{ msg: string; code?: number } | null> {
  const type = (blob.type || '').toLowerCase()
  if (type.includes('application/json')) {
    try {
      const obj = JSON.parse(await blob.text()) as {
        code?: number
        msg?: string
        message?: string
      }
      const msg = obj.msg ?? obj.message ?? '下载失败'
      if (obj.code !== undefined && obj.code !== 200) {
        return { msg, code: obj.code }
      }
      /** code 为 200 的 JSON 仍按文件保存（如导出 .json） */
      return null
    } catch {
      return null
    }
  }
  // 小体积且内容为 JSON（部分环境用 octet-stream 返回错误 JSON）
  if (blob.size > 0 && blob.size < 4096) {
    const text = await blob.text()
    const t = text.trimStart()
    if (t.startsWith('{') && t.includes('"code"')) {
      try {
        const obj = JSON.parse(text) as { code?: number; msg?: string }
        if (obj.code !== undefined && obj.code !== 200) {
          return { msg: obj.msg || '下载失败', code: obj.code }
        }
      } catch {
        return null
      }
    }
  }
  return null
}

export type DownloadOptions = AxiosRequestConfig & {
  /** 默认 post；get 时 params 走 query */
  method?: 'post' | 'get'
  loadingText?: string
}

let downloadLoadingInstance: ReturnType<typeof ElLoading.service> | null = null

/**
 * 通用下载：POST + x-www-form-urlencoded + blob（与若依 / nest-admin 习惯一致）
 */
export async function download(
  url: string,
  params?: Record<string, unknown>,
  filename = 'download',
  config?: DownloadOptions,
): Promise<void> {
  const {
    method = 'post',
    loadingText = '正在下载数据，请稍候',
    ...axiosConfig
  } = config ?? {}

  downloadLoadingInstance?.close()
  downloadLoadingInstance = ElLoading.service({
    text: loadingText,
    background: 'rgba(0, 0, 0, 0.35)',
  })

  const merged: AxiosRequestConfig = {
    ...axiosConfig,
    url,
    method,
    responseType: 'blob',
    ...(method === 'get'
      ? { params: params ?? {} }
      : {
          data: params ?? {},
          transformRequest: [
            (data, headers) => {
              headers['Content-Type'] = 'application/x-www-form-urlencoded'
              return stringifyFormParams(
                data as Record<string, unknown> | undefined,
              )
            },
          ],
        }),
  }

  try {
    const res = await service.request<Blob>(merged)
    const blob = res.data
    if (!(blob instanceof Blob)) {
      toast.error('下载失败：响应格式异常')
      return
    }

    const err = await blobAsJsonError(blob)
    if (err) {
      toast.error(err.msg)
      return
    }

    const cd = res.headers['content-disposition'] as string | undefined
    const name = parseFilenameFromDisposition(cd, filename)
    triggerSaveAs(blob, name)
  } catch (e) {
    console.error(e)
    toast.error('下载文件出现错误，请稍后重试或联系管理员')
  } finally {
    downloadLoadingInstance?.close()
    downloadLoadingInstance = null
  }
}
