/**
 * 供嵌入的 qiankun 子应用「embedded」构建使用：与主应用共用 Element Plus 与图标包，减少重复下载。
 * 子应用执行 `npm run build:embedded`；勿在独立部署的子应用上使用 embedded 产物。
 *
 * 说明：将 `vue` 等一并 external 会与依赖 `vue-demi` 的包（如 Monaco 相关）冲突，故仅共享 EP。
 */
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

declare global {
  interface Window {
    __MICRO_SHARED_ELEMENT_PLUS__?: typeof ElementPlus
    __MICRO_SHARED_EP_ICONS__?: typeof ElementPlusIconsVue
  }
}

window.__MICRO_SHARED_ELEMENT_PLUS__ = ElementPlus
window.__MICRO_SHARED_EP_ICONS__ = ElementPlusIconsVue
