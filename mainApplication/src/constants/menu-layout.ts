export const MENU_LAYOUT_STORAGE_KEY = 'admin:menu-layout'

/** PC 端菜单壳布局；移动端始终为左侧抽屉，不受此值影响 */
export const MENU_LAYOUTS = ['side', 'top', 'mix', 'sideIcon'] as const
export type MenuLayout = (typeof MENU_LAYOUTS)[number]

export const DEFAULT_MENU_LAYOUT: MenuLayout = 'side'

export function isMenuLayout(v: unknown): v is MenuLayout {
  return typeof v === 'string' && (MENU_LAYOUTS as readonly string[]).includes(v)
}
