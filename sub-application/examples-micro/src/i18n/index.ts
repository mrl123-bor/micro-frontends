import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'

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
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})
