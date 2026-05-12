/** 是否在顶栏、登录页显示中英文切换（.venv.* 中 VITE_I18N_SWITCHER=true） */
export const showI18nSwitcher = import.meta.env.VITE_I18N_SWITCHER === 'true'

/** 是否在登录表单显示「手机号登录」切换入口（.env.* 中 VITE_LOGIN_MOBILE=true） */
export const showLoginMobileOption = import.meta.env.VITE_LOGIN_MOBILE === 'true'
