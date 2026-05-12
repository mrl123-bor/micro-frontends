import type { RouteRecordRaw } from 'vue-router'
import type { BackendRouterVo } from '@/api/routes'
import {
  backendComponentUsesPrintDesignShell,
  resolveBackendViewComponent,
} from '@/router/view-registry'

/** 与静态路由 path 对齐（若依多为单数 segment） */
const PATH_ALIASES: Record<string, string> = {
  user: 'users',
  role: 'roles',
  menu: 'menus',
  dept: 'depts',
  post: 'posts',
  dict: 'dict',
}

export function mapLeafPath(p: string): string {
  if (!p) return p
  if (p.includes('/')) return p.replace(/^\//, '')
  return PATH_ALIASES[p] ?? p
}

function normalizeIcon(icon?: string): string | undefined {
  if (!icon || icon === '#') return undefined
  const trimmed = icon.trim()
  /** 与前端 SvgIcon / 菜单管理约定一致，不做若依式转换 */
  if (
    trimmed.startsWith('svg:') ||
    trimmed.startsWith('iconfont:')
  ) {
    return trimmed
  }
  const m: Record<string, string> = {
    user: 'User',
    system: 'Setting',
    peoples: 'UserFilled',
    'tree-table': 'Menu',
    tree: 'Share',
    post: 'Briefcase',
    dict: 'Collection',
    edit: 'EditPen',
    message: 'Message',
    log: 'Document',
    monitor: 'Monitor',
    tool: 'Tools',
    online: 'Monitor',
    job: 'Timer',
    druid: 'DataLine',
    server: 'Cpu',
    redis: 'Coin',
    'redis-list': 'List',
    build: 'Cpu',
    code: 'DocumentCopy',
    swagger: 'Connection',
    form: 'Document',
    logininfor: 'Key',
    guide: 'Link',
  }
  if (m[trimmed]) return m[trimmed]
  const pascal = trimmed
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
  return pascal || undefined
}

function voToRecord(v: BackendRouterVo): RouteRecordRaw | null {
  let meta: RouteRecordRaw['meta'] = {
    title: v.meta.title,
    icon: normalizeIcon(v.meta.icon),
    hidden: v.hidden,
    noCache: v.meta.noCache,
    perms: v.meta.perms ? [v.meta.perms] : undefined,
  }

  if (v.meta.link && /^https?:\/\//i.test(v.meta.link)) {
    const p = v.path.startsWith('/') ? v.path.slice(1) : v.path
    return {
      path: p,
      name: v.name,
      component: () => import('@/views/common/ExternalFrame.vue'),
      meta: { ...meta, link: v.meta.link },
    }
  }

  if (v.children?.length) {
    const children = v.children
      .map(voToRecord)
      .filter(Boolean) as RouteRecordRaw[]
    if (!children.length) return null
    const redirect =
      v.redirect && v.redirect !== 'noRedirect'
        ? { path: mapLeafPath(v.redirect) }
        : undefined
    return {
      path: mapLeafPath(v.path),
      name: v.name,
      component: () => import('@/layouts/RouteNest.vue'),
      redirect,
      meta,
      children: children.map((c) => ({
        ...c,
        path:
          typeof c.path === 'string' ? mapLeafPath(c.path) : String(c.path),
      })),
    }
  }

  if (backendComponentUsesPrintDesignShell(v.component)) {
    meta = { ...meta, microPrintDesign: true }
  }

  return {
    path: mapLeafPath(v.path),
    name: v.name,
    component: resolveBackendViewComponent(v.component),
    meta,
  }
}

export function backendRoutersToRecords(
  vos: BackendRouterVo[],
): RouteRecordRaw[] {
  return vos.map((v) => voToRecord(v)).filter(Boolean) as RouteRecordRaw[]
}
