# SmartCrudPage 页面创建指南

> ⚠️ **推荐阅读新版指南**：[SMARTCRUD_PAGE_GUIDE.md](./SMARTCRUD_PAGE_GUIDE.md)  
> 新版指南基于实际问题总结，包含完整的故障排查和解决方案。

## 📋 概述

本指南详细说明如何基于 **BaseDAO + SmartCrudPage** 架构创建后台管理页面，确保所有实现都遵循统一的模式和最佳实践。

---

## 🏗️ 架构层次

```
┌──────────────────────────────────────────────────────────┐
│                  前端页面层 (Page)                        │
│  app/(admin)/admin/{module}/{resource}/page.js          │
│  - 定义 fieldsConfig（字段配置）                          │
│  - 使用 SmartCrudPage 组件渲染                           │
└────────────────────┬─────────────────────────────────────┘
                     │ 调用
┌────────────────────▼─────────────────────────────────────┐
│              Server Actions 层 (Actions)                 │
│  app/(admin)/actions/{module}/admin-{resource}.js       │
│  - 使用 createCrudActions / createReadOnlyActions       │
│  - 自动包装权限和日志                                     │
└────────────────────┬─────────────────────────────────────┘
                     │ 调用
┌────────────────────▼─────────────────────────────────────┐
│              配置层 (Config)                             │
│  app/(admin)/actions/{module}/configs/{resource}-crud.config.js │
│  - 定义集合名称、字段权限、验证规则                        │
│  - 配置连表查询（foreignDB）                             │
└────────────────────┬─────────────────────────────────────┘
                     │ 使用
┌────────────────────▼─────────────────────────────────────┐
│              数据访问层 (BaseDAO)                         │
│  app/(admin)/actions/dao/base.js                        │
│  - 提供标准 CRUD 方法                                     │
│  - 支持 whereJson 和 filters 双模式                      │
│  - 处理连表查询、软删除、权限验证                          │
└────────────────────┬─────────────────────────────────────┘
                     │ 调用
┌────────────────────▼─────────────────────────────────────┐
│              数据库 API 层 (db-api)                       │
│  lib/database/db-api.js                                 │
│  - selects, add, updateOne, updateMany, remove          │
│  - MongoDB 聚合操作（连表、分页、排序）                    │
└──────────────────────────────────────────────────────────┘
```

---

## 📝 创建步骤

### 第一步：创建 CRUD 配置文件

**文件路径**：`app/(admin)/actions/{module}/configs/{resource}-crud.config.js`

**示例**：`app/(admin)/actions/system/configs/action-logs-crud.config.js`

