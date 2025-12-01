# Admin Actions

后台管理 Server Actions 目录。

## 目录结构

```
actions/
├── cms/                    # CMS 内容管理
│   └── crud-action.post.js
├── dashboard/              # 仪表盘
│   └── dashboard-stats.js
├── dao/                    # 数据访问层
│   ├── base.js
│   ├── sys.js
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
export const sysQueryDashboard = wrapAction('sysQueryDashboard', async (_, ctx) => {
  return { success: true, data: {} };
}, { skipLog: true });
```

### 命名约定

| 前缀 | 权限级别 | 说明 |
|------|---------|------|
| `sys` | system | 需要后台权限 + RBAC 检查 |
| `auth` | auth | 需要登录 |
| `pub` | public | 公开可访问 |
| `_` | private | 私有方法，不能被前端调用 |

### Handler 签名

```javascript
handler(params, ctx)
```

- **params** - 前端传入的参数（第一个参数）
- **ctx** - 上下文对象 `{ userId, isAdmin, user }`

### 使用 createCrudActions

对于标准 CRUD 操作，使用 `createCrudActions` 快速生成：

```javascript
import { createCrudActions } from '@/lib/core/crud-helper';

const crudActions = createCrudActions({
  collectionName: 'posts',
  // ... 配置
});

// 自动生成 sys 前缀的 Actions
export const getPostListAction = crudActions.getList;
export const createPostAction = crudActions.create;
export const updatePostAction = crudActions.update;
export const deletePostAction = crudActions.delete;
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

## 相关文档

- [权限命名约定指南](../../../docs/rbac/PERMISSION_NAMING_CONVENTION.md)
- [RBAC 快速参考](../../../docs/rbac/RBAC_QUICK_REFERENCE.md)
