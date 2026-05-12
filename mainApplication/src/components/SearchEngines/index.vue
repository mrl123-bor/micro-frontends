<!--
  SearchEngines：列表页「复合搜索条」
  - 主输入框 + 下拉选维度/选值，条件以 Tag 展示；支持远程选项、日期区间、多选、列显隐、刷新按钮
  - 父组件传入 dats 配置各筛选项；通过 @handlesousuos 传出扁平查询对象；history 时写入 sessionStorage 按路由名恢复
-->
<template>
  <div>
    <div class="int-out ko-s">
      <!-- 已选条件：每项对应一条筛选，可关闭；点击可弹出编辑面板 -->
      <el-tag
        v-for="(item, inx) in states.tsoks"
        :key="inx"
        class="se-tag"
        closable
        @close="handletagclose(item, inx as any)"
        ref="dianjisole"
        @click="handledianjisbes(item, inx as any)"
      >
        {{ item.titvalName }}:{{ item.vlvvalName }}
      </el-tag>

      <!-- 编辑某条已选条件：Teleport 到 body，避免被父级 overflow 裁剪 -->
      <Teleport to="body">
        <div
          class="select-out se-panel se-panel--edit"
          v-if="states.xiugaiboolers"
          :style="editPanelStyle"
          ref="dianjiChange"
          @mousedown="handledianjis"
        >
          <div class="se-edit-head">
            <span class="se-edit-head__label">{{ states.xiugaiData.titvalName }}</span>
            <span class="se-edit-head__hint">
              {{ states.xiugaiData.kiklis == 2 ? t('searchEngine.editHintDate') : t('searchEngine.editHintOther') }}
            </span>
          </div>
          <div class="se-edit-body">
            <div v-if="states.xiugaiData.kiklis == 1" class="se-edit-field">
              <el-input
                v-model="states.xiugaiData.vlvvalName"
                :placeholder="t('searchEngine.inputPlaceholder')"
                clearable
              />
            </div>
            <div v-if="states.xiugaiData.kiklis == 0" class="se-edit-field">
              <el-select
                v-model="states.xiugaiData.vlvval"
                :placeholder="t('searchEngine.selectPlaceholder')"
                filterable
                class="se-edit-select"
                :remote="states.selectremote"
                :remote-method="handleInputes"
                @change="handleselectover"
              >
                <el-option
                  v-for="item in states.xiugaiselect"
                  :key="item.value"
                  :label="item.title"
                  :value="item.value"
                >
                </el-option>
              </el-select>
            </div>
            <div v-if="states.xiugaiData.kiklis == 2" class="se-edit-field-group">
              <div v-for="(item, inx) in states.xiugaiselect" :key="inx" class="se-edit-field">
                <div class="se-edit-sublabel">{{ item.title }}</div>
                <el-date-picker
                  v-model="item.value"
                  class="se-edit-picker"
                  :type="item.dataType ? 'datetime' : 'date'"
                  :format="item.types"
                  :value-format="item.types"
                  :placeholder="t('searchEngine.datePlaceholder')"
                  teleported
                  popper-class="se-date-picker-popper"
                  :disabled-date="
                    item.disabledBooler ? (inx == 0 ? disabledDate : disabledDateend) : disabledDateNone
                  "
                >
                </el-date-picker>
              </div>
            </div>
            <div v-if="states.xiugaiData.kiklis == 3" class="se-edit-field-group">
              <div v-for="(item, inx) in states.xiugaiselect" :key="inx" class="se-edit-field">
                <div class="se-edit-sublabel">{{ item.title }}</div>
                <el-input v-model="item.value" clearable />
              </div>
            </div>
          </div>
          <div class="se-edit-foot">
            <el-button @click="states.xiugaiboolers = false">{{ t('common.cancel') }}</el-button>
            <el-button type="primary" @click="handleoptestkle">{{ t('common.confirm') }}</el-button>
          </div>
        </div>
      </Teleport>

      <!-- 当前正在选择的「维度」名称（例如：状态：） -->
      <span v-if="states.titleovers">{{ states.titleovers }}：</span>
      <!-- 主搜索输入：聚焦时展开主下拉或日期/数字面板 -->
      <div class="inputouts" ref="inputWrapRef">
        <el-input
          :placeholder="t('searchEngine.mainPlaceholder')"
          @focus="handletexsfocus"
          @blur="blurfunsd"
          @input="handleInputes"
          @keydown.delete="handlessoverbak"
          @keyup.delete="hanleovbackspace"
          ref="inputUis"
          @keyup.enter="handleqiekes"
          v-model="states.input2"
        >
          <template #prefix>
            <el-icon class="se-prefix">
              <Search />
            </el-icon>
          </template>
        </el-input>
        <el-icon
          class="se-clear"
          v-if="states.titleovers || states.input2"
          @mousedown.prevent.stop
          @click="handleQinChu"
        >
          <Close />
        </el-icon>

        <!-- 主下拉：第一层选字段，第二层选枚举值 / 多选面板 -->
        <Teleport to="body">
          <div
            class="select-out se-panel se-panel--dropdown"
            v-if="states.teel"
            :style="mainPanelStyle"
            ref="odetest"
            @mousedown.capture.prevent="handletest"
          >
            <div v-if="states.kpktes" class="se-dropdown-head">
              <span class="se-dropdown-head__title">{{ t('searchEngine.filterTitle') }}</span>
              <span class="se-dropdown-head__tip">{{ t('searchEngine.filterTip') }}</span>
            </div>
            <div
              v-else-if="
                !states.kettipe &&
                !kiklisIsTimeRange(states.moltit.kiklis) &&
                !kiklisIsDualField(states.moltit.kiklis)
              "
              class="se-dropdown-head"
            >
              <span class="se-dropdown-head__title">{{ states.moltit.titvalName }}</span>
              <span class="se-dropdown-head__tip">{{ t('searchEngine.pickOneTip') }}</span>
            </div>
            <div class="se-dropdown-body">
            <template v-for="(item, index) in dats" :key="index">
              <div @click="handleovers(item)" v-if="states.kpktes && item.switch" class="oloders">
                <span class="oloders__dot" aria-hidden="true" />
                <span class="oloders__text">{{ item.title }}</span>
                <el-icon class="oloders__arrow"><ArrowRight /></el-icon>
              </div>
            </template>
            <template v-if="states.moltit.kiklis == '0' && states.nvkloslist.length == 0">
              <div class="oloders oloders--empty">{{ t('searchEngine.empty') }}</div>
            </template>
            <template v-for="(its, index) in states.nvkloslist" :key="index">
              <div
                class="oloders"
                @click="handlevckoi(its, true)"
                v-if="
                  !states.kpktes &&
                  !states.kettipe &&
                  !kiklisIsTimeRange(states.moltit.kiklis) &&
                  !kiklisIsDualField(states.moltit.kiklis)
                "
              >
                <span class="oloders__dot oloders__dot--sub" aria-hidden="true" />
                <span class="oloders__text">{{ its.title }}</span>
              </div>
            </template>

            <div v-if="!states.kpktes && states.kettipe" class="se-dropdown-multi">
              <div @click="handlemlers" class="jio">
                <span
                  :class="
                    states.isIndeterminate
                      ? 'omolerps jop'
                      : states.checkAll
                        ? 'omolerps box'
                        : 'omolerps'
                  "
                ></span
                >{{ t('searchEngine.selectAll') }}
              </div>
              <div
                v-for="(item, inx) in states.nvklos"
                @click="handlempchink(item)"
                :label="item.value"
                :key="inx"
                class="jio"
              >
                <span :class="item.checkAll ? 'omolerps box' : 'omolerps'"></span>{{ item.title }}
              </div>
              <div class="se-dropdown-multi__foot">
                <el-button size="small" @click="handleoptaserror">{{ t('common.cancel') }}</el-button>
                <el-button size="small" type="primary" @click="handleoptasOk">{{ t('common.confirm') }}</el-button>
              </div>
            </div>
            </div>
          </div>

          <!-- 日期区间(kiklis=2) / 双输入数值区间(kiklis=3) 专用浮层 -->
          <div
            class="select-out se-panel se-panel--time"
            v-if="states.timeteels"
            :style="timePanelStyle"
            ref="oderchenks"
            @mousedown.capture="handleTimePanelMouseDownCapture"
            @mousedown="handleopsddeas"
          >
            <div v-if="kiklisIsTimeRange(states.moltit.kiklis)" class="se-time-panel se-time-panel--range">
              <div class="se-time-hero">
                <div class="se-time-hero__icon" aria-hidden="true">
                  <el-icon><Calendar /></el-icon>
                </div>
                <div class="se-time-hero__text">
                  <div class="se-time-hero__title">{{ states.moltit.titvalName }}</div>
                  <p class="se-time-hero__hint">{{ t('searchEngine.timeRangeHint') }}</p>
                </div>
              </div>
              <div class="se-time-fields">
                <div v-for="(its, inx) in states.nvklos" :key="inx" class="se-time-field">
                  <div class="se-time-field__label">
                    <span class="se-time-field__dot" :class="inx === 0 ? 'is-start' : 'is-end'" />
                    {{ its.title }}
                  </div>
                  <el-date-picker
                    size="large"
                    v-model="its.value"
                    :type="its.dataType ? 'datetime' : 'date'"
                    :format="its.types"
                    :value-format="its.types"
                    teleported
                    popper-class="se-date-picker-popper"
                    :placeholder="t('searchEngine.datePlaceholder')"
                    :disabled-date="
                      its.disabledBooler ? (inx == 0 ? disabledDate : disabledDateend) : disabledDateNone
                    "
                  >
                  </el-date-picker>
                </div>
              </div>
              <div class="se-time-foot">
                <el-button class="se-time-btn se-time-btn--ghost" round @click="handleoptaserrortimes">
                  {{ t('common.cancel') }}
                </el-button>
                <el-button class="se-time-btn se-time-btn--go" round type="primary" @click="handletimerstimes">
                  {{ t('common.confirm') }}
                </el-button>
              </div>
            </div>
            <div v-if="kiklisIsDualField(states.moltit.kiklis)" class="se-time-panel se-time-panel--dual">
              <div class="se-time-hero se-time-hero--dual">
                <div class="se-time-hero__icon se-time-hero__icon--dual" aria-hidden="true">
                  <el-icon><Histogram /></el-icon>
                </div>
                <div class="se-time-hero__text">
                  <div class="se-time-hero__title">{{ states.moltit.titvalName }}</div>
                  <p class="se-time-hero__hint">{{ t('searchEngine.amountRangeHint') }}</p>
                </div>
              </div>
              <div class="se-time-fields">
                <div v-for="(item, inx) in states.nvklos" :key="inx" class="se-time-field">
                  <div class="se-time-field__label">
                    <span class="se-time-field__dot" :class="inx === 0 ? 'is-start' : 'is-end'" />
                    {{ item.title }}
                  </div>
                  <el-input v-model="item.value" class="se-time-input-dual" clearable />
                </div>
              </div>
              <div class="se-time-foot">
                <el-button class="se-time-btn se-time-btn--ghost" round @click="handleoptaserrortimes">
                  {{ t('common.cancel') }}
                </el-button>
                <el-button class="se-time-btn se-time-btn--go" round type="primary" @click="handletimerstimesInput">
                  {{ t('common.confirm') }}
                </el-button>
              </div>
            </div>
          </div>
        </Teleport>
      </div>
      <!-- 刷新：仅抛事件，具体拉数与提示由页面实现 -->
      <el-tooltip v-if="showRefresh" :content="t('searchEngine.refreshTooltip')" placement="top">
        <el-button class="se-refresh" circle @click="emit('refresh')">
          <el-icon><RefreshRight /></el-icon>
        </el-button>
      </el-tooltip>
      <!-- 表格列显隐 + 拖拽排序：选中结果通过 columns-change 交给父组件 -->
      <el-popover
        v-if="props.showColumnsToggle && (props.tableColumns?.length || 0) > 0"
        v-model:visible="colsPopover"
        :width="colsPopoverWidth"
        trigger="click"
        placement="bottom-end"
      >
        <template #reference>
          <el-button class="se-refresh" circle :title="t('table.columns')">
            <el-icon><Grid /></el-icon>
          </el-button>
        </template>
        <div class="se-cols">
          <div class="se-cols__top">
            <div class="se-cols__title">
              <div class="se-cols__titleText">{{ t('table.columns') }}</div>
              <div class="se-cols__badge">{{ colsSelected.length }}/{{ colsOrder.length }}</div>
            </div>
            <div class="se-cols__tools">
              <el-input
                v-model="colsSearch"
                size="small"
                clearable
                :placeholder="t('table.columnsFilter')"
              />
              <div class="se-cols__actions">
                <el-button size="small" plain @click="colsSelectAll">{{ t('common.selectAll') }}</el-button>
                <el-button size="small" @click="colsReset">{{ t('common.reset') }}</el-button>
              </div>
            </div>
          </div>
          <div class="se-cols__list" role="list">
            <div
              v-for="c in filteredCols()"
              :key="colsKeyFor(c)"
              class="se-cols__row"
              :class="{ 'is-on': colsSelected.includes(colsKeyFor(c)) }"
              role="listitem"
              draggable="true"
              @dragstart="onDragStart(colsKeyFor(c))"
              @dragover.prevent
              @drop.prevent="onDrop(colsKeyFor(c))"
            >
              <button
                type="button"
                class="se-cols__drag"
                :title="t('common.dragToSort')"
                @click.stop
              >
                <el-icon><Rank /></el-icon>
              </button>
              <button type="button" class="se-cols__main" @click="colsToggle(colsKeyFor(c))">
                <span class="se-cols__check" aria-hidden="true" />
                <span class="se-cols__label">{{ colsLabelFor(c) }}</span>
              </button>
            </div>
          </div>
          <div class="se-cols__hint">
            {{ t('common.dragToSort') }} · {{ t('table.columnsHint') }}
          </div>
        </div>
      </el-popover>
    </div>

    <FunConfirmDialog
      v-model="seAlert.visible"
      :title="seAlert.title"
      :message="seAlert.message"
      :tips="seAlert.tips"
      :confirm-text="seAlert.confirmText"
      :cancel-text="seAlert.cancelText"
      :width="seAlert.width"
      :show-cancel="seAlert.showCancel"
      @confirm="seAlert.onConfirm"
      @cancel="seAlert.onCancel"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * SearchEngines — 列表页复合搜索
 *
 * 父组件配置项 dats[] 常用字段：
 * - title / value：展示名与提交用的字段名（与 handlesousuos 传出对象的 key 一致）
 * - kiklis：'0' 下拉单选 | '1' 文本 | '2' 日期/时间区间 | '3' 两个普通输入（如金额起止）
 * - children：子选项（下拉/多选/区间子字段）；kettipe 为 true 时表示该维度可多选多条 Tag
 * - switch：是否在本组件「第一层」展示该维度；未传时 onMounted 会默认 true
 * - tesvalue：为 true 时，用户直接敲回车会把输入值绑到该维度（用于默认文本筛）
 * - keys / cannotDelete / TemporaryConditions：与恢复会话、必填不可删 Tag 有关
 *
 * 事件：
 * - handlesousuos：传出扁平查询对象，父组件据此请求列表
 * - refresh：点击刷新按钮
 * - columns-change：列显隐/顺序变化后的已选列 key 数组（有序）
 * - handleInputes：下拉 remote 时把输入同步给父组件拉选项
 */
