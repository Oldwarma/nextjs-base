# CRUD 开发指南

本指南教你如何使用模板快速创建CRUD页面。

---

## 📋 目录

1. [快速开始](#快速开始)
2. [页面模板说明](#页面模板说明)
3. [配置项详解](#配置项详解)
4. [完整示例](#完整示例)
5. [常见配置](#常见配置)

---

## 🚀 快速开始

### 步骤 1：创建 CRUD 配置

```javascript
// app/(admin)/actions/configs/product-crud.config.js
export const productCrudConfig = {
	collectionName: 'products',
	primaryKey: '_id',
	
	fields: {
		creatable: ['name', 'price', 'stock', 'description'],
		updatable: ['name', 'price', 'stock', 'description', 'status'],
		searchable: ['name', 'description'],
	},
	
	validation: {
		name: {
			required: true,
			minLength: 1,
			maxLength: 100,
		},
		price: {
			required: true,
			validator: async (value) => {
				return typeof value === 'number' && value >= 0;
			},
			message: 'Price must be a non-negative number',
		},
	},
	
	softDelete: true,
};
```

### 步骤 2：创建 Server Actions

```javascript
// app/(admin)/actions/admin-products.js
'use server';

import { createCrudActions } from '@/app/(admin)/actions/dao/base';
import { productCrudConfig } from '@/app/(admin)/actions/configs/product-crud.config';

const productCrud = createCrudActions(productCrudConfig);

export const getProductListAction = productCrud.getList;
export const getProductDetailAction = productCrud.getDetail;
export const createProductAction = productCrud.create;
export const updateProductAction = productCrud.update;
export const deleteProductAction = productCrud.delete;
export const batchUpdateProductsAction = productCrud.batchUpdate;
export const batchDeleteProductsAction = productCrud.batchDelete;
```

### 步骤 3：复制页面模板

```bash
cp app/(admin)/admin/_template/page.js app/(admin)/admin/products/page.js
```

### 步骤 4：修改页面配置

```javascript
// app/(admin)/admin/products/page.js
'use client';

import { ProTable, ModalForm, ProFormText, ProFormDigit, ProFormTextArea, ProFormSwitch } from '@ant-design/pro-components';
import { Tag } from 'antd';
import {
	getProductListAction as getList,
	getProductDetailAction as getDetail,
	createProductAction as create,
	updateProductAction as update,
	deleteProductAction as deleteItem,
	batchUpdateProductsAction as batchUpdate,
	batchDeleteProductsAction as batchDelete,
} from '@/app/(admin)/actions/admin-products';

export default function ProductsPage() {
	// 1. 定义列
	const columns = [
		{
			title: 'ID',
			dataIndex: '_id',
			search: false,
			width: 100,
			ellipsis: true,
			copyable: true,
		},
		{
			title: 'Name',
			dataIndex: 'name',
			width: 150,
			ellipsis: true,
		},
		{
			title: 'Price',
			dataIndex: 'price',
			valueType: 'money',
			search: false,
			width: 100,
		},
		{
			title: 'Stock',
			dataIndex: 'stock',
			search: false,
			width: 100,
		},
		{
			title: 'Status',
			dataIndex: 'status',
			valueType: 'select',
			width: 120,
			valueEnum: {
				active: { text: 'Active', status: 'Success' },
				inactive: { text: 'Inactive', status: 'Default' },
			},
			render: (_, record) => (
				<Tag color={record.status === 'active' ? 'green' : 'default'}>
					{record.status === 'active' ? 'Active' : 'Inactive'}
				</Tag>
			),
		},
		{
			title: 'Created At',
			dataIndex: 'createdAt',
			valueType: 'dateTime',
			search: false,
			width: 180,
		},
	];

	// 2. 定义表单字段
	const formFields = (
		<>
			<ProFormText
				name='name'
				label='Product Name'
				placeholder='Enter product name'
				rules={[{ required: true, message: 'Please enter product name' }]}
			/>
			<ProFormDigit
				name='price'
				label='Price'
				placeholder='Enter price'
				fieldProps={{ precision: 2, prefix: '$', min: 0 }}
				rules={[{ required: true, message: 'Please enter price' }]}
			/>
			<ProFormDigit
				name='stock'
				label='Stock'
				placeholder='Enter stock'
				fieldProps={{ precision: 0, min: 0 }}
			/>
			<ProFormTextArea
				name='description'
				label='Description'
				placeholder='Enter description'
				fieldProps={{ rows: 4 }}
			/>
			<ProFormSwitch
				name='status'
				label='Active'
			/>
		</>
	);

	// 3. 定义 Actions
	const actions = {
		getList,
		getDetail,
		create,
		update,
		delete: deleteItem,
		batchUpdate,
		batchDelete,
	};

	// 4. 返回组件（使用原生实现或 CrudPage 组件）
	// 这里展示原生实现的框架
	return (
		<ProTable
			columns={columns}
			// ... 其他配置
		/>
	);
}
```

完成！访问 `/admin/products` 即可看到新页面。

---

## 📖 页面模板说明

### 模板位置

```
app/(admin)/admin/_template/page.js
```

### 模板结构

```javascript
'use client';

// 1. 导入组件
import { ProTable, ModalForm, ... } from '@ant-design/pro-components';

// 2. 导入 Actions
import { ... } from '@/app/(admin)/actions/admin-xxx';

export default function Page() {
	// 3. State 管理
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [currentRow, setCurrentRow] = useState(null);
	const actionRef = useRef();

	// 4. 列定义
	const columns = [...];

	// 5. 请求函数
	const request = async (params, sort) => {...};

	// 6. 事件处理
	const handleEdit = (record) => {...};
	const handleDelete = async (id) => {...};
	const handleSave = async (values) => {...};

	// 7. 渲染组件
	return (
		<>
			<ProTable ... />
			<ModalForm ... />
			<DrawerForm ... />
		</>
	);
}
```

---

## ⚙️ 配置项详解

### 1. ProTable 配置

#### 基础配置

```javascript
<ProTable
	columns={columns}           // 列定义（必需）
	actionRef={actionRef}       // 表格实例引用
	request={request}           // 数据请求函数（必需）
	rowKey='_id'                // 行键（必需，MongoDB 默认 _id）
	
	// 分页配置
	pagination={{
		defaultPageSize: 20,
		showSizeChanger: true,
		showQuickJumper: true,
	}}
	
	// 搜索配置
	search={{
		labelWidth: 'auto',
		defaultCollapsed: true,  // 默认收起
	}}
	
	// 其他
	dateFormatter='string'
	headerTitle='Product Management'
	scroll={{ x: 1200 }}
/>
```

#### 工具栏

```javascript
toolBarRender={() => [
	<Button
		key='create'
		type='primary'
		icon={<PlusOutlined />}
		onClick={() => setCreateModalVisible(true)}
	>
		Create
	</Button>,
	<Button
		key='refresh'
		icon={<ReloadOutlined />}
		onClick={() => actionRef.current?.reload()}
	>
		Refresh
	</Button>,
]}
```

#### 行选择

```javascript
rowSelection={{
	selectedRowKeys,
	onChange: setSelectedRowKeys,
}}

tableAlertRender={({ selectedRowKeys }) => (
	<Space size={16}>
		<span>Selected {selectedRowKeys.length} item(s)</span>
	</Space>
)}

tableAlertOptionRender={({ selectedRowKeys }) => (
	<Space size={16}>
		<Button size='small' onClick={() => handleBatchUpdate(...)}>
			Batch Update
		</Button>
		<Button size='small' danger onClick={handleBatchDelete}>
			Batch Delete
		</Button>
	</Space>
)}
```

### 2. 列定义（columns）

#### 基础列

```javascript
{
	title: 'Name',              // 列标题
	dataIndex: 'name',          // 数据字段
	width: 150,                 // 宽度
	ellipsis: true,             // 超长省略
	copyable: true,             // 可复制
	search: false,              // 不在搜索栏显示
	hideInTable: true,          // 不在表格显示（只在详情）
	sorter: true,               // 可排序
}
```

#### 特殊列类型

```javascript
// 金额
{
	title: 'Price',
	dataIndex: 'price',
	valueType: 'money',
	render: (price) => `$${Number(price).toFixed(2)}`,
}

// 日期时间
{
	title: 'Created At',
	dataIndex: 'createdAt',
	valueType: 'dateTime',
}

// 选择器（带筛选）
{
	title: 'Status',
	dataIndex: 'status',
	valueType: 'select',
	valueEnum: {
		active: { text: 'Active', status: 'Success' },
		inactive: { text: 'Inactive', status: 'Default' },
	},
}

// 标签
{
	title: 'Tags',
	dataIndex: 'tags',
	render: (tags) => (
		<>
			{tags?.map((tag) => (
				<Tag key={tag}>{tag}</Tag>
			))}
		</>
	),
}

// 头像
{
	title: 'Avatar',
	dataIndex: 'image',
	render: (image, record) => (
		<Avatar src={image} icon={<UserOutlined />}>
			{record.name?.[0]?.toUpperCase()}
		</Avatar>
	),
}
```

#### 操作列

```javascript
{
	title: 'Actions',
	valueType: 'option',
	width: 80,
	fixed: 'right',
	render: (text, record, _, action) => {
		const items = [
			{
				key: 'view',
				label: 'View',
				icon: <EyeOutlined />,
				onClick: () => handleView(record),
			},
			{
				key: 'edit',
				label: 'Edit',
				icon: <EditOutlined />,
				onClick: () => handleEdit(record),
			},
			{
				type: 'divider',
			},
			{
				key: 'delete',
				label: 'Delete',
				icon: <DeleteOutlined />,
				danger: true,
				onClick: () => handleDelete(record._id),
			},
		];

		return (
			<Dropdown menu={{ items }} trigger={['click']}>
				<Button type='text' icon={<MoreOutlined />} />
			</Dropdown>
		);
	},
}
```

### 3. 表单字段（formFields）

#### 基础字段

```javascript
// 文本
<ProFormText
	name='name'
	label='Name'
	placeholder='Enter name'
	rules={[{ required: true, message: 'Please enter name' }]}
/>

// 文本域
<ProFormTextArea
	name='description'
	label='Description'
	placeholder='Enter description'
	fieldProps={{ rows: 4 }}
/>

// 数字
<ProFormDigit
	name='price'
	label='Price'
	fieldProps={{ precision: 2, prefix: '$', min: 0 }}
	rules={[{ required: true }]}
/>

// 开关
<ProFormSwitch
	name='isActive'
	label='Active'
/>

// 日期选择
<ProFormDatePicker
	name='date'
	label='Date'
/>

// 下拉选择
<ProFormSelect
	name='status'
	label='Status'
	options={[
		{ label: 'Active', value: 'active' },
		{ label: 'Inactive', value: 'inactive' },
	]}
	rules={[{ required: true }]}
/>

// 单选
<ProFormRadio.Group
	name='type'
	label='Type'
	options={[
		{ label: 'Type A', value: 'a' },
		{ label: 'Type B', value: 'b' },
	]}
/>

// 多选
<ProFormCheckbox.Group
	name='features'
	label='Features'
	options={['Feature 1', 'Feature 2', 'Feature 3']}
/>
```

---

## 📝 完整示例

请参考现有页面：

- **用户管理**：`app/(admin)/admin/users/page.js`
- **套餐管理**：`app/(admin)/admin/packages/page.js`
- **积分管理**：`app/(admin)/admin/credits/page.js`

---

## 🎯 常见配置

### 1. 搜索栏默认收起

```javascript
search={{
	labelWidth: 'auto',
	defaultCollapsed: true,
}}
```

### 2. 表格横向滚动

```javascript
scroll={{ x: 1400 }}
```

### 3. 列只在详情中显示

```javascript
{
	title: 'Description',
	dataIndex: 'description',
	hideInTable: true,  // 不在表格显示
}
```

### 4. 禁用某些字段编辑

```javascript
<ProFormDigit
	name='credits'
	label='Credits'
	disabled                // 禁用
	tooltip='Credits can only be adjusted through Credits Management'
/>
```

### 5. 批量操作

```javascript
const handleBatchUpdate = async (updates) => {
	if (selectedRowKeys.length === 0) {
		toast.warning('Please select items first');
		return;
	}

	try {
		const result = await batchUpdate(selectedRowKeys, updates);
		if (result.success) {
			toast.success(result.message);
			setSelectedRowKeys([]);
			actionRef.current?.reload();
		} else {
			toast.error(result.error);
		}
	} catch (error) {
		toast.error('Failed to update');
	}
};
```

### 6. 删除确认

```javascript
const handleDelete = async (id) => {
	Modal.confirm({
		title: 'Confirm Delete',
		content: 'Are you sure you want to delete this item? This action cannot be undone.',
		okText: 'Delete',
		okType: 'danger',
		cancelText: 'Cancel',
		onOk: async () => {
			try {
				const result = await deleteItem(id);
				if (result.success) {
					toast.success('Deleted successfully');
					actionRef.current?.reload();
				} else {
					toast.error(result.error);
				}
			} catch (error) {
				toast.error('Failed to delete');
			}
		},
	});
};
```

---

## ✅ 检查清单

创建新页面时的检查清单：

- [ ] 创建 CRUD 配置文件
- [ ] 定义字段：creatable, updatable, searchable
- [ ] 定义验证规则
- [ ] 创建 Server Actions 文件
- [ ] 导出标准 Actions
- [ ] 复制页面模板
- [ ] 修改导入路径
- [ ] 配置 columns（列定义）
- [ ] 配置 formFields（表单字段）
- [ ] 配置 actions 对象
- [ ] 测试列表查询
- [ ] 测试创建功能
- [ ] 测试编辑功能
- [ ] 测试删除功能
- [ ] 测试批量操作
- [ ] 测试搜索和筛选

---

## 🎉 总结

使用模板创建 CRUD 页面非常简单：

1. ✅ 创建配置（1 分钟）
2. ✅ 创建 Actions（1 分钟）
3. ✅ 复制模板（10 秒）
4. ✅ 修改配置（3 分钟）

**总计 5 分钟**即可完成一个功能完整的 CRUD 页面！🚀

