# SmartForm 组件

> **最后更新**: 2025-11-29  
> **版本**: v3.0.0

基于 Ant Design ProForm 的声明式表单组件，通过 `fieldsConfig` 配置自动生成表单。

## 组件列表

| 组件 | 文件 | 说明 |
|------|------|------|
| `SmartForm` | `smart-form.jsx` | 基础表单 |
| `SmartModalForm` | `smart-modal-form.jsx` | 弹窗表单 |
| `SmartDrawerForm` | `smart-drawer-form.jsx` | 抽屉表单 |

## 快速开始

### 基础表单

```javascript
import { SmartForm } from '@/components/admin/smart-form';

const fieldsConfig = [
	{
		key: 'name',
		title: 'Name',
		type: 'text',
		form: { required: true },
	},
	{
		key: 'status',
		title: 'Status',
		type: 'select',
		options: [
			{ label: 'Active', value: 'active' },
			{ label: 'Inactive', value: 'inactive' },
		],
	},
];

<SmartForm
	fieldsConfig={fieldsConfig}
	onFinish={async (values) => {
		console.log(values);
		return true;
	}}
/>
```

### 弹窗表单

```javascript
import { SmartModalForm } from '@/components/admin/smart-form';
import { Button } from 'antd';

<SmartModalForm
	title="Create Item"
	trigger={<Button type="primary">Create</Button>}
	fieldsConfig={fieldsConfig}
	onFinish={handleSubmit}
	width={600}
/>
```

### 抽屉表单

```javascript
import { SmartDrawerForm } from '@/components/admin/smart-form';
import { Button } from 'antd';

<SmartDrawerForm
	title="Edit Item"
	trigger={<Button>Edit</Button>}
	fieldsConfig={fieldsConfig}
	initialValues={record}
	onFinish={handleSubmit}
	width={500}
/>
```

## 字段配置

### 基础结构

```javascript
{
	key: 'fieldName',           // 字段名（必需）
	title: 'Field Title',       // 显示标题（必需）
	type: 'text',               // 字段类型（必需）

	// 表单配置
	form: {
		required: true,          // 是否必填
		disabled: false,         // 是否禁用
		placeholder: 'Enter...', // 占位符
		initialValue: '',        // 默认值
		tips: 'Some tips',       // 提示信息
		rules: [],               // 验证规则
		fieldProps: {},          // Ant Design 组件属性
		action: 'getDataAction', // 动态加载数据的 Action 名称
		data: [],                // 静态数据
		dependencies: [],        // 依赖字段
	},

	// 选项数据
	options: [
		{ label: 'Option 1', value: 'value1' },
	],

	// 条件显示
	showRule: "type === 'advanced'",

	// 字段联动
	watch: ({ value, formData, $set }) => {
		$set('otherField', value);
	},
}
```

### 简写方式

```javascript
// form: true - 显示在表单中（使用默认配置）
{ key: 'name', title: 'Name', type: 'text', form: true }

// form: false - 不显示在表单中
{ key: 'createdAt', title: 'Created At', type: 'datetime', form: false }
```

## 支持的字段类型

### 基础类型

| 类型 | 说明 | 组件 |
|------|------|------|
| `text` | 单行文本 | Input |
| `textarea` | 多行文本 | TextArea |
| `number` | 数字 | InputNumber |
| `money` | 金额 | InputNumber |
| `password` | 密码 | Password |

### 选择类型

| 类型 | 说明 | 组件 |
|------|------|------|
| `select` | 下拉选择 | Select |
| `radio` | 单选按钮 | Radio.Group |
| `checkbox` | 多选框 | Checkbox.Group |
| `switch` | 开关 | Switch |
| `tree-select` | 树形选择 | TreeSelect |
| `cascader` | 级联选择 | Cascader |

### 日期时间类型

| 类型 | 说明 | 组件 |
|------|------|------|
| `date` | 日期 | DatePicker |
| `datetime` | 日期时间 | DatePicker |
| `time` | 时间 | TimePicker |
| `dateRange` | 日期范围 | RangePicker |

### 上传类型

| 类型 | 说明 | 组件 |
|------|------|------|
| `image` | 图片上传 | ImageUpload |
| `avatar` | 头像上传 | AvatarUpload |
| `file` | 文件上传 | FileUpload |

### 高级类型

| 类型 | 说明 | 组件 |
|------|------|------|
| `array` | 数组编辑 | ArrayEditor |
| `json` | JSON 编辑 | JsonEditor |
| `markdown` | Markdown | MarkdownEditor |
| `icon` | 图标选择 | IconPicker |
| `rate` | 评分 | Rate |
| `slider` | 滑块 | Slider |
| `color` | 颜色选择 | ColorPicker |

### 布局类型

| 类型 | 说明 | 用途 |
|------|------|------|
| `group` | 分组 | 表单字段分组 |

## 组件属性

### SmartForm

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fieldsConfig` | Array | [] | 字段配置 |
| `onFinish` | Function | - | 提交回调 |
| `initialValues` | Object | {} | 初始值 |
| `submitText` | String | 'Submit' | 提交按钮文字 |
| `resetText` | String | 'Reset' | 重置按钮文字 |
| `showReset` | Boolean | true | 显示重置按钮 |
| `layout` | String | 'vertical' | 布局方式 |
| `actions` | Object | {} | 动态加载 Actions |

### SmartModalForm

继承 SmartForm 所有属性，额外支持：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | String | - | 弹窗标题 |
| `trigger` | ReactNode | - | 触发按钮 |
| `width` | Number | 520 | 弹窗宽度 |
| `open` | Boolean | - | 受控显示 |
| `onOpenChange` | Function | - | 显示状态变化 |

### SmartDrawerForm

继承 SmartForm 所有属性，额外支持：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | String | - | 抽屉标题 |
| `trigger` | ReactNode | - | 触发按钮 |
| `width` | Number | 400 | 抽屉宽度 |
| `placement` | String | 'right' | 抽屉位置 |

## 高级用法

### 条件显示

```javascript
{
	key: 'advancedOption',
	title: 'Advanced Option',
	type: 'text',
	showRule: "type === 'advanced'",  // 字符串表达式
}

// 或使用函数
{
	showRule: (formData) => formData.type === 'advanced',
}
```

### 字段联动

```javascript
{
	key: 'price',
	title: 'Price',
	type: 'money',
	watch: ({ value, formData, $set }) => {
		const quantity = formData.quantity || 1;
		$set('totalPrice', value * quantity);
	},
}
```

### 动态数据加载

```javascript
// 方式 1：通过 action 名称（推荐）
{
	key: 'parent_id',
	type: 'tree-select',
	form: {
		action: 'getTreeAction',
	},
}

// 注册 actions
<SmartForm
	fieldsConfig={fieldsConfig}
	actions={{
		getTreeAction: myActions.getTreeAction,
	}}
/>

// 方式 2：静态数据
{
	key: 'parent_id',
	type: 'tree-select',
	form: {
		data: treeData,
	},
}
```

### 表单分组

```javascript
{
	key: 'basicInfo',
	title: 'Basic Information',
	type: 'group',
	children: [
		{ key: 'name', title: 'Name', type: 'text' },
		{ key: 'email', title: 'Email', type: 'text' },
	],
}
```

## 相关文档

- [SmartForm 详细指南](/docs/admin/SMART_FORM_GUIDE.md)
- [SmartCrudPage 完整指南](/docs/SMART_CRUD_COMPLETE_GUIDE.md)

## 许可证

MIT License
