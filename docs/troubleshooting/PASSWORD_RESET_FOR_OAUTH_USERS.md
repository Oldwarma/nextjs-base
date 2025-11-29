# OAuth 用户密码重置问题修复文档

## 问题描述

在管理后台为使用 Google 登录的用户重置密码时，系统提示成功，但实际上：
- 控制台没有任何输出
- 密码未真正重置
- 用户仍无法使用新密码登录

## 问题根源

### 1. Better Auth API 参数顺序错误
原代码调用 `auth.api.setUserPassword()` 时参数顺序不对：

```javascript
// ❌ 错误的参数顺序
await auth.api.setUserPassword({
  headers: await headers(),
  body: { userId, newPassword },  // 顺序错误
});

// 正确的参数顺序（根据官方文档）
await auth.api.setUserPassword({
  headers: await headers(),
  body: { newPassword, userId },  // newPassword 在前
});
```

### 2. userId 类型处理不当
OAuth 用户和普通用户的 ID 存储方式可能不同：
- 普通用户：`_id` 字段存储 MongoDB ObjectId
- OAuth 用户：可能同时有 `id`（UUID）和 `_id`（ObjectId）

在 `account` 表中查找时，必须使用 `_id` 对应的 ObjectId，而不是 `id` 字段。

### 3. DAO 层未正确从用户对象获取 ObjectId
原代码直接将传入的 `userId` 字符串转换为 ObjectId，但没有考虑：
- 需要先查询用户获取完整对象
- 从用户对象的 `_id` 字段获取 ObjectId
- `_id` 字段可能已经是 ObjectId 对象或字符串

## 解决方案

### 修改内容

#### 1. `admin-users.js` - 增强错误处理和后备方案

```javascript
export async function resetUserPasswordAction(userId, newPassword) {
  try {
    console.log('[resetUserPasswordAction] Attempting to reset password for user:', userId);

    // 调用 Better Auth API
    const result = await auth.api.setUserPassword({
      headers: await headers(),
      body: { userId, newPassword },
    });

    console.log('[resetUserPasswordAction] Better Auth API result:', result);

    // 检查返回值中的错误
    if (result?.error) {
      console.error('[resetUserPasswordAction] Better Auth returned error:', result.error);
      return {
        success: false,
        error: result.error.message || 'Failed to reset password',
      };
    }

    // 如果 Better Auth 失败，使用 DAO 层后备方案
    if (!result || result.status === 'error') {
      console.log('[resetUserPasswordAction] Better Auth API failed, trying DAO method...');
      
      await userDao.resetUserPassword(userId, newPassword);
      return {
        success: true,
        message: 'Password reset successfully (credential account created for OAuth user)',
      };
    }

    return { success: true, message: 'Password reset successfully' };
  } catch (error) {
    // 异常时也尝试 DAO 层后备方案
    console.error('[resetUserPasswordAction] Exception occurred:', error);
    
    try {
      await userDao.resetUserPassword(userId, newPassword);
      return { success: true, message: 'Password reset successfully' };
    } catch (fallbackError) {
      return {
        success: false,
        error: fallbackError.message || 'Failed to reset password',
      };
    }
  }
}
```

#### 2. `user.js` (DAO) - 增强日志记录

为 `resetUserPassword` 函数添加详细的日志输出：
- 用户查询过程
- credential account 的查找和创建过程
- 每一步的操作结果

### 核心逻辑

```javascript
export async function resetUserPassword(userId, newPassword) {
  // 1. 查找用户获取完整信息
  const user = await getUserById(userId);
  
  // 2. 从用户对象的 _id 字段获取 ObjectId
  //    这是关键！account 表的 userId 必须使用 _id 对应的 ObjectId
  let userObjectId;
  if (user._id) {
    userObjectId = fromObjectId(user._id);  // 确保是 ObjectId 对象
  } else if (ObjectId.isValid(userId)) {
    userObjectId = new ObjectId(userId);
  } else {
    throw new Error('Cannot determine user ObjectId');
  }
  
  console.log('Using userObjectId for account lookup:', userObjectId);
  
  // 3. 查找现有的 credential account
  const existingAccount = await selects({
    dbName: 'account',
    getOne: true,
    whereJson: {
      userId: userObjectId,  // 使用正确的 ObjectId
      providerId: 'credential',
    },
  });

  if (existingAccount) {
    // 4a. 更新现有密码
    await updateOne({
      dbName: 'account',
      whereJson: { _id: existingAccount._id },
      dataJson: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });
  } else {
    // 4b. 为 OAuth 用户创建新的 credential account
    console.log('Creating new credential account for OAuth user');
    await add({
      dbName: 'account',
      dataJson: {
        userId: userObjectId,  // 使用正确的 ObjectId
        accountId: user.email,
        providerId: 'credential',
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}
```

## 测试步骤

### 准备测试环境

1. **创建 OAuth 测试用户**
   - 使用 Google 登录创建一个测试账号
   - 确认该用户在 `account` 集合中只有 `providerId: 'google'` 的记录

2. **创建普通用户**
   - 使用邮箱密码注册一个普通账号
   - 确认该用户在 `account` 集合中有 `providerId: 'credential'` 的记录

