# 权限系统扩展方案

> **最后更新**: 2024-11-14  
> **版本**: v2.0 (简化版)

本文档说明如何将现有 RBAC 权限系统扩展到支持 API 路由。

---

## 📊 当前架构分析

### 现有系统概览

```
当前权限系统
├── Backend Admin Actions (已实现 RBAC)
│   └── 使用 wrapAdminAction + checkUserHasActionPermission
├── Client Actions (仅登录验证)
│   └── 使用 wrapClientAction (无 RBAC，可选支持)
└── Public Actions (无验证)
    └── 使用 wrapPublicAction (无认证无授权)
```

### 权限匹配机制

```javascript
// 当前实现 (app/(admin)/actions/dao/sys.js)
export async function checkUserHasActionPermission(userId, actionPath) {
  // actionPath = 函数名 (如 'getUserAction')
  const userPermissionIds = await getUserPermissionIds(userId);
  const actions = await getActionsByPermissionIds(userPermissionIds);
  return matchActionPath(actionPath, actions);
}

function matchActionPath(actionPath, patterns) {
  for (const pattern of patterns) {
    if (pattern === actionPath) return true;
    if (pattern.includes('*')) {
      const regex = patternToRegex(pattern);
      if (regex.test(actionPath)) return true;
    }
  }
  return false;
}
```

**核心特点**：
- 通用的模式匹配逻辑（支持通配符）
- 基于字符串路径的验证
- 易于扩展到不同场景

---

## 🎯 扩展方案设计

### 方案概述

在现有 `actions` 字段基础上，新增 `apis` 字段支持 API 路由权限：

```javascript
// 权限文档扩展结构
{
  "id": "perm-uuid",
  "name": "用户管理",
  "identify": "crud:user:all",
  
  // 原有字段（向后兼容）
  "actions": [
    "**/getUserAction",           // Backend Admin Actions
    "**/deleteMyAccountAction"    // Client Actions（如需 RBAC）
  ],
  
  // 🆕 新增字段
  "apis": [                       // API 路由权限
    "/api/v1/users/*",
    "/api/v1/users/*/profile"
  ]
}
```

### 设计原则

**为什么只有 2 个字段？**

1. **actions** - 所有 Server Actions（函数名匹配）
   - 包括 Backend Admin Actions
   - 包括 Client Actions（如需 RBAC）
   - **不区分前后台**（本质都是 Server Actions）

2. **apis** - API Routes（HTTP 路径匹配）
   - 匹配对象不同（路径 vs 函数名）
   - 无法与 actions 合并

**不需要的字段**：
- ❌ `client_actions` - 与 actions 重复（都是函数名匹配）
- ❌ `resources` - 与 actions 功能重叠（YAGNI 原则）

### 向后兼容策略

1. **保持 `actions` 字段不变**：现有权限配置继续工作
2. **新增 `apis` 字段**：可选字段，用于 API 路由权限
3. **共享匹配逻辑**：使用相同的 `matchActionPath` 函数

---

## 🔧 实现步骤

### Step 1: 扩展数据库 Schema

更新 `permissions` 表结构：

```javascript
// app/(admin)/actions/rbac/crud-action.permission.js

const permissionConfig = {
  collectionName: 'permissions',
  
  fields: {
    // ... 现有字段 ...
    
    // 保留原有字段
    actions: {
      required: false,
      type: 'array',
      maxLength: 50,
      itemType: 'string',
      remark: 'Server Actions (e.g., **/getUserAction)',
      custom: async (value) => {
        if (!value || !Array.isArray(value)) return true;
        const uniqueValues = new Set(value);
        if (uniqueValues.size !== value.length) {
          throw new Error('Duplicate action patterns detected');
        }
        return true;
      },
    },
    
    // 🆕 新增字段
    apis: {
      required: false,
      type: 'array',
      maxLength: 50,
      itemType: 'string',
      remark: 'API Routes (e.g., /api/v1/users/*)',
      custom: async (value) => {
        if (!value || !Array.isArray(value)) return true;
        for (const path of value) {
          if (typeof path !== 'string') {
            throw new Error('API path must be a string');
          }
          if (!path.startsWith('/api/')) {
            throw new Error(`API path must start with /api/: ${path}`);
          }
          if (path.includes(' ')) {
            throw new Error(`API path cannot contain spaces: ${path}`);
          }
        }
        return true;
      },
    },
  },
};
```

### Step 2: 扩展权限检查函数

