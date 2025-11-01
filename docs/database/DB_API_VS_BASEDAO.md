# DB API vs BaseDAO 使用指南

本文档帮助你在 **DB API** 和 **BaseDAO** 之间做出正确选择。

---

## 快速决策

### 你应该使用 DB API 如果...

- ✅ 你在编写**前端 Server Actions**
- ✅ 你需要**简单的数据查询或统计**
- ✅ 你**熟悉 MongoDB 语法**
- ✅ 你不需要复杂的验证和权限控制
- ✅ 你需要灵活的查询条件

### 你应该使用 BaseDAO 如果...

- ✅ 你在编写**后台管理功能**
- ✅ 你需要**标准的 CRUD 操作**
- ✅ 你需要**字段验证、唯一性检查**
- ✅ 你需要**生命周期钩子**（beforeCreate, afterUpdate 等）
- ✅ 你需要**软删除功能**
- ✅ 你想快速开发，减少重复代码

---

## 详细对比

| 特性 | DB API | BaseDAO |
|------|--------|---------|
| **使用场景** | 前端 Server Actions，灵活查询 | 后台管理 CRUD，标准业务流程 |
| **配置方式** | 无需配置，直接调用 | 需要配置文件（字段、验证、钩子） |
| **学习曲线** | 低（熟悉 MongoDB 即可） | 中（需要理解配置规则） |
| **代码量** | 少（每次调用几行代码） | 极少（配置一次，多处使用） |
| **权限控制** | 手动检查 | 自动检查管理员权限 |
| **数据验证** | 手动验证 | 自动验证（必填、长度、正则、唯一性） |
| **字段过滤** | 手动过滤 | 自动过滤（creatable/updatable 白名单） |
| **时间戳** | 自动添加 | 自动添加 |
| **生命周期钩子** | 无 | 有（beforeCreate, afterUpdate, beforeDelete 等） |
| **软删除** | 需手动实现 | 内置支持 |
| **分页查询** | 支持 | 支持 |
| **连表查询** | 支持 | 支持 |
| **聚合统计** | 支持（sum, avg, max, min） | 需自定义 |
| **批量操作** | 支持 | 支持 |
| **数据转换** | 手动转换 | 自动转换（input/output transforms） |
| **灵活性** | 高（完全自定义） | 中（受配置限制） |
| **适用人群** | 熟悉 MongoDB 的开发者 | 需要快速开发的开发者 |

---

## 使用场景示例

### 场景 1：用户查询积分

**需求**：前端页面展示用户当前积分

**推荐方案**：**DB API**

**理由**：
- 简单查询，不需要验证
- 前端 Server Action
- 权限检查由 auth session 完成

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

		return {
			success: true,
			data: { credits: user.credits },
		};
	} catch (error) {
		return { success: false, error: error.message };
	}
}
```

---

### 场景 2：管理员管理用户

**需求**：后台管理界面的用户 CRUD

**推荐方案**：**BaseDAO**

**理由**：
- 标准 CRUD 操作
- 需要管理员权限检查
- 需要字段验证（邮箱唯一性等）
- 需要软删除
- 可能需要钩子（如删除时清理关联数据）

```javascript
// configs/user-crud.config.js
export const userCrudConfig = {
	collectionName: 'users',
	primaryKey: '_id',
	
	fields: {
		creatable: ['name', 'email', 'role'],
		updatable: ['name', 'email', 'role', 'emailVerified'],
		searchable: ['name', 'email', 'username'],
	},
	
	validation: {
		email: {
			required: true,
			pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
			unique: true,
		},
	},
	
	softDelete: true,
};

// admin-users.js
import { createCrudActions } from '@/app/(admin)/actions/dao/base';
import { userCrudConfig } from './configs/user-crud.config';

const userCrud = createCrudActions(userCrudConfig);

export const getUserListAction = userCrud.getList;
export const updateUserInfoAction = userCrud.update;
export const deleteUserAction = userCrud.delete;
```

---

### 场景 3：统计分析

**需求**：生成数据统计报表

**推荐方案**：**DB API**

**理由**：
- 需要聚合查询（sum, avg, count）
- 需要灵活的查询条件
- BaseDAO 不提供聚合统计方法

```javascript
'use server';

import { count, sum, avg } from '@/lib/db-api';
import { checkAdminAction } from '@/lib/admin-auth';

