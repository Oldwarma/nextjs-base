# 整体架构

<div align="center">

**深入理解 NextJS Base 的系统架构**

[架构图](#-架构图) · [核心模块](#-核心模块) · [设计理念](#-设计理念)

</div>

---

## 🎯 架构概述

NextJS Base 采用**分层架构**设计，将系统划分为清晰的层次，每层职责明确，降低耦合度。

### 核心特点

| 特点 | 说明 |
|:---|:---|
| **配置驱动** | 通过 `fieldsConfig` 配置驱动 UI 和行为 |
| **约定优于配置** | 通过命名约定自动处理权限和路由 |
| **分层解耦** | 表现层、业务层、数据层清晰分离 |
| **自动化** | 自动权限检查、日志记录、数据验证 |

---

## 🏗️ 架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                           表现层 (Presentation)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   SmartCrudPage  │  │    SmartForm     │  │   Custom Pages   │  │
│  │   万能表格组件    │  │    万能表单组件   │  │    自定义页面     │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
│           │                     │                     │             │
│           └─────────────────────┼─────────────────────┘             │
│                                 │                                    │
│                      ┌──────────▼──────────┐                        │
│                      │    fieldsConfig     │                        │
│                      │    字段配置中心      │                        │
│                      └──────────┬──────────┘                        │
│                                 │                                    │
└─────────────────────────────────┼────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           业务层 (Business)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      Server Actions                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │   │
│  │  │ sysGetList  │  │ sysCreate   │  │ sysUpdate   │   ...    │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │   │
│  │         └────────────────┼────────────────┘                  │   │
│  └──────────────────────────┼───────────────────────────────────┘   │
│                             │                                        │
│                  ┌──────────▼──────────┐                            │
│                  │     wrapAction      │                            │
│                  │   ┌─────────────┐   │                            │
│                  │   │ 认证检查    │   │                            │
│                  │   │ 权限验证    │   │                            │
│                  │   │ 日志记录    │   │                            │
│                  │   └─────────────┘   │                            │
│                  └──────────┬──────────┘                            │
│                             │                                        │
│                  ┌──────────▼──────────┐                            │
│                  │  createCrudActions  │                            │
│                  │    CRUD 工厂函数    │                            │
│                  └──────────┬──────────┘                            │
│                             │                                        │
└─────────────────────────────┼────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           数据层 (Data Access)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                         BaseDAO                               │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │   │
│  │  │ 字段过滤    │  │ 数据验证    │  │ Hooks 执行  │          │   │
│  │  │ 搜索构建    │  │ 软删除处理  │  │ 数据转换    │          │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                        │
│                  ┌──────────▼──────────┐                            │
│                  │    Prisma Client    │                            │
│                  │    ORM 数据库客户端  │                            │
│                  └──────────┬──────────┘                            │
│                             │                                        │
└─────────────────────────────┼────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           存储层 (Storage)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   PostgreSQL     │  │   Cloudflare R2  │  │     Redis        │  │
│  │   关系型数据库    │  │   对象存储        │  │   缓存（可选）    │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📦 核心模块

### 1. SmartCrudPage - 万能表格

> 配置驱动的数据表格组件，一个组件实现完整的 CRUD 功能

```javascript
<SmartCrudPage
  title="数据管理"
  fieldsConfig={fieldsConfig}    // 字段配置
  actions={actions}              // Server Actions
  enableCreate={true}            // 启用创建
  enableEdit={true}              // 启用编辑
  enableDelete={true}            // 启用删除
/>
```

**核心功能**：
- 📋 数据列表（分页、排序、筛选）
- 🔍 高级搜索（多种搜索模式）
- ➕ 新增记录（表单自动生成）
- ✏️ 编辑记录（表单自动回填）
- 🗑️ 删除记录（确认弹窗）
- 👁️ 查看详情（抽屉展示）

### 2. fieldsConfig - 字段配置

> 统一的字段配置，驱动表格、表单、搜索、详情

```javascript
const fieldsConfig = [
  {
    key: 'name',           // 字段名
    title: '名称',          // 显示名称
    type: 'text',          // 字段类型
    table: { ... },        // 表格配置
    form: { ... },         // 表单配置
    search: { ... },       // 搜索配置
  }
]
```

**支持的类型**：
| 类型 | 说明 | 表格 | 表单 | 搜索 |
|:---|:---|:---:|:---:|:---:|
| `text` | 文本 | ✅ | ✅ | ✅ |
| `textarea` | 多行文本 | ✅ | ✅ | ✅ |
| `number` | 数字 | ✅ | ✅ | ✅ |
| `select` | 下拉选择 | ✅ | ✅ | ✅ |
| `switch` | 开关 | ✅ | ✅ | ✅ |
| `date` | 日期 | ✅ | ✅ | ✅ |
| `datetime` | 日期时间 | ✅ | ✅ | ✅ |
| `tree-select` | 树形选择 | ✅ | ✅ | ✅ |
| `image` | 图片 | ✅ | ✅ | ❌ |
| `markdown` | Markdown | ✅ | ✅ | ❌ |

### 3. wrapAction - Action 包装器

> 自动处理认证、授权、日志的 Action 包装器

```javascript
export const sysGetRoleListAction = wrapAction(
  'sysGetRoleList',      // Action 名称（决定权限级别）
  async (params, ctx) => {
    // ctx 包含 userId, user, isAdmin
    return await dao.getList(params)
  }
)
```

**自动处理**：
| 功能 | 说明 |
|:---|:---|
| 认证检查 | 根据前缀自动检查登录状态 |
| 权限验证 | `sys` 前缀自动检查 RBAC 权限 |
| 日志记录 | 自动记录操作日志 |
| 错误处理 | 统一的错误响应格式 |

### 4. createCrudActions - CRUD 工厂

> 快速创建标准 CRUD Actions

```javascript
const { getList, create, update, delete: del } = createCrudActions({
  modelName: 'role',
  fields: {
    creatable: ['name', 'remark'],
    updatable: ['name', 'remark'],
    searchable: ['name'],
  },
  validation: { ... },
  hooks: { ... },
})
```

**生成的 Actions**：
- `sysGet{Resource}ListAction` - 获取列表
- `sysGet{Resource}DetailAction` - 获取详情
- `sysCreate{Resource}Action` - 创建记录
- `sysUpdate{Resource}Action` - 更新记录
- `sysDelete{Resource}Action` - 删除记录
- `sysBatchUpdate{Resource}Action` - 批量更新
- `sysBatchDelete{Resource}Action` - 批量删除

### 5. BaseDAO - 数据访问对象

> 通用的数据访问层，封装 Prisma 操作

```javascript
const dao = new BaseDAO({
  modelName: 'role',
  primaryKey: 'id',
  softDelete: true,
  fields: { ... },
  validation: { ... },
  hooks: { ... },
})
```

**核心功能**：
| 方法 | 说明 |
|:---|:---|
| `getList()` | 分页查询、搜索、排序 |
| `getDetail()` | 单条查询、关联加载 |
| `create()` | 创建记录、验证、Hooks |
| `update()` | 更新记录、字段过滤 |
| `delete()` | 删除/软删除 |
| `batchUpdate()` | 批量更新 |
| `batchDelete()` | 批量删除 |

---

## 💡 设计理念

### 1. 配置优于代码

传统方式需要编写大量重复代码：

```javascript
// ❌ 传统方式 - 需要分别编写表格列、表单字段、搜索配置
const columns = [...]
const formFields = [...]
const searchFields = [...]
```

NextJS Base 使用统一配置：

```javascript
// ✅ 配置驱动 - 一份配置驱动所有 UI
const fieldsConfig = [
  {
    key: 'name',
    title: '名称',
    type: 'text',
    table: { width: 200 },
    form: { required: true },
    search: { enabled: true },
  }
]
```

### 2. 约定优于配置

通过命名约定自动处理权限：

```javascript
// Action 名称决定权限级别
sysGetRoleList    // sys 前缀 → 需要后台权限 + RBAC 检查
authGetUserInfo   // auth 前缀 → 需要登录
pubGetConfig      // pub 前缀 → 公开访问
```

### 3. 分层解耦

每层只关注自己的职责：

| 层级 | 职责 | 不关心 |
|:---|:---|:---|
| 表现层 | UI 渲染、用户交互 | 数据如何获取 |
| 业务层 | 业务逻辑、权限控制 | 数据如何存储 |
| 数据层 | 数据访问、验证 | 如何展示数据 |

### 4. 可扩展性

每个模块都可以扩展：

```javascript
// 扩展 CRUD Actions
const { getList, create, ...rest } = createCrudActions(config)

// 添加自定义 Action
export const customAction = wrapAction('sysCustomAction', async (params) => {
  // 自定义逻辑
})
```

---

## 📚 相关文档

| 文档 | 说明 |
|:---|:---|
| [数据流设计](./DATA_FLOW.md) | 请求处理流程详解 |
| [权限模型](./PERMISSION_MODEL.md) | RBAC 权限设计 |
| [SmartCrudPage](../guides/admin/SMART_CRUD.md) | 万能表格详细文档 |
| [Server Actions](../guides/admin/SERVER_ACTIONS.md) | Actions 开发指南 |

---

<div align="center">

[← 项目结构](../getting-started/PROJECT_STRUCTURE.md) · [数据流设计 →](./DATA_FLOW.md)

</div>

