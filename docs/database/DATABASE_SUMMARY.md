# 数据库 API 系统总结

## 📚 概述

我们为项目创建了一套完整的数据库操作 API 系统，包括：

1. **DB API** (`lib/db-api.js`) - 统一的数据库操作接口
2. **BaseDAO** (`app/(admin)/actions/dao/base.js`) - 配置化的 CRUD 系统
3. **完整文档** - 使用指南、实战示例、对比分析

---

## 🎯 核心价值

### 统一写法

**之前**：每个人用不同的方式写数据库操作
```javascript
// 开发者 A
const collection = await getCollection('users');
const user = await collection.findOne({ email });

// 开发者 B
const db = await connectToDatabase();
const user = await db.collection('users').findOne({ email });
```

**现在**：统一使用 DB API
```javascript
import { getOne } from '@/lib/db-api';

const user = await getOne({
	dbName: 'users',
	whereJson: { email },
});
```

---

### 高可复用性

**之前**：重复写相似的代码
```javascript
// 查询用户
const usersCollection = await getCollection('users');
const user = await usersCollection.findOne({ _id: userId });
user._id = user._id.toString();

// 查询订单
const ordersCollection = await getCollection('orders');
const order = await ordersCollection.findOne({ _id: orderId });
order._id = order._id.toString();

// 查询积分
const creditsCollection = await getCollection('credits');
const credit = await creditsCollection.findOne({ userId });
credit._id = credit._id.toString();
```

**现在**：复用 DB API
```javascript
import { getOne } from '@/lib/db-api';

// 自动处理 ObjectId 转换
const user = await getOne({ dbName: 'users', whereJson: { _id: userId } });
const order = await getOne({ dbName: 'orders', whereJson: { _id: orderId } });
const credit = await getOne({ dbName: 'credits', whereJson: { userId } });
```

---

### 更好的维护性

**之前**：分散的数据库操作
```javascript
// 文件 A
const collection = await getCollection('users');
await collection.updateOne({ _id: userId }, { $set: data });

// 文件 B
const db = await connectToDatabase();
await db.collection('users').updateOne({ _id: userId }, { $set: data });

// 文件 C
const usersCollection = await getCollection('users');
const result = await usersCollection.updateOne({ _id: userId }, { $set: data });
```

**现在**：统一的接口
```javascript
import { update } from '@/lib/db-api';

// 所有地方用同样的方式
await update({
	dbName: 'users',
	_id: userId,
	dataJson: data,
});
```

---

## 📦 DB API 提供的功能

### 1. 基础 CRUD

```javascript
import { add, update, del, getOne, getList, getPage } from '@/lib/db-api';

// 增
const userId = await add({
	dbName: 'users',
	dataJson: { name: 'John', email: 'john@example.com' },
});

// 查
const user = await getOne({
	dbName: 'users',
	whereJson: { email: 'john@example.com' },
});

// 改
await update({
	dbName: 'users',
	_id: userId,
	dataJson: { name: 'John Updated' },
});

// 删
await del({
	dbName: 'users',
	_id: userId,
});

// 分页查询
const result = await getPage({
	dbName: 'users',
	pageIndex: 1,
	pageSize: 20,
});
```

---

### 2. 聚合统计

```javascript
import { count, sum, avg, max, min } from '@/lib/db-api';

// 统计数量
const userCount = await count({
	dbName: 'users',
	whereJson: { role: 'admin' },
});

// 求和
const totalRevenue = await sum({
	dbName: 'orders',
	fieldName: 'amount',
	whereJson: { status: 'paid' },
});

// 平均值
const avgOrderAmount = await avg({
	dbName: 'orders',
	fieldName: 'amount',
});
```

---

### 3. 高级操作

```javascript
import { inc, push, pull, sample, aggregate } from '@/lib/db-api';

// 自增/自减
await inc({
	dbName: 'users',
	whereJson: { _id: userId },
	fieldName: 'credits',
	num: 100, // 增加 100，负数表示减少
});

// 数组操作
await push({
	dbName: 'posts',
	whereJson: { _id: postId },
	fieldName: 'tags',
	value: 'javascript',
});

// 随机取样
const randomPosts = await sample({
	dbName: 'posts',
	size: 5,
	whereJson: { status: 'published' },
});

// 复杂聚合
const stats = await aggregate({
	dbName: 'orders',
	groupJson: {
		_id: '$userId',
		totalSpent: { $sum: '$amount' },
		orderCount: { $sum: 1 },
	},
});
```

---

## 🔧 BaseDAO 提供的功能

### 配置化 CRUD

