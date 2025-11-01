# SmartCrudPage - 智能 CRUD 页面

基于 vk-unicloud 万能表格/表单思想，通过统一的字段配置自动生成表格、表单、搜索。

---

## 核心思想

### 传统方式 vs 智能方式

**传统方式（CrudPage）**
```javascript
// 需要分别配置
const columns = [...];       // 表格列 (50 行)
const formFields = <> ... </> // 表单字段 (50 行)
const searchConfig = {...};  // 搜索配置 (20 行)
// 总共约 120 行代码
```

**智能方式（SmartCrudPage）**
```javascript
// 只需一份配置
const fieldsConfig = [...];  // 统一字段配置 (40 行)
// 总共约 40 行代码，减少 67% 代码量
```

---

## 快速开始

### 1. 基础示例

```javascript
'use client';

import SmartCrudPage from '@/components/admin/smart-crud-page';
import { getList, update, deleteItem } from '@/app/(admin)/actions';

export default function UsersPage() {
	const fieldsConfig = [
		{
			key: '_id',
			title: 'ID',
			type: 'text',
			table: { width: 100, copyable: true },
			form: false,
			search: false,
		},
		{
			key: 'name',
			title: 'Name',
			type: 'text',
			table: { width: 150, ellipsis: true },
			form: { required: true, placeholder: 'Enter name' },
			search: { enabled: true, mode: 'like' },
		},
		{
			key: 'status',
			title: 'Status',
			type: 'select',
			options: [
				{ label: 'Active', value: 'active', color: 'green' },
				{ label: 'Inactive', value: 'inactive', color: 'default' },
			],
			table: { width: 120 },
			form: { required: true },
			search: { enabled: true, mode: 'exact' },
		},
	];
	
	const actions = {
		getList,
		update,
		delete: deleteItem,
	};
	
	return (
		<SmartCrudPage
			fieldsConfig={fieldsConfig}
			actions={actions}
			title='User Management'
			enableEdit={true}
			enableDelete={true}
		/>
	);
}
```

---

## 字段配置（fieldsConfig）

### 基础结构

```javascript
{
	key: 'fieldName',        // 字段名（必需）
	title: 'Field Title',    // 显示标题（必需）
	type: 'text',            // 字段类型（必需）
	
	// 表格配置
	table: {
		width: 150,          // 列宽
		ellipsis: true,      // 超长省略
		copyable: true,      // 可复制
		sorter: true,        // 可排序
		defaultSort: 'desc', // 默认排序
		render: (value, record) => { ... }, // 自定义渲染
	},
	
	// 表单配置
	form: {
		required: true,      // 必填
		placeholder: '...',  // 占位符
		disabled: false,     // 禁用
		minLength: 2,        // 最小长度
		maxLength: 50,       // 最大长度
		pattern: /regex/,    // 正则验证
		validator: (value) => { ... }, // 自定义验证
		render: (field) => { ... }, // 自定义渲染
	},
	
	// 搜索配置
	search: {
		enabled: true,       // 启用搜索
		mode: 'like',        // 搜索模式
	},
	
	// 详情配置（可选，默认使用 table 渲染）
	detail: {
		render: (value, record) => { ... },
	},
	
	// 其他配置
	hideInTable: false,      // 隐藏表格列
	hideInForm: false,       // 隐藏表单字段
	hideInDetail: false,     // 隐藏详情字段
	createOnly: true,        // 仅在创建时显示
	editOnly: true,          // 仅在编辑时显示
}
```

---

## 支持的字段类型

### 1. text - 单行文本

```javascript
{
	key: 'name',
	title: 'Name',
	type: 'text',
	table: { width: 150, ellipsis: true },
	form: {
		required: true,
		placeholder: 'Enter name',
		minLength: 2,
		maxLength: 50,
	},
	search: { enabled: true, mode: 'like' },
}
```

### 2. textarea - 多行文本

```javascript
{
	key: 'description',
	title: 'Description',
	type: 'textarea',
	table: false, // 不在表格中显示
	form: {
		placeholder: 'Enter description',
		maxLength: 500,
	},
}
```

### 3. number - 数字

```javascript
{
	key: 'count',
	title: 'Count',
	type: 'number',
	table: { width: 100 },
	form: {
		precision: 0,
		min: 0,
		max: 999999,
	},
	search: { enabled: true, mode: 'exact' },
}
```

