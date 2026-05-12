<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import AdminMenuTree from '@/layouts/AdminMenuTree.vue'
import { useAdminMenuRoutes } from '@/composables/useAdminMenuRoutes'

const props = withDefaults(
  defineProps<{
    collapse?: boolean
    /** 混合布局：仅渲染当前一级模块下的子菜单 */
    routesOverride?: RouteRecordRaw[]
  }>(),
  { collapse: false, routesOverride: undefined },
)

const route = useRoute()
const { menuRoutes: storeMenuRoutes } = useAdminMenuRoutes()

const activeMenu = computed(() => route.path)

const menuRoutes = computed(() => props.routesOverride ?? storeMenuRoutes.value)
</script>

<template>
  <el-menu
    :default-active="activeMenu"
    :collapse="props.collapse"
    :unique-opened="true"
    router
    class="admin-menu admin-menu--rail"
    background-color="transparent"
  >
    <AdminMenuTree :routes="menuRoutes" />
  </el-menu>
</template>

<style scoped lang="scss">
.admin-menu {
  border-right: none;

  &:not(.el-menu--collapse) {
    width: 100%;
  }
}
</style>
