# Actions 路径配置指南

> **最后更新**: 2024-11-14  
> **版本**: v1.0  

本文档详细说明了如何在权限管理中正确配置 `actions` 路径。

---

## 🎯 核心概念

### Actions 是什么？

`actions` 是权限文档中的一个字符串数组字段，用于定义该权限可以访问的 **Server Action 函数名称**。

**关键点**：
- ✅ `actions` 中配置的是 **纯函数名称**（不包含文件路径）
- ✅ 使用 **通配符模式** 来匹配多个函数
- ✅ 匹配时是对 **函数名称** 进行模式匹配

**重要说明**：
- 当前系统中所有 `permissionId` 都是**纯函数名**（如 `createUserAction`）
- **不包含文件路径**（不是 `app/actions/createUserAction`）
- `**/` 前缀是**可选的**，为了兼容性和习惯性写法
- `create*Action` 和 `**/create*Action` **效果完全相同**

---

## 📝 配置格式

### 基本格式（推荐写法）

```javascript
{
  "id": "perm-uuid",
  "name": "用户管理",
  "actions": [
    "getUserAction",           // ✅ 推荐：精确匹配函数名（简洁）
    "get*Action",              // ✅ 推荐：通配符匹配（简洁）
    "*User*Action",            // ✅ 推荐：包含关键字匹配（简洁）
    "create*Action"            // ✅ 推荐：创建操作（简洁）
  ]
}
```

### 兼容写法（也支持）

```javascript
{
  "id": "perm-uuid",
  "name": "用户管理",
  "actions": [
    "**/getUserAction",        // ✅ 兼容：带 **/ 前缀（冗余但不影响）
    "**/get*Action",           // ✅ 兼容：带 **/ 前缀
    "**/*User*Action",         // ✅ 兼容：带 **/ 前缀
    "**/create*Action"         // ✅ 兼容：带 **/ 前缀
  ]
}
```

> 💡 **提示**：推荐使用简洁写法（不带 `**/`），但系统会兼容带 `**/` 前缀的写法。

### 通配符规则

| 模式 | 说明 | 匹配示例 | 不匹配示例 |
|------|------|----------|-----------|
| `getUserAction` 或 `**/getUserAction` | 精确匹配函数名 | `getUserAction` | `getUserListAction` |
| `get*Action` 或 `**/get*Action` | 以 get 开头，以 Action 结尾 | `getUserAction`<br/>`getRoleAction`<br/>`getCustomListAction` | `updateUserAction`<br/>`deleteRole` |
| `*User*Action` 或 `**/*User*Action` | 包含 User 的 Action | `getUserAction`<br/>`updateUserAction`<br/>`deleteUserAction` | `getRoleAction`<br/>`getMenuAction` |
| `*` 或 `**/*` | 匹配所有函数 | 所有函数 | ⚠️ 慎用 |

**通配符说明**：
- `*` - 匹配任意字符
- `**` - 历史遗留前缀，当前实现中与 `*` 效果相同
- 模式区分大小写
- 推荐使用简洁写法（不带 `**/`）

---

## 🎬 实际案例

### 案例 1: 自定义模块

**场景**：你在 `/app/(admin)/actions/rbac/custom/actions.js` 中定义了一个函数：

```javascript
// 文件路径: /app/(admin)/actions/rbac/custom/actions.js

export const getCustomListAction = wrapAdminAction(
  'read',
  'custom',
  async ({ userId, isAdmin }) => {
    // 业务逻辑
    return { success: true, data: [] };
  },
  {
    permissionId: 'getCustomListAction', // ✅ 关键：这里传入函数名
    skipLog: false,
  }
);
```

**如何配置权限**：

在权限管理页面 (`/admin/rbac/permissions`)，创建或编辑权限时，在 **Actions** 字段中添加：

```json
[
  "getCustomListAction"
]
```

或兼容写法（效果相同）：

```json
[
  "**/getCustomListAction"
]
```

**说明**：
- `permissionId: 'getCustomListAction'` - 在 `wrapAdminAction` 中声明**纯函数名**
- `actions: ["getCustomListAction"]` - 在权限文档中配置匹配模式（推荐简洁写法）
- `actions: ["**/getCustomListAction"]` - 也支持带 `**/` 前缀（兼容性）
- 当用户调用 `getCustomListAction` 时，系统会检查用户的所有权限的 `actions` 数组，看是否有模式能匹配 `getCustomListAction`

