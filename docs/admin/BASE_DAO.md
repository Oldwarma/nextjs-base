# BaseDAO 通用 CRUD 系统

## 概述

BaseDAO 是一个通用的数据访问对象（Data Access Object）系统，旨在减少后台管理 CRUD 操作的重复代码。通过配置化的方式，快速实现标准的增删改查功能。

## 核心特性

### 🎯 配置化开发

- **字段权限控制**：定义哪些字段可创建、可更新、可搜索
- **数据验证规则**：内置常用验证（必填、长度、正则、唯一性）+ 自定义验证
- **生命周期钩子**：在 CRUD 操作前后插入自定义逻辑
- **数据转换**：输入/输出数据自动转换
- **软删除支持**：默认启用软删除，防止数据丢失

### 🔒 安全机制

- **统一权限检查**：所有操作自动验证管理员权限
- **字段白名单**：只允许配置的字段被更新
- **防注入攻击**：使用 MongoDB 安全查询方式
- **唯一性验证**：自动检查字段唯一性

### ⚡ 开箱即用

- **标准 CRUD**：`getList`, `getDetail`, `create`, `update`, `delete`
- **批量操作**：`batchUpdate`, `batchDelete`
- **分页查询**：自动处理分页、排序、搜索
- **错误处理**：统一的错误捕获和返回格式

---

## 快速开始

### 1. 创建 CRUD 配置

在 `configs/` 目录下创建配置文件，例如 `user-crud.config.js`：

```javascript
export const userCrudConfig = {
	// 集合名称
	collectionName: 'users',
	
	// 主键字段（默认 'id'）
	primaryKey: 'id',
	
	// 字段配置
	fields: {
		// 可创建的字段
		creatable: ['name', 'email', 'role'],
		
		// 可更新的字段
		updatable: ['name', 'email', 'username', 'role', 'emailVerified'],
		
		// 可搜索的字段
		searchable: ['name', 'email', 'username'],
	},
	
	// 查询配置
	query: {
		defaultSort: { createdAt: -1 },
		defaultPageSize: 20,
		baseFilter: {}, // 始终应用的过滤条件
	},
	
	// 数据验证规则
	validation: {
		name: {
			required: true,
			minLength: 2,
			maxLength: 50,
		},
		email: {
			required: true,
			pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
			unique: true,
			message: 'Invalid email format',
		},
	},
	
	// 启用软删除（默认 true）
	softDelete: true,
};
```

### 2. 创建 Server Actions

在 `app/(admin)/actions/` 目录下创建 Actions 文件：

```javascript
'use server';

import { createCrudActions } from '@/@/(admin)/actions/dao/base';
import { userCrudConfig } from '@/configs/user-crud.config';

// 创建 CRUD Actions
const userCrud = createCrudActions(userCrudConfig);

// 导出标准方法
export async function getUserListAction(params) {
	return await userCrud.getList(params);
}

export async function getUserDetailAction(userId) {
	return await userCrud.getDetail(userId);
}

export async function updateUserInfoAction(userId, data) {
	return await userCrud.update(userId, data);
}

export async function deleteUserAction(userId) {
	return await userCrud.delete(userId);
}

export async function batchUpdateUsersAction(ids, data) {
	return await userCrud.batchUpdate(ids, data);
}

export async function batchDeleteUsersAction(ids) {
	return await userCrud.batchDelete(ids);
}
```

### 3. 在页面中使用

```javascript
'use client';

import { ProTable } from '@ant-design/pro-components';
import { getUserListAction, updateUserInfoAction, deleteUserAction } from '@/app/(admin)/actions';

export default function UsersPage() {
	const actionRef = useRef();
	
	// ProTable 请求数据
	const request = async (params, sort) => {
		const result = await getUserListAction({
			pageIndex: params.current,
			pageSize: params.pageSize,
			search: params.name || params.email,
			filters: {
				role: params.role,
			},
		});
		
		if (!result.success) {
			message.error(result.error);
			return { data: [], total: 0 };
		}
		
		return {
			data: result.data,
			total: result.total,
			success: true,
		};
	};
	
	// 保存更新
	const handleSave = async (values) => {
		const result = await updateUserInfoAction(currentRow.id, values);
		if (result.success) {
			message.success('Updated successfully');
			actionRef.current?.reload();
		} else {
			message.error(result.error);
		}
	};
	
	// 删除
	const handleDelete = async (id) => {
		const result = await deleteUserAction(id);
		if (result.success) {
			message.success('Deleted successfully');
			actionRef.current?.reload();
		} else {
			message.error(result.error);
		}
	};
	
	return (
		<ProTable
			columns={columns}
			actionRef={actionRef}
			request={request}
			// ...其他配置
		/>
	);
}
```

