# Server Actions vs Client Actions 概念区分

> **最后更新**: 2024-11-14  
> **版本**: v1.0  

本文档详细说明 **Server Actions**（服务端行为）与 **Client Actions**（客户端行为）的区别。

---

## ⚠️ 重要概念澄清

### 首先：它们都是 Server Actions！

**关键点**：
- ✅ **所有的 Actions 都是 Server Actions**（在服务器端执行）
- ✅ **都使用 `'use server'` 指令**
- ✅ **都不是客户端 JavaScript 代码**

**真正的区别**：
- 区别在于 **目录位置**（`app/(admin)/actions/` vs `app/(client)/actions/`）
- 区别在于 **使用场景**（后台管理 vs 前台用户）
- 区别在于 **权限模型**（RBAC vs 基础登录）

---

## 📂 目录结构对比

```
app/
├── (admin)/                        # 后台管理区域
│   ├── actions/                    # Backend Admin Actions
│   │   ├── rbac/                   # RBAC 相关
│   │   │   ├── crud-action.user.js
│   │   │   ├── crud-action.role.js
│   │   │   └── crud-action.permission.js
│   │   ├── finance/                # 财务管理
│   │   ├── cms/                    # 内容管理
│   │   └── system/                 # 系统管理
│   └── admin/                      # 后台页面
│       ├── rbac/users/
│       ├── rbac/roles/
│       └── ...
│
└── (client)/                       # 前台用户区域
    ├── actions/                    # Client (Frontend) Actions
    │   ├── user.js                 # 用户个人资料
    │   ├── credits.js              # 积分操作
    │   ├── packages.js             # 套餐购买
    │   ├── generate.js             # 图片生成
    │   └── usage.js                # 使用记录
    └── [locale]/                   # 前台页面
        ├── dashboard/
        ├── profile/
        └── ...
```

---

## 🎯 核心区别对比表

| 维度 | Backend Admin Actions | Client (Frontend) Actions |
|------|----------------------|---------------------------|
| **目录位置** | `app/(admin)/actions/` | `app/(client)/actions/` |
| **使用者** | 管理员 / 后台操作人员 | 普通用户 / 前台用户 |
| **访问入口** | `/admin/*` 页面 | `/[locale]/*` 页面 |
| **权限模型** | **RBAC（细粒度权限）** | **基础登录验证** |
| **Wrapper 函数** | `wrapAdminAction` | `wrapClientAction` |
| **权限检查** | `checkBackendAccessAction()`<br/>+ RBAC | `session` 验证（登录即可） |
| **功能范围** | 管理用户、角色、权限<br/>审核内容、财务管理<br/>系统配置 | 个人资料管理<br/>积分充值、使用<br/>内容生成 |
| **日志记录** | 默认开启（重要操作） | 默认关闭（可选） |
| **数据范围** | 可以操作所有用户数据 | 只能操作自己的数据 |

---

## 📝 实际代码对比

### Backend Admin Action 示例

```javascript
// 文件: app/(admin)/actions/rbac/crud-action.user.js
'use server';

import { wrapAdminAction } from '@/lib/core/action-wrapper';

/**
 * 重置用户密码（管理员功能）
 * 
 * 特点：
 * - 需要后台访问权限 (admin 或 user + isBackendAllowed)
 * - 需要 RBAC 权限检查
 * - 可以操作任何用户
 * - 记录操作日志
 */
export const resetUserPasswordAction = wrapAdminAction(
  'set_password',
  'user',
  async (userId, newPassword, { userId: operatorId, isAdmin }) => {
    // ✅ operatorId 是操作者（管理员）的 ID
    // ✅ userId 是被操作用户的 ID
    // ✅ isAdmin 标识操作者是否为 admin 角色
    
    // 业务逻辑：可以重置任何用户的密码
    await resetPassword(userId, newPassword);
    
    return {
      success: true,
      message: 'Password reset successfully',
      data: { userId },
    };
  },
  {
    permissionId: 'resetUserPasswordAction',  // ← RBAC 权限标识
    skipLog: false,                           // ← 记录日志
  }
);
```

**权限配置**（在 RBAC 系统中）：

