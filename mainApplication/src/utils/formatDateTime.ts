/** 将 ISO 等可被 Date 解析的值格式化为 YYYY-MM-DD HH:mm:ss（本地时区） */
export function formatDateTimeLocal(value: unknown): string {
  if (value == null || value === '') return ''
  const d = new Date(String(value))
  if (Number.isNaN(d.getTime())) return String(value)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