export async function getRevenueStatsAction() {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return { success: false, error: adminCheck.error };
	}

	try {
		const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

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

		const avgOrderAmount = await avg({
			dbName: 'orders',
			fieldName: 'amount',
			whereJson: { status: 'paid' },
		});

		return {
			success: true,
			data: {
				totalRevenue,
				monthlyRevenue,
				avgOrderAmount,
			},
		};
	} catch (error) {
		return { success: false, error: error.message };
	}
}
```

---

### 场景 4：复杂业务逻辑

**需求**：用户购买套餐（涉及订单创建、积分增加、交易记录）

**推荐方案**：**DB API**

**理由**：
- 涉及多个表操作
- 需要事务性（原子性）
- 业务逻辑复杂，不适合配置化
- BaseDAO 更适合单表 CRUD

```javascript
'use server';

import { add, inc, getOne } from '@/lib/db-api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function purchasePackageAction(packageId) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		return { success: false, error: 'Unauthorized' };
	}

	try {
		// 1. 获取套餐信息
		const packageInfo = await getOne({
			dbName: 'packages',
			whereJson: { _id: packageId, enabled: true },
		});

		if (!packageInfo) {
			return { success: false, error: 'Package not found' };
		}

		// 2. 创建订单
		const orderId = await add({
			dbName: 'orders',
			dataJson: {
				userId: session.user.id,
				packageId: packageInfo._id,
				amount: packageInfo.price,
				status: 'paid',
			},
		});

		// 3. 增加积分
		await inc({
			dbName: 'users',
			whereJson: { _id: session.user.id },
			fieldName: 'credits',
			num: packageInfo.credits,
		});

		// 4. 记录交易
		await add({
			dbName: 'credit_transactions',
			dataJson: {
				userId: session.user.id,
				type: 'recharge',
				amount: packageInfo.credits,
				orderId,
			},
		});

		return {
			success: true,
			data: { orderId, credits: packageInfo.credits },
		};
	} catch (error) {
		return { success: false, error: error.message };
	}
}
```

---

## 混合使用示例

你可以在同一个 Actions 文件中混合使用两者：

```javascript
'use server';

import { createCrudActions } from '@/app/(admin)/actions/dao/base';
import { userCrudConfig } from './configs/user-crud.config';
import { count, sum, aggregate } from '@/lib/db-api';

// 使用 BaseDAO 处理标准 CRUD
const userCrud = createCrudActions(userCrudConfig);

export const getUserListAction = userCrud.getList;
export const updateUserInfoAction = userCrud.update;
export const deleteUserAction = userCrud.delete;

// 使用 DB API 处理统计查询
export async function getUserStatsAction(userId) {
	try {
		const totalGenerations = await count({
			dbName: 'generations',
			whereJson: { userId },
		});

		const totalSpent = await sum({
			dbName: 'credit_transactions',
			fieldName: 'amount',
			whereJson: {
				userId,
				type: 'consume',
			},
		});

		const generationsByType = await aggregate({
			dbName: 'generations',
			whereJson: { userId },
			groupJson: {
				_id: '$type',
				count: { $sum: 1 },
			},
		});

		return {
			success: true,
			data: {
				totalGenerations,
				totalSpent: Math.abs(totalSpent),
				generationsByType,
			},
		};
	} catch (error) {
		return { success: false, error: error.message };
	}
}
```

---

## 迁移指南

### 从直接 MongoDB 操作迁移到 DB API

**之前（直接使用 MongoDB）**：
```javascript
import { getCollection } from '@/lib/mongodb';

const collection = await getCollection('users');
const user = await collection.findOne({ email: 'test@example.com' });
```

**之后（使用 DB API）**：
```javascript
import { getOne } from '@/lib/db-api';

const user = await getOne({
	dbName: 'users',
	whereJson: { email: 'test@example.com' },
});
```

**优势**：
- 统一的参数命名
- 自动处理 ObjectId 转换
- 更简洁的代码

---

### 从 DB API 迁移到 BaseDAO

如果你发现某个功能需要频繁的验证、权限检查和钩子，可以迁移到 BaseDAO：

**之前（使用 DB API）**：
```javascript
export async function updateUserAction(userId, data) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return { success: false, error: adminCheck.error };
	}

	// 验证邮箱
	if (data.email) {
		const emailExists = await exists({
			dbName: 'users',
			whereJson: {
				email: data.email,
				_id: { $ne: userId },
			},
		});

		if (emailExists) {
			return { success: false, error: 'Email already in use' };
		}
	}

	// 更新用户
	await update({
		dbName: 'users',
		_id: userId,
		dataJson: data,
	});

	return { success: true };
}
```

**之后（使用 BaseDAO）**：
```javascript
// configs/user-crud.config.js
export const userCrudConfig = {
	collectionName: 'users',
	fields: {
		updatable: ['name', 'email', 'role'],
	},
	validation: {
		email: {
			unique: true, // 自动检查唯一性
		},
	},
};

