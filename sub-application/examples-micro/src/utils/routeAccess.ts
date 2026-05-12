import type { RouteLocationMatched, RouteRecordRaw } from 'vue-router'

/** 无 roles 或用户具备其中任一角色则通过 */
export function recordAccessibleByRoles(
  record: Pick<RouteRecordRaw, 'meta'>,
  userRoles: readonly string[],
): boolean {
  const req = record.meta?.roles
  if (!req?.length) return true
  const set = new Set(userRoles)
  return req.some((r) => set.has(r))
}

/** 配置了 meta.perms 时，具备任一权限即通过；否则走 roles 校验 */
export function recordAccessible(
  record: Pick<RouteRecordRaw, 'meta'>,
  userRoles: readonly string[],
  hasAnyPerm: (codes: readonly string[]) => boolean,
): boolean {
  const need = record.meta?.perms
  if (need?.length) return hasAnyPerm(need)
  return recordAccessibleByRoles(record, userRoles)
}

export function canAccessMatched(
  matched: RouteLocationMatched[],
  userRoles: readonly string[],
  hasAnyPerm: (codes: readonly string[]) => boolean,
): boolean {
  return matched.every((m) => recordAccessible(m, userRoles, hasAnyPerm))
}

/** 生成侧栏可见的路由树（已排除 hidden） */
export function filterMenuRoutes(
  routes: RouteRecordRaw[],
  userRoles: readonly string[],
  hasAnyPerm: (codes: readonly string[]) => boolean,
): RouteRecordRaw[] {
  const out: RouteRecordRaw[] = []
  for (const r of routes) {
    if (r.meta?.hidden) continue
    const rawChildren = r.children ?? []
    if (rawChildren.length > 0) {
      const nextChildren = filterMenuRoutes(
        rawChildren.filter((c) => !c.meta?.hidden),
        userRoles,
        hasAnyPerm,
      ).filter((c) => !!c.meta?.title)
      if (nextChildren.length === 0) continue
      out.push({ ...r, children: nextChildren })
    } else if (r.meta?.title && recordAccessible(r, userRoles, hasAnyPerm)) {
      out.push(r)
    }
  }
  return out
}
