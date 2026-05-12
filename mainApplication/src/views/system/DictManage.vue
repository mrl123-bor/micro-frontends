<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from '@/utils/toast'
import { List, EditPen, Delete } from '@element-plus/icons-vue'
import SimplePage from '@/views/common/SimplePage.vue'
import SearchEngines from '@/components/SearchEngines/index.vue'
import ResponsiveDataTable from '@/components/ResponsiveDataTable.vue'
import {
  PERM_SYSTEM_DICT_ADD,
  PERM_SYSTEM_DICT_EDIT,
  PERM_SYSTEM_DICT_REMOVE,
} from '@/constants/perms'
import * as dictApi from '@/api/dict'
import type { DictType, DictData } from '@/types/api'
import type { ResponsiveTableColumn } from '@/types/responsive-table'
import SmartPagination from '@/components/SmartPagination/index.vue'
import GlassFormDialog from '@/components/GlassFormDialog.vue'
import FunConfirmDialog from '@/components/FunConfirmDialog.vue'
import { useFunConfirmDialog } from '@/composables/useFunConfirmDialog'
import TableRowActions from '@/components/TableRowActions.vue'
import type { TableRowActionItem } from '@/types/table-row-actions'

const { t } = useI18n()
const funConfirm = useFunConfirmDialog()
const active = ref<'type' | 'data'>('type')

const typeLoading = ref(false)
const typeRows = ref<DictType[]>([])
const typeTotal = ref(0)
const typePage = ref(1)
const typeSize = ref(10)

const dataLoading = ref(false)
const dataRows = ref<DictData[]>([])
const dataTotal = ref(0)
const dataPage = ref(1)
const dataSize = ref(10)
const dataDictType = ref('')
const dataDictLabel = ref('')
const dataStatus = ref('')

