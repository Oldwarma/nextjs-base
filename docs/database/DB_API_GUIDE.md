# Database API 统一接口文档

## 概述

Database API (`lib/db-api.js`) 是一个统一的数据库操作接口层，参考 VK Framework 设计理念，适配 MongoDB + Next.js 技术栈。提供简洁、一致的 API 接口，减少重复代码，提高开发效率。

## 设计理念

### 🎯 核心特点

- **统一接口**：所有数据库操作使用一致的参数命名和返回格式
- **自动时间戳**：增改操作自动添加 `createdAt` 和 `updatedAt`
- **ObjectId 处理**：自动处理 MongoDB ObjectId 与字符串的转换
- **类型安全**：完善的参数验证和错误提示
- **兼容原生**：完全兼容 MongoDB 原生查询语法
- **易于测试**：统一的接口便于编写单元测试

### 🔄 与 BaseDAO 的关系

| 特性 | DB API | BaseDAO |
|------|--------|---------|
| **适用场景** | 单表基础 CRUD，简单查询 | 复杂业务逻辑，需要验证、钩子、权限控制 |
| **配置方式** | 无需配置，直接调用 | 需要配置文件（字段、验证、钩子等） |
| **权限控制** | 手动检查 | 自动检查管理员权限 |
| **数据验证** | 手动验证 | 自动验证（必填、长度、正则、唯一性） |
| **生命周期钩子** | 无 | 有（beforeCreate, afterUpdate 等） |
| **软删除** | 不支持 | 支持 |
| **适合用户** | 熟悉 MongoDB 的开发者 | 需要快速开发后台管理的开发者 |

**推荐使用策略**：
- **DB API**：用于前端 Server Actions 中的简单查询、统计、数据获取
- **BaseDAO**：用于后台管理的标准 CRUD 操作

---

## 快速开始

### 安装

DB API 已集成在项目中，无需额外安装。

```javascript
// 引入方式1：引入具体方法
import { add, getOne, getPage, count } from '@/lib/db-api';

// 引入方式2：引入命名空间对象
import dbApi from '@/lib/db-api';

// 引入方式3：按需引入
import { dbApi } from '@/lib/db-api';
```

### 基础示例

```javascript
'use server';

import { add, getOne, getPage, count } from '@/lib/db-api';

// 创建记录
export async function createUserAction(userData) {
	try {
		const userId = await add({
			dbName: 'users',
			dataJson: {
				name: userData.name,
				email: userData.email,
				role: 'user',
			},
		});

		return { success: true, data: { userId } };
	} catch (error) {
		return { success: false, error: error.message };
	}
}

// 查询单条记录
export async function getUserByEmailAction(email) {
	try {
		const user = await getOne({
			dbName: 'users',
			whereJson: { email },
		});

		return { success: true, data: user };
	} catch (error) {
		return { success: false, error: error.message };
	}
}

// 分页查询
export async function getUserListAction({ pageIndex = 1, pageSize = 20, role } = {}) {
	try {
		const whereJson = role ? { role } : {};
		const result = await getPage({
			dbName: 'users',
			whereJson,
			pageIndex,
			pageSize,
			sortJson: { createdAt: -1 },
		});

		return { success: true, data: result };
	} catch (error) {
		return { success: false, error: error.message };
	}
}

// 统计数量
export async function getUserCountAction() {
	try {
		const total = await count({
			dbName: 'users',
			whereJson: { role: 'user' },
		});

		return { success: true, data: { total } };
	} catch (error) {
		return { success: false, error: error.message };
	}
}
```

---

## API 参考

### 增（Create）

#### add - 单条记录增加

添加单条记录到数据库。

**参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dbName | String | 是 | 集合名称 |
| dataJson | Object | 是 | 需要新增的数据 |
| cancelAddTime | Boolean | 否 | 取消自动生成时间戳（默认 false） |

**返回值**

`Promise<string>` - 返回新增记录的 `_id` 字符串

**示例**

```javascript
// 基础用法
const userId = await add({
	dbName: 'users',
	dataJson: {
		name: 'John Doe',
		email: 'john@example.com',
		age: 25,
	},
});

// 取消自动时间戳
const postId = await add({
	dbName: 'posts',
	dataJson: {
		title: 'Hello World',
		content: 'This is my first post',
		publishedAt: new Date('2025-01-01'),
	},
	cancelAddTime: true, // 不添加 createdAt 和 updatedAt
});
```

**注意事项**

- 自动添加 `createdAt` 和 `updatedAt` 字段（除非设置 `cancelAddTime: true`）
- 返回的 `_id` 是字符串格式，可直接存储和使用

---

#### adds - 批量增加

批量添加多条记录。

**参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dbName | String | 是 | 集合名称 |
| dataJson | Array | 是 | 需要新增的数据数组 |
| cancelAddTime | Boolean | 否 | 取消自动生成时间戳 |

**返回值**

`Promise<Array<string>>` - 返回新增记录的 `_id` 字符串数组