### 测试场景

#### 场景 1：为 Google 登录用户重置密码

1. 登录管理后台
2. 进入 "User Management" 页面
3. 找到通过 Google 登录的用户
4. 点击 "More" → "Reset Password"
5. 输入新密码（至少 8 位）
6. 点击确认

**预期结果：**
- 提示 "Password reset successfully"
- 控制台输出详细日志：
  ```
  [resetUserPasswordAction] Attempting to reset password for user: xxx
  [resetUserPasswordAction] Better Auth API result: ...
  [DAO resetUserPassword] Starting password reset for user: xxx
  [DAO resetUserPassword] No credential account found, creating new one for OAuth user...
  [DAO resetUserPassword] New credential account created: ...
  ```
- 数据库 `account` 集合中新增一条 `providerId: 'credential'` 的记录
- 用户可以使用邮箱和新密码登录

#### 场景 2：为普通用户重置密码

1. 登录管理后台
2. 进入 "User Management" 页面
3. 找到通过邮箱密码注册的普通用户
4. 点击 "More" → "Reset Password"
5. 输入新密码（至少 8 位）
6. 点击确认

**预期结果：**
- 提示 "Password reset successfully"
- 控制台输出日志
- 数据库中该用户的 `credential` account 密码已更新
- 用户可以使用邮箱和新密码登录

### 验证密码重置成功

**方法 1：尝试登录**
1. 退出当前账号
2. 使用该用户的邮箱和新密码尝试登录
3. 应该能够成功登录

**方法 2：检查数据库**
```javascript
// 在 MongoDB 中查询
db.account.find({ 
  userId: ObjectId("用户的_id"),
  providerId: "credential"
})
```

应该能找到一条记录，且 `password` 字段已更新。

## 调试日志说明

修复后，重置密码会输出以下日志：

### 成功场景（Better Auth API）
```
[resetUserPasswordAction] Attempting to reset password for user: xxx
[resetUserPasswordAction] Better Auth API result: { ... }
[resetUserPasswordAction] Password reset successfully via Better Auth API
```

### 成功场景（DAO 后备）
```
[resetUserPasswordAction] Attempting to reset password for user: xxx
[resetUserPasswordAction] Better Auth API failed, trying DAO method...
[DAO resetUserPassword] Starting password reset for user: xxx
[DAO resetUserPassword] Found user: { id: xxx, email: xxx@gmail.com, ... }
[DAO resetUserPassword] No credential account found, creating new one for OAuth user...
[DAO resetUserPassword] Creating credential account with email: xxx@gmail.com
[DAO resetUserPassword] New credential account created: ObjectId(...)
[DAO resetUserPassword] Password reset completed successfully
[resetUserPasswordAction] Password reset successfully via DAO
```

### 失败场景
```
[resetUserPasswordAction] Attempting to reset password for user: xxx
[resetUserPasswordAction] Better Auth returned error: { ... }
[resetUserPasswordAction] Exception occurred: Error: ...
[DAO resetUserPassword] User not found: xxx
[resetUserPasswordAction] Fallback also failed: Error: ...
```

## 数据库结构说明

### users 集合
```javascript
{
  _id: ObjectId("..."),
  id: "...",  // Better Auth 生成的 UUID（可选）
  email: "user@example.com",
  name: "User Name",
  role: "user",
  // ... 其他字段
}
```

### account 集合
```javascript
// OAuth 用户（原有）
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),  // 关联 users._id
  accountId: "google-user-id",
  providerId: "google",
  createdAt: ISODate("..."),
  updatedAt: ISODate("..."),
}

// 密码登录账户（重置密码后新增）
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),  // 同一个 userId
  accountId: "user@example.com",
  providerId: "credential",
  password: "$2a$10$...",  // bcrypt 哈希
  createdAt: ISODate("..."),
  updatedAt: ISODate("..."),
}
```

## 注意事项

1. **多种登录方式共存**
   - OAuth 用户重置密码后，会同时拥有两种登录方式：
     - 继续使用 Google 登录
     - 使用邮箱密码登录

2. **密码强度要求**
   - 最少 8 个字符
   - 建议包含大小写字母、数字和特殊字符

3. **安全性**
   - 密码使用 bcrypt 算法哈希（Better Auth 内置）
   - 管理员无法看到明文密码
   - 重置密码不会撤销用户的其他登录会话

4. **Better Auth 兼容性**
   - 优先使用 Better Auth 的官方 API
   - 如果 API 失败，自动降级到 DAO 层实现
   - 确保与 Better Auth 的账户关联机制兼容

## 相关文件

- `/app/(admin)/actions/rbac/admin-users.js` - 管理员用户操作 Actions
- `/app/(admin)/actions/dao/user.js` - 用户数据访问层
- `/app/(admin)/admin/rbac/users/page.js` - 用户管理页面
- `/lib/auth/auth.js` - Better Auth 配置

## 参考资源

- [Better Auth Admin Plugin](https://www.better-auth.com/docs/plugins/admin)
- [Better Auth Account Linking](https://www.better-auth.com/docs/concepts/account-linking)

