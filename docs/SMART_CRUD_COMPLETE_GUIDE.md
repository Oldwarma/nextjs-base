# Smart CRUD 完整开发指南

> **最后更新**: 2025-11-29  
> **版本**: v3.0.0  
> **目标读者**: AI Assistant、开发者  
> **用途**: 创建新的管理页面时的完整参考

---

## 📋 目录

1. [架构概述](#架构概述)
2. [文件结构规范](#文件结构规范)
3. [CRUD Config 配置详解](#crud-config-配置详解)
4. [Server Actions 编写规范](#server-actions-编写规范)
5. [Page 页面开发规范](#page-页面开发规范)
6. [字段类型完整参考](#字段类型完整参考)
7. [高级功能](#高级功能)
8. [最佳实践](#最佳实践)

---

## 架构概述

### 核心理念

Smart CRUD 采用**声明式配置**模式，通过一套统一的配置自动生成完整的 CRUD 功能。

### 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Page Layer (前端)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SmartCrudPage                                       │   │
│  │  - fieldsConfig (直接定义)                           │   │
│  │  - actions (Server Actions 引用)                     │   │
│  │  - UI 配置                                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Actions Layer (服务端)                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  crud-action.xxx.js                                  │   │
│  │  - xxxConfig (数据库配置)                            │   │
│  │  - createCrudActions(config)                         │   │
│  │  - 自定义 Actions                                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Core Layer (核心库)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ crud-helper │  │action-wrapper│ │     BaseDAO         │ │
│  │- createCrud │  │- wrapQuery  │  │- find/create/update │ │
│  │- createRead │  │- wrapAdmin  │  │- delete/aggregate   │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer (MongoDB)                   │
└─────────────────────────────────────────────────────────────┘
```

### 核心文件说明

| 文件 | 位置 | 职责 |
|------|------|------|
| `crud-helper.js` | `lib/core/` | 生成标准 CRUD Actions |
| `action-wrapper.js` | `lib/core/` | 包装 Actions（权限、日志） |
| `base-dao.js` | `lib/database/` | 数据库操作封装 |
| `smart-crud-page.jsx` | `components/admin/` | 前端 CRUD 组件 |
| `smart-form/*.jsx` | `components/admin/` | 表单组件 |

---

## 文件结构规范

### 两个文件原则

每个 CRUD 资源只需要 **2 个文件**：

```
app/(admin)/
├── admin/
│   └── {resource}/
│       └── page.js              # 前端页面
└── actions/
    └── {module}/
        └── crud-action.{resource}.js  # Server Actions
```

### ❌ 不需要的文件

```
# 以下文件结构已废弃，不要使用：

app/(admin)/actions/
└── {module}/
    └── configs/                 # ❌ 不需要单独的 config 目录
        └── xxx-crud.config.js   # ❌ 不需要单独的 config 文件
```

### 实际项目结构

```
app/(admin)/
├── admin/
│   ├── rbac/
│   │   ├── permissions/page.js
│   │   ├── roles/page.js
│   │   ├── menus/page.js
│   │   └── users/page.js
│   ├── cms/
│   │   └── post/page.js
│   └── system/
│       ├── action_logs/page.js
│       └── assets/page.js
└── actions/
    ├── rbac/
    │   ├── crud-action.permission.js
    │   ├── crud-action.role.js
    │   ├── crud-action.menu.js
    │   └── crud-action.user.js
    ├── cms/
    │   └── crud-action.post.js
    └── system/
        ├── admin-action-logs.js
        └── crud-action.assets.js
```

### 命名规范

| 类型 | 命名规则 | 示例 |
|------|---------|------|
| 页面文件 | `page.js` | `permissions/page.js` |
| Actions 文件 | `crud-action.{resource}.js` | `crud-action.permission.js` |
| 特殊 Actions | `admin-{resource}.js` | `admin-action-logs.js` |
| Actions 函数 | `{操作}{实体}Action` | `getPermissionListAction` |
| 配置对象 | `{resource}Config` | `permissionConfig` |

---

## CRUD Config 配置详解

### 完整配置模板

```javascript
const xxxConfig = {
	// ========== 基础配置 ==========
	collectionName: 'xxx',        // MongoDB 集合名（必需）
	primaryKey: 'id',             // 主键字段（默认 'id'）
	softDelete: false,            // 是否软删除（默认 false）

	// ========== 字段权限配置 ==========
	fields: {
		creatable: ['name', 'status', 'remark'],   // Create 允许的字段
		updatable: ['name', 'status', 'remark'],   // Update 允许的字段
		searchable: ['name', 'remark'],            // 可搜索的字段
	},

	// ========== 查询配置 ==========
	query: {
		defaultSort: { createdAt: -1 },   // 默认排序
		defaultPageSize: 20,               // 默认分页大小
		maxPageSize: 100,                  // 最大分页大小

		// 连表查询配置
		foreignDB: [
			{
				dbName: 'users',              // 目标集合名
				localKey: 'userId',           // 本地外键字段
				foreignKey: 'id',             // 目标集合主键
				as: 'userInfo',               // 结果字段名
				limit: 1,                     // 限制数量（1=一对一）
				fieldJson: {                  // 返回字段（投影）
					id: 1,
					name: 1,
					email: 1,
				},
				convertToObjectId: false,     // 是否转换为 ObjectId
			},
		],
	},

	// ========== 验证规则 ==========
	validation: {
		name: {
			required: true,                    // 必填
			type: 'string',                    // 类型
			minLength: 2,                      // 最小长度
			maxLength: 100,                    // 最大长度
			pattern: /^[a-zA-Z0-9]+$/,        // 正则验证
			enum: ['active', 'inactive'],      // 枚举值
			message: 'Custom error message',   // 错误提示
		},
	},

	// ========== 生命周期钩子 ==========
	hooks: {
		// 创建前
		beforeCreate: async (data) => {
			// 可以修改数据、设置默认值
			return data;
		},

		// 创建后
		afterCreate: async (id, data) => {
			// 可以发送通知、写日志
		},

		// 更新前
		beforeUpdate: async (id, data) => {
			// 可以修改数据、权限检查
			return data;
		},

		// 更新后
		afterUpdate: async (id, data) => {
			// 可以发送通知、清缓存
		},

		// 删除前
		beforeDelete: async (id) => {
			// 可以检查关联数据
			// 返回 true 允许删除，false 阻止删除
			return true;
		},

		// 删除后
		afterDelete: async (id) => {
			// 可以清理关联数据
		},

		// 查询后（列表）
		afterFind: async (records) => {
			// 可以转换数据格式
			return records;
		},

		// 查询后（详情）
		afterFindOne: async (record) => {
			// 可以补充关联数据
			return record;
		},
	},

	// ========== 数据转换 ==========
	transforms: {
		// 写入前转换
		input: (data) => {
			// 例：日期字符串转 Date 对象
			return data;
		},

		// 读取后转换
		output: (data) => {
			// 例：Date 对象转字符串
			return data;
		},
	},
};
```

### 字段权限说明

```javascript
fields: {
	// 正确：只包含用户可提交的字段
	creatable: ['name', 'status', 'description'],

	// ❌ 错误：不要包含以下字段
	// - id（自动生成 UUID）
	// - createdAt（自动设置）
	// - updatedAt（自动设置）
	// - _id（MongoDB 内部字段）

	// 正确：只包含允许修改的字段
	updatable: ['name', 'status', 'description'],

	// ❌ 错误：不要包含以下字段
	// - id（主键不可修改）
	// - createdAt（创建时间不可修改）
}
```

### 连表查询类型

#### 一对一关联

```javascript
foreignDB: [
	{
		dbName: 'users',
		localKey: 'userId',        // 本地字段存储用户 ID
		foreignKey: 'id',          // 关联 users.id
		as: 'userInfo',
		limit: 1,                  // 一对一
		fieldJson: { id: 1, name: 1, email: 1 },
	},
]
```

#### 一对多关联

```javascript
foreignDB: [
	{
		dbName: 'roles',
		localKey: 'roles',         // 本地字段是数组 ['role1', 'role2']
		foreignKey: 'id',
		as: 'roleList',            // 结果也是数组
		fieldJson: { id: 1, name: 1 },
		// 不设置 limit，返回所有匹配记录
	},
]
```

#### 自引用关联（树形结构）

```javascript
foreignDB: [
	{
		dbName: 'menus',           // 同一个集合
		localKey: 'parent_id',
		foreignKey: 'id',
		as: 'parentInfo',
		limit: 1,
		fieldJson: { id: 1, name: 1 },
	},
]
```

---

## Server Actions 编写规范

### 标准模板

```javascript
'use server';

import { createCrudActions } from '@/lib/core/crud-helper';
import { wrapQueryAction, wrapAdminAction } from '@/lib/core/action-wrapper';

/**
 * Xxx CRUD 配置
 */
const xxxConfig = {
	collectionName: 'xxx',
	primaryKey: 'id',
	fields: {
		creatable: ['name', 'status'],
		updatable: ['name', 'status'],
		searchable: ['name'],
	},
	query: {
		defaultSort: { createdAt: -1 },
	},
};

/**
 * 创建标准 CRUD Actions
 */
const crudActions = createCrudActions(xxxConfig);

/**
 * 导出标准 CRUD Actions
 */
export const getXxxListAction = crudActions.getList;
export const getXxxDetailAction = crudActions.getDetail;
export const createXxxAction = crudActions.create;
export const updateXxxAction = crudActions.update;
export const deleteXxxAction = crudActions.delete;
export const batchUpdateXxxAction = crudActions.batchUpdate;
export const batchDeleteXxxAction = crudActions.batchDelete;

/**
 * 自定义 Action 示例
 */
export const customXxxAction = wrapAdminAction(
	'custom',
	'xxx',
	async (params, context) => {
		const { userId } = context;
		// 业务逻辑
		return { success: true, data: {} };
	}
);
```

### 只读 Actions（日志、记录类）

```javascript
'use server';

import { createReadOnlyActions } from '@/lib/core/crud-helper';

/**
 * Action Logs 配置
 */
const actionLogsConfig = {
	collectionName: 'action_logs',
	primaryKey: 'id',
	fields: {
		searchable: ['action', 'resourceType', 'userId'],
	},
	query: {
		defaultSort: { createdAt: -1 },
		foreignDB: [
			{
				dbName: 'users',
				localKey: 'userId',
				foreignKey: 'id',
				as: 'userInfo',
				limit: 1,
				fieldJson: { id: 1, name: 1, email: 1 },
			},
		],
	},
};

/**
 * 创建只读 Actions
 */
const crudActions = createReadOnlyActions(actionLogsConfig);

export const getActionLogListAction = crudActions.getList;
export const getActionLogDetailAction = crudActions.getDetail;
```

### 自定义 Action 类型

#### 查询类 Action

```javascript
export const getXxxTreeAction = wrapQueryAction('xxx', async (params) => {
	const dao = new BaseDAO('xxx', 'id');
	const records = await dao.find({}, { sort: { sort: 1 } });

	// 构建树形结构
	const tree = buildTree(records);
	return { success: true, data: tree };
});
```

#### 管理类 Action

```javascript
export const approveXxxAction = wrapAdminAction(
	'approve',           // 操作类型
	'xxx',               // 资源类型
	async (params, context) => {
		const { id } = params;
		const { userId } = context;

		const dao = new BaseDAO('xxx', 'id');
		await dao.update(id, {
			status: 'approved',
			approvedBy: userId,
			approvedAt: new Date(),
		});

		return { success: true };
	},
	{
		permissionId: 'approveXxxAction',  // 权限标识
		skipLog: false,                     // 是否跳过日志
	}
);
```

---

## Page 页面开发规范

### 标准模板

```javascript
/**
 * Xxx Management Page
 */

'use client';

import SmartCrudPage from '@/components/admin/smart-crud-page';
import * as xxxActions from '@/app/(admin)/actions/module/crud-action.xxx';

export default function XxxManagementPage() {
	// 直接定义 fieldsConfig（不使用 useMemo）
	const fieldsConfig = [
		{
			key: 'id',
			title: 'ID',
			type: 'text',
			table: false,
			form: false,
			search: false,
		},
		{
			key: 'name',
			title: 'Name',
			type: 'text',
			table: { width: 200 },
			form: { required: true },
			search: { mode: 'like' },
		},
		// ... 更多字段
	];

	return (
		<SmartCrudPage
			fieldsConfig={fieldsConfig}
			actions={{
				getList: xxxActions.getXxxListAction,
				create: xxxActions.createXxxAction,
				update: xxxActions.updateXxxAction,
				delete: xxxActions.deleteXxxAction,
			}}
			title="Xxx Management"
			rowKey="id"
			enableCreate={true}
			enableEdit={true}
			enableDelete={true}
		/>
	);
}
```

### 关键规范

#### 正确做法

```javascript
// 1. 直接导入 SmartCrudPage
import SmartCrudPage from '@/components/admin/smart-crud-page';

// 2. 直接定义 fieldsConfig
const fieldsConfig = [...];

// 3. 使用 actions 属性
actions={{
	getList: xxxActions.getXxxListAction,
}}
```

#### ❌ 错误做法

```javascript
// 1. 不要使用动态导入
const SmartCrudPage = dynamic(() => import('@/components/admin/smart-crud-page'), {
	ssr: false,
});

// 2. 不要使用 useMemo 包裹 fieldsConfig
const fieldsConfig = useMemo(() => [...], []);

// 3. 不要使用 api 属性（已废弃）
api={{
	getList: '/api/xxx/list',
}}
```

### tree-select 动态加载

```javascript
// fieldsConfig 中配置
{
	key: 'parent_id',
	title: 'Parent',
	type: 'tree-select',
	form: {
		action: 'getTreeForSelectAction',  // 使用 action 名称
		fieldProps: {
			allowClear: true,
			showSearch: true,
		},
	},
}

// actions 中注册
actions={{
	getList: xxxActions.getXxxListAction,
	create: xxxActions.createXxxAction,
	update: xxxActions.updateXxxAction,
	delete: xxxActions.deleteXxxAction,
	// 注册动态加载 Action
	getTreeForSelectAction: xxxActions.getTreeForSelectAction,
}}
```

---

## 字段类型完整参考

### 基础类型

| 类型 | 说明 | 表格显示 | 表单组件 |
|------|------|---------|---------|
| `text` | 单行文本 | 文本 | Input |
| `textarea` | 多行文本 | 文本 | TextArea |
| `number` | 数字 | 数字 | InputNumber |
| `money` | 金额 | 格式化金额 | InputNumber |
| `password` | 密码 | 掩码 | Password |

### 选择类型

| 类型 | 说明 | 表格显示 | 表单组件 |
|------|------|---------|---------|
| `select` | 下拉选择 | Tag | Select |
| `radio` | 单选按钮 | Tag | Radio.Group |
| `checkbox` | 多选框 | Tags | Checkbox.Group |
| `switch` | 开关 | Switch | Switch |
| `tree-select` | 树形选择 | 文本 | TreeSelect |
| `cascader` | 级联选择 | 文本 | Cascader |

### 日期时间类型

| 类型 | 说明 | 表格显示 | 表单组件 |
|------|------|---------|---------|
| `date` | 日期 | 格式化日期 | DatePicker |
| `datetime` | 日期时间 | 格式化日期时间 | DatePicker |
| `time` | 时间 | 格式化时间 | TimePicker |
| `dateRange` | 日期范围 | - | RangePicker |

### 上传类型

| 类型 | 说明 | 表格显示 | 表单组件 |
|------|------|---------|---------|
| `image` | 图片上传 | Image | ImageUpload |
| `avatar` | 头像上传 | Avatar | AvatarUpload |
| `file` | 文件上传 | 链接 | FileUpload |

### 高级类型

| 类型 | 说明 | 表格显示 | 表单组件 |
|------|------|---------|---------|
| `array` | 数组 | Tags | ArrayEditor |
| `json` | JSON | 代码 | JsonEditor |
| `markdown` | Markdown | 预览 | MarkdownEditor |
| `icon` | 图标 | Icon | IconPicker |
| `rate` | 评分 | Rate | Rate |
| `slider` | 滑块 | 数值 | Slider |
| `color` | 颜色 | 色块 | ColorPicker |

### 布局类型

| 类型 | 说明 | 用途 |
|------|------|------|
| `group` | 分组 | 表单字段分组 |

---

## 高级功能

### 自定义行操作

```javascript
const customRowActions = [
	{
		key: 'approve',
		text: 'Approve',
		icon: <CheckOutlined />,
		onClick: async (record) => {
			const result = await approveAction(record.id);
			if (result.success) {
				message.success('Approved');
			}
		},
	},
	{
		key: 'reject',
		text: 'Reject',
		danger: true,
		confirm: {
			title: 'Reject this item?',
			description: 'This action cannot be undone.',
		},
		onClick: async (record) => {
			await rejectAction(record.id);
		},
	},
];

<SmartCrudPage customRowActions={customRowActions} />
```

### 批量操作

```javascript
const batchActions = [
	{
		key: 'activate',
		label: 'Batch Activate',
		action: async (selectedKeys) => {
			return await batchUpdateAction(selectedKeys, { status: 'active' });
		},
	},
	{
		key: 'delete',
		label: 'Batch Delete',
		danger: true,
		action: async (selectedKeys) => {
			return await batchDeleteAction(selectedKeys);
		},
	},
];

<SmartCrudPage batchActions={batchActions} />
```

### 树形表格

```javascript
<SmartCrudPage
	expandable={{
		defaultExpandAllRows: true,
		indentSize: 24,
	}}
	tableProps={{
		pagination: false,
	}}
/>
```

### 字段联动

```javascript
{
	key: 'type',
	title: 'Type',
	type: 'select',
	options: [
		{ label: 'Basic', value: 'basic' },
		{ label: 'Advanced', value: 'advanced' },
	],
	form: {
		required: true,
	},
},
{
	key: 'advancedOption',
	title: 'Advanced Option',
	type: 'text',
	// 条件显示：只有 type === 'advanced' 时显示
	showRule: "type === 'advanced'",
	form: {
		required: true,
	},
},
```

### 字段监听

```javascript
{
	key: 'price',
	title: 'Price',
	type: 'money',
	form: {
		required: true,
	},
	watch: ({ value, formData, $set }) => {
		// 自动计算总价
		const quantity = formData.quantity || 1;
		$set('totalPrice', value * quantity);
	},
},
```

---

## 最佳实践

### 1. 配置放在 Action 文件中

```javascript
// 正确：配置和 Actions 在同一个文件
// crud-action.xxx.js
'use server';

const xxxConfig = { ... };
const crudActions = createCrudActions(xxxConfig);
export const getXxxListAction = crudActions.getList;
```

```javascript
// ❌ 错误：单独的配置文件
// configs/xxx-crud.config.js
export const xxxConfig = { ... };

// crud-action.xxx.js
import { xxxConfig } from './configs/xxx-crud.config';
```

### 2. 直接导入组件

```javascript
// 正确
import SmartCrudPage from '@/components/admin/smart-crud-page';
```

```javascript
// ❌ 错误
const SmartCrudPage = dynamic(() => import('@/components/admin/smart-crud-page'), {
	ssr: false,
});
```

### 3. 直接定义 fieldsConfig

```javascript
// 正确
const fieldsConfig = [...];
```

```javascript
// ❌ 错误
const fieldsConfig = useMemo(() => [...], []);
```

### 4. 使用 action 属性加载动态数据

```javascript
// 正确：使用 action 名称
{
	type: 'tree-select',
	form: {
		action: 'getTreeForSelectAction',
	},
}
```

```javascript
// ❌ 错误：使用 data 属性和 useState
const [treeData, setTreeData] = useState([]);
useEffect(() => {
	loadTreeData().then(setTreeData);
}, []);

{
	type: 'tree-select',
	form: {
		data: treeData,
	},
}
```

### 5. 连表数据访问

```javascript
// 正确：使用 record.{as} 访问，提供 fallback
{
	key: 'userId',
	title: 'User',
	table: {
		render: (value, record) => {
			const user = record.userInfo;  // 使用 foreignDB 的 as 字段
			return user ? user.name : value;  // 提供 fallback
		},
	},
}
```

```javascript
// ❌ 错误：直接显示 ID
{
	key: 'userId',
	title: 'User',
	table: true,  // 只显示 userId
}
```

---

## 相关文档

- [SmartForm 使用指南](./admin/SMART_FORM_GUIDE.md)
- [BaseDAO 文档](./admin/BASE_DAO.md)
- [DB API 文档](./database/DB_API_GUIDE.md)
- [权限系统文档](./rbac/)

---

## 许可证

MIT License
