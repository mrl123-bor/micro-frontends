<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { useI18n } from 'vue-i18n'

defineOptions({ inheritAttrs: false })

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    direction?: 'rtl' | 'ltr' | 'ttb' | 'btt'
    size?: string | number
    withHeader?: boolean
    destroyOnClose?: boolean
    appendToBody?: boolean
    closeOnClickModal?: boolean
    showClose?: boolean
    modal?: boolean
    lockScroll?: boolean
    zIndex?: number
    beforeClose?: (done: (cancel?: boolean) => void) => void
    /** 额外 class，会与 `glass-drawer` 合并（便于页面写 :deep 微调） */
    drawerClass?: string
    /** 为 true 时内容区不套默认内边距（如移动端全屏侧栏） */
    flushBody?: boolean
    /**
     * 为 true 时面板在视口居中（宽/高仍由 size 与内容约束），过渡为缩放+淡入，而非贴边滑入。
     * 与 `flushBody`、移动端全屏侧栏等贴边场景不要同时用。
     */
    centered?: boolean
    /** 是否启用遮罩毛玻璃（Monaco 等重绘负载高场景可关闭以避免闪烁） */
    blurBackdrop?: boolean
    /** 为 true 时显示黄、绿装饰点（最小化/缩放样式，无操作）；默认可只保留红关闭 */
    trafficDecorDots?: boolean
  }>(),
  {
    title: '',
    direction: 'rtl',
    withHeader: true,
    destroyOnClose: false,
    appendToBody: false,
    closeOnClickModal: true,
    showClose: true,
    modal: true,
    lockScroll: true,
    flushBody: false,
    centered: false,
    blurBackdrop: true,
    trafficDecorDots: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [boolean]
  open: []
  opened: []
  close: []
  closed: []
}>()

const attrs = useAttrs()

const mergedClass = computed(() => {
  const raw = attrs.class
  const parts: string[] = ['glass-drawer']
  if (props.flushBody) {
    parts.push('glass-drawer--flush')
  }
  if (props.centered) {
    parts.push('glass-drawer--center')
  }
  if (props.drawerClass) {
    parts.push(...props.drawerClass.split(/\s+/).filter(Boolean))
  }
  if (typeof raw === 'string' && raw.trim()) {
    parts.push(...raw.trim().split(/\s+/).filter(Boolean))
  } else if (Array.isArray(raw)) {
    parts.push(...raw.filter((x): x is string => typeof x === 'string' && Boolean(x)))
  }
  return [...new Set(parts)].join(' ')
})

const mergedModalClass = computed(() => {
  const raw = (attrs['modal-class'] ?? attrs.modalClass) as unknown
  const parts: string[] = ['glass-drawer-overlay']
  if (!props.blurBackdrop) {
    parts.push('glass-drawer-overlay--no-blur')
  }
  if (typeof raw === 'string' && raw.trim()) {
    parts.push(...raw.trim().split(/\s+/).filter(Boolean))
  } else if (Array.isArray(raw)) {
    parts.push(...raw.filter((x): x is string => typeof x === 'string' && Boolean(x)))
  }
  return [...new Set(parts)].join(' ')
})

const passthroughAttrs = computed(() => {
  const { class: _c, modalClass: _mc, 'modal-class': _mck, ...rest } = attrs as Record<string, unknown>
  return rest
})

