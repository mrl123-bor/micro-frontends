import { useI18n } from 'vue-i18n'
import type { RouteRecordRaw } from 'vue-router'

type HasRouteName = {
  name?: RouteRecordRaw['name']
  meta?: { title?: unknown }
}

export function useRouteTitle() {
  const { t, te } = useI18n()

  function titleForRoute(r: HasRouteName): string {
    const name = r.name != null ? String(r.name) : ''
    const key = name ? `route.${name}` : ''
    if (key && te(key)) return t(key)
    return String(r.meta?.title ?? '')
  }

  return { titleForRoute }
}
