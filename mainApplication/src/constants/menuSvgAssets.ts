/** 与 `src/assets/icons/svg/*.svg` 同步，用于菜单图标选择与解析 */
const modules = import.meta.glob('../assets/icons/svg/*.svg', { eager: true })

export const MENU_SVG_STEMS: string[] = Object.keys(modules)
  .map((p) => /([^/]+)\.svg$/.exec(p)?.[1])
  .filter((x): x is string => !!x)
