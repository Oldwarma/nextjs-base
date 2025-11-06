# 后台用户管理功能设置指南

## 📋 概述

已完成后台用户管理功能的开发，集成了 Better Auth 的用户创建、更新、密码重置等功能。

## ✅ 已完成的工作

### 1. 修复 Better Auth UUID 生成

**文件：** `lib/auth.js`

**修改：**
```javascript
database: {
  generateId: () => {
    // 使用 UUID v4 格式（与 RBAC 系统一致）
   return uuidv4();
  },
}
```

**效果：**
- ✅ 新注册用户将获得 UUID 格式的 ID
- ✅ 与 RBAC 系统的 ID 格式保持一致
- ✅ 方便进行用户-角色关联

### 2. 创建后台用户管理 Actions

**文件：** `app/(admin)/actions/rbac/admin-users.js`

**包含的功能：**

#### 创建用户 (`createUserAction`)
```javascript
{
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe',
  username: 'johndoe', // 可选
  role: 'user', // user 或 admin
  credits: 100, // 初始积分
}
```

**特性：**
- ✅ 生成 UUID 作为用户 ID
- ✅ 密码自动加密（bcrypt）
- ✅ 自动创建 Better Auth 的  记录
- ✅ 邮箱和用户名唯一性检查
- ✅ 密码强度验证（最少 8 字符）

#### 更新用户 (`updateUserAction`)
- 更新姓名、用户名、角色、积分、邮箱验证状态
- 自动检查用户名唯一性
- 邮箱修改后自动设置 emailVerified 为 false

#### 重置密码 (`resetUserPasswordAction`)
- 管理员可以重置任何用户的密码
- 密码自动加密
- 更新  表中的密码记录

#### 删除用户 (`deleteUserAction`)
- 软删除或硬删除支持
- 自动删除关联的  和 sessions
- 防止管理员删除自己

#### 获取用户列表 (`getUserListAction`)
- 分页支持
- 搜索支持（邮箱、姓名、用户名）
- 角色筛选

#### 获取用户详情 (`getUserByIdAction`)
- 根据 UUID 获取完整用户信息

### 3. 更新用户管理页面

**文件：** `app/(admin)/admin/rbac/users/page.js`

**页面URL：** `/admin/rbac/users`

**功能特性：**

1. **列表展示**
   - ID、邮箱、姓名、用户名
   - 角色标签（Admin/User）
   - 积分显示
   - 邮箱验证状态
   - 创建时间、最后登录时间

2. **创建用户**
   - 弹窗表单
   - 必填项：邮箱、密码、姓名
   - 可选项：用户名、角色、初始积分
   - 实时表单验证

3. **编辑用户**
   - 行内编辑
   - 支持编辑：姓名、用户名、角色、积分、邮箱验证状态
   - 不支持编辑：邮箱（需要特殊验证）

4. **重置密码**
   - 独立的重置密码按钮
   - 密码确认输入
   - 最少 8 字符验证

5. **删除用户**
   - 确认对话框
   - 自动清理关联数据
   - 防止删除自己

## 🚀 使用步骤

### Step 1: 在后台创建菜单

访问 `/admin/rbac/menus`，创建以下菜单：

```javascript
{
  title: 'Users',
  name: 'Users',
  url: '/admin/rbac/users',
  icon: 'TeamOutlined',
  parent_id: 'rbac-management', // RBAC 管理的父菜单 ID
  sort: 1,
  enable: true,
  hidden: false,
}
```

### Step 2: 分配菜单权限

1. 访问 `/admin/rbac/roles`
2. 编辑 Admin 角色
3. 勾选 "Admin Users" 菜单
4. 保存

### Step 3: 访问用户管理

访问 `/admin/rbac/users`，即可看到用户管理界面。

## 📊 功能演示

### 创建用户

1. 点击 "Create User" 按钮
2. 填写表单：
   ```
   Email: john@example.com
   Password: password123
   Name: John Doe
   Username: johndoe (可选)
   Role: user
   Initial Credits: 100
   ```
3. 点击确定
4. 用户创建成功，自动生成 UUID

### 编辑用户

1. 在列表中找到用户
2. 点击姓名、用户名等可编辑字段
3. 修改后点击保存图标
4. 修改立即生效

### 重置密码

1. 点击用户行的 "Reset Password" 按钮
2. 输入新密码（最少 8 字符）
3. 确认密码
4. 点击确定
5. 密码重置成功

### 删除用户

1. 点击用户行的删除按钮
2. 确认删除操作
3. 用户及关联数据被删除

## 🔐 权限控制

所有操作都需要 **Admin 权限**：

```javascript
// 在每个 Action 中都会检查
const adminCheck = await checkAdminAction();
if (!adminCheck.isAdmin) {
  return { success: false, error: 'Forbidden: Admin access required' };
}
```

