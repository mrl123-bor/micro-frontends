<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SimplePage from '@micro/components/SimplePage.vue'
import { useRouteTitle } from '@micro/composables/useRouteTitle'

const route = useRoute()
const { titleForRoute } = useRouteTitle()
const title = computed(() => titleForRoute(route))
</script>

<template>
  <SimplePage :title="title" subtitle="列表示例占位，可在此演示 el-table 等组件。">
    <p class="hint">示例子应用页面：后续可在此独立补充表格、分页、操作列等。</p>
  </SimplePage>
</template>

<style scoped lang="scss">
.hint {
  margin: 0;
  font-size: 13px;
  color: var(--admin-text-muted);
  line-height: 1.6;
}
</style>
