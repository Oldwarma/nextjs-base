# 后台权限验证系统

## 概述

项目实现了分层权限验证系统，支持两种后台访问方式：

1. **Admin 角色**：唯一的超级管理员，拥有所有后台权限（页面 + Actions）
2. **User + RBAC**：普通用户通过 `isBackendAllowed` 标识获得后台访问权限，再通过 RBAC 系统控制细粒度权限

## 权限架构

```
后台访问权限
├─ Admin 角色 (role === 'admin')
│  └─ 自动拥有所有权限，绕过 RBAC 检查
│
└─ User 角色 (role === 'user')
   ├─ isBackendAllowed = false → ❌ 无法访问后台
   └─ isBackendAllowed = true → 可以访问后台
      └─ 通过 RBAC 控制：
         ├─ 菜单权限（页面访问）
         ├─ 操作权限（Actions）
         └─ 数据权限（基于角色）
```

## 权限验证函数

所有权限验证函数位于 `lib/auth/admin-auth.js`：

### 1. `checkBackendAccess()` - 检查后台访问权限（页面/Layout）

```js
import { checkBackendAccess } from '@/lib/auth/admin-auth';

export default async function AdminLayout({ children }) {
  // 验证后台访问权限：admin 或 user + isBackendAllowed
  const session = await checkBackendAccess();
  
  return <div>{children}</div>;
}
```

**验证逻辑**:
- ❌ 未登录 → 重定向到 `/en/login?error=unauthorized`
- ❌ 非 admin 且 `isBackendAllowed = false` → 重定向到 `/en?error=forbidden`
- admin 角色 → 通过（拥有所有权限）
- user + `isBackendAllowed = true` → 通过（需要 RBAC 检查）

---

### 2. `checkBackendAccessAction()` - 后台访问权限（Server Actions）

```js
'use server';
import { checkBackendAccessAction } from '@/lib/auth/admin-auth';

export async function backendAction() {
  const result = await checkBackendAccessAction();
  
  if (!result.hasAccess) {
    return {
      success: false,
      error: result.error,
    };
  }
  
  // 检查是否是 admin（如果需要区分）
  if (result.isAdmin) {
    // Admin 特殊逻辑
  } else {
    // User 需要进一步 RBAC 检查
  }
  
  return { success: true };
}
```

**返回格式**:
```js
{
  hasAccess: boolean,     // 是否有后台访问权限
  isAdmin: boolean,       // 是否是 admin 角色
  userId: string,         // 用户 ID
  user: object,          // 完整用户对象
  error?: string         // 错误信息（如果 hasAccess = false）
}
```

---

### 3. `checkIsAdmin()` - 仅检查 admin 角色（页面）

用于需要真正 admin 权限的页面（如 RBAC 配置、系统设置）：

```js
import { checkIsAdmin } from '@/lib/auth/admin-auth';

export default async function SystemSettingsPage() {
  // 必须是 admin 角色
  await checkIsAdmin();
  
  return <div>System Settings</div>;
}
```

**验证逻辑**:
- ❌ 未登录 → 重定向到 `/en/login?error=unauthorized`
- ❌ 非 admin 角色 → 重定向到 `/en?error=forbidden&reason=admin_only`
- admin 角色 → 通过

---

### 4. `checkIsAdminAction()` - 仅检查 admin 角色（Actions）

```js
'use server';
import { checkIsAdminAction } from '@/lib/auth/admin-auth';

export async function updateSystemConfig() {
  const result = await checkIsAdminAction();
  
  if (!result.isAdmin) {
    return {
      success: false,
      error: result.error,
    };
  }
  
  // 执行 admin 专属操作
  return { success: true };
}
```

---

### 5. 辅助函数

#### `isAdmin()` - 检查是否为 admin（不抛错）

```js
import { isAdmin } from '@/lib/auth/admin-auth';

export async function MyComponent() {
  const isAdminUser = await isAdmin();
  
  if (isAdminUser) {
    // 显示 admin 专属功能
  }
}
```

#### `hasBackendAccess()` - 检查后台访问权限（不抛错）

```js
import { hasBackendAccess } from '@/lib/auth/admin-auth';

const canAccessBackend = await hasBackendAccess();
// 返回 true/false
```

---

### 向后兼容

为保持兼容性，以下函数仍可使用但已标记为 `@deprecated`：

