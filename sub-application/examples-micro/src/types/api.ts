/** nest-admin ResultData：成功时 axios 根为 { code, msg, data: T } */
export type ApiResult<T> = {
  code: number
  msg: string
  data: T
}

/** 分页在 data 内：{ list, total } */
export type PageData<R> = {
  list: R[]
  total: number
}

export type SysUser = {
  userId: number
  userName: string
  nickName: string
  deptId?: number | null
  email?: string
  phonenumber?: string
  sex?: string
  status?: string
  remark?: string
  dept?: { deptId: number; deptName: string }
  roles?: { roleId: number; roleName: string; roleKey: string }[]
  posts?: { postId: number; postName: string }[]
}

export type SysRole = {
  roleId: number
  roleName: string
  roleKey: string
  roleSort: number
  dataScope: string
  status: string
  remark?: string
  menuIds?: number[]
  deptIds?: number[]
}

export type SysDept = {
  deptId: number
  parentId: number
  ancestors: string
  deptName: string
  orderNum: number
  leader?: string
  phone?: string
  email?: string
  status: string
  remark?: string
  children?: SysDept[]
}

export type SysPost = {
  postId: number
  postCode: string
  postName: string
  postSort: number
  status: string
  remark?: string
}

export type SysAccount = {
  accountId: number
  account: string
  password?: string
  companyName: string
  email: string
  loginValidMinutes: number
  status: string
}

export type SysMenu = {
  menuId: number
  menuName: string
  parentId: number
  orderNum: number
  path: string
  component?: string
  menuType: string
  visible: string
  status: string
  perms: string
  icon: string
  isFrame?: string
  isCache?: string
  query?: string
  remark?: string
  children?: SysMenu[]
}

export type DictType = {
  dictId: number
  dictName: string
  dictType: string
  status: string
  remark?: string
}

export type DictData = {
  dictCode: number
  dictSort: number
  dictLabel: string
  dictValue: string
  dictType: string
  status: string
  remark?: string
}
