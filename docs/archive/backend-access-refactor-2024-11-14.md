# 后台权限系统重构记录

**日期**: 2024-11-14  
**类型**: 重构 - Backend Access Control

## 📋 重构目标

调整后台权限逻辑，使 `isBackendAllowed` 字段正确生效，建立清晰的权限分层架构。

## 🎯 核心变更

### 之前的问题

1. `isBackendAllowed` 字段存在但未使用
2. 只有 `role === 'admin'` 能访问后台
3. 没有为普通用户提供后台访问途径
4. RBAC 系统无法独立发挥作用

### 新的权限架构

```
Better Auth 角色系统
├─ admin (唯一超级管理员)
│  └─ 拥有所有权限，绕过 RBAC
│
└─ user (普通用户)
   ├─ isBackendAllowed = false → 无法访问后台
   └─ isBackendAllowed = true → 可访问后台
      └─ 通过 RBAC 控制细粒度权限
         ├─ 菜单权限（页面访问）
         ├─ 操作权限（Actions）
         └─ 数据权限（基于角色）
```

## 🔧 修改的文件

### 1. `lib/auth/admin-auth.js`

**新增函数**:
- `checkBackendAccess()` - 检查后台访问权限（页面）
- `checkBackendAccessAction()` - 检查后台访问权限（Actions）
- `checkIsAdmin()` - 仅检查 admin 角色（页面）
- `checkIsAdminAction()` - 仅检查 admin 角色（Actions）
- `hasBackendAccess()` - 辅助函数，返回 boolean

**向后兼容**:
- `checkAdmin()` → 调用 `checkBackendAccess()`
- `checkAdminAction()` → 调用 `checkBackendAccessAction()` 并转换格式
- 保留旧函数以避免破坏现有代码

### 2. `lib/core/action-wrapper.js`

**新增选项**:
- `requireAdmin`: boolean - 是否要求 admin 角色
- `permissionId`: string - RBAC 权限 ID（非 admin 需要）
- `skipPermission`: boolean - 跳过 RBAC 检查

**权限检查逻辑**:
1. 如果 `requireAdmin = true`，调用 `checkIsAdminAction()`
2. 否则调用 `checkBackendAccessAction()`
3. Admin 自动通过所有检查
4. User 需要通过 RBAC 权限检查（如果提供了 `permissionId`）

**Context 增强**:
- Handler 现在接收 `{ userId, isAdmin }` context
- 可以根据 `isAdmin` 区分不同逻辑

### 3. `app/(admin)/layout.js`

**变更**:
- 从 `checkAdmin()` 改为 `checkBackendAccess()`
- 更新注释说明支持两种访问方式

### 4. `components/admin/page-access-guard.jsx`

**更新**:
- 更新注释说明新的权限检查逻辑
- 核心逻辑保持不变（已经支持 admin 和 RBAC）

### 5. `app/(admin)/actions/rbac/user-permissions.js`

**确认**:
- 逻辑已经正确，无需修改
- `getUserAccessibleMenusAction` 正确区分 admin 和 user
- `checkPageAccessAction` 正确处理权限检查

### 6. `app/(admin)/actions/dao/base.js`

**新增配置**:
- `requireAdmin`: boolean - 构造函数支持此选项
- `checkPermission()` 根据配置选择检查方式

**权限检查**:
- 默认：`checkBackendAccessAction()`（admin 或 isBackendAllowed）
- 可选：`checkIsAdminAction()`（仅 admin）

### 7. `docs/admin/AUTH.md`

**全面更新**:
- 新增权限架构图
- 更新所有函数说明
- 新增用户字段说明
- 更新使用场景和示例
- 更新权限流程图
- 新增三层防护机制说明
- 更新最佳实践和安全建议

## 📊 权限检查流程

### 页面访问

```
用户访问 /admin/xxx
    ↓
【第一层】Layout - checkBackendAccess()
    ├─ 未登录 → 重定向登录页
    ├─ admin → ✅ 通过
    ├─ user + isBackendAllowed → ✅ 通过
    └─ user + !isBackendAllowed → ❌ 重定向首页
         ↓
【第二层】PageAccessGuard
    ├─ admin → ✅ 自动通过
    └─ user → 检查 RBAC 菜单权限
         ├─ 有权限 → ✅ 显示页面
         └─ 无权限 → ❌ 显示 403
```

### Action 执行

