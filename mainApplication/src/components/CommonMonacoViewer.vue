<script setup lang="ts">
import { computed, onBeforeMount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import MonacoEditor, { loader } from '@guolao/vue-monaco-editor'

const props = withDefaults(
  defineProps<{
    value: string
    language?: string
    theme?: string
    height?: string
    options?: Record<string, unknown>
  }>(),
  {
    language: 'json',
    theme: 'vs',
    height: 'min(58vh, 500px)',
  },
)
const { locale } = useI18n()
const editorReady = ref(false)
const editorRenderKey = ref(0)
let bootedMonacoLocale: 'zh-CN' | 'en-US' | null = null
let booted = false

const mergedOptions = computed(() => ({
  automaticLayout: true,
  formatOnType: true,
  formatOnPaste: true,
  readOnly: true,
  wordWrap: 'on',
  autoIndent: 'full',
  ...(props.options || {}),
}))

async function bootMonacoByLocale(targetLocale: string) {
  if (booted && bootedMonacoLocale === targetLocale) return
  editorReady.value = false
  if (targetLocale === 'zh-CN') {
    // Monaco 需要在加载 editor.api 之前注入全局 NLS 消息
    await import('monaco-editor/esm/nls.messages.zh-cn')
  } else {
    ;(globalThis as Record<string, unknown>)._VSCODE_NLS_MESSAGES = undefined
    ;(globalThis as Record<string, unknown>)._VSCODE_NLS_LANGUAGE = undefined
  }
  // 必须在 setLocaleData 之后再加载 monaco（否则内置文案不会本地化）
  const monaco = await import('monaco-editor')
  loader.config({ monaco })
  booted = true
  bootedMonacoLocale = targetLocale === 'zh-CN' ? 'zh-CN' : 'en-US'
  editorRenderKey.value += 1
  editorReady.value = true
}

onBeforeMount(() => {
  void bootMonacoByLocale(locale.value)
})

watch(
  () => locale.value,
  (next) => {
    void bootMonacoByLocale(next)
  },
)
</script>

<template>
  <div class="common-monaco-viewer" :style="{ height }">
    <MonacoEditor
      v-if="editorReady"
      :key="editorRenderKey"
      :value="value || ''"
      :language="language"
      :theme="theme"
      :options="mergedOptions"
    />
    <div v-else class="common-monaco-viewer__loading" />
  </div>
</template>

<style scoped lang="scss">
.common-monaco-viewer {
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  overflow: hidden;
}

.common-monaco-viewer__loading {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--el-fill-color-light) 80%, transparent),
    color-mix(in srgb, var(--el-fill-color-lighter) 88%, transparent),
    color-mix(in srgb, var(--el-fill-color-light) 80%, transparent)
  );
  background-size: 220% 100%;
  animation: monacoLoadingPulse 1.2s ease infinite;
}

@keyframes monacoLoadingPulse {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
</style>
