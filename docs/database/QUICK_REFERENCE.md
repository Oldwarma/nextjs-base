# Database API 快速参考

快速参考卡片，方便开发时查阅。

---

## 🚀 快速开始

### 引入

```javascript
// 方式 1：按需引入
import { add, getOne, getList, getPage, update, del } from '@/lib/db-api';

// 方式 2：引入命名空间
import dbApi from '@/lib/db-api';

// 方式 3：引入全部
import * as dbApi from '@/lib/db-api';
```

---

## 📝 常用操作速查

### 增（Create）

```javascript
// 单条记录
const id = await add({
  dbName: 'users',
  dataJson: { name: 'John', email: 'john@example.com' },
});

// 批量记录
const ids = await adds({
  dbName: 'users',
  dataJson: [
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob', email: 'bob@example.com' },
  ],
});
```

### 删（Delete）

```javascript
// 根据 _id 删除
await del({ dbName: 'users', _id: '507f...' });

// 根据条件删除单条
await remove({
  dbName: 'users',
  whereJson: { email: 'john@example.com' },
});

// 批量删除
await delMany({
  dbName: 'users',
  whereJson: { role: 'guest' },
});
```

### 改（Update）

```javascript
// 根据 _id 修改
await update({
  dbName: 'users',
  _id: '507f...',
  dataJson: { name: 'John Updated' },
});

// 根据条件修改单条
await updateOne({
  dbName: 'users',
  whereJson: { email: 'john@example.com' },
  dataJson: { emailVerified: true },
});

// 批量修改
await updateMany({
  dbName: 'users',
  whereJson: { role: 'user' },
  dataJson: { status: 'active' },
});

// 字段自增/自减
await inc({
  dbName: 'users',
  whereJson: { _id: 'user123' },
  fieldName: 'credits',
  num: 100, // 正数增加，负数减少
});

// 数组添加元素
await push({
  dbName: 'posts',
  whereJson: { _id: 'post123' },
  fieldName: 'tags',
  value: 'javascript',
});

// 数组删除元素
await pull({
  dbName: 'posts',
  whereJson: { _id: 'post123' },
  fieldName: 'tags',
  value: 'outdated',
});
```

### 查（Read）

```javascript
// 根据 _id 查询
const user = await findById({
  dbName: 'users',
  _id: '507f...',
});

// 查询单条
const user = await getOne({
  dbName: 'users',
  whereJson: { email: 'john@example.com' },
});

// 查询列表（不分页）
const users = await getList({
  dbName: 'users',
  whereJson: { role: 'admin' },
  sortJson: { createdAt: -1 },
  limit: 10,
});

// 分页查询
const result = await getPage({
  dbName: 'users',
  whereJson: { role: 'user' },
  pageIndex: 1,
  pageSize: 20,
  sortJson: { createdAt: -1 },
});

// 连表分页查询
const result = await getPageWithLookup({
  dbName: 'orders',
  whereJson: { status: 'completed' },
  foreignDB: [
    {
      from: 'users',
      localField: 'userId',
      foreignField: '_id',
      as: 'userInfo',
      single: true,
    },
  ],
  pageIndex: 1,
  pageSize: 20,
});
```

---

## 📊 聚合统计

```javascript
// 统计数量
const total = await count({
  dbName: 'users',
  whereJson: { role: 'admin' },
});

// 求和
const totalRevenue = await sum({
  dbName: 'orders',
  fieldName: 'amount',
  whereJson: { status: 'paid' },
});

// 最大值
const maxPrice = await max({
  dbName: 'products',
  fieldName: 'price',
});

// 最小值
const minPrice = await min({
  dbName: 'products',
  fieldName: 'price',
});

// 平均值
const avgAge = await avg({
  dbName: 'users',
  fieldName: 'age',
});

// 随机取样
const randomPosts = await sample({
  dbName: 'posts',
  size: 5,
  whereJson: { status: 'published' },
});

// 去重
const categories = await distinct({
  dbName: 'posts',
  fieldName: 'category',
});

// 复杂聚合
const stats = await aggregate({
  dbName: 'orders',
  whereJson: { status: 'paid' },
  groupJson: {
    _id: '$userId',
    totalSpent: { $sum: '$amount' },
    orderCount: { $sum: 1 },
  },
});
```

---

## 🔧 工具方法

```javascript
// 检查记录是否存在
const exists = await exists({
  dbName: 'users',
  whereJson: { email: 'john@example.com' },
});
```

---

## 💡 常见模式

### 模式 1：检查唯一性

```javascript
// 检查邮箱是否已存在
const emailExists = await exists({
  dbName: 'users',
  whereJson: { email: userData.email },
});

if (emailExists) {
  return { success: false, error: 'Email already registered' };
}
```

### 模式 2：排除自己检查唯一性

```javascript
// 更新时排除自己
const emailExists = await exists({
  dbName: 'users',
  whereJson: {
    email: newEmail,
    _id: { $ne: userId },
  },
});
```

### 模式 3：条件查询