**示例**

```javascript
const userIds = await adds({
	dbName: 'users',
	dataJson: [
		{ name: 'Alice', email: 'alice@example.com' },
		{ name: 'Bob', email: 'bob@example.com' },
		{ name: 'Charlie', email: 'charlie@example.com' },
	],
});

console.log(userIds); // ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', ...]
```

---

### 删（Delete）

#### del - 根据 _id 删除

根据 `_id` 删除单条记录（硬删除）。

**参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dbName | String | 是 | 集合名称 |
| _id | String | 是 | 记录的 _id |

**返回值**

`Promise<number>` - 返回删除的记录数（0 或 1）

**示例**

```javascript
const deletedCount = await del({
	dbName: 'users',
	_id: '507f1f77bcf86cd799439011',
});

if (deletedCount > 0) {
	console.log('User deleted successfully');
}
```

---

#### remove - 根据条件删除单条

根据查询条件删除单条记录。

**参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dbName | String | 是 | 集合名称 |
| whereJson | Object | 是 | 删除条件 |

**返回值**

`Promise<number>` - 返回删除的记录数

**示例**

```javascript
// 删除指定邮箱的用户
const deletedCount = await remove({
	dbName: 'users',
	whereJson: { email: 'john@example.com' },
});

// 删除过期的会话
const deletedCount = await remove({
	dbName: 'sessions',
	whereJson: {
		expiresAt: { $lt: new Date() },
	},
});
```

---

#### delMany - 批量删除

根据条件批量删除多条记录。

**参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dbName | String | 是 | 集合名称 |
| whereJson | Object | 是 | 删除条件 |

**返回值**

`Promise<number>` - 返回删除的记录数

**示例**

```javascript
// 删除所有过期的验证码
const deletedCount = await delMany({
	dbName: 'verification_codes',
	whereJson: {
		expiresAt: { $lt: new Date() },
	},
});

console.log(`Deleted ${deletedCount} expired codes`);

// 删除特定用户的所有图片记录
const deletedCount = await delMany({
	dbName: 'generations',
	whereJson: {
		userId: 'user123',
		type: 'image',
	},
});
```

---

### 改（Update）

#### update - 根据 _id 修改

根据 `_id` 修改单条记录。

**参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dbName | String | 是 | 集合名称 |
| _id | String | 是 | 记录的 _id |
| dataJson | Object | 是 | 需要修改的数据 |
| cancelUpdateTime | Boolean | 否 | 取消自动更新时间戳 |

**返回值**

`Promise<number>` - 返回修改的记录数

**示例**

```javascript
// 更新用户信息
const modifiedCount = await update({
	dbName: 'users',
	_id: '507f1f77bcf86cd799439011',
	dataJson: {
		name: 'John Updated',
		age: 26,
	},
});

// 不更新 updatedAt 字段
const modifiedCount = await update({
	dbName: 'configs',
	_id: 'config001',
	dataJson: {
		value: 'new value',
	},
	cancelUpdateTime: true,
});
```

**注意事项**

- 自动添加 `updatedAt` 字段（除非设置 `cancelUpdateTime: true`）
- 只更新 `dataJson` 中提供的字段，其他字段不变

---

#### updateOne - 根据条件修改单条

根据查询条件修改单条记录。

**参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dbName | String | 是 | 集合名称 |
| whereJson | Object | 是 | 查询条件 |
| dataJson | Object | 是 | 需要修改的数据 |
| cancelUpdateTime | Boolean | 否 | 取消自动更新时间戳 |

**返回值**

`Promise<number>` - 返回修改的记录数

**示例**

```javascript
// 更新指定邮箱的用户
const modifiedCount = await updateOne({
	dbName: 'users',
	whereJson: { email: 'john@example.com' },
	dataJson: {
		emailVerified: true,
		verifiedAt: new Date(),
	},
});

// 更新最旧的未处理订单
const modifiedCount = await updateOne({
	dbName: 'orders',
	whereJson: { status: 'pending' },
	dataJson: {
		status: 'processing',
		processedBy: 'admin123',
	},
});
```

---

#### updateMany - 批量修改

根据条件批量修改多条记录。

**参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dbName | String | 是 | 集合名称 |
| whereJson | Object | 是 | 查询条件 |
| dataJson | Object | 是 | 需要修改的数据 |
| cancelUpdateTime | Boolean | 否 | 取消自动更新时间戳 |

**返回值**

`Promise<number>` - 返回修改的记录数

**示例**

```javascript
// 批量更新用户角色
const modifiedCount = await updateMany({
	dbName: 'users',
	whereJson: {
		createdAt: { $lt: new Date('2024-01-01') },
		role: 'trial',
	},
	dataJson: {
		role: 'user',
		upgraded: true,
	},
});

console.log(`Upgraded ${modifiedCount} users`);

// 批量标记已读
const modifiedCount = await updateMany({
	dbName: 'notifications',
	whereJson: {
		userId: 'user123',
		read: false,
	},
	dataJson: {
		read: true,
		readAt: new Date(),
	},
});
```

