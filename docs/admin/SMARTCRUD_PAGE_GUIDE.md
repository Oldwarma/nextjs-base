# SmartCrudPage 完整实战指南

> 基于实际问题总结的最佳实践，确保你不会踩坑

---

## 📚 目录

1. [架构概述](#架构概述)
2. [创建步骤](#创建步骤)
3. [连表查询详解](#连表查询详解)
4. [常见问题与解决方案](#常见问题与解决方案)
5. [完整示例](#完整示例)
6. [快速检查清单](#快速检查清单)

---

## 架构概述

### 数据流向

```
用户操作 → SmartCrudPage → Server Actions → BaseDAO → db-api → MongoDB
         ↑                  ↓
         └── fieldsConfig ──┘
                 ↓
            CRUD Config
```

### 核心原则

1. ✅ **永远使用 BaseDAO**，不要绕过它直接操作数据库
2. ✅ **使用 createCrudActions / createReadOnlyActions** 创建 Actions
3. ✅ **fieldsConfig 使用 `title` 而不是 `label`**
4. ✅ **连表查询统一在 Config 的 `foreignDB` 中配置**
5. ✅ **BaseDAO 会自动处理 `whereJson`（SmartCrudPage 传递）和 `filters`（传统模式）**

---

## 创建步骤

### 第一步：创建 CRUD 配置文件

**路径**：`app/(admin)/actions/{module}/configs/{resource}-crud.config.js`

```javascript
/**
 * {资源名称} CRUD 配置
 */

export const {resource}CrudConfig = {
	// ========== 基础配置 ==========
	collectionName: 'your_collection',  // MongoDB 集合名称
	logCategory: 'module/resource',     // 日志分类（可选）
	primaryKey: '_id',                  // 主键字段（MongoDB 默认 _id）

	// ========== 字段权限 ==========
	fields: {
		creatable: ['field1', 'field2'],   // 可创建的字段
		updatable: ['field1', 'field2'],   // 可更新的字段
		searchable: ['field1', 'field2'],  // 可搜索的字段（模糊搜索）
	},

	// ========== 查询配置 ==========
	query: {
		defaultSort: { createdAt: -1 },
		defaultPageSize: 20,
		baseFilter: {},  // 始终应用的过滤条件

		// 连表配置（详见下方"连表查询详解"）
		foreignDB: [],
	},

	// ========== 软删除 ==========
	softDelete: false,  // true 表示启用软删除

	// ========== 数据验证（可选）==========
	validation: {},

	// ========== 生命周期钩子（可选）==========
	hooks: {},

	// ========== 数据转换（可选）==========
	transforms: {},
};
```

### 第二步：创建 Server Actions

**路径**：`app/(admin)/actions/{module}/admin-{resource}.js`

#### 只读资源（日志、统计等）

```javascript
'use server';

import { createReadOnlyActions } from '@/lib/core/crud-helper';
import { {resource}CrudConfig } from './configs/{resource}-crud.config';

const crudActions = createReadOnlyActions({resource}CrudConfig);

export const get{Resource}ListAction = crudActions.getList;
export const get{Resource}DetailAction = crudActions.getDetail;
```

#### 完整 CRUD 资源

```javascript
'use server';

import { createCrudActions } from '@/lib/core/crud-helper';
import { {resource}CrudConfig } from './configs/{resource}-crud.config';

const crudActions = createCrudActions({resource}CrudConfig);

export const get{Resource}ListAction = crudActions.getList;
export const get{Resource}DetailAction = crudActions.getDetail;
export const create{Resource}Action = crudActions.create;
export const update{Resource}Action = crudActions.update;
export const delete{Resource}Action = crudActions.delete;
export const batchUpdate{Resource}Action = crudActions.batchUpdate;
export const batchDelete{Resource}Action = crudActions.batchDelete;
```

### 第三步：创建前端页面

**路径**：`app/(admin)/admin/{module}/{resource}/page.js`

```javascript
'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';

// 动态导入 SmartCrudPage（避免 SSR 问题）
const SmartCrudPage = dynamic(
	() => import('@/components/admin/smart-crud-page').then((mod) => mod.default),
	{ ssr: false }
);

// 导入 Actions
import * as actions from '@/app/(admin)/actions/{module}/admin-{resource}';

export default function {Resource}Page() {
	// ✅ 关键：使用 useMemo 优化性能
	const fieldsConfig = useMemo(
		() => [
			{
				key: '_id',
				title: 'ID',  // ✅ 使用 title 而不是 label
				type: 'text',
				table: { show: true, width: 100 },
				search: false,
				detail: true,
			},
			// ... 更多字段配置
		],
		[]
	);

	return (
		<SmartCrudPage
			title="{资源名称}管理"
			rowKey="_id"
			fieldsConfig={fieldsConfig}
			actions={{
				getList: actions.get{Resource}ListAction,
				getDetail: actions.get{Resource}DetailAction,
				create: actions.create{Resource}Action,
				update: actions.update{Resource}Action,
				delete: actions.delete{Resource}Action,
			}}
			enableCreate={true}
			enableEdit={true}
			enableDelete={true}
			enableDetail={true}
		/>
	);
}
```

---

## 连表查询详解

### ⚠️ 关键知识点

#### 1. 字段名称规范

| 配置项 | 说明 | 示例 |
|--------|------|------|
| `dbName` | 副表集合名称 | `'users'` |
| `localKey` | 本表字段名 | `'userId'` |
| `foreignKey` | 副表字段名 | `'id'` 或 `'_id'` |
| `as` | 连表结果字段名 | `'userInfo'` |

**❌ 错误写法**：`localField`, `foreignField`  
**✅ 正确写法**：`localKey`, `foreignKey`

#### 2. ObjectId 类型匹配问题

**常见场景**：
- 本表存储：`userId: "69030d2a9ff630ade7f92b33"`（ObjectId 字符串）
- 副表主键：`_id: ObjectId("69030d2a9ff630ade7f92b33")`（ObjectId 类型）

**解决方案**：使用 `convertToObjectId: true`

```javascript
foreignDB: [
	{
		dbName: 'users',
		localKey: 'userId',      // 本表字段（ObjectId 字符串）
		foreignKey: '_id',       // 副表字段（ObjectId 类型）
		as: 'userInfo',
		limit: 1,
		convertToObjectId: true, // ✅ 启用类型转换
	},
]
```

**注意**：
- 如果本表存储的是非 ObjectId 字符串（如 `'system'`, `'admin'`），会自动跳过，不会报错
- 转换失败时，`userInfo` 为 `null`

#### 3. 一对一 vs 一对多

**一对一关系**（每条记录最多关联 1 条副表数据）：

```javascript
{
	dbName: 'users',
	localKey: 'userId',
	foreignKey: '_id',
	as: 'userInfo',
	limit: 1,  // ✅ 设置 limit: 1
}
```

**返回结果**：`userInfo` 是**对象**（不是数组）

```javascript
{
	_id: '...',
	userId: '...',
	userInfo: { id: '...', name: 'John', email: 'john@example.com' }  // ✅ 对象
}
```

**一对多关系**（每条记录可以关联多条副表数据）：

```javascript
{
	dbName: 'roles',
	localKey: 'roles',    // 本表字段是数组：['role-id-1', 'role-id-2']
	foreignKey: 'id',
	as: 'roleList',
	// ✅ 不设置 limit
}
```

**返回结果**：`roleList` 是**数组**

```javascript
{
	_id: '...',
	roles: ['role-id-1', 'role-id-2'],
	roleList: [  // ✅ 数组
		{ id: 'role-id-1', name: 'Admin' },
		{ id: 'role-id-2', name: 'Editor' }
	]
}
```

### 完整连表配置示例

```javascript
query: {
	defaultSort: { createdAt: -1 },
	defaultPageSize: 20,
	baseFilter: {},
	
	foreignDB: [
		{
			dbName: 'users',                // 副表集合名称
			localKey: 'userId',             // action_logs.userId
			foreignKey: '_id',              // users._id
			as: 'userInfo',                 // 结果存放字段
			limit: 1,                       // 一对一关系
			fieldJson: {                    // 只返回需要的字段（可选）
				id: 1, 
				name: 1, 
				email: 1, 
				_id: 1 
			},
			convertToObjectId: true,        // 启用类型转换（可选）
		},
	],
},
```

### 前端如何渲染连表数据

#### 一对一关系（limit: 1）

```javascript
{
	key: 'userInfo',  // ✅ 字段名使用连表结果字段
	title: 'User',
	type: 'custom',
	table: {
		width: 150,
		render: (userInfo, record) => {
			// ✅ 兼容处理：可能是对象或 null
			let user = null;
			if (Array.isArray(userInfo) && userInfo.length > 0) {
				user = userInfo[0];  // 旧版本可能返回数组
			} else if (userInfo && typeof userInfo === 'object') {
				user = userInfo;     // 新版本返回对象
			}
			
			if (user && user.name) {
				return (
					<div>
						<div style={{ fontWeight: 500 }}>{user.name}</div>
						<div style={{ fontSize: 12, color: '#999' }}>
							{user.email}
						</div>
					</div>
				);
			}
			
			// 如果没有关联数据，显示原始 userId
			return <div style={{ color: '#999' }}>{record.userId}</div>;
		},
	},
	search: false,  // ✅ 搜索时使用原始字段
	form: false,    // 连表字段不显示在表单中
}
```

#### 一对多关系（无 limit）

```javascript
{
	key: 'roles',  // ✅ 原始字段名（用于表单操作）
	title: 'Roles',
	type: 'select',
	options: roleOptions,  // 动态加载的选项
	form: {
		mode: 'multiple',
		placeholder: 'Select roles',
	},
	table: {
		width: 150,
		render: (value, record) => {
			// ✅ 优先使用连表数据，fallback 到原始字段
			const roles = record.roleList || value || [];
			
			if (!Array.isArray(roles) || roles.length === 0) {
				return <span style={{ color: '#999' }}>No roles</span>;
			}
			
			return (
				<Space wrap>
					{roles.map((item, index) => {
						// 如果是对象（连表数据），取 name；否则显示原值
						const displayText = item?.name || item;
						const key = item?.id || item;
						return (
							<Tag key={key || index} color='blue'>
								{displayText}
							</Tag>
						);
					})}
				</Space>
			);
		},
	},
	search: {
		show: true,
		mode: 'in',  // ✅ 数组包含查询
	},
}
```

---

## 常见问题与解决方案

### 问题 0：点击查看详情时重复请求数据

**症状**：
- 表格中已经有完整的数据（包括连表数据）
- 点击 "View" 查看详情时，又发起了一次请求
- 详情页中连表数据丢失

**根本原因**：
SmartCrudPage 的逻辑：
```javascript
if (actions.getDetail) {
	// 重新请求数据
	const result = await actions.getDetail(record[rowKey]);
	setCurrentRow(result.data);
} else {
	// 直接使用表格数据
	setCurrentRow(record);
}
```

**问题**：
- `getDetail` 只查询单条记录，**不包含连表数据**
- BaseDAO 的 `getDetail` 使用 `findOne`，而不是 `selects`
- 导致详情页丢失连表数据，并且产生不必要的请求

**✅ 解决方案：不提供 getDetail action**

```javascript
// ❌ 错误：提供了 getDetail
actions={{
	getList: getListAction,
	getDetail: getDetailAction,  // ← 会重新请求，丢失连表数据
}}

// ✅ 正确：不提供 getDetail
actions={{
	getList: getListAction,
	// 不提供 getDetail，直接使用表格数据
}}
```

**适用场景**：
- ✅ 表格数据已包含所有需要展示的字段（包括连表数据）
- ✅ 详情页不需要额外的字段
- ❌ 详情页需要展示表格中没有的字段时，才需要提供 `getDetail`

**示例**：
```javascript
// action-logs 页面：表格已有 userInfo 连表数据
actions={{
	getList,
	// ✅ 不提供 getDetail，避免重复请求
}}

// users 页面：表格已有 roleList 连表数据
const actions = {
	getList,
	update,
	delete: deleteItem,
	// ✅ 不提供 getDetail
};
```

### 问题 1：连表查询不生效，userInfo 为空

**症状**：
- 配置了 `foreignDB`
- 查询没有报错
- 但是 `userInfo` 始终为 `null` 或 `undefined`

**可能原因 & 解决方案**：

#### 原因 1：字段名写错了

❌ **错误**：
```javascript
foreignDB: [
	{
		dbName: 'users',
		localField: 'userId',   // ❌ 错误
		foreignField: 'id',     // ❌ 错误
		as: 'userInfo',
	},
]
```

✅ **正确**：
```javascript
foreignDB: [
	{
		dbName: 'users',
		localKey: 'userId',     // ✅ 正确
		foreignKey: 'id',       // ✅ 正确
		as: 'userInfo',
	},
]
```

#### 原因 2：类型不匹配

**场景**：本表存储 ObjectId 字符串，副表主键是 ObjectId 类型

❌ **错误**：
```javascript
{
	localKey: 'userId',      // "69030d2a9ff630ade7f92b33" (字符串)
	foreignKey: '_id',       // ObjectId("69030d2a9ff630ade7f92b33") (ObjectId)
	// 缺少类型转换
}
```

✅ **正确**：
```javascript
{
	localKey: 'userId',
	foreignKey: '_id',
	convertToObjectId: true,  // ✅ 启用类型转换
}
```

#### 原因 3：foreignKey 指向错误的字段

**场景**：Better Auth 的 users 表

- `users._id`：ObjectId 类型（MongoDB 主键）
- `users.id`：UUID 字符串（Better Auth 主键）

如果 `action_logs.userId` 存储的是 ObjectId 字符串：

❌ **错误**：
```javascript
{
	foreignKey: 'id',  // ❌ 错误：users.id 是 UUID，不匹配
}
```

✅ **正确**：
```javascript
{
	foreignKey: '_id',          // ✅ 正确：匹配 ObjectId
	convertToObjectId: true,    // ✅ 启用转换
}
```

### 问题 2：报错 "Failed to parse objectId 'system'"

**症状**：
```
Failed to parse objectId 'system' in $convert with no onError value: 
Invalid string length for parsing to OID, expected 24 but found 6
```

**原因**：
- 数据库中有些记录的 `userId` 是 `'system'` 或 `'admin'`（不是有效的 ObjectId）
- 使用了 `convertToObjectId: true`，但没有处理转换失败的情况

**解决方案**：
✅ **已自动处理**：`db-api.js` 的 `selects` 方法已使用 `$convert` 的 `onError: null`，转换失败时返回 `null`，不会报错。

**验证**：确保使用最新版本的 `db-api.js`（包含 `onError` 处理）

### 问题 3：搜索不生效

**症状**：
- 筛选条件输入后点击搜索
- 列表没有变化或返回空结果

**可能原因 & 解决方案**：

#### 原因 1：BaseDAO 不支持 whereJson

❌ **旧版本** BaseDAO 只支持 `filters` 参数

✅ **已修复**：BaseDAO 的 `getList` 方法已支持 `whereJson`（SmartCrudPage 使用）和 `filters`（传统模式）

#### 原因 2：搜索字段配置错误

**场景**：连表字段的搜索

❌ **错误**：
```javascript
{
	key: 'userInfo',  // 连表结果字段
	search: {
		show: true,
		// ❌ 缺少 key：会搜索 userInfo 字段（对象），无法匹配
	},
}
```

✅ **正确**：
```javascript
{
	key: 'userInfo',
	search: {
		show: true,
		key: 'userId',  // ✅ 搜索原始字段
		type: 'input',
		placeholder: 'Search by User ID',
	},
}
```

### 问题 4：表格列没有标题

**症状**：
- 表格渲染正常
- 但是列头显示为空

**原因**：
使用了 `label` 而不是 `title`

❌ **错误**：
```javascript
{
	key: 'name',
	label: 'Name',  // ❌ 错误：旧版本属性
	type: 'text',
}
```

✅ **正确**：
```javascript
{
	key: 'name',
	title: 'Name',  // ✅ 正确
	type: 'text',
}
```

### 问题 5：详情页显示 "[object Object]"

**症状**：
- 点击查看详情
- JSON 字段或对象字段显示 `[object Object]`

**原因**：
没有为复杂类型字段配置正确的渲染方式

❌ **错误**：
```javascript
{
	key: 'params',
	title: 'Params',
	type: 'json',
	detail: true,  // ❌ 默认渲染会显示 [object Object]
}
```

✅ **正确**：
```javascript
{
	key: 'params',
	title: 'Request Params',
	type: 'json',
	table: false,
	detail: {
		show: true,
		span: 24,
		render: () => ({
			type: 'code',      // ✅ 使用代码块渲染
			language: 'json',
		}),
	},
}
```

### 问题 6：绕过 BaseDAO 直接操作数据库

**症状**：
- 遇到问题就直接使用 `selects` 方法
- 代码重复，架构混乱

❌ **错误做法**：
```javascript
export const getListAction = wrapQueryAction('resource', async (params) => {
	const result = await selects({
		dbName: 'resource',
		whereJson: params.whereJson,
		// ...
	});
	return { success: true, data: result.rows };
});
```

**问题**：
- 破坏架构一致性
- 丢失 BaseDAO 的统一逻辑（软删除、验证、钩子）
- 增加维护成本

✅ **正确做法**：
```javascript
const crudActions = createReadOnlyActions(resourceCrudConfig);
export const getListAction = crudActions.getList;
```

**原则**：
- 🚫 **禁止绕过 DAO 层**
- ✅ **始终使用 BaseDAO + action-wrapper 架构**
- ✅ **遇到问题修复框架，而不是绕过框架**

---

## 完整示例

### 示例 1：操作日志页面（只读 + 连表）

#### 1. Config

```javascript
// app/(admin)/actions/system/configs/action-logs-crud.config.js
export const actionLogsCrudConfig = {
	collectionName: 'action_logs',
	primaryKey: '_id',

	fields: {
		creatable: [],
		updatable: [],
		searchable: ['userId', 'action', 'resourceType', 'resourceId'],
	},

	query: {
		defaultSort: { createdAt: -1 },
		defaultPageSize: 20,
		baseFilter: {},
		
		foreignDB: [
			{
				dbName: 'users',
				localKey: 'userId',
				foreignKey: '_id',
				as: 'userInfo',
				limit: 1,
				fieldJson: { id: 1, name: 1, email: 1, _id: 1 },
				convertToObjectId: true,
			},
		],
	},

	softDelete: false,

	hooks: {
		beforeCreate: async () => {
			throw new Error('Action logs cannot be created manually');
		},
		beforeUpdate: async () => {
			throw new Error('Action logs cannot be updated');
		},
		beforeDelete: async () => {
			throw new Error('Action logs cannot be deleted');
		},
	},
};
```

#### 2. Actions

```javascript
// app/(admin)/actions/system/admin-action-logs.js
'use server';

import { createReadOnlyActions } from '@/lib/core/crud-helper';
import { actionLogsCrudConfig } from './configs/action-logs-crud.config';

const crudActions = createReadOnlyActions(actionLogsCrudConfig);

export const getActionLogListAction = crudActions.getList;
export const getActionLogDetailAction = crudActions.getDetail;
```

#### 3. Page

```javascript
// app/(admin)/admin/system/action_logs/page.js
'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';

const SmartCrudPage = dynamic(
	() => import('@/components/admin/smart-crud-page').then((mod) => mod.default),
	{ ssr: false }
);

import * as actions from '@/app/(admin)/actions/system/admin-action-logs';

export default function ActionLogsPage() {
	const fieldsConfig = useMemo(
		() => [
			{
				key: '_id',
				title: 'Log ID',
				type: 'text',
				table: { show: true, width: 100, copyable: true, ellipsis: true },
				search: false,
				detail: true,
			},
			{
				key: 'userInfo',
				title: 'User',
				type: 'custom',
				table: {
					width: 150,
					render: (userInfo, record) => {
						let user = null;
						if (Array.isArray(userInfo) && userInfo.length > 0) {
							user = userInfo[0];
						} else if (userInfo && typeof userInfo === 'object') {
							user = userInfo;
						}
						
						if (user && user.name) {
							return (
								<div>
									<div style={{ fontWeight: 500 }}>{user.name}</div>
									<div style={{ fontSize: 12, color: '#999' }}>
										{user.email || record.userId}
									</div>
								</div>
							);
						}
						
						return <div style={{ color: '#999' }}>{record.userId || 'Unknown'}</div>;
					},
				},
				search: false,
				form: false,
			},
			{
				key: 'action',
				title: 'Action',
				type: 'select',
				options: [
					{ label: 'Query', value: 'query' },
					{ label: 'Create', value: 'create' },
					{ label: 'Update', value: 'update' },
					{ label: 'Delete', value: 'delete' },
				],
				table: {
					show: true,
					width: 100,
					render: (value) => {
						const colors = {
							query: 'blue',
							create: 'green',
							update: 'orange',
							delete: 'red',
						};
						return { type: 'tag', color: colors[value] || 'default' };
					},
				},
				search: { show: true, type: 'select' },
				detail: true,
			},
			{
				key: 'resourceType',
				title: 'Resource Type',
				type: 'text',
				table: { show: true, width: 120 },
				search: { show: true, type: 'input' },
				detail: true,
			},
			{
				key: 'params',
				title: 'Request Params',
				type: 'json',
				table: false,
				search: false,
				detail: {
					show: true,
					span: 24,
					render: () => ({ type: 'code', language: 'json' }),
				},
			},
			{
				key: 'createdAt',
				title: 'Created At',
				type: 'datetime',
				table: { show: true, width: 180, sorter: true },
				search: {
					show: true,
					type: 'dateRange',
					transform: (value) =>
						value && value.length === 2
							? { $gte: new Date(value[0]), $lte: new Date(value[1]) }
							: undefined,
				},
				detail: true,
			},
		],
		[]
	);

	return (
		<SmartCrudPage
			title="操作日志"
			rowKey="_id"
			fieldsConfig={fieldsConfig}
			actions={{
				getList: actions.getActionLogListAction,
				getDetail: actions.getActionLogDetailAction,
			}}
			enableCreate={false}
			enableEdit={false}
			enableDelete={false}
			enableDetail={true}
		/>
	);
}
```

---

## 快速检查清单

### Config 配置检查

- [ ] `collectionName` 正确设置
- [ ] `foreignDB` 使用 `localKey` 和 `foreignKey`（不是 localField/foreignField）
- [ ] ObjectId 类型匹配时添加了 `convertToObjectId: true`
- [ ] 一对一关系设置了 `limit: 1`
- [ ] 只读资源在 `hooks` 中禁止了创建/更新/删除

### Actions 检查

- [ ] 使用了 `createCrudActions` 或 `createReadOnlyActions`
- [ ] 没有绕过 BaseDAO 直接操作数据库
- [ ] 导出的函数名遵循命名规范（get{Resource}ListAction 等）

### Page 检查

- [ ] 使用 `dynamic` 导入 SmartCrudPage
- [ ] `fieldsConfig` 使用 `useMemo` 包裹
- [ ] 所有字段使用 `title` 而不是 `label`
- [ ] 连表字段的渲染逻辑正确处理了对象/数组/null 情况
- [ ] JSON 字段在 detail 中使用了 `type: 'code'` 渲染
- [ ] 日期范围搜索添加了 `transform` 函数

### 连表查询检查

- [ ] `foreignDB` 配置完整（dbName, localKey, foreignKey, as）
- [ ] 类型匹配问题已考虑（convertToObjectId）
- [ ] 一对一/一对多关系正确设置（limit）
- [ ] 前端渲染逻辑兼容对象和数组格式
- [ ] 搜索时使用原始字段而不是连表结果字段

---

## 总结

### 核心原则（再次强调）

1. ✅ **永远使用 BaseDAO**
2. ✅ **字段配置用 title 不用 label**
3. ✅ **连表用 localKey/foreignKey**
4. ✅ **ObjectId 匹配加 convertToObjectId**
5. ✅ **遇到问题修复框架而不是绕过**

### 当遇到问题时

1. 🔍 **先检查配置**：字段名、类型匹配
2. 🔍 **再检查架构**：是否绕过了 BaseDAO
3. 🔍 **最后检查文档**：参考本指南和示例代码

### 禁止事项

🚫 绕过 BaseDAO 直接操作数据库  
🚫 使用 label 而不是 title  
🚫 使用 localField/foreignField 而不是 localKey/foreignKey  
🚫 遇到问题就放弃使用 BaseDAO

### 推荐做法

✅ 严格遵循三层架构（Config → Actions → Page）  
✅ 连表配置统一在 Config 的 foreignDB 中  
✅ 前端渲染兼容处理多种数据格式  
✅ 添加详细的注释说明特殊处理逻辑

---

**祝你顺利创建新页面！如有问题，参考本指南的"常见问题与解决方案"章节。**

