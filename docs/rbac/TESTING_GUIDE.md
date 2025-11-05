# RBAC 权限测试指南

## 📋 测试概述

本文档说明如何测试 RBAC 权限管理系统，包括菜单显示、页面访问控制和操作权限。

## 🔧 测试准备

### 1. 当前代码状态

为了方便测试，`user-permissions.js` 中的 Admin 特权已被注释：

```javascript
// Admin role: get all enabled menus (注释用于测试)
// if (userRole === 'admin') {
//     // ... admin 特权代码
// }

// Admin role: can access all pages (注释用于测试)
// if (userRole === 'admin') {
//     // ... admin 特权代码
// }

// Admin role: has all permissions (注释用于测试)
// if (userRole === 'admin') {
//     // ... admin 特权代码
// }
```

这意味着：
- ✅ Admin 用户也会受到 RBAC 权限限制
- ✅ 可以测试 Admin 用户被分配不同角色的效果
- ⚠️ 完成测试后需要取消注释以恢复 Admin 特权

### 2. 调试日志

已添加详细的调试日志，可以在浏览器控制台和服务器终端看到：

**客户端日志（浏览器控制台）：**
```
🔒 [PageAccessGuard] Checking access for: /admin/rbac/users
🔒 [PageAccessGuard] Check result: { success: true, hasAccess: false }
🔒 [PageAccessGuard] Final access decision: false
```

**服务端日志（终端）：**
```
🔍 [checkPageAccess] User ID: xxx
🔍 [checkPageAccess] User Role: admin
🔍 [checkPageAccess] Checking URL: /admin/rbac/users
🔍 [checkPageAccess] User Menu Tree: [...]
🔍 [checkPageAccess] Has Access: false
```

## 🧪 测试场景

### 场景 1: 测试菜单显示控制

**目标：** 验证用户只能看到被分配的菜单

**步骤：**

1. **创建测试角色**
   - 进入 `/admin/rbac/roles`
   - 创建角色 "测试角色A"

2. **分配部分菜单**
   - 编辑 "测试角色A"
   - 只分配以下菜单：
     * Dashboard
     * 用户管理 (Users)
     * 菜单管理 (Menus)

3. **分配角色给用户**
   - 进入 `/admin/rbac/user-roles`
   - 将当前用户关联到 "测试角色A"

4. **验证菜单显示**
   - 刷新页面
   - 左侧菜单应该只显示：
     * Dashboard
     * 用户管理
     * 菜单管理
   - 其他菜单（角色管理、权限管理等）应该不可见

**预期结果：**
- ✅ 只显示被分配的菜单
- ✅ 未分配的菜单不显示

### 场景 2: 测试页面访问控制

**目标：** 验证用户无法访问未授权的页面

**步骤：**

1. **使用场景 1 的权限设置**（只有 Users 和 Menus）

2. **尝试访问已授权页面**
   - 访问 `/admin/rbac/users`（用户管理）
   - 应该正常显示

3. **尝试访问未授权页面**
   - 在浏览器地址栏输入 `/admin/rbac/roles`（角色管理）
   - 应该显示 403 错误页面

4. **检查控制台日志**
   
   浏览器控制台应该显示：
   ```
   🔒 [PageAccessGuard] Checking access for: /admin/rbac/roles
   🔒 [PageAccessGuard] Check result: { success: true, hasAccess: false }
   🔒 [PageAccessGuard] Final access decision: false
   ```

   服务器终端应该显示：
   ```
   🔍 [checkPageAccess] User ID: xxx
   🔍 [checkPageAccess] Checking URL: /admin/rbac/roles
   🔍 [checkPageAccess] User Menu Tree: [只包含 Users 和 Menus]
   🔍 [checkPageAccess] Has Access: false
   ```

**预期结果：**
- ✅ 已授权页面可以正常访问
- ✅ 未授权页面显示 403 错误
- ✅ 403 页面提供返回按钮
- ✅ 日志正确显示权限检查过程

### 场景 3: 测试操作权限控制

**目标：** 验证 Server Actions 的权限控制

**步骤：**

1. **分配部分权限**
   - 创建权限 "查看用户" (标识: `user:view`)
   - 创建权限 "创建用户" (标识: `user:create`)
   - 将 "查看用户" 分配给 "测试角色A"
   - 不分配 "创建用户" 权限

2. **在代码中使用权限验证**
   ```javascript
   // 示例 Server Action
   export async function createUserAction(data) {
       // 检查权限
       const hasPermission = await checkPermissionAction('user:create');
       if (!hasPermission) {
           return { success: false, error: 'No permission' };
       }
       // ... 执行创建操作
   }
   ```

3. **验证权限控制**
   - 尝试调用 `createUserAction`
   - 应该返回无权限错误