---

#### inc - 字段自增/自减

对数值字段进行自增或自减操作。

**参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dbName | String | 是 | 集合名称 |
| whereJson | Object | 是 | 查询条件 |
| fieldName | String | 是 | 字段名 |
| num | Number | 否 | 自增数量（默认 1，负数表示自减） |

**返回值**

`Promise<number>` - 返回修改的记录数

**示例**

```javascript
// 增加积分
await inc({
	dbName: 'users',
	whereJson: { _id: 'user123' },
	fieldName: 'credits',
	num: 100,
});

// 减少库存
await inc({
	dbName: 'products',
	whereJson: { sku: 'PROD001' },
	fieldName: 'stock',
	num: -1,
});

// 增加文章浏览量
await inc({
	dbName: 'posts',
	whereJson: { slug: 'hello-world' },
	fieldName: 'views',
	num: 1,
});
```

---

#### push - 数组添加元素

向数组字段添加元素。

**参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dbName | String | 是 | 集合名称 |
| whereJson | Object | 是 | 查询条件 |
| fieldName | String | 是 | 数组字段名 |
| value | Any | 是 | 要添加的值 |

**返回值**

`Promise<number>` - 返回修改的记录数

**示例**

```javascript
// 添加标签
await push({
	dbName: 'posts',
	whereJson: { _id: 'post123' },
	fieldName: 'tags',
	value: 'javascript',
});

// 添加评论
await push({
	dbName: 'posts',
	whereJson: { _id: 'post123' },
	fieldName: 'comments',
	value: {
		userId: 'user456',
		content: 'Great post!',
		createdAt: new Date(),
	},
});
```

---

#### pull - 数组删除元素

从数组字段删除元素。

**参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dbName | String | 是 | 集合名称 |
| whereJson | Object | 是 | 查询条件 |
| fieldName | String | 是 | 数组字段名 |
| value | Any | 是 | 要删除的值 |

**返回值**

`Promise<number>` - 返回修改的记录数

**示例**

```javascript
// 删除标签
await pull({
	dbName: 'posts',
	whereJson: { _id: 'post123' },
	fieldName: 'tags',
	value: 'outdated',
});

// 取消关注
await pull({
	dbName: 'users',
	whereJson: { _id: 'user123' },
	fieldName: 'following',
	value: 'user456',
});
```

---

### 查（Read）

#### findById - 根据 _id 查询

根据 `_id` 查询单条记录。

**参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dbName | String | 是 | 集合名称 |
| _id | String | 是 | 记录的 _id |
| fieldJson | Object | 否 | 字段显示规则（暂未实现） |

**返回值**

`Promise<Object|null>` - 返回查询结果，不存在则返回 null

**示例**

```javascript
const user = await findById({
	dbName: 'users',
	_id: '507f1f77bcf86cd799439011',
});

if (user) {
	console.log(user.name);
} else {
	console.log('User not found');
}
```

---

#### getOne - 查询单条记录

根据条件查询单条记录。

**参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dbName | String | 是 | 集合名称 |
| whereJson | Object | 否 | 查询条件 |
| fieldJson | Object | 否 | 字段显示规则 |
| sortJson | Object | 否 | 排序规则 |

**返回值**

`Promise<Object|null>` - 返回查询结果，不存在则返回 null

**示例**

```javascript
// 查询用户
const user = await getOne({
	dbName: 'users',
	whereJson: { email: 'john@example.com' },
});

// 查询最新的文章
const latestPost = await getOne({
	dbName: 'posts',
	whereJson: { status: 'published' },
	sortJson: { publishedAt: -1 },
});

// 查询特定字段
const user = await getOne({
	dbName: 'users',
	whereJson: { _id: 'user123' },
	fieldJson: { name: 1, email: 1 }, // 只返回 name 和 email
});
```

---

#### getList - 查询列表（不分页）

根据条件查询多条记录，不分页。

**参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dbName | String | 是 | 集合名称 |
| whereJson | Object | 否 | 查询条件 |
| fieldJson | Object | 否 | 字段显示规则 |
| sortJson | Object | 否 | 排序规则 |
| limit | Number | 否 | 限制条数（0 表示不限制） |

**返回值**

`Promise<Array>` - 返回查询结果数组

**示例**

```javascript
// 查询所有用户
const users = await getList({
	dbName: 'users',
});

// 查询管理员用户
const admins = await getList({
	dbName: 'users',
	whereJson: { role: 'admin' },
	sortJson: { createdAt: -1 },
});

// 查询最新的 10 篇文章
const recentPosts = await getList({
	dbName: 'posts',
	whereJson: { status: 'published' },
	sortJson: { publishedAt: -1 },
	limit: 10,
});

// 查询指定字段
const users = await getList({
	dbName: 'users',
	whereJson: { role: 'user' },
	fieldJson: { name: 1, email: 1, createdAt: 1 },
});
```

