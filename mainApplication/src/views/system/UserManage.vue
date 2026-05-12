<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { Search, UserFilled, EditPen, Key, Delete } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { toast } from '@/utils/toast'
import SimplePage from '@/views/common/SimplePage.vue'
import SearchEngines from '@/components/SearchEngines/index.vue'
import ResponsiveDataTable from '@/components/ResponsiveDataTable.vue'
import SmartTree from '@/components/SmartTree/index.vue'
import SmartPagination from '@/components/SmartPagination/index.vue'
import {
  PERM_SYSTEM_USER_ADD,
  PERM_SYSTEM_USER_EDIT,
  PERM_SYSTEM_USER_REMOVE,
  PERM_SYSTEM_USER_RESET,
} from '@/constants/perms'
import * as userApi from '@/api/user'
import type { SysDept, SysUser } from '@/types/api'
import type { ResponsiveTableColumn } from '@/types/responsive-table'
import { ROUTE_NAMES } from '@/constants/route-names'
import GlassFormDialog from '@/components/GlassFormDialog.vue'
import FunConfirmDialog from '@/components/FunConfirmDialog.vue'
import TableRowActions from '@/components/TableRowActions.vue'
import { useFunConfirmDialog } from '@/composables/useFunConfirmDialog'
import type { TableRowActionItem } from '@/types/table-row-actions'

const router = useRouter()
const { t } = useI18n()

