# RBAC 权限管理快速参考

> 快速查询常用的 RBAC 权限验证代码

---

## 📦 导入

```javascript
// Server Actions 权限验证
import { 
  checkActionPermission,
  checkPermission,
  checkRole,
  checkAnyPermission,
  checkAllPermissions,
  getUserPermissions,
  getUserMenus
} from '@/lib/permission-auth';

// 页面访问控制
import { 
  checkPageAccess,
  canAccessPage,
  checkAdminOrPermission 
} from '@/lib/page-auth';

// 前端 Hooks
import { 
  usePermission,
  usePageAccess,
  useUserMenus 
} from '@/hooks/use-permission';

// User Permission Actions (客户端调用)
import {
  getUserAccessibleMenusAction,
  getUserPermissionIdsAction,
  checkPageAccessAction,
  getUserRolesAction
} from '@/app/(admin)/actions/rbac/user-permissions';
```

---

## 🔐 Server Actions 权限验证

### 1. 基于 Action 路径验证（最常用）

```javascript
'use server';

import { checkActionPermission } from '@/lib/permission-auth';

export async function createUserAction(data) {
  // ✅ 验证权限
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

### 2. 基于权限 ID 验证

```javascript
import { checkPermission } from '@/lib/permission-auth';

const permCheck = await checkPermission('user-create-permission-id');

if (!permCheck.hasPermission) {
  return { success: false, error: 'Permission denied' };
}
```

### 3. 基于角色验证

```javascript
import { checkRole } from '@/lib/permission-auth';

const roleCheck = await checkRole('admin');

if (!roleCheck.hasRole) {
  return { success: false, error: 'Admin role required' };
}
```

### 4. 多权限验证（OR 逻辑）

```javascript
import { checkAnyPermission } from '@/lib/permission-auth';

const permCheck = await checkAnyPermission([
  'user-create',
  'user-manage',
  'admin-all'
]);

if (!permCheck.hasPermission) {
  return { success: false, error: 'Need at least one permission' };
}
```

### 5. 多权限验证（AND 逻辑）

```javascript
import { checkAllPermissions } from '@/lib/permission-auth';

const permCheck = await checkAllPermissions([
  'user-read',
  'user-write',
  'user-delete'
]);

if (!permCheck.hasPermission) {
  return { 
    success: false, 
    error: `Missing permission: ${permCheck.missingPermission}` 
  };
}
```

---

## 🚪 页面访问控制

### 服务端页面保护

```javascript
// app/(admin)/admin/users/page.js
import { checkPageAccess } from '@/lib/page-auth';

export default async function UsersPage() {
  // ✅ 验证页面访问权限（无权限会自动重定向）
  await checkPageAccess('/admin/users');

  return (
    <div>
      <h1>Users Management</h1>
      {/* 页面内容 */}
    </div>
  );
}
```

### 客户端页面保护

```javascript
'use client';

import { usePageAccess } from '@/hooks/use-permission';
import { Alert, Spin } from 'antd';

export default function UsersPage() {
  const { hasAccess, loading } = usePageAccess('/admin/users');

  if (loading) return <Spin />;
  if (!hasAccess) return <Alert message="Access Denied" type="error" />;

  return (
    <div>
      <h1>Users Management</h1>
      {/* 页面内容 */}
    </div>
  );
}
```

---

## 🎨 前端权限控制

### usePermission Hook

```javascript
'use client';

import { usePermission } from '@/hooks/use-permission';
import { Button } from 'antd';

export default function MyComponent() {
  const { 
    permissions,        // 权限 ID 数组
    isAdmin,            // 是否管理员
    loading,            // 加载状态
    hasPermission,      // 检查单个权限
    hasAnyPermission,   // 检查多个权限之一
    hasAllPermissions   // 检查所有权限
  } = usePermission();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* 1. 根据单个权限显示 */}
      {hasPermission('user-create') && (
        <Button type="primary">Create</Button>
      )}

      {/* 2. 根据多个权限之一显示（OR） */}
      {hasAnyPermission(['user-create', 'user-manage']) && (
        <Button>Edit</Button>
      )}

      {/* 3. 需要所有权限（AND） */}
      {hasAllPermissions(['user-read', 'user-write']) && (
        <Button>Advanced</Button>
      )}

      {/* 4. Admin 专属 */}
      {isAdmin && (
        <Button danger>Admin Only</Button>
      )}

      {/* 5. 禁用而不是隐藏 */}
      <Button disabled={!hasPermission('user-delete')}>
        Delete
      </Button>
    </div>
  );
}
```

---

## 🗂️ 获取用户权限信息

### 获取用户菜单

```javascript
'use client';

import { useUserMenus } from '@/hooks/use-permission';

export default function MyComponent() {
  const { menus, loading, error } = useUserMenus();

  if (loading) return <div>Loading menus...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {menus.map(menu => (
        <div key={menu.id}>{menu.name}</div>
      ))}
    </div>
  );
}
```

### 获取用户权限列表

```javascript
'use client';

import { usePermission } from '@/hooks/use-permission';

export default function MyComponent() {
  const { permissions, isAdmin } = usePermission();

  return (
    <div>
      <p>Admin: {isAdmin ? 'Yes' : 'No'}</p>
      <p>Permissions: {permissions.join(', ')}</p>
    </div>
  );
}
```

---

## 🔄 复杂场景示例

### 1. 用户可以编辑自己的数据

```javascript
'use server';

