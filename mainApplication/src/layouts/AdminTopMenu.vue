<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AdminMenuTree from '@/layouts/AdminMenuTree.vue'
import { useAdminMenuRoutes } from '@/composables/useAdminMenuRoutes'

const route = useRoute()
const { menuRoutes } = useAdminMenuRoutes()

const activeMenu = computed(() => route.path)
</script>

<template>
  <el-menu
    :default-active="activeMenu"
    mode="horizontal"
    :ellipsis="false"
    menu-trigger="hover"
    :show-timeout="180"
    :hide-timeout="200"
    :popper-offset="10"
    popper-class="admin-top-menu-popper"
    popper-effect="light"
    router
    class="admin-top-menu"
    background-color="transparent"
  >
    <AdminMenuTree :routes="menuRoutes" horizontal-flyout />
  </el-menu>
</template>

<style scoped lang="scss">
.admin-top-menu {
  flex: 1;
  min-width: 0;
  border-bottom: none !important;
  display: flex;
  align-items: center;
  /** 项多时横向滚动，避免 EP ellipsis 把项塞进「更多」后下拉错位 */
  overflow-x: auto;
  overflow-y: visible;
  scrollbar-width: thin;

  &.el-menu--horizontal {
    height: 48px;
    flex-wrap: nowrap;
  }

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    height: 44px !important;
    line-height: 44px !important;
    padding: 0 14px !important;
    margin: 0 2px;
    border-radius: 10px;
    border-bottom: none !important;
    color: var(--admin-text);
    font-weight: 600;
    font-size: 13px;
    transition:
      background 0.18s ease,
      color 0.18s ease;
  }

  :deep(.el-menu-item:hover),
  :deep(.el-sub-menu__title:hover) {
    color: var(--el-color-primary) !important;
    background: color-mix(in srgb, var(--el-color-primary) 10%, transparent) !important;
  }

  :deep(.el-menu-item.is-active) {
    color: var(--el-color-primary) !important;
    background: color-mix(in srgb, var(--el-color-primary) 14%, transparent) !important;
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 35%, transparent);
  }

  :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
    color: var(--el-color-primary) !important;
  }

  :deep(.playful-row) {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  :deep(.el-sub-menu__icon-arrow) {
    position: static;
    margin-top: 0;
    margin-left: 2px;
  }

  :deep(.el-menu-item .playful-icon-wrap),
  :deep(.el-sub-menu__title .playful-icon-wrap) {
    display: inline-flex;
  }
}
</style>

<style lang="scss">
@keyframes admin-top-menu-pop-in {
  0% {
    opacity: 0;
    filter: blur(5px);
  }
  100% {
    opacity: 1;
    filter: blur(0);
  }
}

/* 顶栏子菜单挂在 body，需非 scoped */
.admin-top-menu-popper.el-popper {
  border-radius: 16px !important;
  padding: 8px 6px !important;
  border: 1px solid
    color-mix(in srgb, var(--el-color-primary) 22%, var(--el-border-color) 78%) !important;
  background: linear-gradient(
      145deg,
      color-mix(in srgb, var(--el-bg-color-overlay, var(--el-fill-color-blank)) 88%, transparent) 0%,
      color-mix(in srgb, var(--el-color-primary) 7%, var(--el-fill-color-blank)) 100%
    ),
    color-mix(in srgb, var(--el-bg-color-overlay) 92%, transparent) !important;
  backdrop-filter: blur(18px) saturate(1.35);
  -webkit-backdrop-filter: blur(18px) saturate(1.35);
  box-shadow:
    0 18px 48px color-mix(in srgb, var(--el-color-primary) 14%, rgba(15, 23, 42, 0.14)),
    0 0 0 1px color-mix(in srgb, #fff 62%, transparent) inset,
    0 1px 0 color-mix(in srgb, var(--el-color-primary) 35%, transparent) inset !important;
  z-index: 5000 !important;
  animation: admin-top-menu-pop-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* 右侧飞层为 right-*，不做淡入动画，避免首帧与 Popper 写入的 transform 打架 */
.admin-top-menu-popper.el-popper[data-popper-placement^='right'] {
  animation: none;
}

html.dark .admin-top-menu-popper.el-popper {
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.5),
    0 0 0 1px color-mix(in srgb, var(--el-color-primary) 25%, transparent) inset,
    0 1px 0 color-mix(in srgb, #fff 8%, transparent) inset !important;
}

.admin-top-menu-popper .el-menu--popup {
  min-width: 184px;
  border: none !important;
  background: transparent !important;
  max-height: none !important;
  overflow: visible !important;
}

/* 下拉挂在 body，scoped 里 .admin-top-menu :deep(.playful-row) 选不中，须写进 popper */
.admin-top-menu-popper .playful-row {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.admin-top-menu-popper .playful-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.admin-top-menu-popper .playful-mini-dot {
  flex-shrink: 0;
}

.admin-top-menu-popper .el-menu-item {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  height: 40px !important;
  line-height: 40px !important;
  margin: 2px 6px !important;
  padding: 0 14px !important;
  border-radius: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  transition:
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease,
    padding-left 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.admin-top-menu-popper .el-menu-item:hover {
  padding-left: 18px !important;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--el-color-primary) 18%, transparent),
    color-mix(in srgb, var(--el-color-primary) 6%, transparent)
  ) !important;
  color: var(--el-color-primary) !important;
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 28%, transparent);
}

.admin-top-menu-popper .el-menu-item.is-active {
  color: var(--el-color-primary) !important;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--el-color-primary) 22%, transparent),
    color-mix(in srgb, var(--el-color-primary) 10%, transparent)
  ) !important;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 35%, transparent);
}

.admin-top-menu-popper .el-sub-menu__title {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  height: 40px !important;
  line-height: 40px !important;
  margin: 2px 6px !important;
  padding: 0 14px !important;
  border-radius: 12px;
  font-weight: 600;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease,
    padding-left 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.admin-top-menu-popper .el-sub-menu__title:hover {
  padding-left: 18px !important;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--el-color-primary) 16%, transparent),
    color-mix(in srgb, var(--el-color-primary) 5%, transparent)
  ) !important;
  color: var(--el-color-primary) !important;
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 24%, transparent);
}

.admin-top-menu-popper .el-sub-menu__icon-arrow {
  transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
