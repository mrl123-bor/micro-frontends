import { get, post, put } from '@/utils/request'
import type { SysAccount } from '@/types/api'

export function accountList(params: {
  pageNum?: number
  pageSize?: number
  account?: string
  companyName?: string
  email?: string
  status?: string
}) {
  return get<{ list: SysAccount[]; total: number }>('/system/account/list', params)
}

export function accountDetail(accountId: number) {
  return get<SysAccount>(`/system/account/${accountId}`)
}

export function accountCreate(body: {
  account: string
  password: string
  companyName: string
  email: string
  loginValidMinutes: number
  status?: string
}) {
  return post<SysAccount>('/system/account', body)
}

export function accountUpdate(body: {
  accountId: number
  password?: string
  companyName: string
  email: string
  loginValidMinutes: number
  status: string
}) {
  return put<SysAccount>('/system/account', body)
}
