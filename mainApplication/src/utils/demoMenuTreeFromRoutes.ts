import type { RouteRecordRaw } from 'vue-router'
import type { SysMenu } from '@/types/api'
import { layoutChildren } from '@/router/routes'

let cachedTree: SysMenu[] | null = null
const byId = new Map<number, SysMenu>()

function permsToString(meta: RouteRecordRaw['meta']): string {
  if (!meta?.perms) return ''
  const p = meta.perms
  return Array.isArray(p) ? p.filter(Boolean).join(',') : String(p)
}

function walkRoutes(
  routes: RouteRecordRaw[],
  parentId: number,
  pathPrefix: string,
  nextId: { n: number },
): SysMenu[] {
  const out: SysMenu[] = []
  let order = 0
  for (const r of routes) {
    const meta = r.meta ?? {}
    if (meta.hidden) continue

    const seg = typeof r.path === 'string' ? r.path : ''
    const fullPath = pathPrefix ? `${pathPrefix}/${seg}`.replace(/\/+/g, '/') : seg
    const childrenRaw = r.children?.filter((c) => !(c.meta ?? {}).hidden) ?? []
    const hasChildren = childrenRaw.length > 0
    const menuId = nextId.n++
    const menuName = String(meta.title ?? r.name ?? seg)

    const node: SysMenu = {
      menuId,
      menuName,
      parentId,
      orderNum: order++,
      path: fullPath.startsWith('/') ? fullPath.slice(1) : fullPath,
      component: hasChildren ? 'RouteNest' : String(r.name ?? ''),
      menuType: hasChildren ? 'M' : 'C',
      visible: '0',
      status: '0',
      perms: permsToString(meta),
      icon: typeof meta.icon === 'string' ? meta.icon : '',
    }

    if (hasChildren) {
      node.children = walkRoutes(childrenRaw, menuId, fullPath, nextId)
    }

    byId.set(menuId, node)
    out.push(node)
  }
  return out
}

function rebuildCache() {
  byId.clear()
  cachedTree = null
  const nextId = { n: 1 }
  cachedTree = walkRoutes(layoutChildren as RouteRecordRaw[], 0, '', nextId)
}

/** 演示模式：与侧栏一致的静态路由树（非后端库表数据） */
export function getDemoMenuTree(): SysMenu[] {
  if (!cachedTree) rebuildCache()
  return cachedTree!
}

export function findDemoMenuById(menuId: number): SysMenu | null {
  if (!cachedTree) rebuildCache()
  const n = byId.get(menuId)
  if (!n) return null
  const { children, ...rest } = n
  return { ...rest, ...(children?.length ? { children: [...children] } : {}) }
}