---

### 案例 2: 模块级权限（推荐）

**场景**：你有多个自定义相关的函数：

```javascript
// 文件路径: /app/(admin)/actions/rbac/custom/actions.js

export const getCustomListAction = wrapAdminAction(
  'read', 'custom',
  async (params, { userId, isAdmin }) => { /* ... */ },
  { permissionId: 'getCustomListAction' }
);

export const createCustomAction = wrapAdminAction(
  'create', 'custom',
  async (data, { userId, isAdmin }) => { /* ... */ },
  { permissionId: 'createCustomAction' }
);

export const updateCustomAction = wrapAdminAction(
  'update', 'custom',
  async (id, data, { userId, isAdmin }) => { /* ... */ },
  { permissionId: 'updateCustomAction' }
);

export const deleteCustomAction = wrapAdminAction(
  'delete', 'custom',
  async (id, { userId, isAdmin }) => { /* ... */ },
  { permissionId: 'deleteCustomAction' }
);
```

**如何配置权限**：

#### 方案 1: 按操作类型分组（推荐）

创建多个权限：

**权限 1: Custom - Read**
```json
{
  "name": "Custom - Read",
  "identify": "crud:custom:read",
  "actions": [
    "get*Custom*Action",
    "find*Custom*Action",
    "list*Custom*Action",
    "query*Custom*Action"
  ]
}
```

**权限 2: Custom - Write**
```json
{
  "name": "Custom - Write",
  "identify": "crud:custom:write",
  "actions": [
    "create*Custom*Action",
    "update*Custom*Action"
  ]
}
```

**权限 3: Custom - Delete**
```json
{
  "name": "Custom - Delete",
  "identify": "crud:custom:delete",
  "actions": [
    "delete*Custom*Action"
  ]
}
```

> 💡 **提示**：推荐使用简洁写法（不带 `**/`），但如果你习惯写 `**/get*Custom*Action`，也完全支持。

#### 方案 2: 全模块权限

```json
{
  "name": "Custom - Full Access",
  "identify": "crud:custom:all",
  "actions": [
    "*Custom*Action"
  ]
}
```

或兼容写法：

```json
{
  "name": "Custom - Full Access",
  "identify": "crud:custom:all",
  "actions": [
    "**/*Custom*Action"
  ]
}
```

---

### 案例 3: 混合权限

**场景**：你有一个复杂的功能，包含多个子模块：

```javascript
// 文件路径: /app/(admin)/actions/business/order/actions.js

export const getOrderListAction = wrapAdminAction(
  'read', 'order',
  async (params, { userId, isAdmin }) => { /* ... */ },
  { permissionId: 'getOrderListAction' }
);

export const getOrderDetailAction = wrapAdminAction(
  'read', 'order',
  async (orderId, { userId, isAdmin }) => { /* ... */ },
  { permissionId: 'getOrderDetailAction' }
);

export const exportOrderAction = wrapAdminAction(
  'export', 'order',
  async (params, { userId, isAdmin }) => { /* ... */ },
  { permissionId: 'exportOrderAction' }
);

export const refundOrderAction = wrapAdminAction(
  'refund', 'order',
  async (orderId, { userId, isAdmin }) => { /* ... */ },
  { permissionId: 'refundOrderAction' }
);
```

**如何配置权限**：

**权限 1: 订单 - 查看**
```json
{
  "name": "Order - View",
  "identify": "business:order:view",
  "actions": [
    "**/getOrder*Action",
    "**/listOrder*Action"
  ]
}
```

**权限 2: 订单 - 导出**
```json
{
  "name": "Order - Export",
  "identify": "business:order:export",
  "actions": [
    "**/exportOrder*Action"
  ]
}
```

**权限 3: 订单 - 退款**
```json
{
  "name": "Order - Refund",
  "identify": "business:order:refund",
  "level": 3,  // Grenade Level (高危操作)
  "actions": [
    "**/refundOrder*Action"
  ]
}
```

---

## 🔍 匹配机制详解

### 匹配流程

