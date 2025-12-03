# 快速入门指南

<div align="center">

**10 分钟快速上手 NextJS Base**

[环境准备](#-环境准备) · [项目启动](#-项目启动) · [下一步](#-下一步)

</div>

---

## 📋 概述

本指南将帮助你在 10 分钟内完成项目的环境配置和启动。

### 前置要求

| 工具 | 版本要求 | 说明 |
|:---|:---|:---|
| Node.js | 20.9+ | 推荐使用 LTS 版本 |
| PostgreSQL | 16+ | 或使用云数据库服务 |
| bun/pnpm/npm/yarn | 最新版 | **推荐使用 bun** |
| Git | 最新版 | 版本控制 |

---

## 🔧 环境准备

### 1. 克隆项目

```bash
git clone https://github.com/your-repo/nextjs-base.git
cd nextjs-base
```

### 2. 安装依赖

```bash
# 使用 bun（推荐）
bun install

# 或使用 pnpm
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

### 3. 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件：

```env
# 数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/nextjs_base?schema=public"

# Better Auth 配置
BETTER_AUTH_SECRET="your-secret-key-at-least-32-characters"
BETTER_AUTH_URL="http://localhost:3000"

# 文件上传（可选）
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="your-bucket"
R2_PUBLIC_URL="https://your-bucket.r2.cloudflarestorage.com"
```

### 4. 配置数据库

确保 PostgreSQL 已启动，然后创建数据库：

```bash
# 登录 PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE nextjs_base;

# 退出
\q
```

### 5. 初始化数据库

```bash
# 执行数据库迁移
bunx prisma migrate dev

# 生成 Prisma Client
bunx prisma generate

# 初始化基础数据（创建默认管理员、角色、权限、菜单）
bun run db:init
```

> **初始化脚本会创建**：
> - 默认管理员账户：`admin@example.com` / `admin123`
> - 默认角色：admin、editor、viewer
> - 默认权限：系统管理相关权限
> - 默认菜单：RBAC 和 System 菜单

---

## 🚀 项目启动

### 开发模式

```bash
bun run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看项目。

### 访问后台管理

1. 访问 [http://localhost:3000/admin](http://localhost:3000/admin)
2. 使用初始管理员账号登录：
   - 邮箱：`admin@example.com`
   - 密码：`admin123`

> ⚠️ **安全提示**：首次登录后请立即修改默认密码！

---

## 📁 项目结构预览

```
nextjs-base/
├── app/                    # Next.js App Router
│   ├── (admin)/           # 后台管理
│   │   ├── admin/         # 页面目录
│   │   └── actions/       # Server Actions
│   ├── (client)/          # 前台页面
│   └── api/               # API 路由
│
├── components/            # React 组件
│   ├── admin/             # 后台组件
│   └── client/            # 前台组件
│
├── lib/                   # 核心库
│   ├── core/              # 核心功能
│   ├── database/          # 数据库
│   └── function/          # 工具函数
│
├── prisma/                # Prisma Schema
│   └── schema.prisma
│
└── templates/             # 开发模板
    └── crud/              # CRUD 模板
```

---

## ✅ 验证安装

### 检查清单

- [ ] 项目成功启动，无报错
- [ ] 可以访问前台首页
- [ ] 可以访问后台登录页
- [ ] 可以使用管理员账号登录
- [ ] 后台菜单正常显示

### 常见问题

<details>
<summary><strong>数据库连接失败</strong></summary>

检查 `.env.local` 中的 `DATABASE_URL` 配置是否正确：

```env
DATABASE_URL="postgresql://用户名:密码@主机:端口/数据库名?schema=public"
```

确保：
- PostgreSQL 服务已启动
- 用户名和密码正确
- 数据库已创建
- 端口号正确（默认 5432）

</details>

<details>
<summary><strong>Prisma 迁移失败</strong></summary>

尝试重置数据库：

```bash
# 重置数据库（会删除所有数据）
bunx prisma migrate reset

# 重新执行迁移
bunx prisma migrate dev
```

</details>

<details>
<summary><strong>登录后台提示无权限</strong></summary>

确保已执行初始化脚本：

```bash
bun run db:init
```

这会创建默认管理员账户 `admin@example.com`（密码 `admin123`）。

</details>

---

## 🎯 下一步

恭喜你完成了项目的初始化！接下来可以：

| 目标 | 推荐阅读 | 预计时间 |
|:---|:---|:---:|
| 创建第一个页面 | [创建第一个页面](./FIRST_PAGE.md) | 15 分钟 |
| 了解项目结构 | [项目结构说明](./PROJECT_STRUCTURE.md) | 5 分钟 |
| 深入架构设计 | [整体架构](../architecture/OVERVIEW.md) | 10 分钟 |
| 学习最佳实践 | [完整示例](../../templates/crud/EXAMPLE.md) | 20 分钟 |

---

<div align="center">

[← 返回文档中心](../README.md) · [创建第一个页面 →](./FIRST_PAGE.md)

</div>