```javascript
/**
 * {资源名称} CRUD 配置
 * 定义数据表的 CRUD 操作规则
 */

export const {resource}CrudConfig = {
	// 集合名称（必填）
	collectionName: 'action_logs',

	// 日志分类（可选，用于日志输出）
	logCategory: 'system/action_logs',

	// 主键字段（MongoDB 默认 _id）
	primaryKey: '_id',

	// 字段配置
	fields: {
		// 可创建的字段（新增时允许填写）
		creatable: ['field1', 'field2'],

		// 可更新的字段（编辑时允许修改）
		updatable: ['field1', 'field2'],

		// 可搜索的字段（用于 search 参数的模糊搜索）
		searchable: ['field1', 'field2'],
	},

	// 查询配置
	query: {
		// 默认排序
		defaultSort: { createdAt: -1 },

		// 默认分页大小
		defaultPageSize: 20,

		// 基础过滤条件（始终应用，用于数据隔离）
		baseFilter: {},

		// 连表配置（可选）- 关联其他表
		foreignDB: [
			{
				dbName: 'users',           // 副表集合名称
				localKey: 'userId',        // 本表字段（action_logs.userId）
				foreignKey: 'id',          // 副表字段（users.id）
				as: 'userInfo',            // 连表结果存放字段名
				limit: 1,                  // 限制返回数量（一对一：1，一对多：不设置）
				fieldJson: { id: 1, name: 1, email: 1 }, // 只返回需要的字段（可选）
			},
		],
	},

	// 软删除（可选，默认 false）
	softDelete: false,

	// 数据验证规则（可选）
	validation: {
		email: {
			required: true,
			pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
			unique: true,
			message: 'Invalid email format or email already exists',
		},
	},

	// 生命周期钩子（可选）
	hooks: {
		// 创建前（可用于数据预处理）
		beforeCreate: async (data) => {
			// 例如：禁止手动创建
			throw new Error('Action logs cannot be created manually');
		},

		// 更新前
		beforeUpdate: async (id, data, existing) => {
			// 例如：禁止修改某些字段
			throw new Error('Action logs cannot be updated');
		},

		// 删除前
		beforeDelete: async (id, existing) => {
			// 例如：禁止删除
			throw new Error('Action logs cannot be deleted');
		},

		// 删除后（可用于清理关联数据）
		afterDelete: async (id, deleted) => {
			console.log(`Record ${id} deleted, cleaning up...`);
		},
	},

	// 数据转换（可选）
	transforms: {
		// 输入转换（写入数据库前）
		input: (data) => {
			// 例如：确保布尔值类型正确
			if (data.enabled !== undefined) {
				data.enabled = data.enabled === true || data.enabled === 'true';
			}
			return data;
		},

		// 输出转换（从数据库读取后）
		output: (data) => {
			// 例如：格式化日期
			if (data.createdAt) {
				data.createdAtFormatted = new Date(data.createdAt).toLocaleString('zh-CN');
			}
			return data;
		},
	},
};
```

---

### 第二步：创建 Server Actions

**文件路径**：`app/(admin)/actions/{module}/admin-{resource}.js`

**示例**：`app/(admin)/actions/system/admin-action-logs.js`

#### 方式 A：只读资源（推荐用于日志、统计等）

```javascript
'use server';

/**
 * {资源名称} Server Actions
 * 使用核心库（BaseDAO + action-wrapper）自动处理权限验证和日志记录
 */

import { createReadOnlyActions } from '@/lib/core/crud-helper';
import { {resource}CrudConfig } from './configs/{resource}-crud.config';

/**
 * 创建只读 CRUD Actions
 * BaseDAO 已支持 SmartCrudPage 的 whereJson 参数
 */
const crudActions = createReadOnlyActions({resource}CrudConfig);

/**
 * 导出标准查询 Actions
 */
export const get{Resource}ListAction = crudActions.getList;
export const get{Resource}DetailAction = crudActions.getDetail;
```

#### 方式 B：完整 CRUD 资源

```javascript
'use server';

/**
 * {资源名称} Server Actions
 */

import { createCrudActions } from '@/lib/core/crud-helper';
import { {resource}CrudConfig } from './configs/{resource}-crud.config';

/**
 * 创建完整 CRUD Actions
 */
const crudActions = createCrudActions({resource}CrudConfig);

/**
 * 导出所有 CRUD Actions
 */
export const get{Resource}ListAction = crudActions.getList;
export const get{Resource}DetailAction = crudActions.getDetail;
export const create{Resource}Action = crudActions.create;
export const update{Resource}Action = crudActions.update;
export const delete{Resource}Action = crudActions.delete;
export const batchUpdate{Resource}Action = crudActions.batchUpdate;
export const batchDelete{Resource}Action = crudActions.batchDelete;
```

#### 方式 C：自定义 Actions（需要特殊逻辑时）

