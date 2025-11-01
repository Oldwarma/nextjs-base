# Actions 权限判断机制

## 概述

本项目的 Server Actions 采用两级权限验证机制：
1. **用户认证** - 验证用户是否已登录
2. **角色授权** - 验证用户是否有操作权限

## 权限级别

### 1. 普通用户权限（Client Actions）

位置：`app/(client)/actions/`

**权限要求**：仅需要用户登录

**验证方式**：
```javascript
const session = await auth.api.getSession({ headers: await headers() });

if (!session) {
  return {
    success: false,
    error: 'Unauthorized',
  };
}

// 验证通过，可以访问 session.user.id
```

**适用场景**：
- 查询自己的数据
- 修改自己的资料
- 使用付费功能
- 查看自己的记录

### 2. 管理员权限（Admin Actions）

位置：`app/(admin)/actions/`

**权限要求**：必须是管理员角色

**验证方式**：
```javascript
async function checkAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });

  // 第一层：检查是否登录
  if (!session) {
    return { isAdmin: false, error: 'Unauthorized' };
  }

  // 第二层：检查是否是管理员
  if (session.user.role !== 'admin') {
    return { isAdmin: false, error: 'Forbidden: Admin access required' };
  }

  return { isAdmin: true, userId: session.user.id };
}
```

**使用示例**：
```javascript
export async function someAdminAction() {
  const adminCheck = await checkAdmin();
  
  if (!adminCheck.isAdmin) {
    return {
      success: false,
      error: adminCheck.error,
    };
  }

  // 验证通过，执行管理员操作
}
```

**适用场景**：
- 管理用户（查看/编辑/删除）
- 调整用户积分
- 管理套餐配置
- 查看全局统计
- 修改功能价格

## 权限验证流程图

```
┌─────────────────────────────────────────────┐
│         用户调用 Server Action              │
└────────────────┬────────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │ 获取 Session   │
        └────────┬───────┘
                 │
                 ▼
        ┌────────────────┐
        │  Session 存在？ │
        └────┬───────┬───┘
             │       │
          否 │       │ 是
             │       │
             ▼       ▼
    ┌──────────┐  ┌─────────────────┐
    │返回未登录│  │ 是管理员操作？   │
    └──────────┘  └────┬────────┬───┘
                       │        │
                    否 │        │ 是
                       │        │
                       ▼        ▼
              ┌──────────┐  ┌──────────────┐
              │执行操作  │  │role === admin?│
              └──────────┘  └────┬─────┬───┘
                                 │     │
                              否 │     │ 是
                                 │     │
                                 ▼     ▼
                        ┌──────────┐ ┌──────────┐
                        │返回无权限│ │执行操作  │
                        └──────────┘ └──────────┘
```

## 详细示例

### 示例 1: 客户端 Action（用户权限）

```javascript
// app/(client)/actions/user.js
'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getUserProfile } from '@/lib/user-profile';

export async function getUserProfileAction() {
  // 步骤 1: 获取 Session
  const session = await auth.api.getSession({ headers: await headers() });

  // 步骤 2: 检查是否登录
  if (!session) {
    return {
      success: false,
      error: 'Unauthorized', // 未登录错误
    };
  }

  // 步骤 3: 验证通过，执行操作
  try {
    // 使用 session.user.id 获取当前用户的数据
    const profile = await getUserProfile(session.user.id);
    return {
      success: true,
      data: profile,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

**权限特点**：
- ✅ 只能访问自己的数据
- ✅ 使用 `session.user.id` 确保安全
- ❌ 无法访问其他用户的数据

### 示例 2: 管理员 Action（管理员权限）

```javascript
// app/(admin)/actions/admin-users.js
'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getUserList } from '@/lib/user-profile';

// 抽取通用的管理员检查函数
async function checkAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });

  // 检查 1: 是否登录
  if (!session) {
    return { isAdmin: false, error: 'Unauthorized' };
  }

  // 检查 2: 是否是管理员
  if (session.user.role !== 'admin') {
    return { isAdmin: false, error: 'Forbidden: Admin access required' };
  }

  return { isAdmin: true, userId: session.user.id };
}

