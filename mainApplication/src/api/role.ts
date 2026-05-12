import { get, post, put, del } from '@/utils/request'
import type { SysRole, SysUser } from '@/types/api'

export function roleList(params: {
  pageNum?: number
  pageSize?: number
  roleName?: string
  roleKey?: string
  status?: string
}) {
  return get<{ list: SysRole[]; total: number }>('/system/role/list', params)
}

export function roleDetail(roleId: number) {
  return get<SysRole>(`/system/role/${roleId}`)
}

export function roleCreate(
  body: Partial<SysRole> & { menuIds?: number[]; deptIds?: number[] },
) {
  return post<SysRole>('/system/role', body)
}

export function roleUpdate(
  body: Partial<SysRole> & {
    roleId: number
    menuIds?: number[]
    deptIds?: number[]
  },
) {
  return put<SysRole>('/system/role', body)
}

export function roleRemove(roleIds: number[]) {
  return del<unknown>(`/system/role/${roleIds.join(',')}`)
}

/** 角色已分配用户 */
export function allocatedUserList(params: {
  pageNum?: number
  pageSize?: number
  roleId: number
  userName?: string
  phonenumber?: string
}) {
  return get<{ list: SysUser[]; total: number }>(
    '/system/role/authUser/allocatedList',
    params,
  )
}

export function authUserCancel(body: { userId: number; roleId: number }) {
  return put<unknown>('/system/role/authUser/cancel', body)
}

export function authUserCancelAll(body: { roleId: number; userIds: string }) {
  return put<unknown>('/system/role/authUser/cancelAll', body)
}
