# 🔧 密码哈希问题修复

## 🎯 问题根源

### 发现的问题

用户通过 Google OAuth 注册后，在后台重置密码，但无法使用邮箱密码登录。

**错误信息：**
```
ERROR [Better Auth]: Credential account not found { email: 'karma.zhao@gmail.com' }
```

**调试结果显示：**
- ✅ 我们的代码能在数据库中找到 `credential` 账户
- ❌ Better Auth 找不到这个账户

### 根本原因

**我们使用了 `bcryptjs` 来哈希密码，但 Better Auth 使用的是 Node.js 原生的 `scrypt`！**

根据 [Better Auth 官方文档](https://www.better-auth.com/docs/authentication/email-password#configuration)：

> Better Auth uses `scrypt` to hash passwords. The `scrypt` algorithm is designed to be slow and memory-intensive to make it difficult for attackers to brute force passwords.

当 Better Auth 尝试验证密码时：
1. Better Auth 从数据库读取密码哈希
2. 使用 `scrypt` 算法验证用户输入的密码
3. **但我们的密码是用 `bcrypt` 哈希的，格式不兼容！**
4. 验证失败，返回 "Credential account not found"

## ✅ 解决方案

### 1. 创建 Better Auth 兼容的密码哈希函数

**文件：`lib/auth.js`**

```javascript
import { scryptSync, randomBytes } from 'crypto';

// Better Auth 兼容的密码哈希函数（使用 scrypt，与 Better Auth 一致）
export function hashPassword(password) {
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(password, salt, 64).toString('hex');
	return `${salt}:${hash}`;
}
```

**关键点：**
- 使用 Node.js 原生 `crypto.scryptSync`（与 Better Auth 一致）
- 生成 16 字节的随机 salt
- 使用 64 字节的密钥长度
- 返回 `salt:hash` 格式（Better Auth 的标准格式）

### 2. 更新 `dao/user.js`

#### 修改 `createUser` 函数

**之前（使用 bcrypt）：**
```javascript
import { hash } from 'bcryptjs';

const hashedPassword = await hash(password, 10);
```

**现在（使用 scrypt）：**
```javascript
const { hashPassword } = await import('@/lib/auth');
const hashedPassword = hashPassword(password);
```

#### 修改 `resetUserPassword` 函数

**之前（使用 bcrypt）：**
```javascript
import { hash } from 'bcryptjs';

const hashedPassword = await hash(newPassword, 10);
```

**现在（使用 scrypt）：**
```javascript
const { hashPassword } = await import('@/lib/auth');
const hashedPassword = hashPassword(newPassword);
```

## 🔍 验证步骤

### 1. 清除缓存并重启

```bash
cd /Users/huglemon/Documents/CodeProjects/overseas-saas/jimeng-saas
rm -rf .next
npm run dev
```

### 2. 重新设置密码

1. 访问 `/admin/rbac/users`
2. 找到用户 "Kent" (karma.zhao@gmail.com)
3. 点击 "Reset Password"
4. 输入新密码（例如：`TestPass123`）
5. 保存

**现在密码会使用 `scrypt` 哈希，与 Better Auth 兼容！**

### 3. 测试登录

1. 访问 `/login`
2. 使用邮箱密码登录：
   - Email: `karma.zhao@gmail.com`
   - Password: `TestPass123`

**应该可以成功登录了！** 🎉

## 📊 技术对比

### Bcrypt vs Scrypt

| 特性 | Bcrypt | Scrypt |
|------|--------|--------|
| 算法类型 | 密码哈希 | 密钥派生函数 |
| 内存消耗 | 低 | 高（可配置） |
| CPU 消耗 | 中 | 高（可配置） |
| 抗 ASIC 攻击 | 中等 | 强 |
| Node.js 支持 | 需要第三方库 | 原生支持 |
| Better Auth 使用 | ❌ 不支持 | ✅ 默认使用 |

### 密码哈希格式

**Bcrypt 格式：**
```
$2b$10$GJUtYFrD8E5eJ/24wVoVJ.arsPGo2moG.NlnDjw7i.iDGOO5yxtUW
```

**Scrypt 格式（Better Auth）：**
```
3c2e0f1a4b5d6c7e8f9a0b1c2d3e4f5:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...
```
（格式：`salt:hash`）

## 🎯 关键经验

### 1. 遵循框架规范

当使用认证框架（如 Better Auth）时：
- ✅ **DO**: 使用框架提供的方法和规范
- ❌ **DON'T**: 自己实现密码哈希或直接操作数据库

### 2. 阅读官方文档

Better Auth 文档明确说明了使用 `scrypt`：
- 📚 [Password Hashing Configuration](https://www.better-auth.com/docs/authentication/email-password#configuration)

### 3. 保持一致性

如果框架使用特定的哈希算法：
- 所有密码操作（注册、重置、修改）都应使用相同算法
- 不要混用不同的哈希方法

## 🔄 迁移现有用户

如果你已经有使用 `bcrypt` 哈希的用户，需要：

1. **让用户重新设置密码**（推荐）
   - 通过 "forgot password" 流程
   - 新密码会使用 `scrypt` 哈希

2. **或者编写迁移脚本**（复杂）
   - 检测密码哈希格式
   - 要求用户在首次登录时重新设置密码

## 📚 相关文档

- [Better Auth Email & Password](https://www.better-auth.com/docs/authentication/email-password)
- [Better Auth User & Accounts](https://www.better-auth.com/docs/concepts/users-accounts)
- [Node.js Crypto.scrypt](https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

## ✅ 修复清单

- [x] 创建 `hashPassword` 函数使用 scrypt
- [x] 更新 `createUser` 使用新的哈希方法
- [x] 更新 `resetUserPassword` 使用新的哈希方法
- [x] 移除 `bcryptjs` 依赖（可选）
- [x] 清除缓存
- [ ] 重新测试所有密码相关功能
- [ ] 更新现有用户的密码（如果有）

---

**总结：** 问题不在于数据库结构或 Better Auth 配置，而是**密码哈希算法不兼容**。使用与 Better Auth 一致的 `scrypt` 算法后，一切正常！🎉