```javascript
// 1. 用户调用 Server Action
const result = await getCustomListAction(params);

// 2. wrapAdminAction 中触发权限检查
wrapAdminAction(
  'read', 'custom',
  async (params, { userId, isAdmin }) => { /* ... */ },
  {
    permissionId: 'getCustomListAction' // ← 这个值会被用于匹配
  }
);

// 3. 权限检查逻辑
export async function checkUserHasActionPermission(userId, actionPath) {
  // actionPath = 'getCustomListAction' (来自 permissionId)
  
  // 获取用户的所有权限
  const userPermissions = await getUserPermissions(userId);
  
  // 遍历每个权限的 actions 数组
  for (const permission of userPermissions) {
    for (const pattern of permission.actions) {
      // 将通配符模式转换为正则表达式
      // 例如: "**/get*Custom*Action" → /^.*\/get.*Custom.*Action$/
      const regex = patternToRegex(pattern);
      
      // 测试是否匹配
      if (regex.test(actionPath)) {
        return true; // ✅ 匹配成功
      }
    }
  }
  
  return false; // ❌ 没有匹配的权限
}
```

### 通配符转换规则

```javascript
function patternToRegex(pattern) {
  let regexStr = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')  // 转义特殊字符
    .replace(/\*\*/g, '__DOUBLE_STAR__')     // 临时替换 **
    .replace(/\*/g, '[^/]*')                 // * 匹配单层路径
    .replace(/__DOUBLE_STAR__/g, '.*');      // ** 匹配任意层级
  
  return new RegExp(`^${regexStr}$`);
}
```

**示例转换**：

| 模式 | 转换后的正则 | 说明 |
|------|------------|------|
| `**/getUserAction` | `/^.*\/getUserAction$/` | 以 / 分隔，后面精确匹配 |
| `**/get*Action` | `/^.*\/get[^/]*Action$/` | get 和 Action 之间可以有任意字符 |
| `**/*User*` | `/^.*\/[^/]*User.*$/` | 包含 User 的任意内容 |

---

## 📋 最佳实践

### ✅ DO - 推荐做法

1. **使用语义化的函数命名**
   ```javascript
   // ✅ 好的命名 - 清晰表达操作对象和动作
   getUserListAction
   createOrderAction
   updateProductAction
   deleteCommentAction
   exportReportAction
   ```

2. **保持命名一致性**
   ```javascript
   // ✅ 统一使用 Action 后缀
   getUserAction
   createUserAction
   updateUserAction
   deleteUserAction
   
   // ✅ 统一使用动词+名词格式
   get + User + Action
   create + Order + Action
   export + Report + Action
   ```

3. **使用模块级通配符（推荐）**
   ```json
   {
     "name": "User Management",
     "actions": [
       "**/*User*Action"  // 匹配所有包含 User 的 Action
     ]
   }
   ```

4. **按 CRUD 操作分组**
   ```json
   {
     "name": "User - Read",
     "actions": [
       "**/get*User*Action",
       "**/list*User*Action",
       "**/query*User*Action"
     ]
   },
   {
     "name": "User - Write",
     "actions": [
       "**/create*User*Action",
       "**/update*User*Action"
     ]
   },
   {
     "name": "User - Delete",
     "level": 3,  // 高危操作
     "actions": [
       "**/delete*User*Action"
     ]
   }
   ```

5. **使用精确匹配保护敏感操作**
   ```json
   {
     "name": "User - Reset Password",
     "level": 3,
     "actions": [
       "**/resetUserPasswordAction"  // 精确匹配，避免误匹配
     ]
   }
   ```

### ❌ DON'T - 避免的做法

1. **❌ 不要配置文件路径**
   ```json
   // ❌ 错误 - 这是文件路径，不会匹配
   {
     "actions": [
       "/app/(admin)/actions/rbac/custom/actions.js"
     ]
   }
   ```

2. **❌ 不要过度使用全局通配符**
   ```json
   // ❌ 危险 - 会匹配所有 Action
   {
     "actions": [
       "**/*"
     ]
   }
   ```

3. **❌ 不要使用不一致的命名**
   ```javascript
   // ❌ 混乱的命名
   getUserData        // 没有 Action 后缀
   createUser         // 没有 Action 后缀
   UpdateUserAction   // 大小写不一致
   user_delete        // 下划线分隔
   ```