export async function getUserListAction(options) {
  // 步骤 1: 检查管理员权限
  const adminCheck = await checkAdmin();
  
  if (!adminCheck.isAdmin) {
    return {
      success: false,
      error: adminCheck.error, // 'Unauthorized' 或 'Forbidden'
    };
  }

  // 步骤 2: 验证通过，执行管理员操作
  try {
    const users = await getUserList(options);
    return {
      success: true,
      data: users,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

**权限特点**：
- ✅ 可以访问所有用户的数据
- ✅ 可以执行管理操作
- ✅ 两层验证确保安全

## Session 对象结构

```javascript
{
  user: {
    id: 'user_123',           // 用户唯一ID
    email: 'user@example.com',// 邮箱
    name: 'User Name',        // 昵称
    image: 'https://...',     // 头像URL
    role: 'user',             // 角色: 'user' | 'admin'
    username: 'username',     // 用户名
    
    // 扩展字段
    credits: 100,             // 当前积分
    totalCreditsEarned: 500,  // 累计获得积分
    totalCreditsUsed: 400,    // 累计使用积分
    currentPackageId: 'pkg_xxx', // 当前套餐ID
    packageExpireAt: Date,    // 套餐过期时间
    lastLoginAt: Date,        // 最后登录时间
  },
  session: {
    id: 'session_xxx',
    userId: 'user_123',
    expiresAt: Date,
    // ... 其他 session 信息
  }
}
```

## 错误响应

### 未登录错误
```javascript
{
  success: false,
  error: 'Unauthorized'
}
```

**HTTP 状态码等价**：401 Unauthorized

**处理方式**：
```javascript
const result = await someAction();

if (!result.success && result.error === 'Unauthorized') {
  // 跳转到登录页
  router.push('/login');
}
```

### 权限不足错误
```javascript
{
  success: false,
  error: 'Forbidden: Admin access required'
}
```

**HTTP 状态码等价**：403 Forbidden

**处理方式**：
```javascript
const result = await someAdminAction();

if (!result.success && result.error.includes('Forbidden')) {
  // 显示权限不足提示
  alert('You do not have permission to perform this action');
}
```

## 前端权限控制

### 基于角色的 UI 显示

```javascript
'use client';

import { useSession } from '@/lib/auth-client';

export default function Dashboard() {
  const { data: session } = useSession();

  // 未登录
  if (!session) {
    return <LoginPrompt />;
  }

  // 普通用户
  if (session.user.role === 'user') {
    return (
      <div>
        <UserDashboard />
      </div>
    );
  }

  // 管理员
  if (session.user.role === 'admin') {
    return (
      <div>
        <AdminDashboard />
        <UserDashboard />
      </div>
    );
  }
}
```

### 条件渲染管理功能

```javascript
'use client';

import { useSession } from '@/lib/auth-client';

export default function UserCard({ user }) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  return (
    <div>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      
      {/* 只有管理员可以看到编辑按钮 */}
      {isAdmin && (
        <button onClick={handleEdit}>
          Edit User
        </button>
      )}
    </div>
  );
}
```

## 本人操作验证（重要！）

### 核心原则

**所有涉及用户自身数据的 Action，都不应该接受 userId 参数！**

### 设计模式对比

#### ❌ 不安全的设计

```javascript
// ❌ 接受 userId 参数 - 危险！
export async function getUserCreditsAction(userId) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: 'Unauthorized' };
  
  // 即使有 session，用户也可以传入其他人的 userId
  const credits = await getUserCredits(userId);
  return { success: true, data: credits };
}

// 恶意调用示例：
await getUserCreditsAction('another_user_id'); // 可以查看他人积分！
```

#### ✅ 安全的设计

```javascript
// ✅ 不接受 userId 参数 - 安全！
export async function getUserCreditsAction() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: 'Unauthorized' };
  
  // 强制使用 session.user.id，只能查看自己的积分
  const credits = await getUserCredits(session.user.id);
  return { success: true, data: credits };
}

// 正常调用：
await getUserCreditsAction(); // 只能查看自己的积分
```

### 实际项目中的正确实现

我们的项目中，所有客户端 Actions 都遵循这个原则：

```javascript
// ✅ 用户资料相关 - 不接受 userId
getUserProfileAction()              // 获取自己的资料
updateUserProfileAction(updates)     // 更新自己的资料
getUserStatisticsAction()            // 获取自己的统计

// ✅ 积分相关 - 不接受 userId
getUserCreditsAction()               // 获取自己的积分
getCreditTransactionsAction(options) // 获取自己的交易记录

// ✅ 套餐相关 - 不接受 userId
getUserPackagesAction(options)       // 获取自己的套餐
getUserCurrentPackageAction()        // 获取自己当前套餐
purchasePackageAction(packageId)     // 为自己购买套餐

// ✅ 使用记录 - 不接受 userId
getUserUsageLogsAction(options)      // 获取自己的使用记录
getUserUsageStatisticsAction(options)// 获取自己的统计

// ✅ 图片生成 - 自动使用当前用户
textToImageAction({ prompt, size }) // 为当前用户生成图片
```

### 管理员例外情况

只有管理员 Actions 可以接受 userId 参数，因为管理员需要管理其他用户：

```javascript
// ✅ 管理员 Action - 可以接受 userId
export async function getUserStatisticsAdminAction(userId) {
  // 先验证是否是管理员
  const adminCheck = await checkAdmin();
  if (!adminCheck.isAdmin) {
    return { success: false, error: adminCheck.error };
  }
  
  // 管理员可以查看指定用户的数据
  const stats = await getUserStatistics(userId);
  return { success: true, data: stats };
}
```

### 防御清单

开发新的 Action 时，请检查：

- [ ] 是客户端 Action 还是管理员 Action？
- [ ] 如果是客户端 Action，是否涉及用户自身数据？
- [ ] 如果涉及自身数据，是否移除了 userId 参数？
- [ ] 是否强制使用 session.user.id？
- [ ] 是否先验证了 session 存在？

### 常见错误场景

#### 场景 1: 查看用户资料

```javascript
// ❌ 错误：允许查看任意用户
export async function viewUserProfileAction(userId) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: 'Unauthorized' };
  return await getUserProfile(userId); // 可以查看他人资料
}

// ✅ 正确：只能查看自己
export async function getUserProfileAction() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: 'Unauthorized' };
  return await getUserProfile(session.user.id); // 只能查看自己
}
```

#### 场景 2: 购买套餐

```javascript
// ❌ 错误：可以为别人购买（可能被用于攻击）
export async function purchasePackageAction(userId, packageId) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: 'Unauthorized' };
  return await purchasePackage(userId, packageId); // 可能为他人购买
}

// ✅ 正确：只能为自己购买
export async function purchasePackageAction(packageId) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: 'Unauthorized' };
  return await purchasePackage(session.user.id, packageId); // 只为自己购买
}
```

#### 场景 3: 生成图片

```javascript
// ❌ 错误：可以消耗别人的积分
export async function textToImageAction(userId, { prompt }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: 'Unauthorized' };
  
  // 这里会扣除 userId 的积分，而不是当前用户的积分！
  return await createUsageLog(userId, { action: 'text_to_image', ... });
}

// ✅ 正确：只能消耗自己的积分
export async function textToImageAction({ prompt }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: 'Unauthorized' };
  
  // 只能扣除自己的积分
  return await createUsageLog(session.user.id, { action: 'text_to_image', ... });
}
```

## 安全最佳实践

### 1. 永远在服务端验证权限

❌ **错误做法**（仅前端验证）：
```javascript
'use client';

export default function DeleteButton({ userId }) {
  const { data: session } = useSession();
  
  // ❌ 仅前端检查，不安全！
  if (session?.user?.role !== 'admin') {
    return null;
  }

  return <button onClick={() => deleteUser(userId)}>Delete</button>;
}
```

✅ **正确做法**（服务端验证）：
```javascript
// Server Action
'use server';

export async function deleteUserAction(userId) {
  // ✅ 服务端验证
  const adminCheck = await checkAdmin();
  if (!adminCheck.isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }
  
  // 执行删除
  await deleteUser(userId);
  return { success: true };
}

// Client Component
'use client';

export default function DeleteButton({ userId }) {
  const { data: session } = useSession();
  
  // 前端只用于 UI 显示
  if (session?.user?.role !== 'admin') {
    return null;
  }

  const handleDelete = async () => {
    const result = await deleteUserAction(userId);
    if (!result.success) {
      alert(result.error);
    }
  };

  return <button onClick={handleDelete}>Delete</button>;
}
```

### 2. 使用 session.user.id，不要信任客户端传来的 userId

这是最重要的安全原则之一！

❌ **错误做法**（允许客户端传入 userId）：
```javascript
export async function updateProfileAction(userId, updates) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: 'Unauthorized' };
  
  // ❌ 直接使用客户端传来的 userId，用户可以篡改这个值
  // 用户可能传入其他人的 userId，从而修改他人数据！
  await updateUserProfile(userId, updates);
}

// 客户端可能这样恶意调用：
await updateProfileAction('other_user_id', { name: 'Hacked!' });
```

✅ **正确做法**（不接受 userId 参数）：
```javascript
export async function updateProfileAction(updates) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: 'Unauthorized' };
  
  // ✅ 完全忽略客户端可能传入的 userId
  // ✅ 强制使用 session.user.id，确保用户只能修改自己的数据
  await updateUserProfile(session.user.id, updates);
}

// 客户端调用（无法指定 userId）：
await updateProfileAction({ name: 'New Name' });
```

**为什么这很重要？**

1. **防止横向越权** - 用户A不能修改用户B的数据
2. **Session 是可信的** - session.user.id 由服务器验证，不可伪造
3. **客户端输入不可信** - 任何来自客户端的参数都可能被篡改

**核心原则：凡是涉及"我的"操作，都不应该有 userId 参数！**

### 3. 抽取公共权限检查函数

✅ **推荐做法**：
```javascript
// 可以创建一个通用的权限检查工具
// lib/auth-helpers.js

export async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }
  return session;
}

// 在 Action 中使用
export async function someAdminAction() {
  try {
    const session = await requireAdmin();
    // 执行操作
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

## 角色管理

### 如何设置用户为管理员

```javascript
// 方式 1: 通过管理员 Action
import { updateUserRoleAction } from '@/app/(admin)/actions';

await updateUserRoleAction(userId, 'admin');

// 方式 2: 直接修改数据库
import { getCollection } from '@/lib/mongodb';

const usersCollection = await getCollection('users');
await usersCollection.updateOne(
  { id: userId },
  { $set: { role: 'admin' } }
);
```

### 角色类型

```javascript
// 当前支持的角色
const ROLES = {
  USER: 'user',      // 普通用户（默认）
  ADMIN: 'admin',    // 管理员
};
```

### 扩展角色系统（可选）

如果需要更复杂的权限系统，可以扩展：

```javascript
const ROLES = {
  USER: 'user',           // 普通用户
  PREMIUM: 'premium',     // 高级用户
  MODERATOR: 'moderator', // 版主
  ADMIN: 'admin',         // 管理员
  SUPER_ADMIN: 'super_admin', // 超级管理员
};

// 权限检查函数
async function checkRole(requiredRoles) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { hasPermission: false, error: 'Unauthorized' };
  }
  
  if (!requiredRoles.includes(session.user.role)) {
    return { hasPermission: false, error: 'Forbidden' };
  }
  
  return { hasPermission: true, session };
}
```

## 总结

### 客户端 Actions（普通用户）
```javascript
// 一层验证：只检查是否登录
const session = await auth.api.getSession({ headers: await headers() });
if (!session) return { success: false, error: 'Unauthorized' };

// 使用 session.user.id 操作自己的数据
```

### 管理员 Actions
```javascript
// 两层验证：
// 1. 检查是否登录
// 2. 检查是否是管理员
const adminCheck = await checkAdmin();
if (!adminCheck.isAdmin) return { success: false, error: adminCheck.error };

// 可以操作所有数据
```

### 关键安全原则
1. ✅ **永远在服务端验证权限**
2. ✅ **使用 session.user.id，不信任客户端输入**
3. ✅ **前端权限检查仅用于 UI 显示**
4. ✅ **管理员操作必须双重验证**
5. ✅ **统一的错误响应格式**

这样的权限系统既简单又安全，满足了大多数 SaaS 应用的需求！

