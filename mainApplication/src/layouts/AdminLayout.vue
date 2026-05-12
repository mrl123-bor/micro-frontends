<script setup lang="ts">
import { computed, onMounted, onUnmounted, provide, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import type { RouteLocationNormalized } from 'vue-router'
import {
  Expand,
  Fold,
  Menu,
  Refresh,
  SwitchButton,
  User,
} from '@element-plus/icons-vue'
import AdminSidebarMenu from '@/layouts/AdminSidebarMenu.vue'
import AdminOrbitSplitNav from '@/layouts/AdminOrbitSplitNav.vue'
import AdminTopMenu from '@/layouts/AdminTopMenu.vue'
import AdminMixTopBar from '@/layouts/AdminMixTopBar.vue'
import TagsView from '@/layouts/TagsView.vue'
import ThemeToggle from '@/layouts/ThemeToggle.vue'
import MenuLayoutSwitcher from '@/layouts/MenuLayoutSwitcher.vue'
import RoleSwitcher from '@/layouts/RoleSwitcher.vue'
import LanguageSwitcher from '@/layouts/LanguageSwitcher.vue'
import { showI18nSwitcher } from '@/constants/features'
import { useRouteTitle, useMobile } from '@/hooks'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'
import { ROUTE_NAMES } from '@/constants/route-names'
import { APP_TITLE } from '@/constants/envApp'
import { isDemoRuntime } from '@/constants/runtimeMode'
import { resolvePublicFileUrl } from '@/utils/publicUrl'
import {
  hasContentMicroEntry,
  hasExamplesMicroEntry,
  isContentMicroHostRoute,
  isExamplesMicroHostRoute,
} from '@/micro/setupContentExamplesMicro'
import { isPrintDesignMicroHostRoute } from '@/micro/setupPrintDesignMicro'
import {
  useAdminMenuRoutes,
  visibleMenuChildren,
} from '@/composables/useAdminMenuRoutes'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { titleForRoute } = useRouteTitle()
const { isMobile } = useMobile(768)

const appStore = useAppStore()
const { sidebarCollapsed, drawerVisible, menuLayout } = storeToRefs(appStore)
const { menuRoutes, findActiveRootRoute } = useAdminMenuRoutes()

const authStore = useAuthStore()
const permissionStore = usePermissionStore()

const showDemoRoleSwitcher = import.meta.env.VITE_DEMO_SWITCHER === 'true'
const showRoleSwitcher = computed(
  () =>
    (isDemoRuntime() && authStore.isDemoSession()) ||
    (showDemoRoleSwitcher && permissionStore.source !== 'api'),
)
const showDemoRuntimeBadge = computed(
  () => isDemoRuntime() && authStore.isDemoSession(),
)
const logoTitle = computed(() => APP_TITLE || t('app.name'))
const logoMark = computed(() => {
  const s = logoTitle.value.trim()
  if (!s) return t('app.nameShort')
  const parts = s.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  return s.slice(0, 2).toUpperCase()
})

const userPopoverVisible = ref(false)

const userGreetLabel = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return t('layout.userMenuGreetMorning')
  if (h < 18) return t('layout.userMenuGreetAfternoon')
  return t('layout.userMenuGreetEvening')
})

const userInitials = computed(() => {
  const n = (authStore.nickName || authStore.userName || '?').trim()
  return (n.slice(0, 1) || '?').toUpperCase()
})

const headerAvatarUrl = computed(() => resolvePublicFileUrl(authStore.avatar))
const showHeaderAvatarImg = computed(() => !!headerAvatarUrl.value)

const USER_MENU_FUN_KEYS = [
  'layout.userMenuFun1',
  'layout.userMenuFun2',
  'layout.userMenuFun3',
  'layout.userMenuFun4',
  'layout.userMenuFun5',
  'layout.userMenuFun6',
] as const

/** 展开菜单时随机一句；可点击趣味条再换一句 */
const userMenuFunIndex = ref(0)

const userMenuFunLine = computed(() =>
  t(USER_MENU_FUN_KEYS[userMenuFunIndex.value] ?? USER_MENU_FUN_KEYS[0]),
)

function pickRandomFunIndex() {
  userMenuFunIndex.value = Math.floor(Math.random() * USER_MENU_FUN_KEYS.length)
}

function shuffleUserMenuQuote() {
  const n = USER_MENU_FUN_KEYS.length
  if (n <= 1) return
  let next = userMenuFunIndex.value
  let guard = 0
  while (next === userMenuFunIndex.value && guard < 12) {
    next = Math.floor(Math.random() * n)
    guard += 1
  }
  userMenuFunIndex.value = next
}

watch(userPopoverVisible, (open) => {
  if (open) pickRandomFunIndex()
})

