<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import AdminDropdown from '@/components/AdminDropdown.vue'
import { usePermission } from '@/composables/usePermission'
import type { TableRowActionItem } from '@/types/table-row-actions'

const menuOpen = ref(false)

const props = withDefaults(
  defineProps<{
    items: TableRowActionItem[]
    /** 可见操作多于 2 条时，行内最多保留几条（其余进「更多」；默认 1，即「主按钮 + 更多」两个控件） */
    maxInline?: number
    /** 下拉触发文案 */
    moreLabel?: string
  }>(),
  {
    maxInline: 1,
    moreLabel: '更多',
  },
)

const { hasAnyPerm, hasAllPerms } = usePermission()

function permOk(it: TableRowActionItem): boolean {
  if (it.perm == null) return true
  const codes = (Array.isArray(it.perm) ? it.perm : [it.perm]).map(String).filter(Boolean)
  if (!codes.length) return true
  return it.permAll ? hasAllPerms(codes) : hasAnyPerm(codes)
}

const visible = computed(() => props.items.filter((it) => !it.hidden && permOk(it)))

/** ≤2 条时全部行内；超过 2 条时按 maxInline 截断（默认 1 → 仅「主操作 + 更多」两个控件） */
const effectiveMaxInline = computed(() => {
  const n = visible.value.length
  if (n <= 2) return n
  return props.maxInline
})

const inlineList = computed(() => {
  const list = visible.value
  const cap = effectiveMaxInline.value
  if (list.length <= cap) return list
  return list.slice(0, cap)
})

const overflowList = computed(() => {
  const list = visible.value
  const cap = effectiveMaxInline.value
  if (list.length <= cap) return []
  return list.slice(cap)
})

const showDropdown = computed(() => overflowList.value.length > 0)
</script>

<template>
  <div v-if="visible.length" class="table-row-actions">
    <template v-for="it in inlineList" :key="it.key">
      <el-button
        class="tra-inline-btn"
        link
        :type="it.buttonType ?? 'primary'"
        :disabled="it.disabled"
        @click="it.onClick()"
      >
        <el-icon v-if="it.icon" class="tra-inline-ic"><component :is="it.icon" /></el-icon>
        <span>{{ it.label }}</span>
      </el-button>
    </template>

    <AdminDropdown
      v-if="showDropdown"
      class="tra-dropdown"
      trigger="click"
      placement="bottom-end"
      popper-class="tra-row-actions-popper"
      @visible-change="(v: boolean) => (menuOpen = v)"
    >
      <span class="tra-more-trigger">
        <span class="tra-more-label">{{ moreLabel }}</span>
        <el-icon class="tra-more-chevron" :class="{ 'is-open': menuOpen }"><ArrowDown /></el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu class="tra-menu">
          <el-dropdown-item
            v-for="(it, idx) in overflowList"
            :key="it.key"
            :disabled="it.disabled"
            :class="[
              'tra-menu-item',
              it.buttonType === 'danger' ? 'tra-menu-item--danger' : '',
            ]"
            :style="{ '--tra-i': idx }"
            @click="it.onClick()"
          >
            <span class="tra-menu-inner">
              <span
                v-if="it.icon"
                class="tra-menu-ic-wrap"
                :class="`is-${it.buttonType ?? 'primary'}`"
              >
                <el-icon class="tra-menu-ic">
                  <component :is="it.icon" />
                </el-icon>
              </span>
              <span class="tra-menu-text">{{ it.label }}</span>
            </span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </AdminDropdown>
  </div>
</template>

<style scoped lang="scss">
.table-row-actions {
  display: inline-flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 4px 10px;
  vertical-align: middle;
  white-space: nowrap;
}

.tra-inline-btn {
  padding: 0 6px;
  margin: 0 !important;
  font-weight: 600;
  transition:
    transform 0.18s ease,
    filter 0.18s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    filter: brightness(1.08);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
}

.tra-inline-ic {
  margin-right: 4px;
  font-size: 15px;
  vertical-align: middle;
}

.tra-dropdown {
  vertical-align: middle;
}

