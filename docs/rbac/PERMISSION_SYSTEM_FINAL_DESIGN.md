# 权限系统最终设计总结

> **最后更新**: 2024-11-14  
> **版本**: v1.0 (定案)

本文档是权限系统设计的最终定案，总结了所有设计决策和实施方案。

---

## 🎯 设计目标

构建一个**简洁、灵活、易于理解**的 RBAC 权限系统，支持：
1. Server Actions 权限控制
2. API Routes 权限控制
3. 前后台统一的权限模型
4. 可扩展的架构设计

---

## 📐 核心设计

### 权限字段设计（定案）

```javascript
// 权限文档结构
{
  "id": "perm-uuid",
  "name": "权限名称",
  "identify": "权限标识",
  "parent_id": "父权限ID",
  "enable": true,
  "sort": 0,
  "level": 0,  // 0=Other, 1=Bullet, 2=Bomb, 3=Grenade, 4=Nuclear
  "crud_category": 0,
  
  // 核心权限字段（只有 2 个）
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

### 设计原则

| 字段 | 匹配对象 | 检查函数 | 使用场景 |
|------|----------|---------|---------|
| **`actions`** | Action 函数名 | `checkUserHasActionPermission(userId, 'getUserAction')` | 所有 Server Actions<br/>（不区分前后台） |
| **`apis`** | HTTP 路径 | `checkUserHasApiPermission(userId, '/api/v1/users/123')` | Next.js API Routes |

**为什么只有 2 个字段？**

1. **简洁原则**：能用 2 个字段解决的问题，不用 3 个或 4 个
2. **避免重复**：`actions` 已经包含所有 Server Actions（前后台）
3. **明确职责**：`actions` 和 `apis` 匹配对象不同，无法合并
4. **YAGNI 原则**：不为"可能需要"的功能提前设计

---

## 🔍 设计决策过程

### 决策 1: 是否区分 client_actions？

**初始想法**：
```javascript
{
  "actions": ["**/getUserAction"],       // Backend Admin Actions
  "client_actions": ["**/getUserProfileAction"]  // Client Actions
}
```

**问题分析**：
1. 它们都是 Server Actions（函数名匹配）
2. 都使用相同的模式匹配逻辑
3. 唯一区别是文件位置，但权限检查不关心位置
4. 如果一个权限需要控制前后台，需要配置两次

**最终决策**：❌ **不区分**

**理由**：
- 它们本质相同（都是函数名匹配）
- 统一使用 `actions` 字段更简洁
- 符合"都是 Server Actions"的本质

---

### 决策 2: 是否需要 resources 字段？

**初始想法**：
```javascript
{
  "actions": ["**/getUserAction"],  // 具体操作
  "resources": ["user:read"]        // 抽象资源
}
```

**问题分析**：
1. `resources` 与 `actions` 功能重叠
2. 最终还是要调用具体的 Action，还需要再检查一次
3. 增加了系统复杂度
4. 没有明确的使用场景

**最终决策**：❌ **不需要**

**理由**：
- 与 `actions` 功能重叠（YAGNI 原则）
- 任何 `resources` 能做的，`actions` 都能做
- 如果未来确实需要，再添加也不迟

---

### 决策 3: API 路由字段命名

**候选方案**：
- `api_routes` ❌ 太长，拗口
- `api_list` ❌ 有下划线，不够简洁
- `api` ⚠️ 不明确是数组
- `apis` **最佳选择**

**最终决策**：**`apis`**

**理由**：
- 简洁（4 个字母）
- 复数形式暗示数组
- 与 `actions` 命名风格一致

---

## 🏗️ 架构设计

### 权限检查流程

```
用户调用 Server Action
         ↓
[wrapAdminAction/wrapClientAction]
         ↓
1. 验证登录状态
   └─ auth.api.getSession()
      ├─ 未登录 → ❌ 返回 "Unauthorized"
      └─ 已登录 → 继续
         ↓
2. 检查角色
   ├─ admin 角色 → 自动通过（跳过 RBAC）
   └─ user 角色 → 继续步骤 3
         ↓
3. RBAC 权限检查
   └─ checkUserHasActionPermission(userId, permissionId)
      ├─ 查询用户的所有角色
      ├─ 查询角色的所有权限
      ├─ 查询权限的 actions 配置
      ├─ 使用通配符匹配 permissionId
      ├─ 匹配成功 → 继续执行
      └─ 匹配失败 → ❌ 返回 "Forbidden"
         ↓
4. 执行业务逻辑
         ↓
5. 记录日志（可选）
         ↓
6. 返回结果
```

### API 路由权限流程

```
HTTP 请求到达 API Route
         ↓
[withApiPermission]
         ↓
