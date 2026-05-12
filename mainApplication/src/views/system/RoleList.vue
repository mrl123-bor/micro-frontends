<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { toast } from '@/utils/toast'
import { UserFilled, EditPen, Delete } from '@element-plus/icons-vue'
import SimplePage from '@/views/common/SimplePage.vue'
import SearchEngines from '@/components/SearchEngines/index.vue'
import {
  PERM_SYSTEM_ROLE_ADD,
  PERM_SYSTEM_ROLE_EDIT,
  PERM_SYSTEM_ROLE_REMOVE,
} from '@/constants/perms'
import * as roleApi from '@/api/role'
import * as menuApi from '@/api/menu'
import * as deptApi from '@/api/dept'
import type { SysMenu, SysRole, SysDept } from '@/types/api'
import type { ResponsiveTableColumn } from '@/types/responsive-table'
import ResponsiveDataTable from '@/components/ResponsiveDataTable.vue'
import SmartTree from '@/components/SmartTree/index.vue'
import SmartPagination from '@/components/SmartPagination/index.vue'
import { ROUTE_NAMES } from '@/constants/route-names'
import { useToggle } from '@/hooks'
import GlassFormDialog from '@/components/GlassFormDialog.vue'
import FunConfirmDialog from '@/components/FunConfirmDialog.vue'
import { useFunConfirmDialog } from '@/composables/useFunConfirmDialog'
import TableRowActions from '@/components/TableRowActions.vue'
import type { TableRowActionItem } from '@/types/table-row-actions'

