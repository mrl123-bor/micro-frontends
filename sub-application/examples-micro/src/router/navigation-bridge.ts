import type { Router } from 'vue-router'
import { ElMessageBox } from 'element-plus'

/**
 * 子应用内 HTTP 401 时跳转主应用登录（与 admin 壳共用域名）。
 * 不依赖主应用具名路由，避免子应用 router 无 `Login` 记录。
 */
let boundRouter: Router | null = null

export function bindRouterForHttpSession(router: Router) {
  boundRouter = router
}

let reloginPromptLock = false

function canShowBlockingPrompt() {
  if (typeof document === 'undefined') return false
  const root = document.getElementById('app')
  return !!root && root.childElementCount > 0
}

export async function redirectToLoginWhenSessionExpired() {
  if (reloginPromptLock) return
  reloginPromptLock = true
  const fullPath = boundRouter?.currentRoute.value.fullPath ?? ''
  try {
    if (canShowBlockingPrompt()) {
      await ElMessageBox.alert(
        '登录状态已过期或失效，请重新登录',
        '登录提示',
        {
          confirmButtonText: '重新登录',
          type: 'warning',
          closeOnClickModal: false,
          closeOnPressEscape: false,
        },
      )
    }
  } catch {
    /* 关闭弹窗时仍跳转 */
  }
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    const q = new URLSearchParams()
    q.set('expired', '1')
    if (fullPath && fullPath !== '/login') q.set('redirect', fullPath)
    const target = `${base}/login?${q.toString()}`
    if (typeof window !== 'undefined' && window.top) {
      window.top.location.assign(target)
    }
  } finally {
    reloginPromptLock = false
  }
}
