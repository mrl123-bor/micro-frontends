<script setup lang="ts">
import type { RouteRecordRaw } from 'vue-router'
import { useRouter } from 'vue-router'
import AdminMenuTree from './AdminMenuTree.vue'
import MenuMetaIcon from '@/components/MenuMetaIcon/index.vue'
import { useRouteTitle } from '@/hooks'
import { hasMenuIcon } from '@/utils/resolveMenuIcon'

const props = withDefaults(
  defineProps<{
    routes: RouteRecordRaw[]
    /**
     * 顶栏水平菜单：嵌套子菜单默认挂在第一层 popper 内会错位；
     * 开启后子层 teleport 到 body，且子层 popper-offset 为 0 与父级贴齐。
     */
    horizontalFlyout?: boolean
    /** 与 horizontalFlyout 配合：根为 0，每进一层子菜单 +1 */
    horizontalFlyoutDepth?: number
  }>(),
  {
    horizontalFlyout: false,
    horizontalFlyoutDepth: 0,
  },
)

const router = useRouter()
const { titleForRoute } = useRouteTitle()

function visibleMenuChildren(r: RouteRecordRaw): RouteRecordRaw[] {
  return (r.children ?? []).filter(
    (c) => !c.meta?.hidden && !!c.meta?.title,
  )
}

function isSubMenu(r: RouteRecordRaw): boolean {
  return visibleMenuChildren(r).length > 0
}

function resolveIndex(r: RouteRecordRaw): string {
  if (r.name != null) {
    return router.resolve({ name: r.name }).path
  }
  return r.path.startsWith('/') ? r.path : `/${r.path}`
}

</script>

<template>
  <template v-for="r in routes" :key="String(r.name ?? r.path)">
    <el-sub-menu
      v-if="isSubMenu(r) && r.meta?.title && !r.meta?.hidden"
      :index="resolveIndex(r)"
      :teleported="
        props.horizontalFlyout && props.horizontalFlyoutDepth > 0
          ? true
          : undefined
      "
      :popper-offset="
        props.horizontalFlyout && props.horizontalFlyoutDepth > 0 ? 0 : undefined
      "
    >
      <template #title>
        <!-- 折叠时 EP 会隐藏 .sub-menu__title 下直接子级 span，根节点必须用 div -->
        <div class="playful-row">
          <div v-if="hasMenuIcon(r.meta.icon)" class="playful-icon-wrap">
            <MenuMetaIcon :name="r.meta.icon" :size="18" />
          </div>
          <span class="playful-label">{{ titleForRoute(r) }}</span>
        </div>
      </template>
      <AdminMenuTree
        :routes="visibleMenuChildren(r)"
        :horizontal-flyout="props.horizontalFlyout"
        :horizontal-flyout-depth="
          props.horizontalFlyout ? props.horizontalFlyoutDepth + 1 : 0
        "
      />
    </el-sub-menu>
    <el-menu-item
      v-else-if="r.meta?.title && !r.meta?.hidden"
      :index="resolveIndex(r)"
    >
      <!-- 折叠时 EP 会隐藏 .menu-item 下直接子级 span，图标容器用 div -->
      <div v-if="hasMenuIcon(r.meta.icon)" class="playful-icon-wrap">
        <MenuMetaIcon :name="r.meta.icon" :size="18" />
      </div>
      <div v-else class="playful-mini-dot" aria-hidden="true" />
      <template #title>
        <span class="playful-label">{{ titleForRoute(r) }}</span>
      </template>
    </el-menu-item>
  </template>
</template>