- `checkAdmin()` → 使用 `checkBackendAccess()`
- `checkAdminAction()` → 使用 `checkBackendAccessAction()`
- `getAdminSession()` → 使用 `checkBackendAccess()`

---

## 使用场景

### 正确示例

#### 场景 1: 后台 Layout（支持 admin 和有权限的 user）

```js
// app/(admin)/layout.js
import { checkBackendAccess } from '@/lib/auth/admin-auth';

export default async function AdminLayout({ children }) {
  // 验证后台访问权限：admin 或 isBackendAllowed
  const session = await checkBackendAccess();
  
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

#### 场景 2: Admin 专属页面（RBAC 配置等）

```js
// app/(admin)/admin/rbac/roles/page.js
import { checkIsAdmin } from '@/lib/auth/admin-auth';

export default async function RolesManagementPage() {
  // 只有 admin 才能配置 RBAC
  await checkIsAdmin();
  
  return <div>Roles Management</div>;
}
```

#### 场景 3: 使用 wrapAdminAction（自动处理权限）

```js
// app/(admin)/actions/content-actions.js
'use server';
import { wrapAdminAction } from '@/lib/core/action-wrapper';

// 默认：admin 和有后台权限的 user 都可以访问
export const getContentList = wrapAdminAction(
  'query',
  'content',
  async (params, { userId, isAdmin }) => {
    // isAdmin = true → admin 角色
    // isAdmin = false → user + isBackendAllowed
    
    const contents = await fetchContents(params);
    return { success: true, data: contents };
  }
);

// 要求 admin 角色
export const deleteAllContent = wrapAdminAction(
  'delete',
  'content',
  async (params, { userId }) => {
    await deleteAllContentFromDB();
    return { success: true };
  },
  { requireAdmin: true } // 只有 admin 可以执行
);

// 带 RBAC 权限检查
export const publishContent = wrapAdminAction(
  'update',
  'content',
  async (contentId, { userId, isAdmin }) => {
    await publishContentInDB(contentId);
    return { success: true };
  },
  { permissionId: 'content:publish' } // 非 admin 需要此权限
);
```

#### 场景 4: 手动检查权限

```js
'use server';
import { checkBackendAccessAction } from '@/lib/auth/admin-auth';

export async function customAction() {
  const result = await checkBackendAccessAction();
  
  if (!result.hasAccess) {
    return { success: false, error: result.error };
  }
  
  // Admin 自动通过
  if (result.isAdmin) {
    // 执行操作
    return { success: true };
  }
  
  // User 需要额外的 RBAC 检查
  const { checkUserHasPermission } = await import('@/app/(admin)/actions/dao/sys');
  const hasPermission = await checkUserHasPermission(result.userId, 'custom:action');
  
  if (!hasPermission) {
    return { success: false, error: 'Permission denied' };
  }
  
  // 执行操作
  return { success: true };
}
```

#### 场景 5: 条件渲染

```jsx
'use client';
import { isAdmin, hasBackendAccess } from '@/lib/auth/admin-auth';
import { useEffect, useState } from 'react';

export function BackendFeatureButton() {
  const [canAccess, setCanAccess] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  
  useEffect(() => {
    Promise.all([
      hasBackendAccess(),
      isAdmin()
    ]).then(([access, admin]) => {
      setCanAccess(access);
      setIsAdminUser(admin);
    });
  }, []);
  
  if (!canAccess) return null;
  
  return (
    <button>
      {isAdminUser ? 'Admin Feature' : 'Backend Feature'}
    </button>
  );
}
```

---

### ❌ 错误示例

#### ❌ 忘记验证权限

```js
// ❌ 错误：任何人都能访问
export default function AdminDashboard() {
  return <div>Admin Panel</div>;
}
```

#### ❌ 在客户端组件验证

```jsx
// ❌ 错误：客户端验证不安全
'use client';
export function AdminPage() {
  const user = useUser();
  if (user.role !== 'admin') return <div>Forbidden</div>;
  
  return <div>Admin Panel</div>;
}
```

**正确做法**: 在服务端 Layout 验证

---

## 权限流程

### 页面访问流程

```
用户访问 /admin/xxx
    ↓
AdminLayout 调用 checkBackendAccess()
    ↓
检查 session.user
    ├─ 未登录 → 重定向到 /en/login?error=unauthorized
    └─ 已登录 → 检查后台访问权限
         ↓