function onHeadClose() {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<template>
  <el-drawer
    v-bind="passthroughAttrs"
    :class="mergedClass"
    :model-value="modelValue"
    :title="title"
    :direction="direction"
    :size="size"
    :with-header="withHeader"
    :destroy-on-close="destroyOnClose"
    :append-to-body="appendToBody"
    :close-on-click-modal="closeOnClickModal"
    :show-close="false"
    :modal-class="mergedModalClass"
    :modal="modal"
    :lock-scroll="lockScroll"
    :z-index="zIndex"
    :before-close="beforeClose"
    @update:model-value="emit('update:modelValue', $event)"
    @open="emit('open')"
    @opened="emit('opened')"
    @close="emit('close')"
    @closed="emit('closed')"
  >
    <template v-if="withHeader" #header>
      <slot name="header">
        <div class="glass-drawer-head">
          <div class="glass-drawer-traffic">
            <button
              v-if="showClose"
              type="button"
              class="glass-drawer-traffic__dot glass-drawer-traffic__dot--close"
              :aria-label="t('common.close')"
              @click="onHeadClose"
            >
              <span class="glass-drawer-traffic__glyph" aria-hidden="true">×</span>
            </button>
            <template v-if="trafficDecorDots">
              <span class="glass-drawer-traffic__dot glass-drawer-traffic__dot--min" aria-hidden="true">
                <span class="glass-drawer-traffic__glyph">−</span>
              </span>
              <span class="glass-drawer-traffic__dot glass-drawer-traffic__dot--zoom" aria-hidden="true">
                <span class="glass-drawer-traffic__glyph">+</span>
              </span>
            </template>
          </div>
          <div class="glass-drawer-head__text">
            <span class="glass-drawer-head__title">{{ title }}</span>
          </div>
        </div>
      </slot>
    </template>
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </el-drawer>
</template>

<style lang="scss">
/*
 * 与 GlassFormDialog 同一套玻璃壳（gfd-shell / head / title / close / body / foot）。
 * 默认插槽直接落在 el-drawer__body 内，与 .gfd-body 同款 padding + 滚动。
 * `glass-drawer--center`：视口居中，覆盖 Element Plus 贴边 transform。
 * 非 scoped：抽屉常 append 到 body。
 */

.glass-drawer.el-drawer {
  --gd-radius: 22px;
  --gd-accent: var(--el-color-primary);
  position: relative;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--admin-border, var(--el-border-color)) 70%, var(--gd-accent) 30%);
  background: linear-gradient(
    165deg,
    color-mix(in srgb, var(--admin-surface, var(--el-bg-color)) 96%, var(--el-color-primary-light-9) 4%) 0%,
    var(--admin-surface, var(--el-bg-color)) 55%
  );
  box-shadow:
    0 28px 80px color-mix(in srgb, #000 32%, transparent),
    0 0 0 1px color-mix(in srgb, #fff 55%, transparent) inset;
}

/* 对应 gfd-glow：角部柔光 */
.glass-drawer.el-drawer::before {
  content: '';
  position: absolute;
  top: -40%;
  right: -20%;
  width: 55%;
  height: 70%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--gd-accent) 35%, transparent) 0%,
    transparent 68%
  );
  pointer-events: none;
  opacity: 0.65;
  z-index: 0;
  animation: glass-drawer-glow-drift 10s ease-in-out infinite alternate;
}

.glass-drawer.el-drawer .el-drawer__header {
  position: relative;
  z-index: 1;
  margin-bottom: 0;
  padding: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--admin-border, var(--el-border-color-lighter)) 78%, #000 8%);
  background: linear-gradient(180deg, #ecf6ef 0%, #e4f1e8 100%);
  overflow: hidden;
}

html.dark .glass-drawer.el-drawer .el-drawer__header {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--el-bg-color-overlay) 90%, #2f9d5c 10%) 0%,
    color-mix(in srgb, var(--el-bg-color) 93%, #2f9d5c 7%) 100%
  );
  border-bottom-color: var(--el-border-color-darker);
}

/* 与 GlassFormDialog 顶栏一致：自定义 #header 后不再使用 EP 默认标题/关闭钮 */
.glass-drawer-head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  width: 100%;
  box-sizing: border-box;
  padding: 12px 16px 10px 14px;
}

.glass-drawer-traffic {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 2px 0;
}

.glass-drawer-traffic__dot {
  box-sizing: border-box;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow:
    0 0 0 0.5px color-mix(in srgb, #000 14%, transparent) inset,
    0 1px 2px color-mix(in srgb, #000 20%, transparent);
}

.glass-drawer-traffic__glyph {
  display: block;
  font-family:
    system-ui,
    -apple-system,
    'SF Pro Text',
    'Helvetica Neue',
    sans-serif;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  color: rgba(62, 44, 28, 0.62);
  user-select: none;
  pointer-events: none;
  transform: translateY(-0.5px);
}

html.dark .glass-drawer-traffic__glyph {
  color: rgba(20, 18, 16, 0.58);
}

button.glass-drawer-traffic__dot {
  padding: 0;
  border: none;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}

button.glass-drawer-traffic__dot:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.glass-drawer-traffic__dot--close {
  background: #ff5f57;
}

.glass-drawer-traffic__dot--close:hover {
  filter: brightness(0.95);
}

.glass-drawer-traffic__dot--close:active {
  filter: brightness(0.88);
}

.glass-drawer-traffic__dot--min {
  background: #febc2e;
}

.glass-drawer-traffic__dot--zoom {
  background: #28c840;
}

.glass-drawer-head__text {
  flex: 1;
  min-width: 0;
  text-align: right;
}

.glass-drawer-head__title {
  display: block;
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.35;
  font-family: ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace;
  color: var(--el-text-color-regular);
}

/* 对应 GlassFormDialog .gfd-body：内容在 el-drawer__body 内滚动 */
.glass-drawer.el-drawer .el-drawer__body {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px 22px 10px;
  background: transparent;
  -webkit-overflow-scrolling: touch;
}

.glass-drawer.el-drawer.glass-drawer--flush .el-drawer__body {
  padding: 0;
}

/* 对应 gfd-foot */
.glass-drawer.el-drawer .el-drawer__footer {
  position: relative;
  z-index: 1;
  padding: 12px 18px 18px;
  border-top: 1px solid color-mix(in srgb, var(--admin-border, var(--el-border-color-lighter)) 90%, transparent);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--admin-surface-muted, var(--el-fill-color-lighter)) 22%, transparent) 0%,
    var(--admin-surface, var(--el-bg-color)) 100%
  );
}

