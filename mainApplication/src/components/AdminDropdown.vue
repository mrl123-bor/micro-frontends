<script setup lang="ts">
import { computed, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** 追加在 `admin-dropdown-popper` 之后，便于业务写额外 popper 样式 */
    popperClass?: string
  }>(),
  { popperClass: '' },
)

const emit = defineEmits<{
  (e: 'visibleChange', visible: boolean): void
}>()

const attrs = useAttrs()

const mergedPopperClass = computed(() => {
  const extra = props.popperClass?.trim()
  return extra ? `admin-dropdown-popper ${extra}` : 'admin-dropdown-popper'
})
</script>

<template>
  <el-dropdown
    class="admin-dropdown"
    v-bind="attrs"
    :popper-class="mergedPopperClass"
    @visible-change="(v: boolean) => emit('visibleChange', v)"
  >
    <slot />
    <template #dropdown>
      <slot name="dropdown" />
    </template>
  </el-dropdown>
</template>

<style lang="scss">
@keyframes admin-dropdown-pop {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(-8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.admin-dropdown-popper.el-popper {
  border-radius: 16px !important;
  padding: 6px !important;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 65%, transparent) !important;
  background: color-mix(in srgb, var(--el-bg-color) 82%, transparent) !important;
  backdrop-filter: blur(18px) saturate(1.35);
  -webkit-backdrop-filter: blur(18px) saturate(1.35);
  box-shadow:
    0 4px 6px color-mix(in srgb, #000 4%, transparent),
    0 22px 48px color-mix(in srgb, #000 10%, transparent),
    0 0 0 1px color-mix(in srgb, var(--el-color-primary) 6%, transparent) inset !important;
  animation: admin-dropdown-pop 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.admin-dropdown-popper .el-dropdown-menu {
  padding: 4px !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}
</style>
