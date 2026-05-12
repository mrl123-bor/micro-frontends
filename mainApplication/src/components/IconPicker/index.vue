<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search } from '@element-plus/icons-vue'
import SvgIcon from '@/components/SvgIcon/index.vue'
import MenuMetaIcon from '@/components/MenuMetaIcon/index.vue'
import { MENU_SVG_STEMS } from '@/constants/menuSvgAssets'
import { MENU_ICON_SVG_PREFIX } from '@/utils/resolveMenuIcon'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    modelValue?: string
  }>(),
  { modelValue: '' },
)

const emit = defineEmits<{
  'update:modelValue': [string]
}>()

/**
 * Element Plus 图标（均为 @element-plus/icons-vue 已导出名称）
 * 按后台菜单/仪表盘常用场景扩充分组排列，便于翻找
 */
const EP_MENU_ICONS: string[] = [
  'Odometer',
  'House',
  'HomeFilled',
  'DataBoard',
  'DataLine',
  'DataAnalysis',
  'Histogram',
  'PieChart',
  'TrendCharts',
  'Opportunity',
  'User',
  'UserFilled',
  'Avatar',
  'Male',
  'Female',
  'OfficeBuilding',
  'School',
  'Coordinate',
  'MapLocation',
  'Location',
  'LocationFilled',
  'Key',
  'Lock',
  'Unlock',
  'View',
  'Hide',
  'Warning',
  'WarningFilled',
  'InfoFilled',
  'CircleCheck',
  'CircleClose',
  'SuccessFilled',
  'QuestionFilled',
  'Help',
  'HelpFilled',
  'Menu',
  'Management',
  'Grid',
  'List',
  'Fold',
  'Expand',
  'FullScreen',
  'Rank',
  'Sort',
  'SortUp',
  'SortDown',
  'Filter',
  'MoreFilled',
  'DArrowLeft',
  'DArrowRight',
  'Document',
  'DocumentAdd',
  'DocumentCopy',
  'DocumentDelete',
  'DocumentChecked',
  'DocumentRemove',
  'Files',
  'Folder',
  'FolderOpened',
  'FolderAdd',
  'FolderDelete',
  'FolderChecked',
  'Notebook',
  'Reading',
  'Memo',
  'Tickets',
  'Ticket',
  'Postcard',
  'Collection',
  'CollectionTag',
  'Picture',
  'PictureFilled',
  'Camera',
  'VideoCamera',
  'VideoPlay',
  'VideoPause',
  'Film',
  'Edit',
  'EditPen',
  'Delete',
  'DeleteFilled',
  'Plus',
  'Minus',
  'Close',
  'Check',
  'Select',
  'Refresh',
  'RefreshRight',
  'RefreshLeft',
  'Search',
  'Download',
  'Upload',
  'UploadFilled',
  'CopyDocument',
  'Scissor',
  'Crop',
  'MagicStick',
  'Brush',
  'Stamp',
  'Setting',
  'SetUp',
  'Tools',
  'Cpu',
  'Monitor',
  'Connection',
  'Link',
  'Share',
  'Message',
  'MessageBox',
  'ChatDotRound',
  'ChatLineRound',
  'Comment',
  'Bell',
  'BellFilled',
  'Notification',
  'Phone',
  'PhoneFilled',
  'Microphone',
  'Headset',
  'Promotion',
  'Sell',
  'Shop',
  'ShoppingCart',
  'ShoppingTrolley',
  'Goods',
  'GoodsFilled',
  'Box',
  'Briefcase',
  'Wallet',
  'WalletFilled',
  'CreditCard',
  'Money',
  'Coin',
  'Discount',
  'PriceTag',
  'Calendar',
  'Clock',
  'Timer',
  'AlarmClock',
  'Stopwatch',
  'Van',
  'Ship',
  'Bicycle',
  'Star',
  'StarFilled',
  'Flag',
  'Trophy',
  'Medal',
  'Guide',
  'Compass',
  'Operation',
  'Switch',
  'SwitchButton',
  'Loading',
  'Service',
  'Printer',
  'Paperclip',
  'ZoomIn',
  'ZoomOut',
  'Aim',
  'Pointer',
  'Position',
  'Place',
  'FirstAidKit',
  'WindPower',
  'Lightning',
  'Sunny',
  'Moon',
  'Cloudy',
  'Umbrella',
]

const popoverVisible = ref(false)
const searchText = ref('')
const scrollBodyRef = ref<HTMLElement | null>(null)

const filteredEpIcons = computed(() => {
  const q = searchText.value.trim().toLowerCase()
  if (!q) return EP_MENU_ICONS
  return EP_MENU_ICONS.filter((n) => n.toLowerCase().includes(q))
})

const filteredSvgStems = computed(() => {
  const q = searchText.value.trim().toLowerCase()
  if (!q) return MENU_SVG_STEMS
  return MENU_SVG_STEMS.filter((s) => {
    const full = `${MENU_ICON_SVG_PREFIX}${s}`.toLowerCase()
    return s.toLowerCase().includes(q) || full.includes(q)
  })
})

const hasAnyMatch = computed(
  () => filteredEpIcons.value.length > 0 || filteredSvgStems.value.length > 0,
)

watch(popoverVisible, (open) => {
  if (open) {
    searchText.value = ''
    void nextTick(() => {
      scrollBodyRef.value?.scrollTo({ top: 0 })
    })
  }
})