---

#### getPage - 分页查询

分页查询数据列表。

**参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dbName | String | 是 | 集合名称 |
| whereJson | Object | 否 | 查询条件 |
| fieldJson | Object | 否 | 字段显示规则 |
| sortJson | Object | 否 | 排序规则（默认 `{ _id: -1 }`） |
| pageIndex | Number | 否 | 当前页码（从 1 开始，默认 1） |
| pageSize | Number | 否 | 每页条数（默认 20） |

**返回值**

```javascript
{
	code: 0,
	msg: 'ok',
	rows: [...],          // 当前页数据
	total: 100,           // 总记录数
	pageIndex: 1,         // 当前页码
	pageSize: 20,         // 每页条数
	totalPages: 5,        // 总页数
	hasNext: true,        // 是否有下一页
	hasPrev: false,       // 是否有上一页
}
```

**示例**

```javascript
// 基础分页
const result = await getPage({
	dbName: 'users',
	pageIndex: 1,
	pageSize: 20,
});

console.log(`Total: ${result.total}, Page: ${result.pageIndex}/${result.totalPages}`);
result.rows.forEach((user) => console.log(user.name));

// 条件分页
const result = await getPage({
	dbName: 'posts',
	whereJson: {
		status: 'published',
		category: 'technology',
	},
	sortJson: { publishedAt: -1 },
	pageIndex: 2,
	pageSize: 10,
});

// 用于 Server Action
export async function getUserListAction({ pageIndex = 1, pageSize = 20, role } = {}) {
	try {
		const whereJson = role ? { role } : {};
		const result = await getPage({
			dbName: 'users',
			whereJson,
			pageIndex,
			pageSize,
			sortJson: { createdAt: -1 },
		});

		return {
			success: true,
			data: result.rows,
			total: result.total,
			pageIndex: result.pageIndex,
			pageSize: result.pageSize,
			totalPages: result.totalPages,
		};
	} catch (error) {
		return { success: false, error: error.message };
	}
}
```

---

#### getPageWithLookup - 连表分页查询

支持连表的分页查询。

**参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dbName | String | 是 | 集合名称 |
| whereJson | Object | 否 | 查询条件 |
| foreignDB | Array | 否 | 连表规则数组 |
| sortJson | Object | 否 | 排序规则 |
| pageIndex | Number | 否 | 当前页码 |
| pageSize | Number | 否 | 每页条数 |

**foreignDB 配置**

```javascript
{
	from: 'users',           // 要连接的集合
	localField: 'userId',    // 本地字段
	foreignField: '_id',     // 外键字段
	as: 'userInfo',          // 结果字段名
	single: true,            // 是否只取第一个匹配项（默认 false）
	addFields: {             // 提取特定字段到顶层
		userName: 'name',
		userEmail: 'email',
	},
}
```

**返回值**

与 `getPage` 相同

**示例**

```javascript
// 查询订单并关联用户信息
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
	sortJson: { createdAt: -1 },
});

result.rows.forEach((order) => {
	console.log(`Order ${order._id} by ${order.userInfo.name}`);
});

// 查询生成记录并关联用户和套餐信息
const result = await getPageWithLookup({
	dbName: 'generations',
	whereJson: { type: 'image' },
	foreignDB: [
		{
			from: 'users',
			localField: 'userId',
			foreignField: '_id',
			as: 'user',
			single: true,
			addFields: {
				userName: 'name',
				userEmail: 'email',
			},
		},
		{
			from: 'packages',
			localField: 'packageId',
			foreignField: '_id',
			as: 'package',
			single: true,
		},
	],
	pageIndex: 1,
	pageSize: 20,
});
```

---

### 聚合统计

#### count - 统计数量

统计满足条件的记录数量。

**参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dbName | String | 是 | 集合名称 |
| whereJson | Object | 否 | 查询条件 |

**返回值**

`Promise<number>` - 返回记录总数

**示例**

```javascript
// 统计总用户数
const totalUsers = await count({
	dbName: 'users',
});

// 统计管理员数量
const adminCount = await count({
	dbName: 'users',
	whereJson: { role: 'admin' },
});

// 统计今日新增用户
const todayCount = await count({
	dbName: 'users',
	whereJson: {
		createdAt: {
			$gte: new Date(new Date().setHours(0, 0, 0, 0)),
		},
	},
});

// 判断用户名是否存在
const usernameExists = (await count({
	dbName: 'users',
	whereJson: { username: 'john' },
})) > 0;
```

---

#### sum - 求和

对数值字段求和。

**参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dbName | String | 是 | 集合名称 |
| fieldName | String | 是 | 需要求和的字段名 |
| whereJson | Object | 否 | 查询条件 |

**返回值**

`Promise<number>` - 返回求和结果

**示例**