async function onLogout() {
  userPopoverVisible.value = false
  await authStore.logout()
  await router.push({ name: ROUTE_NAMES.login })
}

function goProfile() {
  userPopoverVisible.value = false
  router.push({ name: ROUTE_NAMES.profile })
}

const mainViewKey = ref(0)
function reloadMainView() {
  mainViewKey.value += 1
}
provide('reloadMainView', reloadMainView)

const breadcrumbs = computed(() =>
  route.matched
    .filter((r) => r.meta?.title)
    .map((r) => ({ title: titleForRoute(r), path: r.path })),
)

const frameMenuLayout = computed(() => (isMobile.value ? 'side' : menuLayout.value))

const showPcAside = computed(() =>
  ['side', 'sideIcon', 'mix'].includes(frameMenuLayout.value),
)

const asideCollapse = computed(() =>
  frameMenuLayout.value === 'sideIcon' ? true : sidebarCollapsed.value,
)

/** 趣味布局：悬浮玻璃坞（仍用 menuLayout sideIcon，避免已存 localStorage 失效） */
const pcOrbitDock = computed(
  () => !isMobile.value && frameMenuLayout.value === 'sideIcon',
)

/** 双栏轨道：有二级时拉宽 aside，二级贴在主栏右侧 */
const orbitDockSecondaryCount = computed(() => {
  if (!pcOrbitDock.value) return 0
  const root = findActiveRootRoute(route.path)
  return root ? visibleMenuChildren(root).length : 0
})

const asideWidth = computed(() => {
  if (pcOrbitDock.value) {
    return orbitDockSecondaryCount.value > 0 ? '318px' : '132px'
  }
  return asideCollapse.value ? '64px' : '220px'
})

const mixSideRoutes = computed(() => {
  if (frameMenuLayout.value !== 'mix') return undefined
  const root = findActiveRootRoute(route.path)
  if (!root) return menuRoutes.value
  const ch = visibleMenuChildren(root)
  return ch.length ? ch : menuRoutes.value
})

const pcTopMenu = computed(() => !isMobile.value && menuLayout.value === 'top')
const pcMixMenu = computed(() => !isMobile.value && menuLayout.value === 'mix')

const showPrimaryBreadcrumb = computed(
  () => isMobile.value || frameMenuLayout.value === 'side' || frameMenuLayout.value === 'sideIcon',
)

const showSecondaryBreadcrumb = computed(() => pcTopMenu.value || pcMixMenu.value)

const showCollapseBtn = computed(
  () => isMobile.value || frameMenuLayout.value === 'side' || frameMenuLayout.value === 'mix',
)

const layoutChromeClass = computed(() => ({
  'admin-root--menu-top': pcTopMenu.value || pcMixMenu.value,
  'admin-root--orbit-dock': pcOrbitDock.value,
}))

function onToggleSidebar() {
  if (!isMobile.value && menuLayout.value === 'sideIcon') return
  appStore.toggleFrameMenu(isMobile.value)
}

watch(
  () => route.path,
  () => {
    if (isMobile.value) appStore.closeDrawer()
  },
)

watch(isMobile, (m) => {
  if (!m) appStore.closeDrawer()
})

/** qiankun 在路由匹配瞬间就会加载子应用，但设计器页是异步 chunk，壳子晚于 single-spa 挂载；容器放在布局里可同步存在 */
const printDesignMicroEntry = computed(
  () =>
    (import.meta.env.VITE_PRINT_DESIGN_ENTRY as string | undefined)?.trim() ?? '',
)
const showPrintDesignMicroContainer = computed(
  () =>
    !!printDesignMicroEntry.value && isPrintDesignMicroHostRoute(route),
)

const showContentMicroContainer = computed(
  () => hasContentMicroEntry() && isContentMicroHostRoute(route),
)
const showExamplesMicroContainer = computed(
  () => hasExamplesMicroEntry() && isExamplesMicroHostRoute(route),
)

const showAnyQiankunHostContainer = computed(
  () =>
    showPrintDesignMicroContainer.value ||
    showContentMicroContainer.value ||
    showExamplesMicroContainer.value,
)

function routeRecordHasMicroHost(
  r: Pick<RouteLocationNormalized, 'matched'>,
): boolean {
  return r.matched.some(
    (m) =>
      m.meta?.microPrintDesign === true ||
      m.meta?.microContent === true ||
      m.meta?.microExamples === true,
  )
}

/**
 * qiankun 容器与 router-view 为兄弟节点：路由切到微前端时容器会立刻显示，
 * 而 `page-shift` 仍在播放上一页的 leave，会出现「子应用叠在旧页上」的闪屏。
 * 凡进入/离开微前端宿主路由时关闭主区域过渡。
 */
