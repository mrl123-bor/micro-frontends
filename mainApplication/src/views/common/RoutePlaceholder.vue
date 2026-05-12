<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <el-empty description="页面未接入或组件路径未映射">
    <template #default>
      <p class="sub">
        路由：{{ route.path }}（{{ String(route.name ?? '') }}）
      </p>
      <p class="sub">请在 <code>src/router/dynamic-menu.ts</code> 的 VIEW_RESOLVER 中补充页面。</p>
    </template>
  </el-empty>
</template>

<style scoped lang="scss">
.sub {
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  text-align: center;
}
code {
  font-size: 12px;
}
</style>