```javascript
// 统计总积分
const totalCredits = await sum({
	dbName: 'users',
	fieldName: 'credits',
});

// 统计本月收入
const monthlyRevenue = await sum({
	dbName: 'orders',
	fieldName: 'amount',
	whereJson: {
		createdAt: {
			$gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
		},
		status: 'paid',
	},
});

// 统计某用户的总消费
const userSpending = await sum({
	dbName: 'credit_transactions',
	fieldName: 'amount',
	whereJson: {
		userId: 'user123',
		type: 'consume',
	},
});
```

---

#### max - 取最大值

获取字段的最大值。

**参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dbName | String | 是 | 集合名称 |
| fieldName | String | 是 | 字段名 |
| whereJson | Object | 否 | 查询条件 |

**返回值**

`Promise<number|null>` - 返回最大值

**示例**

```javascript
// 获取最高积分
const maxCredits = await max({
	dbName: 'users',
	fieldName: 'credits',
});

// 获取最大订单金额
const maxOrderAmount = await max({
	dbName: 'orders',
	fieldName: 'amount',
	whereJson: { status: 'paid' },
});
```

---

#### min - 取最小值

获取字段的最小值。

**参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dbName | String | 是 | 集合名称 |
| fieldName | String | 是 | 字段名 |
| whereJson | Object | 否 | 查询条件 |

**返回值**

`Promise<number|null>` - 返回最小值

**示例**

```javascript
// 获取最低价格
const minPrice = await min({
	dbName: 'products',
	fieldName: 'price',
	whereJson: { status: 'active' },
});
```

---

#### avg - 取平均值

计算字段的平均值。

**参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dbName | String | 是 | 集合名称 |
| fieldName | String | 是 | 字段名 |
| whereJson | Object | 否 | 查询条件 |

**返回值**

`Promise<number>` - 返回平均值

**示例**

```javascript
// 计算平均年龄
const avgAge = await avg({
	dbName: 'users',
	fieldName: 'age',
});

// 计算平均订单金额
const avgOrderAmount = await avg({
	dbName: 'orders',
	fieldName: 'amount',
	whereJson: { status: 'paid' },
});
```

---

#### sample - 随机取N条

随机获取指定数量的记录。

**参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dbName | String | 是 | 集合名称 |
| size | Number | 否 | 随机条数（默认 1） |
| whereJson | Object | 否 | 查询条件 |

**返回值**

`Promise<Array>` - 返回随机结果数组

**示例**

```javascript
// 随机获取 5 个用户
const randomUsers = await sample({
	dbName: 'users',
	size: 5,
});

// 随机获取 10 篇已发布文章
const randomPosts = await sample({
	dbName: 'posts',
	size: 10,
	whereJson: { status: 'published' },
});

// 推荐功能：随机推荐 3 个产品
const recommendedProducts = await sample({
	dbName: 'products',
	size: 3,
	whereJson: {
		status: 'active',
		stock: { $gt: 0 },
	},
});
```

---

#### distinct - 去重查询

获取字段的去重值列表。

**参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dbName | String | 是 | 集合名称 |
| fieldName | String | 是 | 字段名 |
| whereJson | Object | 否 | 查询条件 |

**返回值**

`Promise<Array>` - 返回去重后的值数组

**示例**

```javascript
// 获取所有文章分类
const categories = await distinct({
	dbName: 'posts',
	fieldName: 'category',
});

console.log(categories); // ['tech', 'lifestyle', 'business']

// 获取已购买用户的 ID 列表
const paidUserIds = await distinct({
	dbName: 'orders',
	fieldName: 'userId',
	whereJson: { status: 'paid' },
});

// 获取所有标签
const allTags = await distinct({
	dbName: 'posts',
	fieldName: 'tags',
	whereJson: { status: 'published' },
});
```

---

#### aggregate - 聚合查询

执行复杂的聚合查询。

**参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dbName | String | 是 | 集合名称 |
| whereJson | Object | 否 | 查询条件 |
| groupJson | Object | 否 | 分组规则 |
| foreignDB | Array | 否 | 连表规则 |

**返回值**

`Promise<Array>` - 返回聚合结果数组

**示例**

```javascript
// 按角色分组统计用户数
const result = await aggregate({
	dbName: 'users',
	groupJson: {
		_id: '$role',
		count: { $sum: 1 },
	},
});

console.log(result);
// [
//   { _id: 'admin', count: 5 },
//   { _id: 'user', count: 100 },
// ]

// 按日期统计订单金额
const result = await aggregate({
	dbName: 'orders',
	whereJson: { status: 'paid' },
	groupJson: {
		_id: {
			$dateToString: {
				format: '%Y-%m-%d',
				date: '$createdAt',
			},
		},
		totalAmount: { $sum: '$amount' },
		orderCount: { $sum: 1 },
	},
});

// 连表聚合：统计每个用户的订单总额
const result = await aggregate({
	dbName: 'orders',
	foreignDB: [
		{
			from: 'users',
			localField: 'userId',
			foreignField: '_id',
			as: 'user',
		},
	],
	groupJson: {
		_id: '$userId',
		userName: { $first: { $arrayElemAt: ['$user.name', 0] } },
		totalSpent: { $sum: '$amount' },
		orderCount: { $sum: 1 },
	},
});
```