---

## 配置详解

### 1. 字段配置（fields）

#### creatable
定义哪些字段可以在创建时设置：

```javascript
fields: {
	creatable: ['name', 'email', 'role'],
}
```

#### updatable
定义哪些字段可以在更新时修改：

```javascript
fields: {
	updatable: ['name', 'email', 'username', 'role', 'emailVerified', 'banned'],
}
```

#### searchable
定义哪些字段可以被搜索（支持模糊搜索）：

```javascript
fields: {
	searchable: ['name', 'email', 'username'],
}
```

**工作原理**：
- `creatable` 和 `updatable` 是**白名单机制**，只有配置的字段才会被写入数据库
- `searchable` 用于构建 MongoDB 的 `$or` 查询，支持不区分大小写的正则匹配

---

### 2. 验证规则（validation）

BaseDAO 提供多种内置验证器：

#### 必填验证

```javascript
validation: {
	name: {
		required: true, // 仅在创建时检查
	},
}
```

#### 长度验证

```javascript
validation: {
	username: {
		minLength: 3,
		maxLength: 20,
		message: 'Username must be 3-20 characters',
	},
}
```

#### 正则验证

```javascript
validation: {
	email: {
		pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
		message: 'Invalid email format',
	},
}
```

#### 唯一性验证

```javascript
validation: {
	email: {
		unique: true, // 自动查询数据库检查是否存在
		message: 'Email already exists',
	},
}
```

**注意**：
- 更新时会自动排除当前记录，避免与自身冲突
- 唯一性验证会增加一次数据库查询

#### 自定义验证函数

```javascript
validation: {
	role: {
		validator: async (value, data) => {
			// data 是完整的输入数据对象
			return ['user', 'admin'].includes(value);
		},
		message: 'Invalid role',
	},
	
	age: {
		validator: async (value) => {
			return value >= 18 && value <= 120;
		},
		message: 'Age must be between 18 and 120',
	},
}
```

**验证顺序**：
1. 必填验证（`required`）
2. 长度验证（`minLength`, `maxLength`）
3. 正则验证（`pattern`）
4. 唯一性验证（`unique`）
5. 自定义验证（`validator`）

---

### 3. 生命周期钩子（hooks）

钩子函数允许在 CRUD 操作的不同阶段插入自定义逻辑。

#### beforeCreate

在创建记录前执行，可以修改数据：

```javascript
hooks: {
	beforeCreate: async (data) => {
		// 自动生成 ID
		data.id = generateId();
		
		// 加密密码
		if (data.password) {
			data.password = await hashPassword(data.password);
		}
		
		return data; // 必须返回数据
	},
}
```

#### afterCreate

在创建记录后执行，用于触发后续操作：

```javascript
hooks: {
	afterCreate: async (data, result) => {
		// 发送欢迎邮件
		await sendWelcomeEmail(data.email);
		
		// 记录操作日志
		await logAction('user_created', data.id);
	},
}
```

#### beforeUpdate

在更新记录前执行，可以修改数据和访问旧数据：

```javascript
hooks: {
	beforeUpdate: async (id, data, existing) => {
		// 如果修改了邮箱，重置验证状态
		if (data.email && data.email !== existing.email) {
			data.emailVerified = false;
		}
		
		// 邮箱转小写
		if (data.email) {
			data.email = data.email.toLowerCase();
		}
		
		return data;
	},
}
```

#### afterUpdate

在更新记录后执行：

```javascript
hooks: {
	afterUpdate: async (id, data, result) => {
		// 如果修改了角色，清除缓存
		if (data.role) {
			await clearUserCache(id);
		}
		
		// 通知用户
		await notifyUserUpdate(id);
	},
}
```

#### beforeDelete

在删除记录前执行，可以阻止删除：

```javascript
hooks: {
	beforeDelete: async (id, existing) => {
		// 检查是否有关联订单
		const ordersCount = await countUserOrders(id);
		if (ordersCount > 0) {
			return false; // 返回 false 阻止删除
		}
		
		return true; // 允许删除
	},
}
```

#### afterDelete

在删除记录后执行，清理关联数据：

