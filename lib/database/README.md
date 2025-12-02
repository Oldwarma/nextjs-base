# 数据库访问层

Prisma ORM 连接管理和统一数据库 API。

## 📁 文件列表

| 文件 | 说明 |
|------|------|
| `prisma.js` | Prisma Client 单例 - 连接池管理 |
| `selects.js` | 万能连表查询工具 - 支持数组字段关联 |

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

### 与 Prisma 原生 API 对比

| 场景 | Prisma 原生 | selects |
|------|-------------|---------|
| 数组字段关联 | ❌ 不支持 | ✅ 支持 |
| 普通外键关联 | ✅ include | ✅ 支持 |
| 无中间表多对多 | ❌ 需要中间表 | ✅ 直接用数组 |
| 类型安全 | ✅ 完整 | ⚠️ 部分（原生 SQL）|

### 注意事项

1. **表名映射**：可以使用 Model 名称（如 `user`）或数据库表名（如 `users`）
2. **软删除**：自动过滤 `deletedAt IS NOT NULL` 的记录
3. **性能**：使用 PostgreSQL 子查询，一次 SQL 完成连表
4. **字段选择**：`fieldJson` 可以指定只返回需要的字段

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
- [PostgreSQL 配置指南](../../docs/database/POSTGRESQL_SETUP.md)
- [vk-unicloud selects 参考](https://vkdoc.fsq.pub/client/uniCloud/db/selects.html)
