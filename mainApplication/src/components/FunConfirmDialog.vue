<script setup lang="ts">
import GlassFormDialog from './GlassFormDialog.vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    message?: string
    tips?: string[]
    confirmText?: string
    cancelText?: string
    loading?: boolean
    width?: string
    /** false 时隐藏取消按钮（仅确认） */
    showCancel?: boolean
    /** 透传 GlassFormDialog：是否显示黄、绿装饰点 */
    trafficDecorDots?: boolean
  }>(),
  {
    title: '请确认操作',
    message: '',
    tips: () => [],
    confirmText: '确认',
    cancelText: '取消',
    loading: false,
    width: 'min(92vw, 520px)',
    showCancel: true,
    trafficDecorDots: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [boolean]
  confirm: []
  cancel: []
  close: []
}>()

function onUpdateModelValue(value: boolean) {
  emit('update:modelValue', value)
}

function onConfirm() {
  emit('confirm')
}

function onCancel() {
  emit('update:modelValue', false)
  emit('cancel')
}

function onClose() {
  emit('close')
}
</script>

<template>
  <GlassFormDialog
    :model-value="props.modelValue"
    :title="props.title"
    :traffic-decor-dots="props.trafficDecorDots"
    :width="props.width"
    :confirm-text="props.confirmText"
    :cancel-text="props.cancelText"
    :loading="props.loading"
    :show-default-footer="false"
    @update:model-value="onUpdateModelValue"
    @confirm="onConfirm"
    @cancel="onCancel"
    @close="onClose"
  >
    <div class="fun-confirm">
      <div class="fun-confirm__badge" aria-hidden="true">🎯</div>
      <p class="fun-confirm__message">{{ props.message }}</p>
      <ul v-if="props.tips.length" class="fun-confirm__tips">
        <li v-for="(tip, idx) in props.tips" :key="idx">{{ tip }}</li>
      </ul>
      <slot />
    </div>

    <template #footer>
      <div class="fun-confirm__footer">
        <el-button v-if="props.showCancel" round @click="onCancel">{{ props.cancelText }}</el-button>
        <el-button type="primary" round :loading="props.loading" @click="onConfirm">
          {{ props.confirmText }}
        </el-button>
      </div>
    </template>
  </GlassFormDialog>
</template>

<style scoped>
.fun-confirm {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fun-confirm__badge {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.14), rgba(16, 185, 129, 0.18));
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.16);
}

.fun-confirm__message {
  margin: 0;
  line-height: 1.7;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.fun-confirm__tips {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(99, 102, 241, 0.2);
  background: linear-gradient(180deg, rgba(99, 102, 241, 0.08), rgba(99, 102, 241, 0.03));
  list-style: none;
}

.fun-confirm__tips li {
  color: var(--el-text-color-secondary);
  line-height: 1.6;
  font-size: 13px;
}

.fun-confirm__tips li + li {
  margin-top: 4px;
}

.fun-confirm__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
