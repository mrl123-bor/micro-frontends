# examples-micro

**qiankun** 子应用：承载主应用侧栏 **「示例」** 下的页面（如 `/demo/table`、`/demo/form`、`/demo/permission` 等），以及 **`/media-preview`** 等快捷路由。组件与接口封装均在 `src/`，**不依赖** 主应用 `admin/src` 业务源码。

## 开源协议

本目录源码适用 **MIT**（个人与商业均可）：见仓库根目录 [LICENSE](../../LICENSE)。

## 技术栈

Vue 3、TypeScript、Vite、Element Plus、Pinia、vue-i18n、Vue Router、Axios、[vite-plugin-qiankun](https://github.com/tengmaoqing/vite-plugin-qiankun)，以及示例中使用的 `@lgh_/media-preview-npm` 等依赖（以 `package.json` 为准）。

## 快速开始

```bash
cd subapps/examples-micro
npm install
npm run dev
```

默认开发端口 **5176**。在主应用 `admin/.env.development` 中配置：

```env
VITE_EXAMPLES_MICRO_ENTRY=http://127.0.0.1:5176/
```

| 脚本 | 说明 |
|------|------|
| `npm run dev` | 本地开发 |
| `npm run build` | 生产构建 |
| `npm run typecheck` | `vue-tsc` 类型检查 |
| `npm run preview` | 预览构建产物 |

## 与主应用联调

1. 启动 `admin` 与本子应用。
2. 配置主应用 `VITE_EXAMPLES_MICRO_ENTRY` 指向本子应用地址。

主应用路由 `meta.microExamples: true` 与 `setupContentExamplesMicro.ts` 中的激活规则需与子应用路由一致。

## 权限与主应用同步

子应用内使用 Pinia（`permission` / `auth` 等）与主应用共用 **`sessionStorage`** 键 **`admin-permission`**。主应用在权限变更后会派发 **`admin-permission-sync`** 自定义事件；本子应用在 `bootstrap` 中监听并 `loadFromStorage()`，以便壳上切换演示角色后子应用内 **`v-permission`** 与 `usePermission()` 能及时刷新。新增子应用时可参考 `src/bootstrap.ts`。

## 生产部署

与 [content-micro](../content-micro/README.md) 相同：同域子路径部署时对齐 **`VITE_QIANKUN_HOST_BASE`** 与主应用 **`VITE_PUBLIC_PATH`**。

## 相关链接

- [主应用 README](../../admin/README.md)
- [content-micro](../content-micro/README.md)
- [子应用总览](../README.md)
- [LICENSE](../../LICENSE)
