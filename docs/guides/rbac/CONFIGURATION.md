# RBAC 配置指南

<div align="center">

**角色权限配置详细指南**

[基础概念](#-基础概念) · [配置步骤](#-配置步骤) · [最佳实践](#-最佳实践)

</div>

---

## 🎯 概述

RBAC（Role-Based Access Control）是 NextJS Base 的权限管理系统，通过角色来管理用户的访问权限。

### 核心概念

```
用户 (User)
   │
   └─── 拥有角色 ───► 角色 (Role)
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
      权限           菜单           继承菜单权限
   (Permission)     (Menu)     (inheritMenuPermissions)
         │               │
         ▼               ▼
    Server Actions   页面访问
```

---

## 📚 基础概念

### 权限 (Permission)

权限定义了用户可以执行的操作：

| 字段 | 说明 | 示例 |
|:---|:---|:---|
| `name` | 权限名称 | 查看文章、创建文章 |
| `parentId` | 父级 ID（支持树形） | null / 父权限 ID |
| `crudCategory` | CRUD 分类 | post、user、role |
| `actions` | 关联的 Server Actions | ['sysGetPostList', 'sysCreatePost'] |
| `apis` | 关联的 API 路径 | ['/api/v1/posts'] |

### 菜单 (Menu)

菜单定义了后台侧边栏的显示：

| 字段 | 说明 | 示例 |
|:---|:---|:---|
| `name` | 菜单名称 | 文章管理 |
| `parentId` | 父级 ID（支持树形） | null / 父菜单 ID |
| `url` | 页面路径 | /admin/content/posts |
| `icon` | 图标 | FileTextOutlined |
| `permission` | 关联的权限 ID 数组 | ['perm_id_1', 'perm_id_2'] |

### 角色 (Role)

角色是权限和菜单的集合：

| 字段 | 说明 | 示例 |
|:---|:---|:---|
| `name` | 角色名称 | admin、editor |
| `permission` | 权限 ID 数组 | ['perm_id_1', 'perm_id_2'] |
| `menu` | 菜单 ID 数组 | ['menu_id_1', 'menu_id_2'] |
| `inheritMenuPermissions` | 是否继承菜单权限 | true / false |

---

## 📝 配置步骤

### Step 1: 创建权限

在「权限管理」页面创建权限：

```
文章管理（父级权限）
├── 查看文章
│   └── actions: ['sysGetPostList', 'sysGetPostDetail']
├── 创建文章
│   └── actions: ['sysCreatePost']
├── 编辑文章
│   └── actions: ['sysUpdatePost']
└── 删除文章
    └── actions: ['sysDeletePost', 'sysBatchDeletePost']
```

**配置示例**：

| 字段 | 父级权限 | 子权限（查看文章） |
|:---|:---|:---|
| 名称 | 文章管理 | 查看文章 |
| 父级 | - | 文章管理 |
| CRUD 分类 | post | post |
| Actions | [] | ['sysGetPostList', 'sysGetPostDetail'] |

### Step 2: 创建菜单

在「菜单管理」页面创建菜单：

```
内容管理（父级菜单）
├── 文章管理
│   ├── URL: /admin/content/posts
│   ├── 图标: FileTextOutlined
│   └── 关联权限: [查看文章, 创建文章, 编辑文章, 删除文章]
└── 分类管理
    ├── URL: /admin/content/categories
    └── 关联权限: [查看分类, 创建分类, ...]
```

### Step 3: 创建角色

在「角色管理」页面创建角色：

**管理员角色**：

| 字段 | 值 |
|:---|:---|
| 名称 | admin |
| 权限 | [] （可为空） |
| 菜单 | [所有菜单] |
| 继承菜单权限 | ✅ 是 |

**编辑角色**：

| 字段 | 值 |
|:---|:---|
| 名称 | editor |
| 权限 | [查看文章, 创建文章, 编辑文章] |
| 菜单 | [文章管理] |
| 继承菜单权限 | ❌ 否 |

### Step 4: 分配角色给用户

在「用户管理」页面为用户分配角色：

1. 找到目标用户
2. 点击「编辑」
3. 在「角色」字段选择角色
4. 确保「后台访问」已开启
5. 保存

---

## 🔐 权限检查流程

### Action 权限检查

```javascript
// 1. 调用 Server Action
sysGetPostListAction()

// 2. wrapAction 解析 Action 名称
//    - 前缀: sys → 需要后台权限
//    - 操作: GetPostList

// 3. 检查用户是否有后台访问权限
if (!user.hasBackendAccess) {
  throw new Error('无后台访问权限')
}

// 4. 获取用户角色的所有权限
const permissions = await getUserPermissions(user.roles)

// 5. 检查 Action 是否在权限列表中
const allowedActions = permissions.flatMap(p => p.actions)
if (!allowedActions.includes('sysGetPostList')) {
  throw new Error('无权执行此操作')
}

// 6. 执行业务逻辑
```

### 菜单权限检查

```javascript
// 1. 获取用户角色
const roles = await getRoles(user.roles)

// 2. 汇总所有菜单 ID
const menuIds = roles.flatMap(r => r.menu)

// 3. 获取菜单详情
const menus = await getMenus(menuIds)

// 4. 过滤启用且未隐藏的菜单
const visibleMenus = menus.filter(m => m.enable && !m.hidden)

// 5. 构建菜单树并渲染侧边栏
```

---

## 🎨 配置示例

### 示例：电商系统权限

```
商品管理
├── 查看商品 [sysGetProductList, sysGetProductDetail]
├── 创建商品 [sysCreateProduct]
├── 编辑商品 [sysUpdateProduct]
├── 删除商品 [sysDeleteProduct]
└── 上下架商品 [sysToggleProductStatus]

订单管理
├── 查看订单 [sysGetOrderList, sysGetOrderDetail]
├── 处理订单 [sysUpdateOrder]
├── 取消订单 [sysCancelOrder]
└── 导出订单 [sysExportOrder]

用户管理
├── 查看用户 [sysGetUserList, sysGetUserDetail]
├── 编辑用户 [sysUpdateUser]
├── 封禁用户 [sysBanUser]
└── 重置密码 [sysResetUserPassword]
```

### 示例：角色配置

**超级管理员**：
```javascript
{
  name: 'super_admin',
  permission: [],  // 空，使用菜单继承
  menu: ['所有菜单 ID'],
  inheritMenuPermissions: true,
}
```

**运营人员**：
```javascript
{
  name: 'operator',
  permission: [
    '查看商品', '编辑商品', '上下架商品',
    '查看订单', '处理订单',
  ],
  menu: ['商品管理', '订单管理'],
  inheritMenuPermissions: false,
}
```

**客服人员**：
```javascript
{
  name: 'customer_service',
  permission: [
    '查看订单',
    '查看用户',
  ],
  menu: ['订单管理', '用户管理'],
  inheritMenuPermissions: false,
}
```

---

## ✅ 最佳实践

### 1. 权限粒度

```
✅ 推荐：细粒度权限
├── 查看文章
├── 创建文章
├── 编辑文章
└── 删除文章

❌ 不推荐：粗粒度权限
└── 文章管理（包含所有操作）
```

### 2. 使用 CRUD 分类

```javascript
// ✅ 推荐：使用 crudCategory 分组
{
  name: '查看文章',
  crudCategory: 'post',  // 便于筛选和管理
  actions: ['sysGetPostList'],
}
```

### 3. 菜单权限继承

```javascript
// ✅ 管理员：使用继承简化配置
{
  name: 'admin',
  menu: ['所有菜单'],
  inheritMenuPermissions: true,  // 自动获得菜单关联的权限
}

// ✅ 普通角色：显式分配权限
{
  name: 'editor',
  permission: ['具体权限'],
  menu: ['编辑相关菜单'],
  inheritMenuPermissions: false,  // 精确控制权限
}
```

### 4. 权限命名规范

```
{模块名称} - {操作}

示例：
- 文章管理 - 查看
- 文章管理 - 创建
- 文章管理 - 编辑
- 文章管理 - 删除
```

### 5. 定期审计

- 定期检查角色权限配置
- 移除不再使用的权限
- 检查用户角色分配是否合理
- 查看操作日志发现异常

---

## 📚 相关文档

| 文档 | 说明 |
|:---|:---|
| [权限模型](../../architecture/PERMISSION_MODEL.md) | RBAC 架构设计 |
| [菜单管理](./MENU_MANAGEMENT.md) | 菜单配置指南 |
| [wrapAction API](../../api/WRAP_ACTION.md) | Action 包装器 |
| [权限配置模板](../../../templates/crud/PERMISSIONS.md) | 权限配置规范 |

---

<div align="center">

[← Server Actions 开发](../admin/SERVER_ACTIONS.md) · [菜单管理 →](./MENU_MANAGEMENT.md)

</div>

