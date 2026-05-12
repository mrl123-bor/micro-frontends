import { registerMicroApps } from 'qiankun'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

let registered = false

const contentEntry =
  (import.meta.env.VITE_CONTENT_MICRO_ENTRY as string | undefined)?.trim() ?? ''
const examplesEntry =
  (import.meta.env.VITE_EXAMPLES_MICRO_ENTRY as string | undefined)?.trim() ?? ''

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

export function isContentMicroHostLocation(location: Pick<Location, 'pathname'>): boolean {
  const appPath = appPathFromLocationPathname(location.pathname)
  return /^\/content(\/|$)/.test(appPath)
}

export function isExamplesMicroHostLocation(location: Pick<Location, 'pathname'>): boolean {
  const appPath = appPathFromLocationPathname(location.pathname)
  return (
    /^\/demo(\/|$)/.test(appPath) || /^\/media-preview(\/|$)/.test(appPath)
  )
}

export function isContentMicroHostRoute(
  route: Pick<RouteLocationNormalizedLoaded, 'matched'>,
): boolean {
  return route.matched.some((m) => m.meta?.microContent === true)
}

export function isExamplesMicroHostRoute(
  route: Pick<RouteLocationNormalizedLoaded, 'matched'>,
): boolean {
  return route.matched.some((m) => m.meta?.microExamples === true)
}

/**
 * 与标签设计器并列注册；`start()` 仍由 `startPrintDesignMicroHost` 统一调用一次
 * （在配置了任一 qiankun 子应用入口时启动，不仅限于设计器）。
 */
export function setupContentExamplesMicroApps() {
  if (registered) return
  const apps: Parameters<typeof registerMicroApps>[0] = []
  if (contentEntry) {
    apps.push({
      name: 'content-micro',
      entry: contentEntry,
      container: '#micro-content',
      activeRule: (location) => isContentMicroHostLocation(location),
    })
  }
  if (examplesEntry) {
    apps.push({
      name: 'examples-micro',
      entry: examplesEntry,
      container: '#micro-examples',
      activeRule: (location) => isExamplesMicroHostLocation(location),
    })
  }
  if (!apps.length) return
  registered = true
  registerMicroApps(apps)
}

export function hasContentMicroEntry(): boolean {
  return !!contentEntry
}

export function hasExamplesMicroEntry(): boolean {
  return !!examplesEntry
}