const skipPageShiftForMicroHostNav = ref(false)
onMounted(() => {
  const off = router.beforeEach((to, from) => {
    skipPageShiftForMicroHostNav.value =
      routeRecordHasMicroHost(to) || routeRecordHasMicroHost(from)
  })
  onUnmounted(off)
})
</script>

<template>
  <el-container class="admin-root" :class="layoutChromeClass">
    <el-aside
      v-show="!isMobile && showPcAside"
      class="admin-aside"
      :class="{ 'admin-aside--orbit-dock': pcOrbitDock }"
      :width="asideWidth"
    >
      <AdminOrbitSplitNav v-if="pcOrbitDock" :logo-mark="logoMark" />
      <template v-else>
        <div class="logo" :class="{ 'logo--collapsed': asideCollapse }">
          <template v-if="!asideCollapse">
            <span class="logo-dot" aria-hidden="true" />
            <span class="logo-text">{{ logoTitle }}</span>
          </template>
          <span v-else class="logo-mark">{{ logoMark }}</span>
        </div>
        <AdminSidebarMenu :collapse="asideCollapse" :routes-override="mixSideRoutes" />
      </template>
    </el-aside>

    <el-drawer
      v-if="isMobile"
      v-model="drawerVisible"
      direction="ltr"
      size="82%"
      :with-header="false"
      append-to-body
      class="admin-drawer"
    >
      <div class="drawer-inner">
        <div class="drawer-logo">
          <span class="logo-dot" aria-hidden="true" />
          <span class="logo-text">{{ logoTitle }}</span>
        </div>
        <AdminSidebarMenu :collapse="false" />
      </div>
    </el-drawer>

    <el-container class="admin-main-wrap">
      <el-header class="admin-header" :class="{ 'admin-header--topmenu': pcTopMenu || pcMixMenu }">
        <el-button
          v-if="showCollapseBtn"
          class="collapse-btn"
          :icon="isMobile ? Menu : asideCollapse ? Expand : Fold"
          circle
          text
          @click="onToggleSidebar"
        />
        <router-link
          v-if="pcTopMenu"
          v-slot="{ navigate }"
          :to="{ name: ROUTE_NAMES.dashboard }"
          custom
        >
          <button type="button" class="header-home" @click="navigate">
            <span class="logo-dot" aria-hidden="true" />
            <span class="header-home__txt">{{ logoMark }}</span>
          </button>
        </router-link>
        <AdminTopMenu v-if="pcTopMenu" class="header-embed-menu" />
        <AdminMixTopBar v-else-if="pcMixMenu" class="header-embed-menu" />
        <div v-if="showPrimaryBreadcrumb" class="breadcrumb-wrap">
          <el-breadcrumb
            :separator="isMobile ? '·' : '/'"
            class="header-crumb"
          >
            <el-breadcrumb-item
              v-for="(item, i) in breadcrumbs"
              :key="item.path + i"
            >
              <span v-if="i === breadcrumbs.length - 1">{{ item.title }}</span>
              <router-link v-else :to="item.path">{{ item.title }}</router-link>
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-actions">
          <span
            v-if="showDemoRuntimeBadge"
            class="runtime-demo-badge"
            :title="t('layout.demoRuntimeTip')"
          >{{ t('layout.demoRuntimeBadge') }}</span>
          <RoleSwitcher v-if="showRoleSwitcher" />
          <el-popover
            v-model:visible="userPopoverVisible"
            placement="bottom-end"
            :width="304"
            trigger="hover"
            :show-after="100"
            :show-arrow="true"
            popper-class="admin-user-popover"
          >
            <template #reference>
              <button type="button" class="user-chip" :aria-expanded="userPopoverVisible">
                <span class="user-chip__avatar" aria-hidden="true">
                  <img
                    v-if="showHeaderAvatarImg"
                    class="user-chip__img"
                    :src="headerAvatarUrl"
                    alt=""
                  />
                  <template v-else>{{ userInitials }}</template>
                </span>
                <span class="user-chip__text">
                  <span class="user-chip__name">{{
                    authStore.nickName || authStore.userName || '—'
                  }}</span>
                  <span
                    v-if="
                      authStore.userName &&
                      authStore.nickName &&
                      authStore.nickName !== authStore.userName
                    "
                    class="user-chip__sub"
                  >
                    {{ authStore.userName }}
                  </span>
                </span>
                <span class="user-chip__chev" aria-hidden="true" />
              </button>
            </template>
            <div class="ud-panel" role="dialog" aria-label="User menu">
              <div
                class="ud-banner"
                :class="{ 'ud-banner--has-photo': showHeaderAvatarImg }"
              >
                <img
                  v-if="showHeaderAvatarImg"
                  class="ud-banner__bg"
                  :src="headerAvatarUrl"
                  alt=""
                  aria-hidden="true"
                />
                <div
                  v-if="showHeaderAvatarImg"
                  class="ud-banner__gloss"
                  aria-hidden="true"
                />
                <div
                  v-if="showHeaderAvatarImg"
                  class="ud-banner__scrim"
                  aria-hidden="true"
                />
                <div class="ud-banner__inner">
                  <div class="ud-banner__meta">
                    <div class="ud-banner__greet">{{ userGreetLabel }}</div>
                    <div class="ud-banner__name">
                      {{ authStore.nickName || authStore.userName || '—' }}
                    </div>
                    <div v-if="authStore.userName" class="ud-banner__account">
                      <span class="ud-banner__account-k">{{ t('layout.userMenuAccount') }}</span>
                      <span class="ud-banner__account-v">{{ authStore.userName }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                class="ud-fun"
                :title="t('layout.userMenuFunShuffle')"
                :aria-label="t('layout.userMenuFunShuffle')"
                @click.stop="shuffleUserMenuQuote"
              >
                <span class="ud-fun__text">{{ userMenuFunLine }}</span>
                <span class="ud-fun__ico" aria-hidden="true">
                  <el-icon><Refresh /></el-icon>
                </span>
              </button>
              <div class="ud-actions">
                <button type="button" class="ud-btn ud-btn--primary" @click="goProfile">
                  <el-icon class="ud-btn__ico"><User /></el-icon>
                  {{ t('layout.profile') }}
                </button>
                <button type="button" class="ud-btn ud-btn--muted" @click="onLogout">
                  <el-icon class="ud-btn__ico"><SwitchButton /></el-icon>
                  {{ t('layout.logout') }}
                </button>
              </div>
            </div>
          </el-popover>
          <LanguageSwitcher v-if="showI18nSwitcher" />
          <MenuLayoutSwitcher />
          <ThemeToggle />
        </div>
      </el-header>
      <el-header v-if="showSecondaryBreadcrumb" class="admin-header admin-header--subcrumb">
        <div class="breadcrumb-wrap">
          <el-breadcrumb
            :separator="isMobile ? '·' : '/'"
            class="header-crumb"
          >
            <el-breadcrumb-item
              v-for="(item, i) in breadcrumbs"
              :key="'sub' + item.path + i"
            >
              <span v-if="i === breadcrumbs.length - 1">{{ item.title }}</span>
              <router-link v-else :to="item.path">{{ item.title }}</router-link>
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </el-header>
      <TagsView />
      <el-main class="admin-main">
        <div class="admin-main-surface">
          <div
            class="admin-main-inner"
            :class="{
              'admin-main-inner--micro-host': showAnyQiankunHostContainer,
            }"
          >
            <div
              v-if="printDesignMicroEntry"
              v-show="showPrintDesignMicroContainer"
              id="micro-print-design"
              class="admin-qiankun-host"
            />
            <div
              v-if="hasContentMicroEntry()"
              v-show="showContentMicroContainer"
              id="micro-content"
              class="admin-qiankun-host"
            />
            <div
              v-if="hasExamplesMicroEntry()"
              v-show="showExamplesMicroContainer"
              id="micro-examples"
              class="admin-qiankun-host"
            />
            <router-view v-slot="{ Component }">
              <transition
                :name="skipPageShiftForMicroHostNav ? 'page-instant' : 'page-shift'"
                mode="out-in"
              >
                <component
                  :is="Component"
                  :key="`${route.fullPath}:${mainViewKey}`"
                />
              </transition>
            </router-view>
          </div>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped lang="scss">