在 `app/(admin)/actions/dao/sys.js` 中新增函数：

```javascript
/**
 * 检查用户是否有 API 访问权限
 * @param {String} userId - 用户ID
 * @param {String} apiPath - API 路径 (如 '/api/v1/users/123')
 * @returns {Promise<Boolean>}
 */
export async function checkUserHasApiPermission(userId, apiPath) {
  const userPermissionIds = await getUserPermissionIds(userId);
  
  // 超级权限
  if (userPermissionIds.includes('*')) {
    return true;
  }
  
  if (userPermissionIds.length === 0) {
    return false;
  }
  
  // 获取所有权限的 apis 配置
  const apis = await getApisByPermissionIds(userPermissionIds);
  
  if (apis.length === 0) {
    return false;
  }
  
  // 检查是否匹配（复用通配符匹配逻辑）
  return matchActionPath(apiPath, apis);
}

/**
 * 根据权限ID获取 API 配置
 * @param {Array<String>} permissionIds
 * @returns {Promise<Array<String>>}
 */
async function getApisByPermissionIds(permissionIds) {
  const collection = await getCollection('permissions');
  const permissions = await collection
    .find({
      id: { $in: permissionIds },
      enable: true,
      apis: { $exists: true, $ne: null, $not: { $size: 0 } },
    })
    .toArray();
  
  const allApis = [];
  permissions.forEach((perm) => {
    if (Array.isArray(perm.apis)) {
      allApis.push(...perm.apis);
    }
  });
  
  return [...new Set(allApis)];
}
```

### Step 3: 创建 API 路由中间件

创建 `lib/middleware/api-permission.js`：

```javascript
/**
 * API 路由权限中间件
 */
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';

/**
 * 验证 API 路由权限
 * @param {String} apiPath - API 路径
 * @returns {Promise<Object>} { authorized: boolean, userId?: string, error?: string }
 */
export async function checkApiPermission(apiPath) {
  try {
    // 1. 验证用户登录
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return {
        authorized: false,
        error: 'Unauthorized: Please login first',
      };
    }
    
    const userId = session.user.id;
    const userRole = session.user.role;
    
    // 2. admin 角色自动通过
    if (userRole === 'admin') {
      return {
        authorized: true,
        userId,
        isAdmin: true,
      };
    }
    
    // 3. RBAC 权限检查
    const { checkUserHasApiPermission } = await import('@/app/(admin)/actions/dao/sys.js');
    const hasPermission = await checkUserHasApiPermission(userId, apiPath);
    
    if (!hasPermission) {
      return {
        authorized: false,
        error: `Forbidden: API '${apiPath}' not allowed`,
      };
    }
    
    return {
      authorized: true,
      userId,
      isAdmin: false,
    };
  } catch (error) {
    console.error('[API Permission] Check failed:', error);
    return {
      authorized: false,
      error: 'Internal server error',
    };
  }
}

/**
 * API 路由包装器
 * @param {Function} handler - 业务逻辑
 * @param {Object} options - 可选配置
 * @returns {Function} 包装后的 API 处理器
 */
export function withApiPermission(handler, options = {}) {
  const { skipPermission = false } = options;
  
  return async function wrappedApiHandler(request, context = {}) {
    try {
      const url = new URL(request.url);
      const apiPath = url.pathname;
      
      // 权限检查
      if (!skipPermission) {
        const permCheck = await checkApiPermission(apiPath);
        
        if (!permCheck.authorized) {
          return new Response(
            JSON.stringify({ success: false, error: permCheck.error }),
            {
              status: permCheck.error.includes('Unauthorized') ? 401 : 403,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
        
        // 将用户信息注入到 context
        context.userId = permCheck.userId;
        context.isAdmin = permCheck.isAdmin;
      }
      
      // 执行业务逻辑
      return await handler(request, context);
    } catch (error) {
      console.error('[API Route] Error:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Internal server error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}
```

### Step 4: 更新 wrapClientAction（可选）

如果需要为 Client Actions 添加 RBAC 支持：

