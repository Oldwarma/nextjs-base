# Smart CRUD 开发指南

> **最后更新**: 2025-11-29  
> **版本**: v3.0.0  
> **目标读者**: AI Assistant、开发者  
> **用途**: 创建新的管理页面时的完整参考

---

## 📋 目录

1. [快速开始](#快速开始)
2. [两步创建新页面](#两步创建新页面)
3. [Page 页面开发规范](#page-页面开发规范)
4. [Server Actions 编写规范](#server-actions-编写规范)
5. [字段配置详解](#字段配置详解)
6. [字段类型完整参考](#字段类型完整参考)
7. [连表查询配置](#连表查询配置)
8. [常见场景](#常见场景)
9. [检查清单](#检查清单)

---

## 快速开始

### 什么是 Smart CRUD？

Smart CRUD 是一个统一的 CRUD 开发框架，通过**声明式配置**自动生成：
- 列表页表格
- 创建/编辑表单
- 搜索筛选器
- 详情查看
- 批量操作

### 核心优势

| 传统方式 | Smart CRUD |
|---------|-----------|
| 手写 500+ 行代码 | 配置 100 行 |
| 重复定义字段 | 定义一次，到处使用 |
| 手动处理增删改查 | 自动生成 |
| 手动拼接查询条件 | 自动生成 MongoDB 查询 |
| 手动处理表单验证 | 声明式验证规则 |

---

## 两步创建新页面

### 📁 文件结构（两个文件原则）

每个 CRUD 资源只需要 **2 个文件**：

```
app/(admin)/
├── admin/
│   └── {resource}/
│       └── page.js              # 前端页面（fieldsConfig + UI）
└── actions/
    └── {module}/
        └── crud-action.{resource}.js  # Server Actions（配置 + Actions）
```

**核心规则：**

- `page.js` - 包含 `fieldsConfig`（直接定义）+ UI 逻辑
- `crud-action.{resource}.js` - 包含配置 + Server Actions（`'use server'`）
- ❌ **不需要**额外的 config 文件
- ❌ **不需要**动态导入 SmartCrudPage
- ❌ **不需要** useMemo 包裹 fieldsConfig

### 实际案例

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
	// 直接定义 fieldsConfig（无需 useMemo）
	const fieldsConfig = [
		// ID 字段（自动生成，不显示）
		{
			key: 'id',
			title: 'ID',
			type: 'text',
			table: false,
			form: false,
			search: false,
		},

		// 名称字段
		{
			key: 'name',
			title: 'Name',
			type: 'text',
			table: {
				width: 200,
				ellipsis: true,
			},
			form: {
				required: true,
				placeholder: 'Enter name',
			},
			search: {
				mode: 'like',
				placeholder: 'Search by name',
			},
		},

		// 状态字段
		{
			key: 'status',
			title: 'Status',
			type: 'select',
			options: [
				{ label: 'Active', value: 'active', color: 'green' },
				{ label: 'Inactive', value: 'inactive', color: 'red' },
			],
			table: {
				width: 100,
			},
			form: {
				required: true,
			},
			search: {
				mode: 'exact',
			},
		},

		// 创建时间（只读）
		{
			key: 'createdAt',
			title: 'Created At',
			type: 'datetime',
			table: {
				width: 180,
				sorter: true,
			},
			form: false,
			search: false,
		},
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
			enableDetail={true}
			tableProps={{
				scroll: { x: 1200 },
			}}
			formProps={{
				width: 600,
			}}
		/>
	);
}
```

### SmartCrudPage 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fieldsConfig` | Array | [] | 统一的字段配置（核心） |
| `actions` | Object | {} | Server Actions |
| `actions.getList` | Function | - | 获取列表（必需） |
| `actions.getDetail` | Function | - | 获取详情（可选） |
| `actions.create` | Function | - | 创建（可选） |
| `actions.update` | Function | - | 更新（必需） |
| `actions.delete` | Function | - | 删除（必需） |
| `title` | String | 'Data Management' | 页面标题 |
| `rowKey` | String | 'id' | 主键字段 |
| `enableCreate` | Boolean | false | 启用创建 |
| `enableDetail` | Boolean | true | 启用详情 |
| `enableEdit` | Boolean | true | 启用编辑 |
| `enableDelete` | Boolean | true | 启用删除 |
| `enableIndexColumn` | Boolean | false | 显示序号列 |
| `tableProps` | Object | {} | ProTable 额外属性 |
| `formProps` | Object | {} | ModalForm 额外属性 |
| `batchActions` | Array | [] | 批量操作配置 |
| `customRowActions` | Array | [] | 自定义行操作 |
| `customToolbarButtons` | Array | [] | 自定义工具栏按钮 |
| `expandable` | Object | - | 树形表格配置 |
| `baseQuery` | Object | {} | 基础查询条件 |

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
	// 基础配置
	collectionName: 'xxx',
	primaryKey: 'id',
	softDelete: false,

	// 字段配置
	fields: {
		creatable: ['name', 'status', 'remark'],
		updatable: ['name', 'status', 'remark'],
		searchable: ['name', 'remark'],
	},

	// 查询配置
	query: {
		defaultSort: { createdAt: -1 },
		defaultPageSize: 20,
		// 连表查询（可选）
		foreignDB: [],
	},

	// 验证规则
	validation: {
		name: {
			required: true,
			type: 'string',
			minLength: 2,
			maxLength: 100,
			message: 'Name must be 2-100 characters',
		},
	},

	// 生命周期钩子（可选）
	hooks: {
		beforeCreate: async (data) => {
			// 创建前处理
			return data;
		},
		beforeUpdate: async (id, data) => {
			// 更新前处理
			return data;
		},
		beforeDelete: async (id) => {
			// 删除前检查
			return true;
		},
	},

	// 数据转换（可选）
	transforms: {
		input: (data) => {
			// 写入数据库前的处理
			return data;
		},
		output: (data) => {
			// 从数据库读取后的处理
			return data;
		},
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
 * 自定义 Actions（可选）
 */
export const customXxxAction = wrapAdminAction('custom', 'xxx', async (params, context) => {
	const { userId } = context;
	// 自定义逻辑
	return { success: true, data: {} };
});
```

### 核心函数说明

#### createCrudActions(config)

自动生成标准 CRUD Actions：

```javascript
const crudActions = createCrudActions(config);

// 自动生成的 Actions：
crudActions.getList    // 获取列表（分页、搜索、排序）
crudActions.getDetail  // 获取详情
crudActions.create     // 创建
crudActions.update     // 更新
crudActions.delete     // 删除
crudActions.batchUpdate // 批量更新
crudActions.batchDelete // 批量删除
crudActions._dao       // 底层 DAO 实例（高级用法）
```

#### createReadOnlyActions(config)

生成只读 Actions（用于日志、交易记录等）：

```javascript
const crudActions = createReadOnlyActions(config);

// 只生成查询 Actions：
crudActions.getList
crudActions.getDetail
```

#### wrapQueryAction(resourceType, handler)

包装查询类 Action，自动处理权限验证：

```javascript
export const getXxxTreeAction = wrapQueryAction('xxx', async (params) => {
	// 查询逻辑
	return { success: true, data: [] };
});
```

#### wrapAdminAction(action, resourceType, handler, options)

包装管理类 Action，自动处理权限验证和日志记录：

```javascript
export const customXxxAction = wrapAdminAction(
	'custom',        // 操作类型
	'xxx',           // 资源类型
	async (params, context) => {
		const { userId, isAdmin } = context;
		// 业务逻辑
		return { success: true, data: {} };
	},
	{
		permissionId: 'customXxxAction',  // 权限标识
		skipLog: false,                    // 是否跳过日志
	}
);
```

### 配置详解

#### fields（字段权限）

```javascript
fields: {
	creatable: ['name', 'status'],   // Create 时允许的字段
	updatable: ['name', 'status'],   // Update 时允许的字段
	searchable: ['name'],            // 可搜索的字段
}
```

**注意：**
- `id` 主键**不要**放在 `creatable` 中（自动生成 UUID）
- `createdAt`、`updatedAt` **不要**放在 `updatable` 中（自动管理）

#### validation（验证规则）

```javascript
validation: {
	name: {
		required: true,                    // 必填
		type: 'string',                    // 类型
		minLength: 2,                      // 最小长度
		maxLength: 100,                    // 最大长度
		pattern: /^[a-zA-Z0-9]+$/,        // 正则
		enum: ['active', 'inactive'],      // 枚举值
		message: 'Custom error message',   // 错误提示
	},
}
```

#### hooks（生命周期钩子）

```javascript
hooks: {
	beforeCreate: async (data) => {
		// 创建前：设置默认值、自动填充字段
		return data;
	},
	beforeUpdate: async (id, data) => {
		// 更新前：权限检查、数据处理
		return data;
	},
	beforeDelete: async (id) => {
		// 删除前：权限检查、关联检查
		return true; // 返回 true 允许删除
	},
	afterDelete: async (id) => {
		// 删除后：清理关联数据
	},
	afterFind: async (records) => {
		// 查询后：数据转换、关联数据填充
		return records;
	},
}
```

#### query.foreignDB（连表查询）

```javascript
query: {
	foreignDB: [
		{
			dbName: 'users',              // 目标表名
			localKey: 'userId',           // 本地外键字段
			foreignKey: 'id',             // 目标表主键
			as: 'userInfo',               // 结果字段名
			limit: 1,                     // 一对一关系
			fieldJson: {                  // 只返回需要的字段
				id: 1,
				name: 1,
				email: 1,
			},
			convertToObjectId: true,      // 是否转换为 ObjectId
		},
	],
}
```

---

## 字段配置详解

### 基础结构

```javascript
{
	key: 'fieldName',           // 必需：字段名
	title: 'Field Title',       // 必需：显示标题
	type: 'text',               // 必需：字段类型

	// 表格配置
	table: {
		width: 120,              // 列宽
		ellipsis: true,          // 超长省略
		copyable: true,          // 可复制
		sorter: true,            // 可排序
		align: 'center',         // 对齐方式
		render: (value, record) => <span>{value}</span>,  // 自定义渲染
	},

	// 表单配置
	form: {
		required: true,          // 是否必填
		placeholder: 'Enter...', // 占位符
		disabled: false,         // 是否禁用
		tips: 'Some tips',       // 提示信息
		fieldProps: {},          // Ant Design 组件原生属性
		rules: [],               // 额外验证规则
		initialValue: '',        // 默认值
		action: 'getTreeAction', // 动态加载数据的 Action 名称
		dependencies: ['field'], // 依赖字段
	},

	// 搜索配置
	search: {
		enabled: true,           // 启用搜索
		mode: 'like',            // 搜索模式
		placeholder: 'Search...', // 占位符
	},

	// 详情配置
	detail: {
		render: (value, record) => value,  // 自定义渲染
	},

	// 选项数据（用于 select、radio 等）
	options: [
		{ label: 'Option 1', value: 'value1', color: 'blue' },
	],

	// 条件显示
	showRule: "type === 'advanced'",

	// 字段联动
	watch: ({ value, formData, $set }) => {
		$set('otherField', value);
	},
}
```

### 搜索模式

| 模式 | 说明 | MongoDB 转换 |
|------|------|-------------|
| `like` | 模糊搜索 | `{ $regex: value, $options: 'i' }` |
| `exact` | 精确匹配 | `{ field: value }` |
| `in` | 数组包含 | `{ field: { $in: values } }` |
| `range` | 范围查询 | `{ field: { $gte: start, $lte: end } }` |

---

## 字段类型完整参考

### 基础类型

| 类型 | 说明 | 适用场景 |
|------|------|---------|
| `text` | 单行文本 | 名称、标题 |
| `textarea` | 多行文本 | 描述、备注 |
| `number` | 数字输入 | 数量、排序 |
| `money` | 金额输入 | 价格、费用 |
| `password` | 密码输入 | 密码字段 |

### 选择类型

| 类型 | 说明 | 适用场景 |
|------|------|---------|
| `select` | 下拉选择 | 单选（状态、分类） |
| `radio` | 单选按钮 | 小数量选项 |
| `checkbox` | 多选框 | 多选选项 |
| `switch` | 开关 | 布尔值（启用/禁用） |
| `tree-select` | 树形选择 | 父级选择、分类选择 |
| `cascader` | 级联选择 | 地区选择 |

### 日期时间类型

| 类型 | 说明 | 适用场景 |
|------|------|---------|
| `date` | 日期选择 | 生日、日期 |
| `datetime` | 日期时间选择 | 创建时间、更新时间 |
| `time` | 时间选择 | 营业时间 |
| `dateRange` | 日期范围选择 | 搜索时间段 |

### 上传类型

| 类型 | 说明 | 适用场景 |
|------|------|---------|
| `image` | 图片上传 | 封面图、轮播图 |
| `avatar` | 头像上传 | 用户头像 |
| `file` | 文件上传 | 附件、文档 |

### 高级类型

| 类型 | 说明 | 适用场景 |
|------|------|---------|
| `array` | 数组编辑器 | 标签列表、多值输入 |
| `json` | JSON 编辑器 | 配置数据 |
| `markdown` | Markdown 编辑器 | 文档内容 |
| `icon` | 图标选择 | 菜单图标 |
| `rate` | 评分 | 星级评分 |
| `slider` | 滑块 | 数值范围 |
| `color` | 颜色选择 | 颜色配置 |

### 布局类型

| 类型 | 说明 | 适用场景 |
|------|------|---------|
| `group` | 分组容器 | 将表单字段分组显示 |

---

## 连表查询配置

### 一对一关联

```javascript
// Server Action 配置
query: {
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
}

// Page 字段配置
{
	key: 'userId',
	title: 'User',
	table: {
		render: (value, record) => {
			const user = record.userInfo;
			return user ? user.name : value;
		},
	},
}
```

### 一对多关联

```javascript
// Server Action 配置
query: {
	foreignDB: [
		{
			dbName: 'roles',
			localKey: 'roles',        // 数组字段
			foreignKey: 'id',
			as: 'roleList',           // 结果也是数组
			fieldJson: { id: 1, name: 1 },
		},
	],
}

// Page 字段配置
{
	key: 'roles',
	title: 'Roles',
	table: {
		render: (value, record) => {
			const roles = record.roleList || [];
			return (
				<Space wrap>
					{roles.map(role => (
						<Tag key={role.id}>{role.name}</Tag>
					))}
				</Space>
			);
		},
	},
}
```

---

## 常见场景

### 场景 1：只读页面（日志、交易记录）

```javascript
// Server Action
const crudActions = createReadOnlyActions(config);

export const getLogListAction = crudActions.getList;
export const getLogDetailAction = crudActions.getDetail;

// Page
<SmartCrudPage
	enableCreate={false}
	enableEdit={false}
	enableDelete={false}
	enableDetail={true}
/>
```

### 场景 2：树形表格

```javascript
// Page
<SmartCrudPage
	expandable={{
		defaultExpandAllRows: true,
		indentSize: 24,
	}}
	tableProps={{
		pagination: false,  // 树形表格通常不分页
	}}
/>
```

### 场景 3：tree-select 动态加载

```javascript
// Page fieldsConfig
{
	key: 'parent_id',
	title: 'Parent',
	type: 'tree-select',
	form: {
		action: 'getTreeForSelectAction',  // Action 名称
		fieldProps: {
			allowClear: true,
			showSearch: true,
		},
	},
}

// actions 配置
actions={{
	getList: actions.getListAction,
	create: actions.createAction,
	// 注册动态加载 Action
	getTreeForSelectAction: actions.getTreeForSelectAction,
}}
```

### 场景 4：自定义行操作

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

### 场景 5：批量操作

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

---

## 检查清单

### 创建新页面前

- [ ] 确定数据结构（字段、类型、关联）
- [ ] 确定主键使用 `id`（UUID）
- [ ] 确定需要哪些 CRUD 操作
- [ ] 确定是否需要连表查询

### Server Action 检查

- [ ] 使用 `'use server'` 指令
- [ ] 配置直接写在 action 文件中（不使用单独的 config 文件）
- [ ] 使用 `createCrudActions` 或 `createReadOnlyActions`
- [ ] `fields.creatable` 不包含 `id`
- [ ] `fields.updatable` 不包含 `id`、`createdAt`、`updatedAt`
- [ ] 函数命名遵循规范（`{操作}{实体}Action`）

### Page 检查

- [ ] 使用直接导入（不使用 dynamic import）
- [ ] `fieldsConfig` 直接定义（不使用 useMemo）
- [ ] 设置 `rowKey="id"`
- [ ] 使用 `actions` 属性（不是 `api`）
- [ ] 连表字段使用 `record.{as}` 访问
- [ ] 连表字段提供 fallback

### 测试检查

- [ ] 列表页加载正常
- [ ] 搜索功能正常
- [ ] 创建功能正常
- [ ] 编辑功能正常
- [ ] 删除功能正常
- [ ] 连表数据显示正常

---

## 相关文档

- [SmartCrudPage 完整指南](../SMART_CRUD_COMPLETE_GUIDE.md)
- [SmartForm 使用指南](./SMART_FORM_GUIDE.md)
- [BaseDAO 文档](./BASE_DAO.md)
- [DB API 文档](../database/DB_API_GUIDE.md)

---

## 许可证

MIT License
