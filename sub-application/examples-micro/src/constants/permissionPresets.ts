import {
  ROLE_ADMIN,
  ROLE_AUDIT,
  ROLE_CONTENT,
  ROLE_DEMO,
} from '@micro/constants/roles'
import {
  PERM_CONTENT_ARTICLE_CREATE,
  PERM_CONTENT_ARTICLE_EDIT,
  PERM_CONTENT_ARTICLE_EXPORT,
  PERM_DEMO_PERM_ALL_A,
  PERM_DEMO_PERM_VISIBLE,
  PERM_DEMO_ROW_EDIT,
  PERM_DEMO_ROW_TOGGLE,
  PERM_DEMO_TABLE_EXPORT,
  PERM_PRICE_TEMPLATE_ADD,
  PERM_PRICE_TEMPLATE_EDIT,
  PERM_PRICE_TEMPLATE_REMOVE,
  PERM_SYSTEM_ACCOUNT_LIST,
  PERM_SYSTEM_DEPT_LIST,
  PERM_SYSTEM_DICT_LIST,
  PERM_SYSTEM_LOG_EXPORT,
  PERM_SYSTEM_MENU_LIST,
  PERM_SYSTEM_POST_LIST,
  PERM_SYSTEM_ROLE_LIST,
  PERM_SYSTEM_USER_LIST,
  PERM_WILDCARD,
} from '@micro/constants/perms'

export interface PermissionPreset {
  id: string
  label: string
  roles: string[]
  perms: string[]
}

/** 演示用：切换角色 + 权限点；登录后可改为接口返回 roles/perms 写入 store */
export const DEMO_PRESETS: PermissionPreset[] = [
  {
    id: 'admin',
    label: '管理员（全部）',
    roles: [ROLE_ADMIN],
    perms: [PERM_WILDCARD],
  },
  {
    id: 'content',
    label: '内容运营',
    roles: [ROLE_CONTENT],
    perms: [
      PERM_CONTENT_ARTICLE_CREATE,
      PERM_CONTENT_ARTICLE_EXPORT,
      PERM_CONTENT_ARTICLE_EDIT,
    ],
  },
  {
    id: 'demo',
    label: '示例访客',
    roles: [ROLE_DEMO],
    perms: [
      PERM_DEMO_PERM_VISIBLE,
      PERM_DEMO_PERM_ALL_A,
      PERM_DEMO_TABLE_EXPORT,
      PERM_DEMO_ROW_EDIT,
      PERM_DEMO_ROW_TOGGLE,
      PERM_PRICE_TEMPLATE_ADD,
      PERM_PRICE_TEMPLATE_EDIT,
      PERM_PRICE_TEMPLATE_REMOVE,
      /**
       * 静态「系统」子路由均带 meta.perms，校验时只看权限不看角色；
       * 演示模式下给示例访客只读类权限，侧栏才能看到系统菜单（非超级管理员能力）。
       */
      PERM_SYSTEM_ACCOUNT_LIST,
      PERM_SYSTEM_USER_LIST,
      PERM_SYSTEM_ROLE_LIST,
      PERM_SYSTEM_MENU_LIST,
      PERM_SYSTEM_DEPT_LIST,
      PERM_SYSTEM_POST_LIST,
      PERM_SYSTEM_DICT_LIST,
      PERM_SYSTEM_LOG_EXPORT,
    ],
  },
  {
    id: 'audit',
    label: '审计',
    roles: [ROLE_AUDIT],
    perms: [PERM_SYSTEM_LOG_EXPORT],
  },
  {
    id: 'guest',
    label: '访客（仅公开页）',
    roles: [],
    perms: [],
  },
]