```json
{
  "name": "User - Reset Password",
  "identify": "crud:user:reset-password",
  "level": 3,  // Grenade Level (高危操作)
  "actions": [
    "**/resetUserPasswordAction"
  ]
}
```

**调用场景**：

```javascript
// 在后台管理页面 (app/(admin)/admin/rbac/users/page.jsx)
import { resetUserPasswordAction } from '@/app/(admin)/actions/rbac/crud-action.user';

async function handleResetPassword(userId, newPassword) {
  // 管理员可以重置任何用户的密码
  const result = await resetUserPasswordAction(userId, newPassword);
  
  if (result.success) {
    message.success('Password reset successfully');
  } else {
    // 可能的错误：
    // - "Forbidden: Action 'resetUserPasswordAction' not allowed" (RBAC 拒绝)
    // - "Forbidden: Backend access not allowed" (无后台权限)
    message.error(result.error);
  }
}
```

---

### Client (Frontend) Action 示例

```javascript
// 文件: app/(client)/actions/user.js
'use server';

import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';

/**
 * 获取当前用户资料（用户功能）
 * 
 * 特点：
 * - 只需要登录验证
 * - 无 RBAC 权限检查
 * - 只能获取自己的数据
 * - 不记录日志
 */
export async function getUserProfileAction() {
  // ✅ 手动进行 session 验证
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }
  
  // ✅ 只能访问自己的数据
  const userId = session.user.id;
  const profile = await getUserProfile(userId);  // 自动限制为当前用户
  
  return {
    success: true,
    data: profile,
  };
}

/**
 * 更新用户资料（用户功能）
 */
export async function updateUserProfileAction(updates) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }
  
  // ✅ 只能更新自己的资料
  const userId = session.user.id;
  const result = await updateUserProfile(userId, updates);
  
  return {
    success: true,
    data: result,
  };
}
```

**无需权限配置**（只要登录就能使用）

**调用场景**：

```javascript
// 在前台用户页面 (app/(client)/[locale]/profile/page.jsx)
import { getUserProfileAction, updateUserProfileAction } from '@/app/(client)/actions/user';

async function handleUpdateProfile(updates) {
  // 用户只能更新自己的资料
  const result = await updateUserProfileAction(updates);
  
  if (result.success) {
    message.success('Profile updated successfully');
  } else {
    // 可能的错误：
    // - "Unauthorized" (未登录)
    message.error(result.error);
  }
}
```

---

## 🔐 权限验证流程对比

### Backend Admin Action 权限流程

```
用户调用 Backend Admin Action
         ↓
[wrapAdminAction]
         ↓
1. 检查后台访问权限
   └─ checkBackendAccessAction()
      ├─ 未登录？ → ❌ 返回 "Unauthorized"
      ├─ admin 角色？ → ✅ 跳到步骤 3
      └─ user + isBackendAllowed？
         ├─ 是 → ✅ 继续步骤 2
         └─ 否 → ❌ 返回 "Forbidden: Backend access not allowed"
         ↓
2. RBAC 权限检查（仅 user 角色）
   └─ checkUserHasActionPermission(userId, permissionId)
      ├─ 匹配权限？ → ✅ 继续步骤 3
      └─ 无权限？ → ❌ 返回 "Forbidden: Action not allowed"
         ↓
3. 执行业务逻辑
   └─ handler(...args, { userId, isAdmin })
         ↓
4. 记录操作日志（如果 skipLog = false）
         ↓
5. 返回结果
```

### Client (Frontend) Action 权限流程

```
用户调用 Client Action
         ↓
[手动 session 验证]
         ↓
1. 检查登录状态
   └─ auth.api.getSession()
      ├─ 未登录？ → ❌ 返回 "Unauthorized"
      └─ 已登录？ → ✅ 继续步骤 2
         ↓
2. 执行业务逻辑（限制为当前用户）
   └─ handler(session.user.id, ...)
         ↓
3. 返回结果
```

**关键差异**：
- ❌ Client Actions **不做** RBAC 检查
- ❌ Client Actions **不做** 后台访问权限检查
- ✅ Client Actions **只做** 基本登录验证
- ✅ Client Actions **自动限制** 为当前用户数据

