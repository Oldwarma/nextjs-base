# 数据库访问层

Prisma ORM 连接管理和统一数据库 API。

## 📁 文件列表

| 文件 | 说明 |
|------|------|
| `prisma.js` | Prisma Client 单例 - 连接池管理 |

## 🎯 使用方式

### Prisma Client（推荐）

```javascript
import { prisma } from '@/lib/database/prisma';

// 查询单条记录
const user = await prisma.user.findUnique({
  where: { id: userId },
});

// 查询多条记录
const users = await prisma.user.findMany({
  where: { status: 'active' },
  orderBy: { createdAt: 'desc' },
  skip: 0,
  take: 20,
});

// 创建记录
const newUser = await prisma.user.create({
  data: { name: 'John', email: 'john@example.com' },
});

// 更新记录
await prisma.user.update({
  where: { id: userId },
  data: { name: 'Jane' },
});

// 删除记录
await prisma.user.delete({
  where: { id: userId },
});

// 统计数量
const count = await prisma.user.count({
  where: { status: 'active' },
});
```

### 关联查询

```javascript
// 使用 include 加载关联数据
const userWithRoles = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    roles: true,
    posts: {
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    },
  },
});

// 使用 select 选择特定字段
const userBasic = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    name: true,
    email: true,
  },
});
```

## 🔑 核心特性

### 1. 类型安全

- 自动生成 TypeScript 类型
- 编译时检查查询错误
- IDE 自动补全支持

### 2. 关联查询

- `include` - 加载关联数据
- `select` - 选择特定字段
- 嵌套过滤和排序

### 3. 事务支持

```javascript
// 交互式事务
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  await tx.profile.create({ data: { userId: user.id, ...profileData } });
  return user;
});
```

## 📖 相关文档

- [Prisma 官方文档](https://www.prisma.io/docs)
- [PostgreSQL 配置指南](../../docs/database/POSTGRESQL_SETUP.md)

## 🔗 依赖关系

- Prisma ORM
- 环境变量：`DATABASE_URL`

