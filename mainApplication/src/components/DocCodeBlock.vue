<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from '@/utils/toast'
import { DocumentCopy } from '@element-plus/icons-vue'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('json', json)

import 'highlight.js/styles/atom-one-dark.min.css'

const props = withDefaults(
  defineProps<{
    code: string
    /** 模板里含 `var`、注释等用 javascript；纯 JSON 用 json */
    lang?: 'json' | 'javascript'
  }>(),
  { lang: 'javascript' },
)

const { t } = useI18n()

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const highlighted = computed(() => {
  const raw = props.code.trim()
  if (!raw) return ''
  try {
    return hljs.highlight(raw, { language: props.lang }).value
  } catch {
    try {
      return hljs.highlight(raw, { language: 'javascript' }).value
    } catch {
      return escapeHtml(raw)
    }
  }
})

const langBadge = computed(() => (props.lang === 'json' ? 'JSON' : 'JavaScript'))

async function copy() {
  const text = props.code.trim()
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    toast.success(t('pages.printDoc.copied'))
  } catch {
    toast.error(t('pages.printDoc.copyFail'))
  }
}
</script>

<template>
  <div class="doc-code-block">
    <div class="doc-code-block__bar">
      <span class="doc-code-block__lang">{{ langBadge }}</span>
      <button type="button" class="doc-code-block__copy" @click="copy">
        <el-icon class="doc-code-block__copy-ico"><DocumentCopy /></el-icon>
        {{ t('pages.printDoc.copyCode') }}
      </button>
    </div>
    <pre class="doc-code-block__pre"><code class="hljs" v-html="highlighted" /></pre>
  </div>
</template>

<style scoped lang="scss">
.doc-code-block {
  margin: 14px 0;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, #30363d 30%);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.06),
    0 8px 24px rgba(0, 0, 0, 0.08);
}

.doc-code-block__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  background: linear-gradient(180deg, #2d333b 0%, #22272e 100%);
  border-bottom: 1px solid #30363d;
}

.doc-code-block__lang {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #8b949e;
  font-family: ui-monospace, monospace;
}

.doc-code-block__copy {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #c9d1d9;
  background: color-mix(in srgb, #388bfd 22%, transparent);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}

.doc-code-block__copy:hover {
  background: color-mix(in srgb, #388bfd 38%, transparent);
  color: #fff;
}

.doc-code-block__copy-ico {
  font-size: 14px;
}

.doc-code-block__pre {
  margin: 0;
  padding: 16px 18px;
  overflow-x: auto;
  max-height: min(58vh, 520px);
  overflow-y: auto;
  background: #0d1117;
  font-size: 12.5px;
  line-height: 1.55;
  tab-size: 2;
}

.doc-code-block__pre :deep(code.hljs) {
  display: block;
  padding: 0;
  background: transparent !important;
  font-family:
    ui-monospace,
    SFMono-Regular,
    'JetBrains Mono',
    Menlo,
    Monaco,
    Consolas,
    'Liberation Mono',
    'Courier New',
    monospace;
}

/* 微调 atom-one-dark 在窄屏下的可读性 */
.doc-code-block__pre :deep(.hljs) {
  color: #c9d1d9;
}
</style>
