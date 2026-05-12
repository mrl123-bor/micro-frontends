<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { toast } from '@/utils/toast'
import { CircleClose } from '@element-plus/icons-vue'
import * as roleApi from '@/api/role'
import type { SysUser } from '@/types/api'
import SimplePage from '@/views/common/SimplePage.vue'
import SearchEngines from '@/components/SearchEngines/index.vue'
import ResponsiveDataTable from '@/components/ResponsiveDataTable.vue'
import type { ResponsiveTableColumn } from '@/types/responsive-table'
import { useMobile } from '@/hooks'
import SmartPagination from '@/components/SmartPagination/index.vue'
import { ROUTE_NAMES } from '@/constants/route-names'
import FunConfirmDialog from '@/components/FunConfirmDialog.vue'
import { useFunConfirmDialog } from '@/composables/useFunConfirmDialog'
import TableRowActions from '@/components/TableRowActions.vue'
import type { TableRowActionItem } from '@/types/table-row-actions'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const roleId = Number(route.params.roleId)
const loading = ref(false)
const rows = ref<SysUser[]>([])
const total = ref(0)
const selections = ref<SysUser[]>([])
const { isMobile } = useMobile(768)
const funConfirm = useFunConfirmDialog()

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  userName: '',
  phonenumber: '',
})

const searchItems = computed(() => [
  { title: t('pages.authUser.filterUserName'), value: 'userName', kiklis: '1', tesvalue: true, switch: true },
  { title: t('pages.authUser.filterPhone'), value: 'phonenumber', kiklis: '1', switch: true },
])

const tableColumns = computed<ResponsiveTableColumn[]>(() => [
  { prop: 'userId', label: t('table.userId'), width: 100, mobileHidden: true },
  { prop: 'userName', label: t('table.userName'), minWidth: 120, mobileOrder: 1 },
  { prop: 'nickName', label: t('table.nickName'), minWidth: 120, mobileOrder: 2 },
  { prop: 'phonenumber', label: t('table.phone'), width: 120, mobileOrder: 3 },
  { prop: 'status', label: t('table.status'), width: 88, mobileOrder: 4 },
])

const visibleColumnKeys = ref<string[] | null>(null)
const renderTableColumns = computed(() => {
  if (!visibleColumnKeys.value?.length) return tableColumns.value
  const byProp = new Map(tableColumns.value.map((c) => [String(c.prop), c]))
  return visibleColumnKeys.value.map((k) => byProp.get(String(k))).filter(Boolean) as ResponsiveTableColumn[]
})

async function fetchList(opts?: { silent?: boolean }) {
  if (!opts?.silent) loading.value = true
  try {
    const res = await roleApi.allocatedUserList({
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      userName: query.userName || undefined,
      phonenumber: query.phonenumber || undefined,
      roleId,
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

function onSelectionChange(s: unknown[]) {
  selections.value = s as SysUser[]
}

async function cancelOne(row: SysUser) {
  const ok = await funConfirm.open({
    title: t('common.tip'),
    message: t('pages.authUser.cancelOneConfirm', { name: row.userName }),
    confirmText: t('common.confirm'),
    cancelText: t('common.cancel'),
  })
  if (!ok) return
  await roleApi.authUserCancel({ userId: row.userId, roleId })
  toast.success(t('crud.cancelAuthOk'))
  fetchList()
}

async function cancelBatch() {
  if (!selections.value.length) {
    toast.warning(t('crud.selectUsersFirst'))
    return
  }
  const ok = await funConfirm.open({
    title: t('common.tip'),
    message: t('crud.cancelAuthBatchTitle'),
    confirmText: t('common.confirm'),
    cancelText: t('common.cancel'),
  })
  if (!ok) return
  await roleApi.authUserCancelAll({
    roleId,
    userIds: selections.value.map((u) => u.userId).join(','),
  })
  toast.success(t('crud.cancelAuthOk'))
  fetchList()
}

function back() {
  router.push({ name: ROUTE_NAMES.systemRoles })
}

function getAuthUserRowActions(row: SysUser): TableRowActionItem[] {
  return [
    {
      key: 'cancel',
      label: t('pages.authUser.cancelAuth'),
      icon: CircleClose,
      buttonType: 'danger',
      onClick: () => void cancelOne(row),
    },
  ]
}

</script>

<template>
  <SimplePage :title="t('pages.authUser.title')" :subtitle="t('pages.authUser.subtitle')">
    <SearchEngines
      :dats="searchItems"
      :history="true"
      show-columns-toggle
      :table-columns="tableColumns.map((c) => ({ key: c.prop, label: c.label }))"
      table-columns-storage-key="system:role:authUser"
      @columns-change="(keys) => (visibleColumnKeys = keys as string[])"
      @refresh="refreshPage"
      @handlesousuos="
        (q) => {
          query.userName = q?.userName ?? ''
          query.phonenumber = q?.phonenumber ?? ''
          query.pageNum = 1
          fetchList()
        }
      "
    />

    <div class="toolbar-actions">
      <el-button v-if="!isMobile" type="danger" plain :disabled="!selections.length" @click="cancelBatch">
        {{ t('pages.authUser.batchCancel') }}
      </el-button>
      <el-button @click="back">{{ t('common.close') }}</el-button>
    </div>

    <ResponsiveDataTable
      :columns="renderTableColumns"
      :data="rows as unknown as Record<string, unknown>[]"
      :loading="loading"
      row-key="userId"
      :actions-column-width="120"
      mobile-title-prop="userName"
      stripe
      selection
      @selection-change="onSelectionChange"
    >
      <template #column-status="{ row }">
        <el-tag :type="(row as SysUser).status === '0' ? 'success' : 'info'" size="small">
          {{ (row as SysUser).status === '0' ? t('status.normal') : t('status.disabled') }}
        </el-tag>
      </template>
      <template #actions="{ row }">
        <TableRowActions
          :items="getAuthUserRowActions(row as SysUser)"
          :more-label="t('common.moreActions')"
        />
      </template>
    </ResponsiveDataTable>

    <div class="pager">
      <SmartPagination
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        :total="total"
        @current-change="() => fetchList()"
        @size-change="
          () => {
            query.pageNum = 1
            fetchList()
          }
        "
      />
    </div>

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
.toolbar {
  margin-bottom: 12px;
}
.toolbar-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
