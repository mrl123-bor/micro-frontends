<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from '@/utils/toast'
import {
  Upload,
  ZoomIn,
  ZoomOut,
  RefreshLeft,
  RefreshRight,
} from '@element-plus/icons-vue'
import {
  Cropper,
  CircleStencil,
  Preview,
  type CropperResult,
} from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import * as userApi from '@/api/user'
import GlassFormDialog from '@/components/GlassFormDialog.vue'

const OUT_SIZE = 200

const props = defineProps<{
  modelValue: boolean
  /** 外部拖入/粘贴后传入，打开弹窗时自动载入（用完会清空） */
  initialFile?: File | null
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  'update:initialFile': [File | null]
  /** 上传成功后的头像相对路径，供顶栏等全局同步 */
  saved: [avatar?: string]
}>()

const { t } = useI18n()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const fileInputRef = ref<HTMLInputElement | null>(null)
const acBodyRef = ref<HTMLElement | null>(null)
const objectUrl = ref<string | null>(null)
const submitting = ref(false)
const dragOverStage = ref(false)
const cropHint = ref(`${OUT_SIZE} × ${OUT_SIZE}`)

/** vue-advanced-cropper 实例（getResult / zoom / rotate） */
const vacRef = ref<InstanceType<typeof Cropper> | null>(null)
const vacPreviewRef = ref<InstanceType<typeof Preview> | null>(null)
const vacReady = ref(false)

const previewImage = ref<CropperResult['image'] | null>(null)
const previewCoords = ref<CropperResult['coordinates'] | null>(null)

function resetState() {
  vacReady.value = false
  previewImage.value = null
  previewCoords.value = null
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value)
    objectUrl.value = null
  }
  if (fileInputRef.value) fileInputRef.value.value = ''
  cropHint.value = `${OUT_SIZE} × ${OUT_SIZE}`
}

onBeforeUnmount(resetState)

const ACCEPT =
  /^image\/(jpeg|png|webp|gif)$/i

function loadImageFile(file: File | undefined | null) {
  if (!file || !ACCEPT.test(file.type)) {
    toast.warning(t('pages.profile.avatarPickImage'))
    return
  }
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
  objectUrl.value = URL.createObjectURL(file)
}

function onPickClick() {
  fileInputRef.value?.click()
}

function onFileChange(ev: Event) {
  const input = ev.target as HTMLInputElement
  loadImageFile(input.files?.[0] ?? null)
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function onStageDrop(e: DragEvent) {
  e.preventDefault()
  dragOverStage.value = false
  const f = e.dataTransfer?.files?.[0]
  loadImageFile(f ?? null)
}

function onStageDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
}

function onStageDragLeave(e: DragEvent) {
  const cur = e.currentTarget as HTMLElement
  const rel = e.relatedTarget as Node | null
  if (rel && cur.contains(rel)) return
  dragOverStage.value = false
}

function onPaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items?.length) return
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    if (it.kind === 'file' && it.type.startsWith('image/')) {
      const f = it.getAsFile()
      if (f) {
        e.preventDefault()
        loadImageFile(f)
        return
      }
    }
  }
}

watch(
  () => [props.modelValue, props.initialFile] as const,
  ([open, file]) => {
    if (open && file) {
      loadImageFile(file)
      emit('update:initialFile', null)
    }
  },
)

watch(
  () => props.modelValue,
  (open) => {
    if (open) nextTick(() => onDialogOpened())
    else resetState()
  },
)

function onVacReady() {
  vacReady.value = true
  nextTick(() => {
    vacPreviewRef.value?.refresh?.()
  })
}

function onVacChange(result: CropperResult) {
  previewImage.value = result.image
  previewCoords.value = result.coordinates
  const w = Math.round(result.coordinates.width)
  const h = Math.round(result.coordinates.height)
  cropHint.value = `${w} × ${h}`
}

watch(objectUrl, () => {
  vacReady.value = false
  previewImage.value = null
  previewCoords.value = null
})

function onDialogOpened() {
  nextTick(() => {
    acBodyRef.value?.focus({ preventScroll: true })
    vacRef.value?.refresh?.()
    vacPreviewRef.value?.refresh?.()
  })
}

function zoom(factor: number) {
  const z = factor > 0 ? 1.12 : 1 / 1.12
  vacRef.value?.zoom(z)
}

function rotate(deg: number) {
  vacRef.value?.rotate(deg)
}

