<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { ArrowDown, ArrowRight } from '@element-plus/icons-vue'
import MenuMetaIcon from '@/components/MenuMetaIcon/index.vue'
import { useRouteTitle } from '@/hooks'
import { useI18n } from 'vue-i18n'
import {
  useAdminMenuRoutes,
  visibleMenuChildren,
  resolveMenuIndex,
} from '@/composables/useAdminMenuRoutes'
import { hasMenuIcon } from '@/utils/resolveMenuIcon'

defineProps<{
  logoMark: string
}>()

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { titleForRoute } = useRouteTitle()
const { menuRoutes, findActiveRootRoute } = useAdminMenuRoutes()

const activeRoot = computed(() => findActiveRootRoute(route.path))

function routeKey(r: RouteRecordRaw): string {
  return String(r.name ?? r.path)
}

/** 当前路由是否落在该节点及其可见子菜单范围内 */
function routeSubtreeMatchesCurrent(r: RouteRecordRaw): boolean {
  if (isSecondaryActive(r)) return true
  return visibleMenuChildren(r).some(routeSubtreeMatchesCurrent)
}

/** 仅当路径经过某目录时才默认展开；其余目录默认收起，由用户点击展开 */
function collectDefaultExpandedKeys(routes: RouteRecordRaw[], out: Set<string>) {
  for (const r of routes) {
    const kids = visibleMenuChildren(r)
    if (!kids.length) continue
    if (routeSubtreeMatchesCurrent(r)) {
      out.add(routeKey(r))
      collectDefaultExpandedKeys(kids, out)
    }
  }
}

const expandedSecondary = ref<Set<string>>(new Set())

watch(
  () => [
    route.path,
    String(route.name ?? ''),
    activeRoot.value ? routeKey(activeRoot.value) : '',
  ],
  () => {
    const root = activeRoot.value
    if (!root) {
      expandedSecondary.value = new Set()
      return
    }
    const next = new Set<string>()
    collectDefaultExpandedKeys(visibleMenuChildren(root), next)
    expandedSecondary.value = next
  },
  { immediate: true },
)

interface SecondaryNavRow {
  route: RouteRecordRaw
  depth: number
  isBranch: boolean
}

function flattenSecondaryVisible(
  routes: RouteRecordRaw[],
  depth: number,
  expanded: Set<string>,
  out: SecondaryNavRow[],
) {
  for (const r of routes) {
    const kids = visibleMenuChildren(r)
    const isBranch = kids.length > 0
    out.push({ route: r, depth, isBranch })
    if (isBranch && expanded.has(routeKey(r))) {
      flattenSecondaryVisible(kids, depth + 1, expanded, out)
    }
  }
}

const secondaryRows = computed(() => {
  const root = activeRoot.value
  if (!root) return []
  const out: SecondaryNavRow[] = []
  flattenSecondaryVisible(
    visibleMenuChildren(root),
    0,
    expandedSecondary.value,
    out,
  )
  return out
})

const showSecondary = computed(() => secondaryRows.value.length > 0)

function pathFor(r: RouteRecordRaw) {
  return resolveMenuIndex(r, router)
}

function isPrimaryActive(r: RouteRecordRaw) {
  const ar = activeRoot.value
  return ar !== undefined && String(ar.name ?? ar.path) === String(r.name ?? r.path)
}

function isSecondaryActive(c: RouteRecordRaw) {
  if (c.name != null && route.name === c.name) return true
  const p = pathFor(c)
  if (route.path === p) return true
  if (p !== '/' && route.path.startsWith(`${p}/`)) return true
  return false
}

function secondaryRowKey(row: SecondaryNavRow, i: number) {
  return `${row.depth}:${String(row.route.name ?? row.route.path)}:${i}`
}

function isSecondaryBranchExpanded(r: RouteRecordRaw) {
  return expandedSecondary.value.has(routeKey(r))
}

function toggleSecondaryBranch(r: RouteRecordRaw) {
  const k = routeKey(r)
  const next = new Set(expandedSecondary.value)
  if (next.has(k)) next.delete(k)
  else next.add(k)
  expandedSecondary.value = next
}

function onPrimaryClick(r: RouteRecordRaw) {
  const kids = visibleMenuChildren(r)
  if (kids.length) {
    const ar = activeRoot.value
    if (ar && String(ar.name ?? ar.path) === String(r.name ?? r.path)) return
    void router.push(pathFor(kids[0]))
    return
  }
  void router.push(pathFor(r))
}
</script>

