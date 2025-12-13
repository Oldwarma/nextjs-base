# 数据库访问层

Prisma ORM 连接管理和统一数据库 API。

## 📁 文件列表

| 文件 | 说明 |
|------|------|
| `prisma.js` | Prisma Client 单例 - 连接池管理 |
| `selects.js` | 万能连表查询工具 - 支持数组字段关联 |

> **注意**：UUID 生成已统一使用 `nb.pubfn.uuid()`，详见 [lib/function/README.md](../function/README.md)

## 🔄 Schema 变更指南

当需要新增列或新增表时，按以下步骤操作：

### 步骤概览

```bash
# 1. 修改 Schema
# 2. 同步到数据库
bun run db:push

# 3. 重新生成 Prisma Client
bun run db:generate

# 4. 重启开发服务器（如果正在运行）
```

### 详细步骤

#### 1️⃣ 修改 Schema 文件

编辑 `prisma/schema.prisma`，添加新的列或表：

```prisma
// 新增列示例
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  nickname  String?                        // ← 新增列
  // ...
}

// 新增表示例
model Category {
  id          String    @id @default(uuid())
  name        String
  description String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@map("categories")                      // 指定数据库表名
}
```

#### 2️⃣ 同步到数据库

```bash
bun run db:push
```

这会：
- 比对 Schema 与数据库差异
- 自动应用变更（新增列、新增表、新增索引等）
- **不会删除数据**（除非删除了列或表）

#### 3️⃣ 重新生成 Prisma Client

```bash
bun run db:generate
```

这会：
- 根据最新 Schema 生成 TypeScript 类型
- 更新 `lib/generated/prisma/` 目录下的文件
- 使代码中可以使用新的字段和模型

#### 4️⃣ 重启开发服务器

如果开发服务器正在运行，需要重启以加载新的 Prisma Client：

```bash
# Ctrl+C 停止后重新启动
bun dev
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `bun run db:push` | 同步 Schema 到数据库（开发环境推荐） |
| `bun run db:generate` | 重新生成 Prisma Client |
| `bun run db:migrate` | 创建迁移文件并应用（生产环境推荐） |
| `bun run db:studio` | 打开 Prisma Studio 可视化管理数据库 |
| `bun run db:init` | 初始化数据库（运行初始化脚本） |

### db:push vs db:migrate

| 特性 | db:push | db:migrate |
|------|---------|------------|
| 适用场景 | 开发环境、快速迭代 | 生产环境、版本控制 |
| 迁移文件 | ❌ 不生成 | ✅ 生成 SQL 文件 |
| 可回滚 | ❌ 不支持 | ✅ 支持 |
| 团队协作 | ⚠️ 需要手动同步 | ✅ 通过 Git 同步 |
| 数据安全 | ⚠️ 可能丢失数据 | ✅ 更可控 |

**推荐**：
- 本地开发使用 `db:push`，快速迭代
- 上线前使用 `db:migrate` 生成迁移文件，确保可追溯

### Schema 编写规范

```prisma
/// 表注释 - 使用三斜杠
model Example {
  id          String    @id @default(uuid())     // 主键统一使用 UUID
  
  // 基础字段
  name        String                              // 必填字符串
  remark      String?                             // 可选字符串
  status      String    @default("active")        // 带默认值
  
  // 数值字段
  order       Int       @default(0)               // 整数
  price       Decimal?  @db.Decimal(10, 2)        // 精确小数
  
  // 布尔字段
  enable      Boolean   @default(true)
  
  // 数组字段（PostgreSQL 原生支持）
  tags        String[]  @default([])              // 字符串数组
  
  // JSON 字段
  metadata    Json?                               // JSON 对象
  
  // 时间戳（标准三件套）
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?                           // 软删除
  
  // 索引
  @@index([status])
  @@index([createdAt])
  @@index([deletedAt])
  @@map("examples")                               // 数据库表名（小写复数）
}
```

### 注意事项

1. **字段命名**：Schema 中使用 camelCase，通过 `@map` 映射到 snake_case
2. **表名映射**：使用 `@@map("table_name")` 指定数据库表名
3. **软删除**：需要软删除的表添加 `deletedAt DateTime?` 字段
4. **索引**：为常用查询条件添加索引，提升性能
5. **关联字段**：使用数组存储关联 ID（如 `roles String[] @default([])`）

## 🎯 万能连表查询 selects

参考 [vk-unicloud selects](https://vkdoc.fsq.pub/client/uniCloud/db/selects.html) 设计，解决 Prisma 对数组字段关联支持不足的问题。

### 核心特性

- ✅ **数组字段关联**：`User.roles[]` → `Role.id`（无需中间表）
- ✅ **普通外键关联**：`Post.userId` → `User.id`
- ✅ **一对一/一对多**：自动处理关系类型
- ✅ **分页排序过滤**：完整的查询能力
- ✅ **PostgreSQL 原生**：利用 `ANY`、`json_agg` 等特性

### 基本用法

```javascript
import { selects, selectOne } from '@/lib/database/selects';

