# 权限模型

<div align="center">

**深入理解 NextJS Base 的 RBAC 权限系统**

[模型设计](#-模型设计) · [权限检查](#-权限检查) · [最佳实践](#-最佳实践)

</div>

---

## 🎯 概述

NextJS Base 采用 **RBAC（Role-Based Access Control）** 权限模型，通过角色来管理用户的访问权限。

### 核心概念

| 概念 | 说明 | 示例 |
|:---|:---|:---|
| **User** | 系统用户 | 管理员、编辑、访客 |
| **Role** | 角色，权限的集合 | admin、editor、viewer |
| **Permission** | 权限，可执行的操作 | 创建用户、编辑文章 |
| **Menu** | 菜单，页面访问入口 | 用户管理、文章管理 |

### 关系图

```
┌─────────────────────────────────────────────────────────────────────┐
│                           RBAC 模型                                  │
└─────────────────────────────────────────────────────────────────────┘

                    ┌─────────────┐
                    │    User     │
                    │   用户      │
                    └──────┬──────┘
                           │
                           │ roles: String[]
                           │ (角色 ID 数组)
                           ▼
                    ┌─────────────┐
                    │    Role     │
                    │   角色      │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           │ permission    │ menu          │ inheritMenuPermissions
           │ String[]      │ String[]      │ Boolean
           ▼               ▼               │
    ┌─────────────┐ ┌─────────────┐       │
    │ Permission  │ │    Menu     │◄──────┘
    │   权限      │ │   菜单      │
    └─────────────┘ └──────┬──────┘
                           │
                           │ permission: String[]
                           │ (菜单关联的权限)
                           ▼
                    ┌─────────────┐
                    │ Permission  │
                    │   权限      │
                    └─────────────┘
```

---

## 📊 模型设计

### User 模型

```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  name              String?
  
  // 角色关联
  roles             String[]  @default([])    // 角色 ID 数组
  
  // 后台访问权限
  hasBackendAccess  Boolean   @default(false)
  
  // 其他字段...
}
```

### Role 模型

```prisma
model Role {
  id                      String    @id @default(cuid())
  name                    String    @unique        // 角色名称
  remark                  String?                  // 备注
  enable                  Boolean   @default(true) // 是否启用
  
  // 权限关联
  permission              String[]  @default([])   // 权限 ID 数组
  
  // 菜单关联
  menu                    String[]  @default([])   // 菜单 ID 数组
  inheritMenuPermissions  Boolean   @default(true) // 是否继承菜单权限
  
  // 时间戳
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
}
```

### Permission 模型

```prisma
model Permission {
  id           String    @id @default(cuid())
  name         String                          // 权限名称
  parentId     String?                         // 父级 ID（支持树形）
  
  // 分类和层级
  crudCategory String?                         // CRUD 分类
  level        Int       @default(0)           // 层级
  
  // 关联的 Actions
  actions      String[]  @default([])          // Server Action 名称数组
  
  // 关联的 APIs
  apis         String[]  @default([])          // API 路径数组
  
  // 排序和状态
  sort         Int       @default(0)
  enable       Boolean   @default(true)
  remark       String?
  
  // 软删除
  deletedAt    DateTime?
  
  // 时间戳
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

### Menu 模型

```prisma
model Menu {
  id         String    @id @default(cuid())
  name       String                          // 菜单名称
  parentId   String?                         // 父级 ID（支持树形）
  
  // 路由配置
  url        String?                         // 页面路径
  icon       String?                         // 图标
  
  // 关联权限
  permission String[]  @default([])          // 关联的权限 ID 数组
  
  // 显示控制
  sort       Int       @default(0)
  enable     Boolean   @default(true)
  hidden     Boolean   @default(false)       // 是否隐藏
  
  remark     String?
  
  // 时间戳
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

---

## 🔐 权限检查

### Action 权限检查流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                    调用 Server Action                                │
│                    sysGetRoleListAction()                           │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Step 1: 解析 Action 名称                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ actionName: 'sysGetRoleList'                                 │   │
│  │                                                              │   │
│  │ 解析结果:                                                    │   │
│  │ - prefix: 'sys' → SYSTEM 级别                               │   │
│  │ - action: 'Get'                                              │   │
│  │ - resource: 'RoleList'                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Step 2: 认证检查                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ const session = await auth()                                 │   │
│  │                                                              │   │
│  │ if (!session?.user) {                                       │   │
│  │   throw new Error('请先登录')                                │   │
│  │ }                                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Step 3: 后台访问检查                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // 检查用户是否有后台访问权限                                │   │
│  │ if (!user.hasBackendAccess) {                               │   │
│  │   throw new Error('无后台访问权限')                          │   │
│  │ }                                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Step 4: RBAC 权限检查                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ // 1. 获取用户的所有角色                                     │   │
│  │ const roles = await getRolesByIds(user.roles)               │   │
│  │                                                              │   │
│  │ // 2. 汇总所有权限 ID                                        │   │
│  │ let permissionIds = roles.flatMap(r => r.permission)        │   │
│  │                                                              │   │
│  │ // 3. 如果角色开启了菜单权限继承                             │   │
│  │ for (const role of roles) {                                 │   │
│  │   if (role.inheritMenuPermissions) {                        │   │
│  │     const menus = await getMenusByIds(role.menu)            │   │
│  │     permissionIds.push(...menus.flatMap(m => m.permission)) │   │
│  │   }                                                          │   │
│  │ }                                                            │   │
│  │                                                              │   │
│  │ // 4. 获取权限详情                                           │   │
│  │ const permissions = await getPermissionsByIds(permissionIds)│   │
│  │                                                              │   │
│  │ // 5. 汇总所有允许的 Actions                                 │   │
│  │ const allowedActions = permissions.flatMap(p => p.actions)  │   │
│  │                                                              │   │
│  │ // 6. 检查当前 Action 是否在允许列表中                       │   │
│  │ if (!allowedActions.includes('sysGetRoleList')) {           │   │
│  │   throw new Error('无权执行此操作')                          │   │
│  │ }                                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Step 5: 执行业务逻辑                              │
│                    ✅ 权限检查通过                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 菜单权限检查

菜单权限用于控制后台侧边栏的显示：

```javascript
// 获取用户可访问的菜单
async function getUserMenus(userId) {
  // 1. 获取用户
  const user = await getUser(userId)
  
  // 2. 获取用户的角色
  const roles = await getRolesByIds(user.roles)
  
  // 3. 汇总所有菜单 ID
  const menuIds = [...new Set(roles.flatMap(r => r.menu))]
  
  // 4. 获取菜单详情
  const menus = await getMenusByIds(menuIds)
  
  // 5. 过滤启用且未隐藏的菜单
  const visibleMenus = menus.filter(m => m.enable && !m.hidden)
  
  // 6. 构建菜单树
  return buildMenuTree(visibleMenus)
}
```

---

## 🎨 权限配置示例

### 示例：文章管理权限

#### 1. 创建权限

```javascript
// 文章管理 - 父级权限
{
  name: '文章管理',
  parentId: null,
  crudCategory: 'post',
  level: 0,
  actions: [],
  apis: [],
}

// 文章管理 - 查看
{
  name: '查看文章',
  parentId: '文章管理ID',
  crudCategory: 'post',
  level: 1,
  actions: ['sysGetPostList', 'sysGetPostDetail'],
  apis: [],
}

// 文章管理 - 创建
{
  name: '创建文章',
  parentId: '文章管理ID',
  crudCategory: 'post',
  level: 1,
  actions: ['sysCreatePost'],
  apis: [],
}

// 文章管理 - 编辑
{
  name: '编辑文章',
  parentId: '文章管理ID',
  crudCategory: 'post',
  level: 1,
  actions: ['sysUpdatePost'],
  apis: [],
}

// 文章管理 - 删除
{
  name: '删除文章',
  parentId: '文章管理ID',
  crudCategory: 'post',
  level: 1,
  actions: ['sysDeletePost', 'sysBatchDeletePost'],
  apis: [],
}
```

#### 2. 创建菜单

```javascript
{
  name: '文章管理',
  parentId: '内容管理ID',
  url: '/admin/content/posts',
  icon: 'FileTextOutlined',
  permission: ['查看文章ID', '创建文章ID', '编辑文章ID', '删除文章ID'],
  sort: 10,
  enable: true,
}
```

#### 3. 分配给角色

```javascript
// 编辑角色 - 只有查看和编辑权限
{
  name: 'editor',
  permission: ['查看文章ID', '编辑文章ID'],
  menu: ['文章管理菜单ID'],
  inheritMenuPermissions: false,  // 不继承菜单权限，使用显式分配
}

// 管理员角色 - 所有权限
{
  name: 'admin',
  permission: [],  // 可以为空
  menu: ['文章管理菜单ID'],
  inheritMenuPermissions: true,  // 继承菜单关联的所有权限
}
```

---

## 📋 权限命名规范

### Action 命名

| 前缀 | 级别 | 说明 | 示例 |
|:---|:---|:---|:---|
| `pub` | PUBLIC | 公开访问 | `pubGetConfig` |
| `auth` | AUTH | 需要登录 | `authGetUserInfo` |
| `sys` | SYSTEM | 需要后台权限 | `sysGetRoleList` |

### 完整命名格式

```
{prefix}{Action}{Resource}Action

示例：
- sysGetRoleListAction      // 获取角色列表
- sysCreateRoleAction       // 创建角色
- sysUpdateRoleAction       // 更新角色
- sysDeleteRoleAction       // 删除角色
- sysBatchDeleteRoleAction  // 批量删除角色
```

### 权限分类 (crudCategory)

| 分类 | 说明 | 关联 Actions |
|:---|:---|:---|
| `role` | 角色管理 | `sysGetRoleList`, `sysCreateRole`, ... |
| `permission` | 权限管理 | `sysGetPermissionList`, ... |
| `menu` | 菜单管理 | `sysGetMenuList`, ... |
| `user` | 用户管理 | `sysGetUserList`, ... |
| `post` | 文章管理 | `sysGetPostList`, ... |

---

## ✅ 最佳实践

### 1. 权限粒度

```
✅ 推荐：细粒度权限
- 查看角色
- 创建角色
- 编辑角色
- 删除角色

❌ 不推荐：粗粒度权限
- 角色管理（包含所有操作）
```

### 2. 使用 crudCategory

```javascript
// ✅ 推荐：使用 crudCategory 分组
{
  name: '查看角色',
  crudCategory: 'role',
  actions: ['sysGetRoleList', 'sysGetRoleDetail'],
}

// ❌ 不推荐：不使用分类
{
  name: '查看角色',
  actions: ['sysGetRoleList', 'sysGetRoleDetail'],
}
```

### 3. 菜单权限继承

```javascript
// ✅ 推荐：对于管理员角色，使用菜单权限继承
{
  name: 'admin',
  menu: ['所有菜单ID'],
  inheritMenuPermissions: true,  // 自动获得菜单关联的所有权限
}

// ✅ 推荐：对于普通角色，显式分配权限
{
  name: 'editor',
  permission: ['具体权限ID'],
  menu: ['编辑相关菜单ID'],
  inheritMenuPermissions: false,  // 不继承，使用显式分配
}
```

### 4. 权限检查位置

```javascript
// ✅ 推荐：在 wrapAction 中自动检查
export const sysGetRoleListAction = wrapAction(
  'sysGetRoleList',
  async (params) => {
    // 权限已自动检查
    return await dao.getList(params)
  }
)

// ❌ 不推荐：在业务逻辑中手动检查
export const getRoleListAction = async (params) => {
  // 手动检查权限
  if (!await checkPermission('sysGetRoleList')) {
    throw new Error('无权限')
  }
  return await dao.getList(params)
}
```

---

## 📚 相关文档

| 文档 | 说明 |
|:---|:---|
| [整体架构](./OVERVIEW.md) | 系统架构概述 |
| [数据流设计](./DATA_FLOW.md) | 请求处理流程 |
| [RBAC 配置指南](../guides/rbac/CONFIGURATION.md) | 权限配置详细指南 |
| [wrapAction API](../api/WRAP_ACTION.md) | Action 包装器 API |

---

<div align="center">

[← 数据流设计](./DATA_FLOW.md) · [开发指南 →](../guides/README.md)

</div>