import { checkActionPermission } from '@/lib/permission-auth';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function updateUserAction(userId, data) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  // 允许用户编辑自己的数据
  if (session.user.id === userId) {
    // 执行更新
    return { success: true };
  }
  
  // 编辑其他用户需要权限
  const permCheck = await checkActionPermission('/admin/actions/user/update');
  if (!permCheck.hasPermission) {
    return { success: false, error: 'Permission denied' };
  }
  
  // 执行更新
  return { success: true };
}
```

### 2. 条件渲染多个权限组合

```javascript
'use client';

import { usePermission } from '@/hooks/use-permission';
import { Alert } from 'antd';

export default function MyComponent() {
  const { hasPermission, hasAllPermissions } = usePermission();

  // 场景1: 编辑权限（创建或更新权限之一）
  const canEdit = hasPermission('user-create') || hasPermission('user-update');

  // 场景2: 管理权限（需要所有权限）
  const canManage = hasAllPermissions(['user-read', 'user-write', 'user-delete']);

  return (
    <div>
      {canEdit && <Alert message="You can edit" type="success" />}
      {canManage && <Alert message="You can manage" type="warning" />}
    </div>
  );
}
```

### 3. 动态权限检查

```javascript
'use client';

import { useState } from 'react';
import { usePermission } from '@/hooks/use-permission';
import { Button, message } from 'antd';

export default function MyComponent() {
  const { hasPermission } = usePermission();
  const [loading, setLoading] = useState(false);

  const handleAction = async (action) => {
    // 运行时检查权限
    const permissionMap = {
      create: 'user-create',
      update: 'user-update',
      delete: 'user-delete',
    };

    if (!hasPermission(permissionMap[action])) {
      message.error('You do not have permission for this action');
      return;
    }

    setLoading(true);
    // 执行操作
    setLoading(false);
  };

  return (
    <div>
      <Button onClick={() => handleAction('create')} loading={loading}>
        Create
      </Button>
      <Button onClick={() => handleAction('update')} loading={loading}>
        Update
      </Button>
      <Button onClick={() => handleAction('delete')} loading={loading}>
        Delete
      </Button>
    </div>
  );
}
```

---

## 📊 权限返回值结构

### checkActionPermission / checkPermission

```javascript
{
  hasPermission: boolean,
  userId: string,
  user: object,
  error?: string
}
```

### checkRole

```javascript
{
  hasRole: boolean,
  userId: string,
  user: object,
  userRoles: string[],
  error?: string
}
```

### checkAnyPermission

```javascript
{
  hasPermission: boolean,
  userId: string,
  user: object,
  matchedPermission?: string,  // 匹配到的权限 ID
  error?: string
}
```

### checkAllPermissions

```javascript
{
  hasPermission: boolean,
  userId: string,
  user: object,
  missingPermission?: string,  // 缺失的权限 ID
  error?: string
}
```

---

## ⚠️ 常见错误

### 1. 忘记验证权限

```javascript
// ❌ 错误：没有权限验证
export async function deleteUserAction(userId) {
  // 直接执行删除
  await deleteUser(userId);
}

// ✅ 正确：添加权限验证
export async function deleteUserAction(userId) {
  const permCheck = await checkActionPermission('/admin/actions/user/delete');
  if (!permCheck.hasPermission) {
    return { success: false, error: 'Permission denied' };
  }
  await deleteUser(userId);
}
```

### 2. 只在前端验证

```javascript
// ❌ 错误：只在前端隐藏按钮
{hasPermission('user-delete') && (
  <Button onClick={deleteUser}>Delete</Button>
)}

// Server Action 没有权限验证
export async function deleteUserAction(userId) {
  await deleteUser(userId);  // 危险！可以直接调用
}

// ✅ 正确：前后端都验证
{hasPermission('user-delete') && (
  <Button onClick={deleteUser}>Delete</Button>
)}

export async function deleteUserAction(userId) {
  const permCheck = await checkActionPermission('/admin/actions/user/delete');
  if (!permCheck.hasPermission) {
    return { success: false, error: 'Permission denied' };
  }
  await deleteUser(userId);
}
```

### 3. 权限路径不匹配

```javascript
// ❌ 错误：Action 路径不匹配权限配置
// 权限配置: actions: ["/admin/actions/user/*"]
const permCheck = await checkActionPermission('/actions/user/create');  // 路径错误

// ✅ 正确：路径匹配权限配置
const permCheck = await checkActionPermission('/admin/actions/user/create');
```

---

## 🔗 相关文档

- [RBAC 实现指南](./RBAC_IMPLEMENTATION_GUIDE.md) - 完整技术文档
- [RBAC 系统配置指南](../admin/RBAC_SYSTEM.md) - 管理员配置指南

---

## 💡 快速提示

1. **Admin 角色拥有所有权限**，无需额外配置
2. **前端权限控制**是为了用户体验，**后端验证**是为了安全
3. 使用 **Action 路径验证**是最常用和推荐的方式
4. 权限路径支持 `*`（单层）和 `**`（多层）通配符
5. 使用 `usePermission` Hook 会**自动缓存**权限，避免重复请求

---

MIT License

