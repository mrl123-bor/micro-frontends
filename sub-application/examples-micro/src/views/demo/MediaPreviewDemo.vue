<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { PreviewVideoJs } from '@lgh_/media-preview-npm/video'
import GlassFormDialog from '@micro/components/GlassFormDialog.vue'
import SimplePage from '@micro/components/SimplePage.vue'
import { useRouteTitle } from '@micro/composables/useRouteTitle'

const route = useRoute()
const { t } = useI18n()
const { titleForRoute } = useRouteTitle()
const title = computed(() => titleForRoute(route))

/** MDN / Mozilla 等公开样例，仅用于演示 v-l-preview */
const samples = {
  imageJpg:
    'https://interactive-examples.mdn.mozilla.net/media/cc0-images/grapefruit-slice-332-332.jpg',
  pdf: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
  audioMp3: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
  videoMp4: 'http://vjs.zencdn.net/v/oceans.mp4',
}

const dynamicPdfUrl = ref(samples.pdf)
const videoEmbedDialogVisible = ref(false)
const demoDanmuComments = ref<Array<Record<string, unknown>>>([])
let demoDanmuTimer: number | null = null
let demoDanmuCursor = 0

const DEMO_DANMU_TEXTS = [
  '后端推送：第一条业务弹幕',
  '后端推送：第二条业务弹幕',
  '后端推送：第三条业务弹幕',
  '后端推送：第四条业务弹幕',
]

function pushOneDemoDanmu() {
  const id = `api-${Date.now()}-${demoDanmuCursor}`
  const txt = DEMO_DANMU_TEXTS[demoDanmuCursor % DEMO_DANMU_TEXTS.length]!
  const hue = (demoDanmuCursor * 47) % 360
  demoDanmuCursor += 1
  demoDanmuComments.value.push({
    id,
    txt,
    mode: 'scroll',
    duration: 9000,
    color: `hsl(${hue} 88% 72%)`,
    style: {
      color: `hsl(${hue} 88% 72%)`,
      fontSize: '18px',
      fontWeight: '600',
      textShadow: '0 1px 2px rgba(0,0,0,.9), 0 0 14px rgba(0,0,0,.5)',
    },
  })
  if (demoDanmuComments.value.length > 120) {
    demoDanmuComments.value.splice(0, demoDanmuComments.value.length - 120)
  }
}

onMounted(() => {
  for (let i = 0; i < 4; i += 1) pushOneDemoDanmu()
  demoDanmuTimer = window.setInterval(() => pushOneDemoDanmu(), 1400)
})

onBeforeUnmount(() => {
  if (demoDanmuTimer != null) {
    clearInterval(demoDanmuTimer)
    demoDanmuTimer = null
  }
})
</script>

<template>
  <SimplePage :title="title" :subtitle="t('mediaPreview.demo.subtitle')">
    <el-alert type="info" :closable="false" show-icon class="demo-alert">
      {{ t('mediaPreview.demo.intro') }}
    </el-alert>

    <div class="demo-grid">
      <el-card shadow="hover">
        <template #header>
          <span>{{ t('mediaPreview.demo.cardImage') }}</span>
        </template>
        <p class="demo-desc">{{ t('mediaPreview.demo.descImage') }}</p>
        <el-button type="primary" text bg v-l-preview="samples.imageJpg">
          {{ t('mediaPreview.demo.btnOpen') }}
        </el-button>
      </el-card>

      <el-card shadow="hover">
        <template #header>
          <span>{{ t('mediaPreview.demo.cardPdf') }}</span>
        </template>
        <p class="demo-desc">{{ t('mediaPreview.demo.descPdf') }}</p>
        <el-button type="primary" text bg v-l-preview="{ url: samples.pdf, options: { name: 'sample.pdf', title: 'PDF 样例' } }">
          {{ t('mediaPreview.demo.btnOpen') }}
        </el-button>
      </el-card>

      <el-card shadow="hover">
        <template #header>
          <span>{{ t('mediaPreview.demo.cardAudio') }}</span>
        </template>
        <p class="demo-desc">{{ t('mediaPreview.demo.descAudio') }}</p>
        <el-button
          type="primary"
          text
          bg
          v-l-preview="{
            url: samples.audioMp3,
            options: { name: 't-rex-roar.mp3', title: '音频', coverImage: samples.imageJpg },
          }"
        >
          {{ t('mediaPreview.demo.btnOpen') }}
        </el-button>
      </el-card>

      <el-card shadow="hover">
        <template #header>
          <span>{{ t('mediaPreview.demo.cardVideo') }}</span>
        </template>
        <p class="demo-desc">{{ t('mediaPreview.demo.descVideo') }}</p>
        <el-button
          type="primary"
          text
          bg
          v-l-preview="{ url: samples.videoMp4, options: { title: '视频', danmuComments: demoDanmuComments } }"
        >
          {{ t('mediaPreview.demo.btnOpen') }}
        </el-button>
        <p class="demo-desc demo-embed-label">{{ t('mediaPreview.demo.videoEmbedHint') }}</p>
        <el-button type="primary" plain @click="videoEmbedDialogVisible = true">
          {{ t('mediaPreview.demo.btnVideoEmbedDialog') }}
        </el-button>
      </el-card>

      <el-card shadow="hover">
        <template #header>
          <span>{{ t('mediaPreview.demo.cardUnsupported') }}</span>
        </template>
        <p class="demo-desc">{{ t('mediaPreview.demo.descUnsupported') }}</p>
        <el-button type="warning" text bg v-l-preview="'https://example.com/file/no-extension'">
          {{ t('mediaPreview.demo.btnOpen') }}
        </el-button>
      </el-card>

      <el-card shadow="hover">
        <template #header>
          <span>{{ t('mediaPreview.demo.cardDynamic') }}</span>
        </template>
        <p class="demo-desc">{{ t('mediaPreview.demo.descDynamic') }}</p>
        <el-input v-model="dynamicPdfUrl" clearable class="demo-input" />
        <el-button
          type="primary"
          text
          bg
          class="demo-mt"
          :disabled="!dynamicPdfUrl.trim()"
          v-l-preview="{ url: dynamicPdfUrl, options: { title: t('mediaPreview.demo.dynamicTitle') } }"
        >
          {{ t('mediaPreview.demo.btnOpenBound') }}
        </el-button>
      </el-card>
    </div>

    <GlassFormDialog
      v-model="videoEmbedDialogVisible"
      :title="t('mediaPreview.demo.videoDialogTitle')"
      width="min(92vw, 920px)"
      :show-default-footer="false"
    >
      <div class="demo-video-dialog-body">
        <PreviewVideoJs :src="samples.videoMp4" :danmu-comments="demoDanmuComments" />
      </div>
    </GlassFormDialog>
  </SimplePage>
</template>

<style scoped lang="scss">
.demo-alert {
  margin-bottom: 16px;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.demo-desc {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.55;
}

.demo-input {
  margin-bottom: 8px;
}

.demo-mt {
  margin-top: 4px;
}

.demo-embed-label {
  margin-top: 16px;
  margin-bottom: 8px;
  padding-top: 12px;
  border-top: 1px dashed var(--el-border-color);
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.demo-video-dialog-body {
  height: min(68vh, 560px);
  width: 100%;
  box-sizing: border-box;
  margin: -4px 0 2px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--el-fill-color-darker, #141414);
}
</style>