/* 对齐 GlassFormDialog 的 gfd-backdrop：半透明渐变 + 模糊 */
.glass-drawer-overlay.el-overlay {
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--el-color-primary) 18%, rgba(15, 23, 42, 0.55)),
    rgba(15, 23, 42, 0.48)
  );
  transition:
    opacity 0.45s cubic-bezier(0.22, 0.82, 0.24, 1),
    background 0.45s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  will-change: opacity;
}

.el-drawer-fade-enter-active.glass-drawer-overlay.el-overlay {
  transition:
    opacity 0.52s cubic-bezier(0.22, 0.82, 0.24, 1),
    background 0.52s ease !important;
}

.el-drawer-fade-leave-active.glass-drawer-overlay.el-overlay {
  transition:
    opacity 0.38s cubic-bezier(0.4, 0, 0.75, 1),
    background 0.38s ease !important;
}

/* 贴边滑入/滑出：拉长 Element Plus 默认 0.3s，与 GlassFormDialog 面板节奏接近 */
.el-drawer-fade-enter-active .glass-drawer.el-drawer:not(.glass-drawer--center),
.el-drawer-fade-leave-active .glass-drawer.el-drawer:not(.glass-drawer--center) {
  transition-duration: 0.52s !important;
  transition-timing-function: cubic-bezier(0.22, 0.85, 0.24, 1) !important;
}

.el-drawer-fade-leave-active .glass-drawer.el-drawer:not(.glass-drawer--center) {
  transition-duration: 0.42s !important;
  transition-timing-function: cubic-bezier(0.42, 0, 0.72, 1) !important;
}

