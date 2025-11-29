# RBAC 权限检查漏洞修复

**日期**: 2024-11-14  
**问题**: 用户只有 read 权限却能执行更新/删除操作

## 🐛 问题发现

用户反馈：拥有以下权限的用户可以调用 "assign roles" 功能：
- `crud:read:all` - 所有读取操作
- `crud:user:read` - 用户读取
- `crud:role:read` - 角色读取  
- `crud:menu:read` - 菜单读取
- `crud:permission:read` - 权限读取

这些权限都只匹配 `get*Action`, `find*Action`, `list*Action` 等**读取**操作，但用户却能执行 `bindUserRolesAction`（绑定角色）这个**写入**操作！

## 🔍 根本原因

在 `app/(admin)/actions/rbac/crud-action.user.js` 中，发现以下 Actions **没有使用 `wrapAdminAction`**，导致：

1. ❌ **缺少 RBAC 权限检查** - 只检查了后台访问权限（`checkBackendAccess`），没有检查具体的操作权限
2. ❌ **没有日志记录** - 这些操作不会被记录到 action logs
3. ❌ **Admin 和 User 待遇相同** - 没有利用 Admin 自动绕过的机制

### 有问题的 Actions

| Action | 功能 | 问题 |
|--------|------|------|
| `bindUserRolesAction` | 绑定用户角色 | 只检查后台权限，无 RBAC 检查 |
| `resetUserPasswordAction` | 重置密码 | 只检查后台权限，无 RBAC 检查 |
| `banUserAction` | 封禁用户 | 只检查后台权限，无 RBAC 检查 |
| `unbanUserAction` | 解封用户 | 只检查后台权限，无 RBAC 检查 |

### 原有代码示例

```javascript
// ❌ 错误的实现
export async function bindUserRolesAction(userId, roleIds, reset = false) {
    const backendCheck = await checkBackendAccess();  // 只检查后台访问权限
    if (!backendCheck.hasAccess) {
        return { success: false, error: backendCheck.error };
    }

    // 没有 RBAC 权限检查！
    // 没有日志记录！
    
    await userDao.bindUserRoles(userId, roleIds, reset);
    return { success: true, message: 'Roles assigned successfully' };
}
```

## 修复方案

使用 `wrapAdminAction` 包装所有写入操作，并添加正确的 `permissionId`：

### 修复后的代码

```javascript
// 正确的实现
export const bindUserRolesAction = wrapAdminAction(
    'update',
    'user_roles',
    async (userId, roleIds, reset = false, { userId: operatorId, isAdmin }) => {
        if (!userId) {
            return { success: false, error: 'User ID is required' };
        }

        await userDao.bindUserRoles(userId, roleIds, reset);

        return {
            success: true,
            message: 'Roles assigned successfully',
            data: { userId, roleIds, reset },
        };
    },
    {
        permissionId: 'crud:user:update', // RBAC 权限检查
        skipLog: false, // 自动记录日志
    }
);
```

## 📝 修复详情

### 1. bindUserRolesAction - 绑定用户角色

**权限要求**: `crud:user:update`

```javascript
export const bindUserRolesAction = wrapAdminAction(
    'update',
    'user_roles',
    handler,
    { permissionId: 'crud:user:update', skipLog: false }
);
```

### 2. resetUserPasswordAction - 重置密码

**权限要求**: `crud:user:set-password`

```javascript
export const resetUserPasswordAction = wrapAdminAction(
    'set_password',
    'user',
    handler,
    { permissionId: 'crud:user:set-password', skipLog: false }
);
```

### 3. banUserAction - 封禁用户

**权限要求**: `crud:user:ban`

```javascript
export const banUserAction = wrapAdminAction(
    'ban',
    'user',
    handler,
    { permissionId: 'crud:user:ban', skipLog: false }
);
```

### 4. unbanUserAction - 解封用户

**权限要求**: `crud:user:unban`

```javascript
export const unbanUserAction = wrapAdminAction(
    'unban',
    'user',
    handler,
    { permissionId: 'crud:user:unban', skipLog: false }
);
```

## 🎯 修复效果

### 修复前

| 用户类型 | 拥有权限 | 能否执行 bindUserRolesAction | 原因 |
|---------|---------|---------------------------|------|
| Admin | admin | 可以 | 通过后台访问权限检查 |
| User (only read) | crud:read:all | **可以**（Bug!） | 通过后台访问权限检查，无 RBAC 阻止 |
| User (with update) | crud:user:update | 可以 | 通过后台访问权限检查 |

### 修复后

| 用户类型 | 拥有权限 | 能否执行 bindUserRolesAction | 原因 |
|---------|---------|---------------------------|------|
| Admin | admin | 可以 | 自动绕过 RBAC |
| User (only read) | crud:read:all | ❌ **不可以** | 缺少 `crud:user:update` 权限 |
| User (with update) | crud:user:update | 可以 | 拥有所需权限 |

