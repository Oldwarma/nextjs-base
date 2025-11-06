# 🧪 注册测试 - 验证 Better Auth 完整流程

## 🎯 测试目的

通过 Better Auth 的标准注册流程创建一个新用户，然后在后台重置密码，验证密码哈希是否完全兼容。

## 📋 测试步骤

### 第 1 步：注册新用户

1. **访问注册页面**
   ```
   http://localhost:3000/register
   或
   http://localhost:3000/en/register
   ```

2. **填写注册信息**
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `TestPassword123`

3. **点击 "Create Account"**

4. **预期结果**
   - ✅ 注册成功
   - ✅ 自动跳转到 `/dashboard`
   - ✅ 用户已登录

### 第 2 步：检查数据库

**检查 users 表：**
```javascript
// 应该有一条新记录
{
  "id": "uuid",
  "email": "test@example.com",
  "name": "Test User",
  "emailVerified": false,  // 未验证（因为我们关闭了验证）
  "role": "user",
  "credits": 0,
  // ...
}
```

**检查 account 表：**
```javascript
// 应该有一条 credential 记录
{
  "id": "uuid",
  "userId": "user-uuid",
  "accountId": "test@example.com",
  "providerId": "credential",
  "password": "salt:hash",  // Better Auth 生成的密码哈希
  // ...
}
```

**关键检查点：**
- ✅ password 字段格式为 `salt:hash`
- ✅ salt 长度为 32 字符（16 字节的 hex）
- ✅ hash 长度为 128 字符（64 字节的 hex）

### 第 3 步：测试登录

1. **退出登录**（如果已登录）

2. **访问登录页面**
   ```
   http://localhost:3000/login
   ```

3. **使用刚注册的账号登录**
   - Email: `test@example.com`
   - Password: `TestPassword123`

4. **预期结果**
   - ✅ 登录成功
   - ✅ 没有错误
   - ✅ 跳转到 `/dashboard`

### 第 4 步：后台重置密码

1. **访问用户管理页面**
   ```
   http://localhost:3000/admin/rbac/users
   ```

2. **找到测试用户** `test@example.com`

3. **点击 "More" → "Reset Password"**

4. **输入新密码**
   - 例如：`NewPassword456`

5. **保存**

6. **预期结果**
   - ✅ 显示成功消息
   - ✅ 终端输出：`✅ Password reset successfully for user xxx`

### 第 5 步：使用新密码登录

1. **退出登录**

2. **访问登录页面**

3. **使用新密码登录**
   - Email: `test@example.com`
   - Password: `NewPassword456`

4. **预期结果**
   - ✅ 登录成功！
   - ✅ 没有 "Credential account not found" 错误

## 🔍 对比测试

### Better Auth 注册的账户 vs 手动创建的账户

#### Better Auth 注册（标准流程）：
```javascript
// account 表中的密码
"password": "5988b98300712411db47d1c581e2a573:7a40f83ee5c336ce8920519925147a9ab4ac591ab50a9250a0907a3b0edb086683c9741ede81f88b8a76610c82ad38cad9b2427aaa65cc2005346ef2bec34147"
```

#### 使用 `better-auth/crypto` 重置的密码：
```javascript
// 应该具有相同的格式
"password": "新的salt:新的hash"
```

**关键验证点：**
- 两者的密码格式应该完全一致
- 都应该可以正常登录
- Better Auth 应该能够验证两者

## 📊 预期的调试日志

### 注册成功后：
```
POST /api/auth/sign-up/email 200
User created successfully
```

### 重置密码后：
```
✅ Password reset successfully for user xxx
POST /admin/rbac/users 200
```

### 使用新密码登录：
```
🔍 [DEBUG] 开始登录调试
🔍 [DEBUG] Email: test@example.com
🔍 [DEBUG] 数据库查询结果: ✅ 找到账户
🔍 [DEBUG] Account ID: xxx
🔍 [DEBUG] User ID: xxx
🔍 [DEBUG] Has Password: true
🔍 [DEBUG] 调用 Better Auth API...
🔍 [DEBUG] Better Auth 返回结果: ✅ 成功
POST /login 200
```

## ❌ 如果测试失败

### 情况 1：注册失败

**可能原因：**
- Better Auth 配置错误
- 数据库连接问题
- emailAndPassword 未启用

**解决方案：**
检查 `lib/auth.js` 中的配置：
```javascript
emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
}
```

### 情况 2：注册成功但无法登录

**可能原因：**
- 密码验证逻辑有问题
- 数据库中的密码格式不正确

**解决方案：**
1. 检查 account 表中的密码格式
2. 确认是否为 `salt:hash` 格式
3. 检查 Better Auth 版本

### 情况 3：重置密码后无法登录

**可能原因：**
- `better-auth/crypto` 的 `hashPassword` 使用不正确
- 密码哈希参数不一致

**解决方案：**
1. 对比注册和重置后的密码格式
2. 确认都使用了 `better-auth/crypto` 的 `hashPassword`
3. 检查是否正确 await 了 async 函数

## ✅ 成功标志

如果以下所有步骤都成功：

- [x] 注册新用户成功
- [x] 使用注册密码登录成功
- [x] 后台重置密码成功
- [x] 使用新密码登录成功

**那么证明：**
1. ✅ Better Auth 的标准流程正常工作
2. ✅ 我们的密码重置逻辑与 Better Auth 完全兼容
3. ✅ `better-auth/crypto` 的 `hashPassword` 是正确的解决方案

## 📝 测试记录

### 测试日期：_________

**注册测试：**
- [ ] 注册成功
- [ ] 登录成功
- [ ] 账户数据正确

**重置密码测试：**
- [ ] 重置成功
- [ ] 使用新密码登录成功

**结论：**
- [ ] ✅ 所有测试通过
- [ ] ❌ 存在问题：__________

---

**如果所有测试通过，这将确认我们找到了正确的解决方案！** 🎉

