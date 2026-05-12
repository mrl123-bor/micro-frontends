import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import type { ApiResult } from '@/types/api'
import { findDemoMenuById, getDemoMenuTree } from '@/utils/demoMenuTreeFromRoutes'

function joinUrl(config: InternalAxiosRequestConfig): string {
  const base = String(config.baseURL ?? '').replace(/\/+$/, '')
  const path = String(config.url ?? '')
  if (path.startsWith('http')) return path
  if (!base) return path.startsWith('/') ? path : `/${path}`
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}

function ok<T>(data: T): ApiResult<T> {
  return { code: 200, msg: 'ok', data }
}

/**
 * 纯前端演示：不发起真实 HTTP，返回与业务码约定一致的占位 JSON。
 * 未单独适配的 GET 尽量返回空数组，避免表格解构报错。
 */
export function buildDemoMockApiResult(
  config: InternalAxiosRequestConfig,
): ApiResult<unknown> {
  const method = (config.method || 'get').toLowerCase()
  const url = joinUrl(config)

  if (url.includes('captchaImage')) {
    return ok({ uuid: 'demo', img: '', code: '' })
  }

  if (method === 'get' && (url.includes('getInfo') || url.includes('/auth/profile'))) {
    return ok({
      user: {
        userId: 0,
        userName: 'demo',
        nickName: '纯前端演示',
        avatar: '',
        isSuperAdmin: true,
      },
      roles: ['admin'],
      permissions: ['*:*:*'],
      isSuperAdmin: true,
    })
  }

  if (method === 'get' && url.includes('getRouters')) {
    return ok([])
  }

  if (method === 'get' && /\/system\/user\/?(\?|$)/.test(url)) {
    return ok({ roles: [], posts: [] })
  }

  if (method === 'get' && url.includes('authRole')) {
    return ok({
      user: { userId: 0, userName: 'demo', nickName: 'demo' },
      roles: [],
    })
  }

  /** 须在通用 `/list` 分页占位之前：部门 list 为扁平数组，非 { list, total } */
  if (method === 'get' && url.includes('/system/dept/list')) {
    return ok([])
  }

  if (method === 'get' && url.includes('/list')) {
    return ok({ list: [], total: 0 })
  }

  if (method === 'get' && url.includes('/common/upload')) {
    return ok({})
  }

  /** 菜单管理：用静态 layout 子路由生成树，与侧栏一致（非空占位） */
  if (method === 'get' && /\/system\/menu\/tree(\?|$)/.test(url)) {
    return ok(getDemoMenuTree())
  }

  if (method === 'get' && (url.includes('deptTree') || url.includes('/tree'))) {
    return ok([])
  }

  if (method === 'get' && /\/system\/menu\/(\d+)(\?|$)/.test(url)) {
    const m = url.match(/\/system\/menu\/(\d+)/)
    const id = m ? parseInt(m[1], 10) : 0
    const row = findDemoMenuById(id)
    return ok(row ?? {})
  }

  if (method === 'get' && /\/system\/[^/]+\/\d+(\?|$)/.test(url)) {
    return ok({})
  }

  if (method === 'post' || method === 'put' || method === 'delete') {
    if (url.includes('/common/upload')) {
      return ok({ fileName: 'demo.bin', url: '' })
    }
    return ok({})
  }

  if (method === 'get') {
    return ok([])
  }

  return ok(null)
}

export function createDemoModeAxiosAdapter() {
  return (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const payload = buildDemoMockApiResult(config)
    const res: AxiosResponse = {
      data: payload,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
    return Promise.resolve(res)
  }
}
