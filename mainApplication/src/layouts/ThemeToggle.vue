<script setup lang="ts">
import { Moon, Sunny } from '@element-plus/icons-vue'
import { useTheme } from '@/hooks'

const { isDark, toggleTheme, themeAnimating } = useTheme()
</script>

<template>
  <el-tooltip
    :content="isDark ? '切换为浅色模式' : '切换为深色模式'"
    placement="bottom"
  >
    <el-button
      class="theme-toggle-btn"
      :icon="isDark ? Sunny : Moon"
      circle
      text
      :loading="themeAnimating"
      @click="toggleTheme($event)"
    />
  </el-tooltip>
</template>

<style scoped lang="scss">
.theme-toggle-btn {
  font-size: 18px;
  color: var(--admin-text-secondary);

  &:hover {
    color: var(--el-color-primary);
  }
}
</style>
