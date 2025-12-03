# 认证系统指南

<div align="center">

**用户认证和会话管理**

[Better Auth](#-better-auth) · [前台认证](#-前台认证) · [后台认证](#-后台认证)

</div>

---

## 🎯 概述

NextJS Base 使用 **Better Auth** 作为认证解决方案，支持邮箱密码登录、OAuth 登录等多种认证方式。

### 技术栈

| 组件 | 说明 |
|:---|:---|
| Better Auth | 认证框架 |
| Prisma Adapter | 数据库适配器 |
| JWT | Token 管理 |
| Cookies | 会话存储 |

---

## 🔐 Better Auth

### 配置文件

```javascript
// lib/auth/auth.js
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '@/lib/database/prisma'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  
  emailAndPassword: {
    enabled: true,
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7,  // 7 天
    updateAge: 60 * 60 * 24,      // 每天更新
  },
  
  // OAuth 配置（可选）
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
  },
})
```

### 环境变量

```env
# Better Auth
BETTER_AUTH_SECRET="your-secret-key-at-least-32-characters"
BETTER_AUTH_URL="http://localhost:3000"

# OAuth（可选）
GOOGLE_CLIENT_ID="xxx"
GOOGLE_CLIENT_SECRET="xxx"
GITHUB_CLIENT_ID="xxx"
GITHUB_CLIENT_SECRET="xxx"
```

---

## 🌐 前台认证

### 客户端配置

```javascript
// lib/auth/auth-client.js
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient
```

### 登录页面

```javascript
'use client'

import { useState } from 'react'
import { signIn } from '@/lib/auth/auth-client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.target)
    const email = formData.get('email')
    const password = formData.get('password')

    try {
      const result = await signIn.email({
        email,
        password,
      })

      if (result.error) {
        setError(result.error.message)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" placeholder="邮箱" required />
      <input name="password" type="password" placeholder="密码" required />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? '登录中...' : '登录'}
      </button>
    </form>
  )
}
```

### 注册页面

```javascript
'use client'

import { signUp } from '@/lib/auth/auth-client'

export default function RegisterPage() {
  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    const result = await signUp.email({
      email: formData.get('email'),
      password: formData.get('password'),
      name: formData.get('name'),
    })

    if (result.error) {
      // 处理错误
    } else {
      // 注册成功，跳转登录或自动登录
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="用户名" required />
      <input name="email" type="email" placeholder="邮箱" required />
      <input name="password" type="password" placeholder="密码" required />
      <button type="submit">注册</button>
    </form>
  )
}
```

### 获取会话

```javascript
'use client'

import { useSession } from '@/lib/auth/auth-client'

export default function ProfilePage() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return <div>加载中...</div>
  }

  if (!session) {
    return <div>请先登录</div>
  }

  return (
    <div>
      <h1>欢迎，{session.user.name}</h1>
      <p>邮箱：{session.user.email}</p>
    </div>
  )
}
```

### 退出登录

```javascript
import { signOut } from '@/lib/auth/auth-client'

const handleLogout = async () => {
  await signOut()
  // 跳转到首页或登录页
}
```

---

## 🔒 后台认证

### 服务端获取会话

```javascript
// lib/auth/auth.js
import { auth as betterAuth } from './auth'
import { headers } from 'next/headers'

export const auth = async () => {
  const session = await betterAuth.api.getSession({
    headers: await headers(),
  })
  return session
}
```

### 在 Server Action 中使用

```javascript
'use server'

import { auth } from '@/lib/auth/auth'

export async function getUserProfileAction() {
  const session = await auth()
  
  if (!session?.user) {
    return { success: false, error: '请先登录' }
  }
  
  // 获取用户信息
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })
  
  return { success: true, data: user }
}
```

### 后台访问控制

```javascript
// lib/auth/admin-auth.js
import { auth } from './auth'
import { prisma } from '@/lib/database/prisma'

export async function checkBackendAccess() {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error('请先登录')
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { hasBackendAccess: true },
  })
  
  if (!user?.hasBackendAccess) {
    throw new Error('无后台访问权限')
  }
  
  return session.user
}
```

### 在 wrapAction 中自动检查

```javascript
// wrapAction 会自动处理认证
export const sysGetUserListAction = wrapAction(
  'sysGetUserList',  // sys 前缀自动检查后台权限
  async (params, ctx) => {
    // ctx.userId - 当前用户 ID
    // ctx.user - 当前用户信息
    // ctx.isAdmin - 是否管理员
    return await dao.getList(params)
  }
)
```

---

## 🛡️ 路由保护

### 中间件保护

```javascript
// middleware.js
import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl
  
  // 后台路由保护
  if (pathname.startsWith('/admin')) {
    const session = request.cookies.get('better-auth.session_token')
    
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

### 页面级保护

```javascript
// app/(admin)/admin/layout.js
import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/login')
  }
  
  // 检查后台访问权限
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })
  
  if (!user?.hasBackendAccess) {
    redirect('/403')
  }
  
  return <>{children}</>
}
```

---

## 📊 用户模型

### Prisma Schema

```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  emailVerified     Boolean   @default(false)
  name              String?
  image             String?
  
  // 角色和权限
  roles             String[]  @default([])
  hasBackendAccess  Boolean   @default(false)
  
  // 状态
  banned            Boolean   @default(false)
  banReason         String?
  banExpires        DateTime?
  
  // 时间戳
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // 关联
  sessions          Session[]
  accounts          Account[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  accountId         String
  providerId        String
  accessToken       String?
  refreshToken      String?
  accessTokenExpiresAt DateTime?
  refreshTokenExpiresAt DateTime?
  scope             String?
  
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([providerId, accountId])
}
```

---

## 📚 相关文档

| 文档 | 说明 |
|:---|:---|
| [Better Auth 官方文档](https://www.better-auth.com/) | 官方文档 |
| [RBAC 配置](../rbac/CONFIGURATION.md) | 权限配置 |
| [权限模型](../../architecture/PERMISSION_MODEL.md) | 权限架构 |

---

<div align="center">

[← 菜单管理](../rbac/MENU_MANAGEMENT.md) · [国际化指南 →](./I18N.md)

</div>

