# 快速入门指南

<div align="center">

**10 分钟快速上手 NextJS Base**

[获取项目](#-获取项目) · [环境配置](#-环境配置) · [一键初始化](#-一键初始化) · [下一步](#-下一步)

</div>

---

## 📋 概述

本指南将帮助你在 10 分钟内完成项目的环境配置和启动。

### 前置要求

| 工具 | 版本要求 | 说明 |
|:---|:---|:---|
| Node.js | 20.9+ | 推荐使用 LTS 版本 |
| PostgreSQL | 16+ | 或使用云数据库服务（如 Supabase、Neon） |
| bun/pnpm/npm/yarn | 最新版 | **推荐使用 bun** |
| Git | 最新版 | 版本控制 |
| GitHub 账号 | - | 用于 Fork 项目 |

---

## 🍴 获取项目

### 方式一：Fork 项目（推荐）

> **推荐使用 Fork**：这样你可以保留自己的修改，同时方便接收上游更新。

1. 访问 [NextJS Base GitHub 仓库](https://github.com/huglemon/nextjs-base)
2. 点击右上角的 **Fork** 按钮
3. 选择你的 GitHub 账号作为目标
4. Fork 完成后，克隆你自己的仓库：

```bash
# 替换 your-username 为你的 GitHub 用户名
git clone https://github.com/your-username/nextjs-base.git my-project
cd my-project
```

5. （可选）添加上游仓库以便同步更新：

```bash
git remote add upstream https://github.com/huglemon/nextjs-base.git

# 之后同步上游更新
git fetch upstream
git merge upstream/develop
```

### 方式二：使用模板创建

如果你想完全独立，不保留与原仓库的关联：

1. 访问 [NextJS Base GitHub 仓库](https://github.com/huglemon/nextjs-base)
2. 点击 **Use this template** → **Create a new repository**
3. 填写你的仓库名称，点击创建
4. 克隆新创建的仓库：

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 方式三：直接克隆（仅用于体验）

> ⚠️ **注意**：直接克隆无法推送修改到原仓库，仅适合快速体验。

```bash
git clone https://github.com/huglemon/nextjs-base.git
cd nextjs-base
```

---

## 🔧 环境配置

### 1. 安装依赖

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

### 2. 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件：

```env
# 数据库连接（必须）
DATABASE_URL="postgresql://username:password@localhost:5432/your_database?schema=public"

# Better Auth 配置（必须）
BETTER_AUTH_SECRET="your-secret-key-at-least-32-characters"
BETTER_AUTH_URL="http://localhost:3000"

# 文件上传（可选，用于素材管理功能）
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="your-bucket"
R2_PUBLIC_URL="https://your-bucket.r2.cloudflarestorage.com"
```

### 3. 准备数据库

#### 本地 PostgreSQL

```bash
# 登录 PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE your_database;

# 退出
\q
```

#### 使用云数据库（推荐）

推荐使用以下云数据库服务，无需本地安装：

| 服务 | 说明 | 免费额度 |
|:---|:---|:---|
| [Supabase](https://supabase.com) | 开源 Firebase 替代品 | 500MB |
| [Neon](https://neon.tech) | Serverless PostgreSQL | 512MB |
| [Vercel Postgres](https://vercel.com/storage/postgres) | Vercel 原生集成 | 256MB |

创建数据库后，将连接字符串填入 `.env.local` 的 `DATABASE_URL`。

---

## 🚀 一键初始化

### 执行初始化

只需执行一个命令，完成所有初始化工作：

```bash
bun run init
```

这个命令会自动完成：

1. ✅ 加载 `.env.local` 环境变量
2. ✅ 生成 Prisma Client
3. ✅ 创建数据库表结构
4. ✅ 导入种子数据（RBAC 权限、菜单、示例数据）
5. ✅ 创建超级管理员账户（交互式输入邮箱和密码）

```
╔═══════════════════════════════════════════════════════════╗
║           NextJS Base Admin - Initialization              ║
╚═══════════════════════════════════════════════════════════╝

[1/4] Checking environment...
   ✓ Loaded environment from .env.local
   ✓ DATABASE_URL found

[2/4] Setting up database schema...
   ✓ Prisma Client generated
   ✓ Database schema created

[3/4] Importing seed data...
   ✓ 43 permissions created
   ✓ 17 menus created
   ✓ 8 roles created
   ✓ 3 example records created

[4/4] Creating super admin account...
   Admin Email: your-email@example.com
   Admin Password: ********
   ✓ Super admin created

╔═══════════════════════════════════════════════════════════╗
║           ✅ Initialization Completed!                    ║
╚═══════════════════════════════════════════════════════════╝
```

### 非交互式初始化（CI/CD）

如果你想跳过交互式输入，可以通过环境变量预设管理员信息：

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=your-password ADMIN_NAME=Administrator bun run init
```

### 分步执行

如果你想更细粒度地控制初始化过程：

```bash
# 1. 生成 Prisma Client
bun run db:generate

# 2. 创建数据库表结构
bun run db:push

# 3. 导入种子数据（RBAC + Example）
bun run db:seed

# 4. 创建超级管理员
bun run db:admin
```

---

## 🎉 启动项目

### 开发模式

```bash
bun run dev
```

### 访问应用

| 页面 | 地址 |
|:---|:---|
| 前台首页 | [http://localhost:3000](http://localhost:3000) |
| 后台管理 | [http://localhost:3000/admin](http://localhost:3000/admin) |

使用你在初始化时创建的管理员账号登录后台。

> ⚠️ **安全提示**：请使用强密码，并在生产环境中定期更换！

---

## 👤 超级管理员说明

### 什么是超级管理员？

超级管理员是系统中最高权限的用户：

| 属性 | 值 | 说明 |
|:---|:---|:---|
| `role` | `admin` | Better Auth 的 admin 角色 |
| `roles` | `[]` | 不需要 RBAC 角色 |
| `isBackendAllowed` | `true` | 允许访问后台 |

> **重要**：`role: 'admin'` 拥有所有权限，不需要通过 RBAC 分配角色。

### 用户类型对比

| 类型 | role | roles | isBackendAllowed | 说明 |
|:---|:---|:---|:---|:---|
| 普通用户 | `user` | `[]` | `false` | 只能访问前台 |
| 后台用户 | `user` | `['role_id']` | `true` | 需要分配 RBAC 角色 |
| **超级管理员** | `admin` | `[]` | `true` | 拥有所有权限 |

---

## 📦 种子数据说明

初始化脚本会导入以下预设数据（使用固定 ID，所有安装的系统数据一致）：

### RBAC 数据

| 类型 | 数量 | 说明 |
|:---|:---:|:---|
| 权限 (Permissions) | 43 | 包含 CRUD、RBAC、系统管理等权限 |
| 菜单 (Menus) | 17 | Dashboard、Example、RBAC、System、Links |
| 角色 (Roles) | 8 | Admin Roles、User Roles 及其子角色 |

### 预设角色

| 角色名 | 说明 |
|:---|:---|
| `Super Admin` | 全量权限 |
| `Demo - Readonly` | 全局只读 |
| `Admin - RBAC Ops (No Delete)` | RBAC 可写但无删除 |
| `Demo - RBAC Readonly + Example Write` | 演示角色 |

### 示例数据

| 类型 | 数量 | 说明 |
|:---|:---:|:---|
| Example Data | 3 | SmartCrudPage 演示数据 |

---

## ✅ 验证安装

### 检查清单

- [ ] 项目成功启动，无报错
- [ ] 可以访问前台首页
- [ ] 可以访问后台登录页
- [ ] 可以使用管理员账号登录
- [ ] 后台菜单正常显示（Dashboard、Example、User & Permission、System、Links）
- [ ] 可以访问 Example > Data Table > Basic 页面

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
<summary><strong>初始化脚本报错 "DATABASE_URL not found"</strong></summary>

确保 `.env.local` 文件存在且格式正确：

```bash
# 检查文件是否存在
ls -la .env.local

# 检查内容
cat .env.local
```

注意：
- 环境变量不要有多余的空格
- 如果值包含特殊字符，用双引号包裹

</details>

<details>
<summary><strong>Prisma 迁移失败</strong></summary>

尝试重置数据库：

```bash
# 重置数据库（会删除所有数据）
bunx prisma migrate reset

# 重新执行初始化
bun run init
```

</details>

<details>
<summary><strong>登录后台提示无权限</strong></summary>

确保你的账户是超级管理员（`role: 'admin'`），或者被分配了正确的 RBAC 角色。

可以通过 Prisma Studio 检查用户数据：

```bash
bun run db:studio
```

</details>

<details>
<summary><strong>如何添加更多管理员？</strong></summary>

方式一：通过命令行

```bash
bun run db:admin
```

方式二：通过后台管理界面

登录后台 → User & Permission → Users → 创建用户 → 设置 `role: admin`

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

## 📜 可用命令

| 命令 | 说明 |
|:---|:---|
| `bun run init` | 一键初始化（推荐） |
| `bun run dev` | 启动开发服务器 |
| `bun run build` | 构建生产版本 |
| `bun run db:generate` | 生成 Prisma Client |
| `bun run db:push` | 推送 Schema 到数据库 |
| `bun run db:migrate` | 执行数据库迁移 |
| `bun run db:studio` | 打开 Prisma Studio |
| `bun run db:seed` | 导入种子数据 |
| `bun run db:admin` | 创建超级管理员 |

---

<div align="center">

[← 返回文档中心](../README.md) · [创建第一个页面 →](./FIRST_PAGE.md)

</div>
