import { onMounted, onUnmounted, ref } from 'vue'

/** 响应式视口宽高；首帧即有当前 inner 值（非 SSR 时），卸载时移除 resize 监听 */
export function useWindowSize() {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 0)
  const height = ref(typeof window !== 'undefined' ? window.innerHeight : 0)

  function update() {
    if (typeof window === 'undefined') return
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update, { passive: true })
    onUnmounted(() => window.removeEventListener('resize', update))
  })

  return { width, height }
}
