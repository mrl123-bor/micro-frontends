import type { RouteRecordRaw } from 'vue-router'
import {
  ROLE_ADMIN,
  ROLE_AUDIT,
  ROLE_CONTENT,
  ROLE_DEMO,
} from '@/constants/roles'
import {
  PERM_SYSTEM_ACCOUNT_LIST,
  PERM_PRICE_TEMPLATE_ADD,
  PERM_SYSTEM_DICT_LIST,
  PERM_SYSTEM_DEPT_LIST,
  PERM_SYSTEM_MENU_LIST,
  PERM_SYSTEM_POST_LIST,
  PERM_SYSTEM_ROLE_EDIT,
  PERM_SYSTEM_ROLE_LIST,
  PERM_SYSTEM_USER_EDIT,
  PERM_SYSTEM_USER_LIST,
} from '@/constants/perms'

/** 固定保留：工作台 + 403（不依赖后端菜单） */
export const coreLayoutChildren: RouteRecordRaw[] = [
  {
    path: 'dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/Index.vue'),
    meta: { title: '工作台', icon: 'Odometer', affix: true },
  },
  {
    path: 'profile',
    name: 'Profile',
    component: () => import('@/views/profile/Index.vue'),
    meta: { title: '个人中心', icon: 'UserFilled', hidden: true },
  },
  {
    path: '403',
    name: 'Forbidden',
    component: () => import('@/views/common/Forbidden.vue'),
    meta: { title: '无权访问', hidden: true, noTags: true },
  },
  /** 短路径直达媒体预览演示（与「示例 → 媒体预览」同页，不出现在侧栏） */
  {
    path: 'media-preview',
    name: 'MediaPreview',
    component: () => import('@/views/micro/QiankunRouteLeaf'),
    meta: { title: '媒体预览', hidden: true, noTags: true, microExamples: true },
  },
]

/** 演示 / 离线：内容、示例、静态「系统」菜单（API 动态菜单加载成功后侧栏以服务端为准） */
export const staticExtraMenuRoutes: RouteRecordRaw[] = [
  /**
   * 侧栏「演示内容」：文章列表 / 分类占位，走 content-micro；与「项目业务里的内容模块」不是同一概念。
   */
  {
    path: 'content',
    name: 'Content',
    component: () => import('@/layouts/RouteNest.vue'),
    meta: { title: '演示内容', icon: 'Notebook', microContent: true },
    children: [
      {
        path: 'articles',
        name: 'ContentArticles',
        component: () => import('@/views/micro/QiankunRouteLeaf'),
        meta: {
          title: '文章列表',
          icon: 'Document',
          roles: [ROLE_ADMIN, ROLE_CONTENT],
        },
      },
      {
        path: 'categories',
        name: 'ContentCategories',
        component: () => import('@/views/micro/QiankunRouteLeaf'),
        meta: {
          title: '分类管理',
          icon: 'FolderOpened',
          roles: [ROLE_ADMIN, ROLE_CONTENT],
        },
      },
    ],
  },
  {
    path: 'demo',
    name: 'Demo',
    component: () => import('@/layouts/RouteNest.vue'),
    meta: { title: '示例', icon: 'Grid', microExamples: true },
    children: [
      {
        path: 'table',
        name: 'DemoTable',
        component: () => import('@/views/micro/QiankunRouteLeaf'),
        meta: { title: '列表示例', roles: [ROLE_ADMIN, ROLE_DEMO] },
      },
      {
        path: 'form',
        name: 'DemoForm',
        component: () => import('@/views/micro/QiankunRouteLeaf'),
        meta: {
          title: '表单示例',
          icon: 'EditPen',
          roles: [ROLE_ADMIN, ROLE_DEMO],
        },
      },
      {
        path: 'analysis',
        name: 'DemoAnalysis',
        component: () => import('@/views/micro/QiankunRouteLeaf'),
        meta: {
          title: '分析页',
          icon: 'TrendCharts',
          roles: [ROLE_ADMIN, ROLE_DEMO],
        },
      },
      {
        path: 'media-preview',
        name: 'DemoMediaPreview',
        component: () => import('@/views/micro/QiankunRouteLeaf'),
        meta: {
          title: '媒体预览',
          icon: 'View',
          roles: [ROLE_ADMIN, ROLE_DEMO],
        },
      },
      {
        path: 'permission',
        name: 'DemoPermission',
        component: () => import('@/views/micro/QiankunRouteLeaf'),
        meta: {
          title: '按钮权限示例',
          icon: 'Key',
          roles: [ROLE_ADMIN, ROLE_DEMO],
        },
      },
    ],
  },
  {
    path: 'printer',
    name: 'Printer',
    component: () => import('@/layouts/RouteNest.vue'),
    meta: { title: '价签打印', icon: 'Printer' },
    children: [
      {
        path: 'template',
        name: 'PrinterTemplate',
        component: () => import('@/views/printer/PrintDesignShell.vue'),
        meta: {
          title: '标签模板',
          icon: 'Document',
          roles: [ROLE_ADMIN, ROLE_DEMO],
          perms: [PERM_PRICE_TEMPLATE_ADD],
          microPrintDesign: true,
        },
      },
    ],
  },
  {
    path: 'system',
    name: 'System',
    component: () => import('@/layouts/RouteNest.vue'),
    meta: { title: '系统', icon: 'Setting' },
    children: [
      {
        path: 'accounts',
        name: 'SystemAccounts',
        component: () => import('@/views/system/accounts/Index.vue'),
        meta: {
          title: '账号管理',
          icon: 'Avatar',
          roles: [ROLE_ADMIN],
          perms: [PERM_SYSTEM_ACCOUNT_LIST],
        },
      },
      {
        path: 'users',
        name: 'SystemUsers',
        component: () => import('@/views/system/UserManage.vue'),
        meta: {
          title: '用户管理',
          icon: 'User',
          roles: [ROLE_ADMIN],
          perms: [PERM_SYSTEM_USER_LIST],
        },
      },
      {
        path: 'roles',
        name: 'SystemRoles',
        component: () => import('@/views/system/RoleList.vue'),
        meta: {
          title: '角色管理',
          icon: 'Key',
          roles: [ROLE_ADMIN],
          perms: [PERM_SYSTEM_ROLE_LIST],
        },
      },
      {
        path: 'menus',
        name: 'SystemMenus',
        component: () => import('@/views/system/MenuManage.vue'),
        meta: {
          title: '菜单管理',
          icon: 'Menu',
          roles: [ROLE_ADMIN],
          perms: [PERM_SYSTEM_MENU_LIST],
        },
      },
      {
        path: 'depts',
        name: 'SystemDepts',
        component: () => import('@/views/system/DeptManage.vue'),
        meta: {
          title: '部门管理',
          icon: 'OfficeBuilding',
          roles: [ROLE_ADMIN],
          perms: [PERM_SYSTEM_DEPT_LIST],
        },
      },
      {
        path: 'posts',
        name: 'SystemPosts',
        component: () => import('@/views/system/PostManage.vue'),
        meta: {
          title: '岗位管理',
          icon: 'Briefcase',
          roles: [ROLE_ADMIN],
          perms: [PERM_SYSTEM_POST_LIST],
        },
      },
      {
        path: 'dict',
        name: 'SystemDict',
        component: () => import('@/views/system/DictManage.vue'),
        meta: {
          title: '字典管理',
          icon: 'Collection',
          roles: [ROLE_ADMIN],
          perms: [PERM_SYSTEM_DICT_LIST],
        },
      },
      {
        path: 'logs',
        name: 'SystemLogs',
        component: () => import('@/views/system/OperateLog.vue'),
        meta: {
          title: '操作日志',
          icon: 'List',
          roles: [ROLE_ADMIN, ROLE_AUDIT, ROLE_DEMO],
        },
      },
    ],
  },
]

