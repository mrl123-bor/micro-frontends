import service from '@micro/utils/request'
import type { ApiResult } from '@micro/types/api'

/** 通用上传接口返回（若依 / nest-admin 常见字段） */
export type CommonUploadResult = {
  fileName?: string
  url?: string
}

/**
 * multipart 上传到服务端（默认路径与 nest-admin 一致，可按项目 swagger 改）
 */
export async function uploadCommonFile(
  file: File,
  url = '/common/upload',
  fieldName = 'file',
) {
  const fd = new FormData()
  fd.append(fieldName, file)
  /** 不手动设 Content-Type，便于浏览器带 boundary */
  const res = await service.post<ApiResult<CommonUploadResult>>(url, fd)
  const body = res.data
  if (body.code !== 200 || body.data == null) {
    throw new Error(body.msg || '上传失败')
  }
  return body.data
}
