/** 与 .env 中 VITE_APP_RUNTIME 对齐：demo = 纯前端壳+占位接口；integration = 真实 Nest 对接 */
export type AppRuntimeMode = 'integration' | 'demo'

export function getAppRuntimeMode(): AppRuntimeMode {
  const v = String(import.meta.env.VITE_APP_RUNTIME ?? '')
    .trim()
    .toLowerCase()
  return v === 'demo' ? 'demo' : 'integration'
}

export function isDemoRuntime(): boolean {
  return getAppRuntimeMode() === 'demo'
}

export function isIntegrationRuntime(): boolean {
  return getAppRuntimeMode() === 'integration'
}

/**
 * qiankun 子应用单独构建时 `import.meta.env.VITE_APP_RUNTIME` 可能与主应用不一致。
 * 主应用在入口尽早调用 `installAdminRuntimeProbeForHost()`，子应用通过本函数读取「是否演示模式」。
 */
declare global {
  interface Window {
    __ADMIN_APP_RUNTIME__?: AppRuntimeMode
  }
}

export function installAdminRuntimeProbeForHost(): void {
  if (typeof window === 'undefined') return
  try {
    window.__ADMIN_APP_RUNTIME__ = getAppRuntimeMode()
  } catch {
    /* ignore */
  }
}

export function isDemoModeEffective(): boolean {
  if (isDemoRuntime()) return true
  if (typeof window === 'undefined') return false
  try {
    return window.__ADMIN_APP_RUNTIME__ === 'demo'
  } catch {
    return false
  }
}