import { arrayToMap, mapToArray } from '@/utils/validate'
import { toast } from '@/utils/toast'
import FunConfirmDialog from '@/components/FunConfirmDialog.vue'
import { useFunConfirmDialog } from '@/composables/useFunConfirmDialog'
import {
  ArrowRight,
  Calendar,
  Close,
  Histogram,
  RefreshRight,
  Search,
  Grid,
  Rank,
} from '@element-plus/icons-vue'
import { getCurrentInstance, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { proxy } = getCurrentInstance() as any
const emit = defineEmits([
  'selected',
  'handlesousuos', // 筛选条件变化 → 父组件拉列表（对象形如 { userName: 'x', status: '0' }）
  'handleInputes', // remote 下拉时，输入框内容交给父组件
  'changeOne', // 动态事件名，见 dats[].changeOne
  'refresh',
  'columns-change',
])
const route = useRoute()
const { t } = useI18n()
const seAlert = useFunConfirmDialog()

/** 区间类子项标题识别：用于展示 ≥ / ≤ 前缀（与 i18n 中英文标题兼容） */
function isStartTime(n: string) {
  return n === t('searchEngine.startTime') || n === '开始时间'
}
function isEndTime(n: string) {
  return n === t('searchEngine.endTime') || n === '结束时间'
}
function isStartAmount(n: string) {
  return n === t('searchEngine.startAmount') || n === '起始金额'
}
function isEndAmount(n: string) {
  return n === t('searchEngine.endAmount') || n === '结束金额'
}

const props = defineProps({
  dats: {
    type: Array as any,
    default: () => [],
  },
  history: {
    type: Boolean,
    default: false,
  },
  /** 是否在搜索框右侧显示「刷新」按钮（点击触发 refresh 事件，由页面绑定拉数逻辑） */
  showRefresh: {
    type: Boolean,
    default: true,
  },
  /** 表格列显隐：列配置（key/label），由页面传入 */
  tableColumns: {
    type: Array as any,
    default: () => [],
  },
  /** 表格列显隐：localStorage key（默认 route.name） */
  tableColumnsStorageKey: {
    type: String,
    default: '',
  },
  /** 是否显示列显隐按钮 */
  showColumnsToggle: {
    type: Boolean,
    default: false,
  },
  /** 初始化时是否主动触发一次 handlesousuos（未开 history 时用；开了 history 时默认也会在挂载时 emit 一次） */
  emitOnInit: {
    type: Boolean,
    default: false,
  },
})

const inputWrapRef = ref<HTMLElement | null>(null)
const mainPanelStyle = ref<Record<string, string>>({})
const timePanelStyle = ref<Record<string, string>>({})
const editPanelStyle = ref<Record<string, string>>({})

/** 浮层定位在参照元素下方（fixed），避免随页面滚动错位；用于主下拉/时间面板/编辑面板 */
function placePanelUnder(el: HTMLElement, opts?: { minWidth?: number; maxWidth?: number }) {
  const rect = el.getBoundingClientRect()
  const minWidth = opts?.minWidth ?? 220
  const maxWidth = opts?.maxWidth ?? 600
  const viewportMaxWidth = Math.max(220, window.innerWidth - 16)
  const clampedMaxWidth = Math.min(maxWidth, viewportMaxWidth)
  const clampedMinWidth = Math.min(minWidth, clampedMaxWidth)
  const width = Math.max(clampedMinWidth, Math.min(clampedMaxWidth, rect.width))
  const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8)
  const top = Math.max(8, Math.min(rect.bottom + 6, Math.max(8, window.innerHeight - 320)))
  return {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    zIndex: '3000',
  }
}

async function updateMainPos() {
  await nextTick()
  if (!inputWrapRef.value) return
  mainPanelStyle.value = placePanelUnder(inputWrapRef.value)
}
async function updateTimePos() {
  await nextTick()
  if (!inputWrapRef.value) return
  const base = placePanelUnder(inputWrapRef.value)
  /** 高于顶栏/标签栏常见层级，避免日期浮层被挡住 */
  timePanelStyle.value = { ...base, zIndex: '5200' }
}

/** 模板与 v-if：兼容 kiklis 为字符串或数字（配置/历史数据不一致时） */
function kiklisIsTimeRange(v: unknown) {
  return v === '2' || v === 2
}
function kiklisIsDualField(v: unknown) {
  return v === '3' || v === 3
}
async function updateEditPos() {
  await nextTick()
  const tagEl: HTMLElement | undefined = proxy?.$refs?.dianjisole?.[states.xiugaiIndex]?.$el
  if (!tagEl) return
  editPanelStyle.value = placePanelUnder(tagEl, { minWidth: 240, maxWidth: 520 })
}

