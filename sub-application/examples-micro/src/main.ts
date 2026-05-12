import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
import { mountExamplesMicro, unmountExamplesMicro } from './bootstrap'

renderWithQiankun({
  bootstrap() {
    return Promise.resolve()
  },
  async mount(props) {
    const c = props.container as HTMLElement | undefined
    const el = (c?.querySelector('#app') ?? c ?? document.querySelector('#app')) as
      | Element
      | null
    if (!el) {
      console.error('[examples-micro] mount target not found')
      return
    }
    await mountExamplesMicro(el)
  },
  unmount() {
    unmountExamplesMicro()
    return Promise.resolve()
  },
  update() {
    return Promise.resolve()
  },
})

if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  const allowStandalone =
    import.meta.env.VITE_ALLOW_STANDALONE === 'true' ||
    (import.meta.env.DEV && import.meta.env.VITE_ALLOW_STANDALONE !== 'false')
  if (!allowStandalone) {
    window.location.replace(`${window.location.origin}/`)
  } else {
    const el = document.querySelector('#app')
    if (el) void mountExamplesMicro(el)
  }
}