4. **❌ 不要忘记在 wrapAdminAction 中声明 permissionId**
   ```javascript
   // ❌ 错误 - 没有 permissionId，权限检查会失败
   export const getUserAction = wrapAdminAction(
     'read', 'user',
     async (params, { userId, isAdmin }) => { /* ... */ }
     // 缺少 { permissionId: 'getUserAction' }
   );
   ```

---

## 🛠️ 实操步骤

### Step 1: 编写 Server Action

```javascript
// 文件: /app/(admin)/actions/rbac/custom/actions.js
'use server';

import { wrapAdminAction } from '@/lib/core/action-wrapper';

/**
 * 获取自定义列表
 */
export const getCustomListAction = wrapAdminAction(
  'read',                        // actionType
  'custom',                      // resourceType
  async (params, { userId, isAdmin }) => {
    // 业务逻辑
    return { success: true, data: [] };
  },
  {
    permissionId: 'getCustomListAction',  // ← 关键：函数名
    skipLog: false,
  }
);

/**
 * 创建自定义项
 */
export const createCustomAction = wrapAdminAction(
  'create',
  'custom',
  async (data, { userId, isAdmin }) => {
    // 业务逻辑
    return { success: true };
  },
  {
    permissionId: 'createCustomAction',  // ← 关键：函数名
    skipLog: false,
  }
);
```

### Step 2: 在权限管理页面配置

1. 访问 `/admin/rbac/permissions`
2. 点击 **Create** 按钮
3. 填写表单：

   | 字段 | 值 | 说明 |
   |------|-----|------|
   | **Name** | `Custom - Read` | 权限名称 |
   | **Identify** | `crud:custom:read` | 权限标识（用于分类） |
   | **Parent Permission** | (可选) 选择父权限 | 用于层级管理 |
   | **CRUD Category** | `Read` | CRUD 类型 |
   | **Permission Level** | `Bullet` | 权限级别 |
   | **Actions** | `["**/get*Custom*Action"]` | ⚠️ 关键配置 |
   | **Enabled** | `✅ Yes` | 启用状态 |
   | **Sort** | `100` | 排序 |

4. 点击 **Submit** 保存

### Step 3: 将权限分配给角色

1. 访问 `/admin/rbac/roles`
2. 编辑目标角色（例如 "编辑员"）
3. 在 **Permissions** 字段中选择 `Custom - Read`
4. 点击 **Submit** 保存

### Step 4: 将角色分配给用户

1. 访问 `/admin/rbac/users`
2. 找到目标用户，点击 **Assign Roles**
3. 选择 "编辑员" 角色
4. 点击 **Submit** 保存

### Step 5: 测试权限

```javascript
// 在前端页面调用
import { getCustomListAction } from '@/app/(admin)/actions/rbac/custom/actions';

const result = await getCustomListAction({ page: 1, pageSize: 10 });

if (result.success) {
  console.log('✅ 权限验证成功', result.data);
} else {
  console.error('❌ 权限验证失败', result.error);
  // 预期输出: "Forbidden: Action 'getCustomListAction' not allowed"
}
```

---

## 🧪 测试与调试

### 查看用户的实际权限

```javascript
// 在 Server Action 或 API 中
import { checkUserHasActionPermission } from '@/app/(admin)/actions/dao/sys';

const hasPermission = await checkUserHasActionPermission(
  userId,
  'getCustomListAction'
);

console.log('Has permission:', hasPermission);
```

### 查看权限匹配日志

在 `action-wrapper.js` 中，权限检查失败时会自动记录日志：

```javascript
// lib/core/action-wrapper.js (line ~120)
if (!hasPermission) {
  const error = `Forbidden: Action '${permissionId}' not allowed`;
  await logActionToDatabase({
    userId,
    isAdmin: false,
    actionType,
    resourceType,
    permissionId,
    status: 'forbidden',
    error,
    // ...
  });
  // 日志会记录在 action_logs 表中
}
```

查看日志：访问 `/admin/system/logs` (如果有的话)

### 常见问题排查

| 问题 | 可能原因 | 解决方法 |
|------|---------|---------|
| 调用 Action 时报 "Forbidden" | 1. 权限的 `actions` 配置错误<br/>2. 用户没有被分配该权限<br/>3. `permissionId` 与 `actions` 不匹配 | 1. 检查权限配置<br/>2. 检查用户角色<br/>3. 检查函数名是否一致 |
| Admin 角色也被拒绝 | `requireAdmin: true` 但使用了错误的检查函数 | 确保 BaseDAO 或 wrapper 配置正确 |
| 权限配置后不生效 | 1. 缓存问题<br/>2. 角色未绑定权限<br/>3. 用户未绑定角色 | 1. 重新登录<br/>2. 检查角色-权限绑定<br/>3. 检查用户-角色绑定 |