```javascript
hooks: {
	afterDelete: async (id, deleted) => {
		// 删除用户的所有会话
		await deleteUserSessions(id);
		
		// 删除用户的所有图片
		await deleteUserImages(id);
		
		// 记录删除日志
		await logAction('user_deleted', id);
	},
}
```

#### 批量操作钩子

```javascript
hooks: {
	beforeBatchUpdate: async (ids, data) => {
		// 批量操作前的检查
		if (data.role === 'admin' && ids.length > 10) {
			throw new Error('Cannot set more than 10 users as admin at once');
		}
		return data;
	},
	
	afterBatchUpdate: async (ids, data, result) => {
		// 批量操作后的清理
		await clearMultipleUserCaches(ids);
	},
	
	beforeBatchDelete: async (ids) => {
		// 防止删除所有管理员
		const adminCount = await countAdmins();
		const deletingAdmins = await countAdmins({ id: { $in: ids } });
		
		if (adminCount - deletingAdmins < 1) {
			return false; // 阻止删除
		}
		
		return true;
	},
	
	afterBatchDelete: async (ids, result) => {
		// 批量清理关联数据
		await batchDeleteUserData(ids);
	},
}
```

---

### 4. 数据转换（transforms）

#### input 转换

在数据写入数据库前执行，处理类型转换、格式化等：

```javascript
transforms: {
	input: (data) => {
		// 布尔值转换
		if (data.emailVerified !== undefined) {
			data.emailVerified = data.emailVerified === true || data.emailVerified === 'true';
		}
		
		// 数字转换
		if (data.age !== undefined) {
			data.age = Number(data.age);
		}
		
		// 字符串处理
		if (data.email) {
			data.email = data.email.trim().toLowerCase();
		}
		
		return data;
	},
}
```

#### output 转换

在数据从数据库读取后执行，处理敏感信息、格式化等：

```javascript
transforms: {
	output: (data) => {
		// 移除敏感字段
		delete data.password;
		delete data.secretKey;
		
		// 日期格式化
		if (data.createdAt && !(data.createdAt instanceof Date)) {
			data.createdAt = new Date(data.createdAt);
		}
		
		// 计算虚拟字段
		data.fullName = `${data.firstName} ${data.lastName}`;
		
		return data;
	},
}
```

**执行时机**：
- `input` 在验证之前执行
- `output` 在查询结果返回前执行（`getList` 和 `getDetail`）

---

### 5. 查询配置（query）

#### defaultSort

默认排序规则：

```javascript
query: {
	defaultSort: { createdAt: -1 }, // 按创建时间倒序
	// 多字段排序
	defaultSort: { role: 1, createdAt: -1 },
}
```

#### defaultPageSize

默认分页大小：

```javascript
query: {
	defaultPageSize: 20, // 每页 20 条
}
```

#### baseFilter

始终应用的过滤条件，用于数据隔离：

```javascript
query: {
	// 只查询未被封禁的用户
	baseFilter: { banned: false },
	
	// 只查询特定租户的数据（多租户系统）
	baseFilter: { tenantId: 'xxx' },
}
```

---

### 6. 软删除（softDelete）

默认启用软删除，删除操作只会标记 `deletedAt` 字段，而不是真正删除数据：

```javascript
softDelete: true, // 默认值
```

**软删除的优势**：
- 数据可恢复
- 保留历史记录
- 防止误删除
- 符合数据保护法规

**查询行为**：
- `getList` 和 `getDetail` 自动过滤已删除的记录
- 已删除的记录不会出现在搜索结果中

**硬删除**：

如果需要真正删除数据，设置为 `false`：

```javascript
softDelete: false, // 启用硬删除
```

---

## API 参考

### BaseDAO 类

#### 构造函数

```javascript
import { BaseDAO } from '@/@/(admin)/actions/dao/base';

const dao = new BaseDAO(config);
```

#### 方法

##### getList(params)

获取列表（带分页）。

**参数**：
```javascript
{
	pageIndex: 1,           // 当前页码（从 1 开始）
	pageSize: 20,          // 每页条数
	search: 'keyword',     // 搜索关键词（在 searchable 字段中搜索）
	filters: {             // 额外过滤条件
		role: 'admin',
		emailVerified: true,
	},
	sort: {                // 自定义排序（覆盖 defaultSort）
		createdAt: -1,
	},
}
```

**返回**：
```javascript
{
	success: true,
	data: [...],           // 数据数组
	total: 100,            // 总记录数
	pageIndex: 1,          // 当前页码
	pageSize: 20,          // 每页条数
	totalPages: 5,         // 总页数
}
```

