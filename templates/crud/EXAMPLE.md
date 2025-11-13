# SmartCrudPage 模板使用示例

本文档演示如何使用模板快速创建一个新的 CRUD 页面。

---

## 场景：创建优惠券管理页面

假设我们需要创建一个优惠券（Coupon）管理页面，具有以下需求：

- 优惠券名称（必填）
- 优惠码（必填，唯一）
- 折扣类型（下拉选择：百分比/固定金额）
- 折扣值（数字输入）
- 有效期（日期范围）
- 启用状态（开关）
- 备注（多行文本）

---

## 步骤 1：创建 Server Actions

### 1.1 创建文件

```bash
# 创建 Actions 文件
touch app/(admin)/actions/rbac/crud-action.coupon.js
```

### 1.2 复制模板内容

从 `templates/crud/action.template.js` 复制内容到新文件。

### 1.3 替换变量

批量替换以下内容：

```bash
# macOS/Linux
sed -i '' 's/{RESOURCE_NAME}/coupon/g' crud-action.coupon.js
sed -i '' 's/{RESOURCE_LABEL}/Coupon/g' crud-action.coupon.js
sed -i '' 's/{COLLECTION_NAME}/coupons/g' crud-action.coupon.js

# Windows PowerShell
(Get-Content crud-action.coupon.js) -replace '{RESOURCE_NAME}', 'coupon' | Set-Content crud-action.coupon.js
(Get-Content crud-action.coupon.js) -replace '{RESOURCE_LABEL}', 'Coupon' | Set-Content crud-action.coupon.js
(Get-Content crud-action.coupon.js) -replace '{COLLECTION_NAME}', 'coupons' | Set-Content crud-action.coupon.js
```

### 1.4 配置字段和验证

修改配置对象：

```javascript
const couponConfig = {
	collectionName: 'coupons',
	primaryKey: 'id',
	
	fields: {
		creatable: ['name', 'code', 'discountType', 'discountValue', 'startDate', 'endDate', 'enable', 'remark'],
		updatable: ['name', 'code', 'discountType', 'discountValue', 'startDate', 'endDate', 'enable', 'remark'],
		searchable: ['name', 'code'],
	},
	
	query: {
		defaultSort: { createdAt: -1 },
		defaultPageSize: 20,
	},
	
	validation: {
		name: {
			required: true,
			minLength: 2,
			maxLength: 50,
		},
		code: {
			required: true,
			pattern: /^[A-Z0-9_-]+$/,
			message: 'Code must contain only uppercase letters, numbers, hyphens, and underscores',
		},
		discountValue: {
			required: true,
			min: 0,
		},
	},
	
	hooks: {
		beforeCreate: async (data) => {
			// 检查优惠码是否重复
			const { getCollection } = await import('@/lib/database/mongodb');
			const collection = await getCollection('coupons');
			const existing = await collection.findOne({ code: data.code });
			
			if (existing) {
				throw new Error('Coupon code already exists');
			}
			
			return data;
		},
	},
	
	transforms: {
		input: (data) => {
			// 转换优惠码为大写
			if (data.code) {
				data.code = data.code.toUpperCase().trim();
			}
			return data;
		},
	},
};
```

完成！Server Actions 创建完毕。

---

## 步骤 2：创建前端页面

### 2.1 创建文件

```bash
# 创建页面目录和文件
mkdir -p app/(admin)/admin/coupons
touch app/(admin)/admin/coupons/page.js
```

### 2.2 复制模板内容

从 `templates/crud/page.template.js` 复制内容到新文件。

### 2.3 替换变量

```bash
# macOS/Linux
sed -i '' 's/{RESOURCE_NAME}/coupon/g' page.js
sed -i '' 's/{RESOURCE_LABEL}/Coupon/g' page.js

# Windows PowerShell
(Get-Content page.js) -replace '{RESOURCE_NAME}', 'coupon' | Set-Content page.js
(Get-Content page.js) -replace '{RESOURCE_LABEL}', 'Coupon' | Set-Content page.js
```

### 2.4 配置字段

修改 `fieldsConfig`：

