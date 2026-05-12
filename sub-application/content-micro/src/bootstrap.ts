import { createApp, type App as AppType } from 'vue'
import ElementPlus from 'element-plus'
import { i18n } from '@micro/i18n'
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
import router from '@micro/router'
import RootApp from '@micro/App.vue'

let root: AppType<Element> | null = null

export async function mountContentMicro(el: Element | string) {
  if (root) return root
  await import('@micro/assets/micro-page-tokens.scss')
  if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
    await import('element-plus/dist/index.css')
    await import('element-plus/theme-chalk/dark/css-vars.css')
    await import('@micro/assets/standalone-shell.scss')
  }
  const app = createApp(RootApp)
  app.use(ElementPlus)
  app.use(i18n)
  app.use(router)
  app.mount(el)
  root = app
  return app
}

export function unmountContentMicro() {
  if (!root) return
  root.unmount()
  root = null
}
