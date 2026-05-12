import { reactive } from 'vue'

export interface FunConfirmOpenOptions {
  title?: string
  message: string
  tips?: string[]
  confirmText?: string
  cancelText?: string
  width?: string
  /** 为 false 时仅展示主按钮（替代 ElMessageBox.alert） */
  showCancel?: boolean
}

export type FunConfirmDialogApi = ReturnType<typeof useFunConfirmDialog>

/**
 * 与 FunConfirmDialog 配合：Promise 风格确认框，替代 ElMessageBox.confirm。
 *
 * 注意：必须用 reactive 合并状态，避免「返回 { visible: ref() } 普通对象」在模板里
 * `funConfirm.visible` 无法自动解包，导致子组件收到 Ref 对象、弹窗常显且关不掉。
 */
export function useFunConfirmDialog() {
  let resolver: ((ok: boolean) => void) | null = null

  const state = reactive({
    visible: false,
    title: '提示',
    message: '',
    tips: [] as string[],
    confirmText: '确认',
    cancelText: '取消',
    width: 'min(92vw, 520px)',
    showCancel: true,
  })

  function finish(ok: boolean) {
    state.visible = false
    if (resolver) {
      resolver(ok)
      resolver = null
    }
  }

  function open(options: FunConfirmOpenOptions): Promise<boolean> {
    state.title = options.title ?? '提示'
    state.message = options.message
    state.tips = options.tips ?? []
    if (options.confirmText != null) state.confirmText = options.confirmText
    if (options.cancelText != null) state.cancelText = options.cancelText
    if (options.width != null) state.width = options.width
    state.showCancel = options.showCancel !== false
    state.visible = true
    return new Promise<boolean>((resolve) => {
      resolver = resolve
    })
  }

  function onConfirm() {
    finish(true)
  }

  function onCancel() {
    finish(false)
  }

  return Object.assign(state, { open, onConfirm, onCancel })
}
