# 管理员权限验证系统

## 概述

项目已实现完整的管理员权限验证系统，确保只有 `role === 'admin'` 的用户才能访问管理后台。

## 权限验证函数

所有权限验证函数位于 `lib/admin-auth.js`：

### 1. `checkAdmin()` - 用于页面/Layout

```js
import { checkAdmin } from '@/lib/admin/admin-auth';

export default async function AdminLayout({ children }) {
  // 自动验证管理员权限，非管理员会被重定向
  await checkAdmin();
  
  return <div>{children}</div>;
}
```

**特点**:
- ❌ 未登录 → 重定向到 `/en/login?error=unauthorized`
- ❌ 非管理员 → 重定向到 `/en?error=forbidden`
- ✅ 管理员 → 返回 session 对象

---

### 2. `checkAdminAction()` - 用于 Server Actions

```js
'use server';
import { checkAdminAction } from '@/lib/admin/admin-auth';

export async function adminAction() {
  const adminCheck = await checkAdminAction();
  
  if (!adminCheck.isAdmin) {
    return {
      success: false,
      error: adminCheck.error,
    };
  }
  
  // 执行管理员操作...
  return { success: true };
}
```

**特点**:
- 返回对象：`{ isAdmin: boolean, error?: string, userId?: string, user?: object }`
- 不会重定向，适合 API/Server Actions
- 可获取管理员用户信息

---

### 3. `isAdmin()` - 检查权限（不抛错）

```js
import { isAdmin } from '@/lib/admin/admin-auth';

export async function MyComponent() {
  const hasAdminAccess = await isAdmin();
  
  if (hasAdminAccess) {
    // 显示管理员功能
  }
}
```

**特点**:
- 返回 `boolean`
- 不会重定向或抛错
- 适合条件渲染

---

### 4. `getAdminSession()` - 获取管理员 Session

```js
import { getAdminSession } from '@/lib/admin/admin-auth';

export default async function AdminPage() {
  const session = await getAdminSession();
  
  return <div>Welcome, {session.user.name}</div>;
}
```

**特点**:
- 等同于 `checkAdmin()`
- 返回完整的 session 对象

---

## 使用场景

### ✅ 正确示例

#### 管理后台 Layout

```js
// app/(admin)/layout.js
import { checkAdmin } from '@/lib/admin/admin-auth';

export default async function AdminLayout({ children }) {
  // 在 Layout 层面验证，所有子页面自动受保护
  await checkAdmin();
  
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

#### 管理员 Server Action

```js
// app/(admin)/actions/admin-users.js
'use server';
import { checkAdminAction } from '@/lib/admin/admin-auth';

export async function updateUserRole(userId, role) {
  const adminCheck = await checkAdminAction();
  
  if (!adminCheck.isAdmin) {
    return {
      success: false,
      error: adminCheck.error,
    };
  }
  
  // 执行更新操作...
  return { success: true };
}
```

#### 条件渲染管理员功能

```jsx
'use client';
import { isAdmin } from '@/lib/admin/admin-auth';
import { useEffect, useState } from 'react';

export function AdminButton() {
  const [showAdmin, setShowAdmin] = useState(false);
  
  useEffect(() => {
    isAdmin().then(setShowAdmin);
  }, []);
  
  if (!showAdmin) return null;
  
  return <button>Admin Only</button>;
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
用户访问 /admin
    ↓
AdminLayout 调用 checkAdmin()
    ↓
检查 session
    ├─ 未登录 → 重定向到 /en/login?error=unauthorized
    ├─ 非管理员 → 重定向到 /en?error=forbidden
    └─ 是管理员 → ✅ 允许访问
```

### Server Action 流程

```
客户端调用 adminAction()
    ↓
Server Action 调用 checkAdminAction()
    ↓
检查 session
    ├─ 未登录 → 返回 { isAdmin: false, error: 'Unauthorized' }
    ├─ 非管理员 → 返回 { isAdmin: false, error: 'Forbidden' }
    └─ 是管理员 → 返回 { isAdmin: true, userId, user }
```

---

## 当前实现状态

### ✅ 已保护

- `app/(admin)/layout.js` - 在 Layout 层面验证
- `app/(admin)/actions/*.js` - 所有 Server Actions 已验证

### 工作原理

1. **Layout 保护**: 
   - `app/(admin)/layout.js` 调用 `checkAdmin()`
   - 所有 `/admin/*` 路由自动受保护

2. **Action 保护**:
   - 每个 Admin Action 调用 `checkAdminAction()`
   - 防止直接调用 API 绕过页面验证

3. **双重验证**:
   - 页面访问被 Layout 阻止
   - API 调用被 Action 阻止
   - 确保安全性

---

## 角色管理

### 查看用户角色

```js
import { auth } from '@/lib/auth';

const session = await auth.api.getSession({ headers: await headers() });
console.log(session.user.role); // 'user' 或 'admin'
```

### 更新用户角色

使用 `updateUserRole` 函数：

```js
import { updateUserRole } from '@/lib/user-profile';

// 将用户设为管理员
await updateUserRole(userId, 'admin');

// 将用户设为普通用户
await updateUserRole(userId, 'user');
```

### 允许的角色

- `user` - 普通用户（默认）
- `admin` - 管理员

---

## 测试权限

### 测试非管理员访问

1. 以普通用户登录
2. 访问 `/admin`
3. 应该被重定向到首页并显示 `error=forbidden`

### 测试未登录访问

1. 退出登录
2. 访问 `/admin`
3. 应该被重定向到登录页并显示 `error=unauthorized`

### 测试管理员访问

1. 以管理员身份登录
2. 访问 `/admin`
3. ✅ 正常访问管理后台

---

## 最佳实践

1. **Layout 层验证**: 在 Layout 中验证，保护所有子路由
2. **Action 层验证**: 每个 Admin Action 都要验证
3. **双重保护**: 页面 + API 都要验证
4. **明确错误**: 使用清晰的错误消息
5. **记录日志**: 记录未授权访问尝试（可选）

---

## 安全建议

1. ✅ **永远在服务端验证** - 不要相信客户端验证
2. ✅ **最小权限原则** - 只给必要的人管理员权限
3. ✅ **审计日志** - 记录管理员操作（推荐）
4. ✅ **定期检查** - 定期审查管理员账户
5. ✅ **Session 过期** - 合理设置 session 过期时间

---

## 相关文档

- [权限系统文档](./PERMISSIONS.md)
- [认证系统文档](./AUTH.md)
- [Server Actions 文档](./SERVER_ACTIONS.md)

