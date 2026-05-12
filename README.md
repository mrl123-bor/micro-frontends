# 后台管理系统（微前端）— 项目说明

## 概述

本项目是一套**企业级后台管理系统**的前端工程，采用**微前端**架构：主应用作为壳（布局、登录、动态菜单、权限、多标签页等），业务以 **qiankun** 子应用形式按需挂载，便于团队独立开发与部署。

- **主应用**：Vue 3 + TypeScript + Vite + Element Plus + Pinia + Vue Router，对接后端（如 NestJS）完成登录、用户信息、动态路由与按钮级权限等。
- **开源子应用**：与本仓库一并提供的示例子应用包括 **content-micro**（演示内容）、**examples-micro**（示例与媒体预览等），通过环境变量配置入口 URL 即可联调。

更细的技术说明、环境变量与目录结构请参阅：

- [主应用说明](mainApplication/README.md)
- [content-micro](sub-application/content-micro/README.md)
- [examples-micro](sub-application/examples-micro/README.md)

## 演示地址

在线演示（登录页）：<https://www.lghdev.com/admin/login>

## 国内镜像
地址：<https://gitee.com/jmszls/micro-frontends/tree/master>

## 技术栈摘要

| 层级 | 技术 |
|------|------|
| 主应用框架 | Vue 3、TypeScript、Vite |
| UI | Element Plus |
| 状态与路由 | Pinia、Vue Router |
| 微前端 | qiankun |
| 国际化 | vue-i18n（可按需开启） |

后端可对接 **NestJS** 等提供 REST 接口（如登录、`getInfo`、系统菜单与权限等）；主应用开发环境默认将 `/api` 代理到本地后端，详见主应用 `vite.config.ts` 与 `.env` 示例。

## 仓库结构（简要）

<img width="1920" height="911" alt="image" src="https://github.com/user-attachments/assets/ddc3ab6a-4f5b-4742-8fde-4f521094a0ce" />


```
微前端/
├── mainApplication/          # 主应用（管理后台壳）
└── sub-application/
    ├── content-micro/        # 内容类演示子应用
    └── examples-micro/       # 示例类子应用
```

## 关于「设计器」子应用

主应用预留了**打印 / 模板设计**等相关微应用挂载能力（如 `VITE_PRINT_DESIGN_ENTRY`、设计相关路由等）。**设计器完整源码（前端子应用及 NestJS 后端）不在本开源仓库范围内**；若你需要设计器的前后端实现或商业授权，请另行联系。

**联系方式**：qq - 2469496962

---

*文档用于对外整体介绍项目；具体构建命令与开发流程以各子目录 README 为准。*
