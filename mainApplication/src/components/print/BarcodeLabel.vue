<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import JsBarcode from 'jsbarcode'

const props = withDefaults(
  defineProps<{
    value?: string
    format?: string
    width?: number
    Iwidth?: number
    height?: number
    displayValue?: boolean
  }>(),
  { value: '', format: 'CODE128', width: 2, Iwidth: 100, height: 50, displayValue: false },
)

const barcodeElement = ref<HTMLImageElement | null>(null)

function draw() {
  const el = barcodeElement.value
  if (!el) return
  JsBarcode(el, props.value || ' ', {
    format: props.format,
    width: props.width,
    height: props.height,
    displayValue: props.displayValue,
  })
}

onMounted(() => draw())
watch(
  () => [props.value, props.format, props.width, props.height, props.displayValue],
  () => draw(),
)
</script>

<template>
  <img
    ref="barcodeElement"
    :style="{
      width: props.Iwidth + 'px',
      height: props.height + 'px',
    }"
    alt="barcode"
  />
</template>

<style scoped>
:deep(*, *:before, *:after) {
  box-sizing: initial;
}
</style>
