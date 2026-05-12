import { get, post } from '@micro/utils/request'

export type LoginResult = {
  access_token: string
  refresh_token: string
  expires_in: number
  user: {
    userId: number
    userName: string
    nickName: string
    avatar: string
    isSuperAdmin: boolean
  }
  permissions: string[]
}

export function loginApi(body: {
  username: string
  password: string
  uuid?: string
  code?: string
}) {
  return post<LoginResult>('/login', body)
}

export function getCaptcha() {
  return get<{
    uuid: string
    /** base64 SVG 图片 data URL */
    img: string
    /** 仅 CAPTCHA_PLAIN=true 时返回 */
    code?: string
  }>('/captchaImage')
}

export function logoutApi(refresh_token: string) {
  return post<unknown>('/logout', { refresh_token })
}

export function getProfile() {
  return get<{
    user: unknown
    roles: string[]
    permissions: string[]
    isSuperAdmin: boolean
  }>('/auth/profile')
}

/** 若依 getInfo，与 /auth/profile 数据一致（无密码） */
export function getInfoApi() {
  return get<{
    user: unknown
    roles: string[]
    permissions: string[]
    isSuperAdmin: boolean
  }>('/getInfo')
}
