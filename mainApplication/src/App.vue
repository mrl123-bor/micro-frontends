<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import { MediaPreviewHost } from '@lgh_/media-preview-npm/host'

const { locale } = useI18n()

const elementLocale = computed(() => (locale.value === 'en-US' ? en : zhCn))
</script>

<template>
  <el-config-provider :locale="elementLocale">
    <router-view />
    <MediaPreviewHost />
  </el-config-provider>
</template>
