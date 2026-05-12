<script setup lang="ts">
import { computed, onUnmounted, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Loading } from '@element-plus/icons-vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    /** 标题文案（展示层）；也可用 #title 插槽完全自定义 */
    title?: string
    /** 标题下一句副标题 / 提示 */
    subtitle?: string
    /** 面板最大宽度，如 min(92vw, 640px) */
    width?: string
    /** 是否根据内容自适应宽度（仍受 width 与可视区域约束） */
    fitToContent?: boolean
    /** 与浏览器可视区域边缘最小间距（px） */
    viewportMargin?: number
    /** 确定按钮 loading（由父组件在提交逻辑中控制） */
    loading?: boolean
    /** 点击遮罩是否关闭 */
    closeOnBackdrop?: boolean
    cancelText?: string
    confirmText?: string
    /** 是否显示内置底部按钮；false 时用 #footer 完全自定义 */
    showDefaultFooter?: boolean
    /**
     * 对话框内 Element Plus 弹层（Select、DatePicker、Popover 等）的基准 z-index，
     * 须高于 .gfd-root（3100），否则 teleported 到 body 的下拉会落在遮罩后面不可见。
     */
    popperZIndex?: number
    /** 根容器层级（用于与全局 toast / Notification 的层级协调） */
    rootZIndex?: number
    /** 为 true 时显示黄、绿装饰点（最小化/缩放样式，无操作）；默认可只保留红关闭 */
    trafficDecorDots?: boolean
  }>(),
  {
    title: '',
    subtitle: '',
    width: 'min(92vw, 640px)',
    fitToContent: false,
    viewportMargin: 32,
    loading: false,
    closeOnBackdrop: true,
    showDefaultFooter: true,
    popperZIndex: 2100,
    rootZIndex: 2000,
    trafficDecorDots: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [boolean]
  confirm: []
  cancel: []
  close: []
}>()

const { t } = useI18n()
const titleId = useId()

const cancelLabel = computed(() => props.cancelText ?? t('common.cancel'))
const confirmLabel = computed(() => props.confirmText ?? t('common.confirm'))
const shellStyle = computed(() => {
  const gapPx = Math.max(0, Number(props.viewportMargin || 0))
  const viewportMaxWidth = `calc(100vw - ${gapPx}px)`
  const viewportMaxHeight = `calc(100vh - ${gapPx}px)`
  return {
    width: props.fitToContent ? 'auto' : '100%',
    maxWidth: `min(${props.width}, ${viewportMaxWidth})`,
    maxHeight: viewportMaxHeight,
  }
})

function requestClose() {
  emit('update:modelValue', false)
  emit('close')
}

function onBackdropClick() {
  if (props.closeOnBackdrop) {
    requestClose()
    emit('cancel')
  }
}

function onCancel() {
  requestClose()
  emit('cancel')
}

function onConfirm() {
  emit('confirm')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) {
    e.stopPropagation()
    onCancel()
  }
}

watch(
  () => props.modelValue,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) {
      window.addEventListener('keydown', onKeydown)
    } else {
      window.removeEventListener('keydown', onKeydown)
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})

function motionReduced() {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function gfdLayers(root: Element) {
  const r = root as HTMLElement
  return {
    backdrop: r.querySelector('.gfd-backdrop') as HTMLElement | null,
    shell: r.querySelector('.gfd-shell') as HTMLElement | null,
  }
}

function clearLayerMotion(backdrop: HTMLElement | null, shell: HTMLElement | null) {
  for (const node of [backdrop, shell]) {
    if (!node) continue
    node.style.opacity = ''
    node.style.transform = ''
    node.style.willChange = ''
  }
}

function onBeforeEnter(el: Element) {
  if (motionReduced()) return
  const { backdrop, shell } = gfdLayers(el)
  if (!backdrop || !shell) return
  backdrop.style.opacity = '0'
  backdrop.style.willChange = 'opacity'
  shell.style.opacity = '0'
  shell.style.transform = 'translate3d(0, 72px, 0)'
  shell.style.willChange = 'opacity, transform'
}

function onAfterEnter(el: Element) {
  const { backdrop, shell } = gfdLayers(el)
  if (backdrop) backdrop.style.willChange = ''
  if (shell) shell.style.willChange = ''
}

function onEnter(el: Element, done: () => void) {
  const { backdrop, shell } = gfdLayers(el)
  if (!backdrop || !shell) {
    done()
    return
  }
  if (motionReduced()) {
    clearLayerMotion(backdrop, shell)
    done()
    return
  }

  const easeIn = 'cubic-bezier(0.22, 0.88, 0.22, 1)'
  const dur = 520

  const backdropAnim = backdrop.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: dur,
    easing: easeIn,
  })
  const shellAnim = shell.animate(
    [
      { opacity: 0, transform: 'translate3d(0, 72px, 0)' },
      { opacity: 1, transform: 'translate3d(0, 0, 0)' },
    ],
    { duration: dur, easing: easeIn },
  )

  const finish = () => {
    backdropAnim.cancel()
    shellAnim.cancel()
    clearLayerMotion(backdrop, shell)
    done()
  }

  Promise.all([backdropAnim.finished, shellAnim.finished]).then(finish, finish)
}