##### getDetail(id)

获取单条记录详情。

**参数**：
- `id`: 记录ID

**返回**：
```javascript
{
	success: true,
	data: {...},           // 记录数据
}
```

##### create(data)

创建新记录。

**参数**：
- `data`: 创建数据（只有 `creatable` 字段会被保留）

**返回**：
```javascript
{
	success: true,
	data: {...},           // 创建的记录
	message: 'Created successfully',
}
```

##### update(id, data)

更新记录。

**参数**：
- `id`: 记录ID
- `data`: 更新数据（只有 `updatable` 字段会被保留）

**返回**：
```javascript
{
	success: true,
	message: 'Updated successfully',
}
```

##### delete(id)

删除记录（软删除或硬删除，取决于配置）。

**参数**：
- `id`: 记录ID

**返回**：
```javascript
{
	success: true,
	message: 'Deleted successfully',
}
```

##### batchUpdate(ids, data)

批量更新记录。

**参数**：
- `ids`: 记录ID数组
- `data`: 更新数据

**返回**：
```javascript
{
	success: true,
	message: 'Updated 5 records',
	count: 5,              // 实际更新的记录数
}
```

##### batchDelete(ids)

批量删除记录。

**参数**：
- `ids`: 记录ID数组

**返回**：
```javascript
{
	success: true,
	message: 'Deleted 5 records',
	count: 5,              // 实际删除的记录数
}
```

---

### createCrudActions 工厂函数

简化 Server Actions 创建的工厂函数。

**使用方式**：

```javascript
import { createCrudActions } from '@/@/(admin)/actions/dao/base';

const crudActions = createCrudActions(config);

// 自动包含错误处理
export const getUserListAction = crudActions.getList;
export const getUserDetailAction = crudActions.getDetail;
export const updateUserAction = crudActions.update;
export const deleteUserAction = crudActions.delete;
```

**返回对象**：

```javascript
{
	getList: async (params) => {...},
	getDetail: async (id) => {...},
	create: async (data) => {...},
	update: async (id, data) => {...},
	delete: async (id) => {...},
	batchUpdate: async (ids, data) => {...},
	batchDelete: async (ids) => {...},
	dao: BaseDAO实例, // 用于自定义扩展
}
```

---

## 高级用法

### 1. 自定义扩展方法

通过 `dao` 实例扩展自定义方法：

```javascript
const userCrud = createCrudActions(userCrudConfig);

// 自定义方法：重置密码
export async function resetPasswordAction(userId) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return { success: false, error: 'Unauthorized' };
	}
	
	try {
		const usersCollection = await getCollection('users');
		const newPassword = generateRandomPassword();
		const hashedPassword = await hashPassword(newPassword);
		
		await usersCollection.updateOne(
			{ id: userId },
			{ $set: { password: hashedPassword, updatedAt: new Date() } }
		);
		
		// 发送邮件通知用户
		await sendPasswordResetEmail(userId, newPassword);
		
		return { success: true, message: 'Password reset successfully' };
	} catch (error) {
		return { success: false, error: error.message };
	}
}

// 自定义方法：获取用户统计
export async function getUserStatsAction(userId) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return { success: false, error: 'Unauthorized' };
	}
	
	try {
		const usersCollection = await getCollection('users');
		const generationsCollection = await getCollection('generations');
		
		const user = await usersCollection.findOne({ id: userId });
		const generationsCount = await generationsCollection.countDocuments({ userId });
		
		return {
			success: true,
			data: {
				...user,
				generationsCount,
			},
		};
	} catch (error) {
		return { success: false, error: error.message };
	}
}
```

### 2. 条件验证

根据不同场景应用不同的验证规则：

```javascript
validation: {
	email: {
		required: true,
		unique: true,
		validator: async (value, data) => {
			// 只在创建时验证域名
			if (data._action === 'create') {
				const domain = value.split('@')[1];
				const allowedDomains = ['company.com', 'example.com'];
				return allowedDomains.includes(domain);
			}
			return true;
		},
		message: 'Email must be from an allowed domain',
	},
}
```

### 3. 复杂的数据转换