const loading = ref(false)
const rows = ref<SysUser[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const qUserName = ref('')
const qStatus = ref('')
const funConfirm = useFunConfirmDialog()
const resetPwdConfirm = useFunConfirmDialog()
const newPwdDraft = ref('')
const resetPwdTargetUserId = ref(0)

const searchItems = computed(() => [
  {
    title: t('table.userNameAccount'),
    value: 'userName',
    kiklis: '1',
    tesvalue: true,
    switch: true,
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

/** 左侧部门树：选中则右侧按 deptId 筛选（与后端 /system/user/list?deptId= 一致） */
const selectedDeptId = ref<number | undefined>(undefined)
/** 与 el-tree 高亮同步，清空时表示未选部门 */
const treeCurrentKey = ref<number | undefined>(undefined)
const deptFilterText = ref('')

const dialogVisible = ref(false)
const dialogSaving = ref(false)
const form = ref({
  userId: 0,
  userName: '',
  nickName: '',
  password: '',
  deptId: undefined as number | undefined,
  email: '',
  phonenumber: '',
  sex: '0',
  status: '0',
  remark: '',
  roleIds: [] as number[],
  postIds: [] as number[],
})

const roleOptions = ref<{ roleId: number; roleName: string }[]>([])
const postOptions = ref<{ postId: number; postName: string }[]>([])
const deptTree = ref<SysDept[]>([])

const dialogTitle = computed(() =>
  form.value.userId ? t('pages.user.dialogEdit') : t('pages.user.dialogNew'),
)

const deptOptions = computed(() => {
  const out: { label: string; value: number }[] = []
  function walk(list: SysDept[], prefix: string) {
    for (const d of list) {
      const label = prefix ? `${prefix} / ${d.deptName}` : d.deptName
      out.push({ label, value: d.deptId })
      if (d.children?.length) walk(d.children, label)
    }
  }
  walk(deptTree.value, '')
  return out
})

const selectedDeptLabel = computed(() => {
  if (selectedDeptId.value == null) return ''
  function findName(list: SysDept[]): string | null {
    for (const d of list) {
      if (d.deptId === selectedDeptId.value) return d.deptName
      if (d.children?.length) {
        const n = findName(d.children)
        if (n) return n
      }
    }
    return null
  }
  return findName(deptTree.value) ?? ''
})

const tableColumns = computed<ResponsiveTableColumn[]>(() => [
  { prop: 'userId', label: t('table.id'), width: 64, mobileHidden: true },
  { prop: 'userName', label: t('table.userNameAccount'), minWidth: 100, mobileOrder: 1 },
  { prop: 'nickName', label: t('table.nickName'), minWidth: 100, mobileOrder: 2 },
  { prop: 'phonenumber', label: t('table.phone'), width: 130, mobileOrder: 3, mobileHidden: true },
  { prop: 'dept', label: t('table.dept'), minWidth: 120, mobileOrder: 3 },
  { prop: 'roles', label: t('table.roles'), minWidth: 140, mobileOrder: 4 },
  { prop: 'status', label: t('table.status'), mobileOrder: 5 },
])

const visibleColumnKeys = ref<string[] | null>(null)
const renderTableColumns = computed(() => {
  if (!visibleColumnKeys.value?.length) return tableColumns.value
  const byProp = new Map(tableColumns.value.map((c) => [String(c.prop), c]))
  return visibleColumnKeys.value.map((k) => byProp.get(String(k))).filter(Boolean) as ResponsiveTableColumn[]
})

async function loadDeptTree() {
  deptTree.value = await userApi.userDeptTree()
}

/** nest-admin：GET /system/user/deptTree + GET /system/user（角色+岗位） */
async function loadDialogOptions() {
  const loadTree = deptTree.value.length
    ? Promise.resolve()
    : loadDeptTree()
  const [_, aux] = await Promise.all([loadTree, userApi.userFormAux()])
  roleOptions.value = aux.roles.map((x) => ({
    roleId: x.roleId,
    roleName: x.roleName,
  }))
  postOptions.value = aux.posts.map((x) => ({
    postId: x.postId,
    postName: x.postName,
  }))
}

watch(dialogVisible, (open) => {
  if (open) void loadDialogOptions()
})

function filterDeptNode(value: string, data: SysDept) {
  if (!value) return true
  return data.deptName.includes(value)
}

function onDeptNodeClick(data: SysDept) {
  treeCurrentKey.value = data.deptId
  selectedDeptId.value = data.deptId
  pageNum.value = 1
  fetchList()
}

function clearDeptFilter() {
  selectedDeptId.value = undefined
  treeCurrentKey.value = undefined
  pageNum.value = 1
  fetchList()
}

async function fetchList(opts?: { silent?: boolean }) {
  if (!opts?.silent) loading.value = true
  try {
    const res = await userApi.userList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      userName: qUserName.value || undefined,
      status: qStatus.value || undefined,
      deptId: selectedDeptId.value,
    })
    rows.value = res.list
    total.value = res.total
  } finally {
    if (!opts?.silent) loading.value = false
  }
}

function openCreate() {
  form.value = {
    userId: 0,
    userName: '',
    nickName: '',
    password: '',
    deptId: undefined,
    email: '',
    phonenumber: '',
    sex: '0',
    status: '0',
    remark: '',
    roleIds: [],
    postIds: [],
  }
  dialogVisible.value = true
}

async function openEdit(row: SysUser) {
  const detail = await userApi.userDetail(row.userId)
  form.value = {
    userId: detail.userId,
    userName: detail.userName,
    nickName: detail.nickName,
    password: '',
    deptId: detail.deptId ?? undefined,
    email: detail.email ?? '',
    phonenumber: detail.phonenumber ?? '',
    sex: detail.sex ?? '0',
    status: detail.status ?? '0',
    remark: detail.remark ?? '',
    roleIds: detail.roles?.map((r) => r.roleId) ?? [],
    postIds: detail.posts?.map((p) => p.postId) ?? [],
  }
  dialogVisible.value = true
}

async function submitForm() {
  dialogSaving.value = true
  try {
    if (!form.value.userId) {
      await userApi.userCreate({
        userName: form.value.userName,
        nickName: form.value.nickName,
        password: form.value.password || undefined,
        deptId: form.value.deptId,
        email: form.value.email,
        phonenumber: form.value.phonenumber,
        sex: form.value.sex,
        status: form.value.status,
        remark: form.value.remark,
        roleIds: form.value.roleIds,
        postIds: form.value.postIds,
      })
      toast.success(t('common.create'))
    } else {
      await userApi.userUpdate({
        userId: form.value.userId,
        nickName: form.value.nickName,
        deptId: form.value.deptId,
        email: form.value.email,
        phonenumber: form.value.phonenumber,
        sex: form.value.sex,
        status: form.value.status,
        remark: form.value.remark,
        roleIds: form.value.roleIds,
        postIds: form.value.postIds,
      })
      toast.success(t('common.saveOk'))
    }
    dialogVisible.value = false
    await fetchList()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : t('common.saveFail')
    toast.error(msg)
  } finally {
    dialogSaving.value = false
  }
}

async function onRemove(row: SysUser) {
  const ok = await funConfirm.open({
    title: t('common.tip'),
    message: t('pages.user.deleteConfirm', { name: row.userName }),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
  })
  if (!ok) return
  await userApi.userRemove([row.userId])
  toast.success(t('common.deleteOk'))
  await fetchList()
}

function onResetPwd(row: SysUser) {
  resetPwdTargetUserId.value = row.userId
  newPwdDraft.value = ''
  void resetPwdConfirm.open({
    title: t('crud.resetPwdTitle'),
    message: t('crud.newPwdPrompt'),
    tips: [t('crud.pwdRule')],
    confirmText: t('common.confirm'),
    cancelText: t('common.cancel'),
  })
}

async function onResetPwdDialogConfirm() {
  if (!/.{6,}/.test(newPwdDraft.value)) {
    toast.error(t('crud.pwdRule'))
    return
  }
  try {
    await userApi.resetPwd(resetPwdTargetUserId.value, newPwdDraft.value)
    resetPwdConfirm.onConfirm()
    toast.success(t('crud.resetPwdOk'))
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : t('common.opFail'))
  }
}

function formatRoles(row: SysUser) {
  return row.roles?.map((r: { roleName: string }) => r.roleName).join('、') ?? ''
}

function goAuthRole(row: SysUser) {
  router.push({ name: ROUTE_NAMES.authRole, params: { userId: String(row.userId) } })
}

function isSuperAdminUser(row: SysUser) {
  return row.userId === 1 || row.userName === 'admin' || !!row.roles?.some((r) => r.roleKey === 'admin')
}

function getUserRowActions(row: SysUser): TableRowActionItem[] {
  if (isSuperAdminUser(row)) return []
  return [
    {
      key: 'edit',
      label: t('common.edit'),
      icon: EditPen,
      buttonType: 'primary',
      perm: PERM_SYSTEM_USER_EDIT,
      onClick: () => void openEdit(row),
    },
    {
      key: 'role',
      label: t('pages.user.assignRole'),
      icon: UserFilled,
      buttonType: 'primary',
      perm: PERM_SYSTEM_USER_EDIT,
      onClick: () => goAuthRole(row),
    },
    {
      key: 'reset',
      label: t('pages.user.resetPwd'),
      icon: Key,
      buttonType: 'warning',
      perm: PERM_SYSTEM_USER_RESET,
      onClick: () => void onResetPwd(row),
    },
    {
      key: 'remove',
      label: t('common.delete'),
      icon: Delete,
      buttonType: 'danger',
      perm: PERM_SYSTEM_USER_REMOVE,
      onClick: () => void onRemove(row),
    },
  ]
}

/** 部门树 + 列表；刷新按钮用。首屏列表由 SearchEngines（history）挂载时 emit 拉取，避免与 onMounted 双请求 */
async function loadDeptAndList(options?: { tipOnOk?: boolean }) {
  loading.value = true
  try {
    await loadDeptTree()
    await fetchList({ silent: true })
    if (options?.tipOnOk) toast.success(t('crud.listRefreshOk'))
  } finally {
    loading.value = false
  }
}

/** 仅拉左侧部门树；与 SearchEngines 首屏 emit 顺序兼容（子组件先 mounted 再触发列表） */
async function loadDeptOnly() {
  loading.value = true
  try {
    await loadDeptTree()
  } finally {
    loading.value = false
  }
}

function refreshPage() {
  void loadDeptAndList({ tipOnOk: true })
}

onMounted(() => {
  void loadDeptOnly()
})
</script>

<template>
  <SimplePage :title="t('pages.user.title')" :subtitle="t('pages.user.subtitle')">
    <div class="user-page-layout">
      <aside class="dept-aside">
        <header class="dept-aside__head">
          <span class="dept-aside__title">{{ t('pages.user.deptPanelTitle') }}</span>
        </header>
        <el-input
          v-model="deptFilterText"
          clearable
          :placeholder="t('pages.user.deptFilterPh')"
          class="dept-tree-filter"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <div class="dept-aside-hint">
          <div class="dept-aside-left">
            <span v-if="selectedDeptId != null" class="dept-sel" :title="selectedDeptLabel"
              >{{ t('pages.user.current') }}：{{ selectedDeptLabel }}</span
            >
            <el-button
              v-if="selectedDeptId != null"
              link
              type="primary"
              size="small"
              @click="clearDeptFilter"
            >
              {{ t('pages.user.viewAll') }}
            </el-button>
          </div>
        </div>
        <div class="dept-tree-scroll">
          <SmartTree
            class="dept-smart-tree"
            :data="deptTree as any"
            node-key="deptId"
            :props="{ label: 'deptName', children: 'children' }"
            :highlight-current="true"
            :current-node-key="treeCurrentKey"
            :expand-on-click-node="false"
            :filter-node-method="filterDeptNode as any"
            :filter-text="deptFilterText"
            body-max-height="100%"
            @node-click="(d) => onDeptNodeClick(d as SysDept)"
          />
        </div>
      </aside>
      <div class="user-main">
    <div class="toolbar user-toolbar">
      <el-button v-permission="PERM_SYSTEM_USER_ADD" type="primary" @click="openCreate">
        {{ t('pages.user.create') }}
      </el-button>
      <span class="grow" />
      <div class="user-search">
        <SearchEngines
          :dats="searchItems"
          :history="true"
          show-columns-toggle
          :table-columns="
            tableColumns.map((c) => ({
              key: c.prop,
              label: c.label,
              defaultVisible: c.prop !== 'phonenumber',
            }))
          "
          table-columns-storage-key="system:user"
          @columns-change="(keys) => (visibleColumnKeys = keys as string[])"
          @refresh="refreshPage"
          @handlesousuos="
            (q) => {
              qUserName = (q?.userName ?? '') as string
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
      row-key="userId"
      :actions-column-width="220"
      mobile-title-prop="userName"
      stripe
    >
      <template #column-dept="{ row }">
        {{ (row as SysUser).dept?.deptName ?? t('common.dash') }}
      </template>
      <template #column-roles="{ row }">
        <span v-if="(row as SysUser).roles?.length">{{ formatRoles(row as SysUser) }}</span>
        <span v-else>{{ t('common.dash') }}</span>
      </template>
      <template #column-status="{ row }">
        <el-tag :type="(row as SysUser).status === '0' ? 'success' : 'info'" size="small">
          {{ (row as SysUser).status === '0' ? t('status.normal') : t('status.disabled') }}
        </el-tag>
      </template>
      <template #actions="{ row }">
        <TableRowActions
          :items="getUserRowActions(row as SysUser)"
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
        @size-change="() => { pageNum = 1; fetchList() }"
      />
    </div>
      </div>
    </div>

    <GlassFormDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="min(92vw, 520px)"
      :loading="dialogSaving"
      @confirm="submitForm"
    >
      <el-form label-width="88px">
        <el-form-item v-if="!form.userId" :label="t('table.userNameAccount')" required>
          <el-input v-model="form.userName" />
        </el-form-item>
        <el-form-item v-if="!form.userId" :label="t('pages.user.initPwd')">
          <el-input v-model="form.password" type="password" show-password :placeholder="t('pages.user.initPwdPh')" />
        </el-form-item>
        <el-form-item :label="t('table.nickName')" required>
          <el-input v-model="form.nickName" />
        </el-form-item>
        <el-form-item :label="t('table.dept')">
          <el-select v-model="form.deptId" clearable filterable :placeholder="t('pages.user.selectDept')" style="width: 100%">
            <el-option
              v-for="o in deptOptions"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('table.roles')">
          <el-select v-model="form.roleIds" multiple collapse-tags style="width: 100%">
            <el-option
              v-for="r in roleOptions"
              :key="r.roleId"
              :label="r.roleName"
              :value="r.roleId"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('table.post')">
          <el-select v-model="form.postIds" multiple collapse-tags style="width: 100%">
            <el-option
              v-for="p in postOptions"
              :key="p.postId"
              :label="p.postName"
              :value="p.postId"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('table.phone')">
          <el-input v-model="form.phonenumber" />
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
        <el-form-item :label="t('common.remark')">
          <el-input v-model="form.remark" type="textarea" rows="2" />
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

    <FunConfirmDialog
      v-model="resetPwdConfirm.visible"
      :title="resetPwdConfirm.title"
      :message="resetPwdConfirm.message"
      :tips="resetPwdConfirm.tips"
      :confirm-text="resetPwdConfirm.confirmText"
      :cancel-text="resetPwdConfirm.cancelText"
      :width="resetPwdConfirm.width"
      :show-cancel="resetPwdConfirm.showCancel"
      @confirm="onResetPwdDialogConfirm"
      @cancel="resetPwdConfirm.onCancel"
    >
      <el-input
        v-model="newPwdDraft"
        type="password"
        show-password
        autocomplete="new-password"
        :placeholder="t('crud.newPwdPrompt')"
      />
    </FunConfirmDialog>
  </SimplePage>
</template>

<style scoped lang="scss">
.user-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 4px;
  padding: 12px 16px;
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-color-primary) 6%, var(--admin-surface-muted, var(--el-fill-color-blank))),
    color-mix(in srgb, var(--el-color-primary) 2%, var(--admin-surface, var(--el-bg-color)))
  );
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 12%, var(--admin-border, var(--el-border-color-lighter)));
  box-shadow: 0 1px 0 color-mix(in srgb, #fff 70%, transparent) inset;

  :deep(.el-button--primary) {
    border-radius: 10px;
    padding: 8px 18px;
    font-weight: 600;
    box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-primary) 28%, transparent);
  }

  @at-root html.dark & {
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--el-color-primary) 14%, var(--el-bg-color)),
      color-mix(in srgb, var(--el-color-primary) 6%, var(--el-bg-color))
    );
    border-color: color-mix(in srgb, var(--el-color-primary) 22%, var(--el-border-color-darker));
    box-shadow: none;
  }
}

