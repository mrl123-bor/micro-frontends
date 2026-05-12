import { get, post, put, del } from '@/utils/request'
import type { SysMenu } from '@/types/api'

export function menuTree() {
  return get<SysMenu[]>('/system/menu/tree')
}

export function menuDetail(menuId: number) {
  return get<SysMenu>(`/system/menu/${menuId}`)
}

export function menuCreate(body: Partial<SysMenu>) {
  return post<SysMenu>('/system/menu', body)
}

export function menuUpdate(menuId: number, body: Partial<SysMenu>) {
  return put<SysMenu>(`/system/menu/${menuId}`, body)
}

export function menuRemove(menuId: number) {
  return del<unknown>(`/system/menu/${menuId}`)
}
