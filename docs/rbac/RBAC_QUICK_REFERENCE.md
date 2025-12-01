# RBAC 快速参考

> 一页纸速查手册 | v3.1

---

## 权限级别

| 级别 | API 路径 | Action 前缀 | 说明 |
|------|----------|-------------|------|
| **public** | `/api/pub/*` | `pub` | 公开，无需登录 |
| **auth** | `/api/auth/*` | `auth` | 需要登录 |
| **system** | `/api/sys/*` | `sys` | 后台权限 + RBAC |
| **private** | - | `_` | 私有，不能直接调用 |

---

## 创建 API

```
app/api/v1/pub/xxx/route.js   → 公开
app/api/v1/auth/xxx/route.js  → 需要登录
app/api/v1/sys/xxx/route.js   → 后台权限
```

```javascript
// app/api/v1/auth/user/profile/route.js
import { NextResponse } from 'next/server';
import { getApiContext } from '@/lib/api/api-context';

export async function GET(request) {
  const { userId, isAdmin } = getApiContext(request);
  return NextResponse.json({ success: true, data: { userId } });
}
```

---

## 创建 Action

```javascript
'use server';
import { wrapAction } from '@/lib/core/action-wrapper';

// 公开
export const pubGetConfig = wrapAction('pubGetConfig', async (params, ctx) => {
  return { success: true, data: {} };
});

// 需要登录
export const authGetProfile = wrapAction('authGetProfile', async (params, ctx) => {
  const { userId } = ctx;
  return { success: true, data: { userId } };
});

// 后台权限
export const sysGetUsers = wrapAction('sysGetUsers', async (params, ctx) => {
  return { success: true, data: [] };
});
```

### Handler 签名

```javascript
handler(params, ctx)
// params - 前端传入的参数对象
// ctx - { userId, isAdmin, user }
```

---

## CRUD Actions

```javascript
import { createCrudActions } from '@/lib/core/crud-helper';

const crud = createCrudActions({ collectionName: 'users', ... });

// 参数格式
await crud.getList({ pageIndex: 1, pageSize: 20 });
await crud.getDetail('id');           // 或 { id: 'xxx' }
await crud.create({ name: 'xxx' });
await crud.update({ id: 'xxx', name: 'new' });  // 必须包含 id！
await crud.delete('id');              // 或 { id: 'xxx' }
```

---

## 前端调用

### API 调用

```javascript
import { fetchApi, get, post } from '@/lib/api/fetch-client';

const { data, error, status } = await get('/api/v1/auth/user/profile');
const { data } = await post('/api/v1/auth/user/update', { name: 'xxx' });
```

### Action 调用

```javascript
import { callAction } from '@/lib/api/action-client';
import { authGetProfile } from '@/app/(client)/actions/xxx';

const { data, error, success } = await callAction(authGetProfile);
const { data } = await callAction(authUpdateProfile, { name: 'xxx' });
```

---

## 配置选项

```javascript
// 禁用 401 跳转
await fetchApi('/api/xxx', {}, { redirectOnUnauth: false });
  
// 禁用错误 toast
await fetchApi('/api/xxx', {}, { showErrorToast: false });

// 显示成功 toast
await callAction(action, params, { 
  showSuccessToast: true,
  successMessage: '操作成功'
});
```

---

## 权限来源（v3.1）

```
用户 → 角色 → 权限（始终生效）
        ↓
      菜单 → 权限（可选，需开启继承）
```

### 菜单权限继承

| 开关 | 行为 |
|------|------|
| 关闭（默认） | 菜单仅控制页面访问 |
| 开启 | 菜单同时授予关联权限 |

---

## 权限检查流程

```
请求 → public? → 直接通过
         ↓
      已登录? → 401
         ↓
      auth级别? → 直接通过
         ↓
      是admin? → 直接通过
         ↓
      有后台权限? → 403
         ↓
      RBAC检查 → 403 / 通过
```

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `proxy.js` | API 自动拦截 |
| `lib/core/action-wrapper.js` | Action 包装器 |
| `lib/core/crud-helper.js` | CRUD 生成器 |
| `lib/api/fetch-client.js` | 前端 API 封装 |
| `lib/api/action-client.js` | 前端 Action 封装 |

---

## 测试

访问 `/zh/test` 测试所有权限级别