.grow {
  flex: 1;
  min-width: 8px;
}

.user-search {
  width: min(520px, 46vw);
  min-width: 320px;
}

.pager {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.user-page-layout {
  display: flex;
  gap: 20px;
  align-items: stretch;
  min-height: 440px;
}

.dept-aside {
  width: 276px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 16px 14px 14px;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--admin-border, var(--el-border-color-lighter)) 82%, var(--el-color-primary) 14%);
  background: linear-gradient(
    165deg,
    var(--admin-surface-muted, var(--el-fill-color-blank)) 0%,
    var(--admin-surface, var(--el-bg-color)) 55%
  );
  box-shadow: var(--admin-shadow-soft, 0 1px 3px rgba(15, 23, 42, 0.06));

  @at-root html.dark & {
    background: linear-gradient(165deg, var(--el-bg-color-overlay) 0%, var(--el-bg-color) 70%);
    border-color: color-mix(in srgb, var(--el-color-primary) 18%, var(--el-border-color-darker));
  }
}

.dept-aside__head {
  margin-bottom: 12px;
}

.dept-aside__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: var(--admin-text, var(--el-text-color-primary));

  &::before {
    content: '';
    width: 4px;
    height: 14px;
    border-radius: 99px;
    background: linear-gradient(180deg, var(--el-color-primary-light-3), var(--el-color-primary));
  }
}