```javascript
// 1. 创建配置文件
export const userCrudConfig = {
	collectionName: 'users',
	
	fields: {
		creatable: ['name', 'email', 'role'],
		updatable: ['name', 'email', 'role'],
		searchable: ['name', 'email'],
	},
	
	validation: {
		email: {
			required: true,
			unique: true,
			pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
		},
	},
	
	hooks: {
		beforeCreate: async (data) => {
			data.id = generateId();
			return data;
		},
		afterDelete: async (id) => {
			await cleanupUserData(id);
		},
	},
	
	softDelete: true,
};

// 2. 创建 Actions
import { createCrudActions } from '@/app/(admin)/actions/dao/base';

const userCrud = createCrudActions(userCrudConfig);

export const getUserListAction = userCrud.getList;
export const updateUserAction = userCrud.update;
export const deleteUserAction = userCrud.delete;
```

---

## 🎭 使用场景对比

### 场景 1：前端用户查询积分

**使用 DB API**

```javascript
'use server';

import { getOne } from '@/lib/db-api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function getUserCreditsAction() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		return { success: false, error: 'Unauthorized' };
	}

	try {
		const user = await getOne({
			dbName: 'users',
			whereJson: { _id: session.user.id },
		});

		return { success: true, data: { credits: user.credits } };
	} catch (error) {
		return { success: false, error: error.message };
	}
}
```

**为什么用 DB API**：
- ✅ 简单查询
- ✅ 不需要验证
- ✅ 前端 Server Action
- ✅ 权限已由 session 处理

---

### 场景 2：后台管理用户

**使用 BaseDAO**

```javascript
// configs/user-crud.config.js
export const userCrudConfig = {
	collectionName: 'users',
	fields: {
		updatable: ['name', 'email', 'role'],
		searchable: ['name', 'email'],
	},
	validation: {
		email: { unique: true },
	},
	softDelete: true,
};

// admin-users.js
const userCrud = createCrudActions(userCrudConfig);
export const getUserListAction = userCrud.getList;
export const updateUserAction = userCrud.update;
```

**为什么用 BaseDAO**：
- ✅ 标准 CRUD
- ✅ 需要管理员权限（自动检查）
- ✅ 需要字段验证（自动验证）
- ✅ 需要软删除（内置支持）
- ✅ 减少重复代码

---

### 场景 3：数据统计

**使用 DB API**

```javascript
import { count, sum, avg } from '@/lib/db-api';

export async function getRevenueStatsAction() {
	const totalRevenue = await sum({
		dbName: 'orders',
		fieldName: 'amount',
		whereJson: { status: 'paid' },
	});

	const avgOrderAmount = await avg({
		dbName: 'orders',
		fieldName: 'amount',
		whereJson: { status: 'paid' },
	});

	return {
		success: true,
		data: { totalRevenue, avgOrderAmount },
	};
}
```

**为什么用 DB API**：
- ✅ 需要聚合统计（sum, avg）
- ✅ BaseDAO 不提供聚合方法
- ✅ 查询灵活

---

## 📊 功能对比表

| 特性 | DB API | BaseDAO |
|------|--------|---------|
| **使用场景** | 前端 Actions，灵活查询 | 后台管理 CRUD |
| **配置** | 无需配置 | 需要配置文件 |
| **学习成本** | 低 | 中 |
| **代码量** | 少 | 极少 |
| **权限控制** | 手动 | 自动 |
| **数据验证** | 手动 | 自动 |
| **时间戳** | 自动 | 自动 |
| **软删除** | 手动 | 自动 |
| **聚合统计** | ✅ 支持 | ❌ 不支持 |
| **生命周期钩子** | ❌ 无 | ✅ 支持 |
| **灵活性** | 高 | 中 |

---

## 🎯 推荐使用策略

### 使用 DB API 当...

- ✅ 编写前端 Server Actions
- ✅ 需要统计分析（count, sum, avg）
- ✅ 需要灵活的查询条件
- ✅ 不需要复杂的验证
- ✅ 熟悉 MongoDB 语法

### 使用 BaseDAO 当...

- ✅ 编写后台管理功能
- ✅ 需要标准 CRUD 操作
- ✅ 需要字段验证和权限控制
- ✅ 需要生命周期钩子
- ✅ 需要软删除功能
- ✅ 想快速开发，减少重复代码

### 混合使用

```javascript
import { createCrudActions } from '@/app/(admin)/actions/dao/base';
import { count, sum } from '@/lib/db-api';

// 标准 CRUD 用 BaseDAO
const userCrud = createCrudActions(userCrudConfig);
export const getUserListAction = userCrud.getList;
export const updateUserAction = userCrud.update;

// 统计分析用 DB API
export async function getUserStatsAction() {
	const totalUsers = await count({ dbName: 'users' });
	const totalCredits = await sum({
		dbName: 'users',
		fieldName: 'credits',
	});

	return {
		success: true,
		data: { totalUsers, totalCredits },
	};
}
```

---

## 📚 文档导航

### 入门必读

1. **[DB API vs BaseDAO 对比](./DB_API_VS_BASEDAO.md)** - 先读这个，了解如何选择
2. **[Database API 文档](./DB_API_GUIDE.md)** - DB API 完整参考
3. **[Database API 实战示例](./DB_API_EXAMPLES.md)** - 实际应用示例

### 深入学习

