<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Postcard } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { useMobile } from '@/hooks'
import type { MenuLayout } from '@/constants/menu-layout'
import { MENU_LAYOUTS } from '@/constants/menu-layout'
import type { PopoverInstance } from 'element-plus'

const LAYOUT_LABEL: Record<MenuLayout, string> = {
  side: 'layout.menuLayoutSide',
  top: 'layout.menuLayoutTop',
  mix: 'layout.menuLayoutMix',
  sideIcon: 'layout.menuLayoutSideIcon',
}

const { t } = useI18n()
const { isMobile } = useMobile(768)
const appStore = useAppStore()
const { menuLayout } = storeToRefs(appStore)

/** 不用 v-model:visible，避免与 trigger 组合异常；选完布局后主动 hide */
const popoverRef = ref<PopoverInstance | null>(null)

function pick(next: MenuLayout) {
  appStore.setMenuLayout(next)
  popoverRef.value?.hide?.()
}
</script>

<template>
  <el-popover
    v-if="!isMobile"
    ref="popoverRef"
    placement="bottom-end"
    :width="312"
    trigger="click"
    :teleported="true"
    popper-class="menu-layout-switcher-popper"
  >
    <template #reference>
      <el-button
        class="menu-layout-switcher__btn"
        :icon="Postcard"
        circle
        text
        :title="t('layout.menuLayoutBtn')"
        :aria-label="t('layout.menuLayoutBtn')"
        aria-haspopup="dialog"
      />
    </template>
    <div class="mlo" role="dialog" :aria-label="t('layout.menuLayoutTitle')">
      <div class="mlo__head">
        <span class="mlo__title">{{ t('layout.menuLayoutTitle') }}</span>
      </div>
      <p class="mlo__hint">{{ t('layout.menuLayoutHint') }}</p>
      <div class="mlo__grid" role="list">
        <button
          v-for="value in MENU_LAYOUTS"
          :key="value"
          type="button"
          class="mlo__card"
          :class="{ 'mlo__card--active': menuLayout === value }"
          role="listitem"
          @click="pick(value)"
        >
          <div class="mlo__thumb" :class="`mlo__thumb--${value}`" aria-hidden="true">
            <template v-if="value === 'side'">
              <span class="mlo__bar mlo__bar--aside" />
              <span class="mlo__pane" />
            </template>
            <template v-else-if="value === 'top'">
              <span class="mlo__bar mlo__bar--top" />
              <span class="mlo__pane" />
            </template>
            <template v-else-if="value === 'mix'">
              <span class="mlo__bar mlo__bar--top mlo__bar--thin" />
              <span class="mlo__row">
                <span class="mlo__bar mlo__bar--aside mlo__bar--narrow" />
                <span class="mlo__pane" />
              </span>
            </template>
            <template v-else>
              <span class="mlo__dock">
                <span class="mlo__dot" />
                <span class="mlo__dot" />
                <span class="mlo__dot" />
              </span>
              <span class="mlo__pane" />
            </template>
          </div>
          <span class="mlo__label">{{ t(LAYOUT_LABEL[value]) }}</span>
        </button>
      </div>
    </div>
  </el-popover>
</template>

<style scoped lang="scss">
.menu-layout-switcher__btn {
  font-size: 18px;
  color: var(--admin-text-secondary);

  &:hover {
    color: var(--el-color-primary);
  }
}

.mlo {
  padding: 2px 2px 4px;
}

.mlo__head {
  margin-bottom: 6px;
}

.mlo__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.mlo__hint {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.mlo__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.mlo__card {
  margin: 0;
  padding: 10px 8px 8px;
  border-radius: 12px;
  border: 2px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-blank);
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: center;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 42%, var(--el-border-color));
    box-shadow: 0 4px 14px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  }
}

.mlo__card--active {
  border-color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 8%, var(--el-fill-color-blank));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 25%, transparent);
}

.mlo__thumb {
  display: flex;
  height: 44px;
  border-radius: 8px;
  overflow: hidden;
  gap: 3px;
  margin-bottom: 8px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-extra-light);
}

.mlo__thumb--side {
  flex-direction: row;
  padding: 4px;
  align-items: stretch;
}

.mlo__thumb--top {
  flex-direction: column;
  padding: 4px;

  .mlo__pane {
    flex: 1;
    min-height: 0;
  }
}

.mlo__thumb--mix {
  flex-direction: column;
  padding: 3px 4px 4px;
  gap: 2px;
}

.mlo__thumb--sideIcon {
  flex-direction: row;
  padding: 4px;
  align-items: stretch;
}

.mlo__bar {
  border-radius: 3px;
  background: color-mix(in srgb, var(--el-color-primary) 55%, var(--el-fill-color-dark));
}

.mlo__bar--aside {
  width: 30%;
  min-width: 0;
}

.mlo__bar--aside.mlo__bar--narrow {
  width: 24%;
}

.mlo__bar--top {
  width: 100%;
  height: 28%;
  min-height: 0;
}

.mlo__bar--thin {
  height: 22%;
}

.mlo__row {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 3px;
  width: 100%;
}

.mlo__pane {
  flex: 1;
  min-width: 0;
  min-height: 0;
  border-radius: 3px;
  background: color-mix(in srgb, var(--el-text-color-primary) 6%, var(--el-fill-color));
}

.mlo__dock {
  width: 22%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--el-color-primary) 35%, var(--el-fill-color-dark));
}

.mlo__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: color-mix(in srgb, #fff 55%, var(--el-color-primary-light-5));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
}

.mlo__label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--el-text-color-regular);
}

.mlo__card--active .mlo__label {
  color: var(--el-color-primary);
}
</style>
