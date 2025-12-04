# NextJS Base 文档中心

<div align="center">

![Version](https://img.shields.io/badge/version-v0.1.0-blue.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**配置驱动的全栈开发框架**

[快速开始](#-快速开始) · [核心概念](#-核心概念) · [开发指南](#-开发指南) · [API 参考](#-api-参考)

</div>

---

## 🎯 项目简介

NextJS Base 是一个**配置驱动**的全栈开发框架，专为快速构建企业级管理系统设计。

### 核心优势

| 特性 | 传统开发 | NextJS Base |
|:---:|:---:|:---:|
| 创建 CRUD 页面 | 4-8 小时 | **10-30 分钟** |
| 代码量 | 500-1000 行 | **100-200 行** |
| 权限系统 | 手动实现 | **自动集成** |
| 表单验证 | 重复编写 | **配置驱动** |
| 操作日志 | 手动记录 | **自动记录** |

### 技术栈

| 层级 | 技术 | 说明 |
|:---|:---|:---|
| 框架 | Next.js 16 | App Router + Server Actions |
| 数据库 | PostgreSQL 16+ | 关系型数据库 |
| ORM | Prisma | 类型安全的数据库客户端 |
| 认证 | Better Auth | 现代化认证解决方案 |
| UI | Ant Design 5 | ProComponents 企业级组件 |
| 状态 | React Hooks | 内置状态管理 |

---

## 📚 文档导航

### 🚀 快速开始

> 新手入门，快速上手项目开发

| 文档 | 说明 | 阅读时间 |
|:---|:---|:---:|
| [**快速入门指南**](./getting-started/README.md) | 环境配置、项目启动 | 10 分钟 |
| [**创建第一个页面**](./getting-started/FIRST_PAGE.md) | 使用模板创建 CRUD 页面 | 15 分钟 |
| [**项目结构说明**](./getting-started/PROJECT_STRUCTURE.md) | 目录结构和文件说明 | 5 分钟 |

### 🏗️ 架构设计

> 深入理解项目架构和设计理念

| 文档 | 说明 | 阅读时间 |
|:---|:---|:---:|
| [**整体架构**](./architecture/OVERVIEW.md) | 系统架构图和核心组件 | 10 分钟 |
| [**数据流设计**](./architecture/DATA_FLOW.md) | 请求处理和数据流转 | 8 分钟 |
| [**权限模型**](./architecture/PERMISSION_MODEL.md) | RBAC 权限设计 | 10 分钟 |

### 📖 开发指南

> 详细的功能开发文档

| 分类 | 文档 | 说明 |
|:---|:---|:---|
| **数据库** | [PostgreSQL + Prisma](./guides/database/PRISMA_GUIDE.md) | 数据库设计和操作 |
| **后台开发** | [SmartCrudPage](./guides/admin/SMART_CRUD.md) | 万能表格组件 |
| | [SmartForm](./guides/admin/SMART_FORM.md) | 万能表单组件 |
| | [Server Actions](./guides/admin/SERVER_ACTIONS.md) | 后台 Actions 开发 |
| **权限系统** | [RBAC 配置](./guides/rbac/CONFIGURATION.md) | 角色权限配置 |
| | [菜单管理](./guides/rbac/MENU_MANAGEMENT.md) | 后台菜单配置 |
| **前台开发** | [认证系统](./guides/client/AUTH.md) | 用户认证和会话 |
| | [国际化](./guides/client/I18N.md) | 多语言支持 |

### 🔧 API 参考

> 组件和函数的详细 API 文档

| 分类 | 文档 | 说明 |
|:---|:---|:---|
| **配置 API** | [fieldsConfig](./api/FIELDS_CONFIG.md) | 字段配置详解 |
| **工具库** | [nb.pubfn](./api/NB_PUBFN.md) | 公共函数库 |

### 📋 最佳实践

> 模板和示例代码

| 文档 | 说明 |
|:---|:---|
| [**完整示例**](../templates/crud/EXAMPLE.md) | 从零创建优惠券管理功能 |
| [**页面模板**](../templates/crud/page.template.js) | SmartCrudPage 模板 |
| [**Action 模板**](../templates/crud/action.template.js) | Server Actions 模板 |
| [**数据库设计**](../templates/crud/DATABASE.md) | Prisma Schema 设计规范 |
| [**权限配置**](../templates/crud/PERMISSIONS.md) | RBAC 权限配置指南 |

---

## 🗂️ 目录结构

```
docs/
├── README.md                       # 📍 文档中心（本文件）
│
├── getting-started/                # 🚀 快速开始
│   ├── README.md                   # 快速入门指南
│   ├── FIRST_PAGE.md               # 创建第一个页面
│   └── PROJECT_STRUCTURE.md        # 项目结构说明
│
├── architecture/                   # 🏗️ 架构设计
│   ├── OVERVIEW.md                 # 整体架构
│   ├── DATA_FLOW.md                # 数据流设计
│   └── PERMISSION_MODEL.md         # 权限模型
│
├── guides/                         # 📖 开发指南
│   ├── database/                   # 数据库相关
│   │   └── PRISMA_GUIDE.md
│   ├── admin/                      # 后台开发
│   │   ├── SMART_CRUD.md
│   │   ├── SMART_FORM.md
│   │   └── SERVER_ACTIONS.md
│   ├── rbac/                       # 权限系统
│   │   ├── CONFIGURATION.md
│   │   └── MENU_MANAGEMENT.md
│   └── client/                     # 前台开发
│       ├── AUTH.md
│       └── I18N.md
│
├── api/                            # 🔧 API 参考
│   ├── README.md
│   ├── FIELDS_CONFIG.md
│   └── NB_PUBFN.md
│
└── legacy/                         # 📦 历史文档（归档）
```

---

## 🔄 版本历史

### v0.1.0 (2025-12)

**开源首发版本**

- 🎉 首个开源发布，版本号 `v0.1.0`
- 🧭 提供 Landing Page + Admin Demo 供快速体验
- 👥 内置示例角色与账号，开箱即用探索 RBAC
- 🗂️ 早期闭源阶段的文档与实现已归档至 `docs/legacy/`

---

## 💡 快速链接

### 常用操作

- 🆕 [创建新的管理页面](./getting-started/FIRST_PAGE.md)
- 🗄️ [设计数据库模型](./guides/database/PRISMA_GUIDE.md)
- 🔐 [配置权限系统](./guides/rbac/CONFIGURATION.md)
- 📝 [使用模板快速开发](../templates/crud/README.md)

### 参考示例

| 页面 | 路径 | 特点 |
|:---|:---|:---|
| 角色管理 | `admin/rbac/roles` | 树形选择器、自定义操作 |
| 权限管理 | `admin/rbac/permissions` | 树形表格、数组字段 |
| 菜单管理 | `admin/rbac/menus` | 图标选择、动态加载 |
| 操作日志 | `admin/system/action_logs` | 只读表格、JSON 展示 |

---

<div align="center">

**Made with ❤️ by NextJS Base Team**

[返回顶部](#nextjs-base-文档中心)

</div>