```javascript
transforms: {
	input: (data) => {
		// 处理嵌套对象
		if (data.profile) {
			data.profile = JSON.stringify(data.profile);
		}
		
		// 处理数组
		if (data.tags) {
			data.tags = data.tags.filter(tag => tag.trim() !== '');
		}
		
		// 处理文件上传
		if (data.avatarFile) {
			data.avatarUrl = uploadFile(data.avatarFile);
			delete data.avatarFile;
		}
		
		return data;
	},
	
	output: (data) => {
		// 解析嵌套对象
		if (data.profile && typeof data.profile === 'string') {
			data.profile = JSON.parse(data.profile);
		}
		
		// 添加虚拟字段
		data.isActive = data.lastLoginAt && 
			(new Date() - new Date(data.lastLoginAt)) < 7 * 24 * 60 * 60 * 1000;
		
		return data;
	},
}
```

### 4. 多条件搜索

在页面中组合多个搜索条件：

```javascript
const request = async (params) => {
	const filters = {};
	
	// 角色筛选
	if (params.role) {
		filters.role = params.role;
	}
	
	// 验证状态筛选
	if (params.emailVerified !== undefined) {
		filters.emailVerified = params.emailVerified === 'true';
	}
	
	// 日期范围筛选
	if (params.startDate || params.endDate) {
		filters.createdAt = {};
		if (params.startDate) {
			filters.createdAt.$gte = new Date(params.startDate);
		}
		if (params.endDate) {
			filters.createdAt.$lte = new Date(params.endDate);
		}
	}
	
	const result = await getUserListAction({
		pageIndex: params.current,
		pageSize: params.pageSize,
		search: params.keyword,
		filters,
	});
	
	return {
		data: result.data,
		total: result.total,
		success: result.success,
	};
};
```

---

## 完整示例

### 配置文件：`configs/product-crud.config.js`

```javascript
export const productCrudConfig = {
	collectionName: 'products',
	primaryKey: 'id',
	
	fields: {
		creatable: ['name', 'description', 'price', 'category', 'stock', 'images'],
		updatable: ['name', 'description', 'price', 'category', 'stock', 'images', 'status'],
		searchable: ['name', 'description', 'category'],
	},
	
	query: {
		defaultSort: { createdAt: -1 },
		defaultPageSize: 20,
		baseFilter: {},
	},
	
	validation: {
		name: {
			required: true,
			minLength: 3,
			maxLength: 100,
		},
		price: {
			required: true,
			validator: async (value) => {
				return value > 0 && value < 1000000;
			},
			message: 'Price must be between 0 and 1,000,000',
		},
		stock: {
			required: true,
			validator: async (value) => {
				return Number.isInteger(value) && value >= 0;
			},
			message: 'Stock must be a non-negative integer',
		},
		category: {
			required: true,
			validator: async (value) => {
				const categories = ['electronics', 'clothing', 'food', 'books'];
				return categories.includes(value);
			},
			message: 'Invalid category',
		},
	},
	
	hooks: {
		beforeCreate: async (data) => {
			// 自动生成 SKU
			data.sku = generateSKU(data.category);
			
			// 初始化库存记录
			data.initialStock = data.stock;
			
			return data;
		},
		
		afterCreate: async (data, result) => {
			// 记录库存变动
			await logStockChange(data.id, 0, data.stock, 'Initial stock');
		},
		
		beforeUpdate: async (id, data, existing) => {
			// 如果修改了库存，记录变动
			if (data.stock !== undefined && data.stock !== existing.stock) {
				await logStockChange(id, existing.stock, data.stock, 'Manual adjustment');
			}
			
			// 如果价格变动超过 20%，需要审核
			if (data.price && Math.abs(data.price - existing.price) / existing.price > 0.2) {
				data.status = 'pending_review';
			}
			
			return data;
		},
		
		beforeDelete: async (id, existing) => {
			// 检查是否有未完成的订单
			const { getCollection } = await import('@/lib/mongodb');
			const ordersCollection = await getCollection('orders');
			
			const pendingOrders = await ordersCollection.countDocuments({
				productId: id,
				status: { $in: ['pending', 'processing'] },
			});
			
			if (pendingOrders > 0) {
				throw new Error(`Cannot delete product with ${pendingOrders} pending orders`);
			}
			
			return true;
		},
		
		afterDelete: async (id, deleted) => {
			// 删除产品图片
			if (deleted.images && deleted.images.length > 0) {
				await deleteImages(deleted.images);
			}
		},
	},
	
	transforms: {
		input: (data) => {
			// 价格保留两位小数
			if (data.price !== undefined) {
				data.price = Math.round(data.price * 100) / 100;
			}
			
			// 库存转整数
			if (data.stock !== undefined) {
				data.stock = Math.floor(Number(data.stock));
			}
			
			// 处理图片数组
			if (data.images && !Array.isArray(data.images)) {
				data.images = [data.images];
			}
			
			return data;
		},
		
		output: (data) => {
			// 添加虚拟字段：是否缺货
			data.isOutOfStock = data.stock === 0;
			
			// 添加虚拟字段：折扣价
			if (data.discount) {
				data.discountedPrice = data.price * (1 - data.discount / 100);
			}
			
			return data;
		},
	},
	
	softDelete: true,
};
```

