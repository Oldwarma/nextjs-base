# API 和 Actions 权限配置指南

本文档说明如何在后台权限管理中配置 API Routes 和 Server Actions 的访问权限。

## 概述

系统支持两种类型的权限控制：

1. **Server Actions 权限** - 通过 `actions` 字段配置，使用 `wrapAdminAction` 包装
2. **API Routes 权限** - 通过 `apis` 字段配置，使用 `lib/api/api-auth.js` 辅助函数

## Server Actions 权限配置

### 权限标识（permissionId）生成规则

使用 `wrapAdminAction` 或 `createCrudActions` 时，系统会自动生成 `permissionId`：

```
格式：{actionType}{ResourceType}Action

示例：
- ('create', 'user') => createUserAction
- ('delete', 'asset') => deleteAssetAction
- ('batch_delete', 'role') => batchDeleteRoleAction
- ('query', 'permission') => queryPermissionAction
```

### 在后台配置权限

在 **Permission Management** 页面，编辑权限时配置 `actions` 字段：

#### 精确匹配

```
createUserAction
deleteAssetAction
updateRoleAction
```

#### 通配符匹配

```
# 匹配所有用户相关操作
*UserAction

# 匹配所有创建操作
create*Action

# 匹配所有删除操作（包括批量删除）
delete*Action
batchDelete*Action

# 匹配所有查询操作
query*Action

# 匹配所有操作（超级权限）
*Action
```

### 素材管理（Assets）权限示例

| 操作 | permissionId | 推荐配置模式 |
|------|-------------|-------------|
| 查询列表 | `queryAssetAction` | `query*Action` 或 `*AssetAction` |
| 查询详情 | `queryAssetAction` | `query*Action` 或 `*AssetAction` |
| 更新信息 | `updateAssetAction` | `update*Action` 或 `*AssetAction` |
| 删除文件 | `deleteAssetAction` | `delete*Action` 或 `*AssetAction` |
| 批量删除 | `batchDeleteAssetAction` | `batchDelete*Action` 或 `*AssetAction` |

## API Routes 权限配置

### 权限配置格式

支持按 HTTP 方法精确控制 API 访问权限：

```
格式：METHOD:PATH

示例：
- POST:/api/upload     # 只允许上传
- DELETE:/api/upload   # 只允许删除
- GET:/api/users/*     # 只允许查询用户
- /api/public/*        # 允许所有方法（向后兼容）
```

### 在后台配置权限

在 **Permission Management** 页面，编辑权限时配置 `apis` 字段：

#### 按方法区分

```
# 只允许上传文件
POST:/api/upload
POST:/api/upload/*

# 只允许删除文件
DELETE:/api/upload
DELETE:/api/upload/*

# 只允许查询
GET:/api/users
GET:/api/users/*
```

#### 允许所有方法（向后兼容）

```
# 允许所有方法访问
/api/upload
/api/upload/*

# 通配符
/api/v1/*
```

## 代码示例

### API Route 使用辅助函数

```javascript
// app/api/upload/route.js
import { NextResponse } from 'next/server';
import { getApiAuth, checkApiRbacPermission, checkApiAccess } from '@/lib/api/api-auth';

// 方式 1：分步检查（推荐，更灵活）
export async function POST(request) {
  // 1. 获取认证信息
  const auth = await getApiAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  
  // 2. 可选：RBAC 权限检查
  const permission = await checkApiRbacPermission(
    auth.userId, 
    'POST:/api/upload',
    { isAdmin: auth.isAdmin }
  );
  if (!permission.allowed) {
    return NextResponse.json({ error: permission.error }, { status: 403 });
  }
  
  // 3. 业务逻辑
  const { userId, isAdmin } = auth;
  // ...
}

// 方式 2：组合检查（简洁）
export async function DELETE(request) {
  const access = await checkApiAccess(request, {
    requireAuth: true,
    rbacPath: 'DELETE:/api/upload',  // 可选，不提供则跳过 RBAC
  });
  
  if (!access.success) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  
  const { userId, isAdmin } = access;
  // 业务逻辑...
}

// 方式 3：公开接口（无需登录）
export async function GET() {
  // 直接执行业务逻辑，无需认证
  return NextResponse.json({ data: '...' });
}
```

### Server Action 使用 wrapAdminAction

```javascript
// app/(admin)/actions/xxx/crud-action.xxx.js
'use server';

import { wrapAdminAction } from '@/lib/core/action-wrapper';

// 自动生成 permissionId: deleteAssetAction
export const remove = wrapAdminAction('delete', 'asset', async (id, context) => {
  const { userId, isAdmin } = context;
  // 业务逻辑
});

// 手动指定 permissionId
export const customAction = wrapAdminAction('custom', 'asset', async (params, context) => {
  // 业务逻辑
}, {
  permissionId: 'myCustomAssetAction',  // 手动指定
});
```

