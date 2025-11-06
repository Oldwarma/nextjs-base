# 认证与权限库

基于 Better Auth 的认证系统和 RBAC 权限管理工具集。

## 📁 文件列表

| 文件 | 说明 |
|------|------|
| `auth.js` | Better Auth 核心配置 - 数据库连接、Session 管理 |
| `auth-client.js` | Better Auth 客户端 - 前端认证 API |
| `admin-auth.js` | 管理员认证 - 检查管理员权限（页面/Action） |
| `page-auth.js` | 页面权限 - RBAC 页面访问控制 |
| `permission-auth.js` | 权限验证 - RBAC 操作权限检查 |

## 🎯 使用方式

### 服务端认证

```javascript
// 获取 Session
import { auth } from '@/lib/auth/auth';
const session = await auth.api.getSession({ headers: await headers() });

// 管理员验证（页面）
import { checkAdmin } from '@/lib/auth/admin-auth';
await checkAdmin(); // 不是管理员则重定向

// 管理员验证（Action）
import { checkAdminAction } from '@/lib/auth/admin-auth';
const { isAdmin, userId } = await checkAdminAction();
if (!isAdmin) return { success: false, error: 'Unauthorized' };
```

### RBAC 权限验证

```javascript
// 页面权限检查
import { checkPageAccess } from '@/lib/auth/page-auth';
await checkPageAccess('/admin/users'); // 无权限则重定向 403

// Action 权限检查
import { checkPermission } from '@/lib/auth/permission-auth';
const hasPermission = await checkPermission('user:create');
```

### 客户端认证

```javascript
'use client';
import { authClient } from '@/lib/auth/auth-client';

// 登录
await authClient.signIn.email({ email, password });

// 注册
await authClient.signUp.email({ email, password, name });

// OAuth 登录
await authClient.signIn.social({ provider: 'google' });
```

## 📖 相关文档

- [管理后台认证文档](../../docs/admin/AUTH.md)
- [RBAC 系统文档](../../docs/admin/RBAC_SYSTEM.md)
- [前端认证文档](../../docs/client/AUTH.md)
- [Better Auth UUID 集成](../../docs/rbac/BETTER_AUTH_UUID_INTEGRATION.md)

## 🔗 依赖关系

- Better Auth
- MongoDB (通过 `lib/database/mongodb`)
- Next.js (headers, cookies)