/**
 * 核心状态（历史命名保留，便于对照旧逻辑）：
 * - tsoks：已选条件列表，对应界面 Tag
 * - moltit：当前正在操作的一条「维度」草稿（titval/vlvval/kiklis 等）
 * - teel / timeteels：主下拉面板 / 日期/双输入面板的显隐
 * - kpktes：true 表示下拉第一层（选字段）；false 表示已进入选值或多选
 * - nvklos / nvkloslist：当前维度下的选项列表；list 用于下拉筛选后的展示
 * - xiugai*：点击 Tag 进入行内编辑时的数据与面板
 */
const states = reactive<any>({
  checkAll: false,
  checkedCities: [],
  isIndeterminate: false,
  moltit: {
    titval: '',
    titvalName: '',
    vlvval: '',
    vlvvalName: '',
    kettipe: false,
    kiklis: '',
    cannotDelete: false,
  },
  input2: '',
  teel: false,
  kpktes: true,
  titleovers: '',
  kokops: false,
  kettipe: false,
  ketovtips: false,
  odertakes: [],
  memelous: [],
  tsoks: [],
  nvklos: [],
  nvkloslist: [],
  bastakes: false,
  sousjiaodis: false,
  xiugaiData: {},
  xiugaiboolers: false,
  xiugaiselect: [],
  xiugaiIndex: '',
  selectremote: false,
  timeteels: false,
})

// ---------- 表格列显隐（可选功能，与搜索逻辑独立） ----------
const colsPopover = ref(false)
const colsPopoverWidth = ref(360)
const colsSearch = ref('')
const colsSelected = ref<string[]>([])
const colsOrder = ref<string[]>([])
const colsDraggingKey = ref<string | null>(null)

function updateResponsiveMetrics() {
  if (typeof window === 'undefined') return
  colsPopoverWidth.value = Math.min(360, Math.max(248, window.innerWidth - 24))
}

function onWindowResize() {
  updateResponsiveMetrics()
  if (states.teel) void updateMainPos()
  if (states.timeteels) void updateTimePos()
  if (states.xiugaiboolers) void updateEditPos()
}

/** localStorage 前缀 + 页面自定义或路由名，避免多页配置互相覆盖 */
function colsStorageKey(): string {
  const k = props.tableColumnsStorageKey || String(route.name || 'table')
  return `se-cols:${k}`
}

/** 读取已保存的列选中与顺序，并向父组件派发一次 columns-change */
function initColsFromStorage() {
  if (!props.showColumnsToggle) return
  const allKeys = (props.tableColumns || []).map((c: any) => String(c.key ?? c.prop ?? c.value ?? ''))
    .filter(Boolean)
  const defaultKeys = (props.tableColumns || [])
    .filter((c: any) => c?.defaultVisible !== false)
    .map((c: any) => String(c.key ?? c.prop ?? c.value ?? ''))
    .filter((k: string) => allKeys.includes(k))
  colsOrder.value = [...allKeys]
  try {
    const raw = localStorage.getItem(colsStorageKey())
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const next = parsed.map((x) => String(x)).filter((x) => allKeys.includes(x))
        colsSelected.value = next.length ? next : (defaultKeys.length ? defaultKeys : allKeys)
      } else {
        colsSelected.value = defaultKeys.length ? defaultKeys : allKeys
      }
    } else {
      colsSelected.value = defaultKeys.length ? defaultKeys : allKeys
    }
  } catch {
    colsSelected.value = defaultKeys.length ? defaultKeys : allKeys
  }
  // order（可选）
  try {
    const oRaw = localStorage.getItem(`${colsStorageKey()}:order`)
    if (oRaw) {
      const arr = JSON.parse(oRaw)
      if (Array.isArray(arr)) {
        const next = arr.map((x) => String(x)).filter((x) => allKeys.includes(x))
        const rest = allKeys.filter((k: string) => !next.includes(k))
        colsOrder.value = [...next, ...rest]
      }
    }
  } catch {
    /* ignore */
  }
  emit('columns-change', orderedSelectedKeys())
}

/** 按用户拖拽后的顺序输出当前勾选列的 key（父组件渲染表格列顺序用） */
function orderedSelectedKeys(): string[] {
  const set = new Set(colsSelected.value)
  return colsOrder.value.filter((k) => set.has(k))
}

function persistCols() {
  try {
    localStorage.setItem(colsStorageKey(), JSON.stringify(colsSelected.value))
  } catch {
    /* ignore */
  }
  emit('columns-change', orderedSelectedKeys())
}

function colsSelectAll() {
  colsSelected.value = (props.tableColumns || [])
    .map((c: any) => String(c.key ?? c.prop ?? c.value ?? ''))
    .filter(Boolean)
  persistCols()
}

function colsReset() {
  try {
    localStorage.removeItem(colsStorageKey())
    localStorage.removeItem(`${colsStorageKey()}:order`)
  } catch {
    /* ignore */
  }
  colsSelectAll()
}

function colsToggle(key: string) {
  const idx = colsSelected.value.indexOf(key)
  if (idx >= 0) colsSelected.value.splice(idx, 1)
  else colsSelected.value.push(key)
  // 不允许全部关掉
  if (colsSelected.value.length === 0) colsSelectAll()
  persistCols()
}

function persistOrder() {
  try {
    localStorage.setItem(`${colsStorageKey()}:order`, JSON.stringify(colsOrder.value))
  } catch {
    /* ignore */
  }
  emit('columns-change', orderedSelectedKeys())
}

function onDragStart(k: string) {
  colsDraggingKey.value = k
}

function onDrop(toKey: string) {
  const fromKey = colsDraggingKey.value
  colsDraggingKey.value = null
  if (!fromKey || fromKey === toKey) return
  const fromIdx = colsOrder.value.indexOf(fromKey)
  const toIdx = colsOrder.value.indexOf(toKey)
  if (fromIdx < 0 || toIdx < 0) return
  const next = [...colsOrder.value]
  next.splice(fromIdx, 1)
  next.splice(toIdx, 0, fromKey)
  colsOrder.value = next
  persistOrder()
}

function colsKeyFor(c: any): string {
  return String(c.key ?? c.prop ?? c.value ?? '')
}

function colsLabelFor(c: any): string {
  return String(c.label ?? c.title ?? c.name ?? colsKeyFor(c))
}

function filteredCols(): any[] {
  const q = String(colsSearch.value || '').trim().toLowerCase()
  const byKey = new Map((props.tableColumns || []).map((c: any) => [colsKeyFor(c), c]))
  const list = colsOrder.value.map((k) => byKey.get(k)).filter(Boolean) as any[]
  if (!q) return list
  return list.filter((c: any) => colsLabelFor(c).toLowerCase().includes(q) || colsKeyFor(c).toLowerCase().includes(q))
}

onMounted(() => {
  initColsFromStorage()
})

/**
 * 初始化/重置搜索 UI：清空输入与 Tag，从 sessionStorage（按 route.name）恢复 history 条件，
 * 再根据 dats[].keys 等把应显示的 Tag 推入 tsoks，最后触发一次 handlesousuos。
 */
const bartouts = () => {
  states.input2 = ''
  states.titleovers = ''
  states.tsoks = []
  for (let key in states.moltit) states.moltit[key] = ''
  states.kpktes = true
  states.teel = false
  states.timeteels = false
  states.bastakes = false

  let keyName: any = null
  const historyRaw = props.history ? sessionStorage.getItem(route.name as any) : null
  if (historyRaw) {
    try {
      keyName = JSON.parse(historyRaw)
    } catch {
      keyName = null
    }
  }
  for (let i = 0; i < props.dats.length; i++) {
    if (keyName) {
      for (let keys in keyName) {
        if (props.dats[i].value == keys) {
          props.dats[i].keys = keyName[keys]
        } else if (keys == 'ketNames' && props.dats[i].value == keyName[keys].key) {
          if (Object.prototype.toString.call(keyName[keys].takename) === '[object Array]') {
            for (let k = 0; k < keyName[keys].takename.length; k++) {
              props.dats[i].children[k].value = keyName[keys].takename[k]
            }
          } else {
            props.dats[i].children[0].value = keyName[keys].takename
          }
          props.dats[i].keys = keyName[keys]
        }
      }
    }
    if (keyName) props.dats[i].TemporaryConditions = false
    if (
      (props.dats[i].cannotDelete ||
        props.dats[i].keys ||
        props.dats[i].keys === 0 ||
        props.dats[i].TemporaryConditions) &&
      !props.dats[i].changeOne
    ) {
      let vlvval: any = ''
      let vlvvalName: any = ''
      const databas: any[] = []
      let takename: any = null

      if (props.dats[i].kiklis == '2' || props.dats[i].kiklis == '3') {
        for (let k = 0; k < props.dats[i].children.length; k++) {
          if (props.dats[i].children[k].value) databas.push(props.dats[i].children[k].value)
        }
        vlvvalName = databas.join('-')
        vlvval = databas
        if (databas.length < 2) takename = props.dats[i].children[0].name
      }

      if (props.dats[i].kiklis == '0') {
        states.xiugaiData.vlvval = props.dats[i].keys
        for (let k = 0; k < props.dats[i].children.length; k++) {
          if (props.dats[i].keys == props.dats[i].children[k].value) vlvvalName = props.dats[i].children[k].title
        }
        vlvval = props.dats[i].keys
      }

      if (props.dats[i].kiklis == '1') {
        vlvvalName = props.dats[i].keys
        vlvval = props.dats[i].keys
      }

      states.tsoks.push({
        titval: props.dats[i].value,
        titvalName: props.dats[i].title,
        vlvval,
        vlvvalName,
        kettipe: props.dats[i].kettipe,
        kiklis: props.dats[i].kiklis,
        cannotDelete: props.dats[i].cannotDelete,
        takename: takename ? takename : null,
      })
    }
  }
  /**
   * - emitOnInit：父页约定由搜索条触发首查
   * - historyRaw：从 session 恢复了条件，必须同步给父页
   * - history：首查统一由本组件 emit，父页不要再 onMounted 重复拉列表（避免双请求）
   */
  if (props.emitOnInit || historyRaw || props.history) {
    handlesousuoxjm()
  }
}

