<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from '@/utils/toast'
import { ArrowDown, ArrowRight, Plus, EditPen, Delete } from '@element-plus/icons-vue'
import SimplePage from '@/views/common/SimplePage.vue'
import SearchEngines from '@/components/SearchEngines/index.vue'
import ResponsiveDataTable from '@/components/ResponsiveDataTable.vue'
import IconPicker from '@/components/IconPicker/index.vue'
import MenuMetaIcon from '@/components/MenuMetaIcon/index.vue'
import {
  PERM_SYSTEM_MENU_ADD,
  PERM_SYSTEM_MENU_EDIT,
  PERM_SYSTEM_MENU_REMOVE,
} from '@/constants/perms'
import * as menuApi from '@/api/menu'
import type { SysMenu } from '@/types/api'
import type { ResponsiveTableColumn } from '@/types/responsive-table'
import GlassFormDialog from '@/components/GlassFormDialog.vue'
import FunConfirmDialog from '@/components/FunConfirmDialog.vue'
import { useFunConfirmDialog } from '@/composables/useFunConfirmDialog'
import TableRowActions from '@/components/TableRowActions.vue'
import type { TableRowActionItem } from '@/types/table-row-actions'
import { useMobile } from '@/hooks'

const { t } = useI18n()
const { isMobile } = useMobile()
const funConfirm = useFunConfirmDialog()
const loading = ref(false)
/** 接口返回的完整树（筛选时保留引用，避免重复请求） */
const menuFullTree = ref<SysMenu[]>([])
const tree = ref<SysMenu[]>([])
const tableRef = ref<InstanceType<typeof ResponsiveDataTable> | null>(null)

const qMenuName = ref('')
const qPath = ref('')
const qMenuType = ref('')
const qStatus = ref('')

const searchItems = computed(() => [
  { title: t('pages.menu.filterMenuName'), value: 'menuName', kiklis: '1', tesvalue: true, switch: true },
  { title: t('pages.menu.filterPath'), value: 'path', kiklis: '1', switch: true },
  {
    title: t('pages.menu.filterType'),
    value: 'menuType',
    kiklis: '0',
    switch: true,
    children: [
      { title: t('pages.menu.typeM'), value: 'M' },
      { title: t('pages.menu.typeC'), value: 'C' },
      { title: t('pages.menu.typeF'), value: 'F' },
    ],
  },
  {
    title: t('table.status'),
    value: 'status',
    kiklis: '0',
    switch: true,
    children: [
      { title: t('status.normal'), value: '0' },
      { title: t('status.disabled'), value: '1' },
    ],
  },
])

