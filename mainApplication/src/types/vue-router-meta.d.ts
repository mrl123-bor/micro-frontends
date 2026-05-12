import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** 侧栏显示标题；无 title 且子级无可展示项则不出现在菜单 */
    title?: string
    /**
     * 侧栏图标：`@element-plus/icons-vue` 组件名（如 Odometer），
     * 或本地资源 `svg:文件名`、阿里 `iconfont:类名`（与菜单管理一致）
     */
    icon?: string
    /** 为 true 时不显示在侧栏 */
    hidden?: boolean
    /** 为 true 时标签不可关闭，且进入后台时会预置该标签 */
    affix?: boolean
    /** 为 true 时不出现在 Tags-View */
    noTags?: boolean
    /** 访问该路由所需角色（具备任一即可）；不填表示不校验 */
    roles?: string[]
    /** 访问该路由所需权限（具备任一即可）；与 meta.roles 二选一或并存（perms 优先） */
    perms?: string[]
    /** 无需登录即可访问（如登录页） */
    public?: boolean
    /** 标签设计器 qiankun 子应用宿主路由 */
    microPrintDesign?: boolean
    /** 内容子应用 qiankun 宿主（`/content/*`） */
    microContent?: boolean
    /** 示例子应用 qiankun 宿主（`/demo/*` 与快捷 `/media-preview`） */
    microExamples?: boolean
  }
}

export {}