<template>
  <div class="orbit-split">
    <span class="orbit-split__halo" aria-hidden="true" />
    <div class="orbit-split__row">
      <div class="orbit-split__primary">
        <div class="orbit-split-brand" :title="logoMark">
          <span class="orbit-split-brand__ring" aria-hidden="true" />
          <span class="orbit-split-brand__mark">{{ logoMark }}</span>
        </div>
        <nav
          class="orbit-split-primary"
          role="navigation"
          :aria-label="t('layout.orbitDockPrimaryNav')"
        >
          <button
            v-for="r in menuRoutes"
            :key="String(r.name ?? r.path)"
            type="button"
            class="orbit-split-primary__btn"
            :class="{ 'is-active': isPrimaryActive(r) }"
            @click="onPrimaryClick(r)"
          >
            <span class="orbit-split-primary__ico">
              <MenuMetaIcon
                v-if="hasMenuIcon(r.meta?.icon)"
                :name="r.meta!.icon"
                :size="20"
              />
              <span v-else class="orbit-split-primary__dot" aria-hidden="true" />
            </span>
            <span class="orbit-split-primary__txt">{{ titleForRoute(r) }}</span>
          </button>
        </nav>
      </div>
      <aside
        v-show="showSecondary"
        class="orbit-split__secondary"
        role="navigation"
        :aria-label="t('layout.orbitDockSecondaryNav')"
      >
        <div v-if="activeRoot" class="orbit-split__secondary-head">
          {{ titleForRoute(activeRoot) }}
        </div>
        <div class="orbit-split__secondary-scroll">
          <template v-for="(row, i) in secondaryRows" :key="secondaryRowKey(row, i)">
            <button
              v-if="row.isBranch"
              type="button"
              class="orbit-split__secondary-link orbit-split__secondary-branch"
              :class="{ 'is-active': isSecondaryActive(row.route) }"
              :aria-expanded="isSecondaryBranchExpanded(row.route)"
              :style="
                row.depth > 0
                  ? { paddingLeft: `${10 + row.depth * 14}px` }
                  : undefined
              "
              @click="toggleSecondaryBranch(row.route)"
            >
              <span class="orbit-split__secondary-ico">
                <MenuMetaIcon
                  v-if="hasMenuIcon(row.route.meta?.icon)"
                  :name="row.route.meta!.icon"
                  :size="18"
                />
                <span v-else class="orbit-split-primary__dot" aria-hidden="true" />
              </span>
              <span class="orbit-split__secondary-txt">{{
                titleForRoute(row.route)
              }}</span>
              <el-icon class="orbit-split__secondary-chevron">
                <ArrowDown v-if="isSecondaryBranchExpanded(row.route)" />
                <ArrowRight v-else />
              </el-icon>
            </button>
            <RouterLink
              v-else
              :to="pathFor(row.route)"
              class="orbit-split__secondary-link"
              :class="{ 'is-active': isSecondaryActive(row.route) }"
              :style="
                row.depth > 0
                  ? { paddingLeft: `${10 + row.depth * 14}px` }
                  : undefined
              "
            >
              <span class="orbit-split__secondary-ico">
                <MenuMetaIcon
                  v-if="hasMenuIcon(row.route.meta?.icon)"
                  :name="row.route.meta!.icon"
                  :size="18"
                />
                <span v-else class="orbit-split-primary__dot" aria-hidden="true" />
              </span>
              <span class="orbit-split__secondary-txt">{{
                titleForRoute(row.route)
              }}</span>
            </RouterLink>
          </template>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped lang="scss">
.orbit-split {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  margin-right: 4px;
  padding: 10px 8px 12px;
  border-radius: 26px;
  border: 1px solid var(--admin-orbit-dock-slab-border);
  background: var(--admin-orbit-dock-slab-bg);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  box-shadow: var(--admin-orbit-dock-slab-shadow);
  overflow: hidden;
}

.orbit-split__halo {
  position: absolute;
  width: 160px;
  height: 160px;
  left: 20%;
  top: -48px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 50% 50%,
    var(--admin-orbit-dock-halo),
    transparent 68%
  );
  pointer-events: none;
  opacity: 0.75;
}

@media (prefers-reduced-motion: no-preference) {
  .orbit-split__halo {
    animation: orbit-split-halo 16s ease-in-out infinite alternate;
  }
}

@keyframes orbit-split-halo {
  0% {
    transform: translate(0, 0) scale(1);
  }
  100% {
    transform: translate(12px, 14px) scale(1.06);
  }
}

.orbit-split__row {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0;
  gap: 8px;
}

.orbit-split__primary {
  display: flex;
  flex-direction: column;
  width: 86px;
  flex-shrink: 0;
  min-height: 0;
}