---

## 🎨 使用场景划分

### Backend Admin Actions 适用场景

```
✅ 用户管理
   ├─ 查看所有用户列表
   ├─ 编辑任意用户资料
   ├─ 重置任意用户密码
   ├─ 禁用/启用用户账号
   └─ 分配角色和权限

✅ 角色权限管理
   ├─ 创建/编辑角色
   ├─ 分配权限给角色
   └─ 管理菜单

✅ 内容审核
   ├─ 审核用户生成的内容
   ├─ 删除违规内容
   └─ 封禁用户

✅ 财务管理
   ├─ 查看所有订单
   ├─ 手动充值积分
   ├─ 退款处理
   └─ 财务报表

✅ 系统配置
   ├─ 系统参数设置
   ├─ 查看操作日志
   └─ 数据备份
```

### Client (Frontend) Actions 适用场景

```
✅ 个人资料
   ├─ 查看自己的资料
   ├─ 更新自己的头像、昵称
   └─ 修改自己的密码

✅ 积分操作
   ├─ 查看自己的积分余额
   ├─ 购买积分套餐
   └─ 查看自己的积分消费记录

✅ 内容生成
   ├─ 生成图片
   ├─ 查看自己的生成历史
   └─ 下载自己生成的内容

✅ 订单管理
   ├─ 查看自己的订单
   └─ 申请退款（自己的订单）

✅ 使用统计
   ├─ 查看自己的使用量
   └─ 查看自己的统计数据
```

---

## 🔄 如何选择使用哪种？

### 决策树

```
问题：我要实现一个功能，应该用哪种 Action？

START
  ↓
Q1: 这个功能是给谁用的？
  ├─ 管理员/运营人员（后台） → 继续 Q2
  └─ 普通用户（前台） → 继续 Q3
     ↓
Q2: 管理员功能
  ├─ 需要操作其他用户的数据？
  │  └─ 是 → ✅ Backend Admin Action + RBAC
  ├─ 需要细粒度权限控制？
  │  └─ 是 → ✅ Backend Admin Action + RBAC
  └─ 是高危操作（删除、禁用等）？
     └─ 是 → ✅ Backend Admin Action + RBAC
     ↓
Q3: 普通用户功能
  ├─ 只操作自己的数据？
  │  └─ 是 → ✅ Client Action
  ├─ 不需要权限控制（登录即可）？
  │  └─ 是 → ✅ Client Action
  └─ 是日常使用功能？
     └─ 是 → ✅ Client Action
```

### 快速判断表

| 特征 | Backend Admin | Client (Frontend) |
|------|--------------|-------------------|
| 操作对象是"任意用户" | ✅ | ❌ |
| 操作对象是"当前用户自己" | ❌ | ✅ |
| 需要 RBAC 权限 | ✅ | ❌ |
| 登录即可使用 | ❌ | ✅ |
| 需要记录操作日志 | ✅ | ❌ |
| 在 `/admin/*` 页面调用 | ✅ | ❌ |
| 在 `/[locale]/*` 页面调用 | ❌ | ✅ |

---

## 📊 混合使用示例

### 示例：用户密码管理

#### 场景 1: 用户修改自己的密码

```javascript
// 文件: app/(client)/actions/user.js
'use server';

/**
 * 用户修改自己的密码
 * ✅ Client Action - 不需要 RBAC
 */
export async function changeMyPasswordAction(oldPassword, newPassword) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }
  
  // 验证旧密码
  const isValid = await verifyPassword(session.user.id, oldPassword);
  if (!isValid) {
    return { success: false, error: 'Invalid old password' };
  }
  
  // 更新密码（只能改自己的）
  await updatePassword(session.user.id, newPassword);
  
  return { success: true, message: 'Password changed successfully' };
}
```

#### 场景 2: 管理员重置用户密码

