<script setup lang="ts">
/**
 * 多图 picture-card、v-model 为逗号分隔路径字符串（或 string[]）。
 * 支持点击选择、拖拽、聚焦后粘贴截图（Clipboard 图片）。
 * <ImageUpload v-model="form.imageUrls" :limit="5" :file-size="5" />
 * <!-- 若后端路径不是 /common/upload -->
 * <ImageUpload v-model="form.imageUrls" action="/your/upload/path" field-name="file" />
 */
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { genFileId } from 'element-plus'
import { toast } from '@/utils/toast'
import { Plus } from '@element-plus/icons-vue'
import type {
  UploadFile,
  UploadInstance,
  UploadRawFile,
  UploadRequestOptions,
} from 'element-plus'
import { uploadCommonFile, type CommonUploadResult } from '@/api/upload'
import { resolvePublicFileUrl } from '@/utils/publicUrl'
import GlassFormDialog from '@/components/GlassFormDialog.vue'

const props = withDefaults(
  defineProps<{
    /** 逗号分隔相对路径，或路径数组（与 nest-admin 一致） */
    modelValue?: string | string[]
    limit?: number
    /** 单文件上限 MB */
    fileSize?: number
    /** 允许的扩展名（小写），如 png、jpg、jpeg */
    fileType?: string[]
    /** 上传接口路径，默认若依 /common/upload */
    action?: string
    /** multipart 字段名 */
    fieldName?: string
    disabled?: boolean
    isShowTip?: boolean
    /** 是否显示「可粘贴」提示文案 */
    showPasteHint?: boolean
  }>(),
  {
    limit: 5,
    fileSize: 5,
    fileType: () => ['png', 'jpg', 'jpeg', 'webp', 'gif'],
    action: '/common/upload',
    fieldName: 'file',
    disabled: false,
    isShowTip: true,
    showPasteHint: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useI18n()
const uploadRef = ref<UploadInstance>()
const fileList = ref<UploadFile[]>([])
const previewVisible = ref(false)
const previewUrl = ref('')
const dragActive = ref(false)

const hideAddBtn = computed(() => fileList.value.length >= props.limit)

const acceptAttr = computed(() =>
  props.fileType.map((x) => `.${x.replace(/^\./, '')}`).join(','),
)

const showTip = computed(
  () => props.isShowTip && (props.fileType.length > 0 || props.fileSize > 0),
)

const tipLine1 = computed(() =>
  props.fileSize > 0
    ? t('imageUpload.tipSize', { size: props.fileSize })
    : '',
)

const tipLine2 = computed(() =>
  props.fileType.length
    ? t('imageUpload.tipType', { types: props.fileType.join('/') })
    : '',
)

function normalizeModel(val: string | string[] | undefined): string {
  if (val == null || val === '') return ''
  if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean).join(',')
  return String(val)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(',')
}

function pathFromUploadFile(f: UploadFile): string {
  const r = f.response as CommonUploadResult | undefined
  const p = (r?.fileName || r?.url || f.name || '').trim()
  return p.startsWith('blob:') ? '' : p
}

function pathsFromFileList(list: UploadFile[]): string {
  return list
    .filter((f) => f.status === 'success')
    .map(pathFromUploadFile)
    .filter(Boolean)
    .join(',')
}

function parseToFileList(val: string | string[] | undefined): UploadFile[] {
  const s = normalizeModel(val)
  if (!s) return []
  return s.split(',').map((path) => ({
    uid: genFileId(),
    name: path,
    url: resolvePublicFileUrl(path),
    status: 'success' as const,
  }))
}

function emitModel() {
  emit('update:modelValue', pathsFromFileList(fileList.value))
}

watch(
  () => props.modelValue,
  (val) => {
    if (fileList.value.some((f) => f.status === 'uploading')) return
    const incoming = normalizeModel(val)
    const current = pathsFromFileList(fileList.value)
    if (incoming === current) return
    fileList.value = parseToFileList(val)
  },
  { immediate: true },
)

function validateType(file: File): boolean {
  if (!props.fileType.length) return file.type.startsWith('image/')
  const ext = file.name.includes('.')
    ? file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase()
    : ''
  for (const t of props.fileType) {
    const tl = t.toLowerCase().replace(/^\./, '')
    if (ext === tl || (tl === 'jpg' && ext === 'jpeg')) return true
    const mime =
      tl === 'jpg' || tl === 'jpeg'
        ? 'image/jpeg'
        : tl === 'svg'
          ? 'image/svg+xml'
          : `image/${tl}`
    if (file.type && file.type === mime) return true
  }
  return false
}

function validateSize(file: File): boolean {
  if (!props.fileSize) return true
  return file.size / 1024 / 1024 < props.fileSize
}

function beforeUpload(rawFile: UploadRawFile) {
  if (!validateType(rawFile)) {
    toast.error(
      t('imageUpload.formatError', { types: props.fileType.join('/') }),
    )
    return false
  }
  if (!validateSize(rawFile)) {
    toast.error(t('imageUpload.sizeError', { size: props.fileSize }))
    return false
  }
  return true
}

function handleExceed() {
  toast.warning(t('imageUpload.exceed', { limit: props.limit }))
}

async function httpRequest(options: UploadRequestOptions) {
  const { file, onSuccess, onError } = options
  try {
    const data = await uploadCommonFile(
      file as File,
      props.action,
      props.fieldName,
    )
    onSuccess(data as any)
  } catch (e) {
    /* EP 类型要求 UploadAjaxError，自定义 httpRequest 失败时作宽松断言 */
    onError(e as never)
  }
}

function handleUploadSuccess(res: CommonUploadResult, uploadFile: UploadFile) {
  const path = (res.fileName || res.url || '').trim()
  if (path) {
    uploadFile.name = path
    uploadFile.url = resolvePublicFileUrl(path)
  }
  nextTick(emitModel)
}

function handleRemove() {
  nextTick(emitModel)
}

function handleUploadError() {
  toast.error(t('imageUpload.fail'))
}

function onPreview(file: UploadFile) {
  previewUrl.value = file.url || ''
  previewVisible.value = true
}

function collectImagesFromClipboard(e: ClipboardEvent): File[] {
  const items = e.clipboardData?.items
  if (!items?.length) return []
  const out: File[] = []
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    if (it.kind === 'file' && it.type.startsWith('image/')) {
      const f = it.getAsFile()
      if (f) out.push(f)
    }
  }
  return out
}