.orbit-split-brand {
  position: relative;
  flex-shrink: 0;
  height: 48px;
  width: 48px;
  margin: 0 auto 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: linear-gradient(
    145deg,
    rgba(99, 102, 241, 0.12),
    rgba(129, 140, 248, 0.06)
  );
  box-shadow: 0 0 0 1px var(--admin-orbit-dock-logo-ring) inset;
}

.orbit-split-brand__ring {
  position: absolute;
  inset: -3px;
  border-radius: 18px;
  border: 1px dashed rgba(99, 102, 241, 0.28);
  pointer-events: none;
  opacity: 0.72;
}

@media (prefers-reduced-motion: no-preference) {
  .orbit-split-brand__ring {
    animation: orbit-split-ring 32s linear infinite;
  }
}

@keyframes orbit-split-ring {
  to {
    transform: rotate(360deg);
  }
}

.orbit-split-brand__mark {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.04em;
  background: linear-gradient(
    120deg,
    var(--el-color-primary),
    var(--admin-sidebar-accent-violet, #8b5cf6)
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.orbit-split-primary {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 2px 0 4px;
}

.orbit-split-primary__btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  margin: 0;
  padding: 8px 4px;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  font: inherit;
  color: var(--admin-orbit-dock-menu-text);
  background: transparent;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    background: var(--admin-orbit-dock-icon-bg-hover);
  }

  &.is-active {
    background: var(--admin-orbit-dock-active-bg);
    box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.14) inset;
    font-weight: 600;
  }

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 2px;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .orbit-split-primary__btn:hover {
    transform: scale(1.02);
  }
}

.orbit-split-primary__ico {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--admin-orbit-dock-icon-bg);
  flex-shrink: 0;
}

.orbit-split-primary__btn.is-active .orbit-split-primary__ico {
  background: rgba(99, 102, 241, 0.18);
}

.orbit-split-primary__ico :deep(.el-icon) {
  color: var(--admin-orbit-dock-menu-muted);
}

.orbit-split-primary__btn.is-active .orbit-split-primary__ico :deep(.el-icon) {
  color: var(--admin-orbit-dock-menu-text);
}

.orbit-split-primary__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--admin-orbit-dock-menu-muted);
  opacity: 0.85;
}

.orbit-split-primary__txt {
  font-size: 11px;
  line-height: 1.2;
  text-align: center;
  max-width: 100%;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.orbit-split__secondary {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  border: 1px solid var(--admin-orbit-submenu-cell-border);
  background: var(--admin-orbit-submenu-cell);
}

.orbit-split__secondary-head {
  flex-shrink: 0;
  padding: 10px 12px 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--admin-orbit-dock-menu-muted);
  text-transform: uppercase;
  border-bottom: 1px solid var(--admin-orbit-submenu-cell-border);
}

.orbit-split__secondary-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 8px 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.orbit-split__secondary-chevron {
  flex-shrink: 0;
  margin-left: auto;
  font-size: 12px;
  color: var(--admin-orbit-dock-menu-muted);
}

.orbit-split__secondary-link {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 12px;
  text-decoration: none;
  color: var(--admin-orbit-dock-menu-text);
  font-size: 13px;
  font-weight: 500;
  border: 1px solid transparent;
  background-color: transparent;
  transition:
    background 0.16s ease,
    border-color 0.16s ease,
    transform 0.16s ease;

  /* 原生 button 默认灰底，与 RouterLink 不一致 */
  &.orbit-split__secondary-branch {
    width: 100%;
    box-sizing: border-box;
    margin: 0;
    font: inherit;
    cursor: pointer;
    text-align: left;
    appearance: none;
    -webkit-appearance: none;
    background-color: transparent;
    color: var(--admin-orbit-dock-menu-text);
  }

  &:hover {
    background: rgba(99, 102, 241, 0.08);
    border-color: rgba(99, 102, 241, 0.12);
  }

  &.is-active {
    font-weight: 600;
    background: var(--admin-orbit-dock-active-bg);
    border-color: rgba(99, 102, 241, 0.22);
  }

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 1px;
  }
}

.orbit-split__secondary-ico {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(99, 102, 241, 0.1);
  flex-shrink: 0;
}

.orbit-split__secondary-ico :deep(.el-icon) {
  color: var(--admin-orbit-dock-menu-muted);
}

.orbit-split__secondary-link.is-active .orbit-split__secondary-ico :deep(.el-icon) {
  color: var(--admin-orbit-dock-menu-text);
}

.orbit-split__secondary-link.is-active .orbit-split__secondary-chevron {
  color: var(--admin-orbit-dock-menu-text);
}

.orbit-split__secondary-txt {
  flex: 1;
  min-width: 0;
  line-height: 1.35;
}
</style>
