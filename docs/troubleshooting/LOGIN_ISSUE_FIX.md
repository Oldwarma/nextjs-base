# 🔧 邮箱密码登录问题修复

## 🐛 问题描述

用户通过 Google OAuth 注册后，在后台重置了密码，但仍然无法使用邮箱密码登录。

### 错误信息

```
Credential account not found { email: 'karma.zhao@gmail.com' }
```

## 🔍 问题分析

### 1. 多登录方式原理

Better Auth 通过 `account` 表（MongoDB 集合）管理不同的登录方式：

**users 表：**
```javascript
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "email": "karma.zhao@gmail.com",
  "name": "Kent",
  // ... 其他字段
}
```

**account 表（可以有多条记录）：**
```javascript
// 记录 1: Google OAuth 登录
{
  "id": "account-uuid-1",
  "userId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "providerId": "google",
  "accountId": "107231209920205563982",  // Google ID
  "accessToken": "ya29...",
  // 无 password 字段
}

// 记录 2: 邮箱密码登录（重置密码后创建）
{
  "id": "account-uuid-2",
  "userId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",  // 同一个用户
  "providerId": "credential",
  "accountId": "karma.zhao@gmail.com",  // 邮箱
  "password": "$2b$10$...",  // 加密密码
}
```

### 2. 登录流程

#### Google OAuth 登录：
```javascript
// Better Auth 查找：
account.find({
  accountId: "Google User ID",
  providerId: "google"
})
```

#### 邮箱密码登录：
```javascript
// Better Auth 查找：
account.find({
  accountId: "karma.zhao@gmail.com",
  providerId: "credential"  // ← 关键！
})
```

### 3. 根本原因

1. **表名不匹配**：Better Auth 默认查询 `accounts` 表（复数），但我们的数据库使用 `account` 表（单数）
2. **重置密码逻辑缺陷**：旧代码只更新密码，不会创建新的 `credential` 账户记录

## ✅ 修复方案

### 修复 1：明确配置 Better Auth 表名

**文件：`lib/auth.js`**

```javascript
export const auth = betterAuth({
	database: mongodbAdapter(await getDatabase(), {
		// 配置表名（MongoDB 集合名称）
		modelNames: {
			user: 'users',
			session: 'session',
			account: 'account',      // ← 单数，与数据库一致
			verification: 'verification',
		},
	}),
	// ...
});
```

### 修复 2：重置密码时自动创建 credential 账户

**文件：`app/(admin)/actions/dao/user.js`**

```javascript
export async function resetUserPassword(userId, newPassword) {
	const user = await getUserById(userId);
	if (!user) {
		throw new Error('User not found');
	}

	const hashedPassword = await hash(newPassword, 10);

	// 🔍 检查是否已存在 credential 账户
	const existingCredentialAccount = await selects({
		dbName: 'account',
		whereJson: {
			userId: userId,
			providerId: 'credential'
		},
		getOne: true,
		getCount: false
	});

	if (existingCredentialAccount) {
		// 场景A: 已有邮箱密码登录，更新密码
		await updateOne({
			dbName: 'account',
			whereJson: {
				userId: userId,
				providerId: 'credential'
			},
			dataJson: {
				password: hashedPassword,
			},
		});
	} else {
		// 场景B: 只有 OAuth 登录，创建新的 credential 账户
		const now = new Date();
		await add({
			dbName: 'account',
			dataJson: {
				id: uuidv4(),
				userId: userId,
				accountId: user.email,     // 使用用户邮箱
				providerId: 'credential',  // 邮箱密码登录
				password: hashedPassword,
				createdAt: now,
				updatedAt: now,
			},
			cancelAddTime: true
		});
	}

	return true;
}
```

## 🚀 使用步骤

### 第 1 步：重启应用

修复代码后，重启 Next.js 开发服务器：

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
# 或
bun dev
```

### 第 2 步：重新设置密码

1. 登录管理后台：`/admin/rbac/users`
2. 找到用户 "Kent" (karma.zhao@gmail.com)
3. 点击 "More" → "Reset Password"
4. 输入新密码（例如：`TestPassword123`）
5. 保存

**系统会自动：**
- 检测用户只有 `google` 账户
- 创建新的 `credential` 账户记录
- 设置加密密码

### 第 3 步：验证登录

1. 退出当前登录（如果已登录）
2. 访问登录页：`/login`
3. 使用邮箱密码登录：
   - Email: `karma.zhao@gmail.com`
   - Password: `TestPassword123`（或你设置的密码）
4. 应该可以成功登录！

## 🔍 诊断工具

### 检查数据库数据

```javascript
// 运行诊断脚本（需要先实现）
node scripts/debug-account.js

