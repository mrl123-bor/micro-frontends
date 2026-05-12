import { createApp, type App as AppType } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { i18n } from '@micro/i18n'
import { bindRouterForHttpSession } from '@micro/router/navigation-bridge'
import { useAuthStore } from '@micro/stores/auth'
import {
  ADMIN_PERMISSION_SYNC_EVENT,
  usePermissionStore,
} from '@micro/stores/permission'
import { vPermission } from '@micro/directives/permission'
import { lPreview } from '@lgh_/media-preview-npm/core'
import '@lgh_/media-preview-npm/style.css'
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
import router from '@micro/router/index'
import RootApp from '@micro/App.vue'

let root: AppType<Element> | null = null
let offPermissionSync: (() => void) | null = null

function attachHostPermissionSync() {
  if (typeof window === 'undefined' || offPermissionSync) return
  const handler = () => {
    usePermissionStore().loadFromStorage()
  }
  window.addEventListener(ADMIN_PERMISSION_SYNC_EVENT, handler)
  offPermissionSync = () => {
    window.removeEventListener(ADMIN_PERMISSION_SYNC_EVENT, handler)
    offPermissionSync = null
  }
}

export async function mountExamplesMicro(el: Element | string) {
  if (root) return root
  await import('@micro/assets/micro-page-tokens.scss')
  if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
    await import('element-plus/dist/index.css')
    await import('element-plus/theme-chalk/dark/css-vars.css')
    await import('@micro/assets/standalone-shell.scss')
  }
  const app = createApp(RootApp)
  const pinia = createPinia()
  setActivePinia(pinia)
  app.use(pinia)
  const auth = useAuthStore()
  auth.restoreFromStorage()
  auth.bootstrapAuthForRuntime()
  attachHostPermissionSync()

  app.directive('permission', vPermission)
  app.directive('l-preview', lPreview)

  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }
  app.use(ElementPlus)
  app.use(i18n)
  bindRouterForHttpSession(router)
  app.use(router)
  app.mount(el)
  root = app
  return app
}

export function unmountExamplesMicro() {
  offPermissionSync?.()
  if (!root) return
  root.unmount()
  root = null
}
