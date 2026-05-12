/**
 * 具名路由常量：页面跳转应优先使用 name，避免硬编码 path（与菜单 path 调整解耦）。
 * 须与 router/routes 中各路由的 name 字段保持一致。
 */
export const ROUTE_NAMES = {
  login: 'Login',
  learningGuide: 'LearningGuide',
  dashboard: 'Dashboard',
  profile: 'Profile',
  systemUsers: 'SystemUsers',
  systemAccounts: 'SystemAccounts',
  systemRoles: 'SystemRoles',
  authRole: 'AuthRole',
  authUser: 'AuthUser',
} as const

export type RouteName = (typeof ROUTE_NAMES)[keyof typeof ROUTE_NAMES]