/** 主输入框输入：remote 模式转发父组件；否则在下拉选项里做前端过滤 nvkloslist */
const handleInputes = (val: any) => {
  if (states.selectremote) {
    emit('handleInputes', val)
    return false
  }
  if (states.moltit.kiklis == '0' && !states.moltit.kettipe) {
    const newArror = JSON.parse(JSON.stringify(states.nvklos))
    const mis = newArror.filter((res: any) => res.title.indexOf(val) != -1)
    states.nvkloslist = mis
  }
}

/** 一键清空输入与当前维度选择状态，并重新打开第一层下拉 */
const handleQinChu = () => {
  states.ketovtips = true
  states.bastakes = false
  states.teel = true
  states.timeteels = false
  updateMainPos()
  states.input2 = ''
  states.titleovers = ''
  states.moltit.titval = ''
  states.moltit.titvalName = ''
  states.moltit.kiklis = ''
  states.kpktes = true
  void nextTick(() => {
    const input = proxy?.$refs?.inputUis?.$refs?.input as HTMLInputElement | undefined
    input?.focus?.()
  })
}

onMounted(() => {
  // 默认打开开关：如果没显式给 switch，按 true 处理
  props.dats.forEach((d: any) => {
    if (d.switch === undefined) d.switch = true
  })
  bartouts()
  updateResponsiveMetrics()
  window.addEventListener('resize', onWindowResize)
  document.addEventListener('pointerdown', onDocPointerDownCloseMainPanel, true)
})

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
  document.removeEventListener('pointerdown', onDocPointerDownCloseMainPanel, true)
})

/** 未启用 disabledBooler 时也必须传函数；传 '' 会导致 Element Plus 报 disabledDate is not a function */
const disabledDateNone = (_time: Date) => false

/** 日期区间：开始侧 disabled-date（可与子项 disabledDate 天数配合） */
const disabledDate = (time: Date) => {
  let date = Date.now()
  if (states.timeteels && states.nvklos[0]?.disabledDate) {
    date = Date.now() - 3600 * 1000 * 24 * parseInt(states.nvklos[0].disabledDate)
  }
  if (states.xiugaiboolers && states.xiugaiselect[0]?.disabledDate) {
    date = Date.now() - 3600 * 1000 * 24 * parseInt(states.xiugaiselect[0].disabledDate)
  }
  return time.getTime() > date
}

/** 日期区间：结束侧 */
const disabledDateend = (time: Date) => {
  let date = Date.now()
  if (states.timeteels && states.nvklos[1]?.disabledDate) {
    date = Date.now() - 3600 * 1000 * 24 * parseInt(states.nvklos[1].disabledDate)
  }
  if (states.xiugaiboolers && states.xiugaiselect[1]?.disabledDate) {
    date = Date.now() - 3600 * 1000 * 24 * parseInt(states.xiugaiselect[1].disabledDate)
  }
  return time.getTime() > date
}

/** 关闭某条已选 Tag：多选时同步子项 checkAll、不可删则提示，并刷新查询与 session */
const handletagclose = (item: any, inx: number) => {
  states.xiugaiboolers = false
  if (item.kettipe && item.kiklis == '0') {
    for (let i = 0; i < props.dats.length; i++) {
      if (item.titval == props.dats[i].value) {
        for (let k = 0; k < props.dats[i].children.length; k++) {
          if (item.vlvval == props.dats[i].children[k].value) props.dats[i].children[k].checkAll = false
        }
      }
    }
  }
  if (item.cannotDelete) {
    toast(t('searchEngine.requiredNoDelete'))
    return
  }
  states.tsoks.splice(inx, 1)
  if (states.tsoks.length == 0) sessionStorage.removeItem(route.name as any)
  handlesousuoxjm()
}

/** 点击某个 Tag：打开编辑浮层，填入 xiugaiData / xiugaiselect */
const handledianjisbes = (data: any, inx: number) => {
  const datase = JSON.parse(JSON.stringify(data))
  states.xiugaiData = datase
  states.xiugaiIndex = inx
  if (data.kiklis == '0' || data.kiklis == '2' || data.kiklis == '3') {
    for (let i = 0; i < props.dats.length; i++) {
      if (props.dats[i].value == data.titval) {
        if (props.dats[i].change) {
          props.dats[i].children.forEach((item: any) => {
            item.change = props.dats[i].change
            item.changetitle = props.dats[i].changetitle
          })
        }
        states.xiugaiselect = props.dats[i].children
      }
    }
  }
  states.xiugaiboolers = true
  updateEditPos()
  document.addEventListener('click', (e) => handledianjis(e))
}

/** 取消日期/数字区间面板 */
const handleoptaserrortimes = () => {
  states.bastakes = false
  states.teel = false
  states.timeteels = false
  states.kpktes = true
  states.titleovers = ''
  states.moltit.titval = ''
  states.moltit.titvalName = ''
  states.moltit.kiklis = ''
  states.nvkloslist = []
  states.nvklos = []
  proxy?.$refs?.inputUis?.$refs?.input?.blur?.()
}

/** 文档点击：编辑浮层打开时更新位置；点击浮层外则关闭编辑面板 */
const handledianjis = (e: any) => {
  if (states.xiugaiboolers) updateEditPos()
  if (targetInsideDatePickerPopper(e.target)) return
  if (
    proxy.$refs.dianjiChange &&
    !proxy.$refs.dianjiChange.contains(e.target) &&
    proxy.$refs.dianjisole[states.xiugaiIndex].$el &&
    !proxy.$refs.dianjisole[states.xiugaiIndex].$el.contains(e.target)
  ) {
    states.xiugaiboolers = false
  }
}

/** 编辑面板里下拉变更：写回显示名并走与点选子项相同的后续逻辑 */
const handleselectover = (item: any) => {
  for (let i = 0; i < states.xiugaiselect.length; i++) {
    if (states.xiugaiselect[i].value == item) {
      states.xiugaiData.vlvval = item
      states.xiugaiData.vlvvalName = states.xiugaiselect[i].title
      if (states.xiugaiselect[i].change) {
        states.moltit.change = states.xiugaiselect[i].change
        states.moltit.changetitle = states.xiugaiselect[i].changetitle
      }
      handlevckoi(states.xiugaiselect[i], false)
    }
  }
}

/** 编辑面板确认：合并回 tsoks 并 handlesousuoxjm */
const handleoptestkle = () => {
  states.xiugaiboolers = false
  if (states.tsoks[states.xiugaiIndex].kiklis == '0' && states.tsoks[states.xiugaiIndex].vlvval == states.xiugaiData.vlvval)
    return false
  if (states.tsoks[states.xiugaiIndex].kiklis == '1' && states.tsoks[states.xiugaiIndex].vlvvalName == states.xiugaiData.vlvvalName)
    return false

  if (states.xiugaiData.kettipe) {
    const pen: number[] = []
    states.tsoks[states.xiugaiIndex] = states.xiugaiData
    for (let i = 0; i < states.tsoks.length; i++) {
      if (states.xiugaiData.kiklis == '1') {
        if (states.xiugaiData.titvalName == states.tsoks[i].titvalName && states.xiugaiData.vlvvalName == states.tsoks[i].vlvvalName) pen.push(i)
      } else {
        if (states.xiugaiData.titvalName == states.tsoks[i].titvalName && states.xiugaiData.vlvval == states.tsoks[i].vlvval) pen.push(i)
      }
    }
    if (pen.length > 1) states.tsoks.splice(pen[0], 1)
  } else {
    if (states.tsoks[states.xiugaiIndex].kiklis == '2' || states.tsoks[states.xiugaiIndex].kiklis == '3') {
      const datys: any[] = []
      let names = ''
      let basName = ''
      for (let i = 0; i < states.xiugaiselect.length; i++) {
        if (states.xiugaiselect[i].value) {
          datys.push(states.xiugaiselect[i].value)
          names = states.xiugaiselect[i].nvName
          basName = states.xiugaiselect[i].name
        }
      }
      let tageName = ''
      if (datys.length < 2) {
        tageName = isStartTime(names)
          ? '≥' + datys.join()
          : isEndTime(names)
            ? '≤' + datys.join()
            : datys.join()
      } else {
        tageName = datys.join('-')
      }
      if (states.xiugaiData.vlvvalName == tageName) return
      states.xiugaiData.takename = datys.length < 2 ? basName : ''
      states.xiugaiData.vlvval = datys
      states.xiugaiData.vlvvalName = tageName
    }
    states.tsoks[states.xiugaiIndex] = states.xiugaiData
  }
  handlesousuoxjm()
}

/** 主输入失焦收尾：标记非聚焦；若未点在时间面板上则收起主下拉/时间面板 */
const blurfunsd = () => {
  states.sousjiaodis = false
  if (!states.bastakes) {
    states.teel = false
    states.timeteels = false
  }
}

/**
 * Tag 集合变化后的总出口：把 tsoks 转成父组件需要的扁平对象。
 * 若存在 kettipe 多选且多条，会先按 titval 分组合并再交给 codeData。
 */
const handlesousuoxjm = () => {
  const yelans3 = arrayToMap(states.tsoks, 'titval')
  const linhuas3 = mapToArray(yelans3 as any)
  for (let i = 0; i < states.tsoks.length; i++) {
    if (states.tsoks[i].kettipe && states.tsoks.length > 1) {
      codeData(linhuas3, true)
      return
    }
  }
  codeData(states.tsoks, false)
}

