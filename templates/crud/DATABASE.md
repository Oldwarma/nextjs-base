# 数据库设计指南

> PostgreSQL + Prisma ORM 最佳实践

---

## 🎯 设计原则

### 1. 主键策略

本项目使用 **UUID** 作为主键，而非自增 ID：

```prisma
model Example {
  id String @id @default(uuid())
  // ...
}
```

**优势：**
- 分布式友好，无需中心化 ID 生成
- 安全性更高，不暴露业务数据量
- 支持离线生成，客户端可预生成 ID
- 合并数据无冲突

### 2. 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 模型名 | PascalCase 单数 | `User`, `OrderItem` |
| 表名 | snake_case 复数 | `users`, `order_items` |
| 字段名 | camelCase | `createdAt`, `userId` |
| 数据库列名 | snake_case | `created_at`, `user_id` |

```prisma
model OrderItem {
  id        String   @id @default(uuid())
  orderId   String   @map("order_id")
  createdAt DateTime @default(now()) @map("created_at")
  
  @@map("order_items")
}
```

### 3. 软删除

所有业务表都应支持软删除：

```prisma
model Post {
  id        String    @id @default(uuid())
  // ... 业务字段
  
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?  // 软删除时间
  
  @@index([deletedAt])
  @@map("posts")
}
```

---

## 📋 标准表结构

### 基础模板

```prisma
model {ModelName} {
  // 主键
  id        String    @id @default(uuid())
  
  // 业务字段
  name      String
  status    String    @default("active")
  enable    Boolean   @default(true)
  sort      Int       @default(0)
  remark    String?
  
  // 关联字段
  userId    String?   @map("user_id")
  
  // 时间戳
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?
  
  // 关联关系
  user      User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  // 索引
  @@index([userId])
  @@index([status])
  @@index([enable])
  @@index([createdAt])
  @@index([deletedAt])
  @@map("{table_name}")
}
```

### 树形结构

```prisma
model Category {
  id        String     @id @default(uuid())
  name      String
  parentId  String?    @map("parent_id")
  sort      Int        @default(0)
  enable    Boolean    @default(true)
  
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  deletedAt DateTime?
  
  // 自关联
  parent    Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children  Category[] @relation("CategoryTree")
  
  @@index([parentId])
  @@index([sort])
  @@index([deletedAt])
  @@map("categories")
}
```

### 多对多关系

PostgreSQL + Prisma 推荐使用数组字段存储 ID：

```prisma
model Role {
  id          String   @id @default(uuid())
  name        String   @unique
  permission  String[] @default([])  // 权限 ID 数组
  menu        String[] @default([])  // 菜单 ID 数组
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("roles")
}

model User {
  id    String   @id @default(uuid())
  roles String[] @default([])  // 角色 ID 数组
  
  @@map("users")
}
```

**查询示例：**

```javascript
// 查找拥有某个角色的用户
const users = await prisma.user.findMany({
  where: { roles: { has: roleId } },
});

// 查找拥有多个角色的用户
const users = await prisma.user.findMany({
  where: { roles: { hasEvery: [roleId1, roleId2] } },
});

// 查找拥有任一角色的用户
const users = await prisma.user.findMany({
  where: { roles: { hasSome: [roleId1, roleId2] } },
});
```

---

## 🔢 字段类型映射

### 常用类型

| 业务类型 | Prisma 类型 | PostgreSQL 类型 | 说明 |
|---------|-------------|-----------------|------|
| ID | `String @id @default(uuid())` | `uuid` | UUID 主键 |
| 短文本 | `String` | `text` | 名称、标题 |
| 长文本 | `String` | `text` | 描述、内容 |
| 整数 | `Int` | `integer` | 数量、排序 |
| 金额 | `Decimal @db.Decimal(10, 2)` | `decimal(10,2)` | 精确金额 |
| 百分比 | `Decimal @db.Decimal(5, 2)` | `decimal(5,2)` | 折扣率 |
| 布尔 | `Boolean` | `boolean` | 开关状态 |
| 日期时间 | `DateTime` | `timestamp` | 时间戳 |
| JSON | `Json` | `jsonb` | 复杂数据 |
| 数组 | `String[]` | `text[]` | ID 数组 |

### 金额处理

```prisma
model Order {
  id          String   @id @default(uuid())
  totalAmount Decimal  @db.Decimal(10, 2) @map("total_amount")
  discount    Decimal? @db.Decimal(5, 2)
  
  @@map("orders")
}
```

**注意：** Prisma 的 Decimal 类型返回的是 `Decimal` 对象，需要序列化：

```javascript
// BaseDAO 已自动处理，如果手动查询需要：
const order = await prisma.order.findUnique({ where: { id } });
const totalAmount = order.totalAmount.toNumber();  // 转为 number
```

---

## 🔗 关联查询

### Prisma Include

```javascript
// 简单关联
const users = await prisma.user.findMany({
  include: {
    sessions: true,
    accounts: true,
  },
});

// 嵌套关联
const orders = await prisma.order.findMany({
  include: {
    user: true,
    items: {
      include: {
        product: true,
      },
    },
  },
});
```

### selects 连表查询

对于数组字段关联（如 `roles: String[]`），使用 `selects`：

