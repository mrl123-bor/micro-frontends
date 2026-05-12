<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TableInstance } from 'element-plus'
import type { ResponsiveTableColumn } from '@/types/responsive-table'
import { useMobile } from '@/hooks'

const props = withDefaults(
  defineProps<{
    columns: ResponsiveTableColumn[]
    data: Record<string, unknown>[]
    loading?: boolean
    rowKey: string
    stripe?: boolean
    /** 表格模式下开启多选（移动端卡片不支持多选） */
    selection?: boolean
    selectionColumnWidth?: number
    actionsColumnWidth?: number
    /** 自定义操作列表头（默认 i18n table.actions） */
    actionsLabel?: string
    mobileTitleProp?: string
    breakpoint?: number
    emptyText?: string
    tree?: boolean
    treeProps?: { children?: string; hasChildren?: string }
    defaultExpandAll?: boolean
  }>(),
  {
    loading: false,
    stripe: true,
    selection: false,
    selectionColumnWidth: 48,
    actionsColumnWidth: 220,
    emptyText: '',
    tree: false,
    treeProps: () => ({ children: 'children' }),
    defaultExpandAll: false,
  },
)

const emit = defineEmits<{
  (e: 'selection-change', selection: unknown[]): void
}>()

const { t } = useI18n()
const { isMobile } = useMobile(props.breakpoint ?? 768)
const slots = useSlots()
const elTableRef = ref<TableInstance>()

defineExpose({
  /** 仅表格模式可用：返回 ElementPlus TableInstance */
  getTable: () => elTableRef.value,
})

const hasActions = computed(() => !!slots.actions)

const resolvedActionsLabel = computed(() => props.actionsLabel ?? t('table.actions'))

const resolvedEmptyTitle = computed(() => props.emptyText || t('table.empty'))

const resolvedEmptyHint = computed(() => (props.emptyText ? '' : t('table.emptyHint')))

const useMobileCards = computed(() => isMobile.value && !props.tree)

const mobileFieldColumns = computed(() => {
  const list = props.columns.filter((c) => !c.mobileHidden)
  const hasOrder = list.some((c) => c.mobileOrder != null)
  if (!hasOrder) return list
  return [...list].sort(
    (a, b) => (a.mobileOrder ?? 9999) - (b.mobileOrder ?? 9999),
  )
})

/** 标题已展示的字段不再在卡片字段区重复 */
const resolvedTitleProp = computed(() => {
  if (props.mobileTitleProp) return props.mobileTitleProp
  return mobileFieldColumns.value[0]?.prop ?? ''
})

const mobileBodyColumns = computed(() => {
  const tp = resolvedTitleProp.value
  if (!tp) return mobileFieldColumns.value
  return mobileFieldColumns.value.filter((c) => c.prop !== tp)
})

function resolveRowKey(row: Record<string, unknown>, index: number): string {
  const v = row[props.rowKey]
  return v != null ? String(v) : String(index)
}

function mobileCardTitle(row: Record<string, unknown>): string {
  const tp = resolvedTitleProp.value
  if (!tp) return ''
  const v = row[tp]
  return v != null ? String(v) : ''
}

function hasColumnSlot(prop: string) {
  return !!slots[`column-${prop}`]
}

function defaultCellText(row: Record<string, unknown>, prop: string): string {
  const v = row[prop]
  if (v == null) return ''
  if (typeof v === 'object') return ''
  return String(v)
}
</script>

