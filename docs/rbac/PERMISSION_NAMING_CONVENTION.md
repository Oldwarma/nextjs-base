# 权限命名约定指南

**像 vk-unicloud 一样，按目录结构创建 API，权限自动生效！**

## 目录

- [快速开始](#快速开始)
- [API 路由（自动拦截）](#api-路由自动拦截)
- [Server Actions（使用 wrapAction）](#server-actions使用-wrapaction)
- [前端调用封装](#前端调用封装)
- [路径约定总结](#路径约定总结)
- [多层级路径支持](#多层级路径支持)
- [权限检查流程](#权限检查流程)

---

## 快速开始

### 1. 创建 API（自动拦截）

```
app/api/v1/pub/xxx/route.js   → 公开
app/api/v1/auth/xxx/route.js  → 需要登录
app/api/v1/sys/xxx/route.js   → 需要后台权限
```

### 2. 创建 Action（命名约定）

```javascript
export const pubGetConfig = wrapAction('pubGetConfig', handler);   // 公开
export const authGetProfile = wrapAction('authGetProfile', handler); // 登录
export const sysGetUsers = wrapAction('sysGetUsers', handler);       // 后台
```

### 3. 前端调用（自动 Toast）

```javascript
import { fetchApi } from '@/lib/api/fetch-client';
import { callAction } from '@/lib/api/action-client';

// API 调用
const { data, error } = await fetchApi('/api/v1/auth/user/profile');

// Action 调用
const { data, success } = await callAction(authGetProfile);
```

---

## API 路由（自动拦截）

`proxy.js` 会根据路径自动处理权限，无需在 route.js 中写权限检查代码。

### 示例：公开 API

```javascript
// app/api/v1/pub/cms/getList/route.js

import { NextResponse } from 'next/server';

export async function GET(request) {
  // 直接写业务逻辑，不需要权限检查！
  const data = { list: [], total: 0 };
  return NextResponse.json({ success: true, data });
}
```

### 示例：需要登录的 API

```javascript
// app/api/v1/auth/user/profile/route.js

import { NextResponse } from 'next/server';
import { getApiContext } from '@/lib/api/api-context';

export async function GET(request) {
  // 未登录会被 proxy 拦截返回 401
  const { userId, isAdmin } = getApiContext(request);
  
  const profile = await getUserProfile(userId);
  return NextResponse.json({ success: true, data: profile });
}
```

### 示例：后台 API

```javascript
// app/api/v1/sys/users/route.js

import { NextResponse } from 'next/server';
import { getApiContext } from '@/lib/api/api-context';

export async function GET(request) {
  // 非后台用户会被 proxy 拦截返回 403
  // admin 直接通过，非 admin 需要 RBAC 权限
  const { userId, isAdmin } = getApiContext(request);
  
  const users = await getAllUsers();
  return NextResponse.json({ success: true, data: users });
}
```

---

## Server Actions（使用 wrapAction）

### 基本用法

```javascript
'use server';

import { wrapAction } from '@/lib/core/action-wrapper';

// 公开 - 无需登录
export const pubGetServerTime = wrapAction('pubGetServerTime', async (_, ctx) => {
  return {
    success: true,
    data: { time: new Date().toISOString() },
  };
});

// 需要登录
export const authGetUserInfo = wrapAction('authGetUserInfo', async (_, ctx) => {
  const { userId, user, isAdmin } = ctx;
  return {
    success: true,
    data: { userId, email: user?.email },
  };
});

// 后台功能 - 需要后台权限 + RBAC
export const sysGetSystemInfo = wrapAction('sysGetSystemInfo', async (_, ctx) => {
  const { userId, isAdmin } = ctx;
  return {
    success: true,
    data: { nodeVersion: process.version },
  };
});
```

### Handler 签名

```javascript
handler(params, ctx)
```

- **params** - 前端传入的参数（第一个参数）
- **ctx** - 上下文对象 `{ userId, isAdmin, user }`

### 带参数的 Action

```javascript
export const authUpdateProfile = wrapAction('authUpdateProfile', async (data, ctx) => {
  const { userId } = ctx;
  await updateUser(userId, data);
  return { success: true };
});

// 前端调用
await callAction(authUpdateProfile, { name: 'xxx', bio: 'xxx' });
```

### CRUD 快捷方式

```javascript
import { createCrudActions } from '@/lib/core/crud-helper';

const crud = createCrudActions({
  collectionName: 'users',
  // ... BaseDAO 配置
});

// 自动生成 sys 前缀（需要后台权限）
export const sysGetUserList = crud.getList;
export const sysCreateUser = crud.create;
export const sysUpdateUser = crud.update;
export const sysDeleteUser = crud.delete;
```

---

## 前端调用封装

### fetchApi - API 请求

```javascript
import { fetchApi, get, post, put, del } from '@/lib/api/fetch-client';

// GET 请求
const { data, error, status } = await get('/api/v1/auth/user/profile');

// POST 请求
const { data, error } = await post('/api/v1/auth/user/update', { name: 'xxx' });

// PUT 请求
const { data, error } = await put('/api/v1/auth/user/123', { name: 'xxx' });

// DELETE 请求
const { data, error } = await del('/api/v1/auth/user/123');
```

### 配置选项

```javascript
const { data, error } = await fetchApi('/api/xxx', options, {
  redirectOnUnauth: true,   // 401 时跳转登录（默认 true）
  showErrorToast: true,     // 显示错误 toast（默认 true）
  throwOnError: false,      // 抛出错误而非返回（默认 false）
});
```

### callAction - Server Action 调用

```javascript
import { callAction } from '@/lib/api/action-client';
import { authGetUserInfo, authUpdateProfile } from '@/app/(client)/actions/xxx';

// 基本调用
const { data, error, success } = await callAction(authGetUserInfo);

// 带参数
const { data, success } = await callAction(authUpdateProfile, { name: 'xxx' });

// 显示成功 toast
const { data } = await callAction(authUpdateProfile, { name: 'xxx' }, {
  showSuccessToast: true,
  successMessage: '更新成功'
});
```

### 配置选项

```javascript
const { data, success } = await callAction(action, params, {
  redirectOnUnauth: true,   // 401 时跳转登录（默认 true）
  showErrorToast: true,     // 显示错误 toast（默认 true）
  showSuccessToast: false,  // 显示成功 toast（默认 false）
  successMessage: '操作成功', // 成功 toast 消息
});
```

### Toast 行为

| 状态 | Toast | 行为 |
|------|-------|------|
| 401 未登录 | `toast.info('请先登录')` | 跳转登录页 |
| 403 权限不足 | `toast.error('Forbidden: ...')` | 显示错误 |
| 其他错误 | `toast.error(error)` | 显示错误 |
| 成功 | 默认不提示 | 可配置 `showSuccessToast` |

---

## 路径约定总结

| 路径/前缀 | 权限级别 | 说明 |
|----------|---------|------|
| `/api/pub/*` | public | 公开，无需登录 |
| `/api/auth/*` | auth | 需要登录 |
| `/api/sys/*` | system | 需要后台权限 + RBAC |
| `/api/admin/*` | system | 同 sys |
| `pubXxx` | public | Action 公开 |
| `authXxx` | auth | Action 需要登录 |
| `sysXxx` | system | Action 需要后台权限 + RBAC |
| `_xxx` | private | 私有，不能被前端调用 |

---

## 多层级路径支持

支持任意层级的权限识别，**从最后一级向前查找**关键词：

```
/api/pub/xxx              → public
/api/user/pub             → public（pub 在最后）
/api/user/pub/list        → public
/api/user/info/pub        → public

/api/v1/auth/user         → auth
/api/user/auth/profile    → auth

/api/sys/users            → system
/api/user/sys/admin       → system

/api/sys/pub/config       → public（pub 优先级更高）
/api/pub/auth/user        → auth（auth 优先级更高）
```

### 优先级规则

从最后一级向前查找，找到第一个权限关键词就返回：

```
/api/sys/pub/config
          ↑
      最后一级是 config（无关键词）
          ↑
      倒数第二级是 pub → 返回 public
```

### 排除词

以下词不会被误识别：

- `publish`, `publisher` 不会匹配 `pub`
- `author`, `authenticate` 不会匹配 `auth`
- `system` 不会匹配 `sys`

---

## 权限检查流程

### API 权限检查（proxy.js）

```
请求 /api/v1/sys/users
        ↓
1. 解析权限级别 → system
        ↓
2. 是否已登录？
   ├─ 否 → 返回 401
   └─ 是 → 继续
        ↓
3. 是否是 admin？
   ├─ 是 → 直接通过 ✓
   └─ 否 → 继续
        ↓
4. 是否有后台权限（isBackendAllowed）？
   ├─ 否 → 返回 403 "Backend access required"
   └─ 是 → 继续
        ↓
5. RBAC 权限检查
   ├─ 检查 "GET:/api/v1/sys/users" 格式
   ├─ 再检查 "/api/v1/sys/users" 格式
   └─ 都没有 → 返回 403 "API not allowed"
        ↓
6. 通过 ✓
```

### Action 权限检查（wrapAction）

```
调用 sysGetUserList()
        ↓
1. 解析权限级别 → system
        ↓
2. 是否已登录？
   ├─ 否 → 返回 { error: 'Unauthorized' }
   └─ 是 → 继续
        ↓
3. 是否是 admin？
   ├─ 是 → 直接通过 ✓
   └─ 否 → 继续
        ↓
4. 是否有后台权限？
   ├─ 否 → 返回 { error: 'Forbidden' }
   └─ 是 → 继续
        ↓
5. RBAC 权限检查
   └─ 没有 → 返回 { error: 'Action not allowed' }
        ↓
6. 执行业务逻辑 ✓
```

---

## 辅助函数

### getApiContext - 获取 API 上下文

```javascript
import { getApiContext } from '@/lib/api/api-context';

export async function GET(request) {
  const ctx = getApiContext(request);
  
  ctx.userId        // 用户 ID
  ctx.userRole      // 用户角色
  ctx.isAdmin       // 是否管理员
}
```

---

## 测试页面

访问 `/zh/test` 可以测试所有权限级别：

- API Routes: pub / auth / sys
- Server Actions: pub / auth / sys

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `proxy.js` | API 自动拦截 |
| `lib/core/action-wrapper.js` | Action 包装器 |
| `lib/core/permission-naming.js` | 权限命名解析 |
| `lib/api/fetch-client.js` | 前端 API 调用封装 |
| `lib/api/action-client.js` | 前端 Action 调用封装 |
| `lib/api/api-context.js` | API 上下文获取 |
