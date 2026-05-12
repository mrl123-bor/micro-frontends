import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '@/api/auth'
import { usePermissionStore } from '@/stores/permission'
import { isDemoRuntime, isDemoModeEffective } from '@/constants/runtimeMode'

const TOKEN_KEY = 'admin_access_token'
const REFRESH_KEY = 'admin_refresh_token'
const DEMO_PROFILE_KEY = 'admin-demo-profile'

/** 与真实 JWT 区分；仅 VITE_APP_RUNTIME=demo 时写入 */
export const DEMO_ACCESS_TOKEN = '__DEMO_ACCESS__'
const DEMO_REFRESH_TOKEN = '__DEMO_REFRESH__'

export const useAuthStore = defineStore('auth', () => {
  const token = ref('')
  const refreshToken = ref('')
  const nickName = ref('')
  const userName = ref('')
  /** 头像相对路径，与 getInfo / 上传接口返回一致；顶栏与个人中心共用 */
  const avatar = ref('')

  const isLoggedIn = computed(() => !!token.value)

  function isDemoSession() {
    return isDemoModeEffective() && token.value === DEMO_ACCESS_TOKEN
  }

  function setTokens(access: string, refresh: string) {
    token.value = access
    refreshToken.value = refresh
    try {
      localStorage.setItem(TOKEN_KEY, access)
      localStorage.setItem(REFRESH_KEY, refresh)
    } catch {
      /* ignore */
    }
  }

  function restoreFromStorage() {
    try {
      const a = localStorage.getItem(TOKEN_KEY)
      const r = localStorage.getItem(REFRESH_KEY)
      if (a) token.value = a
      if (r) refreshToken.value = r
    } catch {
      /* ignore */
    }
  }

  function bootstrapAuthForRuntime() {
    if (!isDemoRuntime()) {
      restoreFromStorage()
      return
    }
    try {
      const a = localStorage.getItem(TOKEN_KEY)
      if (a && a !== DEMO_ACCESS_TOKEN) {
        clearSession()
      }
    } catch {
      /* ignore */
    }
    restoreFromStorage()
    if (token.value !== DEMO_ACCESS_TOKEN) return
    try {
      const raw = sessionStorage.getItem(DEMO_PROFILE_KEY)
      if (raw) {
        const o = JSON.parse(raw) as { nickName?: string; userName?: string }
        nickName.value = String(o.nickName || '').trim() || '纯前端演示'
        userName.value = String(o.userName || '').trim() || 'demo'
      } else {
        nickName.value = '纯前端演示'
        userName.value = 'demo'
      }
    } catch {
      nickName.value = '纯前端演示'
      userName.value = 'demo'
    }
    const perm = usePermissionStore()
    if (perm.source !== 'demo') {
      perm.setDemoPreset('admin')
    }
  }

  /** 演示构建：任意账号口令均可进入壳；顶栏展示名取自账号输入 */
  function enterDemoShell(profile?: { userName?: string; nickName?: string }) {
    if (!isDemoRuntime()) return
    const u = (profile?.userName ?? '').trim() || 'demo'
    const n = (profile?.nickName ?? '').trim() || u || '纯前端演示'
    setTokens(DEMO_ACCESS_TOKEN, DEMO_REFRESH_TOKEN)
    nickName.value = n
    userName.value = u
    avatar.value = ''
    try {
      sessionStorage.setItem(
        DEMO_PROFILE_KEY,
        JSON.stringify({
          nickName: nickName.value,
          userName: userName.value,
        }),
      )
    } catch {
      /* ignore */
    }
    usePermissionStore().setDemoPreset('admin')
  }

  async function hydrateProfile() {
    if (!token.value) return
    if (isDemoSession()) return
    const profile = await authApi.getInfoApi()
    const u = profile.user as {
      nickName?: string
      userName?: string
      avatar?: string
    }
    nickName.value = u?.nickName ?? ''
    userName.value = u?.userName ?? ''
    avatar.value = (u?.avatar && String(u.avatar)) || ''
    const perm = usePermissionStore()
    perm.setFromApi({
      roles: profile.roles ?? [],
      perms: profile.permissions ?? [],
    })
  }

  async function login(payload: {
    username: string
    password: string
    uuid?: string
    code?: string
  }) {
    if (isDemoRuntime()) {
      enterDemoShell({
        userName: payload.username,
        nickName: payload.username,
      })
      return
    }
    const res = await authApi.loginApi(payload)
    setTokens(res.access_token, res.refresh_token)
    nickName.value = res.user.nickName
    userName.value = res.user.userName
    avatar.value = (res.user.avatar && String(res.user.avatar)) || ''
    await hydrateProfile()
  }

  async function logout() {
    try {
      if (refreshToken.value && !isDemoSession()) {
        await authApi.logoutApi(refreshToken.value)
      }
    } catch {
      /* ignore */
    }
    try {
      const { resetRouterDynamicState } = await import('@/router')
      resetRouterDynamicState()
    } catch {
      /* ignore */
    }
    clearSession()
  }

  /** 上传头像成功后同步顶栏（不必整页拉 getInfo） */
  function setAvatar(url: string) {
    avatar.value = (url && String(url).trim()) || ''
  }

  function clearSession() {
    token.value = ''
    refreshToken.value = ''
    nickName.value = ''
    userName.value = ''
    avatar.value = ''
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_KEY)
      sessionStorage.removeItem(DEMO_PROFILE_KEY)
    } catch {
      /* ignore */
    }
    usePermissionStore().resetToGuest()
  }

  return {
    token,
    refreshToken,
    nickName,
    userName,
    avatar,
    isLoggedIn,
    setTokens,
    setAvatar,
    restoreFromStorage,
    bootstrapAuthForRuntime,
    enterDemoShell,
    isDemoSession,
    hydrateProfile,
    login,
    logout,
    clearSession,
  }
})
