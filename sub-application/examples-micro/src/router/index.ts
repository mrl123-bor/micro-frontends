import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

function normalizeHistoryBase(v: string): string {
  if (v == null || v === '' || v === '/') return '/'
  const withSlash = v.startsWith('/') ? v : `/${v}`
  return withSlash.endsWith('/') ? withSlash : `${withSlash}/`
}

function qiankunHostHistoryBase(): string {
  const fromEnv = import.meta.env.VITE_QIANKUN_HOST_BASE?.trim()
  if (fromEnv) return normalizeHistoryBase(fromEnv)
  return normalizeHistoryBase(import.meta.env.DEV ? '/' : '/admin/')
}

const routes: RouteRecordRaw[] = [
  {
    path: '/demo/table',
    name: 'DemoTable',
    component: () => import('@micro/views/demo/TableDemo.vue'),
  },
  {
    path: '/demo/form',
    name: 'DemoForm',
    component: () => import('@micro/views/demo/FormDemo.vue'),
  },
  {
    path: '/demo/analysis',
    name: 'DemoAnalysis',
    component: () => import('@micro/views/demo/AnalysisDemo.vue'),
  },
  {
    path: '/demo/media-preview',
    name: 'DemoMediaPreview',
    component: () => import('@micro/views/demo/MediaPreviewDemo.vue'),
  },
  {
    path: '/demo/permission',
    name: 'DemoPermission',
    component: () => import('@micro/views/demo/PermissionDemo.vue'),
  },
  {
    path: '/media-preview',
    name: 'MediaPreview',
    component: () => import('@micro/views/demo/MediaPreviewDemo.vue'),
  },
]

const historyBase = qiankunWindow.__POWERED_BY_QIANKUN__
  ? qiankunHostHistoryBase()
  : normalizeHistoryBase(import.meta.env.BASE_URL)

export default createRouter({
  history: createWebHistory(historyBase),
  routes,
})
