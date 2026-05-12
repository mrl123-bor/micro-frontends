/**
 * qita 模板「发版」抽屉依赖 MisAPi*；本系统未对接 qita 的 /api/all 时返回空列表。
 * 若需发版，请在 backend 增加转发或在此改为真实请求。
 */
export function MisAPiAll() {
  return Promise.resolve([] as { label: string; value: number }[])
}

export function MisAPiexecute(
  _id: number,
  _body: {
    params?: Record<string, unknown>
    headers?: Record<string, unknown>
    variables?: Record<string, unknown>
  },
) {
  return Promise.reject(new Error('发版接口未对接：请在管理系统 backend 转发 qita 的 /api/all 与 /api/:id/execute'))
}
