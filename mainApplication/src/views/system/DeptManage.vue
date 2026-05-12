<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from '@/utils/toast'
import { ArrowDown, ArrowRight, Plus, EditPen, Delete } from '@element-plus/icons-vue'
import SimplePage from '@/views/common/SimplePage.vue'
import SearchEngines from '@/components/SearchEngines/index.vue'
import ResponsiveDataTable from '@/components/ResponsiveDataTable.vue'
import {
  PERM_SYSTEM_DEPT_ADD,
  PERM_SYSTEM_DEPT_EDIT,
  PERM_SYSTEM_DEPT_REMOVE,
} from '@/constants/perms'
import * as deptApi from '@/api/dept'
import type { SysDept } from '@/types/api'
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
const tree = ref<SysDept[]>([])
const flatAll = ref<SysDept[]>([])
const tableRef = ref<InstanceType<typeof ResponsiveDataTable> | null>(null)

const qDeptName = ref('')
const qStatus = ref('')

const searchItems = computed(() => [
  { title: t('table.deptName'), value: 'deptName', kiklis: '1', tesvalue: true, switch: true },
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

function buildDeptTree(flat: SysDept[], parentId: number): SysDept[] {
  return flat
    .filter((d) => d.parentId === parentId)
    .map((d) => ({
      ...d,
      children: buildDeptTree(flat, d.deptId),
    })) as SysDept[]
}

function applyDeptFilter() {
  const name = qDeptName.value.trim().toLowerCase()
  const st = qStatus.value

  if (!name && !st) {
    tree.value = buildDeptTree(flatAll.value, 0)
    return
  }

  const byId = new Map(flatAll.value.map((d) => [d.deptId, d]))
  const keep = new Set<number>()

  for (const d of flatAll.value) {
    const nameMatch = !name || d.deptName.toLowerCase().includes(name)
    const statusMatch = !st || d.status === st
    if (nameMatch && statusMatch) {
      let cur: SysDept | undefined = d
      while (cur) {
        keep.add(cur.deptId)
        if (cur.parentId === 0) break
        cur = byId.get(cur.parentId)
      }
    }
  }

  const filtered = flatAll.value.filter((d) => keep.has(d.deptId))
  tree.value = buildDeptTree(filtered, 0)
}

const dialogVisible = ref(false)
const dialogSaving = ref(false)
const form = ref<Partial<SysDept> & { deptId?: number }>({
  parentId: 0,
  deptName: '',
  orderNum: 0,
  leader: '',
  phone: '',
  email: '',
  status: '0',
})

const parentDeptTree = computed<SysDept[]>(() => {
  const all = buildDeptTree(flatAll.value, 0)
  const selfId = form.value.deptId
  if (!selfId) return all
  // 编辑时避免选择自己作为父级
  function prune(list: SysDept[]): SysDept[] {
    return list
      .filter((n) => n.deptId !== selfId)
      .map((n) => ({
        ...n,
        children: n.children?.length ? prune(n.children as SysDept[]) : [],
      })) as SysDept[]
  }
  return prune(all)
})

const tableColumns = computed<ResponsiveTableColumn[]>(() => [
  { prop: 'deptName', label: t('table.deptName'), minWidth: 180, mobileOrder: 1 },
  { prop: 'orderNum', label: t('table.sort'), width: 72, mobileOrder: 2 },
  { prop: 'leader', label: t('table.leader'), width: 100, mobileOrder: 3 },
  { prop: 'phone', label: t('table.phoneCol'), width: 120, mobileOrder: 4 },
  { prop: 'status', label: t('table.status'), width: 88, mobileOrder: 5 },
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
  const out: Array<{ row: SysDept; level: number }> = []
  const walk = (list: SysDept[], level: number) => {
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
  const byId = new Map(mobileTreeRows.value.map(({ row }) => [row.deptId, row]))
  return mobileTreeRows.value.filter(({ row }) => {
    if (row.parentId === 0) return true
    let parent = byId.get(row.parentId)
    while (parent) {
      if (!expanded.has(parent.deptId)) return false
      if (parent.parentId === 0) return true
      parent = byId.get(parent.parentId)
    }
    return false
  })
})

function isMobileExpanded(deptId: number) {
  return mobileExpandedIds.value.includes(deptId)
}

function toggleMobileExpanded(deptId: number) {
  if (isMobileExpanded(deptId)) {
    mobileExpandedIds.value = mobileExpandedIds.value.filter((id) => id !== deptId)
    return
  }
  mobileExpandedIds.value = [...mobileExpandedIds.value, deptId]
}

function expandAllMobileTree() {
  const ids: number[] = []
  walkPreorder(tree.value, (row) => {
    if (row.children?.length) ids.push(row.deptId)
  })
  mobileExpandedIds.value = ids
}

function collapseAllMobileTree() {
  mobileExpandedIds.value = []
}

function walkPreorder(rows: SysDept[], fn: (row: SysDept) => void) {
  for (const row of rows) {
    fn(row)
    if (row.children?.length) walkPreorder(row.children, fn)
  }
}

function walkPostorder(rows: SysDept[], fn: (row: SysDept) => void) {
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

async function load(opts?: { silent?: boolean }) {
  if (!opts?.silent) loading.value = true
  try {
    flatAll.value = await deptApi.deptList()
    applyDeptFilter()
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
    parentId,
    deptName: '',
    orderNum: 0,
    leader: '',
    phone: '',
    email: '',
    status: '0',
  }
  dialogVisible.value = true
}

async function openEdit(row: SysDept) {
  const d = await deptApi.deptDetail(row.deptId)
  form.value = { ...d }
  dialogVisible.value = true
}

async function submit() {
  dialogSaving.value = true
  try {
    if (form.value.deptId) {
      await deptApi.deptUpdate({
        ...form.value,
        deptId: form.value.deptId,
      })
      toast.success(t('common.saveOk'))
    } else {
      await deptApi.deptCreate(form.value)
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

async function onRemove(row: SysDept) {
  const ok = await funConfirm.open({
    title: t('common.tip'),
    message: t('pages.dept.deleteConfirm', { name: row.deptName }),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
  })
  if (!ok) return
  await deptApi.deptRemove(row.deptId)
  toast.success(t('common.deleteOk'))
  await load()
}

function getDeptRowActions(row: SysDept): TableRowActionItem[] {
  return [
    {
      key: 'child',
      label: t('pages.dept.child'),
      icon: Plus,
      buttonType: 'success',
      perm: PERM_SYSTEM_DEPT_ADD,
      onClick: () => openAdd(row.deptId),
    },
    {
      key: 'edit',
      label: t('common.edit'),
      icon: EditPen,
      buttonType: 'primary',
      perm: PERM_SYSTEM_DEPT_EDIT,
      onClick: () => void openEdit(row),
    },
    {
      key: 'remove',
      label: t('common.delete'),
      icon: Delete,
      buttonType: 'danger',
      perm: PERM_SYSTEM_DEPT_REMOVE,
      onClick: () => void onRemove(row),
    },
  ]
}

onMounted(() => {
  void load()
})
</script>

<template>
  <SimplePage :title="t('pages.dept.title')" :subtitle="t('pages.dept.subtitle')">
    <div class="toolbar dept-toolbar">
      <el-button v-permission="PERM_SYSTEM_DEPT_ADD" type="primary" @click="openAdd(0)">
        {{ t('pages.dept.addRoot') }}
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
      <div class="dept-search">
        <SearchEngines
          :dats="searchItems"
          :history="true"
          show-columns-toggle
          :table-columns="tableColumns.slice(1).map((c) => ({ key: c.prop, label: c.label }))"
          table-columns-storage-key="system:dept"
          @columns-change="(keys) => (visibleColumnKeys = keys as string[])"
          @refresh="refreshToolbar"
          @handlesousuos="
            (q) => {
              qDeptName = (q?.deptName ?? '') as string
              qStatus = (q?.status ?? '') as string
              applyDeptFilter()
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
            :key="row.deptId"
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
                  @click="toggleMobileExpanded(row.deptId)"
                >
                  <el-icon>
                    <ArrowDown v-if="isMobileExpanded(row.deptId)" />
                    <ArrowRight v-else />
                  </el-icon>
                </el-button>
                {{ row.deptName }}
              </span>
              <el-tag :type="row.status === '0' ? 'success' : 'info'" size="small">
                {{ row.status === '0' ? t('status.normal') : t('status.disabled') }}
              </el-tag>
            </header>
            <div class="mobile-tree-card__meta">
              <span>{{ t('table.leader') }}: {{ row.leader || t('common.dash') }}</span>
              <span>{{ t('table.phoneCol') }}: {{ row.phone || t('common.dash') }}</span>
            </div>
            <footer class="mobile-tree-card__actions">
              <TableRowActions :items="getDeptRowActions(row)" :more-label="t('common.moreActions')" />
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
      row-key="deptId"
      :actions-column-width="220"
      tree
      :tree-props="{ children: 'children' }"
      stripe
    >
      <template #column-status="{ row }">
        <el-tag :type="(row as SysDept).status === '0' ? 'success' : 'info'" size="small">
          {{ (row as SysDept).status === '0' ? t('status.normal') : t('status.disabled') }}
        </el-tag>
      </template>
      <template #actions="{ row }">
        <TableRowActions
          :items="getDeptRowActions(row as SysDept)"
          :more-label="t('common.moreActions')"
        />
      </template>
    </ResponsiveDataTable>

    <GlassFormDialog
      v-model="dialogVisible"
      :title="form.deptId ? t('pages.dept.dialogEdit') : t('pages.dept.dialogNew')"
      width="min(92vw, 480px)"
      :loading="dialogSaving"
      @confirm="submit"
    >
      <el-form label-width="88px">
        <el-form-item :label="t('table.name')">
          <el-input v-model="form.deptName" />
        </el-form-item>
        <el-form-item :label="t('common.parentId')">
          <el-tree-select
            v-model="form.parentId"
            :data="parentDeptTree"
            node-key="deptId"
            check-strictly
            clearable
            filterable
            :props="{ label: 'deptName', children: 'children' }"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="t('table.sort')">
          <el-input-number v-model="form.orderNum" :min="0" />
        </el-form-item>
        <el-form-item :label="t('table.leader')">
          <el-input v-model="form.leader" />
        </el-form-item>
        <el-form-item :label="t('table.phoneCol')">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item :label="t('table.email')">
          <el-input v-model="form.email" />
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
.dept-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.grow {
  flex: 1;
  min-width: 8px;
}
.dept-search {
  width: min(520px, 46vw);
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
  .dept-search {
    width: 100%;
    min-width: 0;
  }
}
</style>
