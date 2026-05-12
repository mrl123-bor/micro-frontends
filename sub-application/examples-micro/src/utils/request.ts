import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import { toast } from '@micro/utils/toast'
import { useAuthStore } from '@micro/stores/auth'
import { redirectToLoginWhenSessionExpired } from '@micro/router/navigation-bridge'
import type { ApiResult } from '@micro/types/api'
import { resolveAxiosBaseURL } from '@micro/constants/envApp'
import { createDemoModeAxiosAdapter } from '@micro/utils/demoHttpAdapter'

const demoAxiosAdapter = createDemoModeAxiosAdapter()

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean
  }
}

const baseURL = resolveAxiosBaseURL()

const service: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
})

let refreshing = false
let queue: Array<(t: string) => void> = []
/** 与后端 `AuthController`：`POST /api/auth/refresh`（baseURL 已含 /api） */
const REFRESH_PATH = '/auth/refresh'

function isRefreshRequest(url?: string) {
  if (!url) return false
  return url.includes('auth/refresh')
}

/** 是否为登录请求（密码错误 401 不应触发 token 刷新或 session expired 提示） */
function isLoginRequest(url?: string) {
  if (!url) return false
  // /login 且非 /auth/refresh 等子路径
  return url.endsWith('/login') || url.includes('/login?') || url.includes('/login#')
}

service.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const auth = useAuthStore()
  if (auth.isDemoSession()) {
    config.adapter = demoAxiosAdapter
    return config
  }
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

service.interceptors.response.use(
  (res) => {
    /** blob 下载等场景不走 JSON 业务码校验 */
    if (
      res.config.responseType === 'blob' ||
      res.data instanceof Blob
    ) {
      return res
    }
    const body = res.data as ApiResult<unknown>
    if (body.code === 200) return res
    toast.error(body.msg || '请求失败')
    return Promise.reject(new Error(body.msg || 'error'))
  },
  async (err) => {
    const status = err.response?.status
    const original = err.config as InternalAxiosRequestConfig | undefined

    if (status === 401 && isRefreshRequest(original?.url)) {
      useAuthStore().clearSession()
      await redirectToLoginWhenSessionExpired()
      return Promise.reject(err)
    }

    /* ── 登录请求的 401（如密码错误）直接显示后端消息，不触发刷新/过期 ── */
    if (status === 401 && original && isLoginRequest(original.url)) {
      // 不进入 retry / session expired 流程，直接交到下方统一错误提示
      return Promise.reject(err)
    }

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !isRefreshRequest(original.url)
    ) {
      original._retry = true
      const auth = useAuthStore()
      if (auth.refreshToken) {
        if (refreshing) {
          return new Promise((resolve) => {
            queue.push((token: string) => {
              original.headers.Authorization = `Bearer ${token}`
              resolve(service(original))
            })
          })
        }
        refreshing = true
        try {
          const raw = await axios.post<ApiResult<{ access_token: string }>>(
            `${baseURL}${REFRESH_PATH}`,
            { refresh_token: auth.refreshToken },
          )
          const b = raw.data
          if (b.code === 200 && b.data?.access_token) {
            auth.setTokens(b.data.access_token, auth.refreshToken)
            queue.forEach((cb) => cb(b.data.access_token))
            queue = []
            original.headers.Authorization = `Bearer ${b.data.access_token}`
            return service(original)
          }
        } catch {
          /* fall through */
        } finally {
          refreshing = false
          queue = []
        }
      }
      useAuthStore().clearSession()
      await redirectToLoginWhenSessionExpired()
      return Promise.reject(err)
    }

    const backendMsg = err.response?.data?.msg
    const fallback =
      status === 400
        ? '请求参数错误'
        : status === 403
          ? '没有权限执行该操作'
          : status === 404
            ? '接口不存在'
            : status === 429
              ? '请求过于频繁，请稍后再试'
              : status != null && status >= 500
                ? '服务器开小差了，请稍后再试'
                : '请求失败，请检查网络或稍后重试'
    const msg = backendMsg || fallback

    // 统一由全局 toast 展示错误
    toast.error(msg)
    return Promise.reject(new Error(msg))
  },
)

export function get<T>(url: string, params?: object) {
  return service.get<ApiResult<T>>(url, { params }).then((r) => r.data.data)
}

export function post<T>(url: string, body?: object) {
  return service.post<ApiResult<T>>(url, body).then((r) => r.data.data)
}

export function put<T>(url: string, body?: object) {
  return service.put<ApiResult<T>>(url, body).then((r) => r.data.data)
}

export function del<T>(url: string) {
  return service.delete<ApiResult<T>>(url).then((r) => r.data.data)
}

export default service
