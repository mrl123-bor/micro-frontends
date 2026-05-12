<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const url = computed(
  () => (route.meta.link as string | undefined) || '',
)
</script>

<template>
  <div class="external-frame">
    <p v-if="!url" class="hint">未配置外链地址</p>
    <iframe
      v-else
      class="frame"
      title="外部页面"
      :src="url"
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
    />
  </div>
</template>

<style scoped lang="scss">
.external-frame {
  height: calc(100vh - 120px);
  min-height: 400px;
}
.frame {
  width: 100%;
  height: 100%;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}
.hint {
  color: var(--el-text-color-secondary);
  padding: 24px;
}
</style>
