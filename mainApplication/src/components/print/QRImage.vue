<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import QRCode from 'qrcode'

const props = withDefaults(
  defineProps<{
    content?: string
    width?: number
    height?: number
  }>(),
  { content: '', width: 100, height: 100 },
)

const qrCode = ref('')

function draw() {
  const text = props.content || ' '
  // Keep consistent with drag designer QR rendering (margin: 0)
  const size = Math.max(props.width, props.height)
  QRCode.toDataURL(text, { width: size, margin: 0 }, (err: Error | null | undefined, url: string) => {
    if (!err) qrCode.value = url
  })
}

onMounted(() => draw())
watch(() => [props.content, props.width, props.height], draw)
</script>

<template>
  <el-image
    :src="qrCode"
    alt="QR"
    fit="fill"
    :style="{ width: props.width + 'px', height: props.height + 'px' }"
  />
</template>
