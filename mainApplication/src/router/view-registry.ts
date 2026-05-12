import type { RouteComponent } from 'vue-router'

/**
 * 后端 getRouters 的 component 字段与 `src/views` 下相对路径（无 .vue）不一致时的映射。
 * 新菜单若约定为 `views/<component>.vue` 或 `views/<component>/index.vue`，无需再登记。
 */
const BACKEND_COMPONENT_ALIASES: Record<string, string> = {
  'system/user/index': 'system/UserManage',
  'system/role/index': 'system/RoleList',
  'system/menu/index': 'system/MenuManage',
  'system/dept/index': 'system/DeptManage',
  'system/post/index': 'system/PostManage',
  'system/dict/index': 'system/DictManage',
  /** 价签 UI 在 qiankun 子应用，主应用仅挂壳 */
  'printer/template/index': 'printer/PrintDesignShell',
  /** 菜单目录为「设计」时常用 component 路径 */
  'design/template/index': 'printer/PrintDesignShell',
  'printer/Temporary_Token/index': 'system/accounts/Index',
}

/** 后端 component 与别名表匹配（大小写不敏感，避免菜单成 design/Template 时挂不上微前端壳） */
function resolveBackendComponentAliasTarget(comp: string): string | undefined {
  const c = comp.trim().replace(/\\/g, '/')
  if (BACKEND_COMPONENT_ALIASES[c]) return BACKEND_COMPONENT_ALIASES[c]
  const lower = c.toLowerCase()
  for (const [k, v] of Object.entries(BACKEND_COMPONENT_ALIASES)) {
    if (k.toLowerCase() === lower) return v
  }
  return undefined
}

/** 别名 → views 下的 key；无别名则返回原路径（用于 glob 懒加载） */
function resolveBackendComponentKey(comp: string): string {
  return resolveBackendComponentAliasTarget(comp) ?? comp.trim().replace(/\\/g, '/')
}

/** 后端菜单 component 是否对应「仅壳 + qiankun 子应用」页（路径可为 /printer/... 或自定义如 /design/template） */
export function backendComponentUsesPrintDesignShell(comp?: string | null): boolean {
  if (!comp?.trim()) return false
  const c = comp.trim().replace(/\\/g, '/')
  if (c.includes('PrintDesignShell')) return true
  const key = resolveBackendComponentKey(c)
  return key.includes('PrintDesignShell')
}

const viewModules = import.meta.glob(
  ['../views/**/*.vue', '!../views/**/components/**/*.vue'],
) as Record<string, () => Promise<unknown>>

function globPathToViewKey(globPath: string): string {
  return globPath
    .replace(/^\.\.\/views\//, '')
    .replace(/\.vue$/i, '')
    .replace(/\\/g, '/')
}

/** 相对 `src/views`、不含扩展名的路径 → 懒加载 */
const VIEWS_BY_KEY: Record<string, () => Promise<unknown>> = {}
for (const [p, loader] of Object.entries(viewModules)) {
  VIEWS_BY_KEY[globPathToViewKey(p)] = loader
}

export function resolveBackendViewComponent(comp?: string): RouteComponent {
  if (!comp || comp === 'Layout' || comp === 'ParentView') {
    return () => import('@/layouts/RouteNest.vue')
  }
  const key = resolveBackendComponentKey(comp)
  const loader = VIEWS_BY_KEY[key]
  if (loader) return loader as RouteComponent
  return () => import('@/views/common/RoutePlaceholder.vue')
}