// admin-users.js
const userCrud = createCrudActions(userCrudConfig);
export const updateUserAction = userCrud.update; // 自动包含权限检查和验证
```

**优势**：
- 减少重复代码
- 自动权限检查
- 自动唯一性验证
- 更易维护

---

## 常见问题

### Q1: 我可以同时使用两者吗？

**A**: 当然可以！它们是互补的：

- **BaseDAO** 用于标准 CRUD
- **DB API** 用于复杂查询和统计

```javascript
import { createCrudActions } from '@/app/(admin)/actions/dao/base';
import { count, sum } from '@/lib/db-api';

const userCrud = createCrudActions(userCrudConfig);

export const getUserListAction = userCrud.getList; // BaseDAO
export const getUserCountAction = () => count({ dbName: 'users' }); // DB API
```

---

### Q2: BaseDAO 能做聚合查询吗？

**A**: BaseDAO 主要用于 CRUD，不提供聚合方法。如需聚合查询，使用 DB API：

```javascript
import { sum, avg, aggregate } from '@/lib/db-api';

const totalRevenue = await sum({
	dbName: 'orders',
	fieldName: 'amount',
	whereJson: { status: 'paid' },
});
```

---

### Q3: DB API 支持软删除吗？

**A**: DB API 不内置软删除，需要手动实现：

```javascript
// 软删除
await update({
	dbName: 'users',
	_id: userId,
	dataJson: { deletedAt: new Date() },
});

// 查询时过滤已删除
const users = await getList({
	dbName: 'users',
	whereJson: {
		$or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
	},
});
```

如果需要自动软删除，推荐使用 **BaseDAO**。

---

### Q4: 如何选择分页查询方式？

**BaseDAO 分页**：
- 适合后台管理列表
- 自动处理搜索、过滤、排序
- 自动过滤已删除数据

```javascript
const result = await userCrud.getList({
	pageIndex: 1,
	pageSize: 20,
	search: 'john',
	filters: { role: 'admin' },
});
```

**DB API 分页**：
- 适合前端数据展示
- 需要手动构建查询条件
- 更灵活

```javascript
const result = await getPage({
	dbName: 'posts',
	whereJson: {
		status: 'published',
		category: 'tech',
	},
	pageIndex: 1,
	pageSize: 20,
	sortJson: { publishedAt: -1 },
});
```

---

### Q5: 性能有差异吗？

**A**: 没有显著差异，它们底层都使用相同的 MongoDB 驱动：

- **BaseDAO** 多了配置处理和验证逻辑，但开销很小
- **DB API** 更接近原生操作，代码路径更短

**性能关键因素**：
- 数据库索引
- 查询条件优化
- 分页大小控制
- 避免 N+1 查询

---

## 决策流程图

```
开始
  ↓
是否是后台管理 CRUD？
  ├─ 是 → 使用 BaseDAO
  └─ 否 ↓
      是否需要聚合统计？
        ├─ 是 → 使用 DB API
        └─ 否 ↓
            是否需要复杂验证和钩子？
              ├─ 是 → 使用 BaseDAO
              └─ 否 → 使用 DB API
```

---

## 总结

### DB API 的优势

- ✅ 灵活，适合复杂查询
- ✅ 简单，学习成本低
- ✅ 强大的聚合统计功能
- ✅ 适合前端 Server Actions

### BaseDAO 的优势

- ✅ 配置化，减少重复代码
- ✅ 自动验证和权限控制
- ✅ 生命周期钩子
- ✅ 软删除支持
- ✅ 适合后台管理 CRUD

### 推荐策略

| 场景 | 推荐方案 |
|------|----------|
| 前端数据查询 | DB API |
| 后台管理 CRUD | BaseDAO |
| 统计分析 | DB API |
| 复杂业务逻辑 | DB API |
| 标准 CRUD + 验证 | BaseDAO |

**最佳实践**：根据具体场景选择合适的工具，必要时混合使用，发挥各自优势。