### Server Actions：`app/(admin)/actions/admin-products.js`

```javascript
'use server';

import { createCrudActions } from '@/@/(admin)/actions/dao/base';
import { productCrudConfig } from '@/configs/product-crud.config';
import { checkAdminAction } from '@/lib/admin-auth';

const productCrud = createCrudActions(productCrudConfig);

export async function getProductListAction(params) {
	return await productCrud.getList(params);
}

export async function getProductDetailAction(id) {
	return await productCrud.getDetail(id);
}

export async function createProductAction(data) {
	return await productCrud.create(data);
}

export async function updateProductAction(id, data) {
	return await productCrud.update(id, data);
}

export async function deleteProductAction(id) {
	return await productCrud.delete(id);
}

export async function batchUpdateProductsAction(ids, data) {
	return await productCrud.batchUpdate(ids, data);
}

export async function batchDeleteProductsAction(ids) {
	return await productCrud.batchDelete(ids);
}

// 自定义方法：批量上架
export async function batchPublishProductsAction(ids) {
	return await productCrud.batchUpdate(ids, { status: 'published' });
}

// 自定义方法：批量下架
export async function batchUnpublishProductsAction(ids) {
	return await productCrud.batchUpdate(ids, { status: 'draft' });
}

// 自定义方法：调整库存
export async function adjustStockAction(id, quantity, reason) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return { success: false, error: 'Unauthorized' };
	}
	
	try {
		const { getCollection } = await import('@/lib/mongodb');
		const productsCollection = await getCollection('products');
		
		const product = await productsCollection.findOne({ id });
		if (!product) {
			throw new Error('Product not found');
		}
		
		const newStock = product.stock + quantity;
		if (newStock < 0) {
			throw new Error('Insufficient stock');
		}
		
		await productsCollection.updateOne(
			{ id },
			{ $set: { stock: newStock, updatedAt: new Date() } }
		);
		
		// 记录库存变动
		await logStockChange(id, product.stock, newStock, reason);
		
		return {
			success: true,
			message: 'Stock adjusted successfully',
			data: { oldStock: product.stock, newStock },
		};
	} catch (error) {
		return { success: false, error: error.message };
	}
}
```

---

## 最佳实践

### 1. 配置文件组织

**推荐目录结构**：

```
configs/
├── user-crud.config.js
├── product-crud.config.js
├── order-crud.config.js
└── package-crud.config.js
```

**命名规范**：
- 文件名：`{entity}-crud.config.js`
- 导出变量：`{entity}CrudConfig`

### 2. 字段权限设计

**原则**：
- `creatable` 通常包含业务必需字段
- `updatable` 排除系统自动生成的字段（如 `id`, `createdAt`）
- `searchable` 选择用户最常搜索的字段（3-5个）

**示例**：
```javascript
fields: {
	// ❌ 不要包含系统字段
	creatable: ['id', 'createdAt', 'name'], // 错误
	
	// ✅ 只包含业务字段
	creatable: ['name', 'email', 'role'], // 正确
	
	// ❌ 不要包含敏感字段
	updatable: ['password', 'secretKey'], // 错误（应通过专门的方法处理）
	
	// ✅ 只包含可安全修改的字段
	updatable: ['name', 'email', 'role'], // 正确
}
```

### 3. 验证规则设计

**原则**：
- 验证规则应与数据库约束一致
- 优先使用内置验证器，复杂逻辑使用自定义验证
- 错误消息要清晰易懂

**示例**：
```javascript
validation: {
	email: {
		required: true,
		pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
		unique: true,
		message: 'Invalid email or email already registered',
	},
	
	// ✅ 简单验证用内置验证器
	username: {
		minLength: 3,
		maxLength: 20,
		pattern: /^[a-zA-Z0-9_]+$/,
	},
	
	// ✅ 复杂验证用自定义函数
	age: {
		validator: async (value, data) => {
			if (data.role === 'admin') {
				return value >= 21; // 管理员至少 21 岁
			}
			return value >= 18; // 普通用户至少 18 岁
		},
		message: 'Age requirement not met',
	},
}
```

