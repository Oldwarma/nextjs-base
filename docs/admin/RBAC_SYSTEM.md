# RBAC 权限管理系统配置指南

> **最后更新**: 2025-11-04  
> **版本**: v2.0.0  
> **状态**: 已完全实现  
> **目标读者**: 系统管理员、配置人员  
> **用途**: 配置和管理系统权限时的参考文档

---

## 🎉 系统状态

RBAC 权限管理系统已完全实现并可用！包括：

- **菜单权限控制**: 根据用户角色自动过滤菜单
- **页面访问控制**: 保护页面访问权限
- **操作权限控制**: Server Actions 权限验证
- **前端权限控制**: React Hooks 支持
- **完整文档**: 配置指南和开发文档

**开发者文档**: 查看 [RBAC 实现指南](../rbac/RBAC_IMPLEMENTATION_GUIDE.md) 了解技术实现细节

---

## 📋 目录

1. [系统概述](#系统概述)
2. [快速开始](#快速开始)
3. [权限配置流程](#权限配置流程)
4. [数据结构说明](#数据结构说明)
5. [权限验证机制](#权限验证机制)
6. [常见场景配置](#常见场景配置)
7. [最佳实践](#最佳实践)

---

## 系统概述

### 什么是 RBAC？

RBAC（Role-Based Access Control，基于角色的访问控制）是一种权限管理模型：

```
用户 (User) → 角色 (Role) → 权限 (Permission) + 菜单 (Menu)
```

- **用户** 可以拥有多个**角色**
- **角色** 可以拥有多个**权限**和**菜单**
- **权限** 控制可以执行哪些操作（Actions）
- **菜单** 控制可以访问哪些页面

### 核心特性

- **用户-角色多对多**：一个用户可以有多个角色
- **角色-权限多对多**：一个角色可以有多个权限
- **角色-菜单多对多**：一个角色可以访问多个菜单
- **权限树形结构**：支持多层级权限组织
- **菜单树形结构**：支持多层级菜单导航
- **通配符支持**：Action 路径支持 `*` 和 `**` 通配符
- **动态验证**：Server Actions 中自动验证权限

### 与 Better Auth 集成

本系统与 Better Auth 共存：

| 字段 | 类型 | 用途 | 来源 |
|------|------|------|------|
| `role` | String | 基础角色（`admin`/`user`） | Better Auth |
| `roles` | Array<String> | RBAC 角色 UUID 数组 | RBAC 系统 |

两者互不冲突，可以同时使用。

---

## 快速开始

### 第一次配置权限系统

按照以下顺序操作：

1. **创建权限体系** → `/admin/permissions`
2. **创建菜单** → `/admin/menus`
3. **创建角色** → `/admin/roles`
4. **为角色分配权限和菜单** → `/admin/roles` > "Assign Permissions" / "Assign Menus"
5. **为用户分配角色** → `/admin/users` > "Assign Roles"

### 5 分钟快速配置示例

假设要给「编辑员」角色配置「文章管理」权限：

```
1. 创建权限
   - 名称: 文章管理
   - Actions: ["/admin/actions/article/*"]
   
2. 创建菜单
   - 名称: 文章管理
   - URL: /admin/articles
   
3. 创建角色
   - 名称: 编辑员
   
4. 为角色分配权限
   - 选择「文章管理」权限
   
5. 为角色分配菜单
   - 选择「文章管理」菜单
   
6. 为用户分配角色
   - 选择某个用户
   - 分配「编辑员」角色
```

完成！该用户现在可以访问文章管理页面并执行相关操作。

---

## 权限配置流程

### 步骤 1: 创建权限体系

#### 访问权限管理页面

路径：`/admin/permissions`

#### 创建顶级权限组

1. 点击「Create」按钮
2. 填写权限信息：
   - **Name**: 系统管理
   - **Parent Permission**: 留空（顶级权限）
   - **CRUD Category**: Unclassified
   - **Permission Level**: Other
   - **Actions**: 留空（分组权限不需要 Actions）
   - **Enabled**: 是
   - **Sort**: 0

#### 创建子权限

1. 点击「Create」按钮
2. 填写权限信息：
   - **Name**: 用户管理
   - **Parent Permission**: 选择「系统管理」
   - **CRUD Category**: Read（如果是查看权限）
   - **Permission Level**: Bullet
   - **Actions**: `["/admin/actions/user/*"]`
   - **Enabled**: 是
   - **Sort**: 10

#### Actions 配置说明

**Actions** 字段定义了此权限可以访问的 Server Action 路径：

| 配置方式 | 示例 | 说明 |
|---------|------|------|
| **精确路径** | `/admin/actions/user/create` | 只允许此特定操作 |
| **单层通配** | `/admin/actions/user/*` | 允许 user 下的所有直接操作 |
| **多层通配** | `/admin/actions/**` | 允许 admin/actions 下的所有操作（⚠️ 慎用） |

**示例权限树**：

```
系统管理 (sys-manage)
├── 用户管理 (sys-manage-users)
│   ├── actions: ["/admin/actions/user/*"]
│   └── level: Bullet
├── 角色管理 (sys-manage-roles)
│   ├── actions: ["/admin/actions/role/*"]
│   └── level: Bomb
└── 权限管理 (sys-manage-permissions)
    ├── actions: ["/admin/actions/permission/*"]
    └── level: Grenade
```

---

### 步骤 2: 创建菜单

#### 访问菜单管理页面

路径：`/admin/menus`

#### 创建顶级菜单

1. 点击「Create」按钮
2. 填写菜单信息：
   - **Name**: 权限管理
   - **URL**: 留空（分组菜单）
   - **Icon**: `SafetyOutlined`
   - **Parent Menu**: 留空
   - **Enabled**: 是
   - **Hidden**: 否
   - **Sort**: 0

#### 创建子菜单

1. 点击「Create」按钮
2. 填写菜单信息：
   - **Name**: 用户管理
   - **URL**: `/admin/users`
   - **Icon**: `UserOutlined`
   - **Parent Menu**: 选择「权限管理」
   - **Enabled**: 是
   - **Hidden**: 否
   - **Sort**: 10

#### 外部链接菜单

如果 URL 以 `http://` 或 `https://` 开头，会自动识别为外部链接：

- 显示链接图标 🔗
- 点击时在新标签页打开

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

---

### 步骤 3: 创建角色

#### 访问角色管理页面

路径：`/admin/roles`

#### 创建新角色

1. 点击「Create」按钮
2. 填写角色信息：
   - **Name**: 编辑员
   - **Remark**: 负责内容的创建和编辑
   - **Enabled**: 是
   - **Sort**: 10
3. 点击「OK」保存

---

### 步骤 4: 为角色分配权限

#### 分配权限

1. 在角色列表中找到「编辑员」角色
2. 点击「Assign Permissions」按钮
3. 在弹窗中勾选需要的权限：
   - 文章管理
   - 文章管理 → 创建文章
   - 文章管理 → 编辑文章
4. 点击「OK」保存

**权限继承规则**：
- 勾选父权限，自动包含所有子权限
- 取消勾选父权限，自动取消所有子权限

#### 分配菜单

1. 点击「Assign Menus」按钮
2. 在弹窗中勾选需要的菜单：
   - 内容管理
   - 内容管理 → 文章管理
3. 点击「OK」保存

**菜单显示规则**：
- 只显示已分配的菜单
- 父菜单需要同时勾选才能显示层级

---

### 步骤 5: 为用户分配角色

#### 分配角色

1. 访问 `/admin/users`
2. 找到目标用户
3. 点击「Assign Roles」按钮
4. 在弹窗中勾选「编辑员」角色
5. 点击「OK」保存

#### 验证配置

1. 点击用户的「View Details」
2. 查看「RBAC Roles」字段
3. 应该显示：`[编辑员]`（而不是 UUID）

---

## 数据结构说明

### 用户表（users）

```javascript
{
  id: "user-uuid",              // UUID 主键（Better Auth）
  name: "张三",
  email: "zhangsan@example.com",
  
  // Better Auth 基础角色
  role: "admin",                // 'admin' | 'user'
  
  // RBAC 角色数组
  roles: [                      // UUID 数组
    "role-uuid-1",
    "role-uuid-2"
  ],
  
  _id: ObjectId("..."),         // MongoDB 自动生成（兼容）
}
```

### 角色表（roles）

```javascript
{
  id: "role-uuid",              // UUID 主键
  name: "编辑员",
  remark: "负责内容的创建和编辑",
  enable: true,
  sort: 10,
  
  permission: [                 // 权限 UUID 数组
    "perm-uuid-1",
    "perm-uuid-2"
  ],
  
  menu: [                       // 菜单 UUID 数组
    "menu-uuid-1",
    "menu-uuid-2"
  ],
  
  created_at: Date,
  updated_at: Date,
  _id: ObjectId("..."),
}
```

### 权限表（permissions）

```javascript
{
  id: "perm-uuid",              // UUID 主键
  name: "用户管理",
  parent_id: "parent-perm-uuid", // 父权限 UUID（null=根权限）
  remark: "管理系统用户",
  enable: true,
  sort: 10,
  
  crud_category: 4,             // CRUD 分类（0-5）
  level: 1,                     // 权限级别（0-4）
  
  actions: [                    // Action 路径数组
    "/admin/actions/user/*",
    "/admin/actions/user/role/assign"
  ],
  
  created_at: Date,
  updated_at: Date,
  _id: ObjectId("..."),
}
```

### 菜单表（menus）

```javascript
{
  id: "menu-uuid",              // UUID 主键
  name: "用户管理",
  parent_id: "parent-menu-uuid", // 父菜单 UUID（null=根菜单）
  url: "/admin/users",
  icon: "UserOutlined",
  enable: true,
  hidden: false,
  sort: 10,
  remark: "用户管理页面",
  
  created_at: Date,
  updated_at: Date,
  _id: ObjectId("..."),
}
```

---

## 权限验证机制

### Server Action 中的权限验证

开发者在 Server Action 中使用 `checkActionPermission` 验证权限：

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

### 通配符匹配规则

| 权限配置 | Action 路径 | 是否匹配 |
|---------|------------|---------|
| `/admin/actions/user/create` | `/admin/actions/user/create` | 是 |
| `/admin/actions/user/create` | `/admin/actions/user/update` | ❌ 否 |
| `/admin/actions/user/*` | `/admin/actions/user/create` | 是 |
| `/admin/actions/user/*` | `/admin/actions/user/update` | 是 |
| `/admin/actions/user/*` | `/admin/actions/user/role/assign` | ❌ 否（多层） |
| `/admin/actions/**` | `/admin/actions/user/create` | 是 |
| `/admin/actions/**` | `/admin/actions/user/role/assign` | 是 |
| `/admin/actions/**` | `/admin/actions/order/list` | 是 |

### 权限计算逻辑

用户的最终权限 = 所有角色权限的**并集**

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

### admin 角色的特殊性

- `admin` 角色自动拥有**所有权限**
- 不需要配置权限和菜单
- 可以访问所有页面和操作

---

## 常见场景配置

### 场景 1: 内容管理系统

**需求**：
- 作者：可以创建和编辑文章
- 编辑：可以创建、编辑、删除文章，查看评论
- 管理员：拥有所有权限

**权限配置**：

```
内容管理
├── 文章管理
│   ├── 创建文章
│   │   └── actions: ["/admin/actions/article/create"]
│   ├── 编辑文章
│   │   └── actions: ["/admin/actions/article/update"]
│   ├── 删除文章
│   │   └── actions: ["/admin/actions/article/delete"]
│   └── 发布文章
│       └── actions: ["/admin/actions/article/publish"]
└── 评论管理
    ├── 查看评论
    │   └── actions: ["/admin/actions/comment/list"]
    └── 删除评论
        └── actions: ["/admin/actions/comment/delete"]
```

**角色配置**：

| 角色 | 权限 |
|------|------|
| 作者 | 创建文章、编辑文章 |
| 编辑 | 创建文章、编辑文章、删除文章、查看评论、删除评论 |
| 管理员 | 所有权限 |

---

### 场景 2: 电商系统

**需求**：
- 客服：可以查看和处理订单
- 财务：可以查看订单、退款、导出数据
- 运营：可以管理商品

**权限配置**：

```
订单管理
├── 查看订单
│   └── actions: ["/admin/actions/order/list", "/admin/actions/order/detail"]
├── 处理订单
│   └── actions: ["/admin/actions/order/process"]
├── 退款
│   └── actions: ["/admin/actions/order/refund"]
└── 导出订单
    └── actions: ["/admin/actions/order/export"]

商品管理
├── 查看商品
│   └── actions: ["/admin/actions/product/list"]
├── 上架商品
│   └── actions: ["/admin/actions/product/publish"]
└── 下架商品
    └── actions: ["/admin/actions/product/unpublish"]
```

**角色配置**：

| 角色 | 权限 |
|------|------|
| 客服 | 查看订单、处理订单 |
| 财务 | 查看订单、退款、导出订单 |
| 运营 | 商品管理（所有子权限） |

---

### 场景 3: 多租户 SaaS 系统

**需求**：
- 租户管理员：管理本租户的用户和数据
- 超级管理员：管理所有租户

**实现方式**：
1. 在 `beforeCreate`、`beforeUpdate` 钩子中检查租户 ID
2. 查询时自动添加租户过滤条件

```javascript
// CRUD Config
hooks: {
  beforeCreate: async (data) => {
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    data.tenant_id = session.user.tenant_id;
    return data;
  },
  
  beforeUpdate: async (id, data, existing) => {
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    
    if (session.user.role !== 'super_admin') {
      if (existing.tenant_id !== session.user.tenant_id) {
        throw new Error('Cannot access other tenant data');
      }
    }
    
    return data;
  },
}

query: {
  baseFilter: async () => {
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    
    if (session.user.role === 'super_admin') {
      return {};  // 超级管理员看所有数据
    }
    
    return { tenant_id: session.user.tenant_id };  // 只看本租户数据
  },
}
```

---

## 最佳实践

### 1. 权限设计原则

#### 推荐

- **最小权限原则**：用户只拥有完成工作所需的最小权限
- **分层设计**：使用树形结构组织权限
- **语义化命名**：权限名称清晰表达功能
- **粒度适中**：权限不宜过细也不宜过粗

```
好的设计：
用户管理
├── 创建用户
├── 编辑用户
├── 删除用户
└── 查看用户

❌ 不好的设计：
用户管理  # 粒度太粗，无法细分权限
创建用户的姓名字段  # 粒度太细，难以管理
```

#### 权限命名规范

- 使用名词短语
- 清晰表达功能
- 避免缩写

```javascript
好的命名：
"用户管理"
"创建文章"
"导出订单"

❌ 不好的命名：
"UM"  # 缩写不清晰
"做某事"  # 含义模糊
"权限1"  # 无意义命名
```

---

### 2. 角色设计建议

#### 推荐

- **职责清晰**：每个角色对应一个明确的职责
- **避免角色爆炸**：不要为每个用户创建单独的角色
- **组合使用**：通过组合多个角色实现复杂权限

```javascript
好的角色设计：
- 超级管理员：拥有所有权限
- 用户管理员：只管理用户相关
- 内容编辑：只管理内容相关
- 只读用户：只有查看权限

❌ 不好的角色设计：
- 张三的角色
- 李四的角色
- 王五的角色
# 为每个用户创建单独角色
```

---

### 3. 通配符使用建议

#### 推荐：精确路径或单层通配

```javascript
好的配置：
actions: ["/admin/actions/user/create"]  # 精确控制
actions: ["/admin/actions/user/*"]       # 控制单个模块
```

#### ⚠️ 谨慎使用：多层通配

```javascript
⚠️ 需谨慎：
actions: ["/admin/actions/**"]           # 权限范围太大
actions: ["/**"]                         # 全局通配（危险）
```

**建议**：
- 优先使用精确路径
- 必要时使用单层通配 `*`
- 避免使用多层通配 `**`
- 定期审查通配符权限

---

### 4. 安全建议

#### 保护 admin 角色

- 系统禁止删除 admin 角色
- 普通用户不能给自己分配 admin 角色

#### 审计日志

- 记录所有权限相关操作
- 记录角色分配变更
- 记录权限配置变更

#### 定期审查

- 定期检查用户权限
- 删除不必要的授权
- 检查使用通配符的权限

#### 防止权限提升

- 在 `beforeUpdate` 钩子中检查权限
- 普通用户不能修改自己的角色
- 权限变更需要管理员审批

---

## 常见问题

### Q1: 用户同时有多个角色时，权限如何计算？

**A**: 取**并集**。用户拥有所有角色的全部权限。

---

### Q2: Better Auth 的 `role` 字段和 RBAC 的 `roles` 字段有什么区别？

**A**: 
- `role`：Better Auth 的基础角色，只有 `admin` 和 `user`
- `roles`：RBAC 的角色列表，支持多个自定义角色

两者共存，互不冲突。

---

### Q3: 如何实现"用户只能编辑自己的数据"？

**A**: 在 CRUD Config 的 `beforeUpdate` 钩子中检查：

```javascript
beforeUpdate: async (id, data, existing) => {
  const { auth } = await import('@/lib/auth');
  const session = await auth();
  
  if (existing.author_id !== session.user.id && session.user.role !== 'admin') {
    throw new Error('You can only edit your own articles');
  }
  
  return data;
}
```

---

### Q4: 通配符 `*` 和 `**` 有什么区别？

**A**: 
- `*`：只匹配一层路径
- `**`：匹配任意层级

示例：
```javascript
"/admin/actions/user/*"    // 匹配: /admin/actions/user/create
                            // 不匹配: /admin/actions/user/role/assign

"/admin/actions/**"        // 匹配: /admin/actions/user/create
                            // 匹配: /admin/actions/user/role/assign
```

---

### Q5: 如何给新页面添加权限保护？

**A**: 
1. 在权限管理中创建权限，配置 Actions
2. 在角色管理中为角色分配此权限
3. 在 Server Action 中使用 `checkActionPermission` 验证
4. （可选）前端根据权限显示/隐藏按钮

---

## 相关文档

### 管理员文档
- [RBAC 系统配置指南](./RBAC_SYSTEM.md) ← 当前文档
- [Smart CRUD 开发指南](./SMART_CRUD_GUIDE.md) - 创建新页面的完整指南
- [字段命名规范](../NAMING_STANDARDS.md) - 统一的字段命名标准

### 开发者文档
- **[RBAC 实现指南](../rbac/RBAC_IMPLEMENTATION_GUIDE.md)** ← 技术实现文档
- [BaseDAO 文档](./BASE_DAO.md) - 数据访问层文档
- [DB API 文档](../database/DB_API_GUIDE.md) - 数据库 API 文档

---

## 许可证

MIT License
