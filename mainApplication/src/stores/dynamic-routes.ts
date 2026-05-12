import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import type { Router } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { getRoutersApi } from '@/api/routes'
import { backendRoutersToRecords } from '@/router/dynamic-menu'

export const useDynamicRoutesStore = defineStore('dynamicRoutes', () => {
  const layoutAddons = shallowRef<RouteRecordRaw[]>([])
  const loaded = ref(false)

  async function loadFromApi(router: Router) {
    if (loaded.value) return
    const vos = await getRoutersApi()
    const records = backendRoutersToRecords(vos)
    layoutAddons.value = records
    for (const r of records) {
      router.addRoute('Layout', r)
    }
    loaded.value = true
  }

  function clearFromRouter(router: Router) {
    for (const r of layoutAddons.value) {
      if (r.name != null) router.removeRoute(r.name as string)
    }
    layoutAddons.value = []
    loaded.value = false
  }

  return { layoutAddons, loaded, loadFromApi, clearFromRouter }
})