/* 锁定为视口高度，避免整页（侧栏+主区）跟内容一起滚动 */
.admin-root {
  height: 100vh;
  height: 100dvh;
  max-height: 100dvh;
  min-height: 0;
  overflow: hidden;
  background: var(--admin-page-bg);
}

.admin-root--orbit-dock {
  background: radial-gradient(
      120% 70% at 0% 18%,
      rgba(129, 140, 248, 0.09),
      transparent 52%
    ),
    var(--admin-page-bg);
}

/* 侧栏：贴边整列，克制、偏工具型后台 */
.admin-aside {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  align-self: stretch;
  background: var(--admin-aside-bg);
  background-color: var(--admin-aside-solid);
  border-right: 1px solid var(--admin-aside-border);
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: none;

  > * {
    position: relative;
    z-index: 1;
  }

  :deep(.admin-menu) {
    flex: 1;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background:
      radial-gradient(
        130% 50% at 0% 0%,
        var(--admin-sidebar-ambient-1),
        transparent 58%
      ),
      radial-gradient(
        100% 40% at 100% 100%,
        var(--admin-sidebar-ambient-2),
        transparent 55%
      );
  }

  &.admin-aside--orbit-dock {
    background: transparent;
    background-color: transparent;
    border-right: none;
    box-shadow: none;
    padding: 18px 0 22px 14px;

    &::before {
      display: none;
    }
  }
}