```javascript
'use server';

import { createCrudActions, extendCrudActions } from '@/lib/core/crud-helper';
import { wrapMutationAction } from '@/lib/core/action-wrapper';
import { {resource}CrudConfig } from './configs/{resource}-crud.config';

// 创建基础 CRUD Actions
const baseCrudActions = createCrudActions({resource}CrudConfig);

// 扩展自定义 Actions
const crudActions = extendCrudActions(baseCrudActions, {
	// 添加自定义 Action
	customAction: wrapMutationAction('{resource}', async (params) => {
		// 自定义业务逻辑
		return { success: true };
	}),
});

export const get{Resource}ListAction = crudActions.getList;
export const get{Resource}DetailAction = crudActions.getDetail;
export const create{Resource}Action = crudActions.create;
export const update{Resource}Action = crudActions.update;
export const delete{Resource}Action = crudActions.delete;
export const custom{Resource}Action = crudActions.customAction;
```

---

### 第三步：创建前端页面

**文件路径**：`app/(admin)/admin/{module}/{resource}/page.js`

**示例**：`app/(admin)/admin/system/action_logs/page.js`

```javascript
'use client';

import { useMemo, dynamic } from 'react';
import { Tag, Space } from 'antd';

// 动态导入 SmartCrudPage（避免 SSR 问题）
const SmartCrudPage = dynamic(
	() => import('@/components/admin/smart-crud-page').then((mod) => mod.default),
	{ ssr: false }
);

// 导入 Actions
import * as actions from '@/app/(admin)/actions/{module}/admin-{resource}';

export default function {Resource}Page() {
	// 定义字段配置
	const fieldsConfig = useMemo(
		() => [
			{
				key: '_id',
				title: 'ID',
				type: 'text',
				table: { show: true, width: 100, copyable: true, ellipsis: true },
				search: false,
				detail: true,
			},
			{
				key: 'name',
				title: 'Name',
				type: 'text',
				table: { show: true, width: 150 },
				search: { show: true, type: 'input', placeholder: 'Search by name' },
				form: { required: true, placeholder: 'Enter name' },
				detail: true,
			},
			{
				key: 'status',
				title: 'Status',
				type: 'select',
				options: [
					{ label: 'Active', value: 'active' },
					{ label: 'Inactive', value: 'inactive' },
				],
				table: {
					show: true,
					width: 100,
					render: (value) => ({
						type: 'tag',
						color: value === 'active' ? 'success' : 'default',
					}),
				},
				search: { show: true, type: 'select' },
				form: { required: true },
				detail: true,
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
			title="{资源名称}管理"
			description="Manage {resource} records"
			rowKey="_id"
			fieldsConfig={fieldsConfig}
			actions={{
				getList: actions.get{Resource}ListAction,
				getDetail: actions.get{Resource}DetailAction,
				create: actions.create{Resource}Action,
				update: actions.update{Resource}Action,
				delete: actions.delete{Resource}Action,
				batchUpdate: actions.batchUpdate{Resource}Action,
				batchDelete: actions.batchDelete{Resource}Action,
			}}
			enableCreate={true}
			enableEdit={true}
			enableDelete={true}
			enableBatchUpdate={true}
			enableBatchDelete={true}
			enableDetail={true}
		/>
	);
}
```

---

## 🔗 连表查询（foreignDB）配置详解

### 基本配置

```javascript
foreignDB: [
	{
		dbName: 'users',           // 副表集合名称
		localKey: 'userId',        // 本表字段
		foreignKey: 'id',          // 副表字段
		as: 'userInfo',            // 连表结果存放字段名
		limit: 1,                  // 限制返回数量（一对一：1，一对多：不设置）
		fieldJson: { id: 1, name: 1, email: 1 }, // 只返回需要的字段（可选）
	},
],
```

### 一对一关系示例（action_logs ↔ users）

**配置**：

```javascript
foreignDB: [
	{
		dbName: 'users',
		localKey: 'userId',      // action_logs.userId
		foreignKey: 'id',        // users.id
		as: 'userInfo',
		limit: 1,                // ✅ 一对一，限制返回 1 条
	},
],
```

**前端渲染**：