.tra-more-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 0;
  padding: 4px 12px 4px 14px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--el-color-primary);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-color-primary) 10%, transparent),
    color-mix(in srgb, var(--el-color-primary-light-5) 16%, transparent)
  );
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 22%, transparent);
  box-shadow:
    0 1px 0 color-mix(in srgb, #fff 60%, transparent) inset,
    0 1px 2px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  transition:
    transform 0.2s cubic-bezier(0.34, 1.4, 0.64, 1),
    box-shadow 0.2s ease,
    background 0.2s ease;

  &:hover {
    transform: scale(1.04);
    box-shadow:
      0 4px 14px color-mix(in srgb, var(--el-color-primary) 22%, transparent),
      0 1px 0 color-mix(in srgb, #fff 55%, transparent) inset;
  }

  &:active {
    transform: scale(0.98);
  }
}

.tra-more-label {
  user-select: none;
}

.tra-more-chevron {
  font-size: 12px;
  transition: transform 0.25s cubic-bezier(0.34, 1.4, 0.64, 1);
}

.tra-more-chevron.is-open {
  transform: rotate(180deg);
}
</style>

<!-- 下拉挂载在 body，需非 scoped -->
<style lang="scss">
@keyframes table-row-actions-item {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.admin-dropdown-popper.tra-row-actions-popper .el-dropdown-menu.tra-menu {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.admin-dropdown-popper.tra-row-actions-popper .el-dropdown-menu__item {
  border-radius: 12px !important;
  padding: 0 !important;
  margin: 0 !important;
  line-height: 1.45 !important;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s cubic-bezier(0.22, 1, 0.36, 1) !important;
  animation: table-row-actions-item 0.32s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: calc(var(--tra-i, 0) * 48ms);

  &:hover {
    background: color-mix(in srgb, var(--el-fill-color) 55%, transparent) !important;
    box-shadow: 0 1px 0 color-mix(in srgb, #fff 70%, transparent) inset !important;
    transform: none !important;
  }

  &.is-disabled {
    opacity: 0.45;
  }

  &.tra-menu-item--danger:not(:first-of-type) {
    margin-top: 6px !important;
    padding-top: 6px !important;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 10px;
      right: 10px;
      height: 1px;
      background: linear-gradient(
        90deg,
        transparent,
        color-mix(in srgb, var(--el-border-color) 90%, transparent) 15%,
        color-mix(in srgb, var(--el-border-color) 90%, transparent) 85%,
        transparent
      );
    }
  }

  &.tra-menu-item--danger:hover {
    background: color-mix(in srgb, var(--el-color-danger) 10%, var(--el-fill-color)) !important;
  }
}

.admin-dropdown-popper.tra-row-actions-popper .tra-menu-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  padding: 8px 12px 8px 10px;
  box-sizing: border-box;
}

.admin-dropdown-popper.tra-row-actions-popper .tra-menu-ic-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 10px;
  transition:
    transform 0.2s cubic-bezier(0.22, 1, 0.36, 1),
    background 0.2s ease,
    box-shadow 0.2s ease;
  box-shadow: 0 1px 2px color-mix(in srgb, #000 5%, transparent);

  &.is-primary {
    color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  }
  &.is-success {
    color: var(--el-color-success);
    background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
  }
  &.is-warning {
    color: var(--el-color-warning);
    background: color-mix(in srgb, var(--el-color-warning) 14%, transparent);
  }
  &.is-danger {
    color: var(--el-color-danger);
    background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
  }
  &.is-info {
    color: var(--el-color-info);
    background: color-mix(in srgb, var(--el-color-info) 12%, transparent);
  }
}

.admin-dropdown-popper.tra-row-actions-popper .el-dropdown-menu__item:hover .tra-menu-ic-wrap {
  transform: scale(1.06);
  box-shadow: 0 2px 8px color-mix(in srgb, #000 8%, transparent);
}

.admin-dropdown-popper.tra-row-actions-popper .tra-menu-ic {
  font-size: 17px;
}

.admin-dropdown-popper.tra-row-actions-popper .tra-menu-text {
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.01em;
  color: var(--el-text-color-primary);
}
</style>
