import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { RouteRecordRaw } from 'vue-router'
import { useRouter } from 'vue-router'
import { coreLayoutChildren, layoutChildren } from '@/router/routes'
import { usePermissionStore } from '@/stores/permission'
import { useDynamicRoutesStore } from '@/stores/dynamic-routes'
import { filterMenuRoutes } from '@/utils/routeAccess'

export function visibleMenuChildren(r: RouteRecordRaw): RouteRecordRaw[] {
  return (r.children ?? []).filter((c) => !c.meta?.hidden && !!c.meta?.title)
}

export function resolveMenuIndex(r: RouteRecordRaw, router: ReturnType<typeof useRouter>): string {
  if (r.name != null) return router.resolve({ name: r.name as string }).path
  return r.path.startsWith('/') ? r.path : `/${r.path}`
}

export function useAdminMenuRoutes() {
  const router = useRouter()
  const permissionStore = usePermissionStore()
  const { roles } = storeToRefs(permissionStore)
  const dynamicRoutesStore = useDynamicRoutesStore()
  const { loaded: dynamicLoaded, layoutAddons } = storeToRefs(dynamicRoutesStore)

  const menuRoutes = computed(() => {
    const base =
      permissionStore.source === 'api'
        ? [...coreLayoutChildren, ...(dynamicLoaded.value ? layoutAddons.value : [])]
        : layoutChildren
    const allowed = filterMenuRoutes(base, roles.value, (c) =>
      permissionStore.hasAnyPerm(c),
    )
    return allowed.filter((r) => {
      if (r.meta?.hidden) return false
      if (visibleMenuChildren(r).length > 0) return !!r.meta?.title
      return !!r.meta?.title
    })
  })

  function findActiveRootRoute(path: string): RouteRecordRaw | undefined {
    const roots = menuRoutes.value
    let best: RouteRecordRaw | undefined
    let bestLen = -1
    for (const r of roots) {
      const base = resolveMenuIndex(r, router)
      if (path === base || path.startsWith(`${base}/`)) {
        if (base.length > bestLen) {
          bestLen = base.length
          best = r
        }
      }
    }
    return best
  }

  return { menuRoutes, findActiveRootRoute, resolveMenuIndex }
}
