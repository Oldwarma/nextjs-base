# RBAC 架构优化总结

## 🎯 优化目标

1. ✅ 移除多余的 `user_roles` 表
2. ✅ 解耦后台访问权限与管理员身份
3. ✅ 添加用户创建功能
4. ✅ 简化权限判断逻辑

## 📋 修改清单

### 1. 数据库结构

#### 删除

- ❌ `user_roles` 表（关联表）

#### 保留

- ✅ `users` 表（用户主表）
- ✅ `roles` 表（RBAC 角色定义）
- ✅ `menus` 表（菜单配置）
- ✅ `permissions` 表（权限配置）
- ✅ `role_menus` 表（角色-菜单关联）
- ✅ `role_permissions` 表（角色-权限关联）

#### 新增字段（users 表）

```javascript
{
  // ...existing fields
  roles: [],              // ✨ 新增：RBAC 角色数组（替代 user_roles 表）
  isBackendAllowed: false // ✨ 新增：后台访问权限
}
```

### 2. 权限逻辑

#### 旧逻辑（已废弃）

```javascript
// ❌ 错误：用 role === 'admin' 判断后台访问
if (user.role === 'admin') {
  // 允许访问后台
}
```

**问题：**
- 普通员工无法进入后台
- 后台访问与管理员身份强耦合

#### 新逻辑（当前）

```javascript
// ✅ 正确：三层权限判断
// 1. 后台访问权限
if (!user.isBackendAllowed) {
  return '403 Forbidden';
}

// 2. 顶级管理员（全部权限）
if (user.role === 'admin') {
  return 'Full Access';
}

// 3. RBAC 权限（细粒度）
const permissions = getRolePermissions(user.roles);
return permissions;
```

**优势：**
- ✅ 员工可以进后台（`isBackendAllowed: true`）
- ✅ 管理员仍然拥有全部权限（`role: 'admin'`）
- ✅ 通过 RBAC 角色实现细粒度控制

### 3. 用户管理

#### 新增功能

| 功能 | 路径 | 说明 |
|------|------|------|
| 创建用户 | `/admin/rbac/users` | ✨ 新增创建按钮和表单 |
| 重置密码 | 用户行操作 | ✨ 新增重置密码功能 |
| 分配角色 | 用户行操作 | 直接更新 `users.roles` 字段 |
| 后台访问控制 | 编辑用户 | ✨ 新增 `isBackendAllowed` 开关 |

#### 创建用户流程

```
填写表单
  ↓
生成 UUID
  ↓
密码加密
  ↓
插入 users 表
  ↓
插入 account 表（Better Auth）
  ↓
完成！
```

### 4. 文件修改

#### 核心文件

| 文件 | 修改内容 |
|------|----------|
| `lib/auth.js` | ✅ 添加 `roles` 和 `isBackendAllowed` 字段定义 |
| `app/(admin)/actions/rbac/admin-users.js` | ✅ 重构权限检查（`checkBackendAccess`） |
| `app/(admin)/actions/rbac/admin-users.js` | ✅ 更新 `bindUserRolesAction` 使用 `users.roles` |
| `app/(admin)/actions/rbac/admin-users.js` | ✅ 更新 `getUserRolesAction` 使用 `users.roles` |
| `app/(admin)/admin/rbac/users/page.js` | ✅ 添加创建用户、重置密码功能 |
| `app/(admin)/admin/rbac/users/page.js` | ✅ 添加 `isBackendAllowed` 字段显示和编辑 |

#### 新增文件

| 文件 | 用途 |
|------|------|
| `scripts/migrate-users-add-fields.js` | 为现有用户添加新字段 |
| `docs/rbac/BACKEND_ACCESS_CONTROL.md` | 后台访问权限控制文档 |
| `docs/rbac/ARCHITECTURE_CLEANUP.md` | 本文档 |

## 🔄 迁移步骤

### 1. 运行迁移脚本

```bash
node scripts/migrate-users-add-fields.js
```

**脚本功能：**
- 为所有用户添加 `roles: []` 和 `isBackendAllowed: false`
- 自动为 `role === 'admin'` 的用户设置 `isBackendAllowed: true`

### 2. 更新现有员工账号

1. 访问 `/admin/rbac/users`
2. 编辑员工账号
3. 开启 `isBackendAllowed` 开关
4. 分配相应的 RBAC 角色

### 3. （可选）清理 user_roles 表

⚠️ **谨慎操作！** 在确认新系统运行正常后再删除：

```javascript
// MongoDB Shell
db.user_roles.drop()
```

## 📊 对比

### 旧架构

```
users
├── id
├── role ('admin' | 'user')  ← 用于判断后台访问（错误！）
└── ...

user_roles (关联表)
├── user_id
└── role_id
```

**问题：**
- ❌ 后台访问与管理员身份耦合
- ❌ 需要额外的关联表查询
- ❌ 数据分散，维护复杂

### 新架构

```
users
├── id
├── role ('admin' | 'user')        ← 顶级管理员标识
├── isBackendAllowed (boolean)     ← 后台访问权限
├── roles ([role_id1, role_id2])   ← RBAC 角色数组
└── ...
```

**优势：**
- ✅ 后台访问权限独立
- ✅ 无需关联表，查询更快
- ✅ 数据集中，维护简单
- ✅ 支持多角色

## 🎯 使用场景

### 场景 1：添加新员工

```javascript
// 1. 创建用户
await createUserAction({
  email: 'employee@example.com',
  password: 'securepassword',
  name: 'John Doe',
  role: 'user',              // 普通用户
  isBackendAllowed: true,    // 允许访问后台
});

// 2. 分配角色
await bindUserRolesAction(userId, [
  'content-manager-role-id',
  'finance-viewer-role-id'
], true);
```

### 场景 2：临时提升权限

```javascript
// 添加临时角色
await bindUserRolesAction(userId, [
  ...existingRoles,
  'temp-admin-role-id'
], true);

// 事后移除
await bindUserRolesAction(userId, existingRoles, true);
```

### 场景 3：员工离职

```javascript
// 方案 1：关闭后台访问
await updateUserAction(userId, {
  isBackendAllowed: false
});

// 方案 2：直接删除账号
await deleteUserAction(userId);
```

## ✅ 测试清单

- [ ] 顶级管理员可以访问所有页面和功能
- [ ] 普通用户（`isBackendAllowed: false`）无法访问后台
- [ ] 后台用户（`isBackendAllowed: true`）可以进入后台
- [ ] 后台用户根据 RBAC 角色显示对应菜单
- [ ] 后台用户根据 RBAC 角色控制操作权限
- [ ] 可以创建新用户
- [ ] 可以为用户分配多个 RBAC 角色
- [ ] 可以重置用户密码
- [ ] 可以开启/关闭用户的后台访问权限

## 📚 相关文档

- [后台访问权限控制](./BACKEND_ACCESS_CONTROL.md)
- [用户管理设置](./USER_MANAGEMENT_SETUP.md)
- [RBAC 系统总览](./README.md)

