<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMobile } from '@/hooks'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    total: number
    currentPage: number
    pageSize: number
    pageSizes?: number[]
    /** 断点，默认 768 */
    breakpoint?: number
    /** 桌面端 layout */
    layoutDesktop?: string
    /** 移动端 layout */
    layoutMobile?: string
    size?: 'small' | 'default' | 'large'
    background?: boolean
    hideOnSinglePage?: boolean
  }>(),
  {
    pageSizes: () => [10, 20, 50],
    breakpoint: 768,
    layoutDesktop: 'total, prev, pager, next, sizes',
    layoutMobile: 'prev, pager, next',
    size: 'small',
    background: true,
    hideOnSinglePage: false,
  },
)

const emit = defineEmits<{
  (e: 'update:currentPage', v: number): void
  (e: 'update:pageSize', v: number): void
  (e: 'current-change', v: number): void
  (e: 'size-change', v: number): void
}>()

const attrs = useAttrs()
const { isMobile } = useMobile(props.breakpoint)
useI18n() // 保证继承到页面的 i18n 上下文（ElPagination 内部用到）

const layout = computed(() =>
  isMobile.value ? props.layoutMobile : props.layoutDesktop,
)

function onCurrentChange(v: number) {
  emit('update:currentPage', v)
  emit('current-change', v)
}

function onSizeChange(v: number) {
  emit('update:pageSize', v)
  emit('size-change', v)
}
</script>

<template>
  <div class="smart-pagination" v-bind="attrs">
    <el-pagination
      :current-page="currentPage"
      :page-size="pageSize"
      :page-sizes="pageSizes"
      :total="total"
      :layout="layout"
      :size="size"
      :background="background"
      :hide-on-single-page="hideOnSinglePage"
      @update:current-page="onCurrentChange"
      @update:page-size="onSizeChange"
    />
  </div>
</template>

<style scoped lang="scss">
.smart-pagination {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .smart-pagination {
    justify-content: center;
  }
}

/* playful pills */
.smart-pagination :deep(.el-pagination) {
  padding: 0;
}

.smart-pagination :deep(.el-pagination.is-background .btn-prev),
.smart-pagination :deep(.el-pagination.is-background .btn-next),
.smart-pagination :deep(.el-pagination.is-background .el-pager li) {
  border-radius: 999px;
  border: 1px solid var(--el-border-color-lighter);
  background: color-mix(in srgb, var(--el-bg-color) 88%, var(--el-color-primary) 12%);
  transition: transform 0.12s ease, border-color 0.12s ease, background 0.12s ease;
}

.smart-pagination :deep(.el-pagination.is-background .btn-prev:hover),
.smart-pagination :deep(.el-pagination.is-background .btn-next:hover),
.smart-pagination :deep(.el-pagination.is-background .el-pager li:hover) {
  transform: translateY(-1px);
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.smart-pagination :deep(.el-pagination.is-background .el-pager li.is-active) {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
  color: #fff;
}

.smart-pagination :deep(.el-pagination__sizes .el-select .el-input__wrapper) {
  border-radius: 999px;
}
</style>

