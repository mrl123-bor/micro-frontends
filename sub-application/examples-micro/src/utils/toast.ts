/**
 * 全局轻提示：基于 ElMessage，顶部居中「灵动岛」样式由 `admin-island-message` + `island-message.scss` 提供。
 */
import { isVNode } from 'vue'
import type { AppContext } from 'vue'
import { ElMessage } from 'element-plus'
import type {
  MessageHandler,
  MessageOptions,
  MessageParams,
  MessageParamsWithType,
  MessagePlacement,
  MessageType,
} from 'element-plus'

const ISLAND_CLASS = 'admin-island-message'

const islandDefaults: Partial<MessageOptions> = {
  customClass: ISLAND_CLASS,
  placement: 'top',
  offset: 24,
  grouping: true,
}

function mergeClasses(island: string, extra?: string): string {
  return [island, extra].filter(Boolean).join(' ')
}

function withIsland(options: MessageOptions): MessageOptions {
  return {
    ...islandDefaults,
    ...options,
    customClass: mergeClasses(ISLAND_CLASS, options.customClass),
  }
}

function toOptions(params?: MessageParams, fallbackType?: MessageType): MessageOptions {
  if (params == null) {
    return withIsland({ message: '', type: fallbackType ?? 'info' })
  }
  if (typeof params === 'string' || isVNode(params) || typeof params === 'function') {
    return withIsland({
      message: params as MessageOptions['message'],
      type: fallbackType ?? 'info',
    })
  }
  return withIsland({
    ...params,
    type: params.type ?? fallbackType ?? 'info',
  })
}

function call(
  params?: MessageParams,
  appContext?: AppContext | null,
  fallbackType?: MessageType,
): MessageHandler {
  return ElMessage(toOptions(params, fallbackType), appContext)
}

function typed(
  type: MessageType,
  options?: MessageParamsWithType,
  appContext?: AppContext | null,
): MessageHandler {
  if (options === undefined || options === null) {
    return { close: () => {} }
  }
  if (typeof options === 'string' || isVNode(options) || typeof options === 'function') {
    return ElMessage(
      withIsland({ type, message: options as MessageOptions['message'] }),
      appContext,
    )
  }
  const o = options as MessageOptions
  return ElMessage(withIsland({ ...o, type: o.type ?? type }), appContext)
}

/** 与 ElMessage 相同的全局关闭能力 */
export function closeAll(type?: MessageType): void {
  ElMessage.closeAll(type)
}

export function closeAllByPlacement(position: MessagePlacement): void {
  ElMessage.closeAllByPlacement(position)
}

export const toast = Object.assign(
  (options?: MessageParams, appContext?: AppContext | null) =>
    call(options, appContext, undefined),
  {
    success: (o?: MessageParamsWithType, ctx?: AppContext | null) => typed('success', o, ctx),
    warning: (o?: MessageParamsWithType, ctx?: AppContext | null) => typed('warning', o, ctx),
    error: (o?: MessageParamsWithType, ctx?: AppContext | null) => typed('error', o, ctx),
    info: (o?: MessageParamsWithType, ctx?: AppContext | null) => typed('info', o, ctx),
    primary: (o?: MessageParamsWithType, ctx?: AppContext | null) => typed('primary', o, ctx),
    closeAll,
    closeAllByPlacement,
  },
)