```javascript
{
	key: 'userInfo',
	title: 'User',
	type: 'custom',
	table: {
		show: true,
		width: 150,
		render: (userInfo, record) => {
			// userInfo 是数组（即使设置了 limit: 1）
			const user = Array.isArray(userInfo) && userInfo.length > 0 ? userInfo[0] : null;
			if (user) {
				return (
					<div>
						<div style={{ fontWeight: 500 }}>{user.name || 'N/A'}</div>
						<div style={{ fontSize: 12, color: '#999' }}>
							{user.email || record.userId}
						</div>
					</div>
				);
			}
			return <div style={{ color: '#999' }}>{record.userId}</div>;
		},
	},
	search: {
		show: true,
		type: 'input',
		key: 'userId',  // ✅ 搜索时实际搜索 userId 字段
		placeholder: 'Search by User ID or Name',
	},
	detail: { show: true },
}
```

### 一对多关系示例（users ↔ roles）

**配置**：

```javascript
foreignDB: [
	{
		dbName: 'roles',
		localKey: 'roles',       // users.roles 是角色 ID 数组
		foreignKey: 'id',        // roles.id
		as: 'roleList',
		// ✅ 一对多，不设置 limit
		fieldJson: { id: 1, name: 1, enable: 1 },
	},
],
```

**前端渲染**：

```javascript
{
	key: 'roles',
	title: 'Roles',
	type: 'select',
	options: roleOptions,  // 动态加载的角色选项
	form: {
		mode: 'multiple',  // 多选模式
		placeholder: 'Select roles',
	},
	table: {
		width: 150,
		render: (value, record) => {
			// 优先使用连表数据 roleList，fallback 到原始字段 roles
			const roles = record.roleList || value || [];
			if (!Array.isArray(roles) || roles.length === 0) {
				return <span style={{ color: '#999' }}>No roles</span>;
			}
			return (
				<Space wrap>
					{roles.map((item, index) => {
						// 如果是对象（连表数据），取 name；否则显示原值（UUID）
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
		mode: 'in',  // 数组包含查询（MongoDB $in 操作符）
		placeholder: 'Filter by roles',
	},
	detail: { show: true },
}
```

---

## 🎯 fieldsConfig 配置详解

### 字段结构

```javascript
{
	key: 'fieldName',        // 字段名（必填）
	title: 'Field Title',    // 显示标题（必填）
	type: 'text',            // 字段类型（必填）
	table: { ... },          // 表格配置
	search: { ... },         // 搜索配置
	form: { ... },           // 表单配置
	detail: { ... },         // 详情配置
}
```

### 字段类型（type）

- `text`: 文本
- `textarea`: 多行文本
- `number`: 数字
- `select`: 下拉选择
- `multiSelect`: 多选下拉
- `boolean`: 布尔值
- `datetime`: 日期时间
- `date`: 日期
- `time`: 时间
- `json`: JSON 数据
- `custom`: 自定义渲染

### table 配置

```javascript
table: {
	show: true,              // 是否在表格中显示（默认 true）
	width: 150,              // 列宽（可选）
	fixed: 'left',           // 固定列：'left' | 'right'（可选）
	align: 'center',         // 对齐方式：'left' | 'center' | 'right'
	sorter: true,            // 是否支持排序
	copyable: true,          // 是否支持复制
	ellipsis: true,          // 是否省略过长文本
	render: (value, record) => {
		// 自定义渲染
		return {
			type: 'tag',         // 'text' | 'tag' | 'badge' | 'link' | 'code' | 'custom'
			color: 'blue',       // 颜色（tag/badge 专用）
			text: value,         // 显示文本（可选，默认使用 value）
		};
	},
}
```

### search 配置