1. 验证登录状态
   └─ auth.api.getSession()
      ├─ 未登录 → ❌ 返回 401
      └─ 已登录 → 继续
         ↓
2. 检查角色
   ├─ admin 角色 → 自动通过
   └─ user 角色 → 继续步骤 3
         ↓
3. RBAC 权限检查
   └─ checkUserHasApiPermission(userId, apiPath)
      ├─ 查询用户的所有权限
      ├─ 查询权限的 apis 配置
      ├─ 使用通配符匹配 apiPath
      ├─ 匹配成功 → 继续执行
      └─ 匹配失败 → ❌ 返回 403
         ↓
4. 执行业务逻辑
         ↓
5. 返回响应
```

---

## 📝 使用规范

### Server Actions 使用规范

#### Backend Admin Actions

```javascript
// 文件: app/(admin)/actions/rbac/crud-action.user.js
'use server';

import { wrapAdminAction } from '@/lib/core/action-wrapper';

export const resetUserPasswordAction = wrapAdminAction(
  'set_password',
  'user',
  async (userId, newPassword, { userId: operatorId, isAdmin }) => {
    // 业务逻辑：可以重置任何用户的密码
    await updatePassword(userId, newPassword);
    return { success: true };
  },
  {
    permissionId: 'resetUserPasswordAction',  // ← 函数名
    skipLog: false,                           // ← 记录日志
  }
);
```

**权限配置**：

```json
{
  "name": "User - Reset Password",
  "level": 3,
  "actions": ["**/resetUserPasswordAction"]
}
```

#### Client Actions（可选 RBAC）

```javascript
// 文件: app/(client)/actions/user.js
'use server';

import { wrapClientAction } from '@/lib/core/action-wrapper';

// 方案 1: 无需 RBAC（登录即可）
export async function getUserProfileAction() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }
  
  const profile = await getUserProfile(session.user.id);
  return { success: true, data: profile };
}

// 方案 2: 需要 RBAC（高危操作）
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
    permissionId: 'deleteMyAccountAction',
    skipPermission: false,
    skipLog: false,
  }
);
```

**权限配置**（方案 2）：

```json
{
  "name": "User - Delete Account",
  "level": 4,
  "actions": ["**/deleteMyAccountAction"]
}
```

### API Routes 使用规范

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

**权限配置**：

```json
{
  "name": "API - User Access",
  "apis": ["/api/v1/users/*"]
}
```

---

## 🎨 最佳实践

### 1. 权限命名规范

| 场景 | 前缀 | 示例 |
|------|------|------|
| 后台管理 | `Admin -` | `Admin - User Management` |
| API 路由 | `API -` | `API - User Access` |
| 客户端 | `Client -` | `Client - Delete Account` |
| 通用 | 无前缀 | `User - Read` |

### 2. 权限层级设计

```
系统管理
├── 用户管理
│   ├── User - Read
│   ├── User - Write
│   └── User - Delete (level: 4)
│
├── 角色管理
│   ├── Role - Read
│   ├── Role - Write
│   └── Role - Delete (level: 3)
│
└── 权限管理
    ├── Permission - Read
    └── Permission - Write (level: 3)
```

### 3. 权限粒度建议

| 操作类型 | 推荐粒度 | 字段 | 示例 |
|---------|---------|------|------|
| 读取操作 | 模块级 | `actions` | `**/get*User*Action` |
| 写入操作 | 操作级 | `actions` | `**/createUserAction`<br/>`**/updateUserAction` |
| 删除操作 | 精确匹配 | `actions` | `**/deleteUserAction` |
| 敏感操作 | 精确匹配 | `actions` | `**/resetPasswordAction` |
| API 路由 | 模块级 | `apis` | `/api/v1/users/*` |

### 4. 通配符使用建议

| 模式 | 匹配范围 | 使用场景 | 风险等级 |
|------|---------|---------|---------|
| `**/getUserAction` | 精确匹配 | 单个操作 | 低 |
| `**/get*User*Action` | 包含关键字 | 同类操作 | 低 |
| `**/*User*Action` | 模块级 | 整个模块 | 中 |
| `**/*Action` | 所有操作 | 超级管理员 | 高 ⚠️ |

---

## 🔐 安全建议

### 1. 权限级别定义

| Level | 名称 | 说明 | 示例操作 |
|-------|------|------|---------|
| 0 | Other | 其他/未分类 | - |
| 1 | Bullet | 低风险操作 | 查询、读取 |
| 2 | Bomb | 中风险操作 | 创建、更新 |
| 3 | Grenade | 高风险操作 | 删除、禁用、权限分配 |
| 4 | Nuclear | 极高风险操作 | 重置密码、删除账号、系统配置 |

### 2. 权限审计

定期审查：
- Level 3 及以上的权限谁拥有
- 哪些用户有多个高危权限
- 哪些权限从未被使用
- 哪些权限被频繁拒绝

### 3. 最小权限原则

- 用户只获得完成工作所需的最小权限
- 按需分配，定期回收
- 高危操作需要额外验证（如密码确认）

---

## 📊 性能优化

### 1. 缓存策略

```javascript
// 缓存用户权限 5 分钟
const permissionCache = new NodeCache({ stdTTL: 300 });

