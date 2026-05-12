import { createI18n } from 'vue-i18n'

/** 与主应用 `admin/src/i18n` 使用同一 key，便于语言与主壳一致 */
const LOCALE_STORAGE_KEY = 'app-locale'

export type AppLocale = 'zh-CN' | 'en-US'

function readInitialLocale(): AppLocale {
  try {
    const s = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (s === 'en-US' || s === 'zh-CN') return s
  } catch {
    /* ignore */
  }
  return 'zh-CN'
}

export const i18n = createI18n({
  legacy: false,
  locale: readInitialLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': {
      route: {
        ContentArticles: '文章列表',
        ContentCategories: '分类管理',
      },
    },
    'en-US': {
      route: {
        ContentArticles: 'Articles',
        ContentCategories: 'Categories',
      },
    },
  },
})