// 查询用户列表，连表获取角色信息
const result = await selects({
  dbName: 'user',              // 主表名
  pageIndex: 1,                // 页码（从 1 开始）
  pageSize: 20,                // 每页数量
  whereJson: {                 // 查询条件
    banned: false,
    email: { contains: '@gmail.com' },
  },
  sortArr: [                   // 排序
    { name: 'createdAt', type: 'desc' }
  ],
  foreignDB: [                 // 副表配置
    {
      dbName: 'role',          // 副表名
      localKey: 'roles',       // 主表字段（存储外键的数组）
      foreignKey: 'id',        // 副表字段
      as: 'roleList',          // 结果字段名
      type: 'array',           // 关系类型
      fieldJson: {             // 副表字段选择
        id: true,
        name: true,
        enable: true
      },
    }
  ]
});

// 返回结果
// {
//   data: [
//     {
//       id: 'xxx',
//       email: 'test@gmail.com',
//       roles: ['role1', 'role2'],
//       roleList: [
//         { id: 'role1', name: 'Admin', enable: true },
//         { id: 'role2', name: 'Editor', enable: true }
//       ]
//     }
//   ],
//   total: 100,
//   pageIndex: 1,
//   pageSize: 20
// }
```

### 关系类型

| type | 说明 | 示例 |
|------|------|------|
| `array` | 主表字段是数组，存储副表 ID | `User.roles[]` → `Role.id` |
| `one` | 一对一，主表存储副表 ID | `Post.userId` → `User.id` |
| `many` | 一对多，副表存储主表 ID | `User.id` ← `Post.userId` |

### 查询条件 whereJson

```javascript
// 精确匹配
whereJson: { status: 'active' }

// 模糊搜索
whereJson: { name: { contains: '张' } }

// 范围查询
whereJson: { 
  price: { gte: 100, lte: 500 } 
}

// 数组包含（任意一个）
whereJson: { 
  roles: { hasSome: ['admin', 'editor'] } 
}

// 数组包含（全部）
whereJson: { 
  tags: { hasEvery: ['hot', 'new'] } 
}