/**
 * 隐藏页（对标 nest-admin dynamicRoutes）：分配角色、分配用户
 * https://gitee.com/tao-zhi/nest-admin/blob/master/admin-vue3/src/router/index.js
 */
export const hiddenLayoutChildren: RouteRecordRaw[] = [
  {
    path: 'printer/gen-edit/index/:tableId(\\S+)',
    name: 'DesignEdit',
    component: () => import('@/views/printer/PrintDesignShell.vue'),
    meta: {
      title: '标签模板设计',
      hidden: true,
      roles: [ROLE_ADMIN, ROLE_DEMO],
      perms: [PERM_PRICE_TEMPLATE_ADD],
      activeMenu: '/printer/template',
      microPrintDesign: true,
    },
  },
  {
    path: 'printer/gen-edit/h5/:tableId(\\S+)',
    name: 'DesignEditH5',
    /** 与 PC 同一设计器：≤1024 由模板列表跳入，壳内响应式布局（手机抽屉 / 平板侧栏） */
    component: () => import('@/views/printer/PrintDesignShell.vue'),
    meta: {
      title: '标签模板设计(H5)',
      hidden: true,
      roles: [ROLE_ADMIN, ROLE_DEMO],
      perms: [PERM_PRICE_TEMPLATE_ADD],
      activeMenu: '/printer/template',
      microPrintDesign: true,
    },
  },
  {
    path: 'system/user-auth/role/:userId(\\d+)',
    name: 'AuthRole',
    component: () => import('@/views/system/user/AuthRole.vue'),
    meta: {
      title: '分配角色',
      hidden: true,
      perms: [PERM_SYSTEM_USER_EDIT],
      activeMenu: '/system/users',
    },
  },
  {
    path: 'system/role-auth/user/:roleId(\\d+)',
    name: 'AuthUser',
    component: () => import('@/views/system/role/AuthUser.vue'),
    meta: {
      title: '分配用户',
      hidden: true,
      perms: [PERM_SYSTEM_ROLE_EDIT],
      activeMenu: '/system/roles',
    },
  },
]

/** 布局下全部静态子路由（core + extra），供演示账号与未走 getRouters 时使用 */
export const layoutChildren: RouteRecordRaw[] = [
  ...coreLayoutChildren,
  ...staticExtraMenuRoutes,
]
