import { storeToRefs } from 'pinia'
import { usePermissionStore } from '@/stores/permission'

/** 模板中 v-if / :disabled 等与权限组合使用 */
export function usePermission() {
  const store = usePermissionStore()
  const { roles, perms } = storeToRefs(store)

  return {
    roles,
    perms,
    hasRole: (role: string) => store.hasRole(role),
    hasPerm: (code: string) => store.hasPerm(code),
    hasAnyPerm: (codes: readonly string[]) => store.hasAnyPerm(codes),
    hasAllPerms: (codes: readonly string[]) => store.hasAllPerms(codes),
  }
}
