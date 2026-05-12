<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { UserFilled } from '@element-plus/icons-vue'
import { DEMO_PRESETS } from '@/constants/permissionPresets'
import { usePermissionStore } from '@/stores/permission'

const perm = usePermissionStore()
const { roles, perms } = storeToRefs(perm)

const presetId = computed(() => {
  const hit = DEMO_PRESETS.find(
    (p) =>
      JSON.stringify([...p.roles].sort()) === JSON.stringify([...roles.value].sort()) &&
      JSON.stringify([...p.perms].sort()) === JSON.stringify([...perms.value].sort()),
  )
  return hit?.id ?? ''
})

function onSelect(id: string) {
  perm.setDemoPreset(id)
}
</script>

<template>
  <el-tooltip
    content="演示：切换角色与权限点（sessionStorage）；按钮/区块可用 v-permission 或 usePermission"
    placement="bottom"
  >
    <div class="role-switch">
      <el-icon class="role-ico" :size="16"><UserFilled /></el-icon>
      <el-select
        :model-value="presetId"
        placeholder="角色"
        class="role-select"
        size="small"
        @update:model-value="onSelect"
      >
        <el-option
          v-for="p in DEMO_PRESETS"
          :key="p.id"
          :label="p.label"
          :value="p.id"
        />
      </el-select>
    </div>
  </el-tooltip>
</template>

<style scoped lang="scss">
.role-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-right: 4px;
}

.role-ico {
  color: var(--admin-text-secondary);
  flex-shrink: 0;
}

.role-select {
  width: 156px;

  :deep(.el-select__wrapper) {
    min-height: 30px;
    padding: 2px 10px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--admin-surface-muted) 80%, transparent);
    box-shadow: none;
  }
}
</style>
