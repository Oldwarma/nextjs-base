# RBAC 权限管理系统

## 📋 目录

1. [系统概述](#系统概述)
2. [核心概念](#核心概念)
3. [数据结构](#数据结构)
4. [功能模块](#功能模块)
5. [使用指南](#使用指南)
6. [API文档](#api文档)
7. [最佳实践](#最佳实践)

---

## 系统概述

本项目实现了一个完整的基于角色的访问控制（RBAC）系统，支持：

- ✅ **用户-角色多对多关系**：一个用户可以拥有多个角色
- ✅ **角色-权限多对多关系**：一个角色可以拥有多个权限组
- ✅ **角色-菜单多对多关系**：一个角色可以访问多个菜单
- ✅ **权限树形结构**：支持多层级权限，父权限自动包含子权限
- ✅ **Actions路径配置**：支持完整URL和通配符（`*`、`**`）
- ✅ **权限分类**：增、删、改、查、特殊、其他（6种）
- ✅ **权限级别**：子弹级、炸弹级、榴弹级、核弹级、其他（5种）

---

## 核心概念

### 1. 用户（User）

- 用户是系统的基本实体
- 用户通过 `role` 字段绑定多个角色（数组）
- 用户继承所有角色的权限和菜单

### 2. 角色（Role）

- 角色是权限和菜单的集合
- 角色通过 `permission` 字段存储权限ID数组
- 角色通过 `menu` 字段存储菜单ID数组
- `admin` 角色是特殊角色，拥有所有权限

### 3. 权限（Permission）

- 权限支持树形结构（通过 `parent_id`）
- 权限可以配置 `actions` 数组，存储可访问的action路径
- 支持通配符匹配：
  - `*`：匹配单层路径（如 `/admin/actions/user/*`）
  - `**`：匹配任意层级（如 `/admin/actions/**`）

### 4. 菜单（Menu）

- 菜单控制页面访问权限
- 菜单可以关联多个权限（通过 `permission` 字段）
- 菜单支持树形结构

---

## 数据结构

### 用户表（users）

```javascript
{
  id: String,              // 用户ID
  name: String,            // 用户名
  email: String,           // 邮箱
  role: Array<String>,     // 角色ID数组（支持向下兼容单一字符串）
  // ... 其他字段
}
```

### 角色表（roles）

```javascript
{
  role_id: String,         // 角色ID（唯一标识）
  role_name: String,       // 角色名称
  remark: String,          // 备注
  enable: Boolean,         // 是否启用
  permission: Array<String>, // 权限ID数组
  menu: Array<String>      // 菜单ID数组
}
```

### 权限表（permissions）

```javascript
{
  permission_id: String,   // 权限ID（唯一标识）
  permission_name: String, // 权限名称
  parent_id: String,       // 父级权限ID
  remark: String,          // 备注
  enable: Boolean,         // 是否启用
  sort: Number,            // 排序值
  curd_category: Number,   // CURD分类（0-5，单选）
  level: Number,           // 权限级别（0-4，单选）
  actions: Array<String>   // 可访问的action路径数组
}
```

### 菜单表（menus）

```javascript
{
  menu_id: String,         // 菜单ID
  name: String,            // 菜单名称
  parent_id: String,       // 父级菜单ID
  enable: Boolean,         // 是否启用
  sort: Number,            // 排序值
  permission: Array<String> // 关联的权限ID数组
}
```

---

## 功能模块

### 1. 数据访问层（SysDAO）

**文件位置**：`app/(admin)/actions/dao/sys.js`

**核心方法**：

#### 角色管理
- `findRoleById(roleId)` - 查询角色
- `roleBindPermissions({ roleId, permissionIds, reset })` - 角色绑定权限
- `roleBindMenus({ roleId, menuIds, reset, autoBindMenuPermissions })` - 角色绑定菜单

#### 权限管理
- `getPermissionTree({ pageIndex, pageSize, filters })` - 获取权限树
- `getAllChildPermissionIds(permissionId)` - 递归获取所有子权限ID
- `getActionsByPermissionIds(permissionIds)` - 获取权限的actions路径

#### 用户-角色关联
- `bindUserRoles({ userId, roleIds, reset })` - 用户绑定角色
- `getUserRoleIds(userId)` - 获取用户的角色ID数组
- `getUserPermissionIds(userId)` - 获取用户的所有权限ID
- `getUserMenus(userId)` - 获取用户的所有菜单

#### 权限验证
- `checkUserHasPermission(userId, permissionId)` - 检查用户是否有权限
- `checkUserHasActionPermission(userId, actionPath)` - 检查用户是否可访问action

### 2. Server Actions

#### 权限管理（admin-permissions.js）

```javascript
// 获取权限列表
getPermissionListAction({ pageIndex, pageSize, search, filters })

// 获取权限树（用于树形选择器）
getPermissionTreeForSelectAction({ withLabel })

// CRUD操作
createPermissionAction(data)
updatePermissionAction(permissionId, data)
deletePermissionAction(permissionId)

// Actions配置
updatePermissionActionsAction(permissionId, actions)
addActionToPermissionAction(permissionId, actionPath)
removeActionFromPermissionAction(permissionId, actionPath)
```

#### 角色管理（admin-roles.js）

```javascript
// 获取角色列表
getRoleListAction({ pageIndex, pageSize, search, filters })

// CRUD操作
createRoleAction(data)
updateRoleAction(roleId, data)
deleteRoleAction(roleId)

// 权限和菜单分配
roleBindPermissionsAction(roleId, permissionIds, reset)
roleBindMenusAction(roleId, menuIds, reset, autoBindMenuPermissions)
getRolePermissionsAction(roleId)
getRoleMenusAction(roleId)
```

#### 用户管理扩展（admin-users.js）

```javascript
// 用户角色绑定
bindUserRolesAction(userId, roleIds, reset)
getUserRolesAction(userId)
batchBindUserRolesAction(userIds, roleIds, reset)
```

### 3. 权限验证中间件

**文件位置**：`lib/permission-auth.js`

**核心方法**：

```javascript
// 检查用户是否有指定权限
checkPermission(requiredPermissionId)

// 检查用户是否可访问action
checkActionPermission(actionPath)

// 检查用户是否有任一权限（OR逻辑）
checkAnyPermission(permissionIds)

// 检查用户是否有所有权限（AND逻辑）
checkAllPermissions(permissionIds)

// 获取用户的所有权限
getUserPermissions()

// 获取用户的所有菜单
getUserMenus()

// 检查用户是否有角色
checkRole(requiredRoles)

// 增强版管理员检查（支持权限）
checkAdminOrPermission(requiredPermission)
```

### 4. 管理界面

#### 权限管理页面

**路径**：`/admin/permissions`

**功能**：
- 权限的CRUD操作
- 树形表格展示
- 父级权限选择（树形选择器）
- Actions路径配置（支持通配符）
- CURD分类和权限级别设置

#### 角色管理页面

**路径**：`/admin/roles`

**功能**：
- 角色的CRUD操作
- 为角色分配权限（树形多选）
- 为角色分配菜单（树形多选）
- 自动绑定菜单关联的权限

#### 用户管理页面（扩展）

**路径**：`/admin/users`

**新增功能**：
- 为用户分配角色（多选）
- 批量为用户分配角色

---

## 使用指南

### 1. 创建权限体系

**步骤**：

1. 访问 `/admin/permissions`
2. 创建顶级权限组（如 `user`、`order`、`product`）
3. 为每个权限组创建子权限（如 `user.create`、`user.view`、`user.edit`、`user.delete`）
4. 为叶子权限配置 `actions` 路径：
   - 完整路径：`/admin/actions/user/create`
   - 通配符：`/admin/actions/user/*`（匹配所有user相关actions）

**示例**：

```
用户管理 (user)
├── 创建用户 (user.create)
│   └── actions: ["/admin/actions/user/create"]
├── 查看用户 (user.view)
│   └── actions: ["/admin/actions/user/list", "/admin/actions/user/detail"]
├── 编辑用户 (user.edit)
│   └── actions: ["/admin/actions/user/update"]
└── 删除用户 (user.delete)
    └── actions: ["/admin/actions/user/delete"]
```

### 2. 创建角色

**步骤**：

1. 访问 `/admin/roles`
2. 点击「Create」创建新角色
3. 填写角色ID、名称、备注
4. 保存后，点击「Assign Permissions」分配权限
5. 点击「Assign Menus」分配菜单（可选择自动绑定菜单权限）

**示例角色**：

- **Editor（编辑员）**：拥有内容的创建和编辑权限
- **Viewer（查看员）**：只有查看权限
- **Manager（管理员）**：拥有完整的CRUD权限

### 3. 为用户分配角色

**步骤**：

1. 访问 `/admin/users`
2. 找到目标用户，点击「Assign Roles」
3. 勾选需要分配的角色
4. 保存

### 4. 在代码中使用权限验证

#### Server Action中验证权限

```javascript
'use server';

import { checkActionPermission } from '@/lib/permission-auth';

export async function createUserAction(data) {
  // 验证用户是否有权限执行此action
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

#### 页面中检查权限

```javascript
'use client';

import { useEffect, useState } from 'react';
import { getUserPermissions } from '@/lib/permission-auth';

export default function MyPage() {
  const [permissions, setPermissions] = useState([]);
  
  useEffect(() => {
    getUserPermissions().then(result => {
      if (result.success) {
        setPermissions(result.data);
      }
    });
  }, []);
  
  const canCreate = permissions.includes('user.create');
  
  return (
    <div>
      {canCreate && (
        <button>Create User</button>
      )}
    </div>
  );
}
```

#### 检查角色

```javascript
import { checkRole } from '@/lib/permission-auth';

export async function someAction() {
  const roleCheck = await checkRole(['admin', 'manager']);
  
  if (!roleCheck.hasRole) {
    return { success: false, error: 'Requires admin or manager role' };
  }
  
  // ...
}
```

---

## API文档

### 通配符匹配规则

权限的 `actions` 字段支持通配符，匹配规则如下：

| 模式 | 说明 | 示例 | 匹配 | 不匹配 |
|------|------|------|------|--------|
| `/admin/actions/user/create` | 精确匹配 | 完整路径 | `/admin/actions/user/create` | 其他路径 |
| `/admin/actions/user/*` | 单层通配 | user下的所有直接子路径 | `/admin/actions/user/create`<br>`/admin/actions/user/update` | `/admin/actions/user/role/assign` |
| `/admin/actions/**` | 多层通配 | admin/actions下的所有路径 | `/admin/actions/user/create`<br>`/admin/actions/order/list`<br>`/admin/actions/user/role/assign` | `/api/users` |

### CURD分类

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

### 1. 权限设计原则

- **最小权限原则**：用户只应该拥有完成工作所需的最小权限
- **分层设计**：使用树形结构组织权限，便于管理
- **语义化命名**：权限ID使用点号分隔（如 `user.create`）
- **粒度适中**：权限不宜过细也不宜过粗

### 2. 角色设计建议

- **职责清晰**：每个角色应该对应一个明确的职责
- **避免角色爆炸**：不要为每个用户创建单独的角色
- **组合使用**：通过组合多个角色实现复杂权限

### 3. 通配符使用建议

- **谨慎使用 `**`**：多层通配符权限范围太大，容易造成权限泄露
- **优先使用精确路径**：除非确实需要批量授权
- **定期审查**：定期检查使用通配符的权限配置

### 4. 安全建议

- **保护admin角色**：系统禁止删除和修改admin角色
- **审计日志**：记录所有权限相关的操作
- **定期审查**：定期审查用户权限，删除不必要的授权
- **防止权限提升**：普通用户不能给自己分配更高的权限

---

## 示例场景

### 场景1：内容管理系统

**权限结构**：

```
内容管理
├── 文章管理 (article)
│   ├── 创建文章 (article.create)
│   ├── 编辑文章 (article.edit)
│   ├── 删除文章 (article.delete)
│   └── 发布文章 (article.publish)
└── 评论管理 (comment)
    ├── 查看评论 (comment.view)
    ├── 删除评论 (comment.delete)
    └── 屏蔽用户 (comment.ban)
```

**角色配置**：

- **作者（Author）**：`article.create`, `article.edit`, `comment.view`
- **编辑（Editor）**：`article.*`, `comment.view`, `comment.delete`
- **管理员（Admin）**：所有权限

### 场景2：电商系统

**权限结构**：

```
订单管理 (order)
├── 查看订单 (order.view)
├── 处理订单 (order.process)
├── 退款 (order.refund)
└── 导出订单 (order.export)

商品管理 (product)
├── 查看商品 (product.view)
├── 上架商品 (product.publish)
├── 下架商品 (product.unpublish)
└── 删除商品 (product.delete)
```

**角色配置**：

- **客服（Support）**：`order.view`, `order.process`
- **财务（Finance）**：`order.view`, `order.refund`, `order.export`
- **运营（Operations）**：`product.*`, `order.view`

---

## 常见问题

### Q1: 用户同时有多个角色时，权限如何计算？

**A**: 用户的最终权限是所有角色权限的**并集**。例如，用户A有角色1和角色2，则用户A拥有角色1和角色2的所有权限。

### Q2: 如何给某个action添加权限保护？

**A**: 在Server Action中使用 `checkActionPermission` 验证：

```javascript
const permCheck = await checkActionPermission('/admin/actions/user/create');
if (!permCheck.hasPermission) {
  return { success: false, error: 'Permission denied' };
}
```

### Q3: admin角色和普通角色有什么区别？

**A**: `admin` 角色是特殊角色，自动拥有所有权限，且不能被删除或修改权限配置。

### Q4: 通配符 `*` 和 `**` 有什么区别？

**A**: 
- `*` 只匹配一层路径，如 `/admin/actions/user/*` 只匹配 `/admin/actions/user/create`，不匹配 `/admin/actions/user/role/assign`
- `**` 匹配任意层级，如 `/admin/actions/**` 匹配所有 `/admin/actions/` 下的路径

### Q5: 如何实现"自己只能编辑自己的数据"？

**A**: 在Server Action中检查用户ID：

```javascript
export async function updateUserAction(userId, data) {
  const permCheck = await checkActionPermission('/admin/actions/user/update');
  
  if (!permCheck.hasPermission) {
    // 检查是否是编辑自己
    if (permCheck.userId !== userId) {
      return { success: false, error: 'You can only edit your own profile' };
    }
  }
  
  // ...
}
```

---

## 更新日志

### v1.0.0 (2025-01-XX)

- ✅ 完成RBAC核心功能
- ✅ 实现用户-角色多对多关系
- ✅ 实现角色-权限-菜单关联
- ✅ 实现权限树形结构
- ✅ 实现通配符权限匹配
- ✅ 完成管理界面（权限、角色、用户）
- ✅ 完成权限验证中间件

---

## 技术栈

- **数据库**：MongoDB
- **后端框架**：Next.js Server Actions
- **前端框架**：React + Ant Design
- **权限模型**：RBAC（基于角色的访问控制）

---

## 贡献者

- **开发者**：[Your Name]
- **文档编写**：[Your Name]

---

## 许可证

MIT License

