# 项目结构说明

<div align="center">

**5 分钟了解 NextJS Base 的目录结构**

[目录总览](#-目录总览) · [核心目录](#-核心目录) · [命名规范](#-命名规范)

</div>

---

## 📁 目录总览

```
nextjs-base/
│
├── 📂 app/                         # Next.js App Router
│   ├── 📂 (admin)/                # 后台管理模块
│   │   ├── 📂 admin/              # 后台页面
│   │   ├── 📂 actions/            # 后台 Server Actions
│   │   ├── layout.js              # 后台布局
│   │   └── admin-styles.css       # 后台样式
│   │
│   ├── 📂 (client)/               # 前台模块
│   │   ├── 📂 [locale]/           # 多语言路由
│   │   └── 📂 actions/            # 前台 Server Actions
│   │
│   ├── 📂 api/                    # API 路由
│   │   ├── 📂 auth/               # 认证 API
│   │   ├── 📂 upload/             # 上传 API
│   │   └── 📂 v1/                 # REST API v1
│   │
│   ├── globals.css                # 全局样式
│   └── page.js                    # 根页面（重定向）
│
├── 📂 components/                  # React 组件
│   ├── 📂 admin/                  # 后台组件
│   ├── 📂 client/                 # 前台组件
│   ├── 📂 common/                 # 通用组件
│   ├── 📂 motion/                 # 动画组件
│   └── 📂 ui/                     # UI 基础组件
│
├── 📂 lib/                        # 核心库
│   ├── 📂 api/                    # API 工具
│   ├── 📂 auth/                   # 认证相关
│   ├── 📂 core/                   # 核心功能
│   ├── 📂 database/               # 数据库工具
│   ├── 📂 function/               # 工具函数 (nb.pubfn)
│   ├── 📂 logging/                # 日志系统
│   ├── 📂 upload/                 # 上传工具
│   └── 📂 validation/             # 验证工具
│
├── 📂 prisma/                     # Prisma ORM
│   └── schema.prisma              # 数据库模型定义
│
├── 📂 i18n/                       # 国际化
│   ├── 📂 messages/               # 翻译文件
│   ├── config.js                  # i18n 配置
│   └── request.js                 # 请求配置
│
├── 📂 templates/                  # 开发模板
│   └── 📂 crud/                   # CRUD 模板
│
├── 📂 docs/                       # 项目文档
├── 📂 public/                     # 静态资源
├── 📂 hooks/                      # React Hooks
├── 📂 config/                     # 配置文件
└── 📂 scripts/                    # 脚本工具
```

---

## 🎯 核心目录

### `app/(admin)/` - 后台管理

```
app/(admin)/
├── admin/                          # 页面目录
│   ├── rbac/                       # RBAC 权限管理
│   │   ├── roles/page.js          # 角色管理
│   │   ├── permissions/page.js    # 权限管理
│   │   ├── menus/page.js          # 菜单管理
│   │   └── users/page.js          # 用户管理
│   │
│   ├── system/                     # 系统管理
│   │   ├── action_logs/page.js    # 操作日志
│   │   └── assets/page.js         # 资源管理
│   │
│   └── [your-module]/              # 你的模块
│       └── [resource]/page.js
│
├── actions/                        # Server Actions
│   ├── dao/                        # 数据访问对象
│   │   └── base.js                # BaseDAO
│   │
│   ├── rbac/                       # RBAC Actions
│   │   ├── crud-action.role.js
│   │   ├── crud-action.permission.js
│   │   └── crud-action.menu.js
│   │
│   └── [module]/                   # 你的模块
│       └── crud-action.[resource].js
│
├── layout.js                       # 后台布局
└── admin-styles.css               # 后台样式
```

#### 命名规范

| 类型 | 规范 | 示例 |
|:---|:---|:---|
| 页面目录 | 复数形式 | `roles/`, `users/`, `posts/` |
| Action 文件 | `crud-action.{resource}.js` | `crud-action.role.js` |
| Action 函数 | `{prefix}{Action}{Resource}Action` | `sysGetRoleListAction` |

### `app/(client)/` - 前台模块

```
app/(client)/
├── [locale]/                       # 多语言路由
│   ├── layout.js                  # 前台布局
│   ├── page.js                    # 首页
│   ├── auth/                      # 认证页面
│   │   ├── login/page.js
│   │   └── register/page.js
│   └── [your-page]/page.js
│
└── actions/                        # 前台 Actions
    ├── user-actions.js            # 用户相关
    └── [module]-actions.js
```

### `components/` - React 组件

```
components/
├── admin/                          # 后台组件
│   ├── smart-crud-page.jsx        # 🌟 万能表格
│   ├── smart-form/                # 🌟 万能表单
│   │   ├── index.js
│   │   ├── smart-form.jsx
│   │   ├── smart-modal-form.jsx
│   │   └── smart-drawer-form.jsx
│   ├── admin-layout.jsx           # 后台布局
│   ├── icon-picker.jsx            # 图标选择器
│   ├── json-editor.jsx            # JSON 编辑器
│   ├── markdown-editor.jsx        # Markdown 编辑器
│   └── uploads/                   # 上传组件
│
├── client/                         # 前台组件
│   ├── layout/                    # 布局组件
│   └── home/                      # 首页组件
│
├── common/                         # 通用组件
│   ├── LanguageSwitcher.jsx       # 语言切换
│   └── theme-provider.jsx         # 主题提供者
│
└── ui/                            # UI 基础组件 (shadcn/ui)
    ├── button.jsx
    ├── input.jsx
    └── ...
```

### `lib/` - 核心库

```
lib/
├── core/                           # 🌟 核心功能
│   ├── action-wrapper.js          # Action 包装器
│   ├── crud-helper.js             # CRUD 工厂函数
│   └── permission-naming.js       # 权限命名解析
│
├── database/                       # 数据库
│   ├── prisma.js                  # Prisma 客户端
│   └── selects.js                 # 连表查询工具
│
├── function/                       # 🌟 工具函数 (nb.pubfn)
│   ├── index.js                   # 导出入口
│   ├── array.js                   # 数组工具
│   ├── object.js                  # 对象工具
│   ├── string.js                  # 字符串工具
│   ├── time.js                    # 时间工具
│   ├── validator.js               # 验证工具
│   └── tree.js                    # 树形工具
│
├── auth/                           # 认证
│   ├── auth.js                    # Better Auth 配置
│   ├── admin-auth.js              # 后台认证
│   └── permission-auth.js         # 权限认证
│
├── api/                            # API 工具
│   ├── action-client.js           # Action 客户端
│   └── api-auth.js                # API 认证
│
└── validation/                     # 验证
    └── schema-validator.js        # Schema 验证器
```

### `prisma/` - 数据库模型

```
prisma/
└── schema.prisma                   # 数据模型定义
    │
    ├── User                       # 用户
    ├── Session                    # 会话
    ├── Account                    # OAuth 账号
    │
    ├── Role                       # 角色
    ├── Permission                 # 权限
    ├── Menu                       # 菜单
    │
    ├── Asset                      # 资源文件
    ├── ActionLog                  # 操作日志
    │
    └── [YourModel]                # 你的模型
```

---

## 📐 命名规范

### 文件命名

| 类型 | 规范 | 示例 |
|:---|:---|:---|
| 页面文件 | `page.js` | `app/(admin)/admin/roles/page.js` |
| 布局文件 | `layout.js` | `app/(admin)/layout.js` |
| Action 文件 | `crud-action.{resource}.js` | `crud-action.role.js` |
| 组件文件 | `kebab-case.jsx` | `smart-crud-page.jsx` |
| 工具文件 | `kebab-case.js` | `action-wrapper.js` |

### 函数命名

| 类型 | 规范 | 示例 |
|:---|:---|:---|
| Server Action | `{prefix}{Action}{Resource}Action` | `sysGetRoleListAction` |
| 组件 | `PascalCase` | `SmartCrudPage` |
| 工具函数 | `camelCase` | `createCrudActions` |
| 常量 | `UPPER_SNAKE_CASE` | `DEFAULT_PAGE_SIZE` |

### Action 前缀

| 前缀 | 权限级别 | 说明 |
|:---|:---|:---|
| `pub` | PUBLIC | 公开访问，无需登录 |
| `auth` | AUTH | 需要登录 |
| `sys` | SYSTEM | 需要后台权限 + RBAC 检查 |
| `_` | PRIVATE | 内部函数，不可直接调用 |

---

## 🔄 数据流向

```
┌─────────────────────────────────────────────────────────────┐
│                        前端页面                              │
│  app/(admin)/admin/roles/page.js                           │
│  - 使用 SmartCrudPage 组件                                  │
│  - 配置 fieldsConfig                                        │
│  - 传入 actions                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Server Actions                          │
│  app/(admin)/actions/rbac/crud-action.role.js              │
│  - 使用 createCrudActions 创建                              │
│  - 自动包装 wrapAction                                      │
│  - 自动权限检查和日志记录                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BaseDAO                              │
│  app/(admin)/actions/dao/base.js                           │
│  - 通用数据访问对象                                          │
│  - 处理 CRUD 操作                                           │
│  - 字段过滤、验证、Hooks                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Prisma Client                           │
│  lib/database/prisma.js                                    │
│  - 类型安全的数据库操作                                      │
│  - 自动生成的查询方法                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      PostgreSQL                             │
│  prisma/schema.prisma                                      │
│  - 数据模型定义                                             │
│  - 关系映射                                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📚 相关文档

| 文档 | 说明 |
|:---|:---|
| [整体架构](../architecture/OVERVIEW.md) | 系统架构详解 |
| [数据流设计](../architecture/DATA_FLOW.md) | 请求处理流程 |
| [命名标准](../guides/admin/NAMING_STANDARDS.md) | 详细命名规范 |

---

<div align="center">

[← 创建第一个页面](./FIRST_PAGE.md) · [整体架构 →](../architecture/OVERVIEW.md)

</div>

