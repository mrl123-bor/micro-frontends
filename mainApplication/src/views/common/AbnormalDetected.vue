<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const { t } = useI18n()

void route
// 保留生命周期占位，避免后续要扩展时再改结构
onMounted(() => {})
onBeforeUnmount(() => {})
</script>

<template>
  <div class="abnormal">
    <div class="abnormal__bg" aria-hidden="true" />
    <div class="abnormal__card">
      <div class="abnormal__badge">
        <span class="dot" aria-hidden="true" />
        {{ t('abnormal.badge') }}
      </div>

      <div class="abnormal__title">{{ t('abnormal.title') }}</div>
      <div class="abnormal__sub">
        {{ t('abnormal.sub') }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.abnormal {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #0b0c14;
  color: #fff;
  overflow: hidden;
}

.abnormal__bg {
  position: absolute;
  inset: -60px;
  background:
    radial-gradient(680px 320px at 18% 22%, rgba(64, 158, 255, 0.30), transparent 60%),
    radial-gradient(720px 360px at 82% 18%, rgba(91, 92, 240, 0.26), transparent 62%),
    radial-gradient(520px 280px at 50% 86%, rgba(255, 255, 255, 0.10), transparent 60%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 55%);
  filter: blur(0px);
  opacity: 0.95;
}

.abnormal__card {
  position: relative;
  width: min(560px, 94vw);
  border-radius: 20px;
  padding: 18px 18px 16px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.10);
  backdrop-filter: blur(12px);
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.42);
}

.abnormal__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(64, 158, 255, 0.12);
  border: 1px solid rgba(64, 158, 255, 0.28);
  color: rgba(255, 255, 255, 0.92);
  font-size: 12px;
}

.abnormal__badge .dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--el-color-primary);
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.20);
}

.abnormal__title {
  margin-top: 12px;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.2px;
}

.abnormal__sub {
  margin-top: 8px;
  opacity: 0.88;
  font-size: 13px;
  line-height: 1.6;
}
</style>