检查 role 和 isBackendAllowed
    ├─ role === 'admin' → 通过（拥有所有权限）
    ├─ role === 'user' && isBackendAllowed === true → 通过，进入 RBAC 检查
    └─ role === 'user' && isBackendAllowed === false → ❌ 重定向到 /en?error=forbidden
         ↓
【RBAC 页面权限检查】PageAccessGuard
    ├─ isAdmin === true → 自动通过
    └─ isAdmin === false → 检查用户菜单权限
         ├─ 有该页面的菜单权限 → 显示页面
         └─ 无该页面的菜单权限 → ❌ 显示 403
```

### Server Action 流程

```
客户端调用 wrapAdminAction()
    ↓
检查 options.requireAdmin
    ├─ requireAdmin === true → 调用 checkIsAdminAction()
    │    ├─ 非 admin → 返回 { success: false, error }
    │    └─ admin → 继续执行
    │
    └─ requireAdmin === false → 调用 checkBackendAccessAction()
         ├─ 未登录 → 返回 { hasAccess: false, error: 'Unauthorized' }
         ├─ 无后台权限 → 返回 { hasAccess: false, error: 'Forbidden' }
         └─ 有后台权限 → 继续
              ↓
检查 options.permissionId（仅对非 admin）
    ├─ isAdmin === true → 自动通过，执行 handler
    ├─ permissionId 未设置 → 通过，执行 handler
    └─ isAdmin === false && permissionId 已设置
         ├─ 调用 checkUserHasPermission(userId, permissionId)
         │    ├─ 有权限 → 执行 handler
         │    └─ 无权限 → ❌ 返回 { success: false, error }
         └─
              ↓
执行 handler(...args, { userId, isAdmin })
    ↓
