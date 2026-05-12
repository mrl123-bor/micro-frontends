<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ROUTE_NAMES } from '@/constants/route-names'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const from = computed(() =>
  typeof route.query.from === 'string' ? route.query.from : '',
)

function goBack() {
  if (from.value) {
    router.push(from.value)
  } else {
    router.push({ name: ROUTE_NAMES.dashboard })
  }
}
</script>

<template>
  <div class="forbidden">
    <el-result
      icon="warning"
      :title="t('forbidden.title')"
      :sub-title="t('forbidden.sub')"
    >
      <template #extra>
        <el-button type="primary" @click="goBack">{{ t('forbidden.back') }}</el-button>
        <el-button @click="router.push({ name: ROUTE_NAMES.dashboard })">{{ t('forbidden.dashboard') }}</el-button>
      </template>
    </el-result>
  </div>
</template>

<style scoped lang="scss">
.forbidden {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  padding: 24px;
}
</style>
