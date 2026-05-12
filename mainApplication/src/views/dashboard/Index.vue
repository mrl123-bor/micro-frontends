<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PERM_DASHBOARD_SENSITIVE } from '@/constants/perms'

const { t } = useI18n()

const stats = computed(() => [
  { label: t('dashboard.statVisit'), value: '1,284', trend: '+12%' },
  { label: t('dashboard.statPending'), value: '36', trend: '-3' },
  { label: t('dashboard.statOrder'), value: '892', trend: '+8%' },
  { label: t('dashboard.statActive'), value: '5.2k', trend: '+21%' },
])
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1 class="title">{{ t('dashboard.title') }}</h1>
      <p class="subtitle">
        {{ t('dashboard.subtitle') }}
      </p>
    </header>

    <el-alert
      v-permission="PERM_DASHBOARD_SENSITIVE"
      class="sensitive-banner"
      :title="t('dashboard.sensitiveTitle')"
      type="warning"
      show-icon
      :closable="false"
    />

    <el-row :gutter="18" class="cards">
      <el-col v-for="s in stats" :key="s.label" :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">{{ s.label }}</div>
          <div class="stat-value">{{ s.value }}</div>
          <el-tag size="small" type="success" effect="light" class="stat-trend">
            {{ s.trend }}
          </el-tag>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="panel" shadow="never">
      <template #header>
        <span>{{ t('dashboard.quickTitle') }}</span>
      </template>
      <ul class="tips">
        <li>{{ t('dashboard.tip1') }}</li>
        <li>{{ t('dashboard.tip2') }}</li>
        <li>{{ t('dashboard.tip3') }}</li>
      </ul>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.page {
  max-width: 1200px;
}

.page-header {
  margin-bottom: 22px;
}

.title {
  margin: 0 0 8px;
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
  color: var(--admin-text-secondary);
  font-size: 14px;
  line-height: 1.55;
  max-width: 52ch;
}

.sensitive-banner {
  margin-bottom: 18px;
  border-radius: 12px;
}

.cards {
  margin-bottom: 22px;
}

.stat-card {
  margin-bottom: 16px;
  border-radius: 14px !important;
  border: 1px solid var(--admin-border) !important;
  background: var(--admin-surface) !important;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease;

  &:hover {
    border-color: var(--admin-border-strong) !important;
    transform: translateY(-2px);
    box-shadow: var(--admin-card-hover-shadow);
  }
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--admin-text-muted);
  margin-bottom: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--admin-text);
  margin-bottom: 12px;
  font-variant-numeric: tabular-nums;
}

.stat-trend {
  font-weight: 600;
}

.panel {
  border-radius: 14px !important;
  border: 1px solid var(--admin-border) !important;
  background: var(--admin-surface) !important;
  overflow: hidden;

  :deep(.el-card__header) {
    font-weight: 650;
    color: var(--admin-text);
    border-bottom-color: var(--admin-border) !important;
  }
}

.tips {
  margin: 0;
  padding-left: 20px;
  color: var(--admin-text-secondary);
  line-height: 1.75;
  font-size: 14px;
}

@media (max-width: 768px) {
  .page-header {
    margin-bottom: 16px;
  }

  .title {
    font-size: 20px;
  }

  .subtitle {
    font-size: 13px;
  }

  .stat-value {
    font-size: 22px;
  }

  .tips {
    font-size: 13px;
    padding-left: 18px;
  }
}
</style>
