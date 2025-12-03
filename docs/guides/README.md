# 开发指南

<div align="center">

**NextJS Base 功能开发详细指南**

[数据库](#-数据库) · [后台开发](#-后台开发) · [权限系统](#-权限系统) · [前台开发](#-前台开发)

</div>

---

## 📚 指南目录

### 🗄️ 数据库

| 文档 | 说明 | 阅读时间 |
|:---|:---|:---:|
| [Prisma 开发指南](./database/PRISMA_GUIDE.md) | PostgreSQL + Prisma 数据库设计和操作 | 15 分钟 |

### 🛠️ 后台开发

| 文档 | 说明 | 阅读时间 |
|:---|:---|:---:|
| [SmartCrudPage 指南](./admin/SMART_CRUD.md) | 万能表格组件详细使用指南 | 20 分钟 |
| [SmartForm 指南](./admin/SMART_FORM.md) | 万能表单组件详细使用指南 | 15 分钟 |
| [Server Actions 开发](./admin/SERVER_ACTIONS.md) | 后台 Actions 开发最佳实践 | 15 分钟 |

### 🔐 权限系统

| 文档 | 说明 | 阅读时间 |
|:---|:---|:---:|
| [RBAC 配置指南](./rbac/CONFIGURATION.md) | 角色权限配置详细指南 | 15 分钟 |
| [菜单管理指南](./rbac/MENU_MANAGEMENT.md) | 后台菜单配置和管理 | 10 分钟 |

### 🌐 前台开发

| 文档 | 说明 | 阅读时间 |
|:---|:---|:---:|
| [认证系统](./client/AUTH.md) | 用户认证和会话管理 | 10 分钟 |
| [国际化指南](./client/I18N.md) | 多语言支持配置 | 10 分钟 |

---

## 🎯 快速导航

### 我想要...

| 目标 | 推荐阅读 |
|:---|:---|
| 创建一个新的管理页面 | [SmartCrudPage 指南](./admin/SMART_CRUD.md) |
| 设计数据库模型 | [Prisma 开发指南](./database/PRISMA_GUIDE.md) |
| 添加自定义表单字段 | [SmartForm 指南](./admin/SMART_FORM.md) |
| 配置用户权限 | [RBAC 配置指南](./rbac/CONFIGURATION.md) |
| 添加后台菜单 | [菜单管理指南](./rbac/MENU_MANAGEMENT.md) |
| 实现用户登录 | [认证系统](./client/AUTH.md) |
| 添加多语言支持 | [国际化指南](./client/I18N.md) |

---

## 📂 目录结构

```
guides/
├── README.md                   # 📍 本文件
│
├── database/                   # 🗄️ 数据库
│   └── PRISMA_GUIDE.md
│
├── admin/                      # 🛠️ 后台开发
│   ├── SMART_CRUD.md
│   ├── SMART_FORM.md
│   └── SERVER_ACTIONS.md
│
├── rbac/                       # 🔐 权限系统
│   ├── CONFIGURATION.md
│   └── MENU_MANAGEMENT.md
│
└── client/                     # 🌐 前台开发
    ├── AUTH.md
    └── I18N.md
```

---

<div align="center">

[← 返回文档中心](../README.md)

</div>

