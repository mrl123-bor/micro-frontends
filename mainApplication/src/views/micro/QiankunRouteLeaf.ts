import { computed, defineComponent, h } from 'vue'
import { useRoute } from 'vue-router'
import './qiankunLeafStyles.scss'

const MICRO_HINTS = {
  content: {
    label: '演示内容',
    env: 'VITE_CONTENT_MICRO_ENTRY',
    dir: 'subapps/content-micro',
    sample: 'http://127.0.0.1:5175/',
  },
  examples: {
    label: '示例',
    env: 'VITE_EXAMPLES_MICRO_ENTRY',
    dir: 'subapps/examples-micro',
    sample: 'http://127.0.0.1:5176/',
  },
} as const

function resolveKind(
  matched: readonly { meta?: Record<string, unknown> }[],
): keyof typeof MICRO_HINTS {
  if (matched.some((m) => m.meta?.microContent === true)) return 'content'
  return 'examples'
}

/**
 * 主应用仅提供 qiankun 挂载占位：无演示业务 UI。
 * 实际页面只在 content-micro / examples-micro 的 .vue 中。
 */
export default defineComponent({
  name: 'QiankunRouteLeaf',
  setup() {
    const route = useRoute()
    const kind = computed(() => resolveKind(route.matched))
    const entry = computed(() => {
      if (kind.value === 'content') {
        return (
          (import.meta.env.VITE_CONTENT_MICRO_ENTRY as string | undefined)?.trim() ?? ''
        )
      }
      return (
        (import.meta.env.VITE_EXAMPLES_MICRO_ENTRY as string | undefined)?.trim() ?? ''
      )
    })
    const cfg = computed(() => MICRO_HINTS[kind.value])

    return () => {
      if (entry.value) {
        return h('div', {
          class: 'micro-qiankun-leaf micro-qiankun-leaf--host',
          'aria-hidden': 'true',
        })
      }
      const c = cfg.value
      return h('div', { class: 'micro-qiankun-leaf micro-qiankun-leaf--missing' }, [
        h('p', { class: 'micro-qiankun-leaf__title' }, `未配置「${c.label}」子应用`),
        h('p', { class: 'micro-qiankun-leaf__hint' }, [
          '请在环境变量中设置 ',
          h('code', c.env),
          ' 为子应用入口 URL（建议以 ',
          h('code', '/'),
          ' 结尾）。开发时先启动 ',
          h('code', c.dir),
          ' 的 ',
          h('code', 'npm run dev'),
          ' （默认 ',
          h('code', c.sample),
          '），再启动主应用。',
        ]),
      ])
    }
  },
})