**预期结果：**
- ✅ 有权限的操作可以执行
- ✅ 无权限的操作被拒绝
- ✅ 返回清晰的错误信息

### 场景 4: 测试多角色权限合并

**目标：** 验证用户拥有多个角色时，权限正确合并

**步骤：**

1. **创建两个角色**
   - 角色 A：分配 Users 和 Menus
   - 角色 B：分配 Roles 和 Permissions

2. **同时分配两个角色给用户**
   - 进入 `/admin/rbac/user-roles`
   - 创建两条记录：
     * 用户 → 角色 A
     * 用户 → 角色 B

3. **验证权限合并**
   - 刷新页面
   - 应该看到所有 4 个菜单：
     * Users
     * Menus
     * Roles
     * Permissions

4. **验证页面访问**
   - 所有 4 个页面都应该可以访问

**预期结果：**
- ✅ 多个角色的菜单权限正确合并
- ✅ 多个角色的操作权限正确合并
- ✅ 没有权限冲突

## 🐛 常见问题排查

### 1. 菜单全部显示（没有过滤）

**可能原因：**
- Admin 特权代码没有被注释
- 用户的 `role` 字段是 'admin'

**解决方法：**
```javascript
// 检查 user-permissions.js
// 确保这些代码被注释：
// if (userRole === 'admin') { ... }
```

### 2. 所有页面都能访问（权限控制无效）

**可能原因：**
- `PageAccessGuard` 没有正确包裹页面
- Admin 特权代码没有注释

**检查清单：**
1. ✅ `admin-layout.jsx` 中使用了 `<PageAccessGuard>`
2. ✅ `checkPageAccessAction` 中 admin 检查被注释
3. ✅ Dashboard (`/admin`) 被设为例外（始终允许访问）

### 3. 日志没有输出

**可能原因：**
- 浏览器控制台被清空
- 服务器没有重启

**解决方法：**
- 打开浏览器开发者工具（F12）
- 查看 Console 标签
- 服务器日志查看终端输出

### 4. 403 页面一直显示（有权限也无法访问）

**可能原因：**
- 菜单 URL 和页面路径不匹配
- 菜单被设置为 `hidden: true`

**检查方法：**
```javascript
// 查看服务器日志中的 Menu Tree
🔍 [checkPageAccess] User Menu Tree: [...]
// 检查 URL 是否正确
```

**常见 URL 不匹配问题：**
```javascript
// 错误
菜单 URL: '/admin/users'
实际路径: '/admin/rbac/users'  // ❌ 不匹配

// 正确
菜单 URL: '/admin/rbac/users'
实际路径: '/admin/rbac/users'  // ✅ 匹配
```

## ✅ 完成测试后

### 恢复 Admin 特权

测试完成后，取消注释以下代码：

```javascript
// 1. getUserAccessibleMenusAction
if (userRole === 'admin') {
    const { getCollection, fromObjectId } = await import('@/lib/mongodb');
    // ... 完整代码
    return result;
}

// 2. checkPageAccessAction
if (userRole === 'admin') {
    const result = {
        success: true,
        hasAccess: true,
        isAdmin: true,
    };
    return result;
}

// 3. getUserPermissionIdsAction
if (userRole === 'admin') {
    const result = {
        success: true,
        data: ['*'],
        isAdmin: true,
    };
    return result;
}
```

### 移除调试日志（可选）

如果不需要调试日志，可以移除：

```javascript
// user-permissions.js
console.log('🔍 [checkPageAccess] ...');

// page-access-guard.jsx
console.log('🔒 [PageAccessGuard] ...');
```

## 📊 测试检查清单

- [ ] 场景 1: 菜单显示控制
  - [ ] 只显示被分配的菜单
  - [ ] 未分配的菜单不可见
  
- [ ] 场景 2: 页面访问控制
  - [ ] 已授权页面可访问
  - [ ] 未授权页面显示 403
  - [ ] 403 页面功能正常
  
- [ ] 场景 3: 操作权限控制
  - [ ] 有权限的操作可执行
  - [ ] 无权限的操作被拒绝
  
- [ ] 场景 4: 多角色权限合并
  - [ ] 菜单权限正确合并
  - [ ] 页面访问权限正确合并
  
- [ ] 调试日志
  - [ ] 客户端日志正常输出
  - [ ] 服务端日志正常输出
  
- [ ] 恢复工作
  - [ ] 取消 Admin 特权注释
  - [ ] 移除调试日志（可选）

## 🎯 下一步

测试通过后，可以：

1. ✅ 完善权限管理 UI
2. ✅ 添加权限分配的批量操作
3. ✅ 创建权限模板/预设
4. ✅ 添加权限审计日志
5. ✅ 实现权限继承和覆盖机制

---

**注意：** 本测试指南基于当前的 RBAC 实现，如有代码更新，请同步更新测试步骤。

