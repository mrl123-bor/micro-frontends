<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import SimplePage from '@micro/components/SimplePage.vue'
import ImageUpload from '@micro/components/ImageUpload/index.vue'
import { useRouteTitle } from '@micro/composables/useRouteTitle'

const route = useRoute()
const { titleForRoute } = useRouteTitle()
const title = computed(() => titleForRoute(route))

/** 演示 ImageUpload：v-model 为逗号分隔的相对路径（需后端 /common/upload 或改 action） */
const demoImages = ref('')
</script>

<template>
  <SimplePage :title="title" subtitle="表单示例：含公共图片上传（点击 / 拖拽 / 聚焦后粘贴）。">
    <el-card shadow="never" class="card">
      <template #header>ImageUpload</template>
      <ImageUpload v-model="demoImages" :limit="3" :file-size="5" />
      <p class="hint">当前值（提交给后端的字符串）：{{ demoImages || '（空）' }}</p>
    </el-card>
  </SimplePage>
</template>

<style scoped lang="scss">
.card {
  max-width: 640px;
}

.hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--admin-text-muted);
  line-height: 1.6;
  word-break: break-all;
}
</style>
