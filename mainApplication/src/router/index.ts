import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'
import {
  coreLayoutChildren,
  hiddenLayoutChildren,
  staticExtraMenuRoutes,
} from '@/router/routes'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'
import { useDynamicRoutesStore } from '@/stores/dynamic-routes'
import { ROUTE_NAMES } from '@/constants/route-names'
import { i18n } from '@/i18n'
import { APP_TITLE } from '@/constants/envApp'

/** 演示角色注入的静态菜单是否已挂到 Layout */
let demoLayoutExtrasLoaded = false

function resetLayoutExtras(router: ReturnType<typeof createRouter>) {
  useDynamicRoutesStore().clearFromRouter(router)
  if (demoLayoutExtrasLoaded) {
    for (const name of ['Content', 'Demo', 'Printer', 'System']) {
      if (router.hasRoute(name)) router.removeRoute(name)
    }
    demoLayoutExtrasLoaded = false
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { public: true, title: '登录', noTags: true },
    },
    {
      path: '/learning-guide',
      name: 'LearningGuide',
      component: () => import('@/views/LearningGuidePage.vue'),
      meta: { public: true, title: '学习地图', noTags: true },
    },
    {
      path: '/abnormal',
      name: 'Abnormal',
      component: () => import('@/views/common/AbnormalDetected.vue'),
      meta: { public: true, title: '环境异常', hidden: true, noTags: true },
    },
    {
      path: '/',
      name: 'Layout',
      component: AdminLayout,
      redirect: { name: ROUTE_NAMES.dashboard },
      children: [...coreLayoutChildren, ...hiddenLayoutChildren],
    },
    /**
     * 不要在首屏放「全部重定向到 /dashboard」的通配路由：
     * F5 时动态路由尚未 addRoute，/system/xxx 会先被通配抢走，导致永远进工作台。
     * 通配在 prepareRouterBeforeMount 末尾再注册（此时已注入 getRouters 菜单）。
     */
  ],
})

/**
 * 有 Token 时先拉 getInfo / getRouters 再交给 Vue 做首次 URL 匹配，避免刷新丢当前页。
 */
export async function prepareRouterBeforeMount() {
  const auth = useAuthStore()
  if (!auth.token) {
    addWildcardRoutes()
    return
  }

  try {
    /** 已有 access_token 时只做 getInfo 同步用户与权限，不会去换 token；换 token 仅在请求 401 时由 request 拦截器调 /auth/refresh */
    if (!auth.isDemoSession()) {
      await auth.hydrateProfile()
    }
    const permAfter = usePermissionStore()
    if (permAfter.source === 'api') {
      await useDynamicRoutesStore().loadFromApi(router)
    } else if (permAfter.source === 'demo') {
      if (!demoLayoutExtrasLoaded) {
        for (const r of staticExtraMenuRoutes) {
          router.addRoute('Layout', r)
        }
        demoLayoutExtrasLoaded = true
      }
    }
  } catch {
    resetLayoutExtras(router)
    auth.clearSession()
  }

  addWildcardRoutes()
}

/** 通配置于最后：仅匹配「前面都未命中」的路径 */
function addWildcardRoutes() {
  if (router.hasRoute('NotFound')) return
  router.addRoute({
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在', hidden: true, noTags: true },
  })
}

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const perm = usePermissionStore()

  if (to.meta.public) {
    if (auth.token && to.name === ROUTE_NAMES.login) {
      return { name: ROUTE_NAMES.dashboard, replace: true }
    }
    return true
  }

  if (!auth.token) {
    return {
      name: ROUTE_NAMES.login,
      query: to.fullPath && to.fullPath !== '/' ? { redirect: to.fullPath } : undefined,
    }
  }

  try {
    if (auth.token && perm.source === 'guest' && !auth.isDemoSession()) {
      await auth.hydrateProfile()
    }
    if (perm.source === 'api') {
      const dyn = useDynamicRoutesStore()
      const hadRoutes = dyn.loaded
      await dyn.loadFromApi(router)
      if (!hadRoutes && dyn.loaded && !to.meta.public) {
        return { path: to.fullPath, replace: true }
      }
    } else if (perm.source === 'demo') {
      if (!demoLayoutExtrasLoaded) {
        for (const r of staticExtraMenuRoutes) {
          router.addRoute('Layout', r)
        }
        demoLayoutExtrasLoaded = true
        return { path: to.fullPath, replace: true }
      }
    }
  } catch {
    resetLayoutExtras(router)
    auth.clearSession()
    return { name: ROUTE_NAMES.login, query: { redirect: to.fullPath } }
  }

  if (to.name === 'Forbidden') return true

  if (!perm.canAccessRoute(to)) {
    return {
      name: 'Forbidden',
      query:
        to.fullPath && to.fullPath !== '/403' ? { from: to.fullPath } : undefined,
    }
  }
  return true
})

function resolveRouteTitleForDocument(to: {
  name?: unknown
  meta?: { title?: unknown }
}) {
  const n = to.name != null ? String(to.name) : ''
  const key = n ? `route.${n}` : ''
  const i18nGlobal = i18n.global as unknown as {
    te: (k: string) => boolean
    t: (k: string) => string
  }
  if (key && i18nGlobal.te(key)) return i18nGlobal.t(key)
  const metaTitle = String(to.meta?.title ?? '').trim()
  return metaTitle
}

router.afterEach((to) => {
  const pageTitle = resolveRouteTitleForDocument(to)
  document.title = pageTitle ? `${pageTitle} - ${APP_TITLE}` : APP_TITLE
})

export function resetRouterDynamicState() {
  resetLayoutExtras(router)
}

export default router
