# 数据库访问层

MongoDB 连接管理和统一数据库 API。

## 📁 文件列表

| 文件 | 说明 |
|------|------|
| `mongodb.js` | MongoDB 核心 - 连接池、集合获取、ObjectId 处理 |
| `db-api.js` | 统一 DB API - 封装所有数据库操作（CRUD、分页、连表） |

## 🎯 使用方式

### 低层级 API (mongodb.js)

```javascript
import { getCollection, fromObjectId, toObjectId, generateId } from '@/lib/database/mongodb';

// 获取集合
const usersCollection = await getCollection('users');

// 执行原生 MongoDB 操作
const user = await usersCollection.findOne({ _id: toObjectId(id) });

// ObjectId 转换
const stringId = fromObjectId(user._id); // ObjectId -> String
const objectId = toObjectId(stringId);   // String -> ObjectId

// 生成 UUID
const newId = generateId(); // 用于 roles, menus, permissions 等
```

### 高层级 API (db-api.js) ⭐️ 推荐

```javascript
import { selects, add, updateOne, remove } from '@/lib/database/db-api';

// 查询（支持分页、排序、搜索、连表）
const { data, total } = await selects({
    dbName: 'users',
    whereJson: { email: 'test@example.com' },
    pageIndex: 1,
    pageSize: 20,
    sortJson: { createdAt: -1 },
    getCount: true,
    foreignDB: [
        {
            dbName: 'roles',
            localKey: 'roles',      // users.roles (数组)
            foreignKey: 'id',       // roles.id (UUID)
            as: 'roleList',
            fieldJson: { id: 1, name: 1 },
        },
    ],
});

// 插入
const result = await add({
    dbName: 'users',
    dataJson: { name: 'John', email: 'john@example.com' },
});

// 更新
await updateOne({
    dbName: 'users',
    whereJson: { id: userId },
    dataJson: { name: 'Jane' },
});

// 删除
await remove({
    dbName: 'users',
    whereJson: { id: userId },
});
```

## 🔑 核心特性

### 1. 统一查询接口 (`selects`)

- ✅ 分页查询
- ✅ 排序
- ✅ 搜索过滤
- ✅ 连表查询 (foreignDB)
- ✅ 字段投影
- ✅ 总数统计

### 2. ObjectId 自动处理

- `_id` 字段自动转换为 ObjectId
- `id` 字段保持 String (UUID)
- `fromObjectId()` 统一转换为字符串

### 3. 连表查询 (foreignDB)

支持复杂的多表关联：

```javascript
foreignDB: [
    {
        dbName: 'roles',          // 目标表
        localKey: 'roles',        // 本表字段（可以是数组）
        foreignKey: 'id',         // 目标表字段
        as: 'roleList',           // 结果字段名
        limit: 1,                 // 限制返回数量（可选）
        whereJson: { enable: true }, // 额外过滤条件
        fieldJson: { id: 1, name: 1 }, // 字段投影
        sortJson: { order: 1 },   // 排序
    },
]
```

## 📖 相关文档

- [DB API 使用指南](../../docs/database/DB_API_GUIDE.md)
- [DB API 示例集合](../../docs/database/DB_API_EXAMPLES.md)
- [DB API vs BaseDAO](../../docs/database/DB_API_VS_BASEDAO.md)
- [ForeignDB 连表指南](../../docs/database/FOREIGNDB_JOIN_GUIDE.md)
- [快速参考](../../docs/database/QUICK_REFERENCE.md)

## 🔗 依赖关系

- MongoDB Node.js Driver
- 环境变量：`MONGODB_URI`

