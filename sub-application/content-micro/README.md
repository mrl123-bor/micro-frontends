# content-micro

**qiankun** 子应用：承载主应用侧栏 **「演示内容」** 下的页面（如 `/content/articles`、`/content/categories`；`content` 为路由前缀约定）。页面与组件位于本目录 `src/`，**不依赖** 主应用 `admin/src` 业务源码，可单独安装、构建与部署。

## 开源协议

本目录源码适用 **MIT**（个人与商业均可）：见仓库根目录 [LICENSE](../../LICENSE)。

## 技术栈

Vue 3、TypeScript、Vite、Element Plus、vue-i18n、Vue Router、[vite-plugin-qiankun](https://github.com/tengmaoqing/vite-plugin-qiankun)。

## 快速开始

```bash
cd subapps/content-micro
npm install
npm run dev
```

默认开发端口 **5175**。在主应用 `admin/.env.development` 中配置：

```env
VITE_CONTENT_MICRO_ENTRY=http://127.0.0.1:5175/
```

| 脚本 | 说明 |
|------|------|
| `npm run dev` | 本地开发 |
| `npm run build` | 生产构建 |
| `npm run typecheck` | `vue-tsc` 类型检查 |
| `npm run preview` | 预览构建产物 |

## 与主应用联调

1. 启动本仓库 `admin`：`cd admin && npm run dev`。
2. 启动本子应用：`npm run dev`。
3. 保证主应用环境变量中 `VITE_CONTENT_MICRO_ENTRY` 指向本子应用 dev 地址（末尾建议带 `/`）。

主应用侧使用 `views/micro/QiankunRouteLeaf` 等占位路由，并在 `meta` 上标记 `microContent: true`；子应用路由需与主应用菜单 path 对齐。

## 生产部署

与主应用 **同域子路径** 部署时，构建阶段将 **`VITE_QIANKUN_HOST_BASE`** 与主应用的 **`VITE_PUBLIC_PATH`** 设为一致（例如均为 `/admin/`），保证 `createWebHistory` 与浏览器地址一致。具体以各环境 `vite` 配置与 `.env.production` 为准。

## 权限说明

当前子应用未内置与主应用一致的 Pinia 权限模块。若需在子应用内做按钮级权限，可自行引入 store，或监听主应用 `admin-permission-sync` / qiankun 全局状态。

## 相关链接

- [主应用 README](../../admin/README.md)
- [子应用总览](../README.md)
- [LICENSE](../../LICENSE)
