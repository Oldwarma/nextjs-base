# SmartForm 使用指南

> **最后更新**: 2025-11-29  
> **版本**: v3.0.0  
> **目标读者**: AI Assistant、开发者  
> **用途**: 独立使用 SmartForm 组件的参考

---

## 📋 目录

1. [概述](#概述)
2. [组件类型](#组件类型)
3. [基础用法](#基础用法)
4. [fieldsConfig 配置](#fieldsconfig-配置)
5. [表单属性](#表单属性)
6. [字段类型详解](#字段类型详解)
7. [高级功能](#高级功能)
8. [最佳实践](#最佳实践)

---

## 概述

SmartForm 是一套基于 Ant Design ProForm 的声明式表单组件，通过 `fieldsConfig` 配置自动生成表单。

### 核心优势

- 声明式配置，减少重复代码
- 统一的字段类型系统
- 支持字段联动和条件显示
- 内置验证规则
- 支持动态数据加载

### 组件关系

```
SmartForm (基础表单)
├── SmartModalForm (弹窗表单)
└── SmartDrawerForm (抽屉表单)
```

---

## 组件类型

### SmartForm

基础表单组件，直接渲染在页面中。

```javascript
import { SmartForm } from '@/components/admin/smart-form';

<SmartForm
	fieldsConfig={fieldsConfig}
	onFinish={handleSubmit}
/>
```

### SmartModalForm

弹窗表单，用于创建/编辑场景。

```javascript
import { SmartModalForm } from '@/components/admin/smart-form';

<SmartModalForm
	title="Create Item"
	trigger={<Button>Create</Button>}
	fieldsConfig={fieldsConfig}
	onFinish={handleSubmit}
/>
```

### SmartDrawerForm

抽屉表单，适合字段较多的场景。

```javascript
import { SmartDrawerForm } from '@/components/admin/smart-form';

<SmartDrawerForm
	title="Edit Item"
	trigger={<Button>Edit</Button>}
	fieldsConfig={fieldsConfig}
	initialValues={record}
	onFinish={handleSubmit}
/>
```

---

## 基础用法

### 简单表单

```javascript
'use client';

import { SmartForm } from '@/components/admin/smart-form';
import { message } from 'antd';

export default function SimpleForm() {
	const fieldsConfig = [
		{
			key: 'name',
			title: 'Name',
			type: 'text',
			form: {
				required: true,
				placeholder: 'Enter name',
			},
		},
		{
			key: 'email',
			title: 'Email',
			type: 'text',
			form: {
				required: true,
				rules: [
					{ type: 'email', message: 'Please enter a valid email' },
				],
			},
		},
		{
			key: 'status',
			title: 'Status',
			type: 'select',
			options: [
				{ label: 'Active', value: 'active' },
				{ label: 'Inactive', value: 'inactive' },
			],
			form: {
				required: true,
			},
		},
	];

	const handleSubmit = async (values) => {
		console.log('Form values:', values);
		message.success('Submitted successfully');
		return true; // 返回 true 关闭弹窗/抽屉
	};

	return (
		<SmartForm
			fieldsConfig={fieldsConfig}
			onFinish={handleSubmit}
			submitText="Submit"
		/>
	);
}
```

### 弹窗表单

```javascript
'use client';

import { SmartModalForm } from '@/components/admin/smart-form';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export default function ModalFormExample() {
	const fieldsConfig = [
		{
			key: 'title',
			title: 'Title',
			type: 'text',
			form: { required: true },
		},
		{
			key: 'content',
			title: 'Content',
			type: 'textarea',
			form: { required: true },
		},
	];

	const handleSubmit = async (values) => {
		const result = await createItemAction(values);
		if (result.success) {
			message.success('Created successfully');
			return true;
		}
		message.error(result.error);
		return false;
	};

	return (
		<SmartModalForm
			title="Create Item"
			trigger={
				<Button type="primary" icon={<PlusOutlined />}>
					Create
				</Button>
			}
			fieldsConfig={fieldsConfig}
			onFinish={handleSubmit}
			width={600}
		/>
	);
}
```

---

## fieldsConfig 配置

### 完整字段结构

```javascript
{
	// ========== 基础配置 ==========
	key: 'fieldName',           // 字段名（必需）
	title: 'Field Title',       // 显示标题（必需）
	type: 'text',               // 字段类型（必需）

	// ========== 表单配置 ==========
	form: {
		// 基础属性
		required: true,          // 是否必填
		disabled: false,         // 是否禁用
		readonly: false,         // 是否只读
		hidden: false,           // 是否隐藏
		placeholder: 'Enter...', // 占位符
		initialValue: '',        // 默认值
		tips: 'Some tips',       // 提示信息

		// 验证规则
		rules: [
			{ required: true, message: 'This field is required' },
			{ min: 2, message: 'Minimum 2 characters' },
			{ max: 100, message: 'Maximum 100 characters' },
			{ type: 'email', message: 'Invalid email format' },
			{ pattern: /^[a-z]+$/, message: 'Only lowercase letters' },
		],

		// 组件属性（传递给 Ant Design 组件）
		fieldProps: {
			allowClear: true,
			showSearch: true,
			// ... 其他 Ant Design 组件属性
		},

		// 动态数据加载
		action: 'getOptionsAction',  // Action 名称
		data: [],                     // 静态数据

		// 依赖字段
		dependencies: ['otherField'],
	},

	// ========== 选项数据 ==========
	options: [
		{ label: 'Option 1', value: 'value1', color: 'blue' },
		{ label: 'Option 2', value: 'value2', color: 'green' },
	],

	// ========== 条件显示 ==========
	showRule: "type === 'advanced'",

	// ========== 字段联动 ==========
	watch: ({ value, formData, $set }) => {
		$set('otherField', value);
	},
}
```

### 表单配置简写

```javascript
// 完整写法
{
	key: 'name',
	title: 'Name',
	type: 'text',
	form: {
		required: true,
		placeholder: 'Enter name',
	},
}

// 简写：form: true 表示显示在表单中
{
	key: 'name',
	title: 'Name',
	type: 'text',
	form: true,
}

// 简写：form: false 表示不显示在表单中
{
	key: 'createdAt',
	title: 'Created At',
	type: 'datetime',
	form: false,
}
```

---

## 表单属性

### SmartForm 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fieldsConfig` | Array | [] | 字段配置 |
| `onFinish` | Function | - | 提交回调 |
| `initialValues` | Object | {} | 初始值 |
| `submitText` | String | 'Submit' | 提交按钮文字 |
| `resetText` | String | 'Reset' | 重置按钮文字 |
| `showReset` | Boolean | true | 显示重置按钮 |
| `layout` | String | 'vertical' | 布局方式 |
| `labelCol` | Object | - | 标签栅格 |
| `wrapperCol` | Object | - | 内容栅格 |
| `actions` | Object | {} | 动态加载 Actions |

### SmartModalForm 额外属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | String | - | 弹窗标题 |
| `trigger` | ReactNode | - | 触发按钮 |
| `width` | Number | 520 | 弹窗宽度 |
| `open` | Boolean | - | 受控显示 |
| `onOpenChange` | Function | - | 显示状态变化回调 |

### SmartDrawerForm 额外属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | String | - | 抽屉标题 |
| `trigger` | ReactNode | - | 触发按钮 |
| `width` | Number | 400 | 抽屉宽度 |
| `placement` | String | 'right' | 抽屉位置 |

---

## 字段类型详解

### 文本类型

```javascript
// 单行文本
{
	key: 'name',
	title: 'Name',
	type: 'text',
	form: {
		placeholder: 'Enter name',
		fieldProps: {
			maxLength: 100,
			showCount: true,
		},
	},
}

// 多行文本
{
	key: 'description',
	title: 'Description',
	type: 'textarea',
	form: {
		placeholder: 'Enter description',
		fieldProps: {
			rows: 4,
			maxLength: 500,
			showCount: true,
		},
	},
}

// 密码
{
	key: 'password',
	title: 'Password',
	type: 'password',
	form: {
		required: true,
	},
}
```

### 数字类型

```javascript
// 普通数字
{
	key: 'quantity',
	title: 'Quantity',
	type: 'number',
	form: {
		fieldProps: {
			min: 0,
			max: 999,
			step: 1,
		},
	},
}

// 金额
{
	key: 'price',
	title: 'Price',
	type: 'money',
	form: {
		fieldProps: {
			min: 0,
			precision: 2,
		},
	},
}
```

### 选择类型

```javascript
// 下拉选择
{
	key: 'status',
	title: 'Status',
	type: 'select',
	options: [
		{ label: 'Active', value: 'active' },
		{ label: 'Inactive', value: 'inactive' },
	],
	form: {
		required: true,
		fieldProps: {
			allowClear: true,
		},
	},
}

// 单选按钮
{
	key: 'type',
	title: 'Type',
	type: 'radio',
	options: [
		{ label: 'Type A', value: 'a' },
		{ label: 'Type B', value: 'b' },
	],
}

// 多选框
{
	key: 'tags',
	title: 'Tags',
	type: 'checkbox',
	options: [
		{ label: 'Tag 1', value: 'tag1' },
		{ label: 'Tag 2', value: 'tag2' },
	],
}

// 开关
{
	key: 'enabled',
	title: 'Enabled',
	type: 'switch',
	form: {
		initialValue: true,
	},
}
```

### 树形选择

```javascript
// 静态数据
{
	key: 'category',
	title: 'Category',
	type: 'tree-select',
	form: {
		data: [
			{
				title: 'Parent 1',
				value: 'p1',
				children: [
					{ title: 'Child 1-1', value: 'c1-1' },
					{ title: 'Child 1-2', value: 'c1-2' },
				],
			},
		],
		fieldProps: {
			allowClear: true,
			showSearch: true,
			treeNodeFilterProp: 'title',
		},
	},
}

// 动态加载
{
	key: 'parent_id',
	title: 'Parent',
	type: 'tree-select',
	form: {
		action: 'getTreeForSelectAction',  // 通过 action 名称加载
		fieldProps: {
			allowClear: true,
			showSearch: true,
		},
	},
}
```

### 日期时间类型

```javascript
// 日期
{
	key: 'birthday',
	title: 'Birthday',
	type: 'date',
	form: {
		fieldProps: {
			format: 'YYYY-MM-DD',
		},
	},
}

// 日期时间
{
	key: 'publishAt',
	title: 'Publish At',
	type: 'datetime',
	form: {
		fieldProps: {
			format: 'YYYY-MM-DD HH:mm:ss',
			showTime: true,
		},
	},
}

// 日期范围
{
	key: 'dateRange',
	title: 'Date Range',
	type: 'dateRange',
	form: {
		fieldProps: {
			format: 'YYYY-MM-DD',
		},
	},
}
```

### 上传类型

```javascript
// 图片上传
{
	key: 'cover',
	title: 'Cover Image',
	type: 'image',
	form: {
		fieldProps: {
			maxCount: 1,
			accept: 'image/*',
		},
	},
}

// 头像上传
{
	key: 'avatar',
	title: 'Avatar',
	type: 'avatar',
}

// 文件上传
{
	key: 'attachment',
	title: 'Attachment',
	type: 'file',
	form: {
		fieldProps: {
			maxCount: 5,
			accept: '.pdf,.doc,.docx',
		},
	},
}
```

### 高级类型

```javascript
// 数组编辑器
{
	key: 'tags',
	title: 'Tags',
	type: 'array',
	form: {
		fieldProps: {
			placeholder: 'Add tag',
		},
	},
}

// JSON 编辑器
{
	key: 'config',
	title: 'Config',
	type: 'json',
	form: {
		fieldProps: {
			height: 200,
		},
	},
}

// Markdown 编辑器
{
	key: 'content',
	title: 'Content',
	type: 'markdown',
}

// 图标选择
{
	key: 'icon',
	title: 'Icon',
	type: 'icon',
}
```

---

## 高级功能

### 条件显示

```javascript
const fieldsConfig = [
	{
		key: 'type',
		title: 'Type',
		type: 'select',
		options: [
			{ label: 'Basic', value: 'basic' },
			{ label: 'Advanced', value: 'advanced' },
		],
		form: { required: true },
	},
	{
		key: 'advancedOption',
		title: 'Advanced Option',
		type: 'text',
		// 只有 type === 'advanced' 时显示
		showRule: "type === 'advanced'",
		form: { required: true },
	},
];
```

### 字段联动

```javascript
const fieldsConfig = [
	{
		key: 'price',
		title: 'Price',
		type: 'money',
		form: { required: true },
		watch: ({ value, formData, $set }) => {
			const quantity = formData.quantity || 1;
			$set('totalPrice', value * quantity);
		},
	},
	{
		key: 'quantity',
		title: 'Quantity',
		type: 'number',
		form: { required: true },
		watch: ({ value, formData, $set }) => {
			const price = formData.price || 0;
			$set('totalPrice', price * value);
		},
	},
	{
		key: 'totalPrice',
		title: 'Total Price',
		type: 'money',
		form: {
			disabled: true,  // 自动计算，禁止编辑
		},
	},
];
```

### 动态数据加载

```javascript
// 方式 1：通过 action 名称（推荐）
{
	key: 'parent_id',
	title: 'Parent',
	type: 'tree-select',
	form: {
		action: 'getTreeForSelectAction',
	},
}

// 在 SmartForm 中注册 actions
<SmartForm
	fieldsConfig={fieldsConfig}
	actions={{
		getTreeForSelectAction: myActions.getTreeForSelectAction,
	}}
	onFinish={handleSubmit}
/>

// 方式 2：直接传入数据
const [treeData, setTreeData] = useState([]);

useEffect(() => {
	loadTreeData().then(setTreeData);
}, []);

{
	key: 'parent_id',
	title: 'Parent',
	type: 'tree-select',
	form: {
		data: treeData,
	},
}
```

### 表单分组

```javascript
const fieldsConfig = [
	{
		key: 'basicInfo',
		title: 'Basic Information',
		type: 'group',
		children: [
			{ key: 'name', title: 'Name', type: 'text', form: { required: true } },
			{ key: 'email', title: 'Email', type: 'text', form: { required: true } },
		],
	},
	{
		key: 'advancedInfo',
		title: 'Advanced Information',
		type: 'group',
		children: [
			{ key: 'bio', title: 'Bio', type: 'textarea' },
			{ key: 'website', title: 'Website', type: 'text' },
		],
	},
];
```

### 自定义验证

```javascript
{
	key: 'password',
	title: 'Password',
	type: 'password',
	form: {
		required: true,
		rules: [
			{ required: true, message: 'Password is required' },
			{ min: 8, message: 'Password must be at least 8 characters' },
			{
				pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
				message: 'Password must contain uppercase, lowercase, and number',
			},
		],
	},
},
{
	key: 'confirmPassword',
	title: 'Confirm Password',
	type: 'password',
	form: {
		required: true,
		dependencies: ['password'],
		rules: [
			{ required: true, message: 'Please confirm your password' },
			({ getFieldValue }) => ({
				validator(_, value) {
					if (!value || getFieldValue('password') === value) {
						return Promise.resolve();
					}
					return Promise.reject(new Error('Passwords do not match'));
				},
			}),
		],
	},
}
```

---

## 最佳实践

### 1. 字段配置复用

```javascript
// 定义通用字段配置
const commonFields = {
	status: {
		key: 'status',
		title: 'Status',
		type: 'select',
		options: [
			{ label: 'Active', value: 'active', color: 'green' },
			{ label: 'Inactive', value: 'inactive', color: 'red' },
		],
	},
	createdAt: {
		key: 'createdAt',
		title: 'Created At',
		type: 'datetime',
		form: false,
	},
};

// 在页面中使用
const fieldsConfig = [
	{ key: 'name', title: 'Name', type: 'text', form: { required: true } },
	{ ...commonFields.status, form: { required: true } },
	commonFields.createdAt,
];
```

### 2. 使用 action 加载动态数据

```javascript
// 推荐：使用 action 名称
{
	type: 'tree-select',
	form: {
		action: 'getTreeForSelectAction',
	},
}

// ❌ 不推荐：使用 useState + useEffect
const [data, setData] = useState([]);
useEffect(() => { loadData().then(setData); }, []);
{
	type: 'tree-select',
	form: { data },
}
```

### 3. 合理使用条件显示

```javascript
// 简单条件：使用 showRule
{
	showRule: "type === 'advanced'",
}

// 复杂条件：使用函数
{
	showRule: (formData) => {
		return formData.type === 'advanced' && formData.level > 2;
	},
}
```

### 4. 表单提交处理

```javascript
const handleSubmit = async (values) => {
	try {
		const result = await saveAction(values);
		if (result.success) {
			message.success('Saved successfully');
			return true;  // 返回 true 关闭弹窗
		}
		message.error(result.error || 'Save failed');
		return false;  // 返回 false 保持弹窗打开
	} catch (error) {
		message.error('An error occurred');
		return false;
	}
};
```

---

## 相关文档

- [SmartCrudPage 完整指南](../SMART_CRUD_COMPLETE_GUIDE.md)
- [SmartCrudPage 开发指南](./SMART_CRUD_GUIDE.md)
- [组件 README](../../components/admin/smart-form/README.md)

---

## 许可证

MIT License
