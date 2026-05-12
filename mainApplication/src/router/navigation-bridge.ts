import type { Router } from 'vue-router'
/** 非 Vue 组件上下文：会话过期仍用 ElMessageBox 阻塞提示后再跳转登录（不宜挂载 FunConfirmDialog） */
import { ElMessageBox } from 'element-plus'
import { ROUTE_NAMES } from '@/constants/route-names'

/**
 * HTTP 拦截器与路由解耦：由 main 在创建 router 后注入实例，
 * 避免 @/utils/request 直接 import router（减少循环依赖与层间耦合）。
 *
 * 注意：本模块不 import Pinia / authStore，否则易与 @/api → request 形成环；
 * 清会话应在调用本函数之前由拦截器完成。
 */
let boundRouter: Router | null = null

export function bindRouterForHttpSession(router: Router) {
  boundRouter = router
}

/** 并发 401 时只弹一次「登录过期」 */
let reloginPromptLock = false

function canShowBlockingPrompt() {
  if (typeof document === 'undefined') return false
  const root = document.getElementById('app')
  return !!root && root.childElementCount > 0
}

/** Token 失效后的提示与跳转登录（调用前须已 clearSession） */
export async function redirectToLoginWhenSessionExpired() {
  if (!boundRouter || reloginPromptLock) return
  reloginPromptLock = true
  const fullPath = boundRouter.currentRoute.value.fullPath
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
    /* 关闭弹窗时仍跳转登录页 */
  }
  try {
    await boundRouter.replace({
      name: ROUTE_NAMES.login,
      query: {
        ...(fullPath && fullPath !== '/login' ? { redirect: fullPath } : {}),
        expired: '1',
      },
    })
  } finally {
    reloginPromptLock = false
  }
}