## 📊 权限检查流程

### 修复前

```
bindUserRolesAction 调用
    ↓
checkBackendAccess()
    ├─ Admin → 通过
    ├─ User + isBackendAllowed → 通过（Bug！）
    └─ User + !isBackendAllowed → ❌ 拒绝
    ↓
直接执行操作（没有 RBAC 检查！）
```

### 修复后

```
bindUserRolesAction 调用
    ↓
wrapAdminAction (permissionId: 'crud:user:update')
    ↓
checkBackendAccessAction()
    ├─ Admin → 自动绕过 RBAC，直接执行
    └─ User + isBackendAllowed → 继续 RBAC 检查
         ↓
checkUserHasPermission('crud:user:update')
    ├─ 有权限 → 执行操作 + 记录日志
    └─ 无权限 → ❌ 返回错误 + 记录失败日志
```

## 🔧 需要添加的权限

为了让用户能够使用这些功能，需要在数据库中添加以下权限：

```javascript
// 权限配置示例
[
  {
    id: 'crud-user-update',
    name: 'User - Update',
    identify: 'crud:user:update',
    actions: ['**/updateUser*Action', '**/bindUser*Action'],
    parent_id: 'crud-write-all'
  },
  {
    id: 'crud-user-set-password',
    name: 'User - Set Password',
    identify: 'crud:user:set-password',
    actions: ['**/resetUserPassword*Action'],
    parent_id: 'crud-user-update'
  },
  {
    id: 'crud-user-ban',
    name: 'User - Ban',
    identify: 'crud:user:ban',
    actions: ['**/banUser*Action'],
    parent_id: 'crud-user-update'
  },
  {
    id: 'crud-user-unban',
    name: 'User - Unban',
    identify: 'crud:user:unban',
    actions: ['**/unbanUser*Action'],
    parent_id: 'crud-user-update'
  }
]
```

## 🎓 经验教训

### 1. 所有写入操作必须使用 wrapAdminAction

**推荐做法**:
```javascript
export const myAction = wrapAdminAction('create', 'resource', handler, {
    permissionId: 'resource:create',
    skipLog: false
});
```

❌ **错误做法**:
```javascript
export async function myAction() {
    const check = await checkBackendAccess();
    // 缺少 RBAC 检查
}
```

### 2. 权限检查的两个层次

| 层次 | 函数 | 作用 | 适用场景 |
|------|------|------|---------|
| 后台访问权限 | `checkBackendAccess()` | 检查是否能进入后台 | Layout、页面级别 |
| RBAC 操作权限 | `wrapAdminAction(..., { permissionId })` | 检查具体操作权限 | Action 级别 |

### 3. Admin vs User

- **Admin**: 自动绕过所有 RBAC 检查，拥有所有权限
- **User**: 必须通过 RBAC 权限检查才能执行操作

## 🧪 测试验证

### 测试用例 1: 只有读权限的用户

**权限**: `crud:read:all`

| 操作 | 预期结果 | 实际结果 |
|------|---------|---------|
| 查看用户列表 | 成功 | 成功 |
| 绑定用户角色 | ❌ 403 | **修复后：403** |
| 重置密码 | ❌ 403 | **修复后：403** |
| 封禁用户 | ❌ 403 | **修复后：403** |

### 测试用例 2: 有更新权限的用户

**权限**: `crud:user:update`

| 操作 | 预期结果 | 实际结果 |
|------|---------|---------|
| 查看用户列表 | ❌ 403 | ❌ 403 |
| 绑定用户角色 | 成功 | 成功 |
| 重置密码 | ❌ 403 | ❌ 403（需要额外权限） |

### 测试用例 3: Admin 用户

**角色**: admin

| 操作 | 预期结果 | 实际结果 |
|------|---------|---------|
| 所有操作 | 成功 | 成功 |

## 📚 相关文档

- [后台权限验证系统](../admin/AUTH.md)
- [权限检查审计报告](./permission-check-audit-2024-11-14.md)
- [RBAC 系统指南](../admin/RBAC_SYSTEM.md)
- [Action Wrapper 文档](../../lib/core/action-wrapper.js)

## 🚀 后续建议

1. **代码审查**: 检查其他 Actions 是否也有类似问题
2. **添加测试**: 为权限检查添加自动化测试
3. **文档完善**: 明确每个 Action 需要的权限
4. **权限配置**: 在数据库中添加对应的权限记录

---

**修复人**: AI Assistant  
**修复日期**: 2024-11-14  
**影响范围**: User Actions (绑定角色、重置密码、封禁、解封)  
**严重程度**: 🔴 高危 - 权限绕过漏洞  
**修复状态**: 已修复