/**
 * 将 Tag 列表编码为查询对象 froms，并 emit handlesousuos；
 * history 时把 fromlists 写入 sessionStorage（含日期区间 ketNames 等特殊结构）。
 * @param ket true 表示 data 为按字段分组后的二维数组（多选合并场景）
 */
const codeData = (data: any, ket: boolean) => {
  const froms: any = {}
  const fromlists: any = {}
  if (ket) {
    for (let i = 0; i < data.length; i++) {
      if (data[i].length > 1) {
        const jk: any[] = []
        for (let k = 0; k < data[i].length; k++) {
          if (data[i][k].kiklis == '0') jk.push(data[i][k].vlvval)
          else jk.push(data[i][k].vlvvalName)
        }
        froms[data[i][0].titval] = jk.join()
        fromlists[data[i][0].titval] = jk.join()
      } else {
        if (data[i][0].kiklis == '0') {
          froms[data[i][0].titval] = data[i][0].vlvval
          fromlists[data[i][0].titval] = data[i][0].vlvval
        } else if (data[i][0].kiklis == '2') {
          if (data[i][0].vlvval.length <= 1) {
            froms[data[i][0].takename] = data[i][0].vlvval[0]
            fromlists['ketNames'] = { takename: data[i][0].vlvval[0], key: data[i][0].titval }
          } else {
            for (let j = 0; j < props.dats.length; j++) {
              if (props.dats[j].value == data[i][0].titval) {
                froms[props.dats[j].children[0].name] = data[i][0].vlvval[0]
                froms[props.dats[j].children[1].name] = data[i][0].vlvval[1]
                fromlists['ketNames'] = { takename: [data[i][0].vlvval[0], data[i][0].vlvval[1]], key: data[i][0].titval }
              }
            }
          }
        } else {
          froms[data[i][0].titval] = data[i][0].vlvvalName
          fromlists[data[i][0].titval] = data[i][0].vlvvalName
        }
      }
    }
  } else {
    for (let i = 0; i < data.length; i++) {
      if (data[i].kiklis == '0') {
        froms[data[i].titval] = data[i].vlvval
        fromlists[data[i].titval] = data[i].vlvval
      } else if (data[i].kiklis == '2' || data[i].kiklis == '3') {
        if (data[i].vlvval.length <= 1) {
          froms[data[i].takename] = data[i].vlvval[0]
          fromlists['ketNames'] = { takename: data[i].vlvval[0], key: data[i].titval }
        } else {
          for (let j = 0; j < props.dats.length; j++) {
            if (props.dats[j].value == data[i].titval) {
              froms[props.dats[j].children[0].name] = data[i].vlvval[0]
              froms[props.dats[j].children[1].name] = data[i].vlvval[1]
              fromlists['ketNames'] = { takename: [data[i].vlvval[0], data[i].vlvval[1]], key: data[i].titval }
            }
          }
        }
      } else {
        froms[data[i].titval] = data[i].vlvvalName
        fromlists[data[i].titval] = data[i].vlvvalName
      }
    }
  }
  emit('handlesousuos', froms)
  if (Object.getOwnPropertyNames(fromlists).length != 0 && props.history) {
    sessionStorage.setItem(route.name as any, JSON.stringify(fromlists))
  }
}

/** 主输入聚焦：展开主下拉；若当前维度是日期/双输入则走 timeteels 面板 */
const handletexsfocus = () => {
  states.sousjiaodis = true
  const rangeDim =
    kiklisIsTimeRange(states.moltit.kiklis) || kiklisIsDualField(states.moltit.kiklis)
  const allowOpen =
    states.titleovers == '' ||
    states.titleovers == null ||
    !states.kpktes ||
    (rangeDim && !!states.titleovers)
  if (allowOpen) {
    if (rangeDim) {
      states.bastakes = true
      states.kpktes = false
      states.timeteels = true
      states.teel = false
      void updateTimePos()
      document.addEventListener('click', (e) => handleopsddeas(e))
    } else {
      states.teel = true
      void updateMainPos()
    }
  }
}

/** 捕获阶段先标记，避免输入框晚到的 blur 在打开日期/区间浮层后立刻把 timeteels 关掉 */
const handleTimePanelMouseDownCapture = () => {
  states.bastakes = true
}

/** Element Plus 日期面板 teleported 到 body 后，点击目标不在 oderchenks 内，需单独判断 */
function targetInsideDatePickerPopper(target: EventTarget | null) {
  let el = target as HTMLElement | null
  while (el) {
    if (el.classList?.contains('el-picker__popper')) return true
    el = el.parentElement
  }
  return false
}

/** 列显隐等 el-popover / 其它 teleported 浮层：点击其内部不应误关主筛选面板 */
function targetInsideElPopper(target: EventTarget | null) {
  let el = target as HTMLElement | null
  while (el) {
    if (el.classList?.contains('el-popper')) return true
    el = el.parentElement
  }
  return false
}

/**
 * 主筛选下拉（teel）仅在输入框 blur 时关闭；点清除(X) 会先 blur 再执行 click，
 * 会出现「面板仍打开但输入框已无焦点」，后续点击页面不再触发 blur → 面板卡死。
 * 在捕获阶段检测：点击发生在输入条 + 主面板 + 各类浮层之外则收起并复位草稿维度。
 */
function onDocPointerDownCloseMainPanel(e: PointerEvent) {
  if (!states.teel || states.timeteels) return
  if (states.xiugaiboolers) return
  const target = e.target
  if (!(target instanceof Node)) return
  if (inputWrapRef.value?.contains(target)) return
  const mainEl = proxy?.$refs?.odetest as HTMLElement | undefined
  if (mainEl?.contains(target)) return
  if (targetInsideDatePickerPopper(target)) return
  if (targetInsideElPopper(target)) return

  states.teel = false
  states.bastakes = false
  states.kpktes = true
  states.titleovers = ''
  states.moltit.titval = ''
  states.moltit.titvalName = ''
  states.moltit.kiklis = ''
  states.nvkloslist = []
  states.nvklos = []
}

/** 点击文档其它区域时关闭时间面板（需区分点击在面板内） */
const handleopsddeas = (e: any) => {
  const inPanel = proxy.$refs.oderchenks && proxy.$refs.oderchenks.contains(e.target)
  if (inPanel || targetInsideDatePickerPopper(e.target)) states.bastakes = true
  else {
    states.bastakes = false
    if (!states.sousjiaodis) blurfunsd()
  }
}

/** 主输入内容变化：记录是否「曾经有内容」，供退格删空时区分清维度还是删最后一条 Tag */
const handlessoverbak = () => {
  states.ketovtips = !(states.input2 == '' || states.input2 == null)
}

/** 主输入退格且当前为空：先清已选维度标题；否则删除最后一条 Tag（尊重 cannotDelete） */
const hanleovbackspace = () => {
  if (states.input2 == '' || states.input2 == null) {
    if (states.ketovtips) {
      states.teel = true
      states.timeteels = false
      if (states.titleovers != '') {
        states.titleovers = ''
        states.moltit.titval = ''
        states.moltit.titvalName = ''
        states.moltit.kiklis = ''
        states.kpktes = true
      } else {
        if (states.tsoks[states.tsoks.length - 1]?.cannotDelete) return
        states.tsoks.splice(states.tsoks.length - 1, 1)
        handlesousuoxjm()
      }
    }
  }
}

/** 判断某 titval + 展示名 是否已在 tsoks（用于回车去重） */
const hioslopsName = (key: any, val: any) => {
  for (let l = 0; l < states.tsoks.length; l++) {
    if (states.tsoks[l].titval == key && states.tsoks[l].vlvvalName == val) return
  }
  return 2
}

/** 主输入回车：对 tesvalue 维度写入文本条件，或合并已有同维度 Tag */
const handleqiekes = () => {
  if (states.input2) {
    if (states.titleovers == '' || states.titleovers == null) {
      for (let i = 0; i < props.dats.length; i++) {
        if (props.dats[i].tesvalue) {
          states.moltit.titval = props.dats[i].value
          states.moltit.titvalName = props.dats[i].title
          states.moltit.kiklis = props.dats[i].kiklis
          states.moltit.kettipe = false
        }
      }
    }
    if (states.moltit.kiklis == '2') {
      void seAlert.open({
        title: t('common.tip'),
        message: t('searchEngine.unsupportedTimeFormat'),
        showCancel: false,
        confirmText: t('common.confirm'),
      })
      return false
    }
    if (states.moltit.kiklis == '0') {
      void seAlert.open({
        title: t('common.tip'),
        message: t('searchEngine.unsupportedOption'),
        showCancel: false,
        confirmText: t('common.confirm'),
      })
      return false
    }
    states.moltit.vlvvalName = states.input2
    states.input2 = ''
    states.teel = false
    proxy?.$refs?.inputUis?.$refs?.input?.blur?.()
    states.kpktes = true
    states.titleovers = ''
    const tase = JSON.parse(JSON.stringify(states.moltit))
    for (let i = 0; i < states.tsoks.length; i++) {
      if (states.tsoks[i].titval == tase.titval) {
        if (tase.kettipe) {
          if (hioslopsName(tase.titval, tase.vlvvalName) == undefined) return false
          states.tsoks.push(tase)
          handlesousuoxjm()
          return false
        }
        states.tsoks.splice(i, 1, tase)
        handlesousuoxjm()
        return false
      }
    }
    states.tsoks.push(tase)
    handlesousuoxjm()
  }
}

/** 阻止输入框关联的默认表单提交行为（避免回车触发整页提交） */
const handletest = (event: any) => {
  event.preventDefault()
}

/** 对外暴露：清空会话与条件，相当于重置搜索条（见 defineExpose） */
const switchos = () => {
  sessionStorage.removeItem(route.name as any)
  for (let i = 0; i < props.dats.length; i++) {
    if (!props.dats[i].cannotDelete && props.dats[i].keys) props.dats[i].keys = null
  }
  bartouts()
  if (!props.emitOnInit) handlesousuoxjm()
}

