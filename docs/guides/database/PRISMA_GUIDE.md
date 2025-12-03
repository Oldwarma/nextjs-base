# Prisma 开发指南

<div align="center">

**PostgreSQL + Prisma 数据库设计和操作**

[Schema 设计](#-schema-设计) · [常用操作](#-常用操作) · [最佳实践](#-最佳实践)

</div>

---

## 🎯 概述

NextJS Base 使用 **PostgreSQL** 作为数据库，**Prisma** 作为 ORM。本指南介绍如何设计数据模型和执行数据库操作。

### 技术栈

| 组件 | 版本 | 说明 |
|:---|:---|:---|
| PostgreSQL | 16+ | 关系型数据库 |
| Prisma | 5.x | 类型安全的 ORM |
| Prisma Client | 自动生成 | 数据库客户端 |

---

## 📐 Schema 设计

### 文件位置

```
prisma/
└── schema.prisma    # 数据模型定义
```

### 基础结构

```prisma
// 生成器配置
generator client {
  provider = "prisma-client-js"
  output   = "../lib/generated/prisma"
}

// 数据源配置
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 数据模型
model User {
  id    String @id @default(cuid())
  email String @unique
  name  String?
  // ...
}
```

### 常用字段类型

| Prisma 类型 | PostgreSQL 类型 | 说明 |
|:---|:---|:---|
| `String` | `TEXT` | 文本 |
| `Int` | `INTEGER` | 整数 |
| `Float` | `DOUBLE PRECISION` | 浮点数 |
| `Decimal` | `DECIMAL` | 精确小数 |
| `Boolean` | `BOOLEAN` | 布尔值 |
| `DateTime` | `TIMESTAMP` | 日期时间 |
| `Json` | `JSONB` | JSON 数据 |
| `String[]` | `TEXT[]` | 字符串数组 |

### 常用属性

```prisma
model Example {
  // 主键
  id        String    @id @default(cuid())
  
  // 唯一约束
  email     String    @unique
  
  // 默认值
  enable    Boolean   @default(true)
  sort      Int       @default(0)
  
  // 可选字段
  remark    String?
  
  // 数组字段
  tags      String[]  @default([])
  
  // 长文本
  content   String    @db.Text
  
  // 精确小数
  price     Decimal   @db.Decimal(10, 2)
  
  // 时间戳
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  // 软删除
  deletedAt DateTime?
  
  // 索引
  @@index([createdAt])
  @@index([enable, sort])
}
```

---

## 📝 模型设计示例

### 示例：文章模型

```prisma
model Post {
  id          String    @id @default(cuid())
  
  // 基础信息
  title       String                        // 标题
  slug        String    @unique             // URL 别名
  content     String    @db.Text            // 内容（Markdown）
  excerpt     String?                       // 摘要
  cover       String?                       // 封面图
  
  // 分类和标签
  categoryId  String?                       // 分类 ID
  tags        String[]  @default([])        // 标签数组
  
  // 状态
  status      String    @default("draft")   // draft/published/archived
  enable      Boolean   @default(true)
  
  // 统计
  viewCount   Int       @default(0)
  likeCount   Int       @default(0)
  
  // 作者
  authorId    String
  
  // SEO
  metaTitle       String?
  metaDescription String?
  metaKeywords    String?
  
  // 时间
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  
  // 索引
  @@index([status, enable])
  @@index([authorId])
  @@index([categoryId])
  @@index([publishedAt])
}
```

### 示例：分类模型（树形结构）

```prisma
model Category {
  id        String    @id @default(cuid())
  
  name      String                        // 分类名称
  slug      String    @unique             // URL 别名
  parentId  String?                       // 父级 ID（支持树形）
  
  icon      String?                       // 图标
  cover     String?                       // 封面
  
  sort      Int       @default(0)
  enable    Boolean   @default(true)
  remark    String?
  
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  @@index([parentId])
  @@index([enable, sort])
}
```

---

## 🔧 常用操作

### 数据库迁移

```bash
# 创建迁移（开发环境）
npx prisma migrate dev --name add_post_model

# 应用迁移（生产环境）
npx prisma migrate deploy

# 重置数据库（会删除所有数据）
npx prisma migrate reset

# 生成 Prisma Client
npx prisma generate
```

### 基础查询

```javascript
import { prisma } from '@/lib/database/prisma'

// 查询单条
const user = await prisma.user.findUnique({
  where: { id: 'xxx' }
})

// 查询单条（多条件）
const user = await prisma.user.findFirst({
  where: { email: 'test@example.com', enable: true }
})

// 查询列表
const users = await prisma.user.findMany({
  where: { enable: true },
  orderBy: { createdAt: 'desc' },
  take: 10,
  skip: 0,
})

// 查询总数
const count = await prisma.user.count({
  where: { enable: true }
})
```

### 创建和更新

```javascript
// 创建单条
const user = await prisma.user.create({
  data: {
    email: 'test@example.com',
    name: '测试用户',
  }
})

// 创建多条
const users = await prisma.user.createMany({
  data: [
    { email: 'user1@example.com', name: '用户1' },
    { email: 'user2@example.com', name: '用户2' },
  ]
})

// 更新单条
const user = await prisma.user.update({
  where: { id: 'xxx' },
  data: { name: '新名称' }
})

// 更新多条
const result = await prisma.user.updateMany({
  where: { enable: false },
  data: { enable: true }
})
```

### 删除操作

```javascript
// 删除单条
await prisma.user.delete({
  where: { id: 'xxx' }
})

// 删除多条
await prisma.user.deleteMany({
  where: { enable: false }
})

// 软删除（推荐）
await prisma.user.update({
  where: { id: 'xxx' },
  data: { deletedAt: new Date() }
})
```

### 高级查询

```javascript
// 模糊搜索
const users = await prisma.user.findMany({
  where: {
    name: { contains: '张' }
  }
})

// 范围查询
const posts = await prisma.post.findMany({
  where: {
    createdAt: {
      gte: new Date('2024-01-01'),
      lte: new Date('2024-12-31'),
    }
  }
})

// 数组包含
const posts = await prisma.post.findMany({
  where: {
    tags: { has: 'javascript' }
  }
})

// OR 条件
const users = await prisma.user.findMany({
  where: {
    OR: [
      { name: { contains: '张' } },
      { email: { contains: 'zhang' } },
    ]
  }
})

// 关联查询
const posts = await prisma.post.findMany({
  include: {
    author: true,
    category: true,
  }
})
```

---

## 🏗️ 与 BaseDAO 集成

### BaseDAO 配置

```javascript
const postConfig = {
  modelName: 'post',
  primaryKey: 'id',
  softDelete: true,
  
  fields: {
    creatable: ['title', 'slug', 'content', 'categoryId', 'tags', 'status'],
    updatable: ['title', 'slug', 'content', 'categoryId', 'tags', 'status'],
    searchable: ['title', 'content', 'tags'],
  },
  
  query: {
    defaultSort: { createdAt: 'desc' },
    defaultPageSize: 20,
  },
}
```

### 搜索条件转换

BaseDAO 会自动将 `whereJson` 转换为 Prisma 查询条件：

```javascript
// 前端传入的 whereJson
{
  title: { contains: '教程' },
  status: 'published',
  createdAt: {
    gte: '2024-01-01',
    lte: '2024-12-31'
  }
}

// BaseDAO 转换后的 Prisma where
{
  AND: [
    { title: { contains: '教程' } },
    { status: 'published' },
    { createdAt: { gte: new Date('2024-01-01'), lte: new Date('2024-12-31') } },
    { deletedAt: null }  // 软删除过滤
  ]
}
```

---

## ✅ 最佳实践

### 1. 命名规范

| 类型 | 规范 | 示例 |
|:---|:---|:---|
| 模型名 | PascalCase，单数 | `User`, `Post`, `Category` |
| 字段名 | camelCase | `createdAt`, `userId`, `isPublished` |
| 表名 | 自动转换为 snake_case | `users`, `posts`, `categories` |

### 2. 必备字段

```prisma
model Example {
  id        String    @id @default(cuid())  // 主键
  createdAt DateTime  @default(now())       // 创建时间
  updatedAt DateTime  @updatedAt            // 更新时间
  deletedAt DateTime?                       // 软删除（推荐）
}
```

### 3. 使用索引

```prisma
model Post {
  // ...字段定义
  
  // 单字段索引
  @@index([createdAt])
  
  // 复合索引（常用查询条件）
  @@index([status, enable, createdAt])
  
  // 外键索引
  @@index([authorId])
  @@index([categoryId])
}
```

### 4. 软删除

```prisma
model Post {
  // ...
  deletedAt DateTime?  // 软删除字段
}
```

```javascript
// BaseDAO 自动处理软删除
const postConfig = {
  softDelete: true,  // 启用软删除
  // ...
}

// 查询时自动过滤已删除记录
// 删除时自动设置 deletedAt 而非物理删除
```

### 5. 数组字段

```prisma
model Post {
  tags String[] @default([])  // 标签数组
}
```

```javascript
// 查询包含特定标签的文章
await prisma.post.findMany({
  where: {
    tags: { has: 'javascript' }
  }
})

// 查询包含多个标签的文章
await prisma.post.findMany({
  where: {
    tags: { hasEvery: ['javascript', 'react'] }
  }
})
```

---

## 📚 相关文档

| 文档 | 说明 |
|:---|:---|
| [Prisma 官方文档](https://www.prisma.io/docs) | 官方完整文档 |
| [BaseDAO API](../../api/BASE_DAO.md) | 数据访问对象 API |
| [Server Actions 开发](../admin/SERVER_ACTIONS.md) | Actions 开发指南 |
| [数据库设计模板](../../../templates/crud/DATABASE.md) | 数据库设计规范 |

---

<div align="center">

[← 返回开发指南](../README.md) · [SmartCrudPage 指南 →](../admin/SMART_CRUD.md)

</div>

