import type { Component } from 'vue'

export type TableRowActionButtonType = 'primary' | 'success' | 'warning' | 'danger' | 'info'

export interface TableRowActionItem {
  key: string
  label: string
  /** 菜单项与行内按钮左侧小图标 */
  icon?: Component
  /** 与 `el-button` 的 type 一致，用于配色 */
  buttonType?: TableRowActionButtonType
  /** 与 `v-permission` 相同：单个或数组，默认满足其一即可 */
  perm?: string | string[]
  /** 为 true 时要求拥有全部 perm（对标 `v-permission.all`） */
  permAll?: boolean
  hidden?: boolean
  disabled?: boolean
  onClick: () => void
}