---

### 工具方法

#### exists - 检查记录是否存在

检查是否存在满足条件的记录。

**参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dbName | String | 是 | 集合名称 |
| whereJson | Object | 是 | 查询条件 |

**返回值**

`Promise<boolean>` - 存在返回 true，否则返回 false

**示例**

```javascript
// 检查用户名是否存在
const usernameExists = await exists({
	dbName: 'users',
	whereJson: { username: 'john' },
});

if (usernameExists) {
	throw new Error('Username already taken');
}

// 检查邮箱是否已注册
const emailExists = await exists({
	dbName: 'users',
	whereJson: { email: 'john@example.com' },
});

// 检查订单是否存在
const orderExists = await exists({
	dbName: 'orders',
	whereJson: {
		orderId: 'ORD123',
		userId: 'user456',
	},
});
```

---

## 实战示例

### 示例 1：用户注册

```javascript
'use server';

import { add, exists } from '@/lib/db-api';
import { hashPassword } from '@/lib/utils';

export async function registerAction(userData) {
	try {
		// 1. 检查邮箱是否已存在
		const emailExists = await exists({
			dbName: 'users',
			whereJson: { email: userData.email },
		});

		if (emailExists) {
			return { success: false, error: 'Email already registered' };
		}

		// 2. 检查用户名是否已存在
		const usernameExists = await exists({
			dbName: 'users',
			whereJson: { username: userData.username },
		});

		if (usernameExists) {
			return { success: false, error: 'Username already taken' };
		}

		// 3. 创建用户
		const hashedPassword = await hashPassword(userData.password);
		const userId = await add({
			dbName: 'users',
			dataJson: {
				username: userData.username,
				email: userData.email,
				password: hashedPassword,
				role: 'user',
				emailVerified: false,
				credits: 0,
			},
		});

		// 4. 初始化积分账户
		await add({
			dbName: 'credit_records',
			dataJson: {
				userId,
				credits: 0,
				totalEarned: 0,
				totalSpent: 0,
			},
		});

		return { success: true, data: { userId } };
	} catch (error) {
		console.error('Register error:', error);
		return { success: false, error: error.message };
	}
}
```

---

### 示例 2：积分充值

```javascript
'use server';

import { add, inc, getOne } from '@/lib/db-api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function rechargeCreditsAction(packageId) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		return { success: false, error: 'Unauthorized' };
	}

	try {
		// 1. 获取套餐信息
		const package = await getOne({
			dbName: 'packages',
			whereJson: { _id: packageId, enabled: true },
		});

		if (!package) {
			return { success: false, error: 'Package not found' };
		}

		// 2. 增加用户积分
		await inc({
			dbName: 'users',
			whereJson: { _id: session.user.id },
			fieldName: 'credits',
			num: package.credits,
		});

		// 3. 记录交易
		await add({
			dbName: 'credit_transactions',
			dataJson: {
				userId: session.user.id,
				type: 'recharge',
				amount: package.credits,
				packageId: package._id,
				packageName: package.name,
				price: package.price,
			},
		});

		return {
			success: true,
			data: {
				credits: package.credits,
				message: 'Recharge successful',
			},
		};
	} catch (error) {
		console.error('Recharge error:', error);
		return { success: false, error: error.message };
	}
}
```

---

### 示例 3：数据统计面板

```javascript
'use server';

import { count, sum, avg, getList } from '@/lib/db-api';
import { checkAdminAction } from '@/lib/admin-auth';

export async function getDashboardStatsAction() {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return { success: false, error: adminCheck.error };
	}

	try {
		const today = new Date(new Date().setHours(0, 0, 0, 0));
		const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

		// 1. 用户统计
		const totalUsers = await count({ dbName: 'users' });
		const todayNewUsers = await count({
			dbName: 'users',
			whereJson: { createdAt: { $gte: today } },
		});

		// 2. 收入统计
		const totalRevenue = await sum({
			dbName: 'orders',
			fieldName: 'amount',
			whereJson: { status: 'paid' },
		});
		const monthlyRevenue = await sum({
			dbName: 'orders',
			fieldName: 'amount',
			whereJson: {
				status: 'paid',
				createdAt: { $gte: thisMonth },
			},
		});

		// 3. 订单统计
		const totalOrders = await count({
			dbName: 'orders',
			whereJson: { status: 'paid' },
		});
		const avgOrderAmount = await avg({
			dbName: 'orders',
			fieldName: 'amount',
			whereJson: { status: 'paid' },
		});

		// 4. 生成统计
		const totalGenerations = await count({ dbName: 'generations' });
		const todayGenerations = await count({
			dbName: 'generations',
			whereJson: { createdAt: { $gte: today } },
		});

		// 5. 最近订单
		const recentOrders = await getList({
			dbName: 'orders',
			whereJson: { status: 'paid' },
			sortJson: { createdAt: -1 },
			limit: 10,
		});

		return {
			success: true,
			data: {
				users: {
					total: totalUsers,
					todayNew: todayNewUsers,
				},
				revenue: {
					total: totalRevenue,
					monthly: monthlyRevenue,
				},
				orders: {
					total: totalOrders,
					average: avgOrderAmount,
				},
				generations: {
					total: totalGenerations,
					today: todayGenerations,
				},
				recentOrders,
			},
		};
	} catch (error) {
		console.error('Dashboard stats error:', error);
		return { success: false, error: error.message };
	}
}
```