// IN 查询
whereJson: { 
  status: { in: ['active', 'pending'] } 
}
```

### 场景示例

#### 场景1：用户列表 + 角色信息

```javascript
const result = await selects({
  dbName: 'user',
  pageIndex: 1,
  pageSize: 20,
  whereJson: { banned: false },
  foreignDB: [
    {
      dbName: 'role',
      localKey: 'roles',
      foreignKey: 'id',
      as: 'roleList',
      type: 'array',
      fieldJson: { id: true, name: true },
    }
  ]
});
```

#### 场景2：文章列表 + 作者信息

```javascript
const result = await selects({
  dbName: 'post',
  pageIndex: 1,
  pageSize: 10,
  whereJson: { status: 'published' },
  foreignDB: [
    {
      dbName: 'user',
      localKey: 'userId',
      foreignKey: 'id',
      as: 'author',
      type: 'one',
      fieldJson: { id: true, name: true, avatar: true },
    }
  ]
});
```

#### 场景3：角色详情 + 权限列表 + 菜单列表

```javascript
const role = await selectOne({
  dbName: 'role',
  whereJson: { id: roleId },
  foreignDB: [
    {
      dbName: 'permission',
      localKey: 'permission',
      foreignKey: 'id',
      as: 'permissionList',
      type: 'array',
    },
    {
      dbName: 'menu',
      localKey: 'menu',
      foreignKey: 'id',
      as: 'menuList',
      type: 'array',
    }
  ]
});
```

#### 场景4：用户详情 + 所有文章

```javascript
const user = await selectOne({
  dbName: 'user',
  whereJson: { id: userId },
  foreignDB: [
    {
      dbName: 'post',
      localKey: 'id',
      foreignKey: 'userId',
      as: 'posts',
      type: 'many',
      limit: 50,
      whereJson: { status: 'published' },
    }
  ]
});
```

### 安全建议：自动白名单思路

开源场景表结构多变，推荐用“自动白名单”降低注入风险且无需手工维护：
- 生成来源：从 `prisma/schema.prisma` 或数据库元信息读取表/列，生成 `{ tableName: [columns] }` 映射（如写入 `lib/generated/table-map.json`）。
- 生成时机：在 `prisma generate` 后跑脚本生成；若缺失文件，服务启动或首次调用时懒加载一次元信息缓存到内存。
- 运行时校验：`selects` 收到表/列名先查映射，未命中则拒绝；参数仍走占位符。
- 可配置：支持限定 schema/prefix；提供显式逃生舱（如 `selectsUnsafe: true`）并在文档标注风险。
- 测试：构造不存在的表/列应抛错，存在的应通过，覆盖 foreignDB/排序/分页。

### 与 Prisma 原生 API 对比

| 场景 | Prisma 原生 | selects |
|------|-------------|---------|
| 数组字段关联 | ❌ 不支持 | ✅ 支持 |
| 普通外键关联 | ✅ include | ✅ 支持 |
| 无中间表多对多 | ❌ 需要中间表 | ✅ 直接用数组 |
| 类型安全 | ✅ 完整 | ⚠️ 部分（原生 SQL）|

### 注意事项

1. **表名**：使用数据库实际表名（如 `users`、`roles`）
2. **字段名**：使用数据库实际列名（如 `user_id`、`created_at`）
3. **软删除**：自动过滤 `deletedAt IS NOT NULL` 的记录
4. **性能**：使用 PostgreSQL 子查询，一次 SQL 完成连表
5. **字段选择**：`fieldJson` 可以指定只返回需要的字段

---

## 🔑 Prisma Client 基础用法

### 查询单条记录

```javascript
import { prisma } from '@/lib/database/prisma';

const user = await prisma.user.findUnique({
  where: { id: userId },
});
```

### 查询多条记录

```javascript
const users = await prisma.user.findMany({
  where: { status: 'active' },
  orderBy: { createdAt: 'desc' },
  skip: 0,
  take: 20,
});
```

### 创建记录

```javascript
const newUser = await prisma.user.create({
  data: { name: 'John', email: 'john@example.com' },
});
```

### 更新记录

```javascript
await prisma.user.update({
  where: { id: userId },
  data: { name: 'Jane' },
});
```

### 删除记录

```javascript
await prisma.user.delete({
  where: { id: userId },
});
```

### 事务支持

```javascript
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  await tx.profile.create({ data: { userId: user.id, ...profileData } });
  return user;
});
```

## 📖 相关文档

- [Prisma 官方文档](https://www.prisma.io/docs)
- [数据库实践指南](https://nextjsbase.com/zh/docs/admin/database/PRISMA_GUIDE)
- [vk-unicloud selects 参考](https://vkdoc.fsq.pub/client/uniCloud/db/selects.html)