function flattenMenuTree(rows: SysMenu[]): SysMenu[] {
  const out: SysMenu[] = []
  function walk(list: SysMenu[]) {
    for (const n of list) {
      out.push(n)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(rows)
  return out
}

function buildMenuTree(flat: SysMenu[], parentId: number): SysMenu[] {
  return flat
    .filter((m) => m.parentId === parentId)
    .sort((a, b) => a.orderNum - b.orderNum)
    .map((m) => ({
      ...m,
      children: buildMenuTree(flat, m.menuId),
    })) as SysMenu[]
}

function applyMenuFilter() {
  if (!menuFullTree.value.length) {
    tree.value = []
    return
  }
  const name = qMenuName.value.trim().toLowerCase()
  const pathQ = qPath.value.trim().toLowerCase()
  const mt = qMenuType.value
  const st = qStatus.value

  if (!name && !pathQ && !mt && !st) {
    tree.value = menuFullTree.value
    return
  }

  const flatAll = flattenMenuTree(menuFullTree.value)
  const byId = new Map(flatAll.map((m) => [m.menuId, m]))
  const keep = new Set<number>()

  for (const m of flatAll) {
    const nameMatch = !name || m.menuName.toLowerCase().includes(name)
    const pathMatch =
      !pathQ || (m.path && m.path.toLowerCase().includes(pathQ))
    const typeMatch = !mt || m.menuType === mt
    const statusMatch = !st || m.status === st
    if (nameMatch && pathMatch && typeMatch && statusMatch) {
      let cur: SysMenu | undefined = m
      while (cur) {
        keep.add(cur.menuId)
        if (cur.parentId === 0) break
        cur = byId.get(cur.parentId)
      }
    }
  }

  const filtered = flatAll.filter((m) => keep.has(m.menuId))
  tree.value = buildMenuTree(filtered, 0)
}

function walkPreorder(rows: SysMenu[], fn: (row: SysMenu) => void) {
  for (const row of rows) {
    fn(row)
    if (row.children?.length) walkPreorder(row.children, fn)
  }
}

function walkPostorder(rows: SysMenu[], fn: (row: SysMenu) => void) {
  for (const row of rows) {
    if (row.children?.length) walkPostorder(row.children, fn)
    fn(row)
  }
}

/** 树表：先父后子展开，先子后父收起，避免状态不同步 */
function expandAllTree() {
  const tbl = tableRef.value?.getTable?.()
  if (!tbl) return
  walkPreorder(tree.value, (row) => {
    tbl.toggleRowExpansion(row, true)
  })
}

function collapseAllTree() {
  const tbl = tableRef.value?.getTable?.()
  if (!tbl) return
  walkPostorder(tree.value, (row) => {
    tbl.toggleRowExpansion(row, false)
  })
}

const tableColumns = computed<ResponsiveTableColumn[]>(() => [
  /** 首列必须是「名称」：树表的展开箭头由 Element 画在第一列，与「图标」分开展示更清晰 */
  { prop: 'menuName', label: t('pages.menu.labelName'), minWidth: 160, mobileOrder: 1 },
  { prop: 'icon', label: t('table.icon'), width: 56, align: 'center', mobileOrder: 0 },
  { prop: 'path', label: t('pages.menu.filterPath'), width: 140, mobileOrder: 2 },
  {
    prop: 'component',
    label: t('table.component'),
    minWidth: 160,
    showOverflowTooltip: true,
    mobileOrder: 3,
  },
  { prop: 'perms', label: t('table.perms'), width: 160, showOverflowTooltip: true, mobileOrder: 4 },
  { prop: 'menuType', label: t('table.menuType'), width: 64, mobileOrder: 5 },
])

const visibleColumnKeys = ref<string[] | null>(null)
const renderTableColumns = computed(() => {
  const cols = tableColumns.value
  const first = cols[0]
  if (!visibleColumnKeys.value?.length) return cols
  const byProp = new Map(cols.slice(1).map((c) => [String(c.prop), c]))
  const ordered = visibleColumnKeys.value.map((k) => byProp.get(String(k))).filter(Boolean) as ResponsiveTableColumn[]
  return [first, ...ordered]
})

const mobileTreeRows = computed(() => {
  const out: Array<{ row: SysMenu; level: number }> = []
  const walk = (list: SysMenu[], level: number) => {
    for (const row of list) {
      out.push({ row, level })
      if (row.children?.length) walk(row.children, level + 1)
    }
  }
  walk(tree.value, 0)
  return out
})
const mobileExpandedIds = ref<number[]>([])
const mobileVisibleRows = computed(() => {
  const expanded = new Set(mobileExpandedIds.value)
  const byId = new Map(mobileTreeRows.value.map(({ row }) => [row.menuId, row]))
  return mobileTreeRows.value.filter(({ row }) => {
    if (row.parentId === 0) return true
    let parent = byId.get(row.parentId)
    while (parent) {
      if (!expanded.has(parent.menuId)) return false
      if (parent.parentId === 0) return true
      parent = byId.get(parent.parentId)
    }
    return false
  })
})

function isMobileExpanded(menuId: number) {
  return mobileExpandedIds.value.includes(menuId)
}

function toggleMobileExpanded(menuId: number) {
  if (isMobileExpanded(menuId)) {
    mobileExpandedIds.value = mobileExpandedIds.value.filter((id) => id !== menuId)
    return
  }
  mobileExpandedIds.value = [...mobileExpandedIds.value, menuId]
}

function expandAllMobileTree() {
  const ids: number[] = []
  walkPreorder(tree.value, (row) => {
    if (row.children?.length) ids.push(row.menuId)
  })
  mobileExpandedIds.value = ids
}

function collapseAllMobileTree() {
  mobileExpandedIds.value = []
}

const dialogVisible = ref(false)
const dialogSaving = ref(false)
const form = ref<Partial<SysMenu> & { menuId?: number }>({
  menuName: '',
  parentId: 0,
  orderNum: 0,
  path: '',
  component: '',
  menuType: 'C',
  visible: '0',
  status: '0',
  perms: '',
  icon: '',
})

const formIcon = computed({
  get: () => form.value.icon ?? '',
  set: (v: string) => {
    form.value.icon = v
  },
})

const parentMenuTree = computed<SysMenu[]>(() => {
  const all = menuFullTree.value
  const selfId = form.value.menuId
  if (!selfId) return all
  function prune(list: SysMenu[]): SysMenu[] {
    return list
      .filter((n) => n.menuId !== selfId)
      .map((n) => ({
        ...n,
        children: n.children?.length ? prune(n.children as SysMenu[]) : [],
      })) as SysMenu[]
  }
  return prune(all)
})

async function load(opts?: { silent?: boolean }) {
  if (!opts?.silent) loading.value = true
  try {
    menuFullTree.value = await menuApi.menuTree()
    applyMenuFilter()
  } finally {
    if (!opts?.silent) loading.value = false
  }
}

async function refreshToolbar() {
  loading.value = true
  try {
    await load({ silent: true })
    toast.success(t('crud.listRefreshOk'))
  } finally {
    loading.value = false
  }
}

function openAdd(parentId = 0) {
  form.value = {
    menuName: '',
    parentId,
    orderNum: 0,
    path: '',
    component: '',
    menuType: 'C',
    visible: '0',
    status: '0',
    perms: '',
    icon: '',
  }
  dialogVisible.value = true
}

async function openEdit(row: SysMenu) {
  const d = await menuApi.menuDetail(row.menuId)
  form.value = { ...d }
  dialogVisible.value = true
}

async function submit() {
  dialogSaving.value = true
  try {
    if (form.value.menuId) {
      await menuApi.menuUpdate(form.value.menuId, form.value)
      toast.success(t('common.saveOk'))
    } else {
      await menuApi.menuCreate(form.value)
      toast.success(t('common.create'))
    }
    dialogVisible.value = false
    await load()
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : t('common.opFail'))
  } finally {
    dialogSaving.value = false
  }
}

async function onRemove(row: SysMenu) {
  const ok = await funConfirm.open({
    title: t('common.tip'),
    message: t('pages.menu.deleteConfirm', { name: row.menuName }),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
  })
  if (!ok) return
  await menuApi.menuRemove(row.menuId)
  toast.success(t('common.deleteOk'))
  await load()
}

function getMenuRowActions(row: SysMenu): TableRowActionItem[] {
  return [
    {
      key: 'child',
      label: t('pages.menu.child'),
      icon: Plus,
      buttonType: 'success',
      perm: PERM_SYSTEM_MENU_ADD,
      onClick: () => openAdd(row.menuId),
    },
    {
      key: 'edit',
      label: t('common.edit'),
      icon: EditPen,
      buttonType: 'primary',
      perm: PERM_SYSTEM_MENU_EDIT,
      onClick: () => void openEdit(row),
    },
    {
      key: 'remove',
      label: t('common.delete'),
      icon: Delete,
      buttonType: 'danger',
      perm: PERM_SYSTEM_MENU_REMOVE,
      onClick: () => void onRemove(row),
    },
  ]
}

onMounted(() => {
  void load()
})
</script>

<template>
  <SimplePage :title="t('pages.menu.title')" :subtitle="t('pages.menu.subtitle')">
    <div class="toolbar menu-toolbar">
      <el-button v-permission="PERM_SYSTEM_MENU_ADD" type="primary" @click="openAdd(0)">
        {{ t('pages.menu.addRoot') }}
      </el-button>
      <template v-if="!isMobile">
        <el-button plain @click="expandAllTree">{{ t('common.expandAll') }}</el-button>
        <el-button plain @click="collapseAllTree">{{ t('common.collapseAll') }}</el-button>
      </template>
      <template v-else>
        <el-button plain @click="expandAllMobileTree">{{ t('common.expandAll') }}</el-button>
        <el-button plain @click="collapseAllMobileTree">{{ t('common.collapseAll') }}</el-button>
      </template>
      <span class="grow" />
      <div class="menu-search">
        <SearchEngines
          :dats="searchItems"
          :history="true"
          show-columns-toggle
          :table-columns="tableColumns.slice(1).map((c) => ({ key: c.prop, label: c.label }))"
          table-columns-storage-key="system:menu"
          @columns-change="(keys) => (visibleColumnKeys = keys as string[])"
          @refresh="refreshToolbar"
          @handlesousuos="
            (q) => {
              qMenuName = (q?.menuName ?? '') as string
              qPath = (q?.path ?? '') as string
              qMenuType = (q?.menuType ?? '') as string
              qStatus = (q?.status ?? '') as string
              applyMenuFilter()
            }
          "
        />
      </div>
    </div>
    <template v-if="isMobile">
      <div v-loading="loading" class="mobile-tree-list">
        <template v-if="mobileVisibleRows.length">
          <article
            v-for="{ row, level } in mobileVisibleRows"
            :key="row.menuId"
            class="mobile-tree-card"
            :style="{ '--mobile-level': String(level) }"
          >
            <header class="mobile-tree-card__title">
              <span class="mobile-tree-card__name">
                <el-button
                  v-if="row.children?.length"
                  link
                  type="primary"
                  class="mobile-tree-toggle"
                  @click="toggleMobileExpanded(row.menuId)"
                >
                  <el-icon>
                    <ArrowDown v-if="isMobileExpanded(row.menuId)" />
                    <ArrowRight v-else />
                  </el-icon>
                </el-button>
                {{ row.menuName }}
              </span>
              <el-tag size="small" effect="plain">{{ row.menuType }}</el-tag>
            </header>
            <div class="mobile-tree-card__meta">
              <span>{{ t('pages.menu.filterPath') }}: {{ row.path || t('common.dash') }}</span>
              <span>{{ t('table.component') }}: {{ row.component || t('common.dash') }}</span>
            </div>
            <footer class="mobile-tree-card__actions">
              <TableRowActions :items="getMenuRowActions(row)" :more-label="t('common.moreActions')" />
            </footer>
          </article>
        </template>
        <el-empty v-else />
      </div>
    </template>
    <ResponsiveDataTable
      v-else
      ref="tableRef"
      :columns="renderTableColumns"
      :data="tree as unknown as Record<string, unknown>[]"
      :loading="loading"
      row-key="menuId"
      :actions-column-width="220"
      tree
      :tree-props="{ children: 'children' }"
      stripe
      mobile-title-prop="menuName"
    >
      <template #column-icon="{ row }">
        <MenuMetaIcon
          v-if="(row as SysMenu).icon"
          :name="(row as SysMenu).icon"
          :size="18"
        />
        <span v-else>{{ t('common.dash') }}</span>
      </template>
      <template #actions="{ row }">
        <TableRowActions
          :items="getMenuRowActions(row as SysMenu)"
          :more-label="t('common.moreActions')"
        />
      </template>
    </ResponsiveDataTable>

    <GlassFormDialog
      v-model="dialogVisible"
      :title="form.menuId ? t('pages.menu.dialogEdit') : t('pages.menu.dialogNew')"
      width="min(92vw, 560px)"
      :loading="dialogSaving"
      @confirm="submit"
    >
      <el-form label-width="88px">
        <el-form-item :label="t('pages.menu.labelName')">
          <el-input v-model="form.menuName" />
        </el-form-item>
        <el-form-item :label="t('common.parentId')">
          <el-tree-select
            v-model="form.parentId"
            :data="parentMenuTree"
            node-key="menuId"
            check-strictly
            clearable
            filterable
            :props="{ label: 'menuName', children: 'children' }"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="t('common.orderNum')">
          <el-input-number v-model="form.orderNum" :min="0" />
        </el-form-item>
        <el-form-item :label="t('pages.menu.labelType')">
          <el-select v-model="form.menuType" style="width: 100%">
            <el-option :label="t('pages.menu.typeM')" value="M" />
            <el-option :label="t('pages.menu.typeC')" value="C" />
            <el-option :label="t('pages.menu.typeF')" value="F" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('table.path')">
          <el-input v-model="form.path" />
        </el-form-item>
        <el-form-item :label="t('table.component')">
          <el-input v-model="form.component" :placeholder="t('pages.menu.componentPh')" />
        </el-form-item>
        <el-form-item :label="t('table.perms')">
          <el-input v-model="form.perms" />
        </el-form-item>
        <el-form-item :label="t('pages.menu.labelIcon')">
          <IconPicker v-model="formIcon" />
        </el-form-item>
        <el-form-item :label="t('pages.menu.labelVisible')">
          <el-radio-group v-model="form.visible">
            <el-radio label="0">{{ t('common.display') }}</el-radio>
            <el-radio label="1">{{ t('common.hide') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('table.status')">
          <el-radio-group v-model="form.status">
            <el-radio label="0">{{ t('status.normal') }}</el-radio>
            <el-radio label="1">{{ t('status.disabled') }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </GlassFormDialog>

    <FunConfirmDialog
      v-model="funConfirm.visible"
      :title="funConfirm.title"
      :message="funConfirm.message"
      :tips="funConfirm.tips"
      :confirm-text="funConfirm.confirmText"
      :cancel-text="funConfirm.cancelText"
      :width="funConfirm.width"
      :show-cancel="funConfirm.showCancel"
      @confirm="funConfirm.onConfirm"
      @cancel="funConfirm.onCancel"
    />
  </SimplePage>
</template>

<style scoped lang="scss">
.menu-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.grow {
  flex: 1;
  min-width: 8px;
}
.menu-search {
  width: min(560px, 48vw);
  min-width: 320px;
}

.mobile-tree-list {
  display: grid;
  gap: 10px;
}

.mobile-tree-card {
  --indent: calc(var(--mobile-level, 0) * 12px);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
  padding: 12px;
  margin-left: var(--indent);
}

.mobile-tree-card__title {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  font-weight: 600;
}

.mobile-tree-card__name {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  word-break: break-word;
}

.mobile-tree-toggle {
  padding: 0;
  min-height: auto;
}

.mobile-tree-card__meta {
  margin-top: 8px;
  display: grid;
  gap: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.mobile-tree-card__actions {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--el-border-color-lighter);
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
}

@media (max-width: 768px) {
  .menu-search {
    width: 100%;
    min-width: 0;
  }
}
</style>
