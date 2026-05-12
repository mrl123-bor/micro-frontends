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
  <SimplePage :title="title" subtitle="分析页占位，可在此接入图表或统计卡片。">
    <p class="hint">静态路由占位：后续可补充 ECharts 等可视化示例。</p>
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