```javascript
import { selects } from '@/lib/database/selects';

const result = await selects({
  dbName: 'users',
  pageIndex: 1,
  pageSize: 20,
  foreignDB: [
    {
      dbName: 'roles',
      localKey: 'roles',      // User.roles 数组
      foreignKey: 'id',       // Role.id
      as: 'roleList',         // 结果字段名
      type: 'array',          // 一对多
    },
  ],
  getCount: true,
});

// 结果：
// {
//   data: [
//     {
//       id: 'user-1',
//       roles: ['role-1', 'role-2'],
//       roleList: [
//         { id: 'role-1', name: 'Admin' },
//         { id: 'role-2', name: 'Editor' },
//       ],
//     },
//   ],
//   total: 100,
// }
```

### BaseDAO 配置连表

```javascript
const userConfig = {
  modelName: 'user',
  tableName: 'users',
  
  query: {
    foreignDB: [
      {
        dbName: 'roles',
        localKey: 'roles',
        foreignKey: 'id',
        as: 'roleList',
        type: 'array',
      },
    ],
  },
};
```

---

## 📝 迁移流程

### 1. 修改 Schema

```prisma
// prisma/schema.prisma
model NewModel {
  id   String @id @default(uuid())
  name String
  // ...
}
```

### 2. 创建迁移

```bash
# 开发环境
npx prisma migrate dev --name add_new_model

# 生产环境（只应用迁移，不创建新迁移）
npx prisma migrate deploy
```

### 3. 重新生成客户端

```bash
npx prisma generate
```

### 4. 常用命令

```bash
# 查看迁移状态
npx prisma migrate status

# 重置数据库（开发环境）
npx prisma migrate reset

# 查看 SQL（不执行）
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma

# 打开数据库 GUI
npx prisma studio
```

---

## 🔍 查询优化

### 索引策略

```prisma
model Post {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  status    String
  category  String
  createdAt DateTime @default(now())
  deletedAt DateTime?
  
  // 单字段索引
  @@index([userId])
  @@index([status])
  @@index([category])
  @@index([createdAt])
  @@index([deletedAt])
  
  // 复合索引（常用查询组合）
  @@index([status, category])
  @@index([userId, status])
  @@index([deletedAt, status])
  
  @@map("posts")
}
```

### 分页查询

```javascript
// 推荐：使用 skip + take
const result = await prisma.post.findMany({
  where: { deletedAt: null },
  orderBy: { createdAt: 'desc' },
  skip: (pageIndex - 1) * pageSize,
  take: pageSize,
});

// 获取总数
const total = await prisma.post.count({
  where: { deletedAt: null },
});
```

### 选择字段

```javascript
// 只查询需要的字段
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
  },
});
```

---

## 🛡️ 数据安全

### 1. 敏感数据处理

```prisma
model User {
  id       String  @id @default(uuid())
  email    String  @unique
  password String  // 存储加密后的密码
  
  @@map("users")
}
```

**查询时排除敏感字段：**

```javascript
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    name: true,
    // 不包含 password
  },
});
```

### 2. 事务处理

```javascript
// 使用事务确保数据一致性
const result = await prisma.$transaction(async (tx) => {
  // 扣减库存
  const product = await tx.product.update({
    where: { id: productId },
    data: { stock: { decrement: quantity } },
  });
  
  // 创建订单
  const order = await tx.order.create({
    data: {
      userId,
      productId,
      quantity,
      totalAmount,
    },
  });
  
  return order;
});
```

### 3. 并发控制

```javascript
// 乐观锁
const result = await prisma.product.updateMany({
  where: {
    id: productId,
    version: currentVersion,  // 版本号
  },
  data: {
    stock: newStock,
    version: { increment: 1 },
  },
});

if (result.count === 0) {
  throw new Error('Concurrent modification detected');
}
```

---

## 📚 示例 Schema

### 完整的电商模型

```prisma
// 商品
model Product {
  id          String    @id @default(uuid())
  name        String
  description String?
  price       Decimal   @db.Decimal(10, 2)
  stock       Int       @default(0)
  category    String?
  images      String[]  @default([])
  enable      Boolean   @default(true)
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  
  orderItems  OrderItem[]
  
  @@index([category])
  @@index([enable])
  @@index([deletedAt])
  @@map("products")
}

// 订单
model Order {
  id          String      @id @default(uuid())
  orderNo     String      @unique @map("order_no")
  userId      String      @map("user_id")
  status      String      @default("pending")
  totalAmount Decimal     @db.Decimal(10, 2) @map("total_amount")
  discount    Decimal?    @db.Decimal(10, 2)
  remark      String?
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  deletedAt   DateTime?
  
  user        User        @relation(fields: [userId], references: [id])
  items       OrderItem[]
  
  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@index([deletedAt])
  @@map("orders")
}

// 订单项
model OrderItem {
  id        String   @id @default(uuid())
  orderId   String   @map("order_id")
  productId String   @map("product_id")
  quantity  Int
  price     Decimal  @db.Decimal(10, 2)
  
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id])
  
  @@index([orderId])
  @@index([productId])
  @@map("order_items")
}
```

---

## ✅ 检查清单

创建新表时，确保：

- [ ] 使用 UUID 作为主键
- [ ] 添加 `createdAt`、`updatedAt` 时间戳
- [ ] 业务表添加 `deletedAt` 软删除字段
- [ ] 使用 `@@map` 指定表名（snake_case 复数）
- [ ] 使用 `@map` 映射列名（snake_case）
- [ ] 为常用查询字段添加索引
- [ ] 为外键字段添加索引
- [ ] 为 `deletedAt` 添加索引
- [ ] 金额字段使用 `Decimal`
- [ ] 数组关联使用 `String[]`

