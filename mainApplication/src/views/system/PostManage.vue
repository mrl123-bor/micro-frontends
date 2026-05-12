<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from '@/utils/toast'
import { EditPen, Delete } from '@element-plus/icons-vue'
import SimplePage from '@/views/common/SimplePage.vue'
import SearchEngines from '@/components/SearchEngines/index.vue'
import ResponsiveDataTable from '@/components/ResponsiveDataTable.vue'
import SmartPagination from '@/components/SmartPagination/index.vue'
import {
  PERM_SYSTEM_POST_ADD,
  PERM_SYSTEM_POST_EDIT,
  PERM_SYSTEM_POST_REMOVE,
} from '@/constants/perms'
import * as postApi from '@/api/post'
import type { SysPost } from '@/types/api'
import type { ResponsiveTableColumn } from '@/types/responsive-table'
import GlassFormDialog from '@/components/GlassFormDialog.vue'
import FunConfirmDialog from '@/components/FunConfirmDialog.vue'
import { useFunConfirmDialog } from '@/composables/useFunConfirmDialog'
import TableRowActions from '@/components/TableRowActions.vue'
import type { TableRowActionItem } from '@/types/table-row-actions'

const { t } = useI18n()
const funConfirm = useFunConfirmDialog()
const loading = ref(false)
const rows = ref<SysPost[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const qPostCode = ref('')
const qPostName = ref('')
const qStatus = ref('')

const searchItems = computed(() => [
  { title: t('pages.post.filterCode'), value: 'postCode', kiklis: '1', tesvalue: true, switch: true },
  { title: t('pages.post.filterName'), value: 'postName', kiklis: '1', switch: true },
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

const dialogVisible = ref(false)
const dialogSaving = ref(false)
const form = ref<Partial<SysPost> & { postId?: number }>({
  postCode: '',
  postName: '',
  postSort: 0,
  status: '0',
  remark: '',
})

const tableColumns = computed<ResponsiveTableColumn[]>(() => [
  { prop: 'postId', label: t('table.id'), width: 64, mobileHidden: true },
  { prop: 'postCode', label: t('table.postCode'), width: 120, mobileOrder: 1 },
  { prop: 'postName', label: t('table.postName'), minWidth: 120, mobileOrder: 2 },
  { prop: 'postSort', label: t('table.sort'), width: 72, mobileOrder: 3 },
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
    const res = await postApi.postList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      postCode: qPostCode.value || undefined,
      postName: qPostName.value || undefined,
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

function openCreate() {
  form.value = { postCode: '', postName: '', postSort: 0, status: '0', remark: '' }
  dialogVisible.value = true
}

function openEdit(row: SysPost) {
  form.value = { ...row }
  dialogVisible.value = true
}

async function submit() {
  dialogSaving.value = true
  try {
    if (form.value.postId) {
      await postApi.postUpdate({
        ...form.value,
        postId: form.value.postId,
      })
      toast.success(t('common.saveOk'))
    } else {
      await postApi.postCreate(form.value)
      toast.success(t('common.create'))
    }
    dialogVisible.value = false
    await fetchList()
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : t('common.opFail'))
  } finally {
    dialogSaving.value = false
  }
}

async function onRemove(row: SysPost) {
  const ok = await funConfirm.open({
    title: t('common.tip'),
    message: t('pages.post.deleteConfirm', { name: row.postName }),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
  })
  if (!ok) return
  await postApi.postRemove([row.postId])
  toast.success(t('common.deleteOk'))
  await fetchList()
}

function getPostRowActions(row: SysPost): TableRowActionItem[] {
  return [
    {
      key: 'edit',
      label: t('common.edit'),
      icon: EditPen,
      buttonType: 'primary',
      perm: PERM_SYSTEM_POST_EDIT,
      onClick: () => void openEdit(row),
    },
    {
      key: 'remove',
      label: t('common.delete'),
      icon: Delete,
      buttonType: 'danger',
      perm: PERM_SYSTEM_POST_REMOVE,
      onClick: () => void onRemove(row),
    },
  ]
}

</script>

<template>
  <SimplePage :title="t('pages.post.title')" :subtitle="t('pages.post.subtitle')">
    <div class="toolbar post-toolbar">
      <el-button v-permission="PERM_SYSTEM_POST_ADD" type="primary" @click="openCreate">
        {{ t('pages.post.create') }}
      </el-button>
      <span class="grow" />
      <div class="post-search">
        <SearchEngines
          :dats="searchItems"
          :history="true"
          show-columns-toggle
          :table-columns="tableColumns.map((c) => ({ key: c.prop, label: c.label }))"
          table-columns-storage-key="system:post"
          @columns-change="(keys) => (visibleColumnKeys = keys as string[])"
          @refresh="refreshPage"
          @handlesousuos="
            (q) => {
              qPostCode = (q?.postCode ?? '') as string
              qPostName = (q?.postName ?? '') as string
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
      row-key="postId"
      :actions-column-width="200"
      mobile-title-prop="postName"
      stripe
    >
      <template #column-status="{ row }">
        <el-tag :type="(row as SysPost).status === '0' ? 'success' : 'info'" size="small">
          {{ (row as SysPost).status === '0' ? t('status.normal') : t('status.disabled') }}
        </el-tag>
      </template>
      <template #actions="{ row }">
        <TableRowActions
          :items="getPostRowActions(row as SysPost)"
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
      :title="form.postId ? t('pages.post.dialogEdit') : t('pages.post.dialogNew')"
      width="min(92vw, 440px)"
      :loading="dialogSaving"
      @confirm="submit"
    >
      <el-form label-width="88px">
        <el-form-item :label="t('table.postCode')">
          <el-input v-model="form.postCode" />
        </el-form-item>
        <el-form-item :label="t('table.postName')">
          <el-input v-model="form.postName" />
        </el-form-item>
        <el-form-item :label="t('table.sort')">
          <el-input-number v-model="form.postSort" :min="0" />
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
  </SimplePage>
</template>

<style scoped lang="scss">
.post-toolbar {
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
.post-search {
  width: min(520px, 46vw);
  min-width: 320px;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