1. **[BaseDAO 文档](./admin/BASE_DAO.md)** - BaseDAO 完整功能
2. **[CRUD 开发指南](./admin/CRUD_GUIDE.md)** - 如何快速开发 CRUD

---

## 🎉 实际效果

### 代码量对比

**之前**：写一个用户管理功能需要 300+ 行代码
```javascript
// 权限检查
// 字段验证
// 唯一性检查
// 数据过滤
// 时间戳处理
// 软删除逻辑
// ... 大量重复代码
```

**现在（BaseDAO）**：只需要 50 行配置
```javascript
export const userCrudConfig = {
	collectionName: 'users',
	fields: { ... },
	validation: { ... },
	softDelete: true,
};

const userCrud = createCrudActions(userCrudConfig);
export const getUserListAction = userCrud.getList;
export const updateUserAction = userCrud.update;
```

---

### 一致性提升

**之前**：每个文件用不同的方式
```javascript
// 文件 A
const collection = await getCollection('users');
const user = await collection.findOne({ email });

// 文件 B
const db = await connectToDatabase();
const user = await db.collection('users').findOne({ email });

// 文件 C
import { getCollection } from '@/lib/database/mongodb';
const coll = await getCollection('users');
const user = await coll.findOne({ email });
```

**现在**：所有文件统一
```javascript
import { getOne } from '@/lib/db-api';

const user = await getOne({
	dbName: 'users',
	whereJson: { email },
});
```

---

### 维护性提升

**之前**：修改需要改多处
```
需要改 ObjectId 处理逻辑 → 改 20 个文件
需要改时间戳逻辑 → 改 15 个文件
需要改错误处理 → 改 30 个文件
```

**现在**：只需改一处
```
需要改 ObjectId 处理逻辑 → 改 lib/db-api.js
需要改时间戳逻辑 → 改 lib/db-api.js
需要改错误处理 → 改 lib/db-api.js
```

---

## 🚀 开始使用

### 1. 对于前端开发者

```javascript
import { getOne, getPage, count } from '@/lib/db-api';

// 查询单条
const user = await getOne({
	dbName: 'users',
	whereJson: { email: 'test@example.com' },
});

// 分页查询
const result = await getPage({
	dbName: 'posts',
	pageIndex: 1,
	pageSize: 20,
});

// 统计数量
const total = await count({
	dbName: 'users',
	whereJson: { role: 'admin' },
});
```

### 2. 对于后台开发者

```javascript
import { createCrudActions } from '@/app/(admin)/actions/dao/base';

// 1. 创建配置
export const entityCrudConfig = {
	collectionName: 'entities',
	fields: {
		creatable: ['name', 'description'],
		updatable: ['name', 'description'],
		searchable: ['name'],
	},
	validation: {
		name: { required: true },
	},
};

// 2. 创建 Actions
const entityCrud = createCrudActions(entityCrudConfig);
export const getEntityListAction = entityCrud.getList;
export const updateEntityAction = entityCrud.update;
```

---

## 💡 最佳实践

### 1. 始终进行错误处理

```javascript
try {
	const user = await getOne({
		dbName: 'users',
		whereJson: { _id: userId },
	});

	return { success: true, data: user };
} catch (error) {
	console.error('Get user error:', error);
	return { success: false, error: error.message };
}
```

### 2. 使用统一的返回格式

```javascript
return {
	success: true, // 或 false
	data: {}, // 成功时的数据
	error: '', // 失败时的错误信息
};
```

### 3. 合理选择工具

- 简单查询 → DB API
- 后台 CRUD → BaseDAO
- 统计分析 → DB API
- 复杂业务 → DB API

### 4. 混合使用

不要局限于单一工具，根据场景灵活选择：

```javascript
import { createCrudActions } from '@/app/(admin)/actions/dao/base';
import { count, sum, aggregate } from '@/lib/db-api';

// 标准 CRUD 用 BaseDAO
const userCrud = createCrudActions(userCrudConfig);

// 统计分析用 DB API
export async function getUserStatsAction() {
	// ...
}
```

---

## 🎊 总结

我们创建了一套完整的数据库 API 系统：

### ✅ 达成目标

1. **统一写法** - 所有数据库操作使用一致的接口
2. **高可复用** - 减少重复代码，提高开发效率
3. **易维护** - 集中管理，修改方便
4. **灵活性** - 既有配置化的 BaseDAO，又有灵活的 DB API

### 🎯 核心价值

- **DB API** - 统一接口，兼容原生，支持聚合统计
- **BaseDAO** - 配置化 CRUD，自动验证，生命周期钩子
- **完整文档** - 详细的使用指南和实战示例

### 📈 预期效果

- 代码量减少 50%+
- 开发效率提升 2-3 倍
- 代码一致性大幅提升
- 维护成本显著降低

---

## 🤝 贡献

欢迎提出建议和改进意见！

- 发现问题 → 提 Issue
- 改进建议 → 提 PR
- 使用问题 → 查文档

---

**Happy Coding! 🚀**