```
调用 wrapAdminAction()
    ↓
检查 requireAdmin
    ├─ true → 调用 checkIsAdminAction()
    │    └─ 非 admin → ❌ 返回错误
    │
    └─ false → 调用 checkBackendAccessAction()
         ├─ 无后台权限 → ❌ 返回错误
         └─ 有后台权限 → 继续
              ↓
检查 permissionId（仅 user）
    ├─ admin → ✅ 自动通过
    ├─ 未设置 → ✅ 通过
    └─ 已设置 → 调用 checkUserHasPermission()
         ├─ 有权限 → ✅ 执行 handler
         └─ 无权限 → ❌ 返回错误
```

## 🎨 使用示例

### 场景 1: 默认后台操作

```js
export const getList = wrapAdminAction(
  'query',
  'content',
  async (params, { userId, isAdmin }) => {
    // admin 和有后台权限的 user 都能访问
    return { success: true, data: [] };
  }
);
```

### 场景 2: 需要特定权限

```js
export const publishContent = wrapAdminAction(
  'update',
  'content',
  async (contentId, { userId, isAdmin }) => {
    // admin 自动通过
    // user 需要 content:publish 权限
    return { success: true };
  },
  { permissionId: 'content:publish' }
);
```

### 场景 3: 仅 Admin 可执行

```js
export const deleteAllData = wrapAdminAction(
  'delete',
  'system',
  async (params, { userId }) => {
    // 只有 admin 能执行此操作
    return { success: true };
  },
  { requireAdmin: true }
);
```

## ✅ 向后兼容性

- ✅ 保留所有旧函数作为别名
- ✅ 自动转换返回格式
- ✅ 现有代码无需修改即可工作
- ✅ 标记 `@deprecated` 提示迁移

## 🔍 测试建议

### 测试场景

1. **未登录用户**
   - 访问 `/admin` → 重定向登录页

2. **普通 User（无后台权限）**
   - `isBackendAllowed = false`
   - 访问 `/admin` → 重定向首页

3. **有后台权限的 User**
   - `isBackendAllowed = true`
   - 有 RBAC 角色和权限
   - 访问已授权页面 → ✅ 正常显示
   - 访问未授权页面 → ❌ 显示 403

4. **Admin 用户**
   - 访问任何页面 → ✅ 全部可访问
   - 执行任何操作 → ✅ 全部可执行

## 📝 数据库字段

### 用户表字段

```js
{
  // Better Auth 角色
  role: 'admin' | 'user',
  
  // 后台访问控制
  isBackendAllowed: boolean,  // user 是否能访问后台
  
  // RBAC 角色
  roles: Array<string>        // RBAC 角色 ID 数组
}
```

### 授予后台权限

```js
// 方法 1: 直接更新
await usersCollection.updateOne(
  { id: userId },
  { $set: { isBackendAllowed: true } }
);

// 方法 2: 同时绑定 RBAC 角色
await bindUserRoles({
  userId,
  roles: ['editor', 'moderator']
});
```

## 🛡️ 安全性提升

1. **明确的权限层级**
   - Admin: 唯一超级管理员
   - User: 通过 RBAC 细粒度控制

2. **三层防护**
   - Layout 层：后台访问权限
   - 页面层：RBAC 菜单权限
   - Action 层：操作权限检查

3. **最小权限原则**
   - 只有必要的用户才能访问后台
   - 通过 RBAC 精确控制权限范围

4. **审计和日志**
   - 所有操作自动记录日志
   - 包含用户信息和权限上下文

## 🎯 下一步建议

1. **数据迁移**
   - 运行 `scripts/migrate-users-add-fields.js`
   - 为需要后台权限的用户设置 `isBackendAllowed = true`

2. **RBAC 配置**
   - 创建合适的角色（如 editor, moderator）
   - 为角色分配菜单和权限
   - 将用户绑定到角色

3. **权限测试**
   - 测试所有权限场景
   - 验证 403/404 显示正确
   - 确认日志记录正常

4. **代码迁移**（可选）
   - 逐步将 `checkAdmin()` 改为 `checkBackendAccess()`
   - 逐步将 `checkAdminAction()` 改为 `checkBackendAccessAction()`
   - 移除 `@deprecated` 函数

## 📚 相关文档

- [后台权限验证系统](../admin/AUTH.md) - 完整文档
- [RBAC 系统](../admin/RBAC_SYSTEM.md) - RBAC 详细说明
- [Action Wrapper](../../lib/core/action-wrapper.js) - 包装器源码
- [Admin Auth](../../lib/auth/admin-auth.js) - 权限检查源码

## 🎉 总结

本次重构成功实现了：

✅ `isBackendAllowed` 字段正确生效  
✅ 支持普通用户通过 RBAC 访问后台  
✅ Admin 保持唯一超级管理员地位  
✅ 三层权限防护机制  
✅ 向后兼容现有代码  
✅ 完整的文档更新

权限系统现在更加灵活、安全和易于管理！

