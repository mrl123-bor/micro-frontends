import '@/micro/exposeMicroSharedDeps'
import { installAdminRuntimeProbeForHost } from '@/constants/runtimeMode'

installAdminRuntimeProbeForHost()

import { createApp, nextTick } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import SvgIcon from '@/components/SvgIcon/index.vue'
import { i18n } from './i18n'
import router, { prepareRouterBeforeMount } from './router'
import {
  setupPrintDesignMicroApp,
  startPrintDesignMicroHost,
} from '@/micro/setupPrintDesignMicro'
import { setupContentExamplesMicroApps } from '@/micro/setupContentExamplesMicro'
import { bindRouterForHttpSession } from '@/router/navigation-bridge'
import { useAuthStore } from '@/stores/auth'
import { vPermission } from '@/directives/permission'
import { lPreview } from '@lgh_/media-preview-npm/core'
import '@lgh_/media-preview-npm/style.css'
import { initAntiCrawler } from '@/utils/antiCrawler'
import '@/composables/useTheme'
import './assets/main.scss'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
useAuthStore().bootstrapAuthForRuntime()

app.directive('permission', vPermission)
app.directive('l-preview', lPreview)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.component('SvgIcon', SvgIcon)

app.use(ElementPlus)
app.use(i18n)

bindRouterForHttpSession(router)

function removeAppSplash() {
  const splash = document.getElementById('app-splash')
  if (!splash) return
  const done = () => {
    splash.remove()
  }
  splash.addEventListener('transitionend', done, { once: true })
  splash.classList.add('app-splash--leave')
  window.setTimeout(done, 520)
}

;(async () => {
  await prepareRouterBeforeMount()
  app.use(router)
  setupPrintDesignMicroApp()
  setupContentExamplesMicroApps()

  if (import.meta.env.VITE_ANTI_CRAWLER === 'true') {
    initAntiCrawler({
      router,
      abnormalPath: '/abnormal',
      disableContextMenu: true,
      disableCopyCutPaste: true,
      blockOnAutomation: true,
      devtoolsGuard: import.meta.env.VITE_ANTI_CRAWLER_DEVTOOLS === 'true',
    } as any)
  }
  app.mount('#app')
  await router.isReady()
  startPrintDesignMicroHost()

  void nextTick(() => {
    requestAnimationFrame(() => removeAppSplash())
  })
})()
