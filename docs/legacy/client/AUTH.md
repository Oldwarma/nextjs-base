# 认证系统文档

## 概述

本项目使用 [better-auth](https://www.better-auth.com/) 作为认证解决方案，支持邮箱密码登录和第三方社交登录（Google、GitHub）。

### 技术架构

- **认证框架**: better-auth v1.x
- **数据库**: PostgreSQL (via Prisma)
- **前端**: Next.js 15 App Router + React
- **Session 管理**: Cookie-based sessions
- **密码加密**: bcrypt (由 better-auth 内置处理)

## 认证方式

### 1. 邮箱密码登录（仅限已有账号）

- 用户必须先通过邮箱密码注册账号，然后才能使用邮箱密码登录
- 不支持通过邮箱密码登录时自动创建账号
- 密码要求：8-128 字符

### 2. 第三方社交登录（自动创建账号）

- 支持 Google OAuth 2.0
- 支持 GitHub OAuth
- **首次使用时会自动创建账号**
- 无需额外注册步骤

## 认证流程图

### 邮箱密码登录流程

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户点击登录按钮                           │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  前端验证：检查邮箱和密码是否为空                                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  调用 signInWithEmailAction() Server Action                      │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  Server Action 层：                                               │
│  1. 接收 email 和 password                                        │
│  2. 调用 auth.api.signInEmail()                                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  Better-auth 处理：                                               │
│  1. 从数据库查询用户（通过 email）                             │
│  2. 使用 bcrypt 验证密码                                          │
│  3. 生成 session token                                            │
│  4. 设置 HttpOnly Cookie                                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  登录成功后：                                                      │
│  1. 调用 updateLastLogin() 更新最后登录时间                       │
│  2. 返回 { success: true, data: result }                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  前端处理：                                                        │
│  1. 检查 result.success                                           │
│  2. router.push('/dashboard') 跳转到仪表盘                        │
└─────────────────────────────────────────────────────────────────┘
```

### 邮箱密码注册流程

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户提交注册表单                           │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  前端验证：                                                        │
│  - 邮箱格式                                                        │
│  - 密码长度 >= 8                                                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  调用 signUpWithEmailAction() Server Action                      │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  Server Action 层：                                               │
│  1. 验证输入（邮箱、密码、名字）                                   │
│  2. 调用 auth.api.signUpEmail()                                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  Better-auth 处理：                                               │
│  1. 检查邮箱是否已存在                                             │
│  2. 使用 bcrypt 加密密码                                          │
│  3. 创建用户记录到数据库                                        │
│  4. 生成 session 并设置 Cookie                                    │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  注册成功后：                                                      │
│  1. 调用 initializeNewUser() 初始化用户数据                       │
│     - credits: 0                                                  │
│     - totalCreditsEarned: 0                                       │
│     - totalCreditsUsed: 0                                         │
│     - role: 'user'                                                │
│     - lastLoginAt: new Date()                                     │
│  2. 返回 { success: true }                                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  前端跳转到 /dashboard                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Google/GitHub 第三方登录流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    用户点击 Google/GitHub 按钮                     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  调用 authClient.signIn.social()                                  │
│  - provider: 'google' 或 'github'                                 │
│  - callbackURL: '/dashboard'                                      │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  浏览器重定向到 OAuth 提供商：                                     │
│  - Google: accounts.google.com                                    │
│  - GitHub: github.com/login/oauth                                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  用户在第三方页面授权                                              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  OAuth 回调到：                                                    │
│  /api/auth/callback/google 或 /api/auth/callback/github          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  Better-auth 处理 OAuth 回调：                                    │
│  1. 验证 OAuth code                                               │
│  2. 获取用户信息（email, name, image）                            │
│  3. 查询数据库是否存在该邮箱用户                                   │
│     - 不存在：创建新用户                                           │
│     - 存在：关联账号                                               │
│  4. 生成 session 并设置 Cookie                                    │
│  5. 重定向到登录页                                                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  登录页加载：                                                      │
│  1. useSession() hook 检测到 session                              │
│  2. 触发 useEffect                                                │
│  3. 调用 checkAndInitUserAction()                                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  checkAndInitUserAction() 处理：                                  │
│  1. 验证 session 是否存在                                         │
│  2. 调用 initializeNewUser(userId)                                │
│     - 检查 credits 字段是否存在                                    │
│     - 不存在：初始化用户数据（新用户）                             │
│     - 存在：只更新 lastLoginAt（老用户）                           │
│  3. 返回成功结果                                                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  前端跳转到 /dashboard                                            │
└─────────────────────────────────────────────────────────────────┘
```

## 安全分析

### 当前安全措施 ✅

#### 1. **密码安全**
- 使用 bcrypt 加密密码（由 better-auth 自动处理）
- 密码最小长度：8 字符
- 密码最大长度：128 字符（防止 DoS 攻击）
- 密码永不明文存储

#### 2. **Session 安全**
- 使用 HttpOnly Cookie（防止 XSS 攻击窃取 session）
- 生产环境使用 Secure Cookie（仅 HTTPS 传输）
- Session 过期时间：24 小时
- Session 自动刷新：每小时更新一次

#### 3. **CSRF 保护**
- better-auth 内置 CSRF token 验证
- 所有状态改变请求都需要验证 CSRF token

#### 4. **数据验证**
- Server Actions 进行服务端验证
- 输入清理和验证（邮箱格式、密码长度）
- Prisma 防止 SQL 注入（使用参数化查询）

#### 5. **OAuth 安全**
- 使用标准 OAuth 2.0 流程
- 验证 state 参数防止 CSRF
- 只信任官方 OAuth 回调

#### 6. **权限控制**
- 角色基础访问控制（user / admin）
- 所有 Server Actions 验证 session
- 管理员操作额外检查 role 字段

### 潜在安全问题 ⚠️

#### 1. **邮箱验证缺失** 🔴 高风险
**问题**: 
- 当前配置 `requireEmailVerification: false`
- 用户注册后无需验证邮箱即可使用

**风险**:
- 恶意用户使用他人邮箱注册
- 无法确认用户真实拥有该邮箱
- 可能被用于垃圾注册攻击

**建议修复**:
```javascript
// lib/auth.js
emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // 启用邮箱验证
    minPasswordLength: 8,
    maxPasswordLength: 128,
}
```

**实施步骤**:
1. 配置邮件发送服务（如 SendGrid、AWS SES、Resend）
2. 更新环境变量添加邮件配置
3. 启用邮箱验证
4. 添加重发验证邮件功能

#### 2. **频率限制缺失** 🔴 高风险
**问题**:
- 登录、注册、密码重置没有频率限制
- 可能被暴力破解攻击

**风险**:
- 暴力破解密码
- DoS 攻击
- 恶意注册大量账号

**建议修复**:
使用 Redis 或内存存储实现频率限制：

```javascript
// lib/rate-limit.js
import { LRUCache } from 'lru-cache';

const rateLimitMap = new LRUCache({
    max: 500,
    ttl: 60000, // 1分钟
});

export function rateLimit(identifier, limit = 5) {
    const key = `rate-limit:${identifier}`;
    const count = rateLimitMap.get(key) || 0;
    
    if (count >= limit) {
        return { success: false, error: 'Too many requests' };
    }
    
    rateLimitMap.set(key, count + 1);
    return { success: true };
}

// 在 Server Action 中使用
export async function signInWithEmailAction(credentials) {
    const ip = headers().get('x-forwarded-for') || 'unknown';
    const limitCheck = rateLimit(`login:${ip}`, 5); // 每分钟5次
    
    if (!limitCheck.success) {
        return { success: false, error: 'Too many login attempts' };
    }
    
    // ... 继续登录逻辑
}
```

#### 3. **密码强度要求不足** 🟡 中风险
**问题**:
- 只要求 8 字符
- 没有复杂度要求（大小写、数字、特殊字符）

**风险**:
- 弱密码容易被破解
- 字典攻击成功率高

**建议修复**:
```javascript
// lib/password-validator.js
export function validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const errors = [];
    
    if (password.length < minLength) {
        errors.push('Password must be at least 8 characters');
    }
    
    const complexityCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar]
        .filter(Boolean).length;
    
    if (complexityCount < 3) {
        errors.push('Password must contain at least 3 of: uppercase, lowercase, numbers, special characters');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        strength: complexityCount
    };
}
```

#### 4. **Session 固定攻击** 🟡 中风险
**问题**:
- 登录成功后没有重新生成 session ID

**风险**:
- 攻击者可能预先设置 session ID
- 用户登录后继续使用被攻击者知道的 session

**建议**:
- better-auth 应该自动处理这个问题
- 验证登录后是否生成新的 session token
- 如果没有，需要手动实现

#### 5. **敏感信息日志记录** 🟡 中风险
**问题**:
- `console.error('Sign in error:', error)` 可能记录敏感信息

**风险**:
- 日志泄露用户信息
- 攻击者可能从日志获取系统信息

**建议修复**:
```javascript
// 不要记录完整错误对象
console.error('Sign in error:', error.message); // 只记录消息

// 或使用专门的日志库
import { logger } from '@/lib/logger';
logger.error('Sign in failed', {
    userId: sanitize(userId),
    timestamp: new Date(),
    // 不包含敏感数据
});
```

#### 6. **缺少账号锁定机制** 🟡 中风险
**问题**:
- 多次登录失败不会锁定账号

**风险**:
- 允许无限次暴力破解尝试

**建议修复**:
```javascript
// 在数据库中记录失败次数
export async function signInWithEmailAction(credentials) {
    const user = await getUserByEmail(credentials.email);
    
    // 检查账号是否被锁定
    if (user.lockUntil && user.lockUntil > new Date()) {
        return {
            success: false,
            error: 'Account temporarily locked. Try again later.'
        };
    }
    
    // 尝试登录
    const result = await auth.api.signInEmail({...});
    
    if (!result) {
        // 登录失败，增加失败计数
        const failedAttempts = (user.failedLoginAttempts || 0) + 1;
        
        if (failedAttempts >= 5) {
            // 锁定账号 30 分钟
            await updateUser(user.id, {
                failedLoginAttempts: failedAttempts,
                lockUntil: new Date(Date.now() + 30 * 60 * 1000)
            });
        } else {
            await updateUser(user.id, { failedLoginAttempts });
        }
    } else {
        // 登录成功，重置失败计数
        await updateUser(user.id, {
            failedLoginAttempts: 0,
            lockUntil: null
        });
    }
    
    return result;
}
```

#### 7. **第三方登录邮箱验证假设** 🟢 低风险
**问题**:
- 假设 OAuth 提供商返回的邮箱已验证
- Google/GitHub 通常返回已验证邮箱，但不是 100% 保证

**风险**:
- 某些情况下可能获得未验证邮箱

**建议**:
- 检查 OAuth 响应中的 `email_verified` 字段
- 如果邮箱未验证，要求用户补充验证

#### 8. **缺少双因素认证（2FA）** 🟢 低风险
**问题**:
- 没有实现 2FA/MFA

**建议**:
- 对于高价值账号（管理员、付费用户）实现 2FA
- 使用 TOTP（Time-based One-Time Password）
- better-auth 可能支持 2FA 插件

#### 9. **缺少审计日志** 🟡 中风险
**问题**:
- 没有记录安全相关事件（登录、登出、权限变更）

**风险**:
- 无法追踪安全事件
- 难以发现异常活动

**建议修复**:
```javascript
// lib/audit-log.js
export async function createAuditLog({
    userId,
    action, // 'login', 'logout', 'password_change', etc.
    ip,
    userAgent,
    success,
    metadata
}) {
    await prisma.auditLog.create({
        data: {
            userId,
            action,
            ip,
            userAgent,
            success,
            metadata,
            timestamp: new Date(),
        },
    });
}
```

### 安全建议优先级

#### 🔴 高优先级（立即修复）
1. **启用邮箱验证**
2. **实现频率限制**
3. **增强密码强度要求**

#### 🟡 中优先级（近期修复）
4. 账号锁定机制
5. 改进日志记录
6. 添加审计日志
7. 验证 session 重新生成

#### 🟢 低优先级（长期优化）
8. 检查 OAuth 邮箱验证状态
9. 实现 2FA
10. 定期安全审计

### 安全检查清单

在上线生产环境前，请确保：

- [ ] 启用 HTTPS
- [ ] 设置强随机 `BETTER_AUTH_SECRET`
- [ ] 配置正确的 CORS 策略
- [ ] 启用邮箱验证
- [ ] 实现频率限制
- [ ] 设置严格的密码策略
- [ ] 配置安全的 Cookie 选项
- [ ] 实施账号锁定机制
- [ ] 添加审计日志
- [ ] 定期备份数据库
- [ ] 监控异常登录活动
- [ ] 准备安全事件响应计划

## 配置

### 环境变量

```env
# Better Auth 配置
BETTER_AUTH_SECRET=your-secret-key
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Google OAuth（可选）
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth（可选）
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# PostgreSQL
DATABASE_URL=your-postgresql-url

```

### 第三方登录配置步骤

#### Google OAuth

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API
4. 创建 OAuth 2.0 凭据
5. 添加授权重定向 URI：`http://localhost:3000/api/auth/callback/google`（开发环境）
6. 将 Client ID 和 Client Secret 添加到 `.env.local`

#### GitHub OAuth

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 创建新的 OAuth App
3. 设置 Authorization callback URL：`http://localhost:3000/api/auth/callback/github`
4. 将 Client ID 和 Client Secret 添加到 `.env.local`

## Server Actions

### 认证相关 Actions

所有认证相关的 Server Actions 都在 `app/(client)/actions/auth.js` 中：

#### 邮箱密码登录

```javascript
import { signInWithEmailAction } from '@/app/(client)/actions';

const result = await signInWithEmailAction({
	email: 'user@example.com',
	password: 'password123'
});

if (result.success) {
	// 登录成功
	router.push('/dashboard');
} else {
	// 显示错误
	console.error(result.error);
}
```

#### 邮箱密码注册

```javascript
import { signUpWithEmailAction } from '@/app/(client)/actions';

const result = await signUpWithEmailAction({
	email: 'user@example.com',
	password: 'password123',
	name: 'User Name' // 可选
});

if (result.success) {
	// 注册成功
	router.push('/dashboard');
} else {
	// 显示错误
	console.error(result.error);
}
```

#### 退出登录

```javascript
import { signOutAction } from '@/app/(client)/actions';

const result = await signOutAction();
if (result.success) {
	router.push('/login');
}
```

#### 获取当前会话

```javascript
import { getSessionAction } from '@/app/(client)/actions';

const result = await getSessionAction();
if (result.success) {
	console.log(result.data.user);
} else {
	// 用户未登录
}
```

## 客户端集成

### 使用 authClient（推荐用于客户端组件）

```javascript
'use client';

import { authClient } from '@/lib/auth-client';

// Google 登录
await authClient.signIn.social({
	provider: 'google',
	callbackURL: '/dashboard'
});

// GitHub 登录
await authClient.signIn.social({
	provider: 'github',
	callbackURL: '/dashboard'
});

// 获取会话
const { data: session } = await authClient.useSession();
```

### 登录表单示例

参考 `app/(client)/[locale]/(auth)/login/login-form.js`：

```javascript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAction } from '@/app/(client)/actions';
import { authClient } from '@/lib/auth-client';

export function LoginForm() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	// 邮箱密码登录
	const handleEmailLogin = async (e) => {
		e.preventDefault();
		setIsLoading(true);

		const formData = new FormData(e.target);
		const result = await signInWithEmailAction({
			email: formData.get('email'),
			password: formData.get('password')
		});

		if (result.success) {
			router.push('/dashboard');
		}
		setIsLoading(false);
	};

	// Google 登录
	const handleGoogleLogin = async () => {
		await authClient.signIn.social({
			provider: 'google',
			callbackURL: '/dashboard'
		});
	};

	return (
		<form onSubmit={handleEmailLogin}>
			<input name="email" type="email" required />
			<input name="password" type="password" required />
			<button type="submit">Login</button>
			<button type="button" onClick={handleGoogleLogin}>
				Login with Google
			</button>
		</form>
	);
}
```

## 用户初始化

### 新用户自动初始化

所有新用户（无论通过哪种方式注册）都会自动初始化以下字段：

```javascript
{
	credits: 0,                  // 初始积分
	totalCreditsEarned: 0,       // 总获得积分
	totalCreditsUsed: 0,         // 总使用积分
	role: 'user',                // 用户角色
	lastLoginAt: new Date()      // 最后登录时间
}
```

### 用户初始化机制

**注意**: 由于 better-auth hooks 存在兼容性问题，本项目采用手动初始化方式。

#### 初始化工具 (`lib/init-user.js`)

```javascript
// 初始化新用户
export async function initializeNewUser(userId) {
    // 检查用户是否已初始化（通过 credits 字段判断）
    // 未初始化：设置初始积分和角色
    // 已初始化：只更新最后登录时间
}

// 更新最后登录时间
export async function updateLastLogin(userId) {
    // 更新 lastLoginAt 字段
}
```

#### 初始化时机

1. **邮箱注册后** - 在 `signUpWithEmailAction()` 中调用 `initializeNewUser()`
2. **邮箱登录后** - 在 `signInWithEmailAction()` 中调用 `updateLastLogin()`
3. **三方登录后** - 在登录页 `useEffect` 中检测 session，调用 `checkAndInitUserAction()`

## 会话管理

### 会话配置

```javascript
session: {
	expiresIn: 24 * 60 * 60,    // 24小时过期
	updateAge: 60 * 60,          // 1小时更新一次
	async fetchUser(userId) {
		// 从数据库获取最新用户信息
		return await prisma.user.findUnique({
			where: { id: userId },
		});
	}
}
```

### 服务端获取会话

```javascript
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const session = await auth.api.getSession({
	headers: await headers()
});

if (!session) {
	return { error: 'Unauthorized' };
}

const userId = session.user.id;
```

## 权限控制

### 用户角色

- `user` - 普通用户（默认）
- `admin` - 管理员

### 检查管理员权限

```javascript
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

async function checkAdmin() {
	const session = await auth.api.getSession({
		headers: await headers()
	});

	if (!session || session.user.role !== 'admin') {
		throw new Error('Unauthorized');
	}

	return session.user;
}
```

## 多语言支持

登录页面支持中英日三语，使用 `next-intl` 实现。

### 翻译键

所有认证相关的翻译在 `messages/{locale}.json` 的 `auth` 命名空间下：

```json
{
	"auth": {
		"login": "Login",
		"email": "Email",
		"password": "Password",
		"welcomeBack": "Welcome back",
		"loginSuccess": "Login successful!",
		"loginFailed": "Login failed. Please check your credentials.",
		...
	}
}
```

### 在组件中使用

```javascript
'use client';

import { useTranslations } from 'next-intl';

export function LoginForm() {
	const t = useTranslations('auth');

	return (
		<div>
			<h1>{t('welcomeBack')}</h1>
			<button>{t('login')}</button>
		</div>
	);
}
```

## 安全最佳实践

1. **密码要求**
   - 最小长度：8 字符
   - 最大长度：128 字符

2. **Session Cookie**
   - 生产环境使用 HTTPS（自动启用 secure cookies）
   - 开发环境使用 HTTP

3. **密钥管理**
   - `BETTER_AUTH_SECRET` 必须设置为强随机字符串
   - 不要将密钥提交到版本控制

4. **CSRF 保护**
   - better-auth 自动处理 CSRF 保护

## 常见问题

### Q: 第三方登录后如何获取用户信息？

A: better-auth 会自动从第三方提供商获取用户的基本信息（邮箱、名字、头像等）并存储到数据库。

### Q: 如何添加邮箱验证？

A: 在 `lib/auth.js` 中设置：

```javascript
emailAndPassword: {
	enabled: true,
	requireEmailVerification: true  // 启用邮箱验证
}
```

### Q: 如何自定义登录后的跳转？

A: 在调用 signIn 时指定 `callbackURL`：

```javascript
await authClient.signIn.social({
	provider: 'google',
	callbackURL: '/custom-redirect'
});
```

### Q: 邮箱密码登录时如何支持自动注册？

A: 目前的设计是邮箱密码登录仅用于已有账号。如果需要支持自动注册，可以在登录失败时调用 `signUpWithEmailAction` 自动注册。

## 相关文件

### 核心文件
- `lib/auth.js` - 服务端认证配置（better-auth 配置）
- `lib/auth-client.js` - 客户端认证工具（React hooks）
- `lib/init-user.js` - 用户初始化工具函数（⭐ 新增）

### Server Actions
- `app/(client)/actions/auth.js` - 认证相关 Server Actions
- `app/(client)/actions/index.js` - Actions 统一导出

### 前端页面
- `app/(client)/[locale]/(auth)/login/login-form.js` - 登录表单组件
- `app/(client)/[locale]/(auth)/login/page.js` - 登录页面

### API 路由
- `app/api/auth/[...all]/route.js` - better-auth API 路由处理器

### 多语言
- `messages/en.json` - 英文翻译
- `messages/zh.json` - 中文翻译
- `messages/ja.json` - 日文翻译

## 故障排查

### 常见问题

#### 1. 三方登录报错：`hook.handler is not a function`
**原因**: better-auth hooks 语法问题或版本兼容性问题

**解决方案**: 已移除 hooks，改用手动初始化方式

#### 2. 三方登录后没有初始化用户数据
**检查**:
- 确认 `useSession()` hook 正常工作
- 检查 `checkAndInitUserAction()` 是否被调用
- 查看浏览器控制台和服务端日志

**解决方案**:
```javascript
// 在登录页添加调试日志
useEffect(() => {
    console.log('Session:', session);
    if (session) {
        console.log('Initializing user...');
        // ...
    }
}, [session, router]);
```

#### 3. 数据库连接错误
**检查**:
- 环境变量 DATABASE_URL 是否正确
- PostgreSQL 服务是否运行
- 网络连接是否正常

#### 4. OAuth 重定向失败
**检查**:
- Google/GitHub OAuth 应用配置
- 回调 URL 是否正确设置
- `NEXT_PUBLIC_BETTER_AUTH_URL` 环境变量

## 性能优化建议

### 1. Session 缓存
考虑使用 Redis 缓存 session 数据，减少数据库查询：

```javascript
// lib/session-cache.js
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCachedSession(sessionToken) {
    const cached = await redis.get(`session:${sessionToken}`);
    if (cached) return JSON.parse(cached);
    
    // 从数据库获取并缓存
    const session = await fetchSessionFromDB(sessionToken);
    await redis.setex(`session:${sessionToken}`, 3600, JSON.stringify(session));
    return session;
}
```

### 2. 减少数据库查询
- 使用数据库索引优化查询性能
- 合并相关查询减少往返次数

### 3. 前端优化
- 使用 `useSession()` hook 的缓存功能
- 避免频繁调用认证相关 API

## 更多资源

- [better-auth 官方文档](https://www.better-auth.com/)
- [better-auth GitHub](https://github.com/better-auth/better-auth)
- [Server Actions 文档](./SERVER_ACTIONS.md)
- [多语言配置文档](./I18N_GUIDE.md)
- [PostgreSQL 安全最佳实践](https://www.postgresql.org/docs/current/security.html)
- [OWASP 认证指南](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)