```javascript
search: {
	show: true,              // 是否在搜索表单中显示
	type: 'input',           // 搜索类型：'input' | 'select' | 'dateRange'
	key: 'userId',           // 实际搜索的字段名（可选，默认使用 key）
	placeholder: 'Search...', // 占位符
	mode: 'like',            // 搜索模式：'exact' | 'like' | 'in' | 'range'
	lazyLoad: true,          // 延迟加载（仅在展开时显示）
	transform: (value) => {  // 值转换函数（可选）
		// 例如：日期范围转换为 MongoDB 查询
		return value && value.length === 2
			? { $gte: new Date(value[0]), $lte: new Date(value[1]) }
			: undefined;
	},
	fieldProps: {            // 传递给 Ant Design 组件的额外属性
		mode: 'multiple',
		loading: false,
	},
}
```

### form 配置

```javascript
form: {
	show: true,              // 是否在表单中显示（默认 true）
	required: true,          // 是否必填
	disabled: false,         // 是否禁用
	placeholder: 'Enter...', // 占位符
	mode: 'multiple',        // select 专用：'multiple' | 'tags'
	rows: 4,                 // textarea 专用：行数
	min: 0,                  // number 专用：最小值
	max: 100,                // number 专用：最大值
	format: 'YYYY-MM-DD',    // datetime/date 专用：日期格式
}
```

### detail 配置

```javascript
detail: {
	show: true,              // 是否在详情中显示
	span: 24,                // 占据的列数（24 为全宽）
	render: (value, record) => {
		// 自定义渲染
		return {
			type: 'code',        // 'text' | 'code' | 'json' | 'custom'
			language: 'json',    // code 专用：语言类型
		};
	},
}
```

---

## 🔍 搜索模式详解

### 1. 精确匹配（exact）

```javascript
search: {
	mode: 'exact',  // 默认模式
}
```

**MongoDB 查询**：`{ field: value }`

### 2. 模糊匹配（like）

```javascript
search: {
	mode: 'like',
}
```

**MongoDB 查询**：`{ field: { $regex: value, $options: 'i' } }`

### 3. 数组包含（in）

```javascript
search: {
	mode: 'in',  // 用于数组字段
}
```

**MongoDB 查询**：`{ field: { $in: value } }`  
**示例**：搜索拥有某些角色的用户

### 4. 范围查询（range）

```javascript
search: {
	mode: 'range',
	transform: (value) => ({
		$gte: value[0],
		$lte: value[1],
	}),
}
```

**MongoDB 查询**：`{ field: { $gte: min, $lte: max } }`

---

## ✅ 最佳实践

### 1. 文件命名规范

- **Config**：`{resource}-crud.config.js`（例如：`action-logs-crud.config.js`）
- **Actions**：`admin-{resource}.js`（例如：`admin-action-logs.js`）
- **Page**：`page.js`（放在 `app/(admin)/admin/{module}/{resource}/` 目录下）

### 2. 导出命名规范

- **列表查询**：`get{Resource}ListAction`
- **详情查询**：`get{Resource}DetailAction`
- **创建**：`create{Resource}Action`
- **更新**：`update{Resource}Action`
- **删除**：`delete{Resource}Action`
- **批量更新**：`batchUpdate{Resource}Action`
- **批量删除**：`batchDelete{Resource}Action`

### 3. 字段配置技巧

- **连表字段**：
  - `key` 使用连表结果字段名（如 `userInfo`）
  - `search.key` 指向实际搜索字段（如 `userId`）
- **日期字段**：
  - `type: 'datetime'`
  - `search.type: 'dateRange'`
  - `search.transform` 转换为 MongoDB 查询
- **标签显示**：
  - `table.render` 返回 `{ type: 'tag', color: '...' }`

### 4. 连表查询技巧

- **一对一**：设置 `limit: 1`，渲染时取 `array[0]`
- **一对多**：不设置 `limit`，渲染时遍历数组
- **性能优化**：使用 `fieldJson` 只返回需要的字段

### 5. 权限控制

- 使用 `enableCreate`、`enableEdit`、`enableDelete` 控制按钮显示
- Server Actions 会自动验证权限（通过 `action-wrapper`）

### 6. 错误处理