返回结果 + 记录日志
```

---

## 当前实现状态

### 已实现

1. **Layout 层保护**:
   - `app/(admin)/layout.js` 调用 `checkBackendAccess()`
   - 支持 admin 和 `isBackendAllowed` 用户访问
   - 所有 `/admin/*` 路由自动受保护

2. **Action 层保护**:
   - 使用 `wrapAdminAction()` 自动包装
   - 支持 `requireAdmin` 选项（强制 admin）
   - 支持 `permissionId` 选项（RBAC 权限检查）
   - 自动记录操作日志

3. **页面级 RBAC**:
   - `PageAccessGuard` 组件检查菜单权限
   - Admin 自动通过
   - User 根据 RBAC 角色检查页面访问权限

4. **BaseDAO 支持**:
   - 默认检查后台访问权限
   - 可配置 `requireAdmin: true` 强制 admin
   - 适用于所有数据访问层

### 三层防护机制

```
┌─────────────────────────────────────┐
│  第一层：Layout 层                    │
│  checkBackendAccess()               │
│  - 阻止未登录用户                     │
│  - 阻止无后台权限用户                 │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  第二层：页面权限守卫                 │
│  PageAccessGuard                    │
│  - Admin 自动通过                    │
│  - User 检查 RBAC 菜单权限           │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  第三层：Action 权限验证              │
│  wrapAdminAction / BaseDAO          │
│  - requireAdmin 检查                │
│  - RBAC permissionId 检查           │
└─────────────────────────────────────┘
```

---

## 用户字段说明

### Better Auth 角色字段

- **`role`**: `'admin' | 'user'`
  - Better Auth 的基础角色字段
  - `admin`: 超级管理员，拥有所有权限
  - `user`: 普通用户（默认）

### 后台访问控制字段

- **`isBackendAllowed`**: `boolean`
  - 控制 user 角色是否能访问后台
  - `true`: 允许访问后台（需 RBAC 权限）
  - `false`: 不允许访问后台（默认）
  - ⚠️ 对 admin 角色无效（admin 始终能访问）

### RBAC 角色字段

- **`roles`**: `Array<string>`
  - RBAC 系统的角色 ID 数组
  - 用于细粒度权限控制
  - 示例: `['editor', 'moderator']`

### 示例数据

```js
// Admin 用户
{
  id: 'admin-001',
  email: 'admin@example.com',
  role: 'admin',              // Better Auth 角色
  isBackendAllowed: true,     // 自动设为 true（可选）
  roles: []                   // RBAC 角色（admin 不需要）
}

// 有后台权限的 User
{
  id: 'user-001',
  email: 'editor@example.com',
  role: 'user',               // Better Auth 角色
  isBackendAllowed: true,     // 允许访问后台
  roles: ['editor', 'writer'] // RBAC 角色
}

// 普通 User（无后台权限）
{
  id: 'user-002',
  email: 'customer@example.com',
  role: 'user',
  isBackendAllowed: false,    // 不能访问后台
  roles: []
}
```

## 如何授予后台权限

### 方法 1: 直接更新数据库

```js
import { prisma } from '@/lib/database/prisma';

const usersCollection = await prisma('users');

// 授予用户后台访问权限
await usersCollection.update(
  { id: userId },
  { 
    $set: { 
      isBackendAllowed: true,
      updatedAt: new Date()
    } 
  }
);

// 同时绑定 RBAC 角色
import { bindUserRoles } from '@/app/(admin)/actions/dao/sys';
await bindUserRoles({
  userId,
  roles: ['editor', 'moderator'],
  reset: true
});
```

### 方法 2: 使用管理后台（推荐）

在用户管理页面：
1. 编辑用户
2. 勾选 "Backend Access Allowed"
3. 选择 RBAC 角色
4. 保存

---

## 测试权限

### 场景 1: 测试未登录访问

1. 退出登录
2. 访问 `/admin`
3. 应该被重定向到 `/en/login?error=unauthorized`

### 场景 2: 测试无后台权限的 User

1. 以普通用户登录（`isBackendAllowed = false`）
2. 访问 `/admin`
3. 应该被重定向到 `/en?error=forbidden`

### 场景 3: 测试有后台权限的 User（RBAC）

1. 以有后台权限的用户登录（`isBackendAllowed = true`）
2. 访问 `/admin` → 可以进入后台
3. 访问有菜单权限的页面 → 正常显示
4. 访问无菜单权限的页面 → 显示 403

### 场景 4: 测试 Admin 访问

1. 以 admin 身份登录
2. 访问 `/admin` 下任何页面 → 全部可访问
3. 执行任何 Action → 全部可执行

### 场景 5: 测试 RBAC 权限

1. 创建测试角色，分配部分菜单权限
2. 将用户绑定到该角色，设置 `isBackendAllowed = true`
3. 登录该用户，验证：
   - 可以访问被授权的页面
   - ❌ 不能访问未授权的页面（显示 403）

---

## 最佳实践

### 1. 权限分层设计

- **Layout 层**: 统一验证后台访问权限
- **页面层**: RBAC 菜单权限检查（非 admin）
- **Action 层**: 操作权限检查（可选 RBAC）
- **数据层**: BaseDAO 权限验证

### 2. Admin 角色管理

- Admin 只设一个，用于系统维护
- 不要随意将用户提升为 admin
- 使用 RBAC 为普通用户分配后台权限

### 3. RBAC 权限设计

- 创建角色（如：editor, moderator, viewer）
- 为角色分配菜单和操作权限
- 将用户绑定到角色
- 设置 `isBackendAllowed = true`

### 4. Action 权限控制

```js
// 普通后台操作（admin + 有权限的 user）
export const getList = wrapAdminAction('query', 'resource', handler);

// 需要特定权限的操作
export const publish = wrapAdminAction('update', 'content', handler, {
  permissionId: 'content:publish'
});

// 仅 Admin 可执行
export const dangerousAction = wrapAdminAction('delete', 'system', handler, {
  requireAdmin: true
});
```

### 5. 代码规范

- **永远在服务端验证** - 客户端验证不安全
- **使用 wrapAdminAction** - 自动处理权限和日志
- **明确权限要求** - 注释说明需要什么权限
- **记录操作日志** - 使用 action-logger
- **错误信息清晰** - 便于调试和用户理解

---

## 安全建议

### 基础安全

1. **服务端验证** - 永远不要只在客户端验证
2. **最小权限原则** - 只给必要的权限
3. **定期审计** - 检查用户权限分配
4. **Session 管理** - 合理设置过期时间

### RBAC 安全

1. **角色隔离** - 不同角色不重叠权限
2. **权限继承** - 合理设计权限层级
3. **动态检查** - 运行时检查权限，不缓存
4. **日志记录** - 记录所有权限变更

### Admin 安全

1. **唯一 Admin** - 系统中只有一个 admin
2. **强密码** - Admin 账号使用强密码
3. **双因素认证** - 考虑启用 2FA（推荐）
4. **IP 限制** - 限制 Admin 登录 IP（可选）

---

## 相关文档

- [权限系统文档](./PERMISSIONS.md)
- [认证系统文档](./AUTH.md)
- [Server Actions 文档](./SERVER_ACTIONS.md)