```javascript
// 文件: app/(admin)/actions/rbac/crud-action.user.js
'use server';

import { wrapAdminAction } from '@/lib/core/action-wrapper';

/**
 * 管理员重置用户密码
 * ✅ Backend Admin Action - 需要 RBAC
 */
export const resetUserPasswordAction = wrapAdminAction(
  'set_password',
  'user',
  async (userId, newPassword, { userId: operatorId, isAdmin }) => {
    // 可以重置任意用户的密码
    await updatePassword(userId, newPassword);
    
    return {
      success: true,
      message: 'Password reset successfully',
      data: { userId },
    };
  },
  {
    permissionId: 'resetUserPasswordAction',
    skipLog: false,
  }
);
```

**对比**：

| 维度 | changeMyPasswordAction | resetUserPasswordAction |
|------|------------------------|-------------------------|
| 位置 | `app/(client)/actions/` | `app/(admin)/actions/` |
| 需要旧密码 | ✅ 是 | ❌ 否（管理员操作） |
| 操作范围 | 只能改自己的 | 可以改任何用户的 |
| RBAC 权限 | ❌ 不需要 | ✅ 需要 |
| 日志记录 | ❌ 不记录 | ✅ 记录 |

---

## 🚨 常见误区

### ❌ 误区 1: "Client Actions 在客户端执行"

**错误理解**：
```javascript
// ❌ 认为这段代码在浏览器中执行
export async function getUserProfileAction() {
  // 这里能访问数据库，所以在客户端？❌
}
```

**正确理解**：
- ✅ **所有 Actions 都在服务器端执行**
- ✅ "Client Actions" 指的是**给前台客户端用户使用**的 Actions
- ✅ 它们仍然是 Server Actions，只是目标用户不同

### ❌ 误区 2: "Backend Admin Actions 只能 admin 角色用"

**错误理解**：
```javascript
// ❌ 认为只有 admin 角色能调用 Backend Admin Actions
```

**正确理解**：
- ✅ `admin` 角色：自动拥有所有权限
- ✅ `user` 角色 + `isBackendAllowed = true`：可以访问后台，但受 RBAC 限制
- ✅ `user` 角色 + `isBackendAllowed = false`：完全无法访问后台

### ❌ 误区 3: "所有后台功能都要用 RBAC"

**错误理解**：
```javascript
// ❌ 认为所有后台 Actions 都需要配置 RBAC 权限
```

**正确理解**：
- ✅ 有些 Actions 可以设置 `skipPermission: true`（如获取菜单列表）
- ✅ 有些 Actions 可以设置 `requireAdmin: true`（只允许 admin，不做 RBAC）
- ✅ RBAC 是可选的，根据业务需求决定

---

## 🎓 总结

### 核心要点

1. **命名问题**
   - "Client Actions" 不是指在客户端执行
   - 正确理解：给前台客户端用户使用的 Server Actions

2. **本质区别**
   - **Backend Admin Actions**：给管理员/运营人员用，需要 RBAC 权限控制
   - **Client (Frontend) Actions**：给普通用户用，只需登录验证

3. **选择标准**
   - 操作**别人的数据** → Backend Admin Action
   - 操作**自己的数据** → Client Action
   - 需要**细粒度权限** → Backend Admin Action
   - **登录即可用** → Client Action

### 快速参考

```javascript
// Backend Admin Action 模板
export const someAdminAction = wrapAdminAction(
  'actionType',
  'resourceType',
  async (args, { userId, isAdmin }) => {
    // 可以操作任意用户的数据
    // isAdmin 可以判断是否为 admin 角色
    return { success: true };
  },
  {
    permissionId: 'someAdminAction',  // RBAC 标识
    skipLog: false,                    // 记录日志
  }
);

// Client Action 模板
export async function someClientAction(args) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }
  
  // 只能操作当前用户的数据
  const userId = session.user.id;
  // ...
  return { success: true };
}
```

---

## 📚 相关文档

- [Actions 路径配置指南](./ACTIONS_PATH_GUIDE.md)
- [权限系统扩展方案](./PERMISSION_SYSTEM_EXTENSION.md)
- [RBAC 系统总览](./RBAC_SYSTEM.md)
- [后台认证系统](../admin/AUTH.md)
- [Action Wrapper 文档](../admin/ACTION_LOGGER.md)

---

**Version History**:
- `v1.0` (2024-11-14): 初始版本，详细对比 Backend Admin Actions 与 Client Actions

