import type { Component } from 'vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { MENU_SVG_STEMS } from '@/constants/menuSvgAssets'

export const MENU_ICON_SVG_PREFIX = 'svg:' as const
export const MENU_ICON_ICONFONT_PREFIX = 'iconfont:' as const

export type ResolvedMenuIcon =
  | { kind: 'element'; name: string }
  | { kind: 'svg'; name: string }
  | { kind: 'iconfont'; iconClass: string }

const svgStemSet = new Set(MENU_SVG_STEMS)

/** 后端/路由 meta.icon 存字符串：Element 组件名、或 `svg:文件名`、`iconfont:类名` */
export function resolveMenuIcon(raw?: string | null): ResolvedMenuIcon | null {
  if (!raw?.trim()) return null
  const v = raw.trim()
  if (v.startsWith(MENU_ICON_SVG_PREFIX)) {
    const name = v.slice(MENU_ICON_SVG_PREFIX.length).trim()
    return name ? { kind: 'svg', name } : null
  }
  if (v.startsWith(MENU_ICON_ICONFONT_PREFIX)) {
    const iconClass = v.slice(MENU_ICON_ICONFONT_PREFIX.length).trim()
    return iconClass ? { kind: 'iconfont', iconClass } : null
  }
  if ((ElementPlusIconsVue as Record<string, Component>)[v]) {
    return { kind: 'element', name: v }
  }
  if (svgStemSet.has(v)) {
    return { kind: 'svg', name: v }
  }
  return null
}

export function hasMenuIcon(raw?: string | null): boolean {
  return resolveMenuIcon(raw) != null
}