---

### 示例 4：内容推荐系统

```javascript
'use server';

import { sample, getList, push } from '@/lib/db-api';

export async function getRecommendationsAction(userId) {
	try {
		// 1. 获取用户浏览历史
		const viewHistory = await getList({
			dbName: 'view_history',
			whereJson: { userId },
			sortJson: { createdAt: -1 },
			limit: 10,
		});

		const viewedCategories = [...new Set(viewHistory.map((item) => item.category))];

		// 2. 随机推荐相关分类的内容
		const recommendations = await sample({
			dbName: 'posts',
			size: 5,
			whereJson: {
				status: 'published',
				category: { $in: viewedCategories },
				_id: { $nin: viewHistory.map((item) => item.postId) },
			},
		});

		// 3. 如果推荐不足，补充随机热门内容
		if (recommendations.length < 5) {
			const popularPosts = await sample({
				dbName: 'posts',
				size: 5 - recommendations.length,
				whereJson: {
					status: 'published',
					views: { $gt: 100 },
				},
			});

			recommendations.push(...popularPosts);
		}

		// 4. 记录推荐展示（用于后续分析）
		await push({
			dbName: 'users',
			whereJson: { _id: userId },
			fieldName: 'recommendationHistory',
			value: {
				postIds: recommendations.map((post) => post._id),
				timestamp: new Date(),
			},
		});

		return { success: true, data: recommendations };
	} catch (error) {
		console.error('Recommendations error:', error);
		return { success: false, error: error.message };
	}
}
```

---

## 最佳实践

### 1. 错误处理

始终使用 try-catch 包裹数据库操作：

```javascript
export async function myAction() {
	try {
		const result = await getOne({
			dbName: 'users',
			whereJson: { email: 'test@example.com' },
		});

		return { success: true, data: result };
	} catch (error) {
		console.error('myAction error:', error);
		return { success: false, error: error.message };
	}
}
```

---

### 2. 参数验证

在调用 DB API 前进行参数验证：

```javascript
export async function getUserAction(userId) {
	// 验证参数
	if (!userId || typeof userId !== 'string') {
		return { success: false, error: 'Invalid user ID' };
	}

	try {
		const user = await findById({
			dbName: 'users',
			_id: userId,
		});

		if (!user) {
			return { success: false, error: 'User not found' };
		}

		return { success: true, data: user };
	} catch (error) {
		return { success: false, error: error.message };
	}
}
```

---

### 3. 查询优化

**使用索引字段**：
```javascript
// ✅ 好：使用有索引的字段查询
const user = await getOne({
	dbName: 'users',
	whereJson: { email: 'john@example.com' }, // email 有索引
});

// ❌ 差：使用无索引的字段查询
const user = await getOne({
	dbName: 'users',
	whereJson: { bio: { $regex: 'developer' } }, // bio 无索引
});
```

**限制返回字段**：
```javascript
// ✅ 好：只查询需要的字段
const users = await getList({
	dbName: 'users',
	fieldJson: { name: 1, email: 1 },
});

// ❌ 差：返回所有字段（包括大字段）
const users = await getList({
	dbName: 'users',
});
```

---

### 4. 批量操作

尽可能使用批量操作而非循环：

```javascript
// ❌ 差：循环调用
for (const userId of userIds) {
	await update({
		dbName: 'users',
		_id: userId,
		dataJson: { status: 'active' },
	});
}

// ✅ 好：批量更新
await updateMany({
	dbName: 'users',
	whereJson: { _id: { $in: userIds } },
	dataJson: { status: 'active' },
});
```

---

### 5. 时间戳管理

利用自动时间戳功能：

```javascript
// ✅ 好：自动添加时间戳
const userId = await add({
	dbName: 'users',
	dataJson: { name: 'John' },
});
// 自动添加 createdAt 和 updatedAt

// ✅ 好：自动更新时间戳
await update({
	dbName: 'users',
	_id: userId,
	dataJson: { name: 'John Updated' },
});
// 自动更新 updatedAt

// ⚠️ 特殊情况：不需要时间戳
const configId = await add({
	dbName: 'configs',
	dataJson: { key: 'value' },
	cancelAddTime: true, // 不添加时间戳
});
```

---

### 6. 事务处理

对于需要原子性的操作，考虑使用事务（需要 MongoDB 副本集）：

