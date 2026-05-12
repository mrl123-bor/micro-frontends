import { get, post, put, del } from '@/utils/request'
import type { SysPost } from '@/types/api'

export function postList(params: {
  pageNum?: number
  pageSize?: number
  postCode?: string
  postName?: string
  status?: string
}) {
  return get<{ list: SysPost[]; total: number }>('/system/post/list', params)
}

export function postDetail(postId: number) {
  return get<SysPost>(`/system/post/${postId}`)
}

export function postCreate(body: Partial<SysPost>) {
  return post<SysPost>('/system/post', body)
}

export function postUpdate(body: Partial<SysPost> & { postId: number }) {
  return put<SysPost>('/system/post', body)
}

export function postRemove(postIds: number[]) {
  return del<unknown>(`/system/post/${postIds.join(',')}`)
}