<template>
  <div class="responsive-data-table" :class="{ 'is-mobile-cards': useMobileCards }">
    <template v-if="useMobileCards">
      <div v-loading="loading" class="rdt-mobile">
        <template v-if="data.length">
          <article
            v-for="(row, $index) in data"
            :key="resolveRowKey(row, $index)"
            class="rdt-mobile-card"
          >
            <header class="rdt-mobile-card__title">
              <slot name="mobile-title" :row="row" :$index="$index">
                {{ mobileCardTitle(row) }}
              </slot>
            </header>
            <dl class="rdt-mobile-card__fields">
              <template v-for="col in mobileBodyColumns" :key="col.prop">
                <div class="rdt-mobile-field">
                  <dt class="rdt-mobile-field__label">{{ col.label }}</dt>
                  <dd class="rdt-mobile-field__value">
                    <slot
                      v-if="hasColumnSlot(col.prop)"
                      :name="`column-${col.prop}`"
                      :row="row"
                      :column="col"
                      :$index="$index"
                    />
                    <template v-else>{{ defaultCellText(row, col.prop) }}</template>
                  </dd>
                </div>
              </template>
            </dl>
            <footer v-if="hasActions" class="rdt-mobile-card__actions">
              <slot name="actions" :row="row" :$index="$index" />
            </footer>
          </article>
        </template>
        <div v-else class="rdt-mobile-empty">
          <slot name="empty">
            <el-empty :image-size="108" class="rdt-empty-state">
              <template #description>
                <div class="rdt-empty-state__text">
                  <p class="rdt-empty-state__title">{{ resolvedEmptyTitle }}</p>
                  <p v-if="resolvedEmptyHint" class="rdt-empty-state__hint">{{ resolvedEmptyHint }}</p>
                </div>
              </template>
            </el-empty>
          </slot>
        </div>
      </div>
    </template>

    <div
      v-else
      class="rdt-table-wrap"
      :class="{ 'rdt-table-wrap--scroll': isMobile && tree }"
    >
      <el-table
        ref="elTableRef"
        v-loading="loading"
        :data="data"
        :row-key="rowKey"
        :stripe="stripe"
        :tree-props="tree ? treeProps : undefined"
        :default-expand-all="tree ? defaultExpandAll : undefined"
        @selection-change="(s: unknown[]) => emit('selection-change', s)"
        style="width: 100%"
      >
        <el-table-column
          v-if="selection"
          type="selection"
          :width="selectionColumnWidth"
        />
        <el-table-column
          v-for="col in columns"
          :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :fixed="col.fixed"
          :align="col.align"
          :show-overflow-tooltip="col.showOverflowTooltip"
        >
          <template #default="scope">
            <slot
              v-if="hasColumnSlot(col.prop)"
              :name="`column-${col.prop}`"
              :row="scope.row"
              :column="scope.column"
              :$index="scope.$index"
            />
            <template v-else>{{ defaultCellText(scope.row as Record<string, unknown>, col.prop) }}</template>
          </template>
        </el-table-column>
        <el-table-column
          v-if="hasActions"
          :label="resolvedActionsLabel"
          :width="actionsColumnWidth"
          fixed="right"
          align="left"
        >
          <template #default="scope">
            <slot name="actions" :row="scope.row" :$index="scope.$index" />
          </template>
        </el-table-column>
        <template #empty>
          <div class="rdt-table-empty">
            <slot name="empty">
              <el-empty :image-size="108" class="rdt-empty-state">
                <template #description>
                  <div class="rdt-empty-state__text">
                    <p class="rdt-empty-state__title">{{ resolvedEmptyTitle }}</p>
                    <p v-if="resolvedEmptyHint" class="rdt-empty-state__hint">{{ resolvedEmptyHint }}</p>
                  </div>
                </template>
              </el-empty>
            </slot>
          </div>
        </template>
      </el-table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.responsive-data-table {
  width: 100%;
  min-width: 0;
}

.rdt-table-wrap {
  width: 100%;
  min-width: 0;

  &--scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin-left: -4px;
    margin-right: -4px;
    padding-left: 4px;
    padding-right: 4px;

    :deep(.el-table) {
      min-width: 640px;
    }
  }
}

.is-mobile-cards .rdt-mobile {
  min-height: 120px;
}

.rdt-mobile-empty {
  padding: 36px 16px 44px;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(
    165deg,
    color-mix(in srgb, var(--el-color-primary) 6%, var(--el-bg-color)) 0%,
    var(--el-fill-color-blank) 42%,
    var(--el-fill-color-light) 100%
  );
  border: 1px dashed color-mix(in srgb, var(--el-border-color) 70%, transparent);
}

.rdt-table-empty {
  box-sizing: border-box;
  width: 100%;
  padding: 44px 24px 52px;
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    165deg,
    color-mix(in srgb, var(--el-color-primary) 5%, var(--el-bg-color)) 0%,
    var(--el-fill-color-blank) 38%,
    var(--el-fill-color-lighter) 100%
  );
}

.rdt-empty-state {
  --el-empty-padding: 0;

  :deep(.el-empty__image) {
    opacity: 0.92;
  }

  :deep(.el-empty__description) {
    margin-top: 10px;
  }
}

.rdt-empty-state__text {
  text-align: center;
  max-width: 320px;
  margin: 0 auto;
}

.rdt-empty-state__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--admin-text, var(--el-text-color-primary));
}

.rdt-empty-state__hint {
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--admin-text-muted, var(--el-text-color-secondary));
}

.rdt-mobile-card {
  border-radius: 14px;
  border: 1px solid var(--admin-border, var(--el-border-color-lighter));
  background: var(--admin-surface, var(--el-bg-color));
  padding: 14px 14px 12px;
  margin-bottom: 12px;
  box-shadow: 0 1px 0 color-mix(in srgb, #fff 50%, transparent) inset;

  @at-root html.dark & {
    box-shadow: 0 1px 0 color-mix(in srgb, #fff 8%, transparent) inset;
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.rdt-mobile-card__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--admin-text, var(--el-text-color-primary));
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  line-height: 1.35;
}

.rdt-mobile-card__fields {
  margin: 0;
}

.rdt-mobile-field {
  display: grid;
  grid-template-columns: minmax(72px, 92px) 1fr;
  gap: 8px 12px;
  align-items: start;
  margin-bottom: 10px;
  font-size: 13px;

  &:last-child {
    margin-bottom: 0;
  }
}

.rdt-mobile-field__label {
  margin: 0;
  color: var(--admin-text-muted, var(--el-text-color-secondary));
  font-weight: 500;
}

.rdt-mobile-field__value {
  margin: 0;
  min-width: 0;
  color: var(--admin-text, var(--el-text-color-primary));
  word-break: break-word;
}

.rdt-mobile-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--el-border-color-lighter);

  :deep(.el-button) {
    margin-left: 0 !important;
  }
}
</style>