---

## 📚 相关文档

- [RBAC 系统总览](./RBAC_SYSTEM.md)
- [权限验证实现指南](./RBAC_IMPLEMENTATION_GUIDE.md)
- [BaseDAO 使用指南](../admin/BASE_DAO.md)
- [Action Wrapper 文档](../admin/ACTION_LOGGER.md)
- [后台认证系统](../admin/AUTH.md)

---

## ❓ FAQ（常见问题）

### Q1: 为什么有些权限配置使用 `**/create*Action`，有些使用 `create*Action`？

**答**：两种写法**效果完全相同**。

- `**/` 前缀是历史遗留和兼容性写法
- 当前系统中所有 `permissionId` 都是**纯函数名**（如 `createUserAction`）
- **不包含文件路径**
- 推荐使用简洁写法：`create*Action`（不带 `**/`）
- 但系统会兼容带 `**/` 的写法

### Q2: `**/` 前缀的意义是什么？

**答**：在当前实现中，`**/` 前缀**没有实际意义**，只是为了：

1. **兼容性**：保持与旧配置的兼容
2. **习惯性写法**：类似 glob 模式的写法习惯
3. **未来扩展**：如果将来需要引入路径区分，可以无缝升级

**示例对比**：

| 写法 | 是否推荐 | 匹配效果 |
|------|---------|---------|
| `create*Action` | ✅ 推荐（简洁） | 匹配 `createUserAction`、`createRoleAction` 等 |
| `**/create*Action` | ✅ 兼容（冗余） | 匹配效果与上面**完全相同** |

### Q3: `permissionId` 是否可以包含文件路径？

**答**：**不推荐**。

当前系统设计是基于**纯函数名**：
- ✅ 推荐：`createUserAction`
- ❌ 不推荐：`app/actions/createUserAction`

原因：
1. Next.js Server Actions 的函数名通常已经包含资源类型
2. 不太可能出现完全相同的函数名
3. 保持简单性，降低维护成本

### Q4: 如何匹配特定模块的所有操作？

**答**：使用包含资源类型的通配符。

```json
// 匹配所有 User 相关操作
"actions": ["*User*Action"]

// 匹配所有 Permission 相关操作
"actions": ["*Permission*Action"]

// 匹配所有操作（谨慎使用）
"actions": ["*Action"]
```

### Q5: 为什么我的权限配置不生效？

**答**：常见原因：

1. **函数名不匹配**
   - 检查 `permissionId` 和 `actions` 模式是否匹配
   - 注意区分大小写

2. **用户没有该权限**
   - 检查用户的角色是否绑定了该权限
   - 检查权限的 `enable` 字段是否为 `true`

3. **缓存问题**
   - 重新登录以刷新权限缓存

4. **Admin 用户被拒绝**
   - Admin 角色应该有所有权限
   - 检查是否错误地设置了 `requireAdmin: true`

---

## 🎓 总结

### 核心要点

1. **`actions` 配置的是纯函数名，不包含文件路径**
2. **`**/` 前缀是可选的，推荐使用简洁写法（不带 `**/`）**
3. **`create*Action` 和 `**/create*Action` 效果完全相同**
4. **在 `wrapAdminAction` 中必须声明 `permissionId`（纯函数名）**
5. **推荐使用模块级通配符，按 CRUD 操作分组**
6. **敏感操作使用精确匹配，并设置高 `level`**

### 快速参考

```javascript
// 1. 定义 Action
export const getCustomListAction = wrapAdminAction(
  'read', 'custom',
  async (params, { userId, isAdmin }) => { /* ... */ },
  { permissionId: 'getCustomListAction' }  // ← 函数名
);

// 2. 配置权限
{
  "name": "Custom - Read",
  "actions": [
    "**/get*Custom*Action"  // ← 通配符模式匹配函数名
  ]
}

// 3. 绑定：权限 → 角色 → 用户
Permission → Role → User
```

---

**Version History**:
- `v1.0` (2024-11-14): 初始版本，详细说明 actions 路径配置

