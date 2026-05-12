<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import MenuMetaIcon from '@/components/MenuMetaIcon/index.vue'
import { useRouteTitle } from '@/composables/useRouteTitle'
import { hasMenuIcon } from '@/utils/resolveMenuIcon'
import {
  resolveMenuIndex,
  useAdminMenuRoutes,
  visibleMenuChildren,
} from '@/composables/useAdminMenuRoutes'

const route = useRoute()
const router = useRouter()
const { titleForRoute } = useRouteTitle()
const { menuRoutes, findActiveRootRoute } = useAdminMenuRoutes()

const activeRoot = computed(() => findActiveRootRoute(route.path))

function firstNavigablePath(r: RouteRecordRaw): string {
  const kids = visibleMenuChildren(r)
  if (kids.length) return firstNavigablePath(kids[0]!)
  return resolveMenuIndex(r, router)
}

function onPickRoot(r: RouteRecordRaw) {
  const target = firstNavigablePath(r)
  if (target && target !== route.path) void router.push(target)
}

function isRootActive(r: RouteRecordRaw): boolean {
  const cur = activeRoot.value
  if (!cur) return false
  return (r.name ?? r.path) === (cur.name ?? cur.path)
}
</script>

<template>
  <nav class="mix-top" aria-label="Primary">
    <button
      v-for="r in menuRoutes"
      :key="String(r.name ?? r.path)"
      type="button"
      class="mix-top__btn"
      :class="{ 'mix-top__btn--active': isRootActive(r) }"
      @click="onPickRoot(r)"
    >
      <span v-if="hasMenuIcon(r.meta?.icon)" class="mix-top__ico" aria-hidden="true">
        <MenuMetaIcon :name="r.meta!.icon" :size="16" />
      </span>
      <span class="mix-top__txt">{{ titleForRoute(r) }}</span>
    </button>
  </nav>
</template>

<style scoped lang="scss">
.mix-top {
  display: flex;
  align-items: stretch;
  gap: 2px;
  min-width: 0;
  flex: 1;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

.mix-top__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin: 0;
  padding: 0 12px;
  height: 44px;
  border: none;
  border-radius: 10px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--admin-text-secondary);
  background: transparent;
  cursor: pointer;
  transition:
    color 0.18s ease,
    background 0.18s ease;

  &:hover {
    color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  }
}

.mix-top__btn--active {
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.mix-top__ico {
  display: flex;
  align-items: center;
  justify-content: center;
}

.mix-top__txt {
  white-space: nowrap;
}
</style>