### 4. money - 金额

```javascript
{
	key: 'price',
	title: 'Price',
	type: 'money',
	table: {
		width: 120,
		precision: 2,
		symbol: '$',
	},
	form: {
		precision: 2,
		min: 0,
		prefix: '$',
	},
}
```

### 5. percentage - 百分比

```javascript
{
	key: 'discount',
	title: 'Discount',
	type: 'percentage',
	table: {
		width: 100,
		precision: 1,
	},
	form: {
		precision: 1,
	},
}
```

### 6. date - 日期

```javascript
{
	key: 'date',
	title: 'Date',
	type: 'date',
	table: {
		width: 120,
		format: 'YYYY-MM-DD',
	},
	form: {
		format: 'YYYY-MM-DD',
	},
	search: { enabled: true },
}
```

### 7. datetime - 日期时间

```javascript
{
	key: 'createdAt',
	title: 'Created At',
	type: 'datetime',
	table: {
		width: 180,
		format: 'YYYY-MM-DD HH:mm:ss',
		sorter: true,
		defaultSort: 'desc',
	},
	form: false, // 不在表单中显示
}
```

### 8. daterange - 日期范围（仅搜索）

```javascript
{
	key: 'createdAt',
	title: 'Created Date Range',
	type: 'daterange',
	table: false,
	form: false,
	search: {
		enabled: true,
		mode: 'range',
	},
}
```

### 9. datetimerange - 日期时间范围（仅搜索）

```javascript
{
	key: 'updatedAt',
	title: 'Updated Date Range',
	type: 'datetimerange',
	table: false,
	form: false,
	search: {
		enabled: true,
		mode: 'range',
	},
}
```

### 10. select - 下拉选择

```javascript
{
	key: 'status',
	title: 'Status',
	type: 'select',
	options: [
		{ label: 'Active', value: 'active', color: 'green' },
		{ label: 'Inactive', value: 'inactive', color: 'default' },
	],
	table: { width: 120 },
	form: { required: true },
	search: { enabled: true, mode: 'exact' },
}
```

### 11. radio - 单选

```javascript
{
	key: 'type',
	title: 'Type',
	type: 'radio',
	options: [
		{ label: 'Type A', value: 'a' },
		{ label: 'Type B', value: 'b' },
	],
	table: { width: 100 },
	form: { required: true },
}
```

### 12. checkbox - 多选

```javascript
{
	key: 'tags',
	title: 'Tags',
	type: 'checkbox',
	options: [
		{ label: 'Tag 1', value: 'tag1' },
		{ label: 'Tag 2', value: 'tag2' },
		{ label: 'Tag 3', value: 'tag3' },
	],
	table: { width: 200 },
	form: {},
	search: { enabled: true, mode: 'in' },
}
```

### 13. switch - 开关

```javascript
{
	key: 'enabled',
	title: 'Enabled',
	type: 'switch',
	table: {
		width: 100,
		trueText: 'Yes',
		falseText: 'No',
	},
	form: {},
	search: {
		enabled: true,
		mode: 'exact',
	},
}
```

### 14. image - 图片

```javascript
{
	key: 'image',
	title: 'Image',
	type: 'image',
	table: {
		width: 100,
		height: 80,
	},
	form: {
		max: 1, // 最多上传 1 张
	},
	search: false,
}
```

### 15. file - 文件

```javascript
{
	key: 'attachment',
	title: 'Attachment',
	type: 'file',
	table: { width: 150 },
	form: {
		max: 3, // 最多上传 3 个文件
	},
	search: false,
}
```

### 16. json - JSON

```javascript
{
	key: 'metadata',
	title: 'Metadata',
	type: 'json',
	table: { width: 200 },
	form: {
		placeholder: 'Enter JSON',
	},
	search: false,
}
```

---

## 搜索模式（search.mode）

