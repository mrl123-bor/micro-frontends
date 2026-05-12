/** PC 为 el-table 列；移动端为卡片行（tree 模式除外） */
export type ResponsiveTableColumn = {
  prop: string
  label: string
  width?: string | number
  minWidth?: string | number
  fixed?: 'left' | 'right' | boolean
  align?: 'left' | 'center' | 'right'
  showOverflowTooltip?: boolean
  /** 移动端卡片中不展示该列（如 ID、次要字段） */
  mobileHidden?: boolean
  /** 同在移动端展示时的顺序，越小越靠上；未设则保持 columns 原顺序 */
  mobileOrder?: number
}
