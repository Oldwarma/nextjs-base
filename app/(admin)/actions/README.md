# Admin Actions

后台管理 Server Actions 目录。

> **版本**: v0.1.0  
> **更新日期**: 2025-12-04

## 目录结构

```
actions/
├── cms/                    # CMS 内容管理
│   └── crud-action.post.js
├── dashboard/              # 仪表盘
│   └── dashboard-stats.js
├── dao/                    # 数据访问层
│   ├── base.js             # BaseDAO 基类
│   ├── sys.js              # RBAC 系统函数
│   └── user.js
├── rbac/                   # RBAC 权限管理
│   ├── crud-action.menu.js
│   ├── crud-action.permission.js
│   ├── crud-action.role.js
│   ├── crud-action.user.js
│   └── user-permissions.js
└── system/                 # 系统管理
    ├── admin-usage.js
    ├── crud-action.assets.js
    └── upload-actions.js
```

## 使用方式

### 统一使用 wrapAction

所有 Action 统一使用 `wrapAction` 包装器，通过命名约定自动识别权限级别：

```javascript
import { wrapAction } from '@/lib/core/action-wrapper';

// 后台功能（需要后台权限 + RBAC）
export const sysGetUserList = wrapAction('sysGetUserList', async (params, ctx) => {
  const { userId, isAdmin } = ctx;
  return { success: true, data: [] };
});

// 查询操作（跳过日志）
export const sysQueryDashboard = wrapAction('sysQueryDashboard', async (params, ctx) => {
  return { success: true, data: {} };
}, { skipLog: true });
```

### 命名约定

| 前缀 | 权限级别 | 说明 |
|------|---------|------|
| `sys` | system | 需要后台权限 + RBAC 检查 |
| `auth` | auth | 需要登录（后台公开方法需额外检查 `isBackendAllowed`） |
| `pub` | public | 公开可访问 |
| `_` | private | 私有方法，不能被前端调用 |

### Handler 签名（重要！）

```javascript
handler(params, ctx)
```

- **params** - 前端传入的参数对象（第一个参数）
- **ctx** - 上下文对象 `{ userId, isAdmin, user }`

⚠️ **注意**：handler 只接收两个参数！不要使用 `(id, data, ctx)` 这样的多参数签名。

### 使用 createCrudActions

对于标准 CRUD 操作，使用 `createCrudActions` 快速生成：

```javascript
import { createCrudActions } from '@/lib/core/crud-helper';

const crudActions = createCrudActions({
  modelName: 'post',  // Prisma 模型名（小写）
  // ... 配置
});

// 自动生成 sys 前缀的 Actions
export const getPostListAction = crudActions.getList;
export const createPostAction = crudActions.create;
export const updatePostAction = crudActions.update;
export const deletePostAction = crudActions.delete;
```

### CRUD 参数格式

```javascript
// 获取列表
await crudActions.getList({ pageIndex: 1, pageSize: 20, whereJson: {} });

// 获取详情 - 支持字符串或对象
await crudActions.getDetail('record-id');
await crudActions.getDetail({ id: 'record-id' });

// 创建
await crudActions.create({ name: 'xxx', ... });

// 更新 - 必须包含 id！
await crudActions.update({ id: 'record-id', name: 'new name', ... });

// 删除 - 支持字符串或对象
await crudActions.delete('record-id');
await crudActions.delete({ id: 'record-id' });
```

## 后台公开方法

有些方法虽然在后台使用，但不需要 RBAC 检查，只需要用户有后台访问权限即可（如获取用户菜单、权限列表等基础设施方法）。

使用 `auth` 前缀 + 手动检查 `isBackendAllowed`：

```javascript
import { checkBackendAccessAction } from '@/lib/auth/admin-auth';

export const authQueryUserAccessibleMenus = wrapAction('authQueryUserAccessibleMenus', async (params, ctx) => {
  // 手动检查后台访问权限
  const backendCheck = await checkBackendAccessAction();
  if (!backendCheck.hasAccess) {
    return { success: false, error: backendCheck.error };
  }
  
  // 业务逻辑...
  return { success: true, data: menus };
}, { skipLog: true });
```

## 权限检查流程

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
4. 是否有后台权限（isBackendAllowed）？
   ├─ 否 → 返回 { error: 'Forbidden' }
   └─ 是 → 继续
        ↓
5. RBAC 权限检查
   └─ 没有 → 返回 { error: 'Action not allowed' }
        ↓
6. 执行业务逻辑 ✓
```

## 权限来源（v3.1）

用户的权限来自两个渠道：

1. **角色权限**：角色 → 权限（始终生效）
2. **菜单权限**：菜单 → 权限（可选，需开启 `inheritMenuPermissions`）

```javascript
// sys.js 中的 getUserPermissionIds 函数会自动聚合两个来源的权限
const allPermissionIds = await getUserPermissionIds(userId);
```

## 相关文档

- [权限命名约定指南](https://nextjsbase.com/zh/docs/architecture/PERMISSION_MODEL)
- [RBAC 快速参考](https://nextjsbase.com/zh/docs/admin/rbac/CONFIGURATION)
- [RBAC 系统文档索引](https://nextjsbase.com/zh/docs/admin/rbac)
