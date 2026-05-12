<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/constants/route-names'

const router = useRouter()

function goHome() {
  router.replace({ name: ROUTE_NAMES.dashboard })
}
</script>

<template>
  <div class="not-found">
    <el-result title="404" sub-title="页面不存在或尚未配置路由">
      <template #extra>
        <el-button type="primary" @click="goHome">回工作台</el-button>
      </template>
    </el-result>
  </div>
</template>

<style scoped lang="scss">
.not-found {
  padding: 48px 16px;
}
</style>
