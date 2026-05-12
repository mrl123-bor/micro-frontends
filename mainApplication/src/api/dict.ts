import { get, post, put, del } from '@/utils/request'
import type { DictType, DictData } from '@/types/api'

export function dictTypeList(params: {
  pageNum?: number
  pageSize?: number
  dictName?: string
  dictType?: string
  status?: string
}) {
  return get<{ list: DictType[]; total: number }>(
    '/system/dict/type/list',
    params,
  )
}

export function dictTypeDetail(dictId: number) {
  return get<DictType>(`/system/dict/type/${dictId}`)
}

export function dictTypeCreate(body: Partial<DictType>) {
  return post<DictType>('/system/dict/type', body)
}

export function dictTypeUpdate(dictId: number, body: Partial<DictType>) {
  return put<DictType>(`/system/dict/type/${dictId}`, body)
}

export function dictTypeRemove(dictIds: number[]) {
  return del<unknown>(`/system/dict/type/${dictIds.join(',')}`)
}

export function dictDataList(params: {
  pageNum?: number
  pageSize?: number
  dictType?: string
  dictLabel?: string
  status?: string
}) {
  return get<{ list: DictData[]; total: number }>(
    '/system/dict/data/list',
    params,
  )
}

export function dictDataDetail(dictCode: number) {
  return get<DictData>(`/system/dict/data/${dictCode}`)
}

export function dictDataCreate(body: Partial<DictData>) {
  return post<DictData>('/system/dict/data', body)
}

export function dictDataUpdate(dictCode: number, body: Partial<DictData>) {
  return put<DictData>(`/system/dict/data/${dictCode}`, body)
}

export function dictDataRemove(dictCodes: number[]) {
  return del<unknown>(`/system/dict/data/${dictCodes.join(',')}`)
}
