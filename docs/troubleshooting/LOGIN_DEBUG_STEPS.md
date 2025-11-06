# 🔍 登录问题调试步骤

## 当前状态

### ✅ 数据库结构正确
- users 表：存在
- account 表：存在（单数，不是 accounts）
- credential 账户：存在
- 密码：已加密
- 关联：正确

### ❌ 问题现象
```
ERROR [Better Auth]: Credential account not found { email: 'karma.zhao@gmail.com' }
```

### 🔍 已添加调试代码

在 `app/(client)/actions/auth.js` 中添加了详细的调试日志。

## 📋 调试步骤

### 第 1 步：清除缓存并重启

```bash
cd /Users/huglemon/Documents/CodeProjects/overseas-saas/jimeng-saas

# 清除 Next.js 缓存
rm -rf .next

# 重启开发服务器
# 按 Ctrl+C 停止当前服务器，然后运行：
npm run dev
```

### 第 2 步：尝试登录并观察日志

1. 访问：`http://localhost:3000/en/login`
2. 输入：
   - Email: `karma.zhao@gmail.com`
   - Password: [你设置的密码]
3. 点击登录

### 第 3 步：查看终端输出

现在终端会输出详细的调试信息：

```bash
🔍 [DEBUG] 开始登录调试
🔍 [DEBUG] Email: karma.zhao@gmail.com
🔍 [DEBUG] 数据库查询结果: ✅ 找到账户  或  ❌ 未找到账户
🔍 [DEBUG] Account ID: xxx
🔍 [DEBUG] User ID: xxx
🔍 [DEBUG] Has Password: true
🔍 [DEBUG] 调用 Better Auth API...
🔍 [DEBUG] Better Auth 返回结果: ✅ 成功  或  ❌ 失败
```

## 🎯 根据日志判断问题

### 情况 1：找到账户，但 Better Auth 返回失败

```
🔍 [DEBUG] 数据库查询结果: ✅ 找到账户
🔍 [DEBUG] Better Auth 返回结果: ❌ 失败
ERROR [Better Auth]: Credential account not found
```

**问题：** Better Auth 使用的是不同的数据库连接或表名。

**解决方案：**

1. 检查 Better Auth 的 MongoDB Adapter 配置
2. 确认 `lib/mongodb.js` 和 `lib/auth.js` 使用同一个数据库连接
3. 可能需要手动指定 Better Auth 的表名

### 情况 2：找到账户，Better Auth 成功，但仍然登录失败

```
🔍 [DEBUG] 数据库查询结果: ✅ 找到账户
🔍 [DEBUG] Better Auth 返回结果: ✅ 成功
（但前端仍然显示登录失败）
```

**问题：** 密码验证失败或 Session 创建失败。

**解决方案：**

1. 测试密码是否正确：
   ```bash
   node scripts/test-password.js "你的密码"
   ```

2. 如果密码错误，重新设置：
   - 访问 `/admin/rbac/users`
   - 找到用户，点击 "Reset Password"
   - 输入新密码（例如：`TestPass123`）
   - 保存

### 情况 3：未找到账户

```
🔍 [DEBUG] 数据库查询结果: ❌ 未找到账户
```

**问题：** credential 账户不存在或邮箱不匹配。

**解决方案：**

1. 运行诊断脚本确认：
   ```bash
   node scripts/diagnose-login.js
   ```

2. 在后台重新设置密码（会自动创建 credential 账户）

### 情况 4：Server Action 错误

```
Error: Failed to find Server Action "..."
```

**问题：** 缓存问题或代码更新未生效。

**解决方案：**

```bash
# 清除缓存
rm -rf .next

# 重启开发服务器
# 按 Ctrl+C，然后重新运行 npm run dev
```

## 🔧 临时解决方案：直接使用 bcrypt 验证

如果 Better Auth 一直有问题，我们可以暂时绕过它，直接验证密码：

### 创建临时登录 Action

```javascript
// app/(client)/actions/temp-login.js
'use server';

import { hash } from 'bcryptjs';
import { getCollection } from '@/lib/database/mongodb';

export async function tempLoginAction({ email, password }) {
    try {
        // 1. 查找用户
        const usersCollection = await getCollection('users');
        const user = await usersCollection.findOne({ email });
        
        if (!user) {
            return { success: false, error: 'User not found' };
        }
        
        // 2. 查找 credential 账户
        const accountCollection = await getCollection('account');
        const account = await accountCollection.findOne({
            accountId: email,
            providerId: 'credential'
        });
        
        if (!account || !account.password) {
            return { success: false, error: 'No password set for this account' };
        }
        
        // 3. 验证密码
        const bcrypt = require('bcryptjs');
        const isValid = await bcrypt.compare(password, account.password);
        
        if (!isValid) {
            return { success: false, error: 'Invalid password' };
        }
        
        // 4. 创建 session（使用 Better Auth）
        const { auth } = await import('@/lib/auth');
        const session = await auth.api.createSession({
            userId: user.id,
            // ... 其他 session 配置
        });
        
        return { success: true, user, session };
        
    } catch (error) {
        console.error('Temp login error:', error);
        return { success: false, error: error.message };
    }
}
```

## 📊 可能的根本原因

根据经验，最可能的原因是：

### 1. MongoDB Adapter 表名问题

Better Auth 默认查询 `account` 表（单数），但可能：
- 内部硬编码了 `accounts`（复数）
- 或者配置没有正确传递

**验证方法：**
检查 Better Auth 的源码或添加更底层的日志。

### 2. 数据库连接实例不同

`lib/mongodb.js` 和 Better Auth 可能使用了不同的数据库连接实例。

**验证方法：**
```javascript
// lib/auth.js
const db = await getDatabase();
console.log('Better Auth 数据库:', db.databaseName);

// 在 Server Action 中
const { getCollection } = await import('@/lib/database/mongodb');
const coll = await getCollection('account');
console.log('Server Action 数据库:', coll.dbName);
```

### 3. Better Auth 版本 Bug

Better Auth 1.3.34 可能有 MongoDB Adapter 的 bug。

**验证方法：**
尝试降级或升级版本：
```bash
npm install better-auth@1.3.0
# 或
npm install better-auth@latest
```

## 🎯 下一步行动

1. **立即执行：** 清除缓存并重启
2. **尝试登录：** 观察调试日志
3. **提供日志：** 把终端输出的完整日志发给我
4. **测试密码：** 运行 `node scripts/test-password.js "你的密码"`

## 📞 需要提供的信息

如果问题仍然存在，请提供：

1. **终端完整输出**（包括所有 🔍 [DEBUG] 日志）
2. **Better Auth 版本**：`npm list better-auth`
3. **Node.js 版本**：`node -v`
4. **密码测试结果**：`node scripts/test-password.js "密码"`
5. **数据库诊断结果**：`node scripts/diagnose-login.js`

---

## 🔄 临时回退方案

如果实在无法解决，可以暂时禁用 Better Auth 的邮箱密码登录，只保留 OAuth：

```javascript
// lib/auth.js
export const auth = betterAuth({
    emailAndPassword: {
        enabled: false, // 暂时禁用
    },
    // 只保留 OAuth
});
```

然后使用自定义的密码验证逻辑（如上面的 tempLoginAction）。

