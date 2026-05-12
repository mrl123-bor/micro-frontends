export function arrayToMap<T extends Record<string, any>>(
  arr: T[],
  key: keyof T,
): Record<string, T[]> {
  const out: Record<string, T[]> = {}
  for (const item of arr) {
    const k = String(item[key])
    if (!out[k]) out[k] = []
    out[k].push(item)
  }
  return out
}

export function mapToArray<T>(map: Record<string, T>): T[] {
  return Object.keys(map).map((k) => map[k])
}