export async function getUserPermissionsWithCache(userId) {
  const cacheKey = `user_permissions:${userId}`;
  
  let permissions = permissionCache.get(cacheKey);
  if (permissions) {
    return permissions;
  }
  
  // 从数据库加载
  permissions = await loadUserPermissions(userId);
  permissionCache.set(cacheKey, permissions);
  
  return permissions;
}
```

### 2. 清除缓存时机

```javascript
// 用户角色变更时
export async function updateUserRoles(userId, roleIds) {
  await updateUserRolesInDB(userId, roleIds);
  clearUserPermissionCache(userId);  // ← 清除缓存
}

// 权限配置变更时
export async function updatePermission(permissionId, data) {
  await updatePermissionInDB(permissionId, data);
  clearAllPermissionCaches();  // ← 清除所有用户缓存
}
```

---

## 🧪 测试策略

### 1. 单元测试

```javascript
// 测试权限匹配逻辑
describe('matchActionPath', () => {
  test('精确匹配', () => {
    expect(matchActionPath('getUserAction', ['**/getUserAction'])).toBe(true);
  });
  
  test('通配符匹配', () => {
    expect(matchActionPath('getUserAction', ['**/get*Action'])).toBe(true);
  });
  
  test('不匹配', () => {
    expect(matchActionPath('getUserAction', ['**/delete*Action'])).toBe(false);
  });
});
```

### 2. 集成测试

```javascript
// 测试完整的权限检查流程
describe('Permission System', () => {
  test('admin 角色自动通过', async () => {
    const hasPermission = await checkUserHasActionPermission('admin-id', 'anyAction');
    expect(hasPermission).toBe(true);
  });
  
  test('user 角色需要 RBAC 检查', async () => {
    // 假设用户有 "**/getUserAction" 权限
    const hasPermission = await checkUserHasActionPermission('user-id', 'getUserAction');
    expect(hasPermission).toBe(true);
  });
  
  test('无权限的操作被拒绝', async () => {
    const hasPermission = await checkUserHasActionPermission('user-id', 'deleteUserAction');
    expect(hasPermission).toBe(false);
  });
});
```

---

## 📚 文档索引

### 核心文档

1. **[权限系统扩展方案](./PERMISSION_SYSTEM_EXTENSION.md)** - 技术实现细节
2. **[Actions 路径配置指南](./ACTIONS_PATH_GUIDE.md)** - actions 字段配置说明
3. **[Server Actions vs Client Actions](./SERVER_VS_CLIENT_ACTIONS.md)** - 概念对比
4. **[数据库迁移指南](./DATABASE_MIGRATION_GUIDE.md)** - 添加 apis 字段

### 相关文档

- [RBAC 系统总览](./RBAC_SYSTEM.md)
- [后台认证系统](../admin/AUTH.md)
- [BaseDAO 使用指南](../admin/BASE_DAO.md)
- [Action Wrapper 文档](../admin/ACTION_LOGGER.md)

---

## 🎓 总结

### 核心决策

1. **只需要 2 个权限字段**
   - `actions` - 所有 Server Actions
   - `apis` - API Routes

2. **不区分前后台**
   - Backend Admin Actions 和 Client Actions 统一使用 `actions`
   - 符合"都是 Server Actions"的本质

3. **简洁优先**
   - 避免不必要的字段（client_actions, resources）
   - YAGNI 原则：不为"可能需要"的功能提前设计

### 设计优势

1. **简洁** - 只有 2 个字段，易于理解和维护
2. **统一** - 前后台使用统一的权限模型
3. **灵活** - 支持通配符，可粗可细
4. **可扩展** - 未来有需要可以轻松添加字段
5. **高性能** - 支持缓存，减少数据库查询

### 实施路径

1. **第一阶段**：数据库迁移（添加 `apis` 字段）
2. **第二阶段**：为需要的权限配置 `apis` 值
3. **第三阶段**：在 API Routes 中使用 `withApiPermission`
4. **第四阶段**：为高危 Client Actions 配置 RBAC
5. **第五阶段**：性能优化（缓存）和安全审计

---

**Version History**:
- `v1.0` (2024-11-14): 初始版本，权限系统最终设计定案

