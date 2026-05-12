import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'
import { DEMO_PRESETS } from '@/constants/permissionPresets'
import { PERM_WILDCARD } from '@/constants/perms'
import { ROLE_ADMIN } from '@/constants/roles'
import { canAccessMatched } from '@/utils/routeAccess'

const STORAGE_KEY = 'admin-permission'
const LEGACY_KEY = 'admin-demo-roles'

/** 与示例子应用 `bootstrap` 中监听名保持一致（qiankun 子应用另起 Pinia，需靠事件刷新） */
export const ADMIN_PERMISSION_SYNC_EVENT = 'admin-permission-sync'

export type PermissionSource = 'demo' | 'api' | 'guest'

function notifyPermissionSync() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(ADMIN_PERMISSION_SYNC_EVENT))
}

export const usePermissionStore = defineStore('permission', () => {
  const roles = ref<string[]>([])
  const perms = ref<string[]>([])
  const source = ref<PermissionSource>('guest')

  function persist() {
    try {
      if (source.value === 'api') {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            source: 'api',
            roles: roles.value,
            perms: perms.value,
          }),
        )
        notifyPermissionSync()
        return
      }
      if (source.value === 'demo') {
        const preset = DEMO_PRESETS.find(
          (p) =>
            JSON.stringify([...p.roles].sort()) ===
              JSON.stringify([...roles.value].sort()) &&
            JSON.stringify([...p.perms].sort()) ===
              JSON.stringify([...perms.value].sort()),
        )
        if (preset) {
          sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ source: 'demo', presetId: preset.id }),
          )
        } else {
          sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              source: 'demo',
              roles: roles.value,
              perms: perms.value,
            }),
          )
        }
        notifyPermissionSync()
      }
    } catch {
      /* ignore */
    }
  }

  function setFromApi(next: { roles: string[]; perms: string[] }) {
    roles.value = [...next.roles]
    perms.value = [...next.perms]
    source.value = 'api'
    persist()
  }

  function resetToGuest() {
    roles.value = []
    perms.value = []
    source.value = 'guest'
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    notifyPermissionSync()
  }

  function applyPreset(presetId: string) {
    const p = DEMO_PRESETS.find((x) => x.id === presetId)
    if (!p) return
    roles.value = [...p.roles]
    perms.value = [...p.perms]
    source.value = 'demo'
    persist()
  }

  function setDemoPreset(presetId: string) {
    applyPreset(presetId)
  }

  function setPermissions(next: { roles: string[]; perms: string[] }) {
    setFromApi(next)
  }

  function hasAdminBypass() {
    return roles.value.includes(ROLE_ADMIN)
  }

  function hasPerm(code: string) {
    if (!code) return true
    if (hasAdminBypass()) return true
    if (perms.value.includes(PERM_WILDCARD)) return true
    if (perms.value.includes('*:*:*')) return true
    return perms.value.includes(code)
  }

  function hasAnyPerm(codes: readonly string[]) {
    if (!codes.length) return true
    return codes.some((c) => hasPerm(c))
  }

  function hasAllPerms(codes: readonly string[]) {
    if (!codes.length) return true
    return codes.every((c) => hasPerm(c))
  }

  function hasRole(role: string) {
    if (!role) return true
    if (hasAdminBypass()) return true
    return roles.value.includes(role)
  }

  function canAccessRoute(to: RouteLocationNormalized) {
    return canAccessMatched(to.matched, roles.value, (c) => hasAnyPerm(c))
  }

  function loadFromStorage() {
    try {
      const legacy = sessionStorage.getItem(LEGACY_KEY)
      if (legacy != null) {
        const parsed = JSON.parse(legacy) as unknown
        if (Array.isArray(parsed)) {
          const strings = parsed.filter((x): x is string => typeof x === 'string')
          const hit = DEMO_PRESETS.find(
            (x) =>
              JSON.stringify([...x.roles].sort()) ===
              JSON.stringify([...strings].sort()),
          )
          if (hit) {
            roles.value = [...hit.roles]
            perms.value = [...hit.perms]
            source.value = 'demo'
            persist()
          } else {
            roles.value = strings
            perms.value = []
            source.value = 'demo'
            persist()
          }
        }
        sessionStorage.removeItem(LEGACY_KEY)
        return
      }

      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw == null) return
      const o = JSON.parse(raw) as {
        source?: string
        presetId?: string
        roles?: unknown
        perms?: unknown
      }

      if (o.source === 'api') {
        if (Array.isArray(o.roles)) {
          roles.value = o.roles.filter((x): x is string => typeof x === 'string')
        }
        if (Array.isArray(o.perms)) {
          perms.value = o.perms.filter((x): x is string => typeof x === 'string')
        }
        source.value = 'api'
        return
      }

      if (typeof o.presetId === 'string') {
        const p = DEMO_PRESETS.find((x) => x.id === o.presetId)
        if (p) {
          roles.value = [...p.roles]
          perms.value = [...p.perms]
          source.value = 'demo'
        }
        return
      }
      if (Array.isArray(o.roles)) {
        roles.value = o.roles.filter((x): x is string => typeof x === 'string')
      }
      if (Array.isArray(o.perms)) {
        perms.value = o.perms.filter((x): x is string => typeof x === 'string')
      }
      source.value = 'demo'
    } catch {
      /* ignore */
    }
  }

  loadFromStorage()

  return {
    roles,
    perms,
    source,
    setDemoPreset,
    setPermissions,
    setFromApi,
    resetToGuest,
    hasPerm,
    hasAnyPerm,
    hasAllPerms,
    hasRole,
    canAccessRoute,
    hasAdminBypass,
  }
})