### 4. 钩子使用原则

**原则**：
- 钩子应保持简单，避免复杂的业务逻辑
- 异步操作优先在 `after*` 钩子中执行
- `before*` 钩子中避免耗时操作

**示例**：
```javascript
hooks: {
	// ✅ beforeCreate 做简单的数据准备
	beforeCreate: async (data) => {
		data.id = generateId();
		data.status = 'active';
		return data;
	},
	
	// ✅ afterCreate 做异步通知
	afterCreate: async (data) => {
		// 不阻塞主流程
		sendWelcomeEmail(data.email).catch(console.error);
	},
	
	// ❌ 不要在 beforeCreate 中做耗时操作
	beforeCreate: async (data) => {
		// 错误：这会拖慢创建速度
		await uploadLargeFile(data.avatar);
		return data;
	},
}
```

### 5. 错误处理

**原则**：
- 使用 `try-catch` 包裹自定义方法
- 返回统一的错误格式
- 记录错误日志

**示例**：
```javascript
export async function customAction(params) {
	try {
		// 业务逻辑
		const result = await doSomething(params);
		return { success: true, data: result };
	} catch (error) {
		console.error('customAction error:', error);
		return { 
			success: false, 
			error: error.message || 'An error occurred',
		};
	}
}
```

---

## 常见问题

### Q1: 如何禁用软删除？

**A**: 在配置中设置 `softDelete: false`：

```javascript
export const config = {
	collectionName: 'logs',
	softDelete: false, // 启用硬删除
	// ...
};
```

### Q2: 如何添加自定义查询方法？

**A**: 通过 `dao` 实例扩展：

```javascript
const crudActions = createCrudActions(config);

export async function getActiveUsersAction() {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return { success: false, error: 'Unauthorized' };
	}
	
	try {
		const collection = await getCollection('users');
		const users = await collection.find({
			status: 'active',
			lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
		}).toArray();
		
		return { success: true, data: users };
	} catch (error) {
		return { success: false, error: error.message };
	}
}
```

### Q3: 如何处理关联数据？

**A**: 在钩子中处理关联查询和操作：

```javascript
hooks: {
	afterCreate: async (data, result) => {
		// 创建用户后，初始化积分账户
		const creditsCollection = await getCollection('credits');
		await creditsCollection.insertOne({
			userId: data.id,
			balance: 0,
			createdAt: new Date(),
		});
	},
	
	beforeDelete: async (id, existing) => {
		// 删除前检查关联数据
		const ordersCollection = await getCollection('orders');
		const orderCount = await ordersCollection.countDocuments({ userId: id });
		
		if (orderCount > 0) {
			throw new Error('Cannot delete user with existing orders');
		}
		
		return true;
	},
	
	afterDelete: async (id, deleted) => {
		// 删除后清理关联数据
		const sessionsCollection = await getCollection('sessions');
		await sessionsCollection.deleteMany({ userId: id });
	},
}
```

### Q4: 如何实现数据权限隔离（多租户）？

**A**: 使用 `baseFilter` 实现租户隔离：

```javascript
export const config = {
	collectionName: 'products',
	query: {
		// 始终过滤当前租户的数据
		baseFilter: { tenantId: 'current-tenant-id' },
	},
	hooks: {
		beforeCreate: async (data) => {
			// 自动添加租户 ID
			data.tenantId = 'current-tenant-id';
			return data;
		},
	},
	// ...
};
```

### Q5: 如何处理文件上传？

**A**: 在 `transforms.input` 中处理文件上传：

```javascript
transforms: {
	input: async (data) => {
		// 处理头像上传
		if (data.avatarFile) {
			const uploadedUrl = await uploadToS3(data.avatarFile);
			data.avatarUrl = uploadedUrl;
			delete data.avatarFile; // 移除文件对象
		}
		
		// 处理多文件上传
		if (data.imageFiles && Array.isArray(data.imageFiles)) {
			const urls = await Promise.all(
				data.imageFiles.map(file => uploadToS3(file))
			);
			data.imageUrls = urls;
			delete data.imageFiles;
		}
		
		return data;
	},
}
```

### Q6: 如何记录操作日志？

**A**: 在钩子中记录操作：

