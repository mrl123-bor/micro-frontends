import { computed } from 'vue'
import { useWindowSize } from './useWindowSize'

/** 视口宽度 ≤ maxWidth 时视为移动端布局（基于 resize，与 useWindowSize 一致） */
export function useMobile(maxWidth = 768) {
  const { width } = useWindowSize()
  const isMobile = computed(() => width.value > 0 && width.value <= maxWidth)
  return { isMobile }
}
