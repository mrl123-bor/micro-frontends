<script setup lang="ts">
/**
 * 统一图标：Element Plus 图标 / 阿里 iconfont / 本地 SVG
 *
 * 用法示例：
 * - Element：`<SvgIcon type="element" name="Search" :size="18" />` 或 `type` 省略默认 element
 * - iconfont：先在项目中引入 iconfont 的 css，再 `<SvgIcon type="iconfont" icon-class="icon-xxx" />`
 * - SVG：将 .svg 放到 `src/assets/icons/svg/`，`<SvgIcon type="svg" name="文件名不含扩展名" />`
 */
import { computed, useAttrs } from 'vue'
import type { Component } from 'vue'
import { ElIcon } from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import type { SvgIconRenderType } from '@/types/svg-icon'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    type?: SvgIconRenderType
    /** type=element：与 @element-plus/icons-vue 导出同名，如 Search、Odometer */
    name?: string
    /**
     * type=iconfont：具体字形类名，如 icon-user（不含阿里工程里的通用前缀时，用 iconfontFamily）
     */
    iconClass?: string
    /** type=iconfont：工程里 iconfont.css 中的基础类名，一般为 iconfont */
    iconfontFamily?: string
    /** 像素数字或带单位的字符串，如 20、'1.2em' */
    size?: number | string
    color?: string
  }>(),
  {
    type: 'element',
    iconfontFamily: 'iconfont',
  },
)

const attrs = useAttrs()

const sizePx = computed(() => {
  const s = props.size
  if (s == undefined || s === '') return undefined
  return typeof s === 'number' ? `${s}px` : s
})

const elIconSize = computed(() =>
  typeof props.size === 'number' ? props.size : undefined,
)

const rootStyle = computed(() => {
  const st: Record<string, string> = {}
  if (sizePx.value) {
    st.fontSize = sizePx.value
    st.width = sizePx.value
    st.height = sizePx.value
  }
  if (props.color) st.color = props.color
  return st
})

const epComponent = computed((): Component | null => {
  if (props.type !== 'element' || !props.name) return null
  return (ElementPlusIconsVue as Record<string, Component>)[props.name] ?? null
})

const svgRawModules = import.meta.glob('../../assets/icons/svg/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function svgRawByName(fileStem: string): string | null {
  if (!fileStem || fileStem.includes('/') || fileStem.includes('..')) return null
  for (const [path, raw] of Object.entries(svgRawModules)) {
    if (path.endsWith(`/${fileStem}.svg`)) return raw
  }
  return null
}

/** 从根节点 width/height 解析数值（仅 px 或无单位），百分比等返回 null */
function parseSvgRootLength(attrs: string, dim: 'width' | 'height'): number | null {
  const re = dim === 'width' ? /\bwidth\s*=\s*["']([^"']+)["']/i : /\bheight\s*=\s*["']([^"']+)["']/i
  const m = re.exec(attrs)
  if (!m) return null
  const v = m[1].trim()
  if (/%|em|rem|ex|ch|vw|vh|vmin|vmax|cm|mm|in|pt|pc/i.test(v)) return null
  const n = parseFloat(v.replace(/px$/i, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * 在固定 CSS 尺寸盒子内完整显示：等比缩小（meet），不放大超出容器。
 * - 缺 viewBox 时，若能从 width/height 读出数值，则补 viewBox="0 0 w h"
 * - 有 viewBox 后去掉根上 width/height，避免与 CSS 100% 冲突
 * - 缺 preserveAspectRatio 时补 xMidYMid meet
 */
function normalizeSvgForInline(raw: string): string {
  const s = raw.trim()
  return s.replace(/<svg([^>]*)>/i, (_full, attrs: string) => {
    let a = String(attrs)
    let hasViewBox = /\bviewBox\s*=/i.test(a)
    if (!hasViewBox) {
      const w = parseSvgRootLength(a, 'width')
      const h = parseSvgRootLength(a, 'height')
      if (w != null && h != null) {
        a = `${a} viewBox="0 0 ${w} ${h}"`
        hasViewBox = true
      }
    }
    if (hasViewBox) {
      a = a
        .replace(/\s+width="[^"]*"/gi, '')
        .replace(/\s+height="[^"]*"/gi, '')
        .replace(/\s+width='[^']*'/gi, '')
        .replace(/\s+height='[^']*'/gi, '')
    }
    if (!/\bpreserveAspectRatio\s*=/i.test(a)) {
      a = `${a} preserveAspectRatio="xMidYMid meet"`
    }
    return `<svg${a}>`
  })
}

const svgHtml = computed(() => {
  if (props.type !== 'svg' || !props.name) return null
  const raw = svgRawByName(props.name)
  return raw ? normalizeSvgForInline(raw) : null
})

const iconfontClasses = computed(() => {
  if (props.type !== 'iconfont') return []
  const glyph = (props.iconClass || props.name || '').trim()
  if (!glyph) return []
  const fam = (props.iconfontFamily || 'iconfont').trim()
  return ['svg-icon-font', fam, glyph]
})
</script>

<template>
  <span class="svg-icon-root" :style="rootStyle" v-bind="attrs">
    <ElIcon
      v-if="type === 'element' && epComponent"
      :size="elIconSize"
      class="svg-icon-el"
    >
      <component :is="epComponent" />
    </ElIcon>

    <i
      v-else-if="type === 'iconfont' && iconfontClasses.length"
      :class="iconfontClasses"
      aria-hidden="true"
    />

    <span
      v-else-if="type === 'svg' && svgHtml"
      class="svg-icon-inline"
      v-html="svgHtml"
    />
  </span>
</template>

<style scoped lang="scss">
.svg-icon-root {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  line-height: 1;
}

.svg-icon-el {
  width: 1em;
  height: 1em;
}

.svg-icon-font {
  font-style: normal;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.svg-icon-inline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;
  flex-shrink: 0;
  overflow: hidden;
}

.svg-icon-inline :deep(svg) {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  display: block;
  flex-shrink: 0;
  overflow: hidden;
  object-fit: contain;
  fill: currentColor;
}
</style>