| 模式 | 别名 | 说明 | MongoDB 查询 |
|------|------|------|--------------|
| `like` | `%%` | 模糊搜索（包含） | `{ field: { $regex: value, $options: 'i' } }` |
| `likeLeft` | `%=` | 左模糊（以...结尾） | `{ field: { $regex: value + '$', $options: 'i' } }` |
| `likeRight` | `=%` | 右模糊（以...开头） | `{ field: { $regex: '^' + value, $options: 'i' } }` |
| `exact` | `==` | 精确搜索 | `{ field: value }` |
| `range` | `[]` | 范围搜索 | `{ field: { $gte: start, $lte: end } }` |
| `in` | - | 包含（多选） | `{ field: { $in: [values] } }` |
| `gt` | `>` | 大于 | `{ field: { $gt: value } }` |
| `gte` | `>=` | 大于等于 | `{ field: { $gte: value } }` |
| `lt` | `<` | 小于 | `{ field: { $lt: value } }` |
| `lte` | `<=` | 小于等于 | `{ field: { $lte: value } }` |
| `ne` | `!=` | 不等于 | `{ field: { $ne: value } }` |

---

## 高级用法

### 1. 自定义渲染

#### 表格列自定义渲染

```javascript
{
	key: 'status',
	title: 'Status',
	type: 'text',
	table: {
		width: 120,
		render: (value, record) => {
			const color = value === 'active' ? 'green' : 'red';
			return <Tag color={color}>{value}</Tag>;
		},
	},
}
```

#### 表单字段自定义渲染

```javascript
{
	key: 'customField',
	title: 'Custom Field',
	type: 'text',
	form: {
		render: (field) => {
			return (
				<ProFormText
					name={field.key}
					label={field.title}
					// 自定义逻辑
					addonAfter='units'
				/>
			);
		},
	},
}
```

### 2. 字段联动

```javascript
import { ProFormDependency } from '@ant-design/pro-components';

const fieldsConfig = [
	{
		key: 'type',
		title: 'Type',
		type: 'select',
		options: [
			{ label: 'Type A', value: 'a' },
			{ label: 'Type B', value: 'b' },
		],
		form: { required: true },
	},
	{
		key: 'typeSpecificField',
		title: 'Type Specific',
		type: 'text',
		table: false,
		form: {
			render: (field) => (
				<ProFormDependency name={['type']}>
					{({ type }) => {
						if (type === 'a') {
							return <ProFormText name='typeSpecificField' label='For Type A' />;
						}
						return null;
					}}
				</ProFormDependency>
			),
		},
	},
];
```

### 3. 动态选项

```javascript
import { useState, useEffect } from 'react';

function MyPage() {
	const [categories, setCategories] = useState([]);
	
	useEffect(() => {
		// 从 API 获取选项
		fetchCategories().then(data => {
			setCategories(data.map(item => ({
				label: item.name,
				value: item.id,
			})));
		});
	}, []);
	
	const fieldsConfig = [
		{
			key: 'category',
			title: 'Category',
			type: 'select',
			options: categories, // 动态选项
			table: { width: 150 },
			form: { required: true },
		},
	];
	
	// ...
}
```

### 4. 复杂验证

```javascript
{
	key: 'email',
	title: 'Email',
	type: 'text',
	form: {
		required: true,
		pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
		patternMessage: 'Invalid email format',
		validator: async (_, value) => {
			if (!value) return;
			
			// 异步验证邮箱是否已存在
			const exists = await checkEmailExists(value);
			if (exists) {
				throw new Error('Email already exists');
			}
		},
	},
}
```

### 5. 条件显示

```javascript
{
	key: 'vipDiscount',
	title: 'VIP Discount',
	type: 'percentage',
	table: {
		width: 120,
		// 只在 VIP 用户时显示
		render: (value, record) => {
			if (record.isVip) {
				return <span>{value}%</span>;
			}
			return '-';
		},
	},
	form: {
		// 使用 ProFormDependency 实现条件显示
		render: (field) => (
			<ProFormDependency name={['isVip']}>
				{({ isVip }) => {
					if (isVip) {
						return (
							<ProFormDigit
								name='vipDiscount'
								label='VIP Discount'
								fieldProps={{ precision: 1, min: 0, max: 100 }}
							/>
						);
					}
					return null;
				}}
			</ProFormDependency>
		),
	},
}
```

---

## 钩子函数

### beforeEdit

编辑前回调，可用于数据转换或权限检查

```javascript
const beforeEdit = async (record) => {
	// 权限检查
	if (record.locked) {
		toast.error('This record is locked');
		return false; // 返回 false 阻止编辑
	}
	
	// 数据转换
	return {
		...record,
		date: record.date ? dayjs(record.date) : null,
	};
};
```

