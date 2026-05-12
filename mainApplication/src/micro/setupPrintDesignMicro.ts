import { registerMicroApps, start } from 'qiankun'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import router from '@/router'

let registered = false
let started = false

const entry =
  (import.meta.env.VITE_PRINT_DESIGN_ENTRY as string | undefined)?.trim() ?? ''

function hasAnyQiankunMicroEntry(): boolean {
  const t = (k: string) =>
    (import.meta.env[k as keyof ImportMetaEnv] as string | undefined)?.trim() ?? ''
  return !!(entry || t('VITE_CONTENT_MICRO_ENTRY') || t('VITE_EXAMPLES_MICRO_ENTRY'))
}

/** 子路径部署时从 `location.pathname` 得到 Vue Router 内的 path */
function appPathFromLocationPathname(locationPathname: string): string {
  const rawBase = import.meta.env.BASE_URL ?? '/'
  const base = rawBase === '/' ? '' : rawBase.replace(/\/$/, '')
  if (base && locationPathname.startsWith(base)) {
    const rest = locationPathname.slice(base.length)
    if (!rest) return '/'
    return rest.startsWith('/') ? rest : `/${rest}`
  }
  return locationPathname
}

/**
 * qiankun `activeRule`：除 `/printer/*` 外，凡路由 meta.microPrintDesign 的菜单（如「设计 → 模板展示」常用 /design/template）也需挂载子应用。
 */
export function isPrintDesignMicroHostLocation(location: Pick<Location, 'pathname'>): boolean {
  const appPath = appPathFromLocationPathname(location.pathname)
  if (/^\/printer(\/|$)/.test(appPath)) return true
  try {
    const resolved = router.resolve(appPath)
    return resolved.matched.some((m) => m.meta?.microPrintDesign === true)
  } catch {
    return false
  }
}

/** AdminLayout：当前页是否显示 `#micro-print-design`（与 activeRule 逻辑对齐） */
export function isPrintDesignMicroHostRoute(
  route: Pick<RouteLocationNormalizedLoaded, 'path' | 'matched'>,
): boolean {
  if (/^\/printer(\/|$)/.test(route.path)) return true
  return route.matched.some((m) => m.meta?.microPrintDesign === true)
}

/**
 * 仅注册子应用（须在 `app.mount` 之前调用）。
 * 入口由 `VITE_PRINT_DESIGN_ENTRY` 配置，例如开发环境 `http://127.0.0.1:5174/`，
 * 生产环境为子应用部署后的完整 origin + 路径（需带尾部 `/` 或与子应用 base 一致）。
 */
export function setupPrintDesignMicroApp() {
  if (!entry || registered) return
  registered = true
  registerMicroApps([
    {
      name: 'print-design',
      entry,
      container: '#micro-print-design',
      activeRule: (location) => isPrintDesignMicroHostLocation(location),
    },
  ])
}

/**
 * 启动 qiankun（须在主应用 `app.mount('#app')` 之后调用），
 * 否则首屏直达设计器时 `#micro-print-design` 尚未存在，子应用会挂载失败（白板）。
 */
export function startPrintDesignMicroHost() {
  if (!hasAnyQiankunMicroEntry() || started) return
  started = true
  start({
    prefetch: false,
    // JS 沙箱会代理 `document`；vue3-sketch-ruler 内置的 Panzoom 用 `parentNode === document`
    // 判断是否挂载，在沙箱下恒为 false，导致「Panzoom should be called on attached elements」与设计器白屏。
    // 子应用为同源团队维护时可关闭沙箱；若必须开启沙箱，需 patch simple-panzoom 或换用不依赖该判断的标尺组件。
    sandbox: false,
  })
}