function onBeforeLeave(el: Element) {
  if (motionReduced()) return
  const { backdrop, shell } = gfdLayers(el)
  if (backdrop) backdrop.style.willChange = 'opacity'
  if (shell) shell.style.willChange = 'opacity, transform'
}

function onLeave(el: Element, done: () => void) {
  const { backdrop, shell } = gfdLayers(el)
  if (!backdrop || !shell) {
    done()
    return
  }
  if (motionReduced()) {
    clearLayerMotion(backdrop, shell)
    done()
    return
  }

  const easeOut = 'cubic-bezier(0.4, 0, 0.78, 1)'
  const dur = 380

  const backdropAnim = backdrop.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: dur,
    easing: easeOut,
  })
  const shellAnim = shell.animate(
    [
      { opacity: 1, transform: 'translate3d(0, 0, 0)' },
      { opacity: 0, transform: 'translate3d(0, 56px, 0)' },
    ],
    { duration: dur, easing: easeOut },
  )

  const finish = () => {
    backdropAnim.cancel()
    shellAnim.cancel()
    clearLayerMotion(backdrop, shell)
    done()
  }

  Promise.all([backdropAnim.finished, shellAnim.finished]).then(finish, finish)
}
</script>

<template>
  <Teleport to="body">
    <Transition
      name="gfd-fade"
      appear
      :css="false"
      @before-enter="onBeforeEnter"
      @after-enter="onAfterEnter"
      @enter="onEnter"
      @before-leave="onBeforeLeave"
      @leave="onLeave"
    >
      <div
        v-if="modelValue"
        class="gfd-root"
        :style="{ zIndex: String(rootZIndex) }"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <div class="gfd-backdrop" aria-hidden="true" @click="onBackdropClick" />
        <div class="gfd-shell" :style="shellStyle" @click.stop>
          <div class="gfd-glow" aria-hidden="true" />
          <el-config-provider :z-index="popperZIndex">
            <header class="gfd-head">
              <div class="gfd-traffic">
                <button
                  type="button"
                  class="gfd-traffic__dot gfd-traffic__dot--close"
                  :aria-label="t('common.close')"
                  @click="onCancel"
                >
                  <span class="gfd-traffic__glyph" aria-hidden="true">×</span>
                </button>
                <template v-if="trafficDecorDots">
                  <span class="gfd-traffic__dot gfd-traffic__dot--min" aria-hidden="true">
                    <span class="gfd-traffic__glyph">−</span>
                  </span>
                  <span class="gfd-traffic__dot gfd-traffic__dot--zoom" aria-hidden="true">
                    <span class="gfd-traffic__glyph">+</span>
                  </span>
                </template>
              </div>
              <div class="gfd-head-text">
                <p :id="titleId" class="gfd-title">
                  <slot name="title">{{ title }}</slot>
                </p>
                <p v-if="subtitle || $slots.subtitle" class="gfd-sub">
                  <slot name="subtitle">{{ subtitle }}</slot>
                </p>
              </div>
            </header>

            <div class="gfd-body">
              <slot />
            </div>

            <footer v-if="showDefaultFooter || $slots.footer" class="gfd-foot">
              <slot name="footer">
                <div class="gfd-foot-inner">
                  <button type="button" class="gfd-btn gfd-btn--ghost" @click="onCancel">
                    {{ cancelLabel }}
                  </button>
                  <button
                    type="button"
                    class="gfd-btn gfd-btn--primary"
                    :disabled="loading"
                    @click="onConfirm"
                  >
                    <span class="gfd-btn__shine" aria-hidden="true" />
                    <span class="gfd-btn__label">
                      <el-icon v-if="loading" class="gfd-btn__spin"><Loading /></el-icon>
                      {{ confirmLabel }}
                    </span>
                  </button>
                </div>
              </slot>
            </footer>
          </el-config-provider>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.gfd-root {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right))
    max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  pointer-events: none;
}