/** 第一层下拉：用户点选某个筛选维度，切换到选值/多选/日期面板 */
const handleovers = (item: any) => {
  if (item.change) {
    states.moltit.change = item.change
    states.moltit.changetitle = item.changetitle
  }
  if (item.changeOne) emit(item.changeOne, item)
  states.titleovers = item.title
  states.moltit.titval = item.value
  states.moltit.titvalName = item.title
  states.moltit.kettipe = item.kettipe
  states.moltit.kiklis = item.kiklis
  states.moltit.cannotDelete = item.cannotDelete

  if (item.kiklis == '2' || item.kiklis == '3') {
    /**
     * 保持 bastakes 为 true，直到用户在 document 上点外部（handleopsddeas 置 false）。
     * 切勿用 setTimeout 提前清 bastakes：否则晚到的 input blur 会立刻关掉 timeteels，浮层「永远弹不出」。
     */
    states.bastakes = true
    states.teel = false
    states.timeteels = true
    states.kpktes = false
    states.nvklos = item.children
    void updateTimePos()
    document.addEventListener('click', (e) => handleopsddeas(e))
  } else if (item.children && item.children.length > 0) {
    states.nvklos = item.children
    states.kpktes = false
    states.kettipe = item.kettipe
    updateMainPos()
  } else {
    states.teel = false
    if (item.kiklis == '0' && item.children && item.children.length == 0) {
      states.teel = true
      states.kpktes = false
      updateMainPos()
    }
  }

  if (item.kettipe) {
    for (let i = 0; i < states.nvklos.length; i++) {
      if (states.nvklos[i].checkAll) {
        states.isIndeterminate = true
        states.checkAll = false
      }
    }
    if (states.nvklos.every((x: any) => x.checkAll === true)) {
      states.isIndeterminate = false
      states.checkAll = true
    }
    if (states.nvklos.every((x: any) => x.checkAll === false)) {
      states.isIndeterminate = false
      states.checkAll = false
    }
  }
  states.nvkloslist = states.nvklos
}

/**
 * 选中某一子选项：inx 为 true 时落一条 Tag 并关闭下拉；
 * 若配置了 moltit.change 则向父组件 emit 自定义事件（联动其它逻辑）
 */
const handlevckoi = (item: any, inx: boolean) => {
  if (states.moltit.change) {
    emit(states.moltit.change, { data: item, title: states.moltit.changetitle })
    delete states.moltit.change
  }
  if (inx) {
    states.teel = false
    proxy?.$refs?.inputUis?.$refs?.input?.blur?.()
    states.kpktes = true
    states.moltit.vlvval = item.value
    states.moltit.vlvvalName = item.title
    states.titleovers = ''
    const tase = JSON.parse(JSON.stringify(states.moltit))
    for (let i = 0; i < states.tsoks.length; i++) {
      if (states.tsoks[i].titval == tase.titval) {
        if (states.tsoks[i].vlvvalName != tase.vlvvalName) {
          states.tsoks.splice(i, 1, tase)
          handlesousuoxjm()
        }
        return false
      }
    }
    states.tsoks.push(tase)
    states.nvklos = []
    states.moltit.kiklis = ''
    handlesousuoxjm()
  }
}

/** 多选面板：全选/取消全选 */
const handlemlers = () => {
  states.checkAll = !states.checkAll
  states.isIndeterminate = false
  states.nvklos.forEach((item: any) => (item.checkAll = states.checkAll))
}

/** 多选列表中单条勾选切换，并维护全选 / 半选（isIndeterminate）状态 */
const handlempchink = (its: any) => {
  its.checkAll = !its.checkAll
  for (let i = 0; i < states.nvklos.length; i++) {
    if (states.nvklos[i].checkAll) {
      states.isIndeterminate = true
      states.checkAll = false
    }
  }
  if (states.nvklos.every((x: any) => x.checkAll === true)) {
    states.isIndeterminate = false
    states.checkAll = true
  }
  if (states.nvklos.every((x: any) => x.checkAll === false)) {
    states.isIndeterminate = false
    states.checkAll = false
  }
}

/** 多选面板取消 */
const handleoptaserror = () => {
  states.teel = false
  states.kpktes = true
  states.titleovers = ''
  states.moltit.titval = ''
  states.moltit.titvalName = ''
  states.moltit.kiklis = ''
  states.nvkloslist = []
  states.nvklos = []
  proxy?.$refs?.inputUis?.$refs?.input?.blur?.()
}

/** 判断某 titval + 选项 value 是否已在 tsoks（多选确定时去重） */
const hioslops = (key: any, val: any) => {
  for (let l = 0; l < states.tsoks.length; l++) {
    if (states.tsoks[l].titval == key && states.tsoks[l].vlvval == val) return
  }
  return 2
}

/** 多选面板确定：按勾选批量增删 Tag */
const handleoptasOk = () => {
  const tase = JSON.parse(JSON.stringify(states.moltit))
  for (let i = 0; i < states.nvklos.length; i++) {
    if (states.nvklos[i].checkAll) {
      if (hioslops(tase.titval, states.nvklos[i].value) == undefined) continue
      states.tsoks.push({
        titval: tase.titval,
        titvalName: tase.titvalName,
        vlvval: states.nvklos[i].value,
        vlvvalName: states.nvklos[i].title,
        kiklis: tase.kiklis,
        kettipe: true,
      })
    } else {
      for (let k = 0; k < states.tsoks.length; k++) {
        if (states.tsoks[k].titval == tase.titval && states.tsoks[k].vlvval == states.nvklos[i].value) states.tsoks.splice(k, 1)
      }
    }
  }
  states.teel = false
  proxy?.$refs?.inputUis?.$refs?.input?.blur?.()
  states.kpktes = true
  states.titleovers = ''
  handlesousuoxjm()
}

/** 日期/时间区间面板确定 → 生成一条 Tag（含 takename、区间展示名） */
const handletimerstimes = () => {
  const tase = JSON.parse(JSON.stringify(states.moltit))
  const tatle: any[] = []
  let tytls = ''
  let tytlsName = ''
  for (let i = 0; i < states.nvklos.length; i++) {
    if (states.nvklos[i].value) {
      tatle.push(states.nvklos[i].value)
      tytls = states.nvklos[i].nvName
      tytlsName = states.nvklos[i].name
    }
  }
  const taslaber = {
    titval: tase.titval,
    titvalName: tase.titvalName,
    vlvval: tatle,
    vlvvalName:
      tatle.length > 1
        ? tatle.join('-')
        : isStartTime(tytls)
          ? '≥' + tatle.join()
          : isEndTime(tytls)
            ? '≤' + tatle.join()
            : tatle.join(),
    kiklis: tase.kiklis,
    takename: tatle.length < 2 ? tytlsName : '',
    cannotDelete: tase.cannotDelete,
  }

  states.moltit.kiklis = ''
  states.teel = false
  states.timeteels = false
  states.bastakes = false
  proxy?.$refs?.inputUis?.$refs?.input?.blur?.()
  states.kpktes = true
  states.titleovers = ''
  if (tatle.length == 0) return
  for (let l = 0; l < states.tsoks.length; l++) {
    if (states.tsoks[l].titval == tase.titval) {
      states.tsoks.splice(l, 1, taslaber)
      handlesousuoxjm()
      return
    }
  }
  states.tsoks.push(taslaber)
  handlesousuoxjm()
}

/** kiklis=3 双输入区间确定（金额起止等） */
const handletimerstimesInput = () => {
  const tase = JSON.parse(JSON.stringify(states.moltit))
  const tatle: any[] = []
  let tytls = ''
  let tytlsName = ''
  for (let i = 0; i < states.nvklos.length; i++) {
    if (states.nvklos[i].value) {
      tatle.push(states.nvklos[i].value)
      tytls = states.nvklos[i].nvName
      tytlsName = states.nvklos[i].name
    }
  }
  const taslaber = {
    titval: tase.titval,
    titvalName: tase.titvalName,
    vlvval: tatle,
    vlvvalName:
      tatle.length > 1
        ? tatle.join('-')
        : isStartAmount(tytls)
          ? '≥' + tatle.join()
          : isEndAmount(tytls)
            ? '≤' + tatle.join()
            : tatle.join(),
    kiklis: tase.kiklis,
    takename: tatle.length < 2 ? tytlsName : '',
    cannotDelete: tase.cannotDelete,
  }

  states.moltit.kiklis = ''
  states.teel = false
  states.timeteels = false
  states.bastakes = false
  proxy?.$refs?.inputUis?.$refs?.input?.blur?.()
  states.kpktes = true
  states.titleovers = ''
  if (tatle.length == 0) return
  for (let l = 0; l < states.tsoks.length; l++) {
    if (states.tsoks[l].titval == tase.titval) {
      states.tsoks.splice(l, 1, taslaber)
      handlesousuoxjm()
      return
    }
  }
  states.tsoks.push(taslaber)
  handlesousuoxjm()
}

/** 父组件可调用：替换某维度下的 children 选项（如异步拉枚举后刷新下拉） */
const chouend = (data: any) => {
  for (let i = 0; i < props.dats.length; i++) {
    if (props.dats[i].value == data.titval) {
      props.dats[i].children = data.val
      if (data.type == 'changeOne') states.nvkloslist = data.val
    }
  }
}

defineExpose({
  switchos, // 重置搜索条 + session
  chouend, // 自外部更新某维度的选项列表
})
</script>

<style scoped>
.int-out {
  position: relative;
  isolation: isolate;
}

.int-out::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(91, 92, 240, 0.28),
    rgba(64, 158, 255, 0.22),
    rgba(91, 92, 240, 0.28)
  );
  opacity: 0.25;
  z-index: -1;
}

.int-out::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: radial-gradient(
      120px 80px at 20% 50%,
      rgba(64, 158, 255, 0.12),
      transparent 65%
    ),
    radial-gradient(
      140px 90px at 80% 50%,
      rgba(91, 92, 240, 0.10),
      transparent 66%
    );
  opacity: 0.35;
  z-index: -1;
  pointer-events: none;
}