const typeSearchItems = computed(() => [
  { title: t('table.dictTypeName'), value: 'dictName', kiklis: '1', tesvalue: true, switch: true },
  { title: t('table.dictType'), value: 'dictType', kiklis: '1', switch: true },
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

const qTypeDictName = ref('')
const qTypeDictType = ref('')
const qTypeStatus = ref('')

const dataSearchItems = computed(() => [
  { title: t('table.dictType'), value: 'dictType', kiklis: '1', tesvalue: true, switch: true },
  { title: t('table.dictDataLabel'), value: 'dictLabel', kiklis: '1', switch: true },
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

const typeDialog = ref(false)
const typeSaving = ref(false)
const typeForm = ref<Partial<DictType> & { dictId?: number }>({
  dictName: '',
  dictType: '',
  status: '0',
  remark: '',
})

const dataDialog = ref(false)
const dataSaving = ref(false)
const dataForm = ref<Partial<DictData> & { dictCode?: number }>({
  dictSort: 0,
  dictLabel: '',
  dictValue: '',
  dictType: '',
  status: '0',
  remark: '',
})

const typeTableColumns = computed<ResponsiveTableColumn[]>(() => [
  { prop: 'dictId', label: t('table.id'), width: 64, mobileHidden: true },
  { prop: 'dictName', label: t('table.name'), minWidth: 140, mobileOrder: 1 },
  { prop: 'dictType', label: t('table.dictType'), width: 160, mobileOrder: 2 },
])

const dataTableColumns = computed<ResponsiveTableColumn[]>(() => [
  { prop: 'dictCode', label: t('table.id'), width: 64, mobileHidden: true },
  { prop: 'dictLabel', label: t('table.dictLabel'), minWidth: 120, mobileOrder: 1 },
  { prop: 'dictValue', label: t('table.dictValue'), width: 120, mobileOrder: 2 },
  { prop: 'dictSort', label: t('table.sort'), width: 72, mobileOrder: 3 },
])

const visibleTypeColumnKeys = ref<string[] | null>(null)
const renderTypeColumns = computed(() => {
  if (!visibleTypeColumnKeys.value?.length) return typeTableColumns.value
  const byProp = new Map(typeTableColumns.value.map((c) => [String(c.prop), c]))
  return visibleTypeColumnKeys.value.map((k) => byProp.get(String(k))).filter(Boolean) as ResponsiveTableColumn[]
})

const visibleDataColumnKeys = ref<string[] | null>(null)
const renderDataColumns = computed(() => {
  if (!visibleDataColumnKeys.value?.length) return dataTableColumns.value
  const byProp = new Map(dataTableColumns.value.map((c) => [String(c.prop), c]))
  return visibleDataColumnKeys.value.map((k) => byProp.get(String(k))).filter(Boolean) as ResponsiveTableColumn[]
})

async function loadTypes(opts?: { silent?: boolean }) {
  if (!opts?.silent) typeLoading.value = true
  try {
    const res = await dictApi.dictTypeList({
      pageNum: typePage.value,
      pageSize: typeSize.value,
      dictName: qTypeDictName.value || undefined,
      dictType: qTypeDictType.value || undefined,
      status: qTypeStatus.value || undefined,
    })
    typeRows.value = res.list
    typeTotal.value = res.total
  } finally {
    if (!opts?.silent) typeLoading.value = false
  }
}

async function loadData(opts?: { silent?: boolean }) {
  if (!dataDictType.value) {
    dataRows.value = []
    dataTotal.value = 0
    return
  }
  if (!opts?.silent) dataLoading.value = true
  try {
    const res = await dictApi.dictDataList({
      pageNum: dataPage.value,
      pageSize: dataSize.value,
      dictType: dataDictType.value,
      dictLabel: dataDictLabel.value || undefined,
      status: dataStatus.value || undefined,
    })
    dataRows.value = res.list
    dataTotal.value = res.total
  } finally {
    if (!opts?.silent) dataLoading.value = false
  }
}

async function refreshTypesToolbar() {
  typeLoading.value = true
  try {
    await loadTypes({ silent: true })
    toast.success(t('crud.listRefreshOk'))
  } finally {
    typeLoading.value = false
  }
}

async function refreshDataToolbar() {
  if (!dataDictType.value) {
    toast.warning(t('crud.selectTypeFirst'))
    return
  }
  dataLoading.value = true
  try {
    await loadData({ silent: true })
    toast.success(t('crud.listRefreshOk'))
  } finally {
    dataLoading.value = false
  }
}

function openTypeCreate() {
  typeForm.value = { dictName: '', dictType: '', status: '0', remark: '' }
  typeDialog.value = true
}

function openTypeEdit(row: DictType) {
  typeForm.value = { ...row }
  typeDialog.value = true
}

async function submitType() {
  typeSaving.value = true
  try {
    if (typeForm.value.dictId) {
      await dictApi.dictTypeUpdate(typeForm.value.dictId, typeForm.value)
    } else {
      await dictApi.dictTypeCreate(typeForm.value)
    }
    toast.success(t('common.saveOk'))
    typeDialog.value = false
    await loadTypes()
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : t('common.opFail'))
  } finally {
    typeSaving.value = false
  }
}

async function removeType(row: DictType) {
  const ok = await funConfirm.open({
    title: t('common.tip'),
    message: t('pages.dict.deleteTypeConfirm', { name: row.dictName }),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
  })
  if (!ok) return
  await dictApi.dictTypeRemove([row.dictId])
  toast.success(t('common.deleteOk'))
  await loadTypes()
}

function openDataCreate() {
  if (!dataDictType.value) {
    toast.warning(t('crud.selectTypeFirst'))
    return
  }
  dataForm.value = {
    dictSort: 0,
    dictLabel: '',
    dictValue: '',
    dictType: dataDictType.value,
    status: '0',
    remark: '',
  }
  dataDialog.value = true
}

function openDataEdit(row: DictData) {
  dataForm.value = { ...row }
  dataDialog.value = true
}

async function submitData() {
  dataSaving.value = true
  try {
    if (dataForm.value.dictCode) {
      await dictApi.dictDataUpdate(dataForm.value.dictCode, dataForm.value)
    } else {
      await dictApi.dictDataCreate(dataForm.value)
    }
    toast.success(t('common.saveOk'))
    dataDialog.value = false
    await loadData()
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : t('common.opFail'))
  } finally {
    dataSaving.value = false
  }
}

async function removeData(row: DictData) {
  const ok = await funConfirm.open({
    title: t('common.tip'),
    message: t('pages.dict.deleteDataConfirm', { name: row.dictLabel }),
    confirmText: t('common.delete'),
    cancelText: t('common.cancel'),
  })
  if (!ok) return
  await dictApi.dictDataRemove([row.dictCode])
  toast.success(t('common.deleteOk'))
  await loadData()
}

function pickType(row: DictType) {
  dataDictType.value = row.dictType
  active.value = 'data'
  dataPage.value = 1
  loadData()
}

function getDictTypeRowActions(row: DictType): TableRowActionItem[] {
  return [
    {
      key: 'pick',
      label: t('pages.dict.pickData'),
      icon: List,
      buttonType: 'info',
      onClick: () => pickType(row),
    },
    {
      key: 'edit',
      label: t('common.edit'),
      icon: EditPen,
      buttonType: 'primary',
      perm: PERM_SYSTEM_DICT_EDIT,
      onClick: () => void openTypeEdit(row),
    },
    {
      key: 'remove',
      label: t('common.delete'),
      icon: Delete,
      buttonType: 'danger',
      perm: PERM_SYSTEM_DICT_REMOVE,
      onClick: () => void removeType(row),
    },
  ]
}

function getDictDataRowActions(row: DictData): TableRowActionItem[] {
  return [
    {
      key: 'edit',
      label: t('common.edit'),
      icon: EditPen,
      buttonType: 'primary',
      perm: PERM_SYSTEM_DICT_EDIT,
      onClick: () => void openDataEdit(row),
    },
    {
      key: 'remove',
      label: t('common.delete'),
      icon: Delete,
      buttonType: 'danger',
      perm: PERM_SYSTEM_DICT_REMOVE,
      onClick: () => void removeData(row),
    },
  ]
}

watch(active, (v) => {
  if (v === 'type') loadTypes()
  if (v === 'data') loadData()
})

</script>

<template>
  <SimplePage :title="t('pages.dict.title')" :subtitle="t('pages.dict.subtitle')">
    <el-tabs v-model="active">
      <el-tab-pane :label="t('pages.dict.tabType')" name="type">
        <div class="toolbar dict-type-toolbar">
          <el-button v-permission="PERM_SYSTEM_DICT_ADD" type="primary" @click="openTypeCreate">
            {{ t('pages.dict.newType') }}
          </el-button>
          <span class="grow" />
          <div class="dict-type-search">
            <SearchEngines
              :dats="typeSearchItems"
              :history="true"
              show-columns-toggle
              :table-columns="typeTableColumns.map((c) => ({ key: c.prop, label: c.label }))"
              table-columns-storage-key="system:dict:type"
              @columns-change="(keys) => (visibleTypeColumnKeys = keys as string[])"
              @refresh="refreshTypesToolbar"
              @handlesousuos="
                (q) => {
                  qTypeDictName = (q?.dictName ?? '') as string
                  qTypeDictType = (q?.dictType ?? '') as string
                  qTypeStatus = (q?.status ?? '') as string
                  typePage = 1
                  loadTypes()
                }
              "
            />
          </div>
        </div>
        <ResponsiveDataTable
          :columns="renderTypeColumns"
          :data="typeRows as unknown as Record<string, unknown>[]"
          :loading="typeLoading"
          row-key="dictId"
          :actions-column-width="200"
          mobile-title-prop="dictName"
          stripe
        >
          <template #actions="{ row }">
            <TableRowActions
              :items="getDictTypeRowActions(row as DictType)"
              :more-label="t('common.moreActions')"
            />
          </template>
        </ResponsiveDataTable>
        <div class="pager">
          <SmartPagination
            v-model:current-page="typePage"
            v-model:page-size="typeSize"
            :total="typeTotal"
            @current-change="() => loadTypes()"
          />
        </div>
      </el-tab-pane>
      <el-tab-pane :label="t('pages.dict.tabData')" name="data">
        <div class="toolbar row" style="gap: 10px; align-items: center">
          <SearchEngines
            :dats="dataSearchItems"
            :history="true"
            style="flex: 1"
            show-columns-toggle
            :table-columns="dataTableColumns.map((c) => ({ key: c.prop, label: c.label }))"
            table-columns-storage-key="system:dict:data"
            @columns-change="(keys) => (visibleDataColumnKeys = keys as string[])"
            @refresh="refreshDataToolbar"
            @handlesousuos="
              (q) => {
                dataDictType = (q?.dictType ?? '') as string
                dataDictLabel = (q?.dictLabel ?? '') as string
                dataStatus = (q?.status ?? '') as string
                dataPage = 1
                loadData()
              }
            "
          />
          <el-button v-permission="PERM_SYSTEM_DICT_ADD" type="primary" @click="openDataCreate">
            {{ t('pages.dict.newData') }}
          </el-button>
        </div>
        <ResponsiveDataTable
          :columns="renderDataColumns"
          :data="dataRows as unknown as Record<string, unknown>[]"
          :loading="dataLoading"
          row-key="dictCode"
          :actions-column-width="140"
          mobile-title-prop="dictLabel"
          stripe
        >
          <template #actions="{ row }">
            <TableRowActions
              :items="getDictDataRowActions(row as DictData)"
              :more-label="t('common.moreActions')"
            />
          </template>
        </ResponsiveDataTable>
        <div class="pager">
          <SmartPagination
            v-model:current-page="dataPage"
            v-model:page-size="dataSize"
            :total="dataTotal"
            @current-change="() => loadData()"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <GlassFormDialog
      v-model="typeDialog"
      :title="typeForm.dictId ? t('pages.dict.dialogTypeEdit') : t('pages.dict.dialogTypeNew')"
      width="min(92vw, 440px)"
      :loading="typeSaving"
      @confirm="submitType"
    >
      <el-form label-width="88px">
        <el-form-item :label="t('table.name')">
          <el-input v-model="typeForm.dictName" />
        </el-form-item>
        <el-form-item :label="t('table.dictType')">
          <el-input v-model="typeForm.dictType" :disabled="!!typeForm.dictId" />
        </el-form-item>
        <el-form-item :label="t('table.status')">
          <el-radio-group v-model="typeForm.status">
            <el-radio label="0">{{ t('status.normal') }}</el-radio>
            <el-radio label="1">{{ t('status.disabled') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('common.remark')">
          <el-input v-model="typeForm.remark" type="textarea" rows="2" />
        </el-form-item>
      </el-form>
    </GlassFormDialog>

    <GlassFormDialog
      v-model="dataDialog"
      :title="dataForm.dictCode ? t('pages.dict.dialogDataEdit') : t('pages.dict.dialogDataNew')"
      width="min(92vw, 440px)"
      :loading="dataSaving"
      @confirm="submitData"
    >
      <el-form label-width="88px">
        <el-form-item :label="t('pages.dict.labelType')">
          <el-input v-model="dataForm.dictType" :disabled="!!dataForm.dictCode" />
        </el-form-item>
        <el-form-item :label="t('table.dictLabel')">
          <el-input v-model="dataForm.dictLabel" />
        </el-form-item>
        <el-form-item :label="t('table.dictValue')">
          <el-input v-model="dataForm.dictValue" />
        </el-form-item>
        <el-form-item :label="t('table.sort')">
          <el-input-number v-model="dataForm.dictSort" :min="0" />
        </el-form-item>
        <el-form-item :label="t('table.status')">
          <el-radio-group v-model="dataForm.status">
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
.toolbar {
  margin-bottom: 12px;
  &.row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
}
.dict-type-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.grow {
  flex: 1;
  min-width: 8px;
}
.dict-type-search {
  width: min(520px, 46vw);
  min-width: 320px;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
