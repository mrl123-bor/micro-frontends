import { get, post, put, del } from '@/utils/request'
import type { SysDept } from '@/types/api'

function buildDeptTree(flat: SysDept[], parentId: number): SysDept[] {
  return flat
    .filter((d) => d.parentId === parentId)
    .map((d) => ({
      ...d,
      children: buildDeptTree(flat, d.deptId),
    })) as SysDept[]
}

/** swagger：GET /system/dept/list 扁平列表 */
export function deptList() {
  return get<SysDept[]>('/system/dept/list')
}

/** 由 list 组装树（原 /tree 能力，供部门管理、角色部门树等） */
export async function deptTree() {
  const flat = await deptList()
  return buildDeptTree(flat, 0)
}

export function deptDetail(deptId: number) {
  return get<SysDept>(`/system/dept/${deptId}`)
}

export function deptCreate(body: Partial<SysDept>) {
  return post<SysDept>('/system/dept', body)
}

export function deptUpdate(body: Partial<SysDept> & { deptId: number }) {
  return put<SysDept>('/system/dept', body)
}

export function deptRemove(deptId: number) {
  return del<unknown>(`/system/dept/${deptId}`)
}
