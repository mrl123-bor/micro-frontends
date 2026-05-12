/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 应用部署子路径，如 `/admin/`；根路径不填 */
  readonly VITE_PUBLIC_PATH?: string
  readonly VITE_APP_TITLE?: string
  readonly VITE_APP_ENV?: string
  readonly VITE_APP_BASE_API?: string
  readonly VITE_API_BASE: string
  readonly VITE_DEMO_SWITCHER?: string
  /** `demo` = 纯前端演示（占位接口）；缺省或其它值 = 对接真实后端 */
  readonly VITE_APP_RUNTIME?: string
  /** 为 true 时显示语言切换；生产可 false，开发/测试可 true */
  readonly VITE_I18N_SWITCHER?: string
  /** 为 true 时启用前端防爬虫/反自动化（测试环境建议 false） */
  readonly VITE_ANTI_CRAWLER?: string
  /** 为 true 时开启 DevTools 打开检测（可能误判，慎用） */
  readonly VITE_ANTI_CRAWLER_DEVTOOLS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