.gfd-backdrop {
  position: absolute;
  inset: 0;
  pointer-events: auto;
  cursor: pointer;
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--el-color-primary) 18%, rgba(15, 23, 42, 0.55)),
    rgba(15, 23, 42, 0.48)
  );
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

html.dark .gfd-backdrop {
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--el-color-primary) 12%, rgba(0, 0, 0, 0.72)),
    rgba(0, 0, 0, 0.55)
  );
}

.gfd-shell {
  position: relative;
  z-index: 1;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform-origin: center center;
  border-radius: 22px;
  border: 1px solid color-mix(in srgb, var(--admin-border) 70%, var(--el-color-primary) 30%);
  background: linear-gradient(
    165deg,
    color-mix(in srgb, var(--admin-surface) 96%, var(--el-color-primary-light-9) 4%) 0%,
    var(--admin-surface) 55%
  );
  box-shadow:
    0 28px 80px color-mix(in srgb, #000 32%, transparent),
    0 0 0 1px color-mix(in srgb, #fff 55%, transparent) inset;
}

html.dark .gfd-shell {
  box-shadow:
    0 28px 80px rgba(0, 0, 0, 0.55),
    0 0 0 1px color-mix(in srgb, #fff 8%, transparent) inset;
}

.gfd-glow {
  position: absolute;
  top: -40%;
  right: -20%;
  width: 55%;
  height: 70%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--el-color-primary) 35%, transparent) 0%,
    transparent 68%
  );
  pointer-events: none;
  opacity: 0.65;
  animation: gfd-glow-drift 10s ease-in-out infinite alternate;
}

@keyframes gfd-glow-drift {
  from {
    transform: translate(0, 0) scale(1);
    opacity: 0.5;
  }
  to {
    transform: translate(-12%, 6%) scale(1.08);
    opacity: 0.75;
  }
}

.gfd-head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 16px 10px 14px;
  border-bottom: 1px solid color-mix(in srgb, var(--admin-border) 78%, #000 8%);
  background: linear-gradient(180deg, #ecf6ef 0%, #e4f1e8 100%);
}

html.dark .gfd-head {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--el-bg-color-overlay) 90%, #2f9d5c 10%) 0%,
    color-mix(in srgb, var(--el-bg-color) 93%, #2f9d5c 7%) 100%
  );
  border-bottom-color: var(--el-border-color-darker);
}

.gfd-traffic {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 2px 0;
}

.gfd-traffic__dot {
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

.gfd-traffic__glyph {
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

html.dark .gfd-traffic__glyph {
  color: rgba(20, 18, 16, 0.58);
}

button.gfd-traffic__dot {
  padding: 0;
  border: none;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}

button.gfd-traffic__dot:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.gfd-traffic__dot--close {
  background: #ff5f57;
}

.gfd-traffic__dot--close:hover {
  filter: brightness(0.95);
}

.gfd-traffic__dot--close:active {
  filter: brightness(0.88);
}

.gfd-traffic__dot--min {
  background: #febc2e;
}

.gfd-traffic__dot--zoom {
  background: #28c840;
}

.gfd-head-text {
  flex: 1;
  min-width: 0;
  text-align: right;
}

.gfd-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.25;
  color: var(--admin-text);
  background: linear-gradient(
    110deg,
    var(--admin-text) 0%,
    color-mix(in srgb, var(--admin-text) 55%, var(--el-color-primary)) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.gfd-head .gfd-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.35;
  font-family: ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace;
  color: var(--admin-text-secondary);
  background: none;
  -webkit-background-clip: border-box;
  background-clip: border-box;
  text-align: right;
}

.gfd-sub {
  margin: 6px 0 0;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.45;
  color: var(--admin-text-secondary);
}

.gfd-head .gfd-sub {
  margin-top: 3px;
  font-size: 11px;
  font-weight: 500;
  text-align: right;
  opacity: 0.92;
}

.gfd-body {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px 22px 10px;
  -webkit-overflow-scrolling: touch;
}

.gfd-foot {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  padding: 12px 18px 18px;
  border-top: 1px solid color-mix(in srgb, var(--admin-border) 90%, transparent);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--admin-surface-muted) 22%, transparent) 0%,
    var(--admin-surface) 100%
  );
}