function close() {
  emit('update:modelValue', false)
}

async function submit() {
  const inst = vacRef.value
  if (!inst || !objectUrl.value) {
    toast.warning(t('pages.profile.avatarPickImage'))
    return
  }
  const result = inst.getResult()
  let canvas = result.canvas
  if (!canvas) {
    toast.error(t('common.opFail'))
    return
  }
  const out = document.createElement('canvas')
  out.width = OUT_SIZE
  out.height = OUT_SIZE
  const ctx = out.getContext('2d')
  if (!ctx) return
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(canvas, 0, 0, OUT_SIZE, OUT_SIZE)

  submitting.value = true
  try {
    const blob: Blob | null = await new Promise((resolve) =>
      out.toBlob((b) => resolve(b), 'image/jpeg', 0.92),
    )
    if (!blob) throw new Error('blob')
    const data = await userApi.uploadMyAvatar(blob)
    toast.success(t('common.saveOk'))
    emit('saved', data?.avatar)
    emit('update:modelValue', false)
  } catch {
    toast.error(t('common.opFail'))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <GlassFormDialog
    v-model="visible"
    :title="t('pages.profile.avatarDialogTitle')"
    width="min(92vw, 760px)"
    :close-on-backdrop="false"
    :show-default-footer="false"
  >
    <div
      ref="acBodyRef"
      class="ac-body"
      tabindex="0"
      @paste="onPaste"
    >
      <div class="ac-main">
        <div
          class="ac-stage"
          :class="{ 'is-drag-over': dragOverStage }"
          @drop="onStageDrop"
          @dragover="onStageDragOver"
          @dragenter.prevent="dragOverStage = true"
          @dragleave="onStageDragLeave"
        >
          <template v-if="!objectUrl">
            <div class="ac-checker" aria-hidden="true" />
            <div class="ac-placeholder">
              <el-icon class="ac-placeholder__ico"><Upload /></el-icon>
              <p class="ac-placeholder__text">{{ t('pages.profile.avatarDropHint') }}</p>
              <el-button type="primary" round @click="onPickClick">
                {{ t('pages.profile.avatarSelect') }}
              </el-button>
            </div>
          </template>
          <template v-else>
            <div class="ac-cropHost">
              <Cropper
                :key="objectUrl"
                ref="vacRef"
                class="vac-cropper"
                :src="objectUrl"
                :stencil-component="CircleStencil"
                :stencil-props="{ aspectRatio: 1 }"
                :debounce="0"
                image-restriction="fit-area"
                default-boundaries="fill"
                @ready="onVacReady"
                @change="onVacChange"
              />
            </div>
            <div class="ac-sizeTag">{{ cropHint }}</div>
          </template>
        </div>

        <div v-show="objectUrl" class="ac-toolbar">
          <el-button class="ac-toolbtn" @click="onPickClick">
            <el-icon><Upload /></el-icon>
            {{ t('pages.profile.avatarSelect') }}
          </el-button>
          <el-button class="ac-toolbtn" :disabled="!vacReady" @click="zoom(0.1)">
            <el-icon><ZoomIn /></el-icon>
          </el-button>
          <el-button class="ac-toolbtn" :disabled="!vacReady" @click="zoom(-0.1)">
            <el-icon><ZoomOut /></el-icon>
          </el-button>
          <el-button class="ac-toolbtn" :disabled="!vacReady" @click="rotate(-90)">
            <el-icon><RefreshLeft /></el-icon>
          </el-button>
          <el-button class="ac-toolbtn" :disabled="!vacReady" @click="rotate(90)">
            <el-icon><RefreshRight /></el-icon>
          </el-button>
        </div>
      </div>

      <aside class="ac-side">
        <div class="ac-side__label">{{ t('pages.profile.avatarPreview') }}</div>
        <div class="ac-previewRing">
          <Preview
            v-if="previewImage && previewCoords"
            ref="vacPreviewRef"
            class="vac-preview"
            :image="previewImage"
            :coordinates="previewCoords"
            :width="192"
            :height="192"
          />
          <div v-else class="ac-preview ac-preview--empty" />
        </div>
        <p class="ac-side__tip">{{ t('pages.profile.avatarPreviewTip') }}</p>
      </aside>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      class="ac-file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      tabindex="-1"
      @change="onFileChange"
    />

    <template #footer>
      <div class="ac-footer">
        <el-button round @click="close">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" round :loading="submitting" class="ac-submit" @click="submit">
          {{ t('pages.profile.avatarSubmit') }}
        </el-button>
      </div>
    </template>
  </GlassFormDialog>
</template>

<style scoped lang="scss">
.ac-body {
  display: flex;
  gap: 20px;
  align-items: stretch;
  flex-wrap: wrap;
  outline: none;
  border-radius: 12px;
}

.ac-body:focus-visible {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 45%, transparent);
}

.ac-main {
  position: relative;
  flex: 1 1 320px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ac-stage {
  position: relative;
  min-height: 420px;
  border-radius: 16px;
  border: 2px dashed color-mix(in srgb, var(--el-color-primary) 35%, transparent);
  background: #e8e8e8;
  overflow: hidden;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.ac-stage.is-drag-over {
  border-color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 10%, #e8e8e8);
  box-shadow: inset 0 0 0 1px var(--el-color-primary-light-5);
}

.ac-cropHost {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 420px;
  min-height: 420px;
  min-width: 0;
  box-sizing: border-box;
  border-radius: 12px;
  overflow: hidden;
  background-color: #f1f1f1;
  background-image: linear-gradient(45deg, #ddd 25%, transparent 25%),
    linear-gradient(-45deg, #ddd 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ddd 75%),
    linear-gradient(-45deg, transparent 75%, #ddd 75%);
  background-size: 16px 16px;
  background-position:
    0 0,
    0 8px,
    8px -8px,
    -8px 0;
}

@media (max-width: 540px) {
  .ac-cropHost {
    height: min(420px, 56vh);
    min-height: min(420px, 56vh);
  }
}

/** vue-advanced-cropper 根节点必须显式高度，否则会纵向塌成一条 */
.vac-cropper {
  width: 100%;
  height: 100%;
  min-height: 360px;
}

.vac-cropper :deep(.vue-advanced-cropper__foreground) {
  border-radius: 12px;
}

.vac-preview {
  display: block;
  width: 192px;
  height: 192px;
  border-radius: 50%;
  overflow: hidden;
}

.ac-preview--empty {
  width: 192px;
  height: 192px;
  margin: 0 auto;
  border-radius: 50%;
  background: #f3f4f6;
}

.ac-checker {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-color: #f1f1f1;
  background-image: linear-gradient(45deg, #ddd 25%, transparent 25%),
    linear-gradient(-45deg, #ddd 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ddd 75%),
    linear-gradient(-45deg, transparent 75%, #ddd 75%);
  background-size: 16px 16px;
  background-position:
    0 0,
    0 8px,
    8px -8px,
    -8px 0;
  opacity: 0.85;
}

.ac-placeholder {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  box-sizing: border-box;
}

.ac-placeholder__text {
  margin: 0;
  max-width: 280px;
  line-height: 1.5;
}

.ac-placeholder__ico {
  font-size: 40px;
  opacity: 0.55;
  color: var(--el-color-primary);
}

.ac-sizeTag {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 4;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #fff;
  background: rgba(0, 0, 0, 0.65);
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.ac-toolbar {
  position: relative;
  z-index: 3;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 4px 2px 0;
  flex-shrink: 0;
}

.ac-toolbtn {
  border-radius: 12px !important;
  font-weight: 600;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.ac-toolbtn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(64, 158, 255, 0.2);
}

.ac-file {
  position: fixed;
  left: -9999px;
  top: 0;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
}

.ac-side {
  flex: 0 0 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.ac-side__label {
  font-size: 13px;
  font-weight: 800;
  color: var(--el-text-color-primary);
}

.ac-previewRing {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  padding: 4px;
  background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899);
  box-shadow:
    0 12px 28px rgba(99, 102, 241, 0.35),
    inset 0 0 0 1px rgba(255, 255, 255, 0.35);
  animation: ac-ring 4s ease-in-out infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

@keyframes ac-ring {
  0%,
  100% {
    filter: hue-rotate(0deg);
  }
  50% {
    filter: hue-rotate(18deg);
  }
}

.ac-side__tip {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: center;
  line-height: 1.5;
}

.ac-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.ac-submit {
  min-width: 108px;
  font-weight: 700;
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.35);
}

@media (max-width: 640px) {
  .ac-side {
    flex: 1 1 100%;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
}

:deep(.gfd-body) {
  padding-top: 10px;
  padding-bottom: 8px;
  overflow: visible;
}
</style>