```javascript
import { connectToDatabase } from '@/lib/mongodb';

export async function transferCreditsAction(fromUserId, toUserId, amount) {
	const db = await connectToDatabase();
	const session = db.client.startSession();

	try {
		await session.withTransaction(async () => {
			// 减少发送方积分
			await inc({
				dbName: 'users',
				whereJson: { _id: fromUserId },
				fieldName: 'credits',
				num: -amount,
			});

			// 增加接收方积分
			await inc({
				dbName: 'users',
				whereJson: { _id: toUserId },
				fieldName: 'credits',
				num: amount,
			});

			// 记录转账
			await add({
				dbName: 'transactions',
				dataJson: {
					fromUserId,
					toUserId,
					amount,
					type: 'transfer',
				},
			});
		});

		return { success: true };
	} catch (error) {
		return { success: false, error: error.message };
	} finally {
		await session.endSession();
	}
}
```

---

## 常见问题

### Q1: DB API 和 BaseDAO 应该如何选择？

**A**: 根据场景选择：

- **DB API**：
  - 前端 Server Actions 中的查询
  - 简单的数据获取和统计
  - 不需要复杂验证的操作
  - 熟悉 MongoDB 语法的开发者

- **BaseDAO**：
  - 后台管理的标准 CRUD
  - 需要字段验证、权限控制
  - 需要生命周期钩子
  - 快速开发后台功能

**可以混合使用**：
```javascript
import { createCrudActions } from '@/app/(admin)/actions/dao/base';
import { count, sum } from '@/lib/db-api';

const userCrud = createCrudActions(userCrudConfig);

export const getUserListAction = userCrud.getList;
export const updateUserAction = userCrud.update;

// 自定义统计方法使用 DB API
export async function getUserStatsAction() {
	const totalUsers = await count({ dbName: 'users' });
	const totalCredits = await sum({
		dbName: 'users',
		fieldName: 'credits',
	});

	return { success: true, data: { totalUsers, totalCredits } };
}
```

---

### Q2: 如何处理 ObjectId？

**A**: DB API 自动处理 ObjectId 转换：

```javascript
// ✅ 传入字符串 ID 会自动转换
const user = await findById({
	dbName: 'users',
	_id: '507f1f77bcf86cd799439011', // 字符串
});

// ✅ 返回的数据中 ObjectId 自动转为字符串
console.log(user._id); // '507f1f77bcf86cd799439011'

// ✅ 查询条件中的 _id 自动处理
const users = await getList({
	dbName: 'users',
	whereJson: {
		_id: { $in: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'] },
	},
});
```

---

### Q3: 如何实现模糊搜索？

**A**: 使用 MongoDB 的正则表达式：

```javascript
// 不区分大小写的模糊搜索
const users = await getList({
	dbName: 'users',
	whereJson: {
		name: { $regex: 'john', $options: 'i' },
	},
});

// 搜索多个字段
const users = await getList({
	dbName: 'users',
	whereJson: {
		$or: [
			{ name: { $regex: keyword, $options: 'i' } },
			{ email: { $regex: keyword, $options: 'i' } },
			{ username: { $regex: keyword, $options: 'i' } },
		],
	},
});
```

---

### Q4: 如何处理大数据量查询？

**A**: 使用分页和限制：

```javascript
// ✅ 使用分页
const result = await getPage({
	dbName: 'posts',
	pageIndex: 1,
	pageSize: 20,
});

// ✅ 限制返回数量
const recentPosts = await getList({
	dbName: 'posts',
	sortJson: { createdAt: -1 },
	limit: 100,
});

// ❌ 避免不加限制的查询
const allPosts = await getList({
	dbName: 'posts', // 可能返回数万条记录
});
```

---

### Q5: 如何实现软删除？

**A**: 手动添加 deletedAt 字段：

```javascript
// 软删除
export async function softDeleteUserAction(userId) {
	await update({
		dbName: 'users',
		_id: userId,
		dataJson: {
			deletedAt: new Date(),
		},
	});
}

// 查询时过滤已删除数据
export async function getActiveUsersAction() {
	const users = await getList({
		dbName: 'users',
		whereJson: {
			$or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
		},
	});

	return { success: true, data: users };
}
```

如果需要自动软删除功能，建议使用 **BaseDAO**。

---

## 总结

DB API 提供了一套简洁、统一的数据库操作接口，适合：

- ✅ 熟悉 MongoDB 的开发者
- ✅ 需要灵活查询的场景
- ✅ 前端 Server Actions
- ✅ 简单的数据统计和聚合

与 BaseDAO 配合使用，可以覆盖大部分数据库操作场景，提高开发效率，减少重复代码。

**核心优势**：
- 统一的接口命名
- 自动时间戳管理
- ObjectId 自动转换
- 完全兼容 MongoDB 原生语法
- 丰富的聚合统计方法

**使用建议**：
- 简单场景用 DB API
- 复杂业务用 BaseDAO
- 两者混合使用，发挥各自优势