```javascript
// lib/core/action-wrapper.js

/**
 * 客户端 Action 包装器（支持可选的 RBAC）
 */
export function wrapClientAction(actionType, resourceType, handler, options = {}) {
  const {
    permissionId = null,
    skipPermission = false,
    skipLog = true,
  } = options;
  
  return async function wrappedClientAction(...args) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { success: false, error: 'Unauthorized: Please login first' };
    }
    
    const userId = session.user.id;
    const userRole = session.user.role;
    
    // RBAC 权限检查（如果需要）
    if (!skipPermission && permissionId) {
      if (userRole !== 'admin') {
        // 使用统一的 checkUserHasActionPermission（查询 actions 字段）
        const { checkUserHasActionPermission } = await import('@/app/(admin)/actions/dao/sys.js');
        const hasPermission = await checkUserHasActionPermission(userId, permissionId);
        
        if (!hasPermission) {
          return {
            success: false,
            error: `Forbidden: Action '${permissionId}' not allowed`,
          };
        }
      }
    }
    
    // 执行业务逻辑
    const result = await handler(...args, {
      userId,
      user: session.user,
      isAdmin: userRole === 'admin',
    });
    
    return result;
  };
}
```

### Step 5: 更新权限管理页面

更新 `app/(admin)/admin/rbac/permissions/page.js`：

```javascript
const fieldsConfig = [
  // ... 现有字段 ...
  
  {
    key: 'actions',
    title: 'Server Actions',
    type: 'array',
    table: false,
    form: {
      placeholder: 'e.g., **/getUserAction',
      addButtonText: 'Add Action',
      max: 50,
    },
    detail: {
      render: (value) => {
        if (!value || !Array.isArray(value) || value.length === 0) {
          return <span style={{ color: '#999' }}>-</span>;
        }
        return <div style={{ whiteSpace: 'pre-wrap' }}>{value.join('\n')}</div>;
      },
    },
  },
  
  // 🆕 新增字段
  {
    key: 'apis',
    title: 'API Routes',
    type: 'array',
    table: false,
    form: {
      placeholder: 'e.g., /api/v1/users/*',
      addButtonText: 'Add API Route',
      max: 50,
    },
    detail: {
      render: (value) => {
        if (!value || !Array.isArray(value) || value.length === 0) {
          return <span style={{ color: '#999' }}>-</span>;
        }
        return <div style={{ whiteSpace: 'pre-wrap' }}>{value.join('\n')}</div>;
      },
    },
  },
];
```

---

## 📝 使用示例

### 示例 1: 统一配置前后台操作

```javascript
// 权限配置
{
  "name": "User Management - Full Access",
  "identify": "user:full-access",
  "level": 2,
  
  "actions": [
    "**/*User*Action",          // 所有用户相关的 Server Actions
    "**/deleteMyAccountAction"  // 前台用户删除账号（如需 RBAC）
  ],
  
  "apis": [
    "/api/v1/users/*"           // 所有用户相关的 API 路由
  ]
}
```

### 示例 2: 按操作类型分组（推荐）

```javascript
// 权限 1: 用户读取
{
  "name": "User - Read",
  "actions": [
    "**/get*User*Action",
    "**/list*User*Action",
    "**/query*User*Action"
  ],
  "apis": [
    "/api/v1/users"  // GET only
  ]
}

// 权限 2: 用户写入
{
  "name": "User - Write",
  "level": 2,
  "actions": [
    "**/create*User*Action",
    "**/update*User*Action"
  ],
  "apis": [
    "/api/v1/users"  // POST, PUT, PATCH
  ]
}

// 权限 3: 用户删除（高危）
{
  "name": "User - Delete",
  "level": 4,
  "actions": [
    "**/delete*User*Action"
  ],
  "apis": [
    "/api/v1/users/*"  // DELETE method
  ]
}
```

### 示例 3: API 路由使用 RBAC

```javascript
// 文件: app/api/v1/users/route.js
import { NextResponse } from 'next/server';
import { withApiPermission } from '@/lib/middleware/api-permission';

async function handler(request, context) {
  const { userId, isAdmin } = context;
  
  // 业务逻辑
  const users = await getUsers(userId, isAdmin);
  
  return NextResponse.json({
    success: true,
    data: users,
  });
}

// 使用权限中间件
export const GET = withApiPermission(handler);

// 如果不需要权限检查
export const POST = withApiPermission(handler, { skipPermission: true });
```

### 示例 4: Client Action 使用 RBAC（可选）