const router = useRouter()
const { t } = useI18n()
const loading = ref(false)
const rows = ref<SysRole[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const qRoleName = ref('')
const qRoleKey = ref('')
const qStatus = ref('')
const funConfirm = useFunConfirmDialog()

const searchItems = computed(() => [
  { title: t('pages.role.filterRoleName'), value: 'roleName', kiklis: '1', tesvalue: true, switch: true },
  { title: t('pages.role.filterRoleKey'), value: 'roleKey', kiklis: '1', switch: true },
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

const { value: dialogVisible, setFalse: closeRoleDialog } = useToggle(false)
const dialogSaving = ref(false)
const form = ref({
  roleId: 0,
  roleName: '',
  roleKey: '',
  roleSort: 0,
  dataScope: '1',
  status: '0',
  remark: '',
  menuIds: [] as number[],
  deptIds: [] as number[],
})

const menuTree = ref<SysMenu[]>([])
const deptTree = ref<SysDept[]>([])
const menuTreeRef = ref<InstanceType<typeof SmartTree> | null>(null)

const dataScopeOptions = computed(() => [
  { label: t('dataScope.all'), value: '1' },
  { label: t('dataScope.custom'), value: '2' },
  { label: t('dataScope.dept'), value: '3' },
  { label: t('dataScope.deptAndChild'), value: '4' },
  { label: t('dataScope.self'), value: '5' },
])

const tableColumns = computed<ResponsiveTableColumn[]>(() => [
  { prop: 'roleId', label: t('table.id'), width: 64, mobileHidden: true },
  { prop: 'roleName', label: t('pages.role.labelName'), minWidth: 120 },
  { prop: 'roleKey', label: t('pages.role.labelKey'), width: 120 },
  { prop: 'dataScope', label: t('table.dataScope'), width: 120 },
  { prop: 'roleSort', label: t('table.sort'), width: 72 },
  { prop: 'status', label: t('table.status'), width: 88 },
])

const visibleColumnKeys = ref<string[] | null>(null)
const renderTableColumns = computed(() => {
  if (!visibleColumnKeys.value?.length) return tableColumns.value
  const byProp = new Map(tableColumns.value.map((c) => [String(c.prop), c]))
  return visibleColumnKeys.value.map((k) => byProp.get(String(k))).filter(Boolean) as ResponsiveTableColumn[]
})

function formatDataScope(v: string) {
  const m: Record<string, string> = {
    '1': t('dataScope.all'),
    '2': t('dataScope.custom'),
    '3': t('dataScope.dept'),
    '4': t('dataScope.deptAndChild'),
    '5': t('dataScope.self'),
  }
  return m[v] ?? v
}

async function fetchList(opts?: { silent?: boolean }) {
  if (!opts?.silent) loading.value = true
  try {
    const res = await roleApi.roleList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      roleName: qRoleName.value || undefined,
      roleKey: qRoleKey.value || undefined,
      status: qStatus.value || undefined,
    })
    rows.value = res.list
    total.value = res.total
  } finally {
    if (!opts?.silent) loading.value = false
  }
}

async function loadListPage(options?: { tipOnOk?: boolean }) {
  loading.value = true
  try {
    await fetchList({ silent: true })
    if (options?.tipOnOk) toast.success(t('crud.listRefreshOk'))
  } finally {
    loading.value = false
  }
}

function refreshPage() {
  void loadListPage({ tipOnOk: true })
}

async function openCreate() {
  form.value = {
    roleId: 0,
    roleName: '',
    roleKey: '',
    roleSort: 0,
    dataScope: '1',
    status: '0',
    remark: '',
    menuIds: [],
    deptIds: [],
  }
  menuTree.value = await menuApi.menuTree()
  deptTree.value = await deptApi.deptTree()
  dialogVisible.value = true
}

async function openEdit(row: SysRole) {
  const detail = await roleApi.roleDetail(row.roleId)
  form.value = {
    roleId: detail.roleId,
    roleName: detail.roleName,
    roleKey: detail.roleKey,
    roleSort: detail.roleSort,
    dataScope: detail.dataScope,
    status: detail.status,
    remark: detail.remark ?? '',
    menuIds: detail.menuIds ?? [],
    deptIds: detail.deptIds ?? [],
  }
  menuTree.value = await menuApi.menuTree()
  deptTree.value = await deptApi.deptTree()
  // 一些后端实现会对“超级管理员”不返回 menuIds（空数组代表全部权限）。
  // 前端回显需要将其展开为“全选”，否则会显示为全未勾选。
  if (form.value.roleKey === 'admin' && (!form.value.menuIds || form.value.menuIds.length === 0)) {
    const leafIds: number[] = []
    const walk = (list: SysMenu[]) => {
      for (const n of list) {
        const children = (n.children ?? []) as SysMenu[]
        if (!children.length) leafIds.push(n.menuId)
        else walk(children)
      }
    }
    walk(menuTree.value)
    form.value.menuIds = leafIds
  }
  dialogVisible.value = true
}

function collectMenuIds(): number[] {
  const tree = menuTreeRef.value?.getTree?.()
  if (!tree?.getCheckedKeys) return form.value.menuIds
  // 这里不要把「半选父节点」一起提交，否则回显时父节点会联动勾选整棵子树，导致看起来“全勾选”
  const full = (tree.getCheckedKeys(true) as unknown[]) ?? []
  const toNums = (xs: unknown[]) =>
    xs.map((x) => (typeof x === 'number' ? x : Number(x))).filter((x) => Number.isFinite(x))
  return [...new Set(toNums(full))]
}

async function submitForm() {
  dialogSaving.value = true
  try {
    const menuIds = collectMenuIds()
    if (!form.value.roleId) {
      await roleApi.roleCreate({
        roleName: form.value.roleName,
        roleKey: form.value.roleKey,
        roleSort: form.value.roleSort,
        dataScope: form.value.dataScope,
        status: form.value.status,
        remark: form.value.remark,
        menuIds,
        deptIds: form.value.dataScope === '2' ? form.value.deptIds : [],
      })
      toast.success(t('common.create'))
    } else {
      await roleApi.roleUpdate({
        roleId: form.value.roleId,
        roleName: form.value.roleName,
        roleKey: form.value.roleKey,
        roleSort: form.value.roleSort,
        dataScope: form.value.dataScope,
        status: form.value.status,
        remark: form.value.remark,
        menuIds,
        deptIds: form.value.dataScope === '2' ? form.value.deptIds : [],
      })
      toast.success(t('common.saveOk'))
    }
    closeRoleDialog()
    await fetchList()
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : t('common.saveFail'))
  } finally {
    dialogSaving.value = false
  }
}

function goAuthUser(row: SysRole) {
  router.push({ name: ROUTE_NAMES.authUser, params: { roleId: String(row.roleId) } })
}

function isSuperAdminRole(row: SysRole) {
  return row.roleId === 1 || row.roleKey === 'admin'
}

async function onRemove(row: SysRole) {
  const ok = await funConfirm.open({
    title: t('common.tip'),
    message: t('pages.role.deleteConfirm', { name: row.roleName }),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
  })
  if (!ok) return
  await roleApi.roleRemove([row.roleId])
  toast.success(t('common.deleteOk'))
  await fetchList()
}