.int-out {
  width: 100%;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

/* ---- columns toggle (fun + modern) ---- */
.se-cols {
  padding: 2px;
}

.se-cols__top {
  padding: 10px 10px 12px;
  border-radius: 14px;
  background:
    radial-gradient(220px 120px at 12% 0%, rgba(64, 158, 255, 0.20), transparent 60%),
    radial-gradient(240px 140px at 88% 0%, rgba(91, 92, 240, 0.18), transparent 58%),
    color-mix(in srgb, var(--el-bg-color) 92%, var(--el-color-primary) 8%);
  border: 1px solid color-mix(in srgb, var(--el-border-color-lighter) 70%, var(--el-color-primary) 30%);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
}

.se-cols__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.se-cols__titleText {
  font-weight: 700;
  color: var(--el-text-color-primary);
  letter-spacing: 0.2px;
}

.se-cols__badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  color: var(--el-color-primary);
  background: rgba(64, 158, 255, 0.10);
  border: 1px solid rgba(64, 158, 255, 0.22);
}

.se-cols__tools {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.se-cols__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.se-cols__list {
  margin-top: 10px;
  padding: 8px;
  border-radius: 14px;
  max-height: 290px;
  overflow: auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  background: color-mix(in srgb, var(--el-bg-color) 96%, #000 4%);
  border: 1px solid var(--el-border-color-lighter);
}

.se-cols__row {
  display: grid;
  grid-template-columns: 34px 1fr;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border-radius: 12px;
  border: 1px solid transparent;
  transition: transform 0.12s ease, border-color 0.12s ease, background 0.12s ease;
}

.se-cols__row:hover {
  transform: translateY(-1px);
  border-color: var(--el-color-primary-light-7);
  background: var(--el-color-primary-light-9);
}

.se-cols__drag {
  height: 34px;
  width: 34px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-blank);
  cursor: grab;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
}

.se-cols__drag:active {
  cursor: grabbing;
}

.se-cols__main {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
  background: color-mix(in srgb, var(--el-bg-color) 90%, var(--el-color-primary) 10%);
  cursor: pointer;
  text-align: left;
}

.se-cols__check {
  width: 34px;
  height: 20px;
  border-radius: 999px;
  background: var(--el-fill-color-dark);
  position: relative;
  flex-shrink: 0;
  border: 1px solid var(--el-border-color-lighter);
  transition: background 0.15s ease, border-color 0.15s ease;
}

.se-cols__check::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  transform: translateY(-50%);
  background: var(--el-bg-color);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
  transition: left 0.16s ease;
}

.se-cols__row.is-on .se-cols__check {
  background: var(--el-color-primary);
  border-color: color-mix(in srgb, var(--el-color-primary) 70%, #fff 30%);
}

.se-cols__row.is-on .se-cols__check::after {
  left: 16px;
}

.se-cols__label {
  color: var(--el-text-color-primary);
  font-size: 13px;
  line-height: 1.3;
  word-break: break-word;
}

.se-cols__hint {
  margin-top: 10px;
  padding: 0 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.4;
}

@media (min-width: 520px) {
  .se-cols__list {
    grid-template-columns: 1fr 1fr;
  }
}

.ko-s {
  display: flex;
  justify-content: flex-end;
  flex-wrap: nowrap;
  align-items: center;
  padding: 0 !important;
  gap: 10px;
  overflow: visible;
}

.se-refresh {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 999px !important;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08) inset;
}

.se-refresh:hover {
  color: var(--el-color-primary);
  border-color: rgba(64, 158, 255, 0.35);
  background: rgba(64, 158, 255, 0.08);
}

.inputouts {
  position: relative;
  width: 100%;
  flex: 1;
  min-width: 240px;
  overflow: visible;
}

.select-out {
  position: fixed;
  min-width: 220px;
  max-width: 600px;
  max-height: 320px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
  z-index: 3000;
  background-color: rgba(255, 255, 255, 0.98);
  border-radius: 14px;
  box-shadow:
    0 20px 48px rgba(16, 24, 40, 0.14),
    0 0 0 1px rgba(255, 255, 255, 0.6) inset;
  backdrop-filter: blur(12px);
  transform-origin: 20px 0;
  animation: se-pop 160ms ease-out both;
}

/** 主搜索：条件列表（与圆角输入框视觉统一） */
.se-panel--dropdown {
  padding: 0;
  max-height: 380px;
  display: flex;
  flex-direction: column;
}

.se-dropdown-head {
  flex-shrink: 0;
  padding: 12px 14px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(
    180deg,
    rgba(64, 158, 255, 0.07),
    rgba(255, 255, 255, 0)
  );
}

.se-dropdown-head__title {
  display: block;
  font-size: 13px;
  font-weight: 650;
  color: var(--el-text-color-primary, #303133);
  letter-spacing: 0.02em;
}

.se-dropdown-head__tip {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
  line-height: 1.35;
}

.se-dropdown-body {
  padding: 8px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.oloders {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin: 0;
  border-radius: 10px;
  text-align: left;
  line-height: 1.35;
  cursor: pointer;
  color: var(--admin-text, #303133);
  font-size: 14px;
  border-bottom: none;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    transform 0.12s ease;
}

.oloders:hover {
  background: linear-gradient(
    90deg,
    rgba(64, 158, 255, 0.14),
    rgba(91, 92, 240, 0.08)
  );
  color: var(--el-color-primary);
}

.oloders:active {
  transform: scale(0.992);
}

.oloders__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  flex-shrink: 0;
  background: linear-gradient(145deg, #409eff, #79bbff);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.oloders__dot--sub {
  background: linear-gradient(145deg, #a0cfff, #c6e2ff);
  box-shadow: 0 0 0 2px rgba(160, 207, 255, 0.35);
}

.oloders__text {
  flex: 1;
  min-width: 0;
}

.oloders__arrow {
  flex-shrink: 0;
  font-size: 14px;
  opacity: 0.35;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.oloders:hover .oloders__arrow {
  opacity: 0.85;
  transform: translateX(2px);
}

.oloders--empty {
  justify-content: center;
  color: var(--el-text-color-placeholder, #a8abb2);
  cursor: default;
  font-size: 13px;
}

.oloders--empty:hover {
  background: transparent;
  color: var(--el-text-color-placeholder, #a8abb2);
  transform: none;
}

.se-dropdown-multi {
  padding: 4px 4px 0;
}

.se-dropdown-multi .jio {
  padding: 8px 12px;
  margin: 2px 0;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.15s ease;
}

.se-dropdown-multi .jio:hover {
  background: rgba(64, 158, 255, 0.08);
}

.se-dropdown-multi__foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 8px 8px;
  margin-top: 4px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.se-panel--time {
  padding: 0;
  max-height: min(420px, 72vh);
  overflow-y: auto;
}

/**
 * 双类选择器提高权重：覆盖 .select-out 的 overflow:hidden、max-height:320px、z-index:3000，
 * 避免时间区间浮层被裁成一条线或压在表格/卡片下面看不见。
 */
.select-out.se-panel--time {
  overflow: visible !important;
  max-height: min(520px, 85vh) !important;
  z-index: 5200 !important;
  padding: 0 !important;
  border: none !important;
  border-radius: 20px !important;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-color-primary) 22%, transparent),
    color-mix(in srgb, var(--el-color-primary-light-3) 14%, transparent) 48%,
    color-mix(in srgb, var(--el-bg-color) 96%, var(--el-color-primary) 4%) 100%
  ) !important;
  box-shadow:
    0 24px 56px rgba(16, 24, 40, 0.16),
    0 0 0 1px color-mix(in srgb, var(--el-color-primary) 25%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.45) !important;
  backdrop-filter: blur(16px);
}

html.dark .select-out.se-panel--time {
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--el-color-primary) 28%, var(--el-bg-color)),
    color-mix(in srgb, var(--el-bg-color) 92%, #1a1d24) 100%
  ) !important;
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.45),
    0 0 0 1px color-mix(in srgb, var(--el-color-primary) 35%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
}

.select-out.se-panel--time :deep(.el-date-editor) {
  width: 100% !important;
  max-width: 100%;
}

.select-out.se-panel--time :deep(.el-date-editor .el-input__wrapper) {
  width: 100%;
  border-radius: 12px;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.select-out.se-panel--time :deep(.el-date-editor .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 45%, transparent);
}

.se-time-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 16px 16px 14px;
  min-width: 280px;
}

@keyframes se-time-icon-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

.se-time-hero {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--el-border-color-lighter) 80%, var(--el-color-primary) 20%);
}

.se-time-hero__icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  font-size: 22px;
  color: #fff;
  background: linear-gradient(145deg, var(--el-color-primary), var(--el-color-primary-light-3));
  box-shadow:
    0 8px 20px color-mix(in srgb, var(--el-color-primary) 45%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
  animation: se-time-icon-float 2.8s ease-in-out infinite;
}

