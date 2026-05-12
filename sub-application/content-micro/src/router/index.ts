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
    path: '/content/articles',
    name: 'ContentArticles',
    component: () => import('@micro/views/ArticleList.vue'),
  },
  {
    path: '/content/categories',
    name: 'ContentCategories',
    component: () => import('@micro/views/CategoryManage.vue'),
  },
]

const historyBase = qiankunWindow.__POWERED_BY_QIANKUN__
  ? qiankunHostHistoryBase()
  : normalizeHistoryBase(import.meta.env.BASE_URL)

export default createRouter({
  history: createWebHistory(historyBase),
  routes,
})
