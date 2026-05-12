<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from '@/utils/toast'
import { EditPen } from '@element-plus/icons-vue'
import type { ResponsiveTableColumn } from '@/types/responsive-table.ts'
import type { SysAccount } from '@/types/api.ts'
import SimplePage from '@/views/common/SimplePage.vue'
import SearchEngines from '@/components/SearchEngines/index.vue'
import ResponsiveDataTable from '@/components/ResponsiveDataTable.vue'
import SmartPagination from '@/components/SmartPagination/index.vue'
import GlassFormDialog from '@/components/GlassFormDialog.vue'
import TableRowActions from '@/components/TableRowActions.vue'
import * as accountApi from '@/api/account.ts'
import {
  PERM_SYSTEM_ACCOUNT_ADD,
  PERM_SYSTEM_ACCOUNT_EDIT,
} from '@/constants/perms.ts'
import type { TableRowActionItem } from '@/types/table-row-actions.ts'

const { t } = useI18n()
const loading = ref(false)
const rows = ref<SysAccount[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const qAccount = ref('')
const qCompanyName = ref('')
const qEmail = ref('')
const qStatus = ref('')

const dialogVisible = ref(false)
const dialogSaving = ref(false)
const form = ref({
  accountId: 0,
  account: '',
  password: '',
  companyName: '',
  email: '',
  loginValidMinutes: 60,
  status: '0',
})

const searchItems = computed(() => [
  { title: '账号', value: 'account', kiklis: '1', tesvalue: true, switch: true },
  { title: '公司名称', value: 'companyName', kiklis: '1', switch: true },
  { title: '邮箱', value: 'email', kiklis: '1', switch: true },
  {
    title: '状态',
    value: 'status',
    kiklis: '0',
    switch: true,
    children: [
      { title: '正常', value: '0' },
      { title: '停用', value: '1' },
    ],
  },
])

const tableColumns = computed<ResponsiveTableColumn[]>(() => [
  { prop: 'accountId', label: 'ID', width: 72, mobileHidden: true },
  { prop: 'account', label: '账号', minWidth: 140, mobileOrder: 1 },
  { prop: 'companyName', label: '公司名称', minWidth: 160, mobileOrder: 2 },
  { prop: 'email', label: '邮箱', minWidth: 180, mobileOrder: 3 },
  { prop: 'loginValidMinutes', label: '登录有效时间(分钟)', minWidth: 150, mobileOrder: 4 },
  { prop: 'status', label: '状态', width: 88, mobileOrder: 5 },
])

const visibleColumnKeys = ref<string[] | null>(null)
const renderTableColumns = computed(() => {
  if (!visibleColumnKeys.value?.length) return tableColumns.value
  const byProp = new Map(tableColumns.value.map((c) => [String(c.prop), c]))
  return visibleColumnKeys.value
    .map((k) => byProp.get(String(k)))
    .filter(Boolean) as ResponsiveTableColumn[]
})

async function fetchList(opts?: { silent?: boolean }) {
  if (!opts?.silent) loading.value = true
  try {
    const res = await accountApi.accountList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      account: qAccount.value || undefined,
      companyName: qCompanyName.value || undefined,
      email: qEmail.value || undefined,
      status: qStatus.value || undefined,
    })
    rows.value = res.list
    total.value = res.total
  } finally {
    if (!opts?.silent) loading.value = false
  }
}

function openCreate() {
  form.value = {
    accountId: 0,
    account: '',
    password: '',
    companyName: '',
    email: '',
    loginValidMinutes: 60,
    status: '0',
  }
  dialogVisible.value = true
}

async function openEdit(row: SysAccount) {
  const detail = await accountApi.accountDetail(row.accountId)
  form.value = {
    accountId: detail.accountId,
    account: detail.account,
    password: '',
    companyName: detail.companyName,
    email: detail.email,
    loginValidMinutes: detail.loginValidMinutes,
    status: detail.status,
  }
  dialogVisible.value = true
}

async function submit() {
  dialogSaving.value = true
  try {
    if (!form.value.accountId) {
      if (!form.value.password) {
        toast.error('新增时必须填写密码')
        return
      }
      await accountApi.accountCreate({
        account: form.value.account,
        password: form.value.password,
        companyName: form.value.companyName,
        email: form.value.email,
        loginValidMinutes: form.value.loginValidMinutes,
        status: form.value.status,
      })
      toast.success('新增成功')
    } else {
      await accountApi.accountUpdate({
        accountId: form.value.accountId,
        password: form.value.password || undefined,
        companyName: form.value.companyName,
        email: form.value.email,
        loginValidMinutes: form.value.loginValidMinutes,
        status: form.value.status,
      })
      toast.success('保存成功')
    }
    dialogVisible.value = false
    await fetchList()
  } finally {
    dialogSaving.value = false
  }
}

function refreshPage() {
  void fetchList()
}

function getAccountRowActions(row: SysAccount): TableRowActionItem[] {
  return [
    {
      key: 'edit',
      label: '编辑',
      icon: EditPen,
      buttonType: 'primary',
      perm: PERM_SYSTEM_ACCOUNT_EDIT,
      onClick: () => void openEdit(row),
    },
  ]
}

</script>

<template>
  <SimplePage title="账号管理" subtitle="账号、公司、邮箱、登录有效时间、状态管理">
    <div class="toolbar account-toolbar">
      <el-button v-permission="PERM_SYSTEM_ACCOUNT_ADD" type="primary" @click="openCreate">
        新增账号
      </el-button>
      <span class="grow" />
      <div class="account-search">
        <SearchEngines
          :dats="searchItems"
          :history="true"
          show-columns-toggle
          :table-columns="tableColumns.map((c) => ({ key: c.prop, label: c.label }))"
          table-columns-storage-key="system:account"
          @columns-change="(keys) => (visibleColumnKeys = keys as string[])"
          @refresh="refreshPage"
          @handlesousuos="
            (q) => {
              qAccount = (q?.account ?? '') as string
              qCompanyName = (q?.companyName ?? '') as string
              qEmail = (q?.email ?? '') as string
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
      row-key="accountId"
      :actions-column-width="120"
      mobile-title-prop="account"
      stripe
    >
      <template #column-status="{ row }">
        <el-tag :type="(row as SysAccount).status === '0' ? 'success' : 'info'" size="small">
          {{ (row as SysAccount).status === '0' ? '正常' : '停用' }}
        </el-tag>
      </template>
      <template #actions="{ row }">
        <TableRowActions
          :items="getAccountRowActions(row as SysAccount)"
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
      :title="form.accountId ? '编辑账号' : '新增账号'"
      width="min(92vw, 520px)"
      :loading="dialogSaving"
      @confirm="submit"
    >
      <el-form label-width="120px">
        <el-form-item label="账号" required>
          <el-input v-model="form.account" :disabled="!!form.accountId" />
        </el-form-item>
        <el-form-item :label="form.accountId ? '新密码(可选)' : '密码'" :required="!form.accountId">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="公司名称" required>
          <el-input v-model="form.companyName" />
        </el-form-item>
        <el-form-item label="邮箱" required>
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="登录有效时间(分钟)" required>
          <el-input-number v-model="form.loginValidMinutes" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态" required>
          <el-radio-group v-model="form.status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </GlassFormDialog>
  </SimplePage>
</template>

<style scoped lang="scss">
.account-toolbar {
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
.account-search {
  width: min(560px, 48vw);
  min-width: 320px;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
