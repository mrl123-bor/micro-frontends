import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  DEFAULT_MENU_LAYOUT,
  isMenuLayout,
  MENU_LAYOUT_STORAGE_KEY,
  type MenuLayout,
} from '@/constants/menu-layout'

function readStoredMenuLayout(): MenuLayout {
  try {
    const raw = localStorage.getItem(MENU_LAYOUT_STORAGE_KEY)
    if (!raw) return DEFAULT_MENU_LAYOUT
    const v = JSON.parse(raw) as unknown
    if (isMenuLayout(v)) return v
  } catch {
    /* ignore */
  }
  return DEFAULT_MENU_LAYOUT
}

/** 布局级状态：侧栏折叠、移动端抽屉、PC 菜单壳布局 */
export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const drawerVisible = ref(false)
  const menuLayout = ref<MenuLayout>(readStoredMenuLayout())

  function setMenuLayout(next: MenuLayout) {
    menuLayout.value = next
    try {
      localStorage.setItem(MENU_LAYOUT_STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
    if (next === 'sideIcon') sidebarCollapsed.value = true
  }

  function toggleFrameMenu(isMobile: boolean) {
    if (isMobile) {
      drawerVisible.value = !drawerVisible.value
    } else {
      sidebarCollapsed.value = !sidebarCollapsed.value
    }
  }

  function closeDrawer() {
    drawerVisible.value = false
  }

  return {
    sidebarCollapsed,
    drawerVisible,
    menuLayout,
    setMenuLayout,
    toggleFrameMenu,
    closeDrawer,
  }
})