function getRoleRowActions(row: SysRole): TableRowActionItem[] {
  if (isSuperAdminRole(row)) return []
  return [
    {
      key: 'assign',
      label: t('pages.role.assignUser'),
      icon: UserFilled,
      buttonType: 'primary',
      perm: PERM_SYSTEM_ROLE_EDIT,
      onClick: () => goAuthUser(row),
    },
    {
      key: 'edit',
      label: t('common.edit'),
      icon: EditPen,
      buttonType: 'primary',
      perm: PERM_SYSTEM_ROLE_EDIT,
      onClick: () => void openEdit(row),
    },
    {
      key: 'remove',
      label: t('common.delete'),
      icon: Delete,
      buttonType: 'danger',
      perm: PERM_SYSTEM_ROLE_REMOVE,
      onClick: () => void onRemove(row),
    },
  ]
}

</script>

<template>
  <SimplePage :title="t('pages.role.title')" :subtitle="t('pages.role.subtitle')">
    <div class="toolbar role-toolbar">
      <el-button v-permission="PERM_SYSTEM_ROLE_ADD" type="primary" @click="openCreate">
        {{ t('pages.role.create') }}
      </el-button>
      <span class="grow" />
      <div class="role-search">
        <SearchEngines
          :dats="searchItems"
          :history="true"
          show-columns-toggle
          :table-columns="tableColumns.map((c) => ({ key: c.prop, label: c.label }))"
          table-columns-storage-key="system:role"
          @columns-change="(keys) => (visibleColumnKeys = keys as string[])"
          @refresh="refreshPage"
          @handlesousuos="
            (q) => {
              qRoleName = (q?.roleName ?? '') as string
              qRoleKey = (q?.roleKey ?? '') as string
              qStatus = (q?.status ?? '') as string
              pageNum = 1
              fetchList()
            }
          "
        />
      </div>
    </div>
    <ResponsiveDataTable
      :columns="renderTableColumns"
      :data="rows as unknown as Record<string, unknown>[]"
      :loading="loading"
      row-key="roleId"
      :actions-column-width="220"
      mobile-title-prop="roleName"
      stripe
    >
      <template #column-dataScope="{ row }">
        {{ formatDataScope((row as SysRole).dataScope) }}
      </template>
      <template #column-status="{ row }">
        <el-tag :type="(row as SysRole).status === '0' ? 'success' : 'info'" size="small">
          {{ (row as SysRole).status === '0' ? t('status.normal') : t('status.disabled') }}
        </el-tag>
      </template>
      <template #actions="{ row }">
        <TableRowActions
          :items="getRoleRowActions(row as SysRole)"
          :more-label="t('common.moreActions')"
        />
      </template>
    </ResponsiveDataTable>
    <div class="pager">
      <SmartPagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        @current-change="() => fetchList()"
      />
    </div>

    <GlassFormDialog
      v-model="dialogVisible"
      :title="t('pages.role.dialogTitle')"
      width="min(92vw, 640px)"
      :loading="dialogSaving"
      @confirm="submitForm"
      @cancel="closeRoleDialog"
    >
      <template #subtitle>
        {{ form.roleId ? t('pages.role.dialogHintEdit') : t('pages.role.dialogHintCreate') }}
      </template>
      <el-form label-width="96px">
        <el-form-item :label="t('pages.role.labelName')" required>
          <el-input v-model="form.roleName" />
        </el-form-item>
        <el-form-item :label="t('pages.role.labelKey')" required>
          <el-input v-model="form.roleKey" :disabled="form.roleKey === 'admin'" />
        </el-form-item>
        <el-form-item :label="t('table.sort')">
          <el-input-number v-model="form.roleSort" :min="0" />
        </el-form-item>
        <el-form-item :label="t('pages.role.labelDataScope')">
          <el-select v-model="form.dataScope" style="width: 100%">
            <el-option
              v-for="o in dataScopeOptions"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.dataScope === '2'" :label="t('pages.role.labelDept')">
          <el-tree-select
            v-model="form.deptIds"
            :data="deptTree"
            multiple
            show-checkbox
            check-strictly
            node-key="deptId"
            :props="{ label: 'deptName', children: 'children' }"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item :label="t('table.status')">
          <el-radio-group v-model="form.status">
            <el-radio :value="'0'">{{ t('status.normal') }}</el-radio>
            <el-radio :value="'1'">{{ t('status.disabled') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('common.remark')">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item :label="t('pages.role.labelMenuPerm')">
          <SmartTree
            :key="`mt-${form.roleId}-${dialogVisible}`"
            ref="menuTreeRef"
            :data="menuTree as any"
            node-key="menuId"
            :props="{ label: 'menuName', children: 'children' }"
            :show-checkbox="true"
            :default-checked-keys="form.menuIds"
            body-max-height="280px"
            actions-placement="top-right"
          />
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
.role-toolbar {
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
.role-search {
  width: min(520px, 46vw);
  min-width: 320px;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

</style>
