<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowDown } from '@element-plus/icons-vue'
import type { AppLocale } from '@/i18n'
import { persistLocale } from '@/i18n'

const { locale, t } = useI18n()

const currentLabel = computed(() =>
  locale.value === 'en-US' ? t('layout.langEn') : t('layout.langZh'),
)

function setLocale(code: string) {
  const next = code as AppLocale
  locale.value = next
  persistLocale(next)
}
</script>

<template>
  <el-dropdown trigger="click" @command="setLocale">
    <span class="lang-trigger">
      {{ currentLabel }}
      <el-icon class="lang-arrow"><ArrowDown /></el-icon>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="zh-CN">{{ t('layout.langZh') }}</el-dropdown-item>
        <el-dropdown-item command="en-US">{{ t('layout.langEn') }}</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped lang="scss">
.lang-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--admin-text-secondary);
  cursor: pointer;
  user-select: none;
  padding: 6px 8px;
  border-radius: 10px;

  &:hover {
    color: var(--admin-text);
    background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  }
}

.lang-arrow {
  font-size: 12px;
  opacity: 0.7;
}
</style>