.logo-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--el-color-primary-light-3);
  box-shadow: 0 0 10px var(--admin-logo-glow);
}

.logo {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  height: 52px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--admin-sidebar-text-on);
  font-weight: 600;
  letter-spacing: 0.02em;
  border-bottom: 1px solid var(--admin-aside-border);

  &--collapsed {
    padding: 0 8px;
  }

  &-mark {
    font-size: 15px;
    font-weight: 700;
    line-height: 1;
  }

  &-text {
    font-size: 13.5px;
    font-weight: 600;
    text-transform: none;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.admin-main-wrap {
  background: transparent;
  min-width: 0;
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.admin-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 58px;
  padding: 0 14px;
  padding-left: max(14px, env(safe-area-inset-left));
  padding-right: max(14px, env(safe-area-inset-right));
  background: var(--admin-header-bg);
  border-bottom: 1px solid var(--admin-header-border);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: var(--admin-shadow-soft);
}

.admin-header--topmenu {
  height: auto !important;
  min-height: 54px;
  padding-top: 8px;
  padding-bottom: 8px;
  overflow: visible;
}

.admin-header--subcrumb {
  height: 44px;
  padding-top: 0;
  padding-bottom: 0;
  border-top: none;
}

.header-home {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid var(--admin-border-strong);
  background: color-mix(in srgb, var(--admin-surface) 90%, var(--el-color-primary-light-9) 10%);
  cursor: pointer;
  font: inherit;
  color: var(--admin-text);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 45%, var(--admin-border-strong));
  }

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 2px;
  }
}

.header-home__txt {
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 0.04em;
}

.header-embed-menu {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: stretch;
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
}

.admin-root--menu-top {
  .admin-main-inner--micro-host {
    min-height: max(320px, min(920px, calc(100dvh - 232px)));
  }
}

.collapse-btn {
  font-size: 19px;
  flex-shrink: 0;
  color: var(--admin-text-secondary);

  &:hover {
    color: var(--el-color-primary);
  }
}

.breadcrumb-wrap {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.header-crumb {
  font-size: 13px;
  --el-text-color-primary: var(--admin-text);
  --el-text-color-regular: var(--admin-text-secondary);

  :deep(.el-breadcrumb__inner) {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-block;
    vertical-align: bottom;

    a {
      color: var(--admin-text-secondary);
      font-weight: 500;

      &:hover {
        color: var(--el-color-primary);
      }
    }
  }
}

.header-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.runtime-demo-badge {
  margin-right: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--el-color-warning-dark-2);
  background: color-mix(in srgb, var(--el-color-warning) 22%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-warning) 45%, transparent);
}

.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  max-width: min(220px, 42vw);
  padding: 5px 10px 5px 5px;
  margin: 0;
  border: 1px solid color-mix(in srgb, var(--admin-border-strong) 80%, var(--el-color-primary) 20%);
  border-radius: 999px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--admin-surface) 88%, var(--el-color-primary-light-9) 12%),
    var(--admin-surface)
  );
  box-shadow:
    0 1px 0 color-mix(in srgb, #fff 75%, transparent) inset,
    0 6px 18px color-mix(in srgb, var(--el-color-primary) 6%, rgba(15, 23, 42, 0.04));
  cursor: pointer;
  font: inherit;
  color: inherit;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 35%, var(--admin-border-strong));
    box-shadow:
      0 1px 0 color-mix(in srgb, #fff 75%, transparent) inset,
      0 10px 26px color-mix(in srgb, var(--el-color-primary) 10%, rgba(15, 23, 42, 0.06));
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 2px;
  }
}

html.dark .user-chip {
  box-shadow:
    0 1px 0 color-mix(in srgb, #fff 8%, transparent) inset,
    0 8px 22px rgba(0, 0, 0, 0.35);
}

.user-chip__avatar {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 14px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(
    145deg,
    var(--el-color-primary-light-3),
    var(--el-color-primary)
  );
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--admin-surface) 92%, transparent);
}

.user-chip__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.user-chip__text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  text-align: left;
}

