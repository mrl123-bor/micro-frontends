<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { toast } from '@/utils/toast'
import { getAuthRole, updateAuthRole } from '@/api/user'
import type { AuthRoleRow } from '@/api/user'
import SimplePage from '@/views/common/SimplePage.vue'
import { ROUTE_NAMES } from '@/constants/route-names'
import { useAsyncState } from '@/hooks'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { loading, run } = useAsyncState(true)
const tableRef = ref<{ toggleRowSelection: (row: AuthRoleRow, selected?: boolean) => void }>()
const roles = ref<AuthRoleRow[]>([])
const form = ref({
  userId: 0,
  userName: '',
  nickName: '',
})
const selectedIds = ref<number[]>([])

function onSelectionChange(rows: AuthRoleRow[]) {
  selectedIds.value = rows.map((r) => r.roleId)
}

async function load() {
  const uid = Number(route.params.userId)
  if (!uid) {
    loading.value = false
    return
  }
  await run(async () => {
    const res = await getAuthRole(uid)
    form.value = {
      userId: res.user.userId,
      userName: res.user.userName,
      nickName: res.user.nickName,
    }
    roles.value = res.roles
    await nextTick()
    res.roles.forEach((row) => {
      if (row.flag) tableRef.value?.toggleRowSelection(row, true)
    })
  })
}

async function submit() {
  await updateAuthRole({
    userId: form.value.userId,
    roleIds: selectedIds.value.join(','),
  })
  toast.success(t('crud.authOk'))
  router.push({ name: ROUTE_NAMES.systemUsers })
}

function back() {
  router.push({ name: ROUTE_NAMES.systemUsers })
}

onMounted(load)
</script>

<template>
  <SimplePage :title="t('pages.authRole.title')" :subtitle="t('pages.authRole.subtitle')">
    <el-card shadow="never" class="card">
      <template #header>
        <span>{{ t('pages.authRole.basicInfo') }}</span>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item :label="t('pages.authRole.labelNick')">
          {{ form.nickName }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('pages.authRole.labelLogin')">
          {{ form.userName }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card shadow="never" class="card" style="margin-top: 16px">
      <template #header>
        <span>{{ t('pages.authRole.roleInfo') }}</span>
      </template>
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="roles"
        row-key="roleId"
        border
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column type="index" label="#" width="56" />
        <el-table-column prop="roleId" :label="t('table.roleId')" width="100" />
        <el-table-column prop="roleName" :label="t('table.roleName')" min-width="140" />
        <el-table-column prop="roleKey" :label="t('table.roleKey')" min-width="120" />
        <el-table-column prop="roleSort" :label="t('table.roleSort')" width="100" />
      </el-table>
    </el-card>

    <div class="footer">
      <el-button type="primary" @click="submit">{{ t('common.submit') }}</el-button>
      <el-button @click="back">{{ t('common.back') }}</el-button>
    </div>
  </SimplePage>
</template>

<style scoped lang="scss">
.card {
  border-radius: 8px;
}
.footer {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}
</style>