```javascript
hooks: {
	afterCreate: async (data, result) => {
		await logAction('create', 'users', data.id, data);
	},
	
	afterUpdate: async (id, data, result) => {
		await logAction('update', 'users', id, data);
	},
	
	afterDelete: async (id, deleted) => {
		await logAction('delete', 'users', id, deleted);
	},
}

// 日志记录函数
async function logAction(action, collection, recordId, data) {
	const logsCollection = await getCollection('operation_logs');
	await logsCollection.insertOne({
		action,
		collection,
		recordId,
		data,
		userId: 'admin-user-id', // 从 session 获取
		createdAt: new Date(),
	});
}
```

---

## 与现有系统集成

### 1. 保留自定义逻辑

BaseDAO 不强制替换所有现有代码，可以混合使用：

```javascript
'use server';

import { createCrudActions } from '@/@/(admin)/actions/dao/base';
import { userCrudConfig } from '@/configs/user-crud.config';
import { getUserStatistics } from '@/lib/user-profile';

// 使用 BaseDAO 处理标准 CRUD
const userCrud = createCrudActions(userCrudConfig);

export const getUserListAction = userCrud.getList;
export const updateUserInfoAction = userCrud.update;
export const deleteUserAction = userCrud.delete;

// 保留自定义的复杂逻辑
export async function getUserDashboardAction(userId) {
	// 自定义实现
	const stats = await getUserStatistics(userId);
	const recentActivity = await getUserRecentActivity(userId);
	
	return {
		success: true,
		data: { stats, recentActivity },
	};
}
```

### 2. 逐步迁移

**建议迁移顺序**：
1. 先迁移简单的数据表（如配置表、字典表）
2. 再迁移用户、产品等核心表
3. 最后迁移订单、支付等复杂业务表

**迁移步骤**：
1. 创建配置文件
2. 创建新的 Action（带 `v2` 后缀）
3. 在页面中切换到新 Action
4. 测试验证
5. 删除旧 Action

---

## 性能优化

### 1. 索引优化

确保 `searchable` 和 `unique` 字段有索引：

```javascript
// 在 MongoDB 中创建索引
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ name: 'text', username: 'text' }); // 全文索引
db.users.createIndex({ createdAt: -1 }); // 排序索引
```

### 2. 查询优化

避免在钩子中进行大量查询：

```javascript
// ❌ 不好：在循环中查询
afterCreate: async (data) => {
	for (const friendId of data.friendIds) {
		const friend = await getUserById(friendId); // N+1 查询
		await notifyFriend(friend);
	}
}

// ✅ 好：批量查询
afterCreate: async (data) => {
	const friends = await getUsersByIds(data.friendIds); // 一次查询
	await Promise.all(friends.map(notifyFriend));
}
```

### 3. 分页优化

对于大数据量，使用游标分页而非偏移分页：

```javascript
// 自定义分页方法
export async function getUsersWithCursorAction(cursor, limit = 20) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return { success: false, error: 'Unauthorized' };
	}
	
	try {
		const collection = await getCollection('users');
		const query = cursor ? { _id: { $gt: cursor } } : {};
		
		const users = await collection
			.find(query)
			.sort({ createdAt: 1 })
			.limit(limit + 1)
			.toArray();
		
		const hasMore = users.length > limit;
		const data = hasMore ? users.slice(0, limit) : users;
		const nextCursor = hasMore ? data[data.length - 1]._id : null;
		
		return {
			success: true,
			data,
			nextCursor,
			hasMore,
		};
	} catch (error) {
		return { success: false, error: error.message };
	}
}
```

---

## 总结

BaseDAO 系统通过配置化的方式，大幅减少了后台管理 CRUD 操作的重复代码，同时保持了足够的灵活性。

**核心优势**：
- ✅ **减少重复代码**：标准 CRUD 只需几行配置
- ✅ **统一规范**：所有数据表遵循相同的开发模式
- ✅ **易于维护**：配置集中管理，修改方便
- ✅ **扩展性强**：支持钩子、转换、自定义方法
- ✅ **类型安全**：字段白名单机制，防止意外修改
- ✅ **安全可靠**：内置权限检查、数据验证

**适用场景**：
- ✅ 后台管理的标准 CRUD 操作
- ✅ 数据字典、配置表管理
- ✅ 用户、产品、订单等常见实体管理

**不适用场景**：
- ❌ 复杂的多表联查
- ❌ 需要事务的业务逻辑
- ❌ 实时性要求极高的操作

对于不适用的场景，建议保留自定义实现，或通过 `dao` 实例扩展自定义方法。

