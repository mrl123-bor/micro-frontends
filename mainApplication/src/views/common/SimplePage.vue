<script setup lang="ts">
import { useSlots } from 'vue'

defineProps<{
  title: string
  subtitle?: string
}>()

const slots = useSlots()
</script>

<template>
  <div class="page">
    <header class="page-header" :class="{ 'page-header--has-actions': !!slots.actions }">
      <div class="page-header__text">
        <h1 class="title">{{ title }}</h1>
        <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="slots.actions" class="page-header__actions">
        <slot name="actions" />
      </div>
    </header>
    <el-card class="panel" shadow="never">
      <slot />
    </el-card>
  </div>
</template>

<style scoped lang="scss">
/* 铺满主内容区，避免宽屏右侧大块留白（列表/表格页） */
.page {
  width: 100%;
  min-width: 0;
}

.page-header {
  margin-bottom: 20px;
}

.page-header--has-actions {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px 24px;
  flex-wrap: wrap;
}

.page-header__text {
  min-width: 0;
  flex: 1;
}

.page-header__actions {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding-top: 2px;
}

.title {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(
    120deg,
    var(--admin-text) 0%,
    var(--el-color-primary) 160%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;

  @at-root html.dark & {
    background: linear-gradient(
      120deg,
      var(--admin-text) 0%,
      var(--el-color-primary-light-3) 140%
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--admin-text-secondary);
  line-height: 1.55;
  max-width: 60ch;
}

.panel {
  border-radius: 18px !important;
  border: 1px solid color-mix(in srgb, var(--admin-border) 88%, var(--el-color-primary) 12%) !important;
  background: var(--admin-surface) !important;
  box-shadow: var(--admin-shadow-soft) !important;
  transition:
    border-color 0.22s ease,
    box-shadow 0.22s ease;

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.hint {
  margin: 0;
  font-size: 13px;
  color: var(--admin-text-muted);
  line-height: 1.6;
}
</style>
