<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PERM_SYSTEM_LOG_CLEAR, PERM_SYSTEM_LOG_EXPORT } from '@/constants/perms'
import SimplePage from '@/views/common/SimplePage.vue'

const { t } = useI18n()

const logs = computed(() => [
  {
    time: '2026-04-04 10:22',
    user: t('pages.log.mock1User'),
    action: t('pages.log.mock1Action'),
    detail: t('pages.log.mock1Detail'),
  },
  {
    time: '2026-04-04 09:05',
    user: t('pages.log.mock2User'),
    action: t('pages.log.mock2Action'),
    detail: t('pages.log.mock2Detail'),
  },
  {
    time: '2026-04-03 18:40',
    user: t('pages.log.mock3User'),
    action: t('pages.log.mock3Action'),
    detail: t('pages.log.mock3Detail'),
  },
])
</script>

<template>
  <SimplePage :title="t('pages.log.title')" :subtitle="t('pages.log.subtitle')">
    <div class="log-toolbar">
      <el-button v-permission="PERM_SYSTEM_LOG_EXPORT" @click="() => {}">
        {{ t('crud.exportLog') }}
      </el-button>
      <el-button
        v-permission.disable="PERM_SYSTEM_LOG_CLEAR"
        type="danger"
        plain
        @click="() => {}"
      >
        {{ t('crud.clearDemo') }}
      </el-button>
    </div>
    <el-timeline>
      <el-timeline-item
        v-for="(log, i) in logs"
        :key="i"
        :timestamp="log.time"
        placement="top"
        type="primary"
        hollow
      >
        <el-card shadow="hover" class="log-card">
          <div class="log-user">{{ log.user }}</div>
          <div class="log-action">{{ log.action }}</div>
          <p class="log-detail">{{ log.detail }}</p>
        </el-card>
      </el-timeline-item>
    </el-timeline>
  </SimplePage>
</template>

<style scoped lang="scss">
.log-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
}

.log-card {
  border-radius: 12px !important;
  border: 1px solid var(--admin-border) !important;
}

.log-user {
  font-weight: 650;
  font-size: 14px;
  color: var(--admin-text);
  margin-bottom: 4px;
}

.log-action {
  font-size: 13px;
  color: var(--el-color-primary);
  margin-bottom: 6px;
}

.log-detail {
  margin: 0;
  font-size: 13px;
  color: var(--admin-text-secondary);
}
</style>
