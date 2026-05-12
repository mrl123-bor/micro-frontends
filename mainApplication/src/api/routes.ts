import { get } from '@/utils/request'

/** 与后端 RouterVo 对齐 */
export type BackendRouterMeta = {
  title: string
  icon?: string
  noCache: boolean
  link?: string | null
  perms?: string
}

export type BackendRouterVo = {
  name: string
  path: string
  hidden: boolean
  redirect?: string
  component?: string
  query?: string
  alwaysShow?: boolean
  meta: BackendRouterMeta
  children?: BackendRouterVo[]
}

export function getRoutersApi() {
  return get<BackendRouterVo[]>('/getRouters')
}