### beforeDelete

删除前回调，可用于验证或二次确认

```javascript
const beforeDelete = async (id) => {
	// 检查关联数据
	const hasRelated = await checkRelated(id);
	if (hasRelated) {
		toast.error('Cannot delete, has related data');
		return false; // 返回 false 阻止删除
	}
	
	return true;
};
```

### beforeCreate

创建前回调，可用于数据预处理

```javascript
const beforeCreate = async (values) => {
	// 数据预处理
	return {
		...values,
		createdBy: currentUser.id,
		createdAt: new Date(),
	};
};
```

---

## 批量操作

```javascript
import { batchUpdateAction } from '@/app/(admin)/actions';

const batchActions = [
	{
		key: 'activate',
		label: 'Activate',
		action: batchUpdateAction,
		params: { status: 'active' },
	},
	{
		key: 'deactivate',
		label: 'Deactivate',
		action: batchUpdateAction,
		params: { status: 'inactive' },
	},
];

<SmartCrudPage
	fieldsConfig={fieldsConfig}
	actions={actions}
	batchActions={batchActions}
/>
```

---

## 扩展自定义字段类型

```javascript
import { registerFieldType } from '@/lib/admin/crud/field-types';

// 注册自定义字段类型
registerFieldType('color', {
	table: (value, config) => {
		return (
			<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
				<div style={{
					width: 20,
					height: 20,
					backgroundColor: value,
					border: '1px solid #ccc',
				}} />
				<span>{value}</span>
			</div>
		);
	},
	form: (config) => (
		<ProFormColorPicker
			name={config.key}
			label={config.title}
			// ...
		/>
	),
});

// 使用自定义类型
const fieldsConfig = [
	{
		key: 'themeColor',
		title: 'Theme Color',
		type: 'color', // 使用自定义类型
		table: { width: 150 },
		form: {},
	},
];
```

---

## 完整示例

参考模板文件：`app/(admin)/admin/_template/smart-page.js`

---

## 与传统方式对比

### 代码量对比

**传统方式**：120-150 行  
**智能方式**：40-50 行  
**减少**：67% 代码量

### 维护成本对比

**传统方式**：需要同步修改 columns、formFields、searchConfig  
**智能方式**：只需修改 fieldsConfig 一处  
**优势**：一次修改，自动同步

### 学习成本对比

**传统方式**：需要学习 ProTable、ProForm、搜索配置等多个 API  
**智能方式**：只需学习 fieldsConfig 配置格式  
**优势**：统一配置，降低学习成本

---

## FAQ

### Q: 什么时候使用 SmartCrudPage？

A: 推荐在以下场景使用：
- 标准 CRUD 页面
- 字段较多的管理页面
- 需要快速开发的页面

### Q: 什么时候使用传统 CrudPage？

A: 推荐在以下场景使用：
- 需要高度自定义的页面
- 表格和表单差异很大
- 复杂的表单逻辑

### Q: 如何实现复杂的表单布局？

A: 使用 `form.render` 自定义渲染：

```javascript
{
	key: 'customLayout',
	title: 'Custom Layout',
	type: 'text',
	form: {
		render: (field) => (
			<Row gutter={16}>
				<Col span={12}>
					<ProFormText name='field1' label='Field 1' />
				</Col>
				<Col span={12}>
					<ProFormText name='field2' label='Field 2' />
				</Col>
			</Row>
		),
	},
}
```

### Q: 如何实现多字段联合搜索？

A: 使用搜索模式和自定义转换：

```javascript
const fieldsConfig = [
	{
		key: 'search',
		title: 'Search',
		type: 'text',
		table: false,
		form: false,
		search: {
			enabled: true,
			mode: 'like',
		},
	},
];

// 在 getList Action 中处理
export async function getList({ search }) {
	if (search) {
		// 搜索多个字段
		where.$or = [
			{ name: { $regex: search, $options: 'i' } },
			{ email: { $regex: search, $options: 'i' } },
			{ username: { $regex: search, $options: 'i' } },
		];
	}
}
```

---

## 相关文档

- [字段类型定义](../../lib/admin/crud/field-types.js)
- [字段生成器](../../lib/admin/crud/field-generator.js)
- [搜索转换器](../../lib/admin/crud/search-transformer.js)
- [CRUD 指南](./CRUD_GUIDE.md)