function pushRawFiles(files: File[]) {
  for (const file of files) {
    if (fileList.value.length >= props.limit) {
      handleExceed()
      return
    }
    const raw = file as UploadRawFile
    raw.uid = genFileId()
    if (!beforeUpload(raw)) continue
    uploadRef.value?.handleStart(raw)
  }
}

function onPaste(e: ClipboardEvent) {
  if (props.disabled) return
  const files = collectImagesFromClipboard(e)
  if (!files.length) return
  e.preventDefault()
  pushRawFiles(files)
}

function onDrop(e: DragEvent) {
  dragActive.value = false
  if (props.disabled) return
  const dt = e.dataTransfer
  if (!dt?.files?.length) return
  const images = Array.from(dt.files).filter((f) => f.type.startsWith('image/'))
  if (!images.length) {
    toast.error(
      t('imageUpload.formatError', { types: props.fileType.join('/') }),
    )
    return
  }
  pushRawFiles(images)
}

function onDragLeave(e: DragEvent) {
  const cur = e.currentTarget as HTMLElement | null
  if (cur && e.relatedTarget && cur.contains(e.relatedTarget as Node)) return
  dragActive.value = false
}
</script>

<template>
  <div
    class="image-upload-host"
    :class="{ 'is-drag': dragActive, 'is-disabled': disabled }"
    tabindex="0"
    :aria-label="t('imageUpload.tipPaste')"
    @paste="onPaste"
    @dragenter.prevent="dragActive = true"
    @dragleave="onDragLeave"
    @dragover.prevent
    @drop="onDrop"
  >
    <el-upload
      ref="uploadRef"
      v-model:file-list="fileList"
      list-type="picture-card"
      :class="{ hide: hideAddBtn }"
      :action="action"
      :auto-upload="true"
      :disabled="disabled"
      :limit="limit"
      :http-request="httpRequest"
      :before-upload="beforeUpload"
      :on-exceed="handleExceed"
      :on-success="handleUploadSuccess"
      :on-remove="handleRemove"
      :on-error="handleUploadError"
      :on-preview="onPreview"
      :accept="acceptAttr"
      multiple
    >
      <el-icon><Plus /></el-icon>
    </el-upload>

    <p v-if="showTip" class="image-upload__tip">
      <span v-if="tipLine1">{{ tipLine1 }}</span>
      <span v-if="tipLine1 && tipLine2"> · </span>
      <span v-if="tipLine2">{{ tipLine2 }}</span>
    </p>
    <p v-if="showPasteHint" class="image-upload__paste">
      {{ t('imageUpload.tipPaste') }}
    </p>

    <GlassFormDialog
      v-model="previewVisible"
      :title="t('imageUpload.preview')"
      width="min(92vw, 520px)"
      :show-default-footer="false"
    >
      <img
        v-if="previewUrl"
        :src="previewUrl"
        alt=""
        class="image-upload__preview-img"
      />
    </GlassFormDialog>
  </div>
</template>

<style scoped lang="scss">
.image-upload-host {
  outline: none;
  border-radius: 12px;
  transition:
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.image-upload-host:focus-visible {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 45%, transparent);
}

.image-upload-host.is-drag:not(.is-disabled) {
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  box-shadow: inset 0 0 0 2px var(--el-color-primary-light-5);
}

.image-upload-host.is-disabled {
  opacity: 0.65;
  pointer-events: none;
}

.image-upload__tip {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.image-upload__paste {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  line-height: 1.45;
  max-width: 520px;
}

.image-upload__preview-img {
  display: block;
  max-width: 100%;
  margin: 0 auto;
  border-radius: 8px;
}

/* 达到数量上限时隐藏「添加卡片」（与 nest-admin 一致） */
:deep(.hide .el-upload--picture-card) {
  display: none;
}
</style>
