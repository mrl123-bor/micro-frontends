<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    /** 是否显示“重置”按钮 */
    showReset?: boolean
    /** 搜索按钮文案（不传则用 i18n） */
    searchText?: string
    /** 重置按钮文案（不传则用 i18n） */
    resetText?: string
    /** 是否紧凑模式（更适合工具条） */
    compact?: boolean
  }>(),
  {
    showReset: true,
    compact: true,
  },
)

const { t } = useI18n()
const searchLabel = computed(() => props.searchText ?? t('common.search'))
const resetLabel = computed(() => props.resetText ?? t('common.reset'))

const emit = defineEmits<{
  search: []
  reset: []
}>()

const formClass = computed(() => [
  'common-search',
  props.compact ? 'is-compact' : '',
])
</script>

<template>
  <el-form :inline="true" :class="formClass" @submit.prevent="emit('search')">
    <div class="common-search__fields">
      <slot />
    </div>
    <div class="common-search__actions">
      <slot name="actions">
        <el-button type="primary" native-type="submit">{{ searchLabel }}</el-button>
        <el-button v-if="props.showReset" @click="emit('reset')">{{ resetLabel }}</el-button>
      </slot>
    </div>
  </el-form>
</template>

<style scoped lang="scss">
.common-search {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.common-search__fields {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.common-search__actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.common-search.is-compact {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}
</style>