.se-time-hero__icon--dual {
  background: linear-gradient(145deg, #7c5cff, var(--el-color-primary-light-3));
  box-shadow:
    0 8px 20px rgba(124, 92, 255, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.se-time-hero__title {
  font-size: 15px;
  font-weight: 750;
  letter-spacing: 0.02em;
  color: var(--el-text-color-primary);
  line-height: 1.3;
}

.se-time-hero__hint {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
  opacity: 0.92;
}

.se-time-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.se-time-field {
  padding: 10px 12px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--el-bg-color) 88%, var(--el-color-primary) 6%);
  border: 1px solid color-mix(in srgb, var(--el-border-color-lighter) 75%, var(--el-color-primary) 12%);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.se-time-field:focus-within {
  border-color: color-mix(in srgb, var(--el-color-primary) 55%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}

html.dark .se-time-field {
  background: color-mix(in srgb, var(--el-fill-color-dark) 70%, transparent);
}

.se-time-field__label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
}

.se-time-field__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.se-time-field__dot.is-start {
  background: linear-gradient(135deg, #34d399, var(--el-color-primary));
  box-shadow: 0 0 0 2px color-mix(in srgb, #34d399 35%, transparent);
}

.se-time-field__dot.is-end {
  background: linear-gradient(135deg, var(--el-color-warning), #f472b6);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-warning) 35%, transparent);
}

.se-time-foot {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding-top: 14px;
  margin-top: 4px;
  border-top: 1px dashed color-mix(in srgb, var(--el-border-color) 70%, var(--el-color-primary) 15%);
}

.se-time-btn--ghost {
  padding-left: 18px;
  padding-right: 18px;
}

.se-time-btn--go {
  padding-left: 22px;
  padding-right: 22px;
  font-weight: 600;
  border: none;
  background: linear-gradient(120deg, var(--el-color-primary), var(--el-color-primary-light-3)) !important;
  box-shadow: 0 6px 18px color-mix(in srgb, var(--el-color-primary) 42%, transparent);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.se-time-btn--go:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px color-mix(in srgb, var(--el-color-primary) 48%, transparent);
}

.se-time-input-dual :deep(.el-input__wrapper) {
  border-radius: 12px;
}

.omolerps {
  display: inline-block;
  border-radius: 2px;
  box-sizing: border-box;
  width: 14px;
  height: 14px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  margin-right: 5px;
}

.jop {
  position: relative;
  background-color: #409eff;
  border-color: #409eff;
}

.jop::before {
  content: '';
  position: absolute;
  display: block;
  background-color: #fff;
  height: 2px;
  transform: scale(0.5);
  left: 0;
  right: 0;
  top: 5px;
}

.box {
  position: relative;
  background-color: #409eff;
  border-color: #409eff;
}

.jio {
  padding: 5px 10px;
}

.jio .box:after {
  transform: rotate(45deg) scaleY(1);
}

.box:after {
  box-sizing: content-box;
  content: '';
  border: 1px solid #fff;
  border-left: 0;
  border-top: 0;
  height: 7px;
  left: 4px;
  position: absolute;
  top: 1px;
  transform: rotate(45deg) scaleY(0);
  width: 3px;
  transition: transform 0.15s ease-in 0.05s;
  transform-origin: center;
}

.nkic {
  padding: 3px 10px;
}

.ml {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  cursor: pointer;
}

.mk {
  color: #eee;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background-color: #409eff;
  border-radius: 8px;
  cursor: pointer;
}

:deep(.el-input__wrapper) {
  border-radius: 999px;
  height: 32px;
  padding-left: 12px;
  padding-right: 34px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.08) inset,
    0 6px 14px rgba(16, 24, 40, 0.06);
  transition: box-shadow 0.18s ease, transform 0.18s ease, background-color 0.18s ease;
}
:deep(.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px rgba(64, 158, 255, 0.55) inset,
    0 14px 30px rgba(64, 158, 255, 0.16);
  transform: translateY(-0.5px);
}
:deep(.el-input__wrapper.is-focus)::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(64, 158, 255, 0.55), rgba(91, 92, 240, 0.45));
  opacity: 0.18;
  pointer-events: none;
}
:deep(.el-input__inner) {
  height: 32px;
  line-height: 32px;
  font-size: 13px;
}

.se-prefix {
  opacity: 0.75;
}
.se-clear {
  position: absolute;
  right: 12px;
  top: 8px;
  opacity: 0.55;
  cursor: pointer;
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.se-clear:hover {
  opacity: 0.95;
  transform: scale(1.04);
}

.se-tag {
  border-radius: 999px !important;
  border: 1px solid rgba(64, 158, 255, 0.16) !important;
  background: linear-gradient(
    180deg,
    rgba(64, 158, 255, 0.08),
    rgba(91, 92, 240, 0.05)
  ) !important;
  color: rgba(20, 80, 140, 0.92) !important;
  height: 26px;
  line-height: 24px;
  padding: 0 10px;
  transition: transform 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease;
}
.se-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(64, 158, 255, 0.12);
}
:deep(.el-tag__close) {
  border-radius: 999px;
}
:deep(.el-tag__content) {
  border-bottom: 1px dashed;
}

@keyframes se-pop {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 点击标签：编辑条件弹层（与主搜索框区分，使用常规表单风格） */
.se-panel--edit {
  min-width: 280px;
  max-width: 400px;
  max-height: min(420px, 70vh);
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.se-edit-head {
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(
    180deg,
    rgba(64, 158, 255, 0.06) 0%,
    transparent 100%
  );
}

.se-edit-head__label {
  display: block;
  font-size: 15px;
  font-weight: 650;
  color: var(--el-text-color-primary, #303133);
  letter-spacing: 0.02em;
  margin-bottom: 4px;
}

.se-edit-head__hint {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}

.se-edit-body {
  padding: 14px 16px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.se-edit-field {
  width: 100%;
}

.se-edit-field + .se-edit-field,
.se-edit-field-group .se-edit-field + .se-edit-field {
  margin-top: 12px;
}

.se-edit-field-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.se-edit-sublabel {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
  margin-bottom: 6px;
}

.se-edit-select {
  width: 100%;
}

.se-edit-picker {
  width: 100%;
}

.se-panel--edit :deep(.el-input__wrapper),
.se-panel--edit :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
  height: 36px;
  min-height: 36px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08) inset;
}

.se-panel--edit :deep(.el-input__wrapper.is-focus),
.se-panel--edit :deep(.el-select .el-input__wrapper.is-focus) {
  transform: none;
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

.se-panel--edit :deep(.el-input__wrapper.is-focus::before),
.se-panel--edit :deep(.el-select .el-input__wrapper.is-focus::before) {
  display: none;
}

.se-panel--edit :deep(.el-input__inner) {
  height: 34px;
  line-height: 34px;
}

.se-panel--edit :deep(.el-date-editor.el-input) {
  width: 100%;
}

.se-edit-foot {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: var(--el-fill-color-lighter, #fafafa);
}

/* Dark mode */
:global(html.dark) .select-out {
  background-color: rgba(22, 24, 30, 0.94);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow:
    0 24px 56px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(255, 255, 255, 0.06) inset;
}

:global(html.dark) .se-dropdown-head {
  border-bottom-color: rgba(255, 255, 255, 0.08);
  background: linear-gradient(
    180deg,
    rgba(64, 158, 255, 0.12),
    transparent
  );
}

:global(html.dark) .se-dropdown-head__title {
  color: rgba(235, 240, 255, 0.95);
}

:global(html.dark) .se-dropdown-head__tip {
  color: rgba(180, 190, 210, 0.85);
}

:global(html.dark) .oloders {
  color: rgba(235, 240, 255, 0.9);
}

:global(html.dark) .oloders:hover {
  background: linear-gradient(
    90deg,
    rgba(64, 158, 255, 0.2),
    rgba(91, 92, 240, 0.12)
  );
}

:global(html.dark) .oloders--empty:hover {
  background: transparent;
  color: rgba(160, 170, 190, 0.65);
}

:global(html.dark) .se-dropdown-multi__foot {
  border-top-color: rgba(255, 255, 255, 0.08);
}

:global(html.dark) .se-time-foot {
  border-top-color: rgba(255, 255, 255, 0.08);
}
:global(html.dark) :deep(.el-input__wrapper) {
  background: rgba(18, 20, 26, 0.72);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08) inset,
    0 10px 22px rgba(0, 0, 0, 0.32);
}
:global(html.dark) .se-tag {
  border-color: rgba(64, 158, 255, 0.22) !important;
  color: rgba(200, 222, 255, 0.92) !important;
}

:global(html.dark) .se-edit-head {
  border-bottom-color: rgba(255, 255, 255, 0.08);
  background: linear-gradient(
    180deg,
    rgba(64, 158, 255, 0.1) 0%,
    transparent 100%
  );
}

:global(html.dark) .se-edit-head__label {
  color: rgba(235, 240, 255, 0.95);
}

:global(html.dark) .se-edit-foot {
  border-top-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
}

:global(html.dark) .se-panel--edit :deep(.el-input__wrapper),
:global(html.dark) .se-panel--edit :deep(.el-select .el-input__wrapper) {
  background: rgba(18, 20, 26, 0.85);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

/* 挂到 body 的日期下拉，须高于时间筛选浮层 (5200)，避免被盖住；勿用 scoped 子选择器 */
:global(.se-date-picker-popper.el-popper),
:global(.se-date-picker-popper) {
  z-index: 5600 !important;
}

/* 后台风格降噪：保持交互能力，弱化视觉特效 */
.int-out::before,
.int-out::after {
  display: none;
}

.select-out {
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  backdrop-filter: none;
}

.select-out.se-panel--time {
  border: 1px solid var(--el-border-color-lighter) !important;
  border-radius: 12px !important;
  background: var(--el-bg-color) !important;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.14) !important;
}

.se-time-hero__icon,
.se-time-hero__icon--dual {
  animation: none;
  box-shadow: none;
}

.se-tag {
  border: 1px solid var(--el-border-color) !important;
  background: var(--el-fill-color-light) !important;
  color: var(--el-text-color-regular) !important;
  box-shadow: none !important;
}

.se-tag:hover {
  transform: none;
}

.se-refresh {
  box-shadow: none;
}

@media (max-width: 768px) {
  .ko-s {
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 8px;
  }

  .inputouts {
    order: 1;
    flex: 1 1 100%;
    min-width: 0;
  }

  .select-out {
    max-width: calc(100vw - 16px);
  }

  .se-panel--dropdown {
    max-height: min(64vh, 420px);
  }

  .se-panel--edit {
    min-width: 0;
    max-width: calc(100vw - 16px);
  }

  .se-time-panel {
    min-width: 0;
    padding: 14px 12px 12px;
  }

  .se-time-foot {
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  :deep(.el-tag) {
    max-width: 100%;
  }

  :deep(.el-tag__content) {
    display: inline-block;
    max-width: calc(100vw - 120px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: bottom;
  }
}
</style>