### 使用 createCrudActions

```javascript
// app/(admin)/actions/xxx/crud-action.xxx.js
'use server';

import { createCrudActions } from '@/lib/core/crud-helper';

const crudActions = createCrudActions({
  collectionName: 'assets',
  resourceType: 'asset',  // 使用单数形式
  // ... 其他配置
});

// 自动生成的 permissionId:
// - getList: queryAssetAction
// - getDetail: queryAssetAction
// - create: createAssetAction
// - update: updateAssetAction
// - delete: deleteAssetAction
// - batchUpdate: batchUpdateAssetAction
// - batchDelete: batchDeleteAssetAction

export const getList = crudActions.getList;
export const getDetail = crudActions.getDetail;
export const create = crudActions.create;
export const update = crudActions.update;
export const remove = crudActions.delete;
```

## 权限层次设计

### Server Actions 权限层次

```
1. wrapAdminAction (RBAC 层)
   ├─ admin 用户 → 跳过 RBAC 检查，直接执行
   └─ 普通用户 → 检查是否有对应 Action 权限
        ↓
2. 业务逻辑层
   ├─ 使用 context.isAdmin 判断是否是管理员
   └─ 根据业务需求做进一步权限控制
```

### API Routes 权限层次

```
1. getApiAuth() - 认证层
   ├─ 未登录 → 返回 401
   └─ 已登录 → 继续
        ↓
2. checkApiRbacPermission() - RBAC 层（可选）
   ├─ admin 用户 → 自动通过
   └─ 普通用户 → 检查 apis 配置
        ↓
3. 业务逻辑层
   ├─ 使用 isAdmin 判断是否是管理员
   └─ 根据业务需求做进一步权限控制
```

## 权限配置最佳实践

### 1. 按功能模块分组

创建权限时，按功能模块组织：

```
- Asset Management (父权限)
  ├─ Asset - View (actions: queryAssetAction)
  ├─ Asset - Edit (actions: updateAssetAction)
  └─ Asset - Delete (actions: deleteAssetAction, batchDeleteAssetAction)
```

### 2. 使用通配符简化配置

对于需要完整访问权限的角色：

```
actions:
  - *AssetAction      # 所有素材操作
  - *UserAction       # 所有用户操作
  - query*Action      # 所有查询操作
```

### 3. API 权限按需开放

```
apis:
  - GET:/api/users/*           # 只读
  - POST:/api/upload           # 只允许上传
  - DELETE:/api/upload         # 只允许删除
```

### 4. 前台用户 API 权限

如果需要给前台用户提供上传功能：

1. 创建一个 "User Upload" 权限
2. 配置 `apis: POST:/api/upload`
3. 将此权限分配给对应角色

## 常见问题

### Q: 为什么我的 Action 没有被权限控制？

检查以下几点：
1. Action 是否使用 `wrapAdminAction` 或 `createCrudActions` 包装
2. 是否设置了 `skipPermission: true`
3. 用户是否是 admin 角色（admin 自动通过所有权限检查）

### Q: 如何查看某个 Action 的 permissionId？

1. 查看 Action 文件中的注释
2. 根据命名规则推断：`{actionType}{ResourceType}Action`
3. 开启日志查看权限检查输出

### Q: API 权限和 Action 权限有什么区别？

- **API 权限**：控制 HTTP 请求（如 REST API）
- **Action 权限**：控制 Server Actions（Next.js 特有）

同一个功能可能同时需要两种权限，例如：
- 前台用户通过 API 上传：需要 `POST:/api/upload`
- 后台管理员通过 Action 删除：需要 `deleteAssetAction`

### Q: 业务逻辑层的权限检查是什么？

有些权限不能仅通过 RBAC 控制，需要在业务逻辑中判断。例如：

```javascript
// 文件删除：用户只能删除自己的文件，管理员可以删除任何文件
export async function deleteFile(keyOrUrl, userId, options = {}) {
  const { isAdmin = false } = options;
  
  // 查找文件
  const record = await getOne({ dbName: 'assets', whereJson: { key } });
  
  // 业务逻辑层权限检查
  if (!isAdmin && record.userId !== userId) {
    return { success: false, error: 'Permission denied' };
  }
  
  // 执行删除...
}
```

这样即使普通用户有 `deleteAssetAction` 权限，也只能删除自己的文件。
