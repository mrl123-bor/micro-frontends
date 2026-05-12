/**
 * 公共 Hooks 入口：业务请统一 `import { useX } from '@/hooks'`。
 * 再导出使用相对路径，避免个别 IDE 在 barrel 里解析 `@/` 误报找不到模块。
 * 首屏主题副作用仍由 `main.ts` 直接 `import '@/composables/useTheme'`，只拉取该文件。
 */
import {
  onMounted,
  onUnmounted,
  ref,
  unref,
  watch,
  type MaybeRef,
  type Ref,
} from 'vue'

// ---------------------------------------------------------------------------
// 再导出：与 src/composables 对齐
// ---------------------------------------------------------------------------
export { useMobile } from './composables/useMobile'
export { useWindowSize } from './composables/useWindowSize'
export { useRouteTitle } from './composables/useRouteTitle'
export { usePermission } from './composables/usePermission'
export {
  useTheme,
  isDark,
  themeAnimating,
} from './composables/useTheme'

// ---------------------------------------------------------------------------
// 布尔开关（弹层、抽屉等）
// ---------------------------------------------------------------------------
export function useToggle(initial = false) {
  const value = ref(initial)
  function toggle() {
    value.value = !value.value
  }
  function setTrue() {
    value.value = true
  }
  function setFalse() {
    value.value = false
  }
  function set(v: boolean) {
    value.value = v
  }
  return { value, toggle, setTrue, setFalse, set }
}

// ---------------------------------------------------------------------------
// 防抖（搜索输入、验证码换图等；卸载时清除定时器）
// ---------------------------------------------------------------------------
export function useDebounceFn<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null

  const debounced = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, ms)
  }

  onUnmounted(() => {
    if (timer) clearTimeout(timer)
  })

  return debounced
}

// ---------------------------------------------------------------------------
// 节流（滚动、resize 回调等，默认仅 leading）
// ---------------------------------------------------------------------------
export function useThrottleFn<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let last = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - last < ms) return
    last = now
    fn(...args)
  }
}

// ---------------------------------------------------------------------------
// 事件监听（卸载时 remove；target 可为 Ref，在 mounted 时解析）
// ---------------------------------------------------------------------------
export function useEventListener(
  target: MaybeRef<EventTarget | null | undefined>,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions,
) {
  onMounted(() => {
    const el = unref(target) ?? window
    el.addEventListener(type, listener, options)
    onUnmounted(() => {
      el.removeEventListener(type, listener, options)
    })
  })
}

// ---------------------------------------------------------------------------
// 异步 loading 包装（列表请求、表单提交）；可设初始 loading（如首屏即占满）
// ---------------------------------------------------------------------------
export function useAsyncState(initialLoading = false) {
  const loading = ref(initialLoading)

  async function run<T>(task: () => Promise<T>): Promise<T | undefined> {
    loading.value = true
    try {
      return await task()
    } finally {
      loading.value = false
    }
  }

  return { loading, run }
}

// ---------------------------------------------------------------------------
// 与 localStorage 同步的 ref（JSON 序列化；仅客户端）
// ---------------------------------------------------------------------------
export function useLocalStorageRef<T>(key: string, defaultValue: T) {
  const read = (): T => {
    if (typeof localStorage === 'undefined') return defaultValue
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return defaultValue
      return JSON.parse(raw) as T
    } catch {
      return defaultValue
    }
  }

  const data = ref(read()) as Ref<T>

  watch(
    data,
    (v) => {
      try {
        if (typeof localStorage === 'undefined') return
        localStorage.setItem(key, JSON.stringify(v))
      } catch {
        /* quota / 隐私模式 */
      }
    },
    { deep: true },
  )

  return data
}

// ---------------------------------------------------------------------------
// 页签可见性（暂停轮询、动画等）
// ---------------------------------------------------------------------------
export function useDocumentVisibility() {
  const visible = ref(
    typeof document !== 'undefined'
      ? document.visibilityState === 'visible'
      : true,
  )

  function sync() {
    visible.value = document.visibilityState === 'visible'
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', sync)
    sync()
    onUnmounted(() =>
      document.removeEventListener('visibilitychange', sync),
    )
  })

  return { visible }
}

// ---------------------------------------------------------------------------
// 是否已完成挂载（避免 SSR / 首帧操作 DOM）
// ---------------------------------------------------------------------------
export function useMounted() {
  const isMounted = ref(false)
  onMounted(() => {
    isMounted.value = true
  })
  return isMounted
}

// ---------------------------------------------------------------------------
// 单次延时任务（卸载时清除）
// ---------------------------------------------------------------------------
export function useTimeoutFn() {
  let timer: ReturnType<typeof setTimeout> | null = null

  function start(fn: () => void, ms: number) {
    stop()
    timer = setTimeout(() => {
      timer = null
      fn()
    }, ms)
  }

  function stop() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  onUnmounted(stop)
  return { start, stop }
}

// ---------------------------------------------------------------------------
// 周期任务（需手动 start；卸载时 stop）
// ---------------------------------------------------------------------------
export function useIntervalFn(
  fn: () => void,
  ms: number,
  options?: { immediate?: boolean },
) {
  let id: ReturnType<typeof setInterval> | null = null
  const immediate = options?.immediate ?? false

  function start() {
    stop()
    if (immediate) fn()
    id = setInterval(fn, ms)
  }

  function stop() {
    if (id) {
      clearInterval(id)
      id = null
    }
  }

  onUnmounted(stop)
  return { start, stop }
}