```javascript
// 文件: app/(client)/actions/user.js
'use server';

import { wrapClientAction } from '@/lib/core/action-wrapper';

/**
 * 删除用户账号（高危操作，需要权限）
 */
export const deleteMyAccountAction = wrapClientAction(
  'delete',
  'user_account',
  async (password, { userId, isAdmin }) => {
    // 验证密码
    const isValid = await verifyPassword(userId, password);
    if (!isValid) {
      return { success: false, error: 'Invalid password' };
    }
    
    // 删除账号
    await deleteUserAccount(userId);
    
    return { success: true };
  },
  {
    permissionId: 'deleteMyAccountAction',  // ← 函数名
    skipPermission: false,  // ← 需要 RBAC 检查
    skipLog: false,         // ← 记录日志
  }
);

/**
 * 获取用户资料（无需权限）
 */
export async function getUserProfileAction() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }
  
  // 只能获取自己的数据
  const profile = await getUserProfile(session.user.id);
  return { success: true, data: profile };
}
```

---

## 🔄 迁移指南

### 现有数据迁移

如果已有权限配置，运行以下迁移脚本：

```javascript
// scripts/migrate-permissions-add-apis.js
import { getCollection } from '@/lib/database/mongodb';

async function migratePermissions() {
  const collection = await getCollection('permissions');
  
  // 为所有现有权限添加 apis 字段（空数组）
  const result = await collection.updateMany(
    { apis: { $exists: false } },
    { $set: { apis: [] } }
  );
  
  console.log(`Migration completed: ${result.modifiedCount} documents updated`);
}

migratePermissions();
```

### 渐进式迁移策略

1. **第一阶段**：添加 `apis` 字段（空数组，不影响现有功能）
2. **第二阶段**：为需要 API 权限的配置添加 `apis` 值
3. **第三阶段**：在 API Routes 中使用 `withApiPermission`
4. **第四阶段**：为需要 RBAC 的 Client Actions 配置权限

---

## 📊 性能优化

### 缓存策略

```javascript
// lib/cache/permission-cache.js
import NodeCache from 'node-cache';

const permissionCache = new NodeCache({
  stdTTL: 300, // 5分钟过期
  checkperiod: 60,
});

/**
 * 获取用户权限（带缓存）
 */
export async function getUserPermissionsWithCache(userId) {
  const cacheKey = `user_permissions:${userId}`;
  
  let permissions = permissionCache.get(cacheKey);
  if (permissions) {
    return permissions;
  }
  
  // 从数据库加载
  const { getUserPermissionIds, getActionsByPermissionIds, getApisByPermissionIds } = await import('@/app/(admin)/actions/dao/sys.js');
  const permissionIds = await getUserPermissionIds(userId);
  
  permissions = {
    permissionIds,
    actions: await getActionsByPermissionIds(permissionIds),
    apis: await getApisByPermissionIds(permissionIds),
  };
  
  permissionCache.set(cacheKey, permissions);
  return permissions;
}

/**
 * 清除用户权限缓存
 */
export function clearUserPermissionCache(userId) {
  permissionCache.del(`user_permissions:${userId}`);
}
```

---

## 🎓 总结

### 核心设计

**只需要 2 个权限字段**：

1. **`actions`** - 所有 Server Actions
   - 包括 Backend Admin Actions
   - 包括 Client Actions（如需 RBAC）
   - 匹配对象：函数名

2. **`apis`** - API Routes
   - 匹配对象：HTTP 路径
   - 用于 Next.js API Routes

### 核心优势

1. **简洁** - 只有 2 个字段，易于理解
2. **统一** - actions 不区分前后台，符合"都是 Server Actions"的本质
3. **明确** - apis 匹配对象不同，无法与 actions 合并
4. **实用** - 覆盖当前所有使用场景
5. **可扩展** - 未来有需要可以再添加字段

### 快速参考

```javascript
// 权限文档结构（最终版）
{
  "actions": [        // Server Actions（函数名匹配）
    "**/getUserAction",
    "**/deleteMyAccountAction"
  ],
  
  "apis": [          // API Routes（HTTP 路径匹配）
    "/api/v1/users/*",
    "/api/v1/users/*/profile"
  ]
}
```

---

## 📚 相关文档

- [Actions 路径配置指南](./ACTIONS_PATH_GUIDE.md)
- [Server Actions vs Client Actions](./SERVER_VS_CLIENT_ACTIONS.md)
- [RBAC 系统总览](./RBAC_SYSTEM.md)
- [后台认证系统](../admin/AUTH.md)

---

**Version History**:
- `v2.0` (2024-11-14): 简化版，移除 client_actions 和 resources，改 api_routes 为 apis
- `v1.0` (2024-11-14): 初始版本
