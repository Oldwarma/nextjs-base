# PostgreSQL + Prisma 7 配置指南

## 概述

本项目使用 PostgreSQL 作为数据库，Prisma 7 作为 ORM，使用 `@prisma/adapter-pg` 驱动适配器。

## 环境配置

### 1. 安装 PostgreSQL

**macOS (Homebrew)**:
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu/Debian**:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows**:
下载并安装 [PostgreSQL 官方安装包](https://www.postgresql.org/download/windows/)

### 2. 创建数据库

```bash
# 进入 PostgreSQL 命令行
psql -U postgres

# 创建数据库
CREATE DATABASE nextjs_base;

# 创建用户（可选）
CREATE USER myuser WITH PASSWORD 'mypassword';
GRANT ALL PRIVILEGES ON DATABASE nextjs_base TO myuser;

# 退出
\q
```

### 3. 配置环境变量

在项目根目录创建 `.env` 文件（Prisma 需要读取此文件）：

```env
# PostgreSQL 数据库连接
DATABASE_URL="postgresql://postgres:password@localhost:5432/nextjs_base?schema=public"

# Better Auth 密钥
BETTER_AUTH_SECRET="your-secret-key-at-least-32-characters"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"
```

> **注意**: Prisma 7 默认读取 `.env` 文件，不是 `.env.local`。确保 `DATABASE_URL` 在 `.env` 文件中配置。

**连接字符串格式**:
```
postgresql://[用户名]:[密码]@[主机]:[端口]/[数据库名]?schema=[模式]
```

### 4. 安装依赖

```bash
npm install @prisma/client @prisma/adapter-pg
npm install -D prisma
```

### 5. 初始化 Prisma

```bash
# 生成 Prisma Client
npx prisma generate

# 推送 Schema 到数据库（开发环境）
npx prisma db push

# 或者使用迁移（生产环境推荐）
npx prisma migrate dev --name init
```

## Prisma 7 配置说明

### Schema 文件 (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../lib/generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

> **Prisma 7 变更**: `datasource` 中不再需要 `url` 配置，连接 URL 在 `prisma.config.ts` 中配置。

### 配置文件 (`prisma.config.ts`)

```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

### Prisma Client 实例化 (`lib/database/prisma.js`)

Prisma 7 需要使用 `@prisma/adapter-pg` 驱动适配器：

```javascript
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/lib/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export default prisma;
```

## Prisma Schema 模型说明

Schema 文件位于 `prisma/schema.prisma`：

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../lib/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

// 用户表 (Better Auth)
model User {
  id                  String    @id
  name                String
  email               String    @unique
  emailVerified       Boolean   @default(false)
  image               String?
  role                String    @default("user")
  // ... 其他字段
}

// 角色表 (RBAC)
model Role {
  id                      String    @id @default(uuid())
  name                    String    @unique
  remark                  String?
  enable                  Boolean   @default(true)
  permission              String[]  @default([])
  menu                    String[]  @default([])
  // ... 其他字段
}
```

### 字段命名规范

| Prisma 字段 | 数据库列名 | 说明 |
|------------|-----------|------|
| `parentId` | `parent_id` | 父级 ID |
| `createdAt` | `created_at` | 创建时间 |
| `updatedAt` | `updated_at` | 更新时间 |
| `crudCategory` | `crud_category` | CRUD 分类 |

使用 `@map()` 将 camelCase 字段映射到 snake_case 列名：

```prisma
model Permission {
  parentId      String?   @map("parent_id")
  crudCategory  Int       @default(0) @map("crud_category")
  
  @@map("permissions")
}
```

## 常用 Prisma 命令

```bash
# 生成 Prisma Client
npx prisma generate

# 推送 Schema 到数据库（不生成迁移文件）
npx prisma db push

# 创建迁移
npx prisma migrate dev --name <迁移名称>

# 应用迁移（生产环境）
npx prisma migrate deploy

# 重置数据库
npx prisma migrate reset

# 打开 Prisma Studio（数据库 GUI）
npx prisma studio

# 从数据库拉取 Schema
npx prisma db pull

# 格式化 Schema
npx prisma format
```

## 在代码中使用 Prisma

### 导入 Prisma Client

```javascript
import { prisma } from '@/lib/database/prisma';
```

### 基础 CRUD 操作

```javascript
// 创建
const user = await prisma.user.create({
  data: {
    id: generateId(),
    name: 'John',
    email: 'john@example.com',
  },
});

// 查询单条
const user = await prisma.user.findUnique({
  where: { id: 'user-id' },
});

// 查询多条
const users = await prisma.user.findMany({
  where: { role: 'admin' },
  orderBy: { createdAt: 'desc' },
});

// 分页查询
const users = await prisma.user.findMany({
  where: { role: 'user' },
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' },
});

// 更新
const user = await prisma.user.update({
  where: { id: 'user-id' },
  data: { name: 'New Name' },
});

// 删除
await prisma.user.delete({
  where: { id: 'user-id' },
});

// 统计
const count = await prisma.user.count({
  where: { role: 'admin' },
});
```

### 搜索查询

```javascript
// 模糊搜索（不区分大小写）
const users = await prisma.user.findMany({
  where: {
    name: { contains: 'john', mode: 'insensitive' },
  },
});

// 多条件搜索
const users = await prisma.user.findMany({
  where: {
    OR: [
      { name: { contains: keyword, mode: 'insensitive' } },
      { email: { contains: keyword, mode: 'insensitive' } },
    ],
  },
});

// 范围查询
const users = await prisma.user.findMany({
  where: {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  },
});

// 数组包含
const roles = await prisma.role.findMany({
  where: {
    permission: { has: 'permission-id' },
  },
});
```

### 关联查询

```javascript
// 包含关联
const user = await prisma.user.findUnique({
  where: { id: 'user-id' },
  include: {
    accounts: true,
    sessions: true,
  },
});

// 选择特定字段
const user = await prisma.user.findUnique({
  where: { id: 'user-id' },
  select: {
    id: true,
    name: true,
    email: true,
  },
});
```

## 与 BaseDAO 集成

BaseDAO 已经封装了 Prisma 操作，直接使用即可：

```javascript
// 在 DAO 文件中
import { prisma } from '@/lib/database/prisma';

export async function getRoleById(id) {
  return await prisma.role.findUnique({
    where: { id },
  });
}

export async function createRole(data) {
  return await prisma.role.create({
    data: {
      id: generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}
```

## 生产环境部署

### 1. 设置环境变量

确保生产环境设置了正确的 `DATABASE_URL`。

### 2. 运行迁移

```bash
npx prisma migrate deploy
```

### 3. 生成 Prisma Client

```bash
npx prisma generate
```

### 4. 连接池配置（可选）

对于高并发场景，可以配置连接池：

```env
DATABASE_URL="postgresql://user:password@host:5432/db?schema=public&connection_limit=10&pool_timeout=20"
```

## 常见问题

### Q1: 连接失败

**检查项**:
1. PostgreSQL 服务是否运行
2. 连接字符串是否正确
3. 用户权限是否足够
4. 防火墙是否允许连接

### Q2: Schema 同步问题

```bash
# 重新生成 Client
npx prisma generate

# 如果仍有问题，重置数据库
npx prisma migrate reset
```

### Q3: 类型不匹配

确保 Prisma Schema 中的类型与代码中使用的类型一致。

### Q4: 性能优化

1. 为常用查询字段添加索引
2. 使用 `select` 只查询需要的字段
3. 使用分页避免大量数据查询

---

**文档版本**: v1.0.0  
**最后更新**: 2025-12-01