.user-chip__name {
  font-size: 13px;
  font-weight: 700;
  color: var(--admin-text);
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-chip__sub {
  font-size: 11px;
  font-weight: 600;
  color: var(--admin-text-secondary);
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-chip__chev {
  flex-shrink: 0;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid var(--admin-text-muted);
  margin-right: 2px;
  opacity: 0.75;
}

.admin-main {
  flex: 1;
  min-height: 0;
  padding: 14px 18px 18px;
  padding-bottom: max(18px, env(safe-area-inset-bottom));
  box-sizing: border-box;
  overflow: auto;
  position: relative;
  background: radial-gradient(
      110% 70% at 100% 0%,
      color-mix(in srgb, var(--el-color-primary) 5%, transparent),
      transparent 50%
    ),
    radial-gradient(
      80% 50% at 0% 100%,
      color-mix(in srgb, var(--el-color-primary-light-9) 55%, transparent),
      transparent 48%
    ),
    var(--admin-page-bg);
}

.admin-main-surface {
  min-height: calc(100% - 4px);
  width: 100%;
  border-radius: 20px;
  border: 1px solid var(--admin-border);
  background: color-mix(in srgb, var(--admin-surface) 92%, transparent);
  box-shadow:
    0 1px 0 color-mix(in srgb, #ffffff 65%, transparent) inset,
    0 20px 50px color-mix(in srgb, var(--admin-text) 4%, transparent);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 22px 24px 28px;
  box-sizing: border-box;

  @at-root html.dark & {
    background: color-mix(in srgb, var(--admin-surface) 88%, transparent);
    box-shadow:
      0 1px 0 color-mix(in srgb, #ffffff 8%, transparent) inset,
      0 16px 40px color-mix(in srgb, #000000 35%, transparent);
  }
}

.admin-main-inner {
  position: relative;
  width: 100%;
  min-width: 0;
  min-height: 120px;
}

.admin-main-inner--micro-host {
  /** 为 qiankun 绝对定位层提供高度（主区 header+标签+留白约 176px） */
  min-height: max(320px, min(920px, calc(100dvh - 176px)));

  .admin-qiankun-host {
    position: absolute;
    inset: 0;
    z-index: 2;
    min-height: 0;
    min-width: 0;
    width: 100%;
    /** 盖住下方 router-view 的离开动画，避免子应用与旧页同屏 */
    background: var(--admin-surface);
  }
}

.drawer-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  background: var(--admin-aside-bg);
  background-color: var(--admin-aside-solid);
  padding-bottom: env(safe-area-inset-bottom);

  > * {
    position: relative;
    z-index: 1;
  }

  :deep(.admin-menu) {
    flex: 1;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background:
      radial-gradient(
        120% 55% at 50% -15%,
        var(--admin-sidebar-ambient-1),
        transparent 55%
      ),
      radial-gradient(
        90% 45% at 100% 100%,
        var(--admin-sidebar-ambient-2),
        transparent 50%
      );
  }

  :deep(.admin-menu:not(.el-menu--collapse)) {
    width: 100%;
  }
}

.drawer-logo {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  height: 52px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--admin-sidebar-text-on);
  font-weight: 600;
  letter-spacing: 0.02em;
  border-bottom: 1px solid var(--admin-aside-border);

  .logo-text {
    font-size: 13.5px;
  }
}

@media (max-width: 768px) {
  .admin-main {
    padding: 10px 12px 14px;
    padding-left: max(12px, env(safe-area-inset-left));
    padding-right: max(12px, env(safe-area-inset-right));
  }

  .admin-main-surface {
    border-radius: 16px;
    padding: 16px 14px 20px;
  }

  .header-crumb {
    font-size: 12px;
  }
}

</style>

<style lang="scss">
/* 路由页切换：子组件根节点挂载在 router-view 下，需非 scoped */
.page-shift-enter-active {
  transition:
    opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: 0.03s;
}

.page-shift-leave-active {
  transition:
    opacity 0.18s cubic-bezier(0.4, 0, 0.9, 0.65),
    transform 0.18s cubic-bezier(0.4, 0, 0.9, 0.65);
}

.page-shift-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.99);
}

.page-shift-leave-to {
  opacity: 0;
  transform: translateY(-5px) scale(0.997);
}

@media (prefers-reduced-motion: reduce) {
  .page-shift-enter-active,
  .page-shift-leave-active {
    transition-duration: 0.01ms !important;
    transition-delay: 0s !important;
  }

  .page-shift-enter-from,
  .page-shift-leave-to {
    transform: none !important;
  }
}

.page-instant-enter-active,
.page-instant-leave-active {
  transition-duration: 0.01ms !important;
  transition-delay: 0s !important;
}

.page-instant-enter-from,
.page-instant-leave-to {
  opacity: 1 !important;
  transform: none !important;
}

.admin-drawer .el-drawer__body {
  padding: 0;
  overflow: hidden;
  background: var(--admin-aside-bg);
  background-color: var(--admin-aside-solid);
}

/* 用户菜单气泡：挂载在 body，需全局 */
.admin-user-popover.el-popper {
  padding: 0 !important;
  border: 1px solid color-mix(in srgb, var(--admin-border) 75%, var(--el-color-primary) 25%) !important;
  border-radius: 16px !important;
  background: transparent !important;
  box-shadow:
    0 24px 56px color-mix(in srgb, var(--el-color-primary) 8%, rgba(15, 23, 42, 0.12)),
    0 0 0 1px color-mix(in srgb, #fff 40%, transparent) inset !important;
  overflow: hidden;
  transition:
    box-shadow 0.38s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.38s ease,
    transform 0.38s cubic-bezier(0.22, 1, 0.36, 1);
}

.admin-user-popover.el-popper:hover,
.admin-user-popover.el-popper:focus-within {
  border-color: color-mix(in srgb, var(--el-color-primary) 42%, var(--admin-border)) !important;
  box-shadow:
    0 28px 64px color-mix(in srgb, var(--el-color-primary) 18%, rgba(15, 23, 42, 0.14)),
    0 0 0 1px color-mix(in srgb, var(--el-color-primary-light-5) 35%, transparent) inset,
    0 0 0 1px color-mix(in srgb, #fff 45%, transparent) inset !important;
  transform: translateY(-2px);
}

html.dark .admin-user-popover.el-popper {
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.45),
    0 0 0 1px color-mix(in srgb, #fff 10%, transparent) inset !important;
}

html.dark .admin-user-popover.el-popper:hover,
html.dark .admin-user-popover.el-popper:focus-within {
  border-color: color-mix(in srgb, var(--el-color-primary-light-3) 38%, var(--admin-border)) !important;
  box-shadow:
    0 26px 58px rgba(0, 0, 0, 0.55),
    0 0 28px color-mix(in srgb, var(--el-color-primary) 22%, transparent),
    0 0 0 1px color-mix(in srgb, #fff 14%, transparent) inset !important;
  transform: translateY(-2px);
}

.admin-user-popover .el-popper__arrow::before {
  border: 1px solid color-mix(in srgb, var(--admin-border) 75%, var(--el-color-primary) 25%) !important;
}

.ud-panel {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--admin-surface) 94%, var(--el-color-primary-light-9) 6%) 0%,
    var(--admin-surface) 48%
  );
  color: var(--admin-text);
  transition: filter 0.35s ease;
}

.ud-panel:hover {
  filter: saturate(1.02);
}

.ud-banner {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
  min-height: 108px;
  border-bottom: 1px solid var(--admin-border);
  background: radial-gradient(
    120% 100% at 50% 0%,
    color-mix(in srgb, var(--el-color-primary) 22%, transparent),
    color-mix(in srgb, var(--admin-surface-muted) 40%, var(--admin-surface)) 100%
  );
  cursor: default;
}

.ud-banner__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 25%;
  z-index: 0;
  transform: scale(1.03);
  transform-origin: center 30%;
  transition:
    transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.45s ease;
}

