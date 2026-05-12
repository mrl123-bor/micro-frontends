<script setup lang="ts">
import { computed } from 'vue'
import SvgIcon from '@/components/SvgIcon/index.vue'
import { resolveMenuIcon } from '@/utils/resolveMenuIcon'

const props = withDefaults(
  defineProps<{
    name?: string
    size?: number | string
  }>(),
  {
    size: 18,
  },
)

const resolved = computed(() => resolveMenuIcon(props.name))
const px = computed(() => props.size)
</script>

<template>
  <SvgIcon
    v-if="resolved?.kind === 'element'"
    type="element"
    :name="resolved.name"
    :size="px"
  />
  <SvgIcon
    v-else-if="resolved?.kind === 'svg'"
    type="svg"
    :name="resolved.name"
    :size="px"
  />
  <SvgIcon
    v-else-if="resolved?.kind === 'iconfont'"
    type="iconfont"
    :icon-class="resolved.iconClass"
    :size="px"
  />
</template>
