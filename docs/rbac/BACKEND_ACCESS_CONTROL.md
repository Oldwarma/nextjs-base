# 后台访问权限控制

## 📌 核心概念

### 三层权限体系

```
用户表 (users)
├── role: 'admin' | 'user'           // Better Auth 角色（顶级管理员标识）
├── isBackendAllowed: boolean        // 是否允许访问后台
└── roles: string[]                  // RBAC 角色数组（细粒度权限）
```

### 权限判断逻辑

```javascript
// 1. 是否允许访问后台？
if (!user.isBackendAllowed) {
    return '403 Forbidden';
}

// 2. 是否是顶级管理员？
if (user.role === 'admin') {
    return '拥有所有权限';
}

// 3. 普通后台用户权限
const permissions = getRolePermissions(user.roles); // 从 RBAC 系统获取权限
return permissions;
```

## 🔑 字段说明

### 1. `role` (Better Auth 角色)

**类型：** `string` (`'admin'` | `'user'`)

**用途：**
- `'admin'`：顶级管理员，拥有所有权限，无需配置 RBAC
- `'user'`：普通用户，通过 RBAC 系统控制权限

**特点：**
- 单一角色（非数组）
- 由 Better Auth 管理
- **不应该用于判断是否可以进后台！**

### 2. `isBackendAllowed` (后台访问权限)

**类型：** `boolean`

**用途：**
- 控制用户是否允许访问后台管理系统
- 与 `role` 独立，解耦后台访问权限与管理员身份

**特点：**
- 默认 `false`（新用户不允许访问后台）
- Admin 角色在迁移时自动设为 `true`
- 可由管理员手动开启/关闭

**适用场景：**
- 员工账号：可以进后台，但只有部分权限
- 普通用户：不能进后台，只能访问前台
- 测试账号：临时开启后台访问

### 3. `roles` (RBAC 角色数组)

**类型：** `string[]` (UUID 数组)

**用途：**
- 存储用户被分配的 RBAC 角色 ID
- 用于细粒度权限控制

**特点：**
- 支持多角色（一个用户可以有多个角色）
- 角色 ID 为 UUID 格式
- 直接存储在 users 表中，无需关联表

**示例：**
```javascript
{
  "id": "user-uuid-123",
  "email": "employee@example.com",
  "role": "user",                          // 普通用户（非顶级管理员）
  "isBackendAllowed": true,                // 允许访问后台
  "roles": [
    "role-uuid-456",                       // 角色 1: 内容管理员
    "role-uuid-789"                        // 角色 2: 财务查看员
  ]
}
```

## 📊 用户类型示例

### 类型 1：顶级管理员

```javascript
{
  "email": "admin@example.com",
  "role": "admin",              // ✅ 顶级管理员
  "isBackendAllowed": true,     // ✅ 允许访问后台
  "roles": []                   // 无需 RBAC 角色，拥有全部权限
}
```

**权限：** 拥有所有权限，无限制

### 类型 2：普通员工（有后台权限）

```javascript
{
  "email": "employee@example.com",
  "role": "user",               // ⚠️ 普通用户
  "isBackendAllowed": true,     // ✅ 允许访问后台
  "roles": [
    "content-manager-role-id",  // 角色 1
    "finance-viewer-role-id"    // 角色 2
  ]
}
```

**权限：** 根据 `roles` 分配的权限，由 RBAC 系统控制

### 类型 3：普通前台用户

```javascript
{
  "email": "user@example.com",
  "role": "user",               // ⚠️ 普通用户
  "isBackendAllowed": false,    // ❌ 不允许访问后台
  "roles": []                   // 无后台角色
}
```

**权限：** 只能访问前台，无法进入后台管理

## 🔧 如何使用

### 1. 创建用户时

```javascript
const userData = {
  email: 'employee@example.com',
  password: 'securepassword',
  name: 'John Doe',
  role: 'user',                  // 普通用户
  isBackendAllowed: true,        // 开启后台访问
  roles: [],                     // 稍后分配角色
};

await createUserAction(userData);
```

### 2. 为用户分配角色

```javascript
// 分配多个 RBAC 角色
await bindUserRolesAction(userId, [
  'content-manager-role-id',
  'finance-viewer-role-id'
], true); // reset=true 表示替换现有角色
```

### 3. 检查后台访问权限

```javascript
// Server Actions 中检查
async function someBackendAction() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  // 第一步：检查是否登录
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }
  
  // 第二步：检查是否允许访问后台
  if (!session.user.isBackendAllowed) {
    return { success: false, error: 'Backend access denied' };
  }
  
  // 第三步：检查具体权限
  if (session.user.role === 'admin') {
    // 顶级管理员，允许所有操作
  } else {
    // 普通用户，检查 RBAC 权限
    const hasPermission = await checkPermission(session.user.roles, 'some-action');
    if (!hasPermission) {
      return { success: false, error: 'Permission denied' };
    }
  }
  
  // 执行操作...
}
```

## 🚀 迁移现有用户

### 运行迁移脚本

```bash
node scripts/migrate-users-add-fields.js
```

**脚本功能：**
1. 为所有用户添加 `roles: []` 和 `isBackendAllowed: false`
2. 自动为 `role === 'admin'` 的用户设置 `isBackendAllowed: true`
3. 显示迁移结果和示例数据

## ⚠️ 重要注意事项

### 1. 不要混淆 `role` 和 `isBackendAllowed`

❌ **错误做法：**
```javascript
// 判断是否可以进后台
if (user.role === 'admin') {
  // 允许访问后台
}
```

✅ **正确做法：**
```javascript
// 判断是否可以进后台
if (user.isBackendAllowed) {
  // 允许访问后台
  if (user.role === 'admin') {
    // 拥有全部权限
  } else {
    // 根据 RBAC 角色控制权限
  }
}
```

### 2. `role === 'admin'` 的含义

- **旧理解（错误）：** Admin 角色 = 可以访问后台
- **新理解（正确）：** Admin 角色 = 顶级管理员 + 拥有全部权限

### 3. 分配权限的优先级

```
1. isBackendAllowed === false  → 403（不能进后台）
2. role === 'admin'            → 全部权限
3. roles: [...]                → RBAC 权限
```

## 🎯 最佳实践

### 1. 新员工入职

1. 创建用户账号（`role: 'user'`）
2. 开启后台访问（`isBackendAllowed: true`）
3. 分配相应的 RBAC 角色（如：内容管理员、财务查看员等）

### 2. 员工离职

1. 关闭后台访问（`isBackendAllowed: false`）
2. 或直接删除账号

### 3. 临时权限提升

- 临时添加 RBAC 角色，无需修改 `role` 字段
- 事后移除 RBAC 角色即可

### 4. 测试环境

- 测试账号设置 `isBackendAllowed: true`
- 根据测试需求分配不同的 RBAC 角色组合

## 📚 相关文档

- [RBAC 系统总览](./README.md)
- [用户管理设置](./USER_MANAGEMENT_SETUP.md)
- [页面访问控制](./PAGE_ACCESS_CONTROL.md)