.dept-tree-filter {
  margin-bottom: 10px;

  :deep(.el-input__wrapper) {
    border-radius: 12px;
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 10%, var(--el-border-color)) inset;
    transition: box-shadow 0.2s ease;

    &:hover {
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 22%, var(--el-border-color)) inset;
    }

    &.is-focus {
      box-shadow: 0 0 0 1px var(--el-color-primary) inset, 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
    }
  }
}

.dept-aside-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  min-height: 26px;
  font-size: 12px;
  color: var(--admin-text-secondary, var(--el-text-color-secondary));
}

.dept-aside-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.dept-sel {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.dept-tree-scroll {
  flex: 1;
  min-height: 0;
}

.dept-aside :deep(.dept-smart-tree .smart-tree__body) {
  border: none;
  background: color-mix(in srgb, var(--admin-surface, #fff) 88%, transparent);
  padding: 4px 2px 2px;
  border-radius: 12px;
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 8%, var(--el-border-color-lighter)) inset;

  @at-root html.dark & {
    background: color-mix(in srgb, var(--el-bg-color) 92%, var(--el-color-primary));
    box-shadow: 0 0 0 1px var(--el-border-color-darker) inset;
  }
}

.dept-aside :deep(.dept-smart-tree .smart-tree__actions) {
  margin-bottom: 10px;
}

.dept-aside :deep(.dept-smart-tree .smart-tree__btn) {
  font-weight: 600;
  border-radius: 10px;
}

.user-main {
  flex: 1;
  min-width: 0;
}

.user-main :deep(.el-table) {
  font-size: 13px;
  --el-table-border-color: color-mix(in srgb, var(--admin-border, var(--el-border-color-lighter)) 100%, transparent);
  border-radius: 14px;
  overflow: hidden;
}

.user-main :deep(.el-table th.el-table__cell) {
  background: var(--admin-surface-muted, var(--el-fill-color-light)) !important;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.02em;
  color: var(--admin-text-secondary, var(--el-text-color-secondary));
  padding: 13px 12px !important;
}

.user-main :deep(.el-table .el-table__cell) {
  padding: 13px 12px !important;
  vertical-align: middle;
}

.user-main :deep(.el-table .cell) {
  line-height: 1.5;
}

.user-main :deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background: color-mix(in srgb, var(--el-color-primary) 4%, var(--admin-surface, var(--el-bg-color)));
}

.user-main :deep(.el-tag) {
  border-radius: 999px;
  font-weight: 600;
  border: none;
  padding: 0 10px;
}

@media (max-width: 768px) {
  .user-page-layout {
    flex-direction: column;
    gap: 14px;
    min-height: auto;
  }

  .dept-aside {
    width: 100%;
  }

  .dept-tree-scroll {
    max-height: 260px;
  }

  .user-search {
    width: 100%;
    min-width: 0;
  }

  .user-toolbar {
    padding: 10px 12px;
  }

  .pager {
    justify-content: center;
  }
}
</style>