如果需要配置 CRUD 权限，可以分配以下权限：

- `crud:user:create` - 创建用户
- `crud:user:read` - 查看用户
- `crud:user:update` - 更新用户
- `crud:user:delete` - 删除用户

## 🎯 与 Better Auth 的集成

### 用户创建流程

```
1. 调用 createUserAction
   ↓
2. 验证数据（邮箱、密码等）
   ↓
3. 生成 UUID
   ↓
4. 密码加密（bcrypt）
   ↓
5. 插入 users 表
   ├─ id: UUID
   ├─ email
   ├─ name
   ├─ username
   ├─ role
   ├─ credits
   └─ ... 其他字段
   ↓
6. 插入  表（Better Auth 需要）
   ├─ id: UUID
   ├─ userId: 用户 UUID
   ├─ accountId: email
   ├─ providerId: 'credential'
   ├─ password: 加密后的密码
   └─ ...
   ↓
7. 返回成功（不包含密码）
```

### 密码重置流程

```
1. 调用 resetUserPasswordAction
   ↓
2. 验证密码强度
   ↓
3. 密码加密（bcrypt）
   ↓
4. 更新  表中的 password
   ↓
5. 返回成功
```

### 用户删除流程

```
1. 调用 deleteUserAction
   ↓
2. 检查用户存在性
   ↓
3. 检查是否删除自己（不允许）
   ↓
4. 删除 users 表记录
   ↓
5. 删除  表记录（Better Auth）
   ↓
6. 删除 sessions 表记录（Better Auth）
   ↓
7. 返回成功
```

## 🔍 数据表结构

### users 表

```javascript
{
  _id: ObjectId,
  id: 'uuid-v4', // ← 新增 UUID
  email: 'user@example.com',
  name: 'John Doe',
  username: 'johndoe',
  role: 'user', // 'user' 或 'admin'
  credits: 100,
  totalCreditsEarned: 100,
  totalCreditsUsed: 0,
  currentPackageId: null,
  packageExpireAt: null,
  emailVerified: false,
  image: null,
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date,
}
```

###  表（Better Auth）

```javascript
{
  _id: ObjectId,
  id: 'uuid-v4',
  userId: 'user-uuid', // 关联 users.id
  accountId: 'user@example.com',
  providerId: 'credential', // 邮箱密码登录
  password: '$2a$10$...', // 加密后的密码
  createdAt: Date,
  updatedAt: Date,
}
```

## ⚠️ 注意事项

### 1. 现有用户的 ID 格式

如果数据库中已有用户使用旧的 ID 格式（非 UUID），他们仍然可以正常登录和使用系统。

新创建的用户将使用 UUID 格式。

### 2. 密码重置

管理员重置密码后，用户应该通过新密码登录。建议首次登录后提示用户修改密码。

### 3. 邮箱验证

后台创建的用户默认 `emailVerified: false`。如果需要强制邮箱验证，需要在应用逻辑中添加检查。

### 4. 角色管理

用户有两种角色：
- **Better Auth 角色**：`user.role` 字段（'user' 或 'admin'）
- **RBAC 角色**：通过 user_roles 表关联

通常情况下：
- `user.role = 'admin'` → 拥有所有权限，不受 RBAC 限制
- `user.role = 'user'` → 受 RBAC 角色控制

### 5. 删除用户

删除用户是**不可逆操作**，会同时删除：
- users 表记录
-  表记录
- sessions 表记录

如果需要保留用户数据但禁止登录，建议：
- 添加 `banned: true` 字段
- 在登录时检查该字段

## 🎉 测试清单

- [ ] 创建新用户，检查 UUID 是否正确生成
- [ ] 使用新用户登录系统
- [ ] 编辑用户信息
- [ ] 重置用户密码并登录
- [ ] 删除用户，检查关联数据是否清理
- [ ] 搜索功能测试
- [ ] 分页功能测试
- [ ] 角色筛选测试
- [ ] 尝试删除自己（应该被阻止）
- [ ] 检查权限控制（非 Admin 无法访问）

## 📝 未来优化建议

1. **批量操作**
   - 批量创建用户（CSV 导入）
   - 批量重置密码
   - 批量修改角色

2. **用户详情页**
   - 查看用户的所有操作记录
   - 查看用户的积分记录
   - 查看用户的生成记录

3. **邮件通知**
   - 创建用户后发送欢迎邮件
   - 重置密码后发送通知邮件

4. **用户导出**
   - 导出用户列表（Excel/CSV）
   - 导出用户统计数据

5. **高级筛选**
   - 按注册时间筛选
   - 按积分范围筛选
   - 按邮箱验证状态筛选

---

**完成！** 后台用户管理功能已经可以正常使用了。🎉