.ud-banner--has-photo .ud-banner__bg {
  animation: ud-banner-bg-breathe 18s ease-in-out infinite alternate;
}

.ud-banner--has-photo:hover .ud-banner__bg {
  animation-play-state: paused;
  transform: scale(1.1) translate(0, -1%);
  filter: saturate(1.08) brightness(1.04);
}

@keyframes ud-banner-bg-breathe {
  from {
    transform: scale(1.03) translate(0, 0);
  }
  to {
    transform: scale(1.07) translate(0.4%, -0.6%);
  }
}

.ud-banner__gloss {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.ud-banner__gloss::after {
  content: '';
  position: absolute;
  top: -40%;
  left: -80%;
  width: 55%;
  height: 220%;
  background: linear-gradient(
    118deg,
    transparent 0%,
    color-mix(in srgb, #fff 0%, transparent) 36%,
    color-mix(in srgb, #fff 22%, transparent) 50%,
    color-mix(in srgb, #fff 0%, transparent) 64%,
    transparent 100%
  );
  transform: rotate(14deg);
  animation: ud-banner-gloss 9s ease-in-out infinite;
  opacity: 0.85;
}

@keyframes ud-banner-gloss {
  0%,
  12% {
    transform: translateX(0) rotate(14deg);
    opacity: 0;
  }
  22% {
    opacity: 0.55;
  }
  48% {
    transform: translateX(220%) rotate(14deg);
    opacity: 0.35;
  }
  58%,
  100% {
    opacity: 0;
  }
}

.ud-banner__scrim {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    transparent 0%,
    color-mix(in srgb, #0f172a 18%, transparent) 38%,
    color-mix(in srgb, #0f172a 76%, transparent) 100%
  );
  transition:
    opacity 0.4s ease,
    filter 0.4s ease;
}

html.dark .ud-banner__scrim {
  background: linear-gradient(
    180deg,
    transparent 0%,
    color-mix(in srgb, #020617 28%, transparent) 40%,
    color-mix(in srgb, #020617 84%, transparent) 100%
  );
}

.ud-banner--has-photo:hover .ud-banner__scrim {
  opacity: 0.92;
  filter: brightness(1.08);
}

.ud-banner__inner {
  position: relative;
  z-index: 3;
  width: 100%;
  padding: 20px 16px 14px;
  box-sizing: border-box;
}

.ud-banner__meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.ud-banner--has-photo .ud-banner__greet {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, #fff 78%, var(--el-color-primary-light-5));
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.55);
  margin-bottom: 0;
}

.ud-banner--has-photo .ud-banner__name {
  color: #fff;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.2;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.45);
}

.ud-banner--has-photo .ud-banner__account {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid color-mix(in srgb, #fff 22%, transparent);
  width: 100%;
  font-size: 12px;
  line-height: 1.4;
  color: color-mix(in srgb, #fff 80%, transparent);
}

.ud-banner--has-photo .ud-banner__account-k {
  opacity: 0.88;
  margin-right: 6px;
}

.ud-banner--has-photo .ud-banner__account-v {
  font-weight: 700;
  color: #fff;
  word-break: break-all;
}

.ud-banner__greet {
  font-size: 11px;
  font-weight: 700;
  color: var(--el-color-primary);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.ud-banner:not(.ud-banner--has-photo) .ud-banner__name {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.25;
  color: var(--admin-text);
}

.ud-banner__name {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.ud-banner__account {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--admin-text-secondary);
}

.ud-banner__account-k {
  margin-right: 6px;
  opacity: 0.85;
}

.ud-banner__account-v {
  font-weight: 700;
  color: var(--admin-text);
  word-break: break-all;
}

.ud-fun {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  margin: 0;
  padding: 12px 16px;
  border: none;
  border-top: 1px solid color-mix(in srgb, var(--admin-border) 88%, transparent);
  font: inherit;
  font-size: 12px;
  line-height: 1.55;
  text-align: left;
  color: var(--admin-text-secondary);
  background: color-mix(in srgb, var(--admin-surface-muted) 55%, transparent);
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.ud-fun:hover {
  background: color-mix(in srgb, var(--el-color-primary-light-9) 35%, var(--admin-surface-muted));
  color: var(--admin-text);
}

.ud-fun:active {
  transform: scale(0.992);
}

.ud-fun__text {
  flex: 1;
  min-width: 0;
}

.ud-fun__ico {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-top: -2px;
  border-radius: 8px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  transition:
    transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1),
    background 0.2s ease;
}

.ud-fun:hover .ud-fun__ico {
  transform: rotate(-18deg) scale(1.06);
  background: color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}

.ud-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 16px 16px;
}

.ud-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  border-radius: 12px;
  border: none;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    filter 0.18s ease;
}

.ud-btn__ico {
  font-size: 16px;
}

.ud-btn--primary {
  color: #fff;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-color-primary) 92%, #000),
    var(--el-color-primary)
  );
  box-shadow: 0 4px 14px color-mix(in srgb, var(--el-color-primary) 35%, transparent);
}

.ud-btn--primary:hover {
  filter: brightness(1.06);
  box-shadow: 0 6px 20px color-mix(in srgb, var(--el-color-primary) 42%, transparent);
  transform: translateY(-1px);
}

.ud-btn--primary:active {
  transform: scale(0.99) translateY(0);
}

.ud-btn--muted {
  color: var(--admin-text-secondary);
  background: color-mix(in srgb, var(--admin-surface-muted) 85%, transparent);
  border: 1px solid var(--admin-border);
}

.ud-btn--muted:hover {
  color: var(--el-color-danger);
  border-color: color-mix(in srgb, var(--el-color-danger) 35%, var(--admin-border));
  background: color-mix(in srgb, var(--el-color-danger) 8%, var(--admin-surface-muted));
  transform: translateY(-1px);
}

.ud-btn--muted:active {
  transform: scale(0.99) translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .user-chip:active {
    transform: none;
  }

  .admin-user-popover.el-popper:hover,
  .admin-user-popover.el-popper:focus-within {
    transform: none;
  }

  .ud-panel:hover {
    filter: none;
  }

  .ud-banner--has-photo .ud-banner__bg {
    animation: none;
    transform: none;
  }

  .ud-banner--has-photo:hover .ud-banner__bg {
    transform: none;
    filter: none;
    animation: none;
  }

  .ud-banner--has-photo:hover .ud-banner__scrim {
    opacity: 1;
    filter: none;
  }

  .ud-banner__gloss::after {
    animation: none;
    opacity: 0;
  }

  .ud-fun:hover .ud-fun__ico {
    transform: none;
  }

  .ud-fun:active {
    transform: none;
  }

  .ud-btn--primary:hover,
  .ud-btn--primary:active,
  .ud-btn--muted:hover,
  .ud-btn--muted:active {
    transform: none;
  }
}
</style>