- Config 中使用 `hooks.beforeXxx` 抛出错误来阻止操作
- Server Actions 会自动捕获并返回友好错误信息

---

## 🚀 快速开始模板

### 完整 CRUD 页面

```bash
# 1. 创建配置
touch app/(admin)/actions/{module}/configs/{resource}-crud.config.js

# 2. 创建 Actions
touch app/(admin)/actions/{module}/admin-{resource}.js

# 3. 创建页面
mkdir -p app/(admin)/admin/{module}/{resource}
touch app/(admin)/admin/{module}/{resource}/page.js

# 4. 添加菜单（在数据库中）
# 参考 scripts/add-action-logs-menu.mjs
```

### 只读日志页面

```bash
# 1. 创建配置（设置 hooks 禁止修改）
touch app/(admin)/actions/system/configs/{resource}-crud.config.js

# 2. 创建只读 Actions
touch app/(admin)/actions/system/admin-{resource}.js

# 3. 创建页面（禁用所有修改按钮）
mkdir -p app/(admin)/admin/system/{resource}
touch app/(admin)/admin/system/{resource}/page.js
```

---

## 📚 参考示例

### 完整示例页面

- **用户管理**：`app/(admin)/admin/rbac/users/page.js`
- **角色管理**：`app/(admin)/admin/rbac/roles/page.js`
- **权限管理**：`app/(admin)/admin/rbac/permissions/page.js`

### 只读示例页面

- **操作日志**：`app/(admin)/admin/system/action_logs/page.js`

### 自定义 Actions 示例

- **用户管理**：`app/(admin)/actions/rbac/admin-users.js`（包含封禁、重置密码等自定义操作）

---

## ⚠️ 常见问题

### 1. 连表数据没有显示？

**原因**：`foreignDB` 配置错误或字段名不匹配

**解决**：
- 检查 `localKey` 和 `foreignKey` 是否正确
- 确认使用 `localKey` 而不是 `localField`
- 确认副表字段确实存在（如 `users.id` 而不是 `users._id`）

### 2. 搜索不生效？

**原因**：`whereJson` 和 `filters` 参数混用

**解决**：
- SmartCrudPage 会自动转换为 `whereJson`
- BaseDAO 已支持 `whereJson`，无需手动转换
- 确保 `search.key` 指向正确的字段

### 3. 表格列没有标题？

**原因**：使用了 `label` 而不是 `title`

**解决**：
- 在 `fieldsConfig` 中使用 `title` 属性
- `label` 是旧版本的属性，已废弃

### 4. 日期范围搜索报错？

**原因**：没有使用 `transform` 转换为 MongoDB 查询

**解决**：

```javascript
search: {
	type: 'dateRange',
	transform: (value) =>
		value && value.length === 2
			? { $gte: new Date(value[0]), $lte: new Date(value[1]) }
			: undefined,
}
```

### 5. 自定义渲染不生效？

**原因**：`render` 函数返回值格式错误

**解决**：
- 确保返回 `{ type: '...', ... }` 格式
- 或者直接返回 React 元素（对于复杂渲染）

---

## 🎉 总结

遵循本指南的标准流程：

1. ✅ **配置先行**：创建 CRUD Config，定义字段、验证、连表规则
2. ✅ **基于 DAO**：使用 `createCrudActions` / `createReadOnlyActions` 创建 Actions
3. ✅ **前端统一**：使用 `SmartCrudPage` + `fieldsConfig` 生成页面
4. ✅ **连表规范**：使用 `foreignDB` 配置连表查询
5. ✅ **参数统一**：BaseDAO 已支持 `whereJson`，无需手动转换

**禁止绕过 DAO 层直接操作数据库**，这会导致：
- ❌ 权限验证失效
- ❌ 日志记录缺失
- ❌ 软删除逻辑失效
- ❌ 生命周期钩子不执行
- ❌ 代码重复和不一致

**始终使用 BaseDAO + action-wrapper 架构！**