```javascript
const whereJson = { role: 'user' };

// 添加可选条件
if (search) {
  whereJson.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];
}

if (startDate || endDate) {
  whereJson.createdAt = {};
  if (startDate) whereJson.createdAt.$gte = new Date(startDate);
  if (endDate) whereJson.createdAt.$lte = new Date(endDate);
}

const result = await getPage({
  dbName: 'users',
  whereJson,
  pageIndex,
  pageSize,
});
```

### 模式 4：Server Action 模板

```javascript
'use server';

import { getOne, update } from '@/lib/db-api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function updateUserAction(updates) {
  // 1. 权限检查
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // 2. 验证数据
    if (!updates.name || updates.name.trim().length === 0) {
      return { success: false, error: 'Name is required' };
    }

    // 3. 执行操作
    await update({
      dbName: 'users',
      _id: session.user.id,
      dataJson: updates,
    });

    // 4. 返回结果
    return {
      success: true,
      message: 'Updated successfully',
    };
  } catch (error) {
    console.error('Update error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
```

---

## ⚙️ 高级用法

### 连表查询配置

```javascript
// 单条连表
{
  from: 'users',           // 要连接的集合
  localField: 'userId',    // 本地字段
  foreignField: '_id',     // 外键字段
  as: 'userInfo',          // 结果字段名
  single: true,            // 只取第一个（转为对象）
}

// 数组连表
{
  from: 'comments',
  localField: '_id',
  foreignField: 'postId',
  as: 'comments',
  single: false,           // 保持数组
}

// 提取特定字段
{
  from: 'users',
  localField: 'userId',
  foreignField: '_id',
  as: 'user',
  single: true,
  addFields: {              // 提取字段到顶层
    userName: 'name',
    userEmail: 'email',
  },
}
```

### 复杂查询条件

```javascript
// 多条件组合
const whereJson = {
  $and: [
    { role: 'user' },
    {
      $or: [
        { status: 'active' },
        { lastLoginAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      ],
    },
  ],
};

// 日期范围
const whereJson = {
  createdAt: {
    $gte: new Date('2024-01-01'),
    $lte: new Date('2024-12-31'),
  },
};

// 数组包含
const whereJson = {
  tags: { $in: ['javascript', 'typescript'] },
};

// 字段存在
const whereJson = {
  deletedAt: { $exists: false },
};
```

---

## 🎯 性能优化建议

### 1. 使用索引字段查询

```javascript
// ✅ 好：使用有索引的 email 字段
const user = await getOne({
  dbName: 'users',
  whereJson: { email: 'john@example.com' },
});

// ❌ 差：使用无索引的 bio 字段
const user = await getOne({
  dbName: 'users',
  whereJson: { bio: { $regex: 'developer' } },
});
```

### 2. 限制返回字段

```javascript
// ✅ 好：只查询需要的字段
const users = await getList({
  dbName: 'users',
  fieldJson: { name: 1, email: 1 },
});

// ❌ 差：返回所有字段
const users = await getList({ dbName: 'users' });
```

### 3. 使用批量操作

```javascript
// ✅ 好：批量更新
await updateMany({
  dbName: 'users',
  whereJson: { _id: { $in: userIds } },
  dataJson: { status: 'active' },
});

// ❌ 差：循环更新
for (const userId of userIds) {
  await update({
    dbName: 'users',
    _id: userId,
    dataJson: { status: 'active' },
  });
}
```

---

## 📚 参考文档

- [完整 API 文档](./DB_API_GUIDE.md)
- [实战示例](./DB_API_EXAMPLES.md)
- [与 BaseDAO 对比](./DB_API_VS_BASEDAO.md)
- [重构总结](./REFACTORING_SUMMARY.md)

---

## 🆘 常见问题

### Q: 如何处理 ObjectId？

A: 自动处理，无需手动转换：

```javascript
// 直接传入字符串 ID
const user = await findById({
  dbName: 'users',
  _id: '507f1f77bcf86cd799439011', // 字符串自动转 ObjectId
});

// 返回的 _id 自动转为字符串
console.log(user._id); // '507f1f77bcf86cd799439011'
```

### Q: 如何取消自动时间戳？

A: 使用 `cancelAddTime` 或 `cancelUpdateTime`：

```javascript
await add({
  dbName: 'configs',
  dataJson: { key: 'value' },
  cancelAddTime: true, // 不添加时间戳
});

await update({
  dbName: 'configs',
  _id: 'config001',
  dataJson: { value: 'new value' },
  cancelUpdateTime: true, // 不更新时间戳
});
```

### Q: 如何实现软删除？

A: 手动添加 deletedAt 字段：

```javascript
// 软删除
await update({
  dbName: 'users',
  _id: userId,
  dataJson: { deletedAt: new Date() },
});

// 查询时过滤
const users = await getList({
  dbName: 'users',
  whereJson: {
    $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
  },
});
```

如需自动软删除功能，建议使用 **BaseDAO**。

---

**快速参考版本**：v1.0.0
**最后更新**：2025-11-01