```javascript
const fieldsConfig = useMemo(() => [
	// ID
	{
		key: 'id',
		title: 'ID',
		type: 'text',
		table: false,
		form: false,
		search: false,
	},
	
	// 优惠券名称
	{
		key: 'name',
		title: 'Coupon Name',
		type: 'text',
		table: {
			width: 200,
			sorter: true,
			copyable: true,
		},
		form: {
			required: true,
			placeholder: 'Enter coupon name',
		},
		search: {
			enabled: true,
			mode: 'like',
		},
	},
	
	// 优惠码
	{
		key: 'code',
		title: 'Coupon Code',
		type: 'text',
		table: {
			width: 150,
			copyable: true,
		},
		form: {
			required: true,
			placeholder: 'Enter coupon code (e.g., SUMMER2024)',
			fieldProps: {
				maxLength: 20,
			},
		},
		search: {
			enabled: true,
			mode: 'like',
		},
	},
	
	// 折扣类型
	{
		key: 'discountType',
		title: 'Discount Type',
		type: 'select',
		options: [
			{ label: 'Percentage', value: 'percentage', color: 'blue' },
			{ label: 'Fixed Amount', value: 'fixed', color: 'green' },
		],
		table: {
			width: 130,
		},
		form: {
			required: true,
			placeholder: 'Select discount type',
		},
		search: {
			enabled: true,
			mode: 'exact',
		},
	},
	
	// 折扣值
	{
		key: 'discountValue',
		title: 'Discount Value',
		type: 'number',
		table: {
			width: 120,
			sorter: true,
			render: (value, record) => {
				if (record.discountType === 'percentage') {
					return `${value}%`;
				}
				return `$${value.toFixed(2)}`;
			},
		},
		form: {
			required: true,
			placeholder: 'Enter discount value',
			fieldProps: {
				min: 0,
				max: 100,
				precision: 2,
			},
		},
	},
	
	// 有效期开始
	{
		key: 'startDate',
		title: 'Start Date',
		type: 'date',
		table: {
			width: 120,
		},
		form: {
			required: true,
		},
	},
	
	// 有效期结束
	{
		key: 'endDate',
		title: 'End Date',
		type: 'date',
		table: {
			width: 120,
		},
		form: {
			required: true,
		},
	},
	
	// 启用状态
	{
		key: 'enable',
		title: 'Status',
		type: 'switch',
		table: {
			width: 100,
		},
		form: {
			required: true,
			fieldProps: {
				checkedChildren: 'Enabled',
				unCheckedChildren: 'Disabled',
			},
		},
		search: {
			enabled: true,
			mode: 'exact',
		},
	},
	
	// 备注
	{
		key: 'remark',
		title: 'Remark',
		type: 'textarea',
		table: {
			width: 200,
			ellipsis: true,
		},
		form: {
			required: false,
			fieldProps: {
				showCount: true,
				maxLength: 200,
				autoSize: { minRows: 2, maxRows: 5 },
			},
		},
		search: {
			mode: 'like',
			placeholder: 'Search by remark',
		},
	},
	
	// 创建时间
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
	
	// 更新时间
	{
		key: 'updatedAt',
		title: 'Updated At',
		type: 'datetime',
		table: {
			width: 180,
			sorter: true,
		},
		form: false,
		search: false,
	},
], []);
```

完成！页面创建完毕。

---

## 步骤 3：添加路由（如需要）

如果需要在菜单中显示，添加路由配置：

```javascript
// app/(admin)/layout.js 或菜单配置文件
{
	key: 'coupons',
	label: 'Coupons',
	icon: <TagOutlined />,
	path: '/admin/coupons',
}
```

---

## 步骤 4：测试

启动开发服务器并访问 `/admin/coupons`：

```bash
npm run dev
```

**功能清单：**

- ✅ 列表展示（支持分页、排序）
- ✅ 搜索功能（名称、优惠码模糊搜索，状态精确搜索）
- ✅ 创建优惠券
- ✅ 编辑优惠券
- ✅ 删除优惠券
- ✅ 查看详情
- ✅ 批量操作

---

## 总结

使用模板创建一个完整的 CRUD 页面只需要：

1. **5 分钟** - 复制模板并替换变量
2. **10 分钟** - 配置字段和验证规则
3. **5 分钟** - 测试和调整

**总计：20 分钟完成完整功能！**

---

## 扩展功能示例

### 添加自定义操作

```javascript
// 在 page.js 中添加
const customRowActions = [
	{
		key: 'activate',
		text: 'Activate',
		icon: <CheckCircleOutlined />,
		onClick: async (record) => {
			const result = await couponActions.updateCouponAction(record.id, { enable: true });
			if (result.success) {
				message.success('Coupon activated');
				setRefreshTrigger(prev => prev + 1);
			}
		},
	},
	{
		key: 'copy',
		text: 'Duplicate',
		icon: <CopyOutlined />,
		onClick: async (record) => {
			const { id, createdAt, updatedAt, ...data } = record;
			const result = await couponActions.createCouponAction({
				...data,
				name: `${data.name} (Copy)`,
				code: `${data.code}_COPY`,
			});
			if (result.success) {
				message.success('Coupon duplicated');
				setRefreshTrigger(prev => prev + 1);
			}
		},
	},
];

<SmartCrudPage
	customRowActions={customRowActions}
	// ...
/>
```

### 添加统计卡片

```javascript
// 在 SmartCrudPage 之前添加
const [stats, setStats] = useState({ total: 0, active: 0, expired: 0 });

useEffect(() => {
	loadStats();
}, []);

return (
	<>
		<Row gutter={16} style={{ marginBottom: 16 }}>
			<Col span={8}>
				<Card>
					<Statistic title="Total Coupons" value={stats.total} />
				</Card>
			</Col>
			<Col span={8}>
				<Card>
					<Statistic title="Active" value={stats.active} valueStyle={{ color: '#3f8600' }} />
				</Card>
			</Col>
			<Col span={8}>
				<Card>
					<Statistic title="Expired" value={stats.expired} valueStyle={{ color: '#cf1322' }} />
				</Card>
			</Col>
		</Row>
		
		<SmartCrudPage {...props} />
	</>
);
```

---

## 参考文档

- [SmartCrudPage 完整指南](../../docs/SMART_CRUD_COMPLETE_GUIDE.md)
- [模板使用指南](./README.md)
- [字段类型参考](../../lib/crud/field-types.js)