.glass-drawer-overlay.el-overlay.glass-drawer-overlay--no-blur {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.glass-drawer.el-drawer.rtl {
  border-radius: var(--gd-radius) 0 0 var(--gd-radius);
}

.glass-drawer.el-drawer.ltr {
  border-radius: 0 var(--gd-radius) var(--gd-radius) 0;
}

.glass-drawer.el-drawer.ttb {
  border-radius: 0 0 var(--gd-radius) var(--gd-radius);
}

.glass-drawer.el-drawer.btt {
  border-radius: var(--gd-radius) var(--gd-radius) 0 0;
}

/* —— 居中模式：类名 glass-drawer--center（与 ltr/rtl 同用） —— */
.glass-drawer.el-drawer.glass-drawer--center.ltr,
.glass-drawer.el-drawer.glass-drawer--center.rtl {
  top: 50%;
  bottom: auto;
  left: 50%;
  right: auto;
  height: auto;
  max-height: min(92vh, calc(100dvh - max(32px, env(safe-area-inset-top) + env(safe-area-inset-bottom))));
  min-height: 0;
  overflow: hidden;
  transform: translate3d(-50%, -50%, 0);
  transform-origin: center center;
  border-radius: var(--gd-radius);
}

.el-drawer-fade-enter-from .glass-drawer.el-drawer.glass-drawer--center.ltr,
.el-drawer-fade-enter-from .glass-drawer.el-drawer.glass-drawer--center.rtl,
.el-drawer-fade-leave-to .glass-drawer.el-drawer.glass-drawer--center.ltr,
.el-drawer-fade-leave-to .glass-drawer.el-drawer.glass-drawer--center.rtl {
  transform: translate3d(-50%, calc(-50% + 72px), 0) !important;
  opacity: 0;
}

.el-drawer-fade-enter-active .glass-drawer.el-drawer.glass-drawer--center.ltr,
.el-drawer-fade-enter-active .glass-drawer.el-drawer.glass-drawer--center.rtl {
  transition:
    opacity 0.52s cubic-bezier(0.22, 0.88, 0.22, 1),
    transform 0.52s cubic-bezier(0.22, 0.88, 0.22, 1) !important;
}

.el-drawer-fade-leave-active .glass-drawer.el-drawer.glass-drawer--center.ltr,
.el-drawer-fade-leave-active .glass-drawer.el-drawer.glass-drawer--center.rtl {
  transition:
    opacity 0.38s cubic-bezier(0.4, 0, 0.78, 1),
    transform 0.4s cubic-bezier(0.4, 0, 0.78, 1) !important;
}

.el-drawer-fade-enter-to .glass-drawer.el-drawer.glass-drawer--center.ltr,
.el-drawer-fade-enter-to .glass-drawer.el-drawer.glass-drawer--center.rtl,
.el-drawer-fade-leave-from .glass-drawer.el-drawer.glass-drawer--center.ltr,
.el-drawer-fade-leave-from .glass-drawer.el-drawer.glass-drawer--center.rtl {
  transform: translate3d(-50%, -50%, 0) !important;
  opacity: 1;
}

@keyframes glass-drawer-glow-drift {
  from {
    transform: translate(0, 0) scale(1);
    opacity: 0.5;
  }
  to {
    transform: translate(-12%, 6%) scale(1.08);
    opacity: 0.75;
  }
}

html.dark .glass-drawer.el-drawer {
  box-shadow:
    0 28px 80px rgba(0, 0, 0, 0.55),
    0 0 0 1px color-mix(in srgb, #fff 8%, transparent) inset;
}

html.dark .glass-drawer-overlay.el-overlay {
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--el-color-primary) 12%, rgba(0, 0, 0, 0.72)),
    rgba(0, 0, 0, 0.55)
  );
}

/* 关闭阶段禁用 blur，避免滤镜与淡出叠加造成闪屏 */
.el-drawer-fade-leave-active .glass-drawer-overlay.el-overlay,
.el-drawer-fade-leave-to .glass-drawer-overlay.el-overlay {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

@media (prefers-reduced-motion: reduce) {
  .glass-drawer.el-drawer::before {
    animation: none;
  }

  .el-drawer-fade-enter-active .glass-drawer.el-drawer.glass-drawer--center.ltr,
  .el-drawer-fade-enter-active .glass-drawer.el-drawer.glass-drawer--center.rtl,
  .el-drawer-fade-leave-active .glass-drawer.el-drawer.glass-drawer--center.ltr,
  .el-drawer-fade-leave-active .glass-drawer.el-drawer.glass-drawer--center.rtl {
    transition-duration: 0.01ms !important;
  }

  .el-drawer-fade-enter-from .glass-drawer.el-drawer.glass-drawer--center.ltr,
  .el-drawer-fade-enter-from .glass-drawer.el-drawer.glass-drawer--center.rtl,
  .el-drawer-fade-leave-to .glass-drawer.el-drawer.glass-drawer--center.ltr,
  .el-drawer-fade-leave-to .glass-drawer.el-drawer.glass-drawer--center.rtl {
    transform: translate3d(-50%, -50%, 0) scale(1) !important;
  }
}

/* 后台风格降噪：与 GlassFormDialog 壳体一致 */
.glass-drawer.el-drawer {
  --gd-radius: 14px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
}

.glass-drawer.el-drawer::before {
  display: none;
}

.glass-drawer.el-drawer .el-drawer__header {
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: linear-gradient(180deg, #ecf6ef 0%, #e6f2ea 100%);
}

html.dark .glass-drawer.el-drawer .el-drawer__header {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--el-bg-color-overlay) 92%, #34c759 8%) 0%,
    color-mix(in srgb, var(--el-bg-color) 95%, #34c759 5%) 100%
  );
}

.glass-drawer-head {
  padding: 10px 14px 8px 12px;
}

.glass-drawer.el-drawer .el-drawer__body {
  padding: 14px 16px 8px;
}

.glass-drawer.el-drawer .el-drawer__footer {
  padding: 10px 16px 14px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: transparent;
}
</style>
