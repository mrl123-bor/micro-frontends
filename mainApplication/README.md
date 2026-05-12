# Admin Web（管理后台主应用）

基于 **Vue 3、TypeScript、Vite、Element Plus** 的后台壳工程：多布局、主题与移动端适配、多标签页、**动态菜单**、路由与按钮级权限，并可对接 **Nest** 等后端（登录、`getInfo`、`system/*` 等）。开发环境通过 Vite 将 `/api` 代理到本机后端（默认 `http://127.0.0.1:3000`，见 `vite.config.ts`）。

通过 **[qiankun](https://qiankun.umijs.org/)** 可在内容区挂载子应用；与本仓库一并开源的子应用为 **[content-micro](../subapps/content-micro/)** 与 **[examples-micro](../subapps/examples-micro/)**。`subapps/print-design-micro/` **不在** 本开源许可范围内（见仓库根目录 [LICENSE](../LICENSE)）；主应用内若保留相关菜单与容器，需自行提供子应用或移除对应配置。

## 开源协议

本目录源码适用 **MIT**：允许个人与商业使用、修改、再发布，免责声明见 [LICENSE](../LICENSE)。

## 技术栈

| 类别 | 说明 |
|------|------|
| 框架 | Vue 3（`<script setup>`） |
| 语言 | TypeScript |
| 构建 | Vite 8 |
| UI | Element Plus 2.x、`@element-plus/icons-vue` |
| 路由 | Vue Router 4 |
| 状态 | Pinia 3 |
| 样式 | Sass（`main.scss` 等） |
| 国际化 | vue-i18n 9（Composition API，`legacy: false`） |
| 微前端 | qiankun 2.x |

## 快速开始

```bash
cd admin
npm install
npm run dev
```

默认开发端口 **5173**（`vite.config.ts` 中已开启 `host`，便于局域网访问）。路径别名：`@` → `src/`。

| 脚本 | 说明 |
|------|------|
| `npm run dev` | 本地开发 |
| `npm run build` / `npm run build:prod` | 类型检查 + 生产构建 |
| `npm run build:stage` | staging 模式构建 |
| `npm run preview` | 预览构建产物（默认 4173） |

使用 **content-micro** / **examples-micro** 时，请同时启动对应子应用，并在环境变量中配置入口 URL（见下表）。

## 环境变量（Vite）

定义见 `src/vite-env.d.ts`，开发可参考 `.env.development`、生产参考 `.env.production`。

| 变量 | 说明 |
|------|------|
| `VITE_API_BASE` / `VITE_APP_BASE_API` | API 前缀；开发多为 `/api`（由代理转发） |
| `VITE_APP_RUNTIME` | `demo`：纯前端演示（占位数据、「进入演示」）；`integration` 或缺省：对接真实后端 |
| `VITE_DEMO_SWITCHER` | `true` 时在顶栏显示「演示角色」切换（仅 `permission.source !== 'api'` 时生效） |
| `VITE_I18N_SWITCHER` | `true` 时显示中英文切换入口 |
| `VITE_CONTENT_MICRO_ENTRY` | 演示内容子应用入口，如 `http://127.0.0.1:5175/` |
| `VITE_EXAMPLES_MICRO_ENTRY` | 示例子应用入口，如 `http://127.0.0.1:5176/` |
| `VITE_PUBLIC_PATH` | 主应用部署在子路径时设置（与子应用 `VITE_QIANKUN_HOST_BASE` 对齐） |
| `VITE_ANTI_CRAWLER` | `true` 时启用前端反爬/反自动化相关策略 |
| `VITE_ANTI_CRAWLER_DEVTOOLS` | 是否叠加 DevTools 检测（易误判，默认关） |
| `VITE_APP_TITLE` | 可选；浏览器标题等 |

若你自行集成其他 qiankun 子应用，可沿用 `src/micro/` 中的注册模式并增加对应 `VITE_*_ENTRY`。

## 微前端（与本仓库开源子应用）

- **content-micro**：侧栏「演示内容」路由宿主；`VITE_CONTENT_MICRO_ENTRY`；布局挂载容器 `#micro-content`；路由 `meta.microContent` 等（详见 `src/micro/setupContentExamplesMicro.ts`、`router/routes.ts`）。
- **examples-micro**：「示例」菜单与 `/media-preview` 等；`VITE_EXAMPLES_MICRO_ENTRY`；`#micro-examples`；`meta.microExamples`。子应用内 Pinia 权限与主应用共用 `sessionStorage` 键 `admin-permission`，并监听主应用派发的 **`admin-permission-sync`** 以刷新 `v-permission` 等。

子应用独立 `createPinia()`；除 examples-micro 已实现的同步外，其他子应用需自行对接权限或 qiankun `props` / `initGlobalState`。

## 目录结构（`src` 摘要）

```
src/
├── assets/           # 全局样式与设计令牌
├── composables/      # useAdminMenuRoutes、usePermission、useTheme 等
├── constants/        # 权限点、角色、功能开关（如 i18n 开关）
├── directives/       # v-permission
├── i18n/             # zh-CN、en-US
├── layouts/          # AdminLayout、TagsView、菜单与主题切换等
├── micro/            # qiankun 注册与共享依赖暴露
├── router/           # 静态/动态路由、菜单解析、404
├── stores/           # auth、permission、dynamic-routes、app
├── utils/            # 菜单过滤、路由可达性、可选 antiCrawler
└── views/            # 业务页、微前端占位 QiankunRouteLeaf 等
```

## 权限与路由（简述）

- **路由**：`router/index.ts` 中根据 `permission.canAccessRoute` 与 `meta.roles` / `meta.perms` 控制访问；失败跳转 `/403`。
- **菜单**：`useAdminMenuRoutes` 等与路由一致的过滤规则。
- **按钮**：`v-permission`、`usePermission()`；权限字符串见 `constants/perms.ts`，须与后端约定一致。角色 `admin` 或权限 `*` 视为超管演示逻辑。
- **演示**：`VITE_APP_RUNTIME=demo` 或演示角色切换时走本地预设；**不能替代服务端鉴权**。

## 国际化

语言包在 `src/i18n/locales/`。接口返回的业务文案（如部门名、后端下发的中文 `meta.title`）不会随界面语言自动翻译；多语言业务数据需后端或前端枚举映射配合。

## 相关文档

- [子应用总览](../subapps/README.md)
- [content-micro](../subapps/content-micro/README.md)
- [examples-micro](../subapps/examples-micro/README.md)
- [LICENSE](../LICENSE)

欢迎 Issue / PR。提交前请本地执行 `npm run build` 确保类型检查与构建通过。
