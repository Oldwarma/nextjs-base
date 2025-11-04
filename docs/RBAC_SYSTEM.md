# RBAC 权限管理系统

> **最后更新**: 2025-11-04  
> **版本**: v2.0.0  
> **统一字段命名规范**: 已全面实施 UUID 主键和统一字段名

---

## 📋 目录

1. [系统概述](#系统概述)
2. [核心概念](#核心概念)
3. [数据结构](#数据结构)
4. [字段命名规范](#字段命名规范)
5. [连表查询机制](#连表查询机制)
6. [功能模块](#功能模块)
7. [使用指南](#使用指南)
8. [API 文档](#api-文档)
9. [最佳实践](#最佳实践)
10. [常见问题](#常见问题)

---

## 系统概述

本项目实现了一个完整的基于角色的访问控制（RBAC）系统，具有以下特性：

### ✨ 核心特性

- ✅ **UUID 主键体系**：所有集合使用 UUID 作为主键（`id` 字段），兼容 PostgreSQL 和 CloudflareD1
- ✅ **统一字段命名**：`id`、`name`、`parent_id`、`sort`、`remark`、`enable` 标准化
- ✅ **用户-角色多对多**：一个用户可以拥有多个 RBAC 角色（`roles` 数组）
- ✅ **角色-权限多对多**：一个角色可以绑定多个权限（`permission` 数组）
- ✅ **角色-菜单多对多**：一个角色可以访问多个菜单（`menu` 数组）
- ✅ **权限树形结构**：支持多层级权限，父权限自动包含子权限
- ✅ **菜单树形结构**：支持多层级菜单，动态渲染后台导航
- ✅ **Actions 路径配置**：支持完整 URL 和通配符（`*`、`**`）
- ✅ **权限分类**：Create、Delete、Update、Read、Special、Unclassified（0-5）
- ✅ **权限级别**：Bullet、Bomb、Grenade、Nuclear、Other（0-4）
- ✅ **自动连表查询**：通过 `foreignDB` 配置，自动关联显示名称，提升可读性

### 🔑 与 Better Auth 集成

- Better Auth 使用 `role` 字段存储**单一角色**（`admin` / `user`）
- RBAC 使用 `roles` 字段存储**角色 UUID 数组**
- 两者共存，互不冲突

---

## 核心概念

### 1. 用户（User）

- 用户是系统的基本实体
- **Better Auth 字段**：
  - `id`：UUID，Better Auth 主键
  - `role`：单一字符串（`admin` / `user`），Better Auth 的基础角色
- **RBAC 字段**：
  - `roles`：UUID 数组，RBAC 角色 ID 列表
- 用户继承所有 `roles` 中角色的权限和菜单

### 2. 角色（Role）

- 角色是权限和菜单的集合
- **主键**：`id`（UUID）
- **核心字段**：
  - `name`：角色名称（唯一标识）
  - `permission`：权限 UUID 数组
  - `menu`：菜单 UUID 数组
  - `enable`：是否启用
  - `sort`：排序值
  - `remark`：备注
- `admin` 角色是特殊角色，拥有所有权限

### 3. 权限（Permission）

- 权限支持树形结构（通过 `parent_id`）
- **主键**：`id`（UUID）
- **核心字段**：
  - `name`：权限名称
  - `parent_id`：父权限 UUID（为 `null` 表示根权限）
  - `actions`：可访问的 action 路径数组（字符串）
  - `crud_category`：CRUD 分类（0-5）
  - `level`：权限级别（0-4）
  - `enable`：是否启用
  - `sort`：排序值
  - `remark`：备注
- 支持通配符匹配：
  - `*`：匹配单层路径（如 `/admin/actions/user/*`）
  - `**`：匹配任意层级（如 `/admin/actions/**`）

### 4. 菜单（Menu）

- 菜单控制页面访问权限
- **主键**：`id`（UUID）
- **核心字段**：
  - `name`：菜单名称
  - `parent_id`：父菜单 UUID（为 `null` 表示根菜单）
  - `url`：菜单链接（支持 http 开头的外部链接）
  - `icon`：图标名称
  - `enable`：是否启用
  - `hidden`：是否隐藏
  - `sort`：排序值
  - `remark`：备注
- 菜单支持树形结构，自动构建后台导航

---

## 数据结构

### 用户表（users）

```javascript
{
  // Better Auth 字段
  id: String,                // UUID，Better Auth 主键
  name: String,              // 用户名
  email: String,             // 邮箱
  role: String,              // Better Auth 单一角色 ('admin' | 'user')
  
  // RBAC 字段
  roles: Array<String>,      // RBAC 角色 UUID 数组
  
  // MongoDB 自动生成（兼容性）
  _id: ObjectId,             // MongoDB 自动生成，不作为主键使用
  
  // 其他字段
  image: String,
  emailVerified: Boolean,
  banned: Boolean,
  credits: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### 角色表（roles）

```javascript
{
  id: String,                // UUID，主键
  name: String,              // 角色名称（唯一）
  remark: String,            // 备注
  enable: Boolean,           // 是否启用
  permission: Array<String>, // 权限 UUID 数组
  menu: Array<String>,       // 菜单 UUID 数组
  sort: Number,              // 排序值
  createdAt: Date,
  updatedAt: Date,
  _id: ObjectId              // MongoDB 自动生成（兼容性）
}
```

### 权限表（permissions）

```javascript
{
  id: String,                // UUID，主键
  name: String,              // 权限名称
  parent_id: String | null,  // 父权限 UUID（null 表示根权限）
  remark: String,            // 备注
  enable: Boolean,           // 是否启用
  sort: Number,              // 排序值
  crud_category: Number,     // CRUD 分类（0-5）
  level: Number,             // 权限级别（0-4）
  actions: Array<String>,    // action 路径数组（支持通配符）
  createdAt: Date,
  updatedAt: Date,
  _id: ObjectId              // MongoDB 自动生成（兼容性）
}
```

### 菜单表（menus）

```javascript
{
  id: String,                // UUID，主键
  name: String,              // 菜单名称
  parent_id: String | null,  // 父菜单 UUID（null 表示根菜单）
  url: String,               // 菜单链接
  icon: String,              // 图标名称
  enable: Boolean,           // 是否启用
  hidden: Boolean,           // 是否隐藏
  sort: Number,              // 排序值
  remark: String,            // 备注
  createdAt: Date,
  updatedAt: Date,
  _id: ObjectId              // MongoDB 自动生成（兼容性）
}
```

---

## 字段命名规范

### 🎯 统一命名标准

本系统已全面实施统一的字段命名规范，确保数据库、后端、前端的一致性：

| 用途 | 字段名 | 类型 | 说明 |
|------|--------|------|------|
| **主键** | `id` | String (UUID) | 所有集合的主键，使用 UUID v4 |
| **名称** | `name` | String | 实体名称（用户名、角色名、权限名、菜单名） |
| **父级引用** | `parent_id` | String (UUID) | 树形结构的父级 ID |
| **排序** | `sort` | Number | 排序值，越小越靠前 |
| **备注** | `remark` | String | 备注信息 |
| **启用状态** | `enable` | Boolean | 是否启用（true/false） |

### ❌ 废弃的字段名

以下字段名已废弃，不应再使用：

- `role_id`、`permission_id`、`menu_id` → 统一为 `id`
- `role_name`、`permission_name` → 统一为 `name`
- `parentId` → 改为 `parent_id`
- `sortOrder` → 改为 `sort`
- `enabled` → 改为 `enable`
- `comment` → 改为 `remark`
- `key` → 废弃，直接使用 `id`
- `role_ids`、`ids` → 改为 `roles`（用户的角色字段）

### 🔄 MongoDB `_id` 的处理

- MongoDB 会自动生成 `_id` 字段（ObjectId 类型）
- 系统**不使用** `_id` 作为主键，仅作为兼容性字段保留
- 所有关联关系使用 `id`（UUID）字段
- BaseDAO 和 SmartCrudPage 默认使用 `id` 作为 `rowKey`

---

## 连表查询机制

### 概述

为了提升数据可读性，系统实现了统一的连表查询机制，将 UUID 自动转换为可读名称。

### 原理

- **后端配置**：在 CRUD Config 的 `query.foreignDB` 中声明连表规则
- **自动执行**：BaseDAO 的 `getList` 方法检测到 `foreignDB` 配置后，自动调用 `selects` 方法
- **数据增强**：返回的数据包含原始 UUID 数组 + 连表结果对象数组
- **前端渲染**：前端优先使用连表结果渲染，fallback 到原始 UUID

### foreignDB 配置格式

```javascript
// CRUD Config 文件（如 role-crud.config.js）
export const roleCrudConfig = {
  collectionName: 'roles',
  primaryKey: 'id',
  query: {
    defaultSort: { name: 1 },
    defaultPageSize: 20,
    
    // 连表配置
    foreignDB: [
      {
        dbName: 'permissions',       // 目标表名
        localKey: 'permission',      // 本地字段名（UUID 数组）
        foreignKey: 'id',            // 目标表主键
        as: 'permissionList',        // 结果字段名
        fieldJson: { id: 1, name: 1 }, // 只返回需要的字段
      },
      {
        dbName: 'menus',
        localKey: 'menu',
        foreignKey: 'id',
        as: 'menuList',
        fieldJson: { id: 1, name: 1 },
      },
    ],
  },
};
```

### 返回数据格式

```javascript
// 原始数据（数据库中）
{
  id: "role-uuid",
  name: "超级管理员",
  permission: ["perm-uuid-1", "perm-uuid-2"],  // 原始 UUID 数组
  menu: ["menu-uuid-1", "menu-uuid-2"]
}

// 连表后的数据（返回给前端）
{
  id: "role-uuid",
  name: "超级管理员",
  permission: ["perm-uuid-1", "perm-uuid-2"],  // 保留原始字段
  menu: ["menu-uuid-1", "menu-uuid-2"],
  permissionList: [                             // 连表结果（新增）
    { id: "perm-uuid-1", name: "系统管理" },
    { id: "perm-uuid-2", name: "用户管理" }
  ],
  menuList: [                                   // 连表结果（新增）
    { id: "menu-uuid-1", name: "权限管理" },
    { id: "menu-uuid-2", name: "菜单管理" }
  ]
}
```

### 前端渲染

```javascript
// 字段配置（roles/page.js）
{
  key: 'permission',
  title: 'Permissions',
  detail: {
    render: (value, record) => {
      // 优先使用连表数据，fallback 到原始 UUID
      const permissions = record.permissionList || value || [];
      
      if (!Array.isArray(permissions) || permissions.length === 0) {
        return <span style={{ color: '#999' }}>No permissions assigned</span>;
      }
      
      return (
        <Space wrap>
          {permissions.map((item, index) => {
            // 如果是对象（连表数据），取 name；否则显示原值（UUID）
            const displayText = item?.name || item;
            const key = item?.id || item;
            return (
              <Tag key={key || index} color='blue'>
                {displayText}
              </Tag>
            );
          })}
        </Space>
      );
    }
  }
}
```

### 已实施的连表配置

| 页面 | 字段 | 连表目标 | 结果字段 | 状态 |
|------|------|---------|---------|------|
| **Roles** | `permission` | `permissions` | `permissionList` | ✅ |
| **Roles** | `menu` | `menus` | `menuList` | ✅ |
| **Users** | `roles` | `roles` | `roleList` | ✅ |
| **Credits** | `userId` | `users` | `userInfo` | ✅ |
| **Permissions** | `parent_id` | `permissions` (自连) | `parentInfo` | ✅ |

---

## 功能模块

### 1. 数据访问层（SysDAO）

**文件位置**：`app/(admin)/actions/dao/sys.js`

**核心方法**：

#### 角色管理
```javascript
// 查询角色（带连表数据）
findRoleByIdWithNames(roleId)

// 查询多个角色
findRolesByIds(roleIds)

// 角色绑定权限
roleBindPermissions({ roleId, permissions, reset })

// 角色绑定菜单
roleBindMenus({ roleId, menus, reset })
```

#### 权限管理
```javascript
// 获取权限树
getPermissionTree({ pageIndex, pageSize, filters })

// 递归获取所有子权限 ID
getAllChildPermissionIds(permissionId)

// 获取权限的 actions 路径
getActionsByPermissionIds(permissionIds)

// 构建权限树（带标签）
buildPermissionTree(permissions)
addLabelsToTree(tree)
```

#### 菜单管理
```javascript
// 查询菜单（通过 ID）
findMenusByIds(menuIds)

// 获取菜单树（用于选择器）
getMenuTreeForSelect()

// 构建菜单树（从扁平数据）
buildMenuTreeFromFlat(menus, parent_id = null)
addLabelsToMenuTree(tree)
```

#### 用户-角色关联
```javascript
// 用户绑定角色
bindUserRoles({ userId, roles, reset })

// 获取用户的角色 UUID 数组
getUserRoleIds(userId)

// 获取用户的所有权限 UUID
getUserPermissionIds(userId)

// 获取用户的所有菜单
getUserMenus(userId)
```

#### 权限验证
```javascript
// 检查用户是否有权限
checkUserHasPermission(userId, permissionId)

// 检查用户是否可访问 action
checkUserHasActionPermission(userId, actionPath)
```

**重要说明**：
- 所有方法的参数名和返回字段名都遵循统一命名规范
- `roles` 参数指的是角色 UUID 数组
- `parent_id` 用于树形结构的父级引用
- 所有 ID 字段都是 UUID 字符串

### 2. Server Actions

#### 角色管理（admin-roles.js）

```javascript
// 获取角色列表（自动连表）
getRoleListAction({ pageIndex, pageSize, search, filters, sortJson })

// 获取角色详情（带权限和菜单名称）
getRoleDetailAction(roleId)

// 获取角色列表（用于选择器）
getRoleListForSelectAction({ withLabel })

// CRUD 操作
createRoleAction(data)
updateRoleAction(roleId, data)
deleteRoleAction(roleId)
batchUpdateRolesAction(roles, updates)
batchDeleteRolesAction(roles)

// 权限和菜单分配
roleBindPermissionsAction(roleId, permissions, reset)
roleBindMenusAction(roleId, menus, reset)
getRolePermissionsAction(roleId)
getRoleMenusAction(roleId)
```

#### 权限管理（admin-permissions.js）

```javascript
// 获取权限列表（自动连表父权限）
getPermissionListAction({ pageIndex, pageSize, search, filters, sortJson })

// 获取权限树（用于树形选择器）
getPermissionTreeForSelectAction({ withLabel })

// CRUD 操作
createPermissionAction(data)
updatePermissionAction(permissionId, data)
deletePermissionAction(permissionId)
batchUpdatePermissionsAction(permissions, updates)
batchDeletePermissionsAction(permissions)
```

#### 菜单管理（admin-menus.js）

```javascript
// 获取菜单列表（树形）
getMenuListAction()

// 获取菜单树（用于选择器）
getMenuTreeForSelectorAction()

// CRUD 操作
createMenuAction(data)
updateMenuAction(menuId, data)
deleteMenuAction(menuId)
```

#### 用户管理扩展（admin-users.js）

```javascript
// 用户角色绑定
bindUserRolesAction(userId, roles, reset)
getUserRolesAction(userId)
batchBindUserRolesAction(userIds, roles, reset)
```

**参数说明**：
- `roles`：角色 UUID 数组（不是 `roleIds`）
- `permissions`：权限 UUID 数组
- `menus`：菜单 UUID 数组
- `sortJson`：排序对象（MongoDB 原生格式，如 `{ name: 1, sort: -1 }`）

### 3. CRUD 配置文件

#### role-crud.config.js

```javascript
export const roleCrudConfig = {
  collectionName: 'roles',
  primaryKey: 'id',                // UUID 主键
  
  fields: {
    creatable: ['name', 'remark', 'enable', 'sort'],
    updatable: ['name', 'remark', 'enable', 'sort'],
    searchable: ['name', 'remark'],
  },
  
  query: {
    defaultSort: { name: 1 },
    defaultPageSize: 20,
    
    // 连表配置
    foreignDB: [
      {
        dbName: 'permissions',
        localKey: 'permission',
        foreignKey: 'id',
        as: 'permissionList',
        fieldJson: { id: 1, name: 1 },
      },
      {
        dbName: 'menus',
        localKey: 'menu',
        foreignKey: 'id',
        as: 'menuList',
        fieldJson: { id: 1, name: 1 },
      },
    ],
  },
  
  validation: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 50,
    },
  },
  
  transforms: {
    input: (data) => {
      if (data.name) data.name = data.name.trim();
      return data;
    },
    output: (data) => {
      if (data.enable === undefined) data.enable = true;
      if (!data.permission || !Array.isArray(data.permission)) {
        data.permission = [];
      }
      if (!data.menu || !Array.isArray(data.menu)) {
        data.menu = [];
      }
      return data;
    },
  },
};
```

#### user-crud.config.js

```javascript
export const userCrudConfig = {
  collectionName: 'users',
  primaryKey: 'id',                // Better Auth 的 UUID 主键
  
  query: {
    defaultSort: { createdAt: -1 },
    
    // 连表配置
    foreignDB: [
      {
        dbName: 'roles',
        localKey: 'roles',           // users.roles 是 RBAC 角色 UUID 数组
        foreignKey: 'id',
        as: 'roleList',
        fieldJson: { id: 1, name: 1 },
      },
    ],
  },
};
```

#### permission-crud.config.js

```javascript
export const permissionCrudConfig = {
  collectionName: 'permissions',
  primaryKey: 'id',
  
  fields: {
    creatable: ['name', 'parent_id', 'remark', 'enable', 'sort', 'crud_category', 'level', 'actions'],
    updatable: ['name', 'parent_id', 'remark', 'enable', 'sort', 'crud_category', 'level', 'actions'],
  },
  
  query: {
    defaultSort: { sort: 1, name: 1 },
    
    // 自连表配置（查询父权限）
    foreignDB: [
      {
        dbName: 'permissions',
        localKey: 'parent_id',
        foreignKey: 'id',
        as: 'parentInfo',
        limit: 1,                    // 一对一关系
        fieldJson: { id: 1, name: 1 },
      },
    ],
  },
};
```

#### credit-transaction-crud.config.js

```javascript
export const creditTransactionCrudConfig = {
  collectionName: 'credit_transactions',
  primaryKey: '_id',               // 积分交易使用 MongoDB _id
  
  query: {
    defaultSort: { createdAt: -1 },
    
    // 连表配置（查询用户信息）
    foreignDB: [
      {
        dbName: 'users',
        localKey: 'userId',
        foreignKey: 'id',            // Better Auth 主键
        as: 'userInfo',
        limit: 1,
        fieldJson: { id: 1, name: 1, email: 1, image: 1 },
      },
    ],
  },
};
```

---

## 使用指南

### 1. 创建权限体系

**步骤**：

1. 访问 `/admin/permissions`
2. 点击「Create」创建顶级权限组（如 `系统管理`）
3. 为每个权限组创建子权限（如 `用户管理`、`角色管理`）
4. 为叶子权限配置 `actions` 路径：
   - 完整路径：`/admin/actions/user/create`
   - 单层通配：`/admin/actions/user/*`
   - 多层通配：`/admin/actions/user/**`

**示例权限树**：

```
系统管理 (sys-manage)
├── 用户管理 (sys-manage-users)
│   └── actions: ["/admin/actions/user/*"]
├── 角色管理 (sys-manage-roles)
│   └── actions: ["/admin/actions/role/*"]
└── 权限管理 (sys-manage-permissions)
    └── actions: ["/admin/actions/permission/*"]
```

### 2. 创建菜单

**步骤**：

1. 访问 `/admin/menus`
2. 创建顶级菜单（如 `权限管理`）
3. 为顶级菜单创建子菜单（如 `用户管理`、`角色管理`）
4. 配置菜单属性：
   - `name`：菜单名称
   - `url`：页面路径（如 `/admin/users`）
   - `icon`：图标名称（如 `UserOutlined`）
   - `parent_id`：父菜单 UUID
   - `enable`：是否启用
   - `hidden`：是否隐藏
   - `sort`：排序值

**示例菜单树**：

```
权限管理
├── 用户管理 (/admin/users)
├── 角色管理 (/admin/roles)
└── 权限管理 (/admin/permissions)

系统设置
├── 菜单管理 (/admin/menus)
└── 管理日志 (/admin/logs)

外部链接
└── 帮助文档 (https://docs.example.com) 🔗
```

**外部链接说明**：
- 如果 `url` 以 `http://` 或 `https://` 开头，会显示链接图标
- 点击时会在新标签页打开

### 3. 创建角色

**步骤**：

1. 访问 `/admin/roles`
2. 点击「Create」创建新角色
3. 填写角色信息：
   - `name`：角色名称（如 `超级管理员`）
   - `remark`：角色描述
   - `enable`：是否启用
   - `sort`：排序值
4. 保存后，点击「Assign Permissions」分配权限
5. 点击「Assign Menus」分配菜单

**示例角色**：

- **超级管理员**：拥有所有权限和菜单
- **普通管理员**：拥有用户管理、内容管理权限
- **只读用户**：只有查看权限

### 4. 为用户分配角色

**步骤**：

1. 访问 `/admin/users`
2. 找到目标用户
3. 点击「Assign Roles」按钮
4. 在弹窗中勾选需要分配的角色
5. 点击「OK」保存

**验证**：
- 点击「View Details」查看用户详情
- 确认「RBAC Roles」字段显示的是角色名称（如 `超级管理员`），而不是 UUID

### 5. 创建新的管理页面（完整示例）

假设要创建一个「文章管理」页面，步骤如下：

#### Step 1: 创建 CRUD Config

创建文件 `app/(admin)/actions/configs/article-crud.config.js`：

```javascript
export const articleCrudConfig = {
  collectionName: 'articles',
  logCategory: 'admin/articles',
  primaryKey: 'id',                // UUID 主键
  
  fields: {
    creatable: ['title', 'content', 'authorId', 'status', 'enable'],
    updatable: ['title', 'content', 'status', 'enable'],
    searchable: ['title', 'content'],
  },
  
  query: {
    defaultSort: { createdAt: -1 },
    defaultPageSize: 20,
    
    // 连表配置：查询作者信息
    foreignDB: [
      {
        dbName: 'users',
        localKey: 'authorId',
        foreignKey: 'id',
        as: 'authorInfo',
        limit: 1,
        fieldJson: { id: 1, name: 1, email: 1, image: 1 },
      },
    ],
  },
  
  validation: {
    title: {
      required: true,
      minLength: 5,
      maxLength: 200,
    },
    content: {
      required: true,
      minLength: 10,
    },
  },
  
  transforms: {
    input: (data) => {
      if (data.title) data.title = data.title.trim();
      return data;
    },
    output: (data) => {
      if (data.enable === undefined) data.enable = true;
      if (data.status === undefined) data.status = 'draft';
      return data;
    },
  },
  
  softDelete: false,
};
```

#### Step 2: 创建 Server Actions

创建文件 `app/(admin)/actions/admin-articles.js`：

```javascript
'use server';

import { checkAdminAction } from '@/app/(admin)/actions/admin-auth';
import { BaseDAO } from '@/app/(admin)/actions/dao/base';
import { articleCrudConfig } from '@/app/(admin)/actions/configs/article-crud.config';

const articleCrud = new BaseDAO(articleCrudConfig);

export async function getArticleListAction(params) {
  return await articleCrud.getList(params);
}

export async function createArticleAction(data) {
  return await articleCrud.create(data);
}

export async function updateArticleAction(id, data) {
  return await articleCrud.update(id, data);
}

export async function deleteArticleAction(id) {
  return await articleCrud.delete(id);
}

export async function batchUpdateArticlesAction(ids, updates) {
  return await articleCrud.batchUpdate(ids, updates);
}

export async function batchDeleteArticlesAction(ids) {
  return await articleCrud.batchDelete(ids);
}
```

#### Step 3: 创建前端页面

创建文件 `app/(admin)/admin/articles/page.js`：

```javascript
'use client';

import dynamic from 'next/dynamic';
import { Tag, Avatar, Space } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const SmartCrudPage = dynamic(() => import('@/components/admin/smart-crud-page'), {
  ssr: false,
});

import {
  getArticleListAction as getList,
  createArticleAction as create,
  updateArticleAction as update,
  deleteArticleAction as deleteItem,
  batchUpdateArticlesAction as batchUpdate,
  batchDeleteArticlesAction as batchDelete,
} from '@/app/(admin)/actions/admin-articles';

export default function ArticlesManagementPage() {
  const fieldsConfig = [
    // UUID 主键（自动生成）
    {
      key: 'id',
      title: 'ID',
      table: false,
      form: false,
      search: false,
    },
    
    // 标题
    {
      key: 'title',
      title: 'Title',
      form: {
        required: true,
        placeholder: 'Enter article title',
      },
      search: {
        enabled: true,
        mode: 'like',
      },
    },
    
    // 内容
    {
      key: 'content',
      title: 'Content',
      type: 'textarea',
      table: false,
      form: {
        required: true,
        placeholder: 'Enter article content',
        props: {
          fieldProps: { rows: 6 },
        },
      },
    },
    
    // 作者（连表显示）
    {
      key: 'authorId',
      title: 'Author',
      table: {
        width: 200,
        render: (value, record) => {
          const author = record.authorInfo;
          if (!author) {
            return <span style={{ color: '#999' }}>{value}</span>;
          }
          return (
            <Space>
              <Avatar src={author.image} size='small' icon={<UserOutlined />}>
                {author.name?.[0]}
              </Avatar>
              <div>
                <div style={{ fontWeight: 500 }}>{author.name}</div>
                <div style={{ fontSize: 12, color: '#999' }}>{author.email}</div>
              </div>
            </Space>
          );
        },
      },
      detail: {
        render: (value, record) => {
          const author = record.authorInfo;
          return author ? `${author.name} (${author.email})` : value;
        },
      },
      form: false,
      search: false,
    },
    
    // 状态
    {
      key: 'status',
      title: 'Status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft', color: 'default' },
        { label: 'Published', value: 'published', color: 'green' },
        { label: 'Archived', value: 'archived', color: 'orange' },
      ],
      table: {
        width: 120,
        render: (value) => {
          const colorMap = {
            draft: 'default',
            published: 'green',
            archived: 'orange',
          };
          return <Tag color={colorMap[value]}>{value}</Tag>;
        },
      },
      search: {
        enabled: true,
        mode: 'exact',
      },
    },
    
    // 启用状态
    {
      key: 'enable',
      title: 'Enabled',
      type: 'switch',
      table: {
        width: 100,
      },
      form: {
        initialValue: true,
      },
    },
  ];

  return (
    <SmartCrudPage
      title='Articles Management'
      description='Manage articles with author information'
      fieldsConfig={fieldsConfig}
      api={{
        getList,
        create,
        update,
        delete: deleteItem,
        batchUpdate,
        batchDelete,
      }}
      rowKey='id'                    // UUID 主键
      enableBatchSelect={true}
      enableExport={true}
      enableRefresh={true}
    />
  );
}
```

#### Step 4: 添加菜单

1. 访问 `/admin/menus`
2. 创建菜单：
   - `name`: 文章管理
   - `url`: `/admin/articles`
   - `icon`: `FileTextOutlined`
   - `parent_id`: 选择父菜单（如「内容管理」）
   - `enable`: true
   - `sort`: 10

#### Step 5: 创建权限并分配给角色

1. 访问 `/admin/permissions`
2. 创建权限：
   - `name`: 文章管理
   - `parent_id`: 选择父权限（如「内容管理」）
   - `actions`: `["/admin/actions/article/*"]`
3. 访问 `/admin/roles`
4. 为需要的角色分配此权限

**完成！** 现在你已经创建了一个完整的管理页面，具备：
- ✅ UUID 主键
- ✅ 自动连表显示作者信息
- ✅ CRUD 操作
- ✅ 搜索和筛选
- ✅ 权限控制
- ✅ 批量操作

---

## API 文档

### 通配符匹配规则

权限的 `actions` 字段支持通配符，匹配规则如下：

| 模式 | 说明 | 示例 | 匹配 | 不匹配 |
|------|------|------|------|--------|
| `/admin/actions/user/create` | 精确匹配 | 完整路径 | `/admin/actions/user/create` | 其他路径 |
| `/admin/actions/user/*` | 单层通配 | user 下的所有直接子路径 | `/admin/actions/user/create`<br>`/admin/actions/user/update` | `/admin/actions/user/role/assign` |
| `/admin/actions/**` | 多层通配 | admin/actions 下的所有路径 | `/admin/actions/user/create`<br>`/admin/actions/order/list`<br>`/admin/actions/user/role/assign` | `/api/users` |

### CRUD 分类

| 值 | 名称 | 说明 |
|----|------|------|
| 0 | Unclassified | 未分类 |
| 1 | Create | 创建操作 |
| 2 | Delete | 删除操作 |
| 3 | Update | 更新操作 |
| 4 | Read | 读取/查询操作 |
| 5 | Special | 特殊操作（如导出、导入） |

### 权限级别

| 值 | 名称 | 说明 | 建议用途 |
|----|------|------|----------|
| 0 | Other | 其他 | 默认级别 |
| 1 | Bullet | 子弹级 | 低风险操作（查看、列表） |
| 2 | Bomb | 炸弹级 | 中风险操作（创建、更新） |
| 3 | Grenade | 榴弹级 | 高风险操作（删除、禁用） |
| 4 | Nuclear | 核弹级 | 极高风险操作（批量删除、系统配置） |

---

## 最佳实践

### 1. 字段命名

#### ✅ 推荐

```javascript
// CRUD Config
{
  collectionName: 'articles',
  primaryKey: 'id',              // UUID 主键
  fields: {
    creatable: ['name', 'parent_id', 'sort', 'remark', 'enable'],
  }
}

// 数据库文档
{
  id: "uuid-string",             // 主键
  name: "文章标题",
  parent_id: "uuid-string",      // 父级引用
  sort: 10,                      // 排序
  remark: "备注信息",
  enable: true                   // 启用状态
}
```

#### ❌ 不推荐

```javascript
// ❌ 使用旧的字段名
{
  article_id: "uuid",            // 应该用 id
  article_name: "文章标题",      // 应该用 name
  parentId: "uuid",              // 应该用 parent_id
  sortOrder: 10,                 // 应该用 sort
  comment: "备注",               // 应该用 remark
  enabled: true                  // 应该用 enable
}
```

### 2. 连表查询

#### ✅ 推荐：使用 foreignDB 配置

```javascript
// CRUD Config
query: {
  foreignDB: [
    {
      dbName: 'users',
      localKey: 'authorId',
      foreignKey: 'id',
      as: 'authorInfo',
      limit: 1,
      fieldJson: { id: 1, name: 1, email: 1 },
    },
  ],
}

// 前端渲染
detail: {
  render: (value, record) => {
    const author = record.authorInfo;
    return author ? author.name : value;
  }
}
```

#### ❌ 不推荐：手动循环查询

```javascript
// ❌ N+1 查询问题
const articles = await getArticles();
for (const article of articles) {
  const author = await getUser(article.authorId);
  article.authorName = author.name;
}
```

### 3. 权限设计

#### ✅ 推荐：分层设计

```
系统管理 (sys-manage)
├── 用户管理 (sys-manage-users)
│   ├── 创建用户 (sys-manage-users-create)
│   ├── 编辑用户 (sys-manage-users-update)
│   ├── 删除用户 (sys-manage-users-delete)
│   └── 查看用户 (sys-manage-users-view)
└── 角色管理 (sys-manage-roles)
    ├── 创建角色 (sys-manage-roles-create)
    └── ...
```

#### ❌ 不推荐：扁平化

```
创建用户
编辑用户
删除用户
创建角色
编辑角色
删除角色
...（数百个权限在同一层级）
```

### 4. 角色设计

#### ✅ 推荐：职责清晰

- **超级管理员**：拥有所有权限
- **用户管理员**：只管理用户相关
- **内容编辑**：只管理内容相关
- **只读用户**：只有查看权限

#### ❌ 不推荐：角色爆炸

- 张三的角色
- 李四的角色
- 王五的角色
- ...（为每个用户创建单独角色）

### 5. 通配符使用

#### ✅ 推荐：精确 + 单层通配

```javascript
// 精确路径
actions: ["/admin/actions/user/create"]

// 单层通配（user 模块的所有操作）
actions: ["/admin/actions/user/*"]
```

#### ❌ 不推荐：多层通配

```javascript
// ❌ 权限范围太大
actions: ["/admin/actions/**"]

// ❌ 全局通配
actions: ["/**"]
```

### 6. 代码组织

#### ✅ 推荐：遵循项目结构

```
app/(admin)/
├── actions/
│   ├── configs/                  # CRUD 配置
│   │   ├── article-crud.config.js
│   │   ├── role-crud.config.js
│   │   └── user-crud.config.js
│   ├── dao/                      # 数据访问层
│   │   ├── base.js               # BaseDAO
│   │   └── sys.js                # SysDAO
│   ├── admin-articles.js         # Server Actions
│   ├── admin-roles.js
│   └── admin-users.js
├── admin/
│   ├── articles/
│   │   └── page.js               # 页面组件
│   ├── roles/
│   │   └── page.js
│   └── users/
│       └── page.js
```

---

## 常见问题

### Q1: 用户同时有多个角色时，权限如何计算？

**A**: 用户的最终权限是所有角色权限的**并集**。

```javascript
// 用户 A 的角色
roles: ["role-uuid-1", "role-uuid-2"]

// 角色 1 的权限
role1.permission: ["perm-a", "perm-b"]

// 角色 2 的权限
role2.permission: ["perm-b", "perm-c"]

// 用户 A 的最终权限（并集）
finalPermissions: ["perm-a", "perm-b", "perm-c"]
```

### Q2: Better Auth 的 `role` 字段和 RBAC 的 `roles` 字段有什么区别？

**A**: 
- `role`（单一字符串）：Better Auth 的基础角色，只有 `admin` 和 `user` 两种
- `roles`（UUID 数组）：RBAC 的角色列表，支持多个自定义角色

两者共存，互不冲突：

```javascript
{
  id: "user-uuid",
  name: "Kent",
  role: "admin",                   // Better Auth 角色（单一）
  roles: [                         // RBAC 角色（多个）
    "role-uuid-1",
    "role-uuid-2"
  ]
}
```

### Q3: 如何在 Server Action 中验证权限？

**A**: 使用 `checkActionPermission` 验证：

```javascript
'use server';

import { checkActionPermission } from '@/lib/permission-auth';

export async function createUserAction(data) {
  // 验证权限
  const permCheck = await checkActionPermission('/admin/actions/user/create');
  
  if (!permCheck.hasPermission) {
    return {
      success: false,
      error: permCheck.error || 'Permission denied'
    };
  }
  
  // 执行业务逻辑
  // ...
  
  return { success: true };
}
```

### Q4: 通配符 `*` 和 `**` 有什么区别？

**A**: 
- `*` 只匹配一层路径
- `**` 匹配任意层级

```javascript
// 单层通配
"/admin/actions/user/*"
// ✅ 匹配: /admin/actions/user/create
// ❌ 不匹配: /admin/actions/user/role/assign

// 多层通配
"/admin/actions/**"
// ✅ 匹配: /admin/actions/user/create
// ✅ 匹配: /admin/actions/user/role/assign
```

### Q5: 如何为新页面添加权限保护？

**A**: 按照以下步骤：

1. **创建权限**：在 `/admin/permissions` 创建权限，配置 `actions` 路径
2. **分配给角色**：在 `/admin/roles` 为角色分配此权限
3. **Server Action 中验证**：使用 `checkActionPermission` 验证
4. **前端按钮控制**（可选）：根据权限显示/隐藏按钮

### Q6: 连表查询的性能如何？

**A**: 
- 使用 MongoDB 聚合管道，性能优异
- 一次查询完成所有连表，避免 N+1 问题
- 建议在关联字段上创建索引：
  ```javascript
  db.users.createIndex({ "roles": 1 })
  db.roles.createIndex({ "id": 1 })
  ```

### Q7: 如何迁移旧数据到新的字段名？

**A**: 使用 MongoDB Shell 执行迁移脚本：

```javascript
// 示例：将 role_id 迁移为 id
db.roles.updateMany(
  { role_id: { $exists: true } },
  [
    {
      $set: {
        id: "$role_id",
        name: "$role_name",
        parent_id: "$parentId"
      }
    },
    {
      $unset: ["role_id", "role_name", "parentId"]
    }
  ]
);
```

### Q8: 如何实现"用户只能编辑自己的数据"？

**A**: 在 Server Action 中检查用户 ID：

```javascript
export async function updateArticleAction(articleId, data) {
  const permCheck = await checkActionPermission('/admin/actions/article/update');
  
  if (!permCheck.hasPermission) {
    // 检查是否是编辑自己的文章
    const article = await getArticle(articleId);
    if (article.authorId !== permCheck.userId) {
      return { success: false, error: 'You can only edit your own articles' };
    }
  }
  
  // 执行更新
  // ...
}
```

---

## 更新日志

### v2.0.0 (2025-11-04)

**重大更新：统一字段命名和连表查询**

- ✅ **UUID 主键体系**：所有集合使用 UUID 作为主键（`id` 字段）
- ✅ **统一字段命名**：`id`、`name`、`parent_id`、`sort`、`remark`、`enable` 标准化
- ✅ **连表查询机制**：实现 `foreignDB` 配置，自动连表显示名称
- ✅ **用户角色字段**：从 `ids` 统一为 `roles`
- ✅ **菜单外部链接**：支持 http 开头的外部链接，显示链接图标
- ✅ **文档重构**：全面更新文档，删除过时内容，统一命名规范
- ✅ **最佳实践**：添加完整示例和代码规范
- ❌ **废弃字段**：`role_id`、`permission_id`、`menu_id`、`key`、`parentId`、`sortOrder`、`enabled`、`comment`、`role_ids`、`ids`

### v1.0.0 (2025-01-XX)

- ✅ 完成 RBAC 核心功能
- ✅ 实现用户-角色多对多关系
- ✅ 实现角色-权限-菜单关联
- ✅ 实现权限树形结构
- ✅ 实现通配符权限匹配
- ✅ 完成管理界面（权限、角色、用户）
- ✅ 完成权限验证中间件

---

## 技术栈

- **数据库**：MongoDB（主键使用 UUID，兼容 PostgreSQL 和 CloudflareD1）
- **后端框架**：Next.js Server Actions
- **前端框架**：React + Ant Design + Ant Design Pro Components
- **权限模型**：RBAC（基于角色的访问控制）
- **主键策略**：UUID v4

---

## 相关文档

- [BaseDAO 文档](./admin/BASE_DAO.md)
- [DB API 文档](./database/DB_API_GUIDE.md)
- [Smart CRUD 文档](./admin/SMART_CRUD.md)
- [CRUD 开发指南](./admin/CRUD_GUIDE.md)
- [字段命名规范](./NAMING_STANDARDS.md)

---

## 许可证

MIT License