// 测试密码是否正确
node scripts/debug-account.js "你的密码"
```

### 检查 account 表数据

在 MongoDB 中查询：

```javascript
// 查找用户的所有账户
db.account.find({ userId: "f47ac10b-58cc-4372-a567-0e02b2c3d479" })

// 查找 credential 账户
db.account.find({ 
  accountId: "karma.zhao@gmail.com",
  providerId: "credential"
})
```

**期望结果：**
```javascript
{
  "_id": ObjectId("..."),
  "id": "uuid",
  "userId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "accountId": "karma.zhao@gmail.com",
  "providerId": "credential",
  "password": "$2b$10$...",
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

## 📊 登录方式对比

| 登录方式 | providerId | accountId | password |
|---------|-----------|-----------|----------|
| Google OAuth | `google` | Google User ID (数字) | ❌ 无 |
| GitHub OAuth | `github` | GitHub User ID (数字) | ❌ 无 |
| 邮箱密码 | `credential` | 用户邮箱 | ✅ 有 (bcrypt 加密) |
| 用户名密码 | `credential` | 用户名 | ✅ 有 (bcrypt 加密) |

## ⚠️ 注意事项

### 1. 邮箱大小写

- 所有邮箱在存储前都会转换为小写
- `accountId` 中的邮箱也是小写
- 登录时会自动转换为小写进行匹配

### 2. 密码安全

- 密码使用 `bcrypt` 加密（`$2b$10$...`）
- 最小长度 8 字符
- 建议包含大小写字母、数字、特殊字符

### 3. 多登录方式切换

用户可以自由切换登录方式：
- 今天用 Google 登录
- 明天用邮箱密码登录
- 都会登录到同一个账户（通过 `userId` 关联）

### 4. 表名一致性

**重要：** 确保整个项目中使用一致的表名：

| 表用途 | MongoDB 集合名 | Better Auth 配置 |
|-------|--------------|----------------|
| 用户信息 | `users` | `user: 'users'` |
| 登录账户 | `account` | `account: 'account'` |
| 会话 | `session` | `session: 'session'` |
| 验证码 | `verification` | `verification: 'verification'` |

**在以下文件中保持一致：**
- ✅ `lib/auth.js` - Better Auth 配置
- ✅ `app/(admin)/actions/dao/user.js` - 用户 DAO
- ✅ `lib/db-api.js` - 数据库 API
- ✅ MongoDB 实际集合名

## 🎉 验证成功的标志

成功修复后，你应该看到：

1. **数据库中有两条 account 记录**：
   ```javascript
   // Google OAuth 账户
   { providerId: "google", accountId: "107231209920205563982", userId: "..." }
   
   // 邮箱密码账户
   { providerId: "credential", accountId: "karma.zhao@gmail.com", password: "$2b$10$...", userId: "..." }
   ```

2. **两种登录方式都可以工作**：
   - ✅ Google "Sign in with Google" 按钮
   - ✅ 邮箱密码 karma.zhao@gmail.com + 密码

3. **登录后是同一个用户**：
   - 相同的 userId
   - 相同的积分、权限、个人信息

## 📚 相关文档

- [Better Auth 文档](https://betterauth.com)
- [MongoDB Adapter 配置](https://betterauth.com/docs/adapters/mongodb)
- `/docs/client/AUTH.md` - 系统认证架构文档
- `/docs/rbac/USER_MANAGEMENT_SETUP.md` - 用户管理设置文档

## 🆘 如果还是不行

1. **检查表名**：
   ```bash
   # 查看所有集合名称
   use your_database_name
   show collections
   ```
   
   确认有 `account` 而不是 `accounts`

2. **检查 Better Auth 版本**：
   ```bash
   npm list better-auth
   ```
   
   确保版本 >= 1.0.0

3. **查看完整错误日志**：
   ```bash
   # 开发环境
   npm run dev
   
   # 查看终端输出的完整错误信息
   ```

4. **清除缓存**：
   ```bash
   # Next.js 缓存
   rm -rf .next
   
   # 重新启动
   npm run dev
   ```

5. **联系技术支持**：
   提供以下信息：
   - Better Auth 版本
   - MongoDB 集合列表
   - 完整错误日志
   - `account` 表中的示例数据（隐藏敏感信息）

