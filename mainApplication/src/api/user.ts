import { get, post, put, del } from '@/utils/request'
import service from '@/utils/request'
import type { ApiResult } from '@/types/api'
import type { SysDept, SysPost, SysRole, SysUser } from '@/types/api'

export type AuthRoleRow = SysRole & { flag: boolean }

export function userList(params: {
  pageNum?: number
  pageSize?: number
  userName?: string
  phonenumber?: string
  status?: string
  deptId?: number
}) {
  return get<{ list: SysUser[]; total: number }>('/system/user/list', params)
}

/** swagger：GET /system/user — 用户-角色+岗位 */
export function userFormAux() {
  return get<{ roles: SysRole[]; posts: SysPost[] }>('/system/user')
}

/** swagger：GET /system/user/deptTree */
export function userDeptTree() {
  return get<SysDept[]>('/system/user/deptTree')
}

/** 分配角色页 */
export function getAuthRole(userId: number) {
  return get<{
    user: { userId: number; userName: string; nickName: string }
    roles: AuthRoleRow[]
  }>(`/system/user/authRole/${userId}`)
}

export function updateAuthRole(body: { userId: number; roleIds: string }) {
  return put<unknown>('/system/user/authRole', body)
}

export function userDetail(userId: number) {
  return get<SysUser>(`/system/user/${userId}`)
}

export function userCreate(body: Record<string, unknown>) {
  return post<SysUser>('/system/user', body)
}

export function userUpdate(body: Record<string, unknown> & { userId: number }) {
  return put<SysUser>('/system/user', body)
}

export function userRemove(userIds: number[]) {
  return del<{ affected: number }>(`/system/user/${userIds.join(',')}`)
}

export function resetPwd(userId: number, password: string) {
  return put<unknown>('/system/user/resetPwd', { userId, password })
}

export function changeUserStatus(userId: number, status: string) {
  return put<unknown>('/system/user/changeStatus', { userId, status })
}

/** 个人中心：上传裁剪后的头像（multipart/jpeg） */
export function uploadMyAvatar(blob: Blob) {
  const fd = new FormData()
  fd.append('file', blob, 'avatar.jpg')
  return service
    .post<ApiResult<{ avatar: string }>>('/system/user/profile/avatar', fd)
    .then((res) => (res.data as ApiResult<{ avatar: string }>).data)
}

/** 个人中心：更新我的基本资料 */
export function updateMyProfile(body: {
  nickName?: string
  phonenumber?: string
  email?: string
}) {
  return put<unknown>('/system/user/profile', body)
}

/** 个人中心：修改我的密码（需旧密码） */
export function updateMyPassword(body: { oldPassword: string; newPassword: string }) {
  return put<unknown>('/system/user/profile/updatePwd', body)
}