watch(
  () => searchText.value,
  () => {
    void nextTick(() => {
      scrollBodyRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
    })
  },
)

function pickElement(name: string) {
  emit('update:modelValue', name)
  popoverVisible.value = false
}

function pickSvg(stem: string) {
  emit('update:modelValue', `${MENU_ICON_SVG_PREFIX}${stem}`)
  popoverVisible.value = false
}

function clearIcon() {
  emit('update:modelValue', '')
  popoverVisible.value = false
}

/** 回车：精确匹配内置图标 / 或以 svg:、iconfont: 等形式写入 */
function onFilterEnter() {
  const raw = searchText.value.trim()
  if (!raw) return
  if (raw.startsWith('svg:') || raw.startsWith('iconfont:')) {
    emit('update:modelValue', raw)
    popoverVisible.value = false
    return
  }
  const ep = EP_MENU_ICONS.find((n) => n.toLowerCase() === raw.toLowerCase())
  if (ep) {
    pickElement(ep)
    return
  }
  const stem = MENU_SVG_STEMS.find((s) => s.toLowerCase() === raw.toLowerCase())
  if (stem) {
    pickSvg(stem)
    return
  }
  emit('update:modelValue', raw)
  popoverVisible.value = false
}
</script>

<template>
  <div class="icon-picker">
    <div class="icon-picker__row">
      <span class="icon-picker__preview" aria-hidden="true">
        <MenuMetaIcon v-if="modelValue" :name="modelValue" :size="22" />
        <span v-else class="icon-picker__empty">{{ t('pages.menu.iconPlaceholder') }}</span>
      </span>
      <el-popover
        v-model:visible="popoverVisible"
        :width="460"
        trigger="click"
        placement="bottom-start"
      >
        <template #reference>
          <el-button type="primary" plain>{{ t('pages.menu.iconPick') }}</el-button>
        </template>
        <div class="icon-picker__panel">
          <div class="icon-picker__head">
            <div class="icon-picker__toolbar">
              <el-button text type="danger" size="small" @click="clearIcon">
                {{ t('pages.menu.iconClear') }}
              </el-button>
            </div>
            <el-input
              v-model="searchText"
              clearable
              size="default"
              :placeholder="t('pages.menu.iconFilterPh')"
              @keydown.enter.prevent="onFilterEnter"
            >
              <template #prefix>
                <el-icon class="icon-picker__search-ico"><Search /></el-icon>
              </template>
            </el-input>
            <p class="icon-picker__hint">{{ t('pages.menu.iconFilterHint') }}</p>
          </div>
          <div ref="scrollBodyRef" class="icon-picker__body">
            <template v-if="hasAnyMatch">
              <template v-if="filteredEpIcons.length">
                <div class="icon-picker__group-title">{{ t('pages.menu.iconGroupElement') }}</div>
                <div class="icon-picker__grid">
                  <button
                    v-for="name in filteredEpIcons"
                    :key="`ep-${name}`"
                    type="button"
                    class="icon-picker__cell"
                    :class="{ 'is-active': modelValue === name }"
                    :title="name"
                    @click="pickElement(name)"
                  >
                    <SvgIcon type="element" :name="name" :size="20" />
                  </button>
                </div>
              </template>
              <template v-if="filteredSvgStems.length">
                <div class="icon-picker__group-title">{{ t('pages.menu.iconGroupSvg') }}</div>
                <div class="icon-picker__grid">
                  <button
                    v-for="stem in filteredSvgStems"
                    :key="`svg-${stem}`"
                    type="button"
                    class="icon-picker__cell"
                    :class="{ 'is-active': modelValue === `${MENU_ICON_SVG_PREFIX}${stem}` }"
                    :title="`${MENU_ICON_SVG_PREFIX}${stem}`"
                    @click="pickSvg(stem)"
                  >
                    <SvgIcon type="svg" :name="stem" :size="20" />
                  </button>
                </div>
              </template>
            </template>
            <div v-else class="icon-picker__nomatch">
              {{ t('pages.menu.iconNoMatch') }}
            </div>
          </div>
        </div>
      </el-popover>
    </div>
  </div>
</template>

<style scoped lang="scss">
.icon-picker__row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.icon-picker__preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  min-height: 36px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-primary);
}

.icon-picker__empty {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.icon-picker__panel {
  display: flex;
  flex-direction: column;
  max-height: min(72vh, 520px);
  margin: -6px 0;
}

.icon-picker__head {
  flex-shrink: 0;
  padding: 0 2px 10px;
  margin-bottom: 2px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.icon-picker__toolbar {
  margin-bottom: 8px;
}

.icon-picker__search-ico {
  font-size: 16px;
  color: var(--el-text-color-secondary);
}

.icon-picker__hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.45;
}

.icon-picker__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 8px 2px 4px;
}

.icon-picker__nomatch {
  padding: 24px 8px;
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.icon-picker__group-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin: 10px 0 6px;
  &:first-child {
    margin-top: 0;
  }
}

.icon-picker__grid {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 6px;
}

@media (max-width: 520px) {
  .icon-picker__grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

.icon-picker__cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-blank);
  cursor: pointer;
  padding: 0;
  color: var(--el-text-color-primary);
  position: relative;
  overflow: hidden;
  transition:
    border-color 0.15s,
    background 0.15s;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-color-primary-light-9);
  }

  &.is-active {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}
</style>
