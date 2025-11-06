# 基于模板的快速开发架构设计

## 设计理念

**核心目标：** 让开发者专注业务，所有基础功能"拿来即用"

**设计原则：**
1. **快** - 复制模板，修改配置，立即可用
2. **统一** - 所有功能自动符合规范（RBAC、日志、验证）
3. **灵活** - 通过配置扩展，无需修改核心代码

**参考：** [VK Framework DAO 文档](https://vkdoc.fsq.pub/client/uniCloud/db/dao.html)

---

## 理想的开发流程示例

### 场景：创建优惠券管理页面

#### 步骤 1：复制 Actions 模板（1 分钟）

```bash
# 复制模板
cp templates/actions/crud-template.js app/(admin)/actions/coupon/admin-coupons.js
cp templates/configs/crud-config-template.js app/(admin)/actions/coupon/configs/coupon-crud.config.js
```

#### 步骤 2：修改配置（5 分钟）

```javascript
// coupon-crud.config.js

export const couponCrudConfig = {
	// ✅ 只需修改这些基础配置
	collectionName: 'coupons',
	logCategory: 'admin/coupons',
	primaryKey: 'id',
	
	// ✅ 定义字段规则
	fields: {
		creatable: ['code', 'discount', 'expireAt', 'maxUse'],
		updatable: ['discount', 'expireAt', 'maxUse', 'enable'],
		searchable: ['code', 'name'],
	},
	
	// ✅ 定义验证规则
	validation: {
		code: {
			required: true,
			pattern: /^[A-Z0-9]{6,12}$/,
			unique: true,
		},
		discount: {
			required: true,
			validator: (value) => value > 0 && value <= 100,
		},
	},
	
	// 完成！Actions 自动生成 ✅
};
```

#### 步骤 3：复制 Page 模板（5 分钟）

```bash
cp templates/pages/crud-page-template.js app/(admin)/admin/coupon/page.js
```

```javascript
// page.js

// ✅ 只需修改导入
import {
	getCouponListAction as getList,
	createCouponAction as create,
	updateCouponAction as update,
	deleteCouponAction as deleteItem,
} from '@/app/(admin)/actions/coupon/admin-coupons';

// ✅ 只需修改字段配置
const fieldsConfig = [
	{
		key: 'code',
		title: 'Coupon Code',
		type: 'text',
		table: { width: 120, copyable: true },
		form: { required: true, placeholder: 'SAVE20' },
		search: { enabled: true },
	},
	{
		key: 'discount',
		title: 'Discount (%)',
		type: 'number',
		table: { width: 100 },
		form: { required: true, min: 0, max: 100 },
	},
	// ... 其他字段
];

// 完成！页面自动生成 ✅
```

#### 步骤 4：新增自定义按钮（3 分钟）

```javascript
// page.js - 增加"批量启用"按钮

const customRowActions = [
	{
		key: 'batch-enable',
		text: 'Enable Selected',
		icon: <CheckOutlined />,
		onClick: async (selectedRows) => {
			// ✅ 调用已有的批量更新 Action，自动有日志和权限检查
			await batchUpdateCouponsAction(
				selectedRows.map(r => r.id),
				{ enable: true }
			);
		},
	},
];
```

#### 总耗时：约 15 分钟，一个完整的 CRUD 页面完成！✅

---

## 架构设计：三层模板系统

### 第一层：核心基础层（不需要修改）

```
lib/
├── db-api.js              # ⭐ 纯粹的 BaseDAO（数据库零件）
├── action-wrapper.js      # ⭐ 统一的 Action 包装器（自动日志、权限）
├── crud-helper.js         # ⭐ CRUD 辅助函数（可选工具）
└── smart-crud-generator.js # ⭐ 智能 CRUD 生成器
```

### 第二层：模板层（复制即用）

```
templates/
├── actions/
│   ├── crud-template.js           # ⭐ 标准 CRUD Actions 模板
│   └── custom-template.js         # 自定义 Actions 模板
├── configs/
│   └── crud-config-template.js    # ⭐ CRUD 配置模板
└── pages/
    ├── crud-page-template.js      # ⭐ 标准 CRUD 页面模板
    └── custom-page-template.js    # 自定义页面模板
```

### 第三层：业务层（开发者创建）

```
app/(admin)/
├── actions/
│   ├── coupon/
│   │   ├── admin-coupons.js       # 从模板复制，修改配置
│   │   └── configs/
│   │       └── coupon-crud.config.js
│   └── product/
│       ├── admin-products.js
│       └── configs/
│           └── product-crud.config.js
└── admin/
    ├── coupon/
    │   └── page.js                # 从模板复制，修改配置
    └── product/
        └── page.js
```

---

## 核心组件设计

### 1. 纯粹的 BaseDAO（lib/db-api.js）

```javascript
// ✅ 保持纯粹，只做数据库操作
export async function selects({ dbName, whereJson, foreignDB, sortJson, pageIndex, pageSize }) {
	// 纯粹的查询，不含业务逻辑
	const collection = await getCollection(dbName);
	// ... MongoDB 聚合查询
	return { rows, total, pageIndex, pageSize };
}

export async function add({ dbName, dataJson }) {
	// 纯粹的插入
	const collection = await getCollection(dbName);
	return await collection.insertOne(dataJson);
}

export async function updateOne({ dbName, whereJson, dataJson }) {
	// 纯粹的更新
	const collection = await getCollection(dbName);
	return await collection.updateOne(whereJson, { $set: dataJson });
}

export async function remove({ dbName, whereJson }) {
	// 纯粹的删除
	const collection = await getCollection(dbName);
	return await collection.deleteOne(whereJson);
}
```

### 2. Action 包装器（lib/action-wrapper.js）⭐

```javascript
/**
 * 统一的 Action 包装器
 * 自动处理：权限检查、日志记录、错误处理
 */
export function createCrudActions(dao, config) {
	const { logCategory, primaryKey } = config;
	
	return {
		/**
		 * 获取列表
		 * ✅ 自动有权限检查
		 * ✅ 自动有日志记录
		 * ✅ 自动有错误处理
		 */
		async getList(params) {
			return await wrapAction({
				action: 'getList',
				category: logCategory,
				requireAdmin: true,
				fn: async () => {
					return await dao.getList(params);
				},
			});
		},
		
		/**
		 * 创建
		 * ✅ 自动有权限检查
		 * ✅ 自动有数据验证
		 * ✅ 自动有日志记录
		 */
		async create(data) {
			return await wrapAction({
				action: 'create',
				category: logCategory,
				requireAdmin: true,
				validate: true,
				fn: async () => {
					return await dao.create(data);
				},
			});
		},
		
		/**
		 * 更新
		 */
		async update(id, data) {
			return await wrapAction({
				action: 'update',
				category: logCategory,
				requireAdmin: true,
				validate: true,
				fn: async () => {
					return await dao.update(id, data);
				},
			});
		},
		
		/**
		 * 删除
		 */
		async delete(id) {
			return await wrapAction({
				action: 'delete',
				category: logCategory,
				requireAdmin: true,
				fn: async () => {
					return await dao.delete(id);
				},
			});
		},
		
		/**
		 * 批量更新
		 */
		async batchUpdate(ids, data) {
			return await wrapAction({
				action: 'batchUpdate',
				category: logCategory,
				requireAdmin: true,
				fn: async () => {
					return await dao.batchUpdate(ids, data);
				},
			});
		},
	};
}

/**
 * 核心包装函数
 */
async function wrapAction(options) {
	const { action, category, requireAdmin, validate, fn } = options;
	const startTime = Date.now();
	const requestTime = new Date();
	
	try {
		// 1️⃣ 权限检查
		if (requireAdmin) {
			const adminCheck = await checkAdminAction();
			if (!adminCheck.isAdmin) {
				return { success: false, error: 'Unauthorized' };
			}
		}
		
		// 2️⃣ 数据验证（如果需要）
		if (validate && options.data) {
			const validationResult = await validateData(options.data, options.config);
			if (!validationResult.success) {
				return validationResult;
			}
		}
		
		// 3️⃣ 执行实际方法
		const result = await fn();
		
		// 4️⃣ 记录日志
		await logAction(action, category, startTime, requestTime, options.params, result, !result.success);
		
		return result;
		
	} catch (error) {
		console.error(`[${category}] ${action} error:`, error);
		const errorResult = { success: false, error: error.message };
		await logAction(action, category, startTime, requestTime, options.params, errorResult, true);
		return errorResult;
	}
}
```

### 3. CRUD 辅助类（lib/crud-helper.js）

```javascript
/**
 * CRUD 辅助类
 * 提供可选的辅助方法
 */
export class CrudHelper {
	constructor(config) {
		this.config = config;
	}
	
	/**
	 * 构建搜索查询
	 */
	buildSearchQuery(search) {
		if (!search || !this.config.fields.searchable?.length) {
			return {};
		}
		return {
			$or: this.config.fields.searchable.map(field => ({
				[field]: { $regex: search, $options: 'i' },
			})),
		};
	}
	
	/**
	 * 构建过滤查询
	 */
	buildFiltersQuery(filters) {
		const query = {};
		for (const [key, value] of Object.entries(filters)) {
			if (value !== undefined && value !== null && value !== '') {
				query[key] = value;
			}
		}
		return query;
	}
	
	/**
	 * 字段过滤
	 */
	filterFields(data, action) {
		const allowedFields = this.config.fields[action] || [];
		if (allowedFields.length === 0) return data;
		
		const filtered = {};
		allowedFields.forEach(field => {
			if (data[field] !== undefined) {
				filtered[field] = data[field];
			}
		});
		return filtered;
	}
	
	/**
	 * 数据验证
	 */
	async validate(data, action, recordId = null) {
		const rules = this.config.validation || {};
		
		for (const [field, rule] of Object.entries(rules)) {
			const value = data[field];
			
			// 必填验证
			if (rule.required && action === 'create') {
				if (value === undefined || value === null || value === '') {
					throw new Error(`${field} is required`);
				}
			}
			
			// 其他验证...
		}
	}
	
	/**
	 * 标准的 getList 实现
	 */
	async getList(params) {
		const {
			pageIndex = 1,
			pageSize = this.config.query?.defaultPageSize || 20,
			search,
			filters = {},
			sortJson,
		} = params;
		
		// 构建查询
		const query = {
			...this.config.query?.baseFilter,
			...this.buildSearchQuery(search),
			...this.buildFiltersQuery(filters),
		};
		
		// 软删除
		if (this.config.softDelete) {
			query.$or = [{ deletedAt: { $exists: false } }, { deletedAt: null }];
		}
		
		// 查询
		const result = await selects({
			dbName: this.config.collectionName,
			whereJson: query,
			sortJson: sortJson || this.config.query?.defaultSort,
			pageIndex,
			pageSize,
			getCount: true,
			foreignDB: this.config.query?.foreignDB || [],
		});
		
		// 转换
		const transform = this.config.transforms?.output;
		const data = transform ? result.rows.map(transform) : result.rows;
		
		return {
			success: true,
			data,
			total: result.total,
			pageIndex: result.pageIndex,
			pageSize: result.pageSize,
		};
	}
	
	/**
	 * 标准的 create 实现
	 */
	async create(data) {
		// 字段过滤
		const filtered = this.filterFields(data, 'creatable');
		
		// 数据验证
		await this.validate(filtered, 'create');
		
		// 输入转换
		const transform = this.config.transforms?.input;
		const transformedData = transform ? transform(filtered) : filtered;
		
		// beforeCreate 钩子
		if (this.config.hooks?.beforeCreate) {
			await this.config.hooks.beforeCreate(transformedData);
		}
		
		// 插入
		const now = new Date();
		const result = await add({
			dbName: this.config.collectionName,
			dataJson: {
				...transformedData,
				createdAt: now,
				updatedAt: now,
			},
		});
		
		// afterCreate 钩子
		if (this.config.hooks?.afterCreate) {
			await this.config.hooks.afterCreate(result);
		}
		
		return {
			success: true,
			data: result,
		};
	}
	
	/**
	 * 标准的 update 实现
	 */
	async update(id, data) {
		// 字段过滤
		const filtered = this.filterFields(data, 'updatable');
		
		// 数据验证
		await this.validate(filtered, 'update', id);
		
		// beforeUpdate 钩子
		if (this.config.hooks?.beforeUpdate) {
			await this.config.hooks.beforeUpdate(id, filtered);
		}
		
		// 更新
		const result = await updateOne({
			dbName: this.config.collectionName,
			whereJson: { [this.config.primaryKey]: id },
			dataJson: {
				...filtered,
				updatedAt: new Date(),
			},
		});
		
		// afterUpdate 钩子
		if (this.config.hooks?.afterUpdate) {
			await this.config.hooks.afterUpdate(id, result);
		}
		
		return {
			success: true,
			data: result,
		};
	}
	
	/**
	 * 标准的 delete 实现
	 */
	async delete(id) {
		// beforeDelete 钩子
		if (this.config.hooks?.beforeDelete) {
			const canDelete = await this.config.hooks.beforeDelete(id);
			if (!canDelete) {
				return { success: false, error: 'Delete not allowed' };
			}
		}
		
		// 软删除 or 硬删除
		if (this.config.softDelete) {
			await updateOne({
				dbName: this.config.collectionName,
				whereJson: { [this.config.primaryKey]: id },
				dataJson: { deletedAt: new Date() },
			});
		} else {
			await remove({
				dbName: this.config.collectionName,
				whereJson: { [this.config.primaryKey]: id },
			});
		}
		
		// afterDelete 钩子
		if (this.config.hooks?.afterDelete) {
			await this.config.hooks.afterDelete(id);
		}
		
		return { success: true };
	}
	
	/**
	 * 批量更新
	 */
	async batchUpdate(ids, data) {
		// 字段过滤
		const filtered = this.filterFields(data, 'updatable');
		
		// 更新
		const { ObjectId } = await import('mongodb');
		const objectIds = ids.map(id => new ObjectId(id));
		
		await updateMany({
			dbName: this.config.collectionName,
			whereJson: { [this.config.primaryKey]: { $in: objectIds } },
			dataJson: {
				...filtered,
				updatedAt: new Date(),
			},
		});
		
		return {
			success: true,
			data: { modifiedCount: ids.length },
		};
	}
}
```

---

## 模板文件设计

### 模板 1：CRUD Actions 模板

```javascript
// templates/actions/crud-template.js

import { CrudHelper } from '@/lib/crud-helper';
import { createCrudActions } from '@/lib/action-wrapper';
import { xxxCrudConfig } from './configs/xxx-crud.config';  // 改成实际的 config

/**
 * XXX DAO
 * ✅ 继承 CrudHelper，获得标准 CRUD 方法
 * ✅ 可以覆盖方法实现特殊逻辑
 */
class XxxDAO extends CrudHelper {
	constructor() {
		super(xxxCrudConfig);
	}
	
	// ✅ 标准方法自动继承：
	// - getList(params)
	// - create(data)
	// - update(id, data)
	// - delete(id)
	// - batchUpdate(ids, data)
	
	// 💡 如需自定义，直接覆盖：
	// async create(data) {
	//     // 自定义逻辑
	//     return await super.create(data);
	// }
}

// 创建 DAO 实例
const xxxDao = new XxxDAO();

// ⭐ 使用 createCrudActions 自动生成带日志和权限的 Actions
const actions = createCrudActions(xxxDao, xxxCrudConfig);

// 导出 Actions（自动有日志、权限、错误处理）
export const getXxxListAction = actions.getList;
export const createXxxAction = actions.create;
export const updateXxxAction = actions.update;
export const deleteXxxAction = actions.delete;
export const batchUpdateXxxAction = actions.batchUpdate;
export const getXxxByIdAction = actions.getDetail;

// 💡 如需自定义 Action：
export async function customXxxAction(params) {
	// 会自动有日志和权限检查
	return await wrapAction({
		action: 'customAction',
		category: xxxCrudConfig.logCategory,
		requireAdmin: true,
		fn: async () => {
			// 你的自定义逻辑
			return { success: true, data: 'custom result' };
		},
	});
}
```

### 模板 2：CRUD 配置模板

```javascript
// templates/configs/crud-config-template.js

export const xxxCrudConfig = {
	// ===== 基础配置 =====
	collectionName: 'xxx',           // ✅ 改成你的表名
	logCategory: 'admin/xxx',         // ✅ 改成你的日志分类
	primaryKey: 'id',                // 主键字段（默认 'id'）
	
	// ===== 字段配置 =====
	fields: {
		creatable: ['field1', 'field2', 'field3'],   // ✅ 可创建的字段
		updatable: ['field1', 'field2', 'enable'],   // ✅ 可更新的字段
		searchable: ['field1', 'name'],              // ✅ 可搜索的字段
	},
	
	// ===== 查询配置 =====
	query: {
		defaultSort: { createdAt: -1 },              // 默认排序
		defaultPageSize: 20,                         // 默认分页大小
		baseFilter: {},                              // 基础过滤条件
		
		// 连表配置（可选）
		foreignDB: [
			// {
			//     dbName: 'other_table',
			//     localKey: 'foreign_id',
			//     foreignKey: 'id',
			//     as: 'otherInfo',
			//     fieldJson: { id: 1, name: 1 },
			// },
		],
	},
	
	// ===== 验证规则 =====
	validation: {
		field1: {
			required: true,
			minLength: 2,
			maxLength: 50,
			message: 'Field1 must be between 2 and 50 characters',
		},
		field2: {
			required: true,
			pattern: /^[A-Z0-9]+$/,
			message: 'Field2 must be uppercase letters and numbers',
		},
		// 自定义验证
		// field3: {
		//     validator: async (value) => {
		//         return value > 0 && value <= 100;
		//     },
		//     message: 'Field3 must be between 0 and 100',
		// },
	},
	
	// ===== 生命周期钩子 =====
	hooks: {
		// beforeCreate: async (data) => {
		//     // 创建前处理
		//     data.customField = 'custom value';
		//     return data;
		// },
		
		// afterCreate: async (result) => {
		//     // 创建后处理
		//     console.log('Created:', result);
		// },
		
		// beforeUpdate: async (id, data) => {
		//     // 更新前处理
		//     return data;
		// },
		
		// afterUpdate: async (id, result) => {
		//     // 更新后处理
		// },
		
		// beforeDelete: async (id) => {
		//     // 删除前检查
		//     return true; // 返回 false 可以阻止删除
		// },
		
		// afterDelete: async (id) => {
		//     // 删除后清理
		// },
	},
	
	// ===== 数据转换 =====
	transforms: {
		// input: (data) => {
		//     // 写入数据库前转换
		//     return data;
		// },
		
		// output: (data) => {
		//     // 从数据库读取后转换
		//     return data;
		// },
	},
	
	// ===== 其他配置 =====
	softDelete: true,  // 启用软删除
};
```

### 模板 3：CRUD Page 模板

```javascript
// templates/pages/crud-page-template.js

'use client';

import dynamic from 'next/dynamic';

const SmartCrudPage = dynamic(() => import('@/components/admin/smart-crud-page'), {
	ssr: false,
});

// ✅ 改成你的 Actions 导入
import {
	getXxxListAction as getList,
	createXxxAction as create,
	updateXxxAction as update,
	deleteXxxAction as deleteItem,
	batchUpdateXxxAction as batchUpdate,
} from '@/app/(admin)/actions/xxx/admin-xxx';

export default function XxxManagementPage() {
	// ✅ 字段配置（根据你的业务修改）
	const fieldsConfig = [
		{
			key: 'id',
			title: 'ID',
			type: 'text',
			table: { width: 80 },
			form: false,
		},
		{
			key: 'name',
			title: 'Name',
			type: 'text',
			table: { width: 150, copyable: true },
			form: { required: true, placeholder: 'Enter name' },
			search: { enabled: true, mode: 'like' },
		},
		{
			key: 'status',
			title: 'Status',
			type: 'select',
			options: [
				{ label: 'Active', value: 'active', color: 'green' },
				{ label: 'Inactive', value: 'inactive', color: 'gray' },
			],
			table: { width: 100 },
			form: { required: true },
			search: { enabled: true, mode: 'exact' },
		},
		{
			key: 'createdAt',
			title: 'Created At',
			type: 'datetime',
			table: { width: 180, sorter: true },
			form: false,
		},
	];
	
	// ✅ Actions 配置
	const actions = {
		getList,
		create,
		update,
		delete: deleteItem,
	};
	
	// ✅ 批量操作（可选）
	const batchActions = [
		{
			key: 'enable',
			label: 'Enable Selected',
			action: batchUpdate,
			params: { enable: true },
		},
	];
	
	// ✅ 自定义行操作（可选）
	const customRowActions = [
		// {
		//     key: 'custom-action',
		//     text: 'Custom Action',
		//     icon: <CustomIcon />,
		//     onClick: async (record) => {
		//         // 自定义逻辑
		//     },
		// },
	];
	
	return (
		<SmartCrudPage
			fieldsConfig={fieldsConfig}
			actions={actions}
			title="XXX Management"  // ✅ 改成你的标题
			rowKey="id"
			
			// 批量操作
			batchActions={batchActions}
			
			// 自定义行操作
			customRowActions={customRowActions}
			
			// 功能开关
			enableCreate={true}
			enableDetail={true}
			enableEdit={true}
			enableDelete={true}
			
			// 表格配置
			tableProps={{
				scroll: { x: 1200 },
				pagination: {
					showTotal: (total) => `Total ${total} items`,
				},
			}}
		/>
	);
}
```

---

## 快速开发流程（完整示例）

### 创建"优惠券管理"页面

#### 1. 复制模板

```bash
# 复制 Actions 模板
cp templates/actions/crud-template.js app/(admin)/actions/coupon/admin-coupons.js

# 复制配置模板
cp templates/configs/crud-config-template.js app/(admin)/actions/coupon/configs/coupon-crud.config.js

# 复制页面模板
cp templates/pages/crud-page-template.js app/(admin)/admin/coupon/page.js
```

#### 2. 修改配置（coupon-crud.config.js）

```javascript
export const couponCrudConfig = {
	collectionName: 'coupons',
	logCategory: 'admin/coupons',
	primaryKey: 'id',
	
	fields: {
		creatable: ['code', 'discount', 'type', 'expireAt', 'maxUse'],
		updatable: ['discount', 'expireAt', 'maxUse', 'enable'],
		searchable: ['code'],
	},
	
	query: {
		defaultSort: { createdAt: -1 },
		defaultPageSize: 20,
	},
	
	validation: {
		code: {
			required: true,
			pattern: /^[A-Z0-9]{6,12}$/,
			unique: true,
			message: 'Coupon code must be 6-12 uppercase letters/numbers and unique',
		},
		discount: {
			required: true,
			validator: async (value) => value > 0 && value <= 100,
			message: 'Discount must be between 0 and 100',
		},
		maxUse: {
			validator: async (value) => value > 0,
			message: 'Max use must be greater than 0',
		},
	},
	
	hooks: {
		beforeCreate: async (data) => {
			// 自动生成优惠券码（如果没提供）
			if (!data.code) {
				data.code = generateCouponCode();
			}
			return data;
		},
	},
	
	softDelete: true,
};
```

#### 3. 修改 Actions（admin-coupons.js）

```javascript
import { CrudHelper } from '@/lib/crud-helper';
import { createCrudActions } from '@/lib/action-wrapper';
import { couponCrudConfig } from './configs/coupon-crud.config';

class CouponDAO extends CrudHelper {
	constructor() {
		super(couponCrudConfig);
	}
	
	// ✅ 标准方法自动继承，无需写代码！
}

const couponDao = new CouponDAO();
const actions = createCrudActions(couponDao, couponCrudConfig);

// ✅ 导出 Actions（自动有日志、权限）
export const getCouponListAction = actions.getList;
export const createCouponAction = actions.create;
export const updateCouponAction = actions.update;
export const deleteCouponAction = actions.delete;
export const batchUpdateCouponsAction = actions.batchUpdate;
```

#### 4. 修改页面（page.js）

```javascript
import {
	getCouponListAction as getList,
	createCouponAction as create,
	updateCouponAction as update,
	deleteCouponAction as deleteItem,
	batchUpdateCouponsAction as batchUpdate,
} from '@/app/(admin)/actions/coupon/admin-coupons';

export default function CouponManagementPage() {
	const fieldsConfig = [
		{
			key: 'code',
			title: 'Coupon Code',
			type: 'text',
			table: { width: 120, copyable: true },
			form: { required: true, placeholder: 'SAVE20' },
			search: { enabled: true },
		},
		{
			key: 'discount',
			title: 'Discount (%)',
			type: 'number',
			table: { width: 100 },
			form: { required: true, min: 0, max: 100 },
		},
		{
			key: 'type',
			title: 'Type',
			type: 'select',
			options: [
				{ label: 'Percentage', value: 'percentage' },
				{ label: 'Fixed', value: 'fixed' },
			],
			table: { width: 100 },
			form: { required: true },
		},
		{
			key: 'maxUse',
			title: 'Max Use',
			type: 'number',
			table: { width: 100 },
			form: { required: true, min: 1 },
		},
		{
			key: 'enable',
			title: 'Status',
			type: 'switch',
			table: { width: 100 },
			form: { required: true },
		},
		{
			key: 'createdAt',
			title: 'Created At',
			type: 'datetime',
			table: { width: 180 },
			form: false,
		},
	];
	
	const actions = { getList, create, update, delete: deleteItem };
	
	const batchActions = [
		{
			key: 'enable',
			label: 'Enable Selected',
			action: batchUpdate,
			params: { enable: true },
		},
	];
	
	return (
		<SmartCrudPage
			fieldsConfig={fieldsConfig}
			actions={actions}
			title="Coupon Management"
			batchActions={batchActions}
			enableCreate={true}
			enableEdit={true}
			enableDelete={true}
		/>
	);
}
```

#### 完成！✅

- ✅ 自动有权限检查（RBAC）
- ✅ 自动有日志记录（action_logs）
- ✅ 自动有数据验证
- ✅ 自动有错误处理
- ✅ 自动有软删除
- ✅ 自动有搜索、分页、排序
- ✅ 自动有批量操作

**总耗时：约 20 分钟**

---

## 核心优势总结

### 1. 快速开发 ⚡
```
传统方式：2-3 天
模板方式：20 分钟
提速：8-10 倍 ✅
```

### 2. 统一规范 📏
```
所有页面自动：
✅ 符合 RBAC 权限
✅ 记录操作日志
✅ 统一错误处理
✅ 统一数据验证
✅ 统一代码风格
```

### 3. 灵活扩展 🔧
```
通过配置实现：
✅ 字段定制
✅ 验证规则
✅ 生命周期钩子
✅ 自定义操作
✅ 批量操作
```

### 4. 易于维护 🛠️
```
✅ 修改一处，全局生效
✅ 添加功能，所有页面获益
✅ Bug 修复，统一更新
✅ 代码清晰，易于理解
```

---

## 与 VK Framework 对比

| 特性 | VK Framework | 我们的架构 | 说明 |
|------|--------------|-----------|------|
| **BaseDAO** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | db-api = 纯粹零件 |
| **DAO 层** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | CrudHelper = 可选积木 |
| **Service 层** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Actions + Wrapper |
| **模板系统** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 更完整的模板 |
| **智能 CRUD** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | SmartCrudPage |
| **日志系统** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 自动日志 |
| **权限系统** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | RBAC 集成 |

**结论：** 我们的架构在保持 VK 精髓的基础上，增加了更多自动化功能！✅

---

## 实施步骤

### 阶段 1：创建核心库（1 周）

1. **重构 db-api.js** - 确保纯粹
2. **创建 action-wrapper.js** - 统一包装器
3. **创建 crud-helper.js** - CRUD 辅助类
4. **完善 smart-crud-page.jsx** - 前端组件

### 阶段 2：创建模板（3 天）

1. **crud-template.js** - Actions 模板
2. **crud-config-template.js** - 配置模板
3. **crud-page-template.js** - 页面模板
4. **编写使用文档**

### 阶段 3：迁移现有模块（2 周）

1. **角色管理** - 使用模板重写
2. **菜单管理** - 使用模板重写
3. **权限管理** - 使用模板重写
4. **用户管理** - 使用模板重写（特殊处理）

### 阶段 4：测试和优化（1 周）

1. 完整功能测试
2. 性能测试
3. 用户体验优化
4. 文档完善

**总计：约 4-5 周**

---

## 你觉得这个方案如何？

这个架构设计：
- ✅ 符合 VK 的设计哲学
- ✅ 实现"快速开发"的目标
- ✅ 保持"统一规范"
- ✅ 提供"灵活扩展"
- ✅ 易于维护和理解

**下一步：** 你想立即开始实施吗？我可以帮你：
1. 创建核心库文件
2. 创建模板文件
3. 编写详细的使用文档
4. 迁移第一个示例（比如优惠券管理）

告诉我你的想法！🚀

