# Smart CRUD 快速开始指南

**5 分钟创建一个完整的 CRUD 页面！**

---

## 🚀 快速模板（复制即用）

```javascript
'use client';

import dynamic from 'next/dynamic';

// 动态导入 SmartCrudPage，避免 Hydration 错误
const SmartCrudPage = dynamic(() => import('@/components/admin/smart-crud-page'), {
	ssr: false,
	loading: () => <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>,
});

// 导入 Server Actions
import {
	getDataListAction as getList,
	updateDataAction as update,
	deleteDataAction as deleteItem,
	// createDataAction as create,  // 如果需要创建功能
} from '@/app/(admin)/actions/admin-xxx';

export default function DataManagementPage() {
	// 统一字段配置
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
			table: { width: 150 },
			form: { required: true },
			search: { enabled: true, mode: 'like' },
		},
		// ... 更多字段
	];
	
	// Actions 配置
	const actions = {
		getList,
		update,
		delete: deleteItem,
	};
	
	// 返回组件
	return (
		<SmartCrudPage
			fieldsConfig={fieldsConfig}
			actions={actions}
			title='Data Management'
			enableEdit={true}
			enableDelete={true}
		/>
	);
}
```

---

## ⚠️ 重要提示

### 必须使用 dynamic 导入！

```javascript
// ❌ 错误 - 会导致 Hydration 错误
import SmartCrudPage from '@/components/admin/smart-crud-page';

// ✅ 正确 - 避免 Hydration 错误
import dynamic from 'next/dynamic';
const SmartCrudPage = dynamic(() => import('@/components/admin/smart-crud-page'), {
	ssr: false,
	loading: () => <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>,
});
```

**原因**: ProTable 组件使用了浏览器特性，需要在客户端渲染。

---

## 📝 常用字段配置

### 文本字段
```javascript
{
	key: 'name',
	title: 'Name',
	type: 'text',
	table: { width: 150, ellipsis: true },
	form: { required: true, placeholder: 'Enter name' },
	search: { enabled: true, mode: 'like' },
}
```

### 下拉选择
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

### 数字/金额
```javascript
{
	key: 'price',
	title: 'Price',
	type: 'money',
	table: { width: 120, precision: 2, symbol: '$' },
	form: { precision: 2, min: 0, prefix: '$' },
	search: false,
}
```

### 日期时间
```javascript
{
	key: 'createdAt',
	title: 'Created At',
	type: 'datetime',
	table: { width: 180, sorter: true, defaultSort: 'desc' },
	form: false,
	search: false,
}
```

### 开关
```javascript
{
	key: 'enabled',
	title: 'Enabled',
	type: 'switch',
	table: { width: 100, trueText: 'Yes', falseText: 'No' },
	form: {},
	search: { enabled: true, mode: 'exact' },
}
```

### 图片
```javascript
{
	key: 'image',
	title: 'Image',
	type: 'image',
	table: { width: 80, height: 80 },
	form: { max: 1 },
	search: false,
}
```

---

## 🎯 完整示例

查看: `app/(admin)/admin/users/page.js`

---

## ⚙️ 可选配置

### 批量操作
```javascript
const batchActions = [
	{
		key: 'activate',
		label: 'Activate',
		action: batchUpdateAction,
		params: { status: 'active' },
	},
];

<SmartCrudPage
	fieldsConfig={fieldsConfig}
	actions={actions}
	batchActions={batchActions}  // 添加这里
	// ...
/>
```

### 钩子函数
```javascript
const beforeEdit = async (record) => {
	// 编辑前处理
	return record;
};

const beforeDelete = async (id) => {
	// 删除前验证
	return true;
};

<SmartCrudPage
	fieldsConfig={fieldsConfig}
	actions={actions}
	beforeEdit={beforeEdit}
	beforeDelete={beforeDelete}
	// ...
/>
```

### 自定义详情头部
```javascript
const renderDetailHeader = (record) => (
	<div style={{ textAlign: 'center', marginBottom: 24 }}>
		<h2>{record.name}</h2>
		<p style={{ color: '#999' }}>{record.description}</p>
	</div>
);

<SmartCrudPage
	fieldsConfig={fieldsConfig}
	actions={actions}
	renderDetailHeader={renderDetailHeader}
	// ...
/>
```

---

## 🔍 搜索模式对照表

| 模式 | 说明 | 示例 |
|------|------|------|
| `like` | 模糊搜索 | 搜索姓名、邮箱 |
| `exact` | 精确搜索 | 搜索角色、状态 |
| `range` | 范围搜索 | 日期范围 |
| `gt` / `gte` | 大于/大于等于 | 价格筛选 |
| `lt` / `lte` | 小于/小于等于 | 库存筛选 |
| `in` | 包含（多选） | 标签筛选 |

---

## 📋 检查清单

创建新页面时，确保：

- [ ] 使用 `dynamic` 导入 SmartCrudPage
- [ ] 设置 `ssr: false`
- [ ] 配置 `fieldsConfig`（至少包含 ID 和 1-2 个业务字段）
- [ ] 配置 `actions`（至少 getList, update, delete）
- [ ] 设置合适的 `title`
- [ ] 根据需要启用/禁用功能（enableCreate/Edit/Delete）
- [ ] 测试表格展示、搜索、编辑、删除功能

---

## 🐛 常见问题

### Q: 为什么要用 dynamic 导入？
**A**: 避免 Hydration 错误。ProTable 使用浏览器特性，服务端和客户端渲染结果可能不同。

### Q: Loading 提示能去掉吗？
**A**: 可以，但不推荐。Loading 提示改善用户体验，实际上加载很快（< 100ms）。

### Q: 可以不用 SmartCrudPage 吗？
**A**: 可以使用传统的 CrudPage，参考 `app/(admin)/admin/_template/page.js`。

### Q: 如何添加自定义渲染？
**A**: 在字段配置中使用 `table.render`、`form.render` 或 `detail.render`。

---

## 📚 相关文档

- [Smart CRUD 使用指南](./SMART_CRUD.md) - 完整文档
- [字段类型参考](./SMART_CRUD.md#支持的字段类型) - 所有字段类型
- [最佳实践](./SMART_CRUD_FINAL_SUMMARY.md#最佳实践) - 系统总结

---

## 💡 提示

1. **先看示例** - 查看 `app/(admin)/admin/users/page.js`
2. **复制模板** - 从快速模板开始
3. **逐步添加** - 先配置基础字段，再添加高级功能
4. **测试功能** - 每添加一个字段就测试一次
5. **参考文档** - 遇到问题查看完整文档

---

**Happy Coding! 🎉**