.gfd-foot-inner {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
}

.gfd-btn {
  position: relative;
  overflow: hidden;
  min-width: 96px;
  padding: 10px 20px;
  border-radius: 12px;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.22s ease,
    filter 0.22s ease,
    opacity 0.2s ease;
}

.gfd-btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.gfd-btn--ghost {
  border: 1px solid var(--admin-border);
  color: var(--admin-text-secondary);
  background: color-mix(in srgb, var(--admin-surface) 88%, transparent);
}

.gfd-btn--ghost:hover:not(:disabled) {
  color: var(--admin-text);
  border-color: color-mix(in srgb, var(--el-color-primary) 35%, var(--admin-border));
  transform: translateY(-1px);
}

.gfd-btn--primary {
  border: none;
  color: #fff;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-color-primary) 88%, #000),
    var(--el-color-primary)
  );
  box-shadow: 0 6px 20px color-mix(in srgb, var(--el-color-primary) 38%, transparent);
}

.gfd-btn--primary:hover:not(:disabled) {
  filter: brightness(1.06);
  transform: translateY(-2px);
  box-shadow: 0 10px 28px color-mix(in srgb, var(--el-color-primary) 45%, transparent);
}

.gfd-btn--primary:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.gfd-btn__shine {
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    105deg,
    transparent 0%,
    color-mix(in srgb, #fff 28%, transparent) 48%,
    transparent 96%
  );
  animation: gfd-shine 4.5s ease-in-out infinite;
  pointer-events: none;
}

.gfd-btn__label {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.gfd-btn__spin {
  animation: gfd-spin 0.9s linear infinite;
}

@keyframes gfd-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes gfd-shine {
  0%,
  60% {
    transform: translateX(-100%);
  }
  85% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .gfd-glow,
  .gfd-btn__shine {
    animation: none;
  }

  .gfd-btn--ghost:hover:not(:disabled),
  .gfd-btn--primary:hover:not(:disabled),
  .gfd-btn--primary:active:not(:disabled) {
    transform: none;
  }

  .gfd-btn__spin {
    animation: none;
  }
}

/* 后台风格降噪：保留结构，弱化炫光与动效 */
.gfd-shell {
  animation: none;
  border-radius: 14px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
}

.gfd-glow {
  display: none;
}

.gfd-head {
  padding: 10px 14px 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: linear-gradient(180deg, #ecf6ef 0%, #e6f2ea 100%);
}

html.dark .gfd-head {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--el-bg-color-overlay) 92%, #34c759 8%) 0%,
    color-mix(in srgb, var(--el-bg-color) 95%, #34c759 5%) 100%
  );
}

.gfd-title {
  font-size: 16px;
  font-weight: 700;
  background: none;
  color: var(--el-text-color-primary);
  -webkit-background-clip: border-box;
  background-clip: border-box;
}

.gfd-head .gfd-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.gfd-sub {
  margin-top: 4px;
  font-weight: 500;
}

.gfd-head .gfd-sub {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.gfd-body {
  padding: 14px 16px 8px;
}

.gfd-foot {
  padding: 10px 16px 14px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: transparent;
}

.gfd-btn {
  min-width: 84px;
  border-radius: 8px;
  padding: 8px 14px;
}

.gfd-btn--ghost {
  background: var(--el-fill-color-blank);
}

.gfd-btn--primary {
  background: var(--el-color-primary);
  box-shadow: none;
}

.gfd-btn__shine {
  display: none;
}
</style>
