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
  <SimplePage :title="title" subtitle="分类管理示意页，可在此接入树形或表格维护。">
    <p class="hint">演示内容子应用页面：后续可在此独立迭代分类管理占位/业务。</p>
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
