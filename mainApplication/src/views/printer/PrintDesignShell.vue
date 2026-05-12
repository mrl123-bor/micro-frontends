<template>
  <div v-if="!microEntry" class="print-design-shell print-design-shell--missing">
    <p class="print-design-shell__missing-title">未配置标签模板设计子应用</p>
    <p class="print-design-shell__missing-hint">
      请在环境变量中设置
      <code>VITE_PRINT_DESIGN_ENTRY</code>
      为子应用入口 URL（须以 <code>/</code> 结尾或与子应用
      <code>base</code>
      一致），开发环境先执行
      <code>subapps/print-design-micro</code>
      下的
      <code>npm run dev</code>
      ，再启动主应用。
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const microEntry = computed(
  () =>
    (import.meta.env.VITE_PRINT_DESIGN_ENTRY as string | undefined)?.trim() ?? '',
)
</script>

<style scoped>
.print-design-shell {
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.print-design-shell--missing {
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  color: var(--el-text-color-regular);
  font-size: 14px;
  line-height: 1.6;
}

.print-design-shell__missing-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.print-design-shell__missing-hint {
  margin: 0;
  max-width: 520px;
}

.print-design-shell__missing-hint code {
  margin: 0 2px;
  padding: 1px 6px;
  font-size: 12px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}
</style>
