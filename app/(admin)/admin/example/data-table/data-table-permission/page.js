'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import * as actions from '@/app/(admin)/actions/examples/crud-action.data-table-permission';

// 动态导入 SmartCrudPage，禁用 SSR
const SmartCrudPage = dynamic(() => import('@/components/admin/smart-crud-page'), { ssr: false, loading: () => <div>Loading...</div> });

// ============================================
// 静态数据（移到组件外部避免重复创建）
// ============================================

// 分类数据
const categoryOptions = [
	{ label: '📱 Electronics', value: 'electronics' },
	{ label: '👕 Clothing', value: 'clothing' },
	{ label: '🍔 Food', value: 'food' },
	{ label: '📚 Books', value: 'books' },
	{ label: '⚽ Sports', value: 'sports' },
	{ label: '📦 Other', value: 'other' },
];

// 子分类数据（根据主分类联动）
const subCategoryMap = {
	electronics: [
		{ label: 'Phones', value: 'phones' },
		{ label: 'Laptops', value: 'laptops' },
		{ label: 'Tablets', value: 'tablets' },
		{ label: 'Accessories', value: 'accessories' },
	],
	clothing: [
		{ label: 'Shirts', value: 'shirts' },
		{ label: 'Pants', value: 'pants' },
		{ label: 'Shoes', value: 'shoes' },
		{ label: 'Accessories', value: 'clothing_accessories' },
	],
	food: [
		{ label: 'Snacks', value: 'snacks' },
		{ label: 'Beverages', value: 'beverages' },
		{ label: 'Fresh', value: 'fresh' },
	],
	books: [
		{ label: 'Fiction', value: 'fiction' },
		{ label: 'Non-Fiction', value: 'non_fiction' },
		{ label: 'Technical', value: 'technical' },
	],
	sports: [
		{ label: 'Fitness', value: 'fitness' },
		{ label: 'Outdoor', value: 'outdoor' },
		{ label: 'Team Sports', value: 'team_sports' },
	],
	other: [{ label: 'Miscellaneous', value: 'misc' }],
};

// 状态选项
const statusOptions = [
	{ label: '📝 Draft', value: 'draft', color: 'default' },
	{ label: '⏳ Pending', value: 'pending', color: 'processing' },
	{ label: '✅ Published', value: 'published', color: 'success' },
	{ label: '📦 Archived', value: 'archived', color: 'warning' },
];

// 优先级选项
const priorityOptions = [
	{ label: '🟢 Low', value: 'low', color: 'green' },
	{ label: '🟡 Medium', value: 'medium', color: 'gold' },
	{ label: '🟠 High', value: 'high', color: 'orange' },
	{ label: '🔴 Urgent', value: 'urgent', color: 'red' },
];

// 联系方式类型
const contactTypeOptions = [
	{ label: '📧 Email', value: 'email' },
	{ label: '📱 Phone', value: 'phone' },
	{ label: '💬 WeChat', value: 'wechat' },
	{ label: '🚫 None', value: 'none' },
];

// 功能特性
const featureOptions = [
	{ label: '💧 Waterproof', value: 'waterproof' },
	{ label: '📶 Wireless', value: 'wireless' },
	{ label: '🔋 Rechargeable', value: 'rechargeable' },
	{ label: '🎒 Portable', value: 'portable' },
	{ label: '🌍 Eco-Friendly', value: 'eco_friendly' },
	{ label: '🏆 Premium', value: 'premium' },
];

// 标签选项
const tagOptions = [
	{ label: '🆕 New', value: 'new', color: 'green' },
	{ label: '🔥 Hot', value: 'hot', color: 'red' },
	{ label: '💰 Sale', value: 'sale', color: 'orange' },
	{ label: '⭐ Featured', value: 'featured', color: 'gold' },
	{ label: '🎁 Gift', value: 'gift', color: 'purple' },
	{ label: '⏰ Limited', value: 'limited', color: 'blue' },
];

// 部门树形数据
const departmentTree = [
	{
		value: 'engineering',
		title: '🔧 Engineering',
		children: [
			{ value: 'frontend', title: 'Frontend Team' },
			{ value: 'backend', title: 'Backend Team' },
			{ value: 'mobile', title: 'Mobile Team' },
			{ value: 'devops', title: 'DevOps Team' },
		],
	},
	{
		value: 'product',
		title: '📊 Product',
		children: [
			{ value: 'design', title: 'Design Team' },
			{ value: 'pm', title: 'Product Management' },
			{ value: 'ux', title: 'UX Research' },
		],
	},
	{
		value: 'marketing',
		title: '📢 Marketing',
		children: [
			{ value: 'seo', title: 'SEO' },
			{ value: 'content', title: 'Content' },
			{ value: 'social', title: 'Social Media' },
			{ value: 'ads', title: 'Advertising' },
		],
	},
	{
		value: 'sales',
		title: '💼 Sales',
		children: [
			{ value: 'b2b', title: 'B2B Sales' },
			{ value: 'b2c', title: 'B2C Sales' },
			{ value: 'support', title: 'Customer Support' },
		],
	},
];

// 地区级联数据
const locationData = [
	{
		value: 'us',
		label: '🇺🇸 United States',
		children: [
			{
				value: 'ca',
				label: 'California',
				children: [
					{ value: 'sf', label: 'San Francisco' },
					{ value: 'la', label: 'Los Angeles' },
					{ value: 'sd', label: 'San Diego' },
				],
			},
			{
				value: 'ny',
				label: 'New York',
				children: [
					{ value: 'nyc', label: 'New York City' },
					{ value: 'buffalo', label: 'Buffalo' },
				],
			},
			{
				value: 'tx',
				label: 'Texas',
				children: [
					{ value: 'houston', label: 'Houston' },
					{ value: 'dallas', label: 'Dallas' },
					{ value: 'austin', label: 'Austin' },
				],
			},
		],
	},
	{
		value: 'cn',
		label: '🇨🇳 China',
		children: [
			{
				value: 'beijing',
				label: 'Beijing',
				children: [
					{ value: 'haidian', label: 'Haidian' },
					{ value: 'chaoyang', label: 'Chaoyang' },
					{ value: 'dongcheng', label: 'Dongcheng' },
				],
			},
			{
				value: 'shanghai',
				label: 'Shanghai',
				children: [
					{ value: 'pudong', label: 'Pudong' },
					{ value: 'puxi', label: 'Puxi' },
					{ value: 'minhang', label: 'Minhang' },
				],
			},
			{
				value: 'shenzhen',
				label: 'Shenzhen',
				children: [
					{ value: 'nanshan', label: 'Nanshan' },
					{ value: 'futian', label: 'Futian' },
				],
			},
		],
	},
	{
		value: 'jp',
		label: '🇯🇵 Japan',
		children: [
			{
				value: 'tokyo',
				label: 'Tokyo',
				children: [
					{ value: 'shibuya', label: 'Shibuya' },
					{ value: 'shinjuku', label: 'Shinjuku' },
				],
			},
			{
				value: 'osaka',
				label: 'Osaka',
				children: [
					{ value: 'umeda', label: 'Umeda' },
					{ value: 'namba', label: 'Namba' },
				],
			},
		],
	},
];

/**
 * SmartCrudPage 完整功能示例
 *
 * 本页面展示了 SmartCrudPage 的所有高级功能：
 * 1. 权限验证 - 通过 Server Actions 中的 permissions 配置
 * 2. 字段联动 - showRule 条件显示
 * 3. 字段监听 - watch 监听值变化
 * 4. 分组布局 - group 类型分组
 * 5. 多列布局 - col.span 控制宽度
 * 6. 各种字段类型 - 20+ 种字段类型
 * 7. 搜索筛选 - search 配置
 * 8. 表格自定义 - table 配置
 * 9. 表单验证 - form.required, form.rules
 */
export default function ExamplePermissionPage() {
	// ============================================
	// 字段配置
	// ============================================
	const fieldsConfig = useMemo(
		() => [
			// ============================================
			// 分组 1: 基础信息
			// ============================================
			{
				key: 'basic-group',
				title: '📋 Basic Information',
				type: 'group',
				columns: [
					{
						key: 'title',
						title: 'Title',
						type: 'text',
						form: {
							required: true,
							placeholder: 'Enter product title',
						},
						table: {
							width: 200,
							fixed: 'left',
							ellipsis: true,
						},
						search: {
							enabled: true,
							mode: 'like',
						},
						col: { span: 16 },
					},
					{
						key: 'status',
						title: 'Status',
						type: 'select',
						form: {
							required: true,
						},
						data: statusOptions,
						table: {
							width: 120,
						},
						search: {
							enabled: true,
						},
						col: { span: 8 },
					},
				],
			},

			// ============================================
			// 分组 2: 分类信息（展示字段联动）
			// ============================================
			{
				key: 'category-group',
				title: '📁 Category (with Field Linkage)',
				type: 'group',
				tips: '选择主分类后，子分类会自动更新选项',
				columns: [
					{
						key: 'category',
						title: 'Category',
						type: 'select',
						form: {
							required: true,
						},
						data: categoryOptions,
						table: {
							width: 140,
						},
						search: {
							enabled: true,
						},
						// 监听分类变化，清空子分类
						watch: {
							handler: (value, { setFieldValue }) => {
								setFieldValue('subCategory', undefined);
							},
						},
						col: { span: 12 },
					},
					{
						key: 'subCategory',
						title: 'Sub Category',
						type: 'select',
						// 动态获取子分类选项
						data: (formData) => {
							const category = formData?.category;
							return subCategoryMap[category] || [];
						},
						// 当没有选择主分类时禁用
						disabled: (formData) => !formData?.category,
						table: false, // 不在表格中显示
						col: { span: 12 },
					},
				],
			},

			// ============================================
			// 分组 3: 联系方式（展示 showRule 条件显示）
			// ============================================
			{
				key: 'contact-group',
				title: '📞 Contact Information (with showRule)',
				type: 'group',
				tips: '根据联系方式类型，显示不同的输入框',
				columns: [
					{
						key: 'contactType',
						title: 'Contact Type',
						type: 'radio',
						data: contactTypeOptions,
						table: false, // 不在表格中显示
						col: { span: 24 },
					},
					{
						key: 'email',
						title: 'Email',
						type: 'text',
						form: {
							placeholder: 'example@email.com',
							rules: [{ type: 'email', message: 'Please enter a valid email' }],
						},
						table: false, // 不在表格中显示
						// 只有选择 email 时显示
						showRule: "contactType === 'email'",
						col: { span: 24 },
					},
					{
						key: 'phone',
						title: 'Phone',
						type: 'text',
						form: {
							placeholder: '+1 234 567 8900',
						},
						table: false, // 不在表格中显示
						// 只有选择 phone 时显示
						showRule: (formData) => formData?.contactType === 'phone',
						col: { span: 24 },
					},
					{
						key: 'wechat',
						title: 'WeChat ID',
						type: 'text',
						form: {
							placeholder: 'WeChat ID',
						},
						table: false, // 不在表格中显示
						// 只有选择 wechat 时显示
						showRule: "contactType === 'wechat'",
						col: { span: 24 },
					},
				],
			},

			// ============================================
			// 分组 4: 价格信息
			// ============================================
			{
				key: 'price-group',
				title: '💰 Price Information',
				type: 'group',
				columns: [
					{
						key: 'price',
						title: 'Price',
						type: 'money',
						form: {
							min: 0,
							placeholder: '0.00',
						},
						table: {
							width: 120,
							sorter: true,
						},
						search: {
							enabled: true,
							mode: 'range',
						},
						col: { span: 8 },
					},
					{
						key: 'discount',
						title: 'Discount %',
						type: 'percent',
						form: {
							min: 0,
							max: 100,
						},
						table: false, // 不在表格中显示
						col: { span: 8 },
					},
					{
						key: 'quantity',
						title: 'Qty',
						type: 'number',
						form: {
							min: 0,
						},
						table: {
							width: 80,
							sorter: true,
						},
						col: { span: 8 },
					},
				],
			},

			// ============================================
			// 分组 5: 属性选择
			// ============================================
			{
				key: 'attributes-group',
				title: '🏷️ Attributes',
				type: 'group',
				columns: [
					{
						key: 'priority',
						title: 'Priority',
						type: 'radio',
						data: priorityOptions,
						table: {
							width: 100,
						},
						search: {
							enabled: true,
						},
						col: { span: 24 },
					},
					{
						key: 'features',
						title: 'Features',
						type: 'checkbox',
						data: featureOptions,
						table: false, // 不在表格中显示
						col: { span: 24 },
					},
					{
						key: 'tags',
						title: 'Tags',
						type: 'tag',
						data: tagOptions,
						table: {
							width: 180,
						},
						col: { span: 24 },
					},
				],
			},

			// ============================================
			// 分组 6: 组织信息
			// ============================================
			{
				key: 'org-group',
				title: '🏢 Organization',
				type: 'group',
				columns: [
					{
						key: 'department',
						title: 'Department',
						type: 'tree-select',
						data: departmentTree,
						form: {
							showSearch: true,
							treeDefaultExpandAll: true,
						},
						table: false, // 不在表格中显示
						col: { span: 12 },
					},
					{
						key: 'location',
						title: 'Location',
						type: 'cascader',
						data: locationData,
						table: false, // 不在表格中显示
						col: { span: 12 },
					},
				],
			},

			// ============================================
			// 分组 7: 日期时间
			// ============================================
			{
				key: 'datetime-group',
				title: '📅 Date & Time',
				type: 'group',
				columns: [
					{
						key: 'publishDate',
						title: 'Publish Date',
						type: 'date',
						table: {
							width: 120,
							sorter: true,
						},
						search: {
							enabled: true,
							mode: 'range',
						},
						col: { span: 8 },
					},
					{
						key: 'eventTime',
						title: 'Event Time',
						type: 'datetime',
						table: false, // 不在表格中显示
						col: { span: 8 },
					},
					{
						key: 'validPeriod',
						title: 'Valid Period',
						type: 'daterange',
						table: false, // 不在表格中显示
						col: { span: 8 },
					},
				],
			},

			// ============================================
			// 分组 8: 开关状态（展示条件禁用）
			// ============================================
			{
				key: 'switches-group',
				title: '🔘 Status Switches',
				type: 'group',
				tips: '只有 Active 开启时，才能设置 VIP 和通知',
				columns: [
					{
						key: 'isActive',
						title: 'Active',
						type: 'switch',
						table: {
							width: 80,
						},
						search: {
							enabled: true,
						},
						// 监听变化，关闭时同时关闭依赖项
						watch: {
							handler: (value, { setFieldValue }) => {
								if (!value) {
									setFieldValue('isVip', false);
									setFieldValue('enableNotification', false);
								}
							},
						},
						col: { span: 6 },
					},
					{
						key: 'isPublic',
						title: 'Public',
						type: 'switch',
						table: false, // 不在表格中显示
						col: { span: 6 },
					},
					{
						key: 'isVip',
						title: 'VIP Only',
						type: 'switch',
						table: false, // 不在表格中显示
						// 只有 isActive 为 true 时才能启用
						disabled: (formData) => !formData?.isActive,
						col: { span: 6 },
					},
					{
						key: 'enableNotification',
						title: 'Notification',
						type: 'switch',
						table: false, // 不在表格中显示
						// 只有 isActive 为 true 时才能启用
						disabled: (formData) => !formData?.isActive,
						col: { span: 6 },
					},
				],
			},

			// ============================================
			// 分组 9: 媒体文件
			// ============================================
			{
				key: 'media-group',
				title: '🖼️ Media Files',
				type: 'group',
				tips: 'Upload images and files. Supported formats: JPG, PNG, PDF, DOC.',
				columns: [
					// 单图上传 - 照片墙样式
					{
						key: 'coverImage',
						title: 'Cover (Single)',
						type: 'image',
						table: {
							width: 80,
						},
						form: {
							listType: 'picture-card', // 照片墙样式
							accept: 'image/png,image/jpeg,image/webp',
							maxSize: 5, // 最大 5MB
						},
						col: { span: 8 },
					},
					// 多图上传 - 支持多选
					{
						key: 'gallery',
						title: 'Gallery (Multiple)',
						type: 'images',
						table: {
							width: 120,
						},
						form: {
							max: 2, // 最多 6 张
							accept: 'image/png,image/jpeg',
							maxSize: 2, // 单张最大 2MB
						},
						col: { span: 8 },
					},
					// 头像上传 - 圆形样式
					{
						key: 'avatar',
						title: 'Avatar',
						type: 'avatar',
						table: {
							width: 120,
						},
						form: {
							maxSize: 1, // 最大 1MB
							accept: 'image/png,image/jpeg',
						},
						col: { span: 8 },
					},
				],
			},
			// 文件上传分组
			{
				key: 'file-group',
				title: '📎 File Attachments',
				type: 'group',
				columns: [
					// 按钮上传（支持排序）
					{
						key: 'documents',
						title: 'Documents (Button + Sortable)',
						type: 'file',
						table: false,
						form: {
							max: 5,
							accept: '.pdf,.doc,.docx',
							maxSize: 1,
							dragger: false, // 按钮样式
							sortable: true, // 支持拖拽排序
						},
						col: { span: 12 },
					},
					// 拖拽上传（支持排序）
					{
						key: 'attachments',
						title: 'Attachments (Dragger + Sortable)',
						type: 'file',
						table: false,
						form: {
							max: 5,
							accept: '.pdf,.doc,.docx,.xls,.xlsx,.zip',
							maxSize: 20,
							dragger: true, // 拖拽上传区域样式
							sortable: true, // 支持拖拽排序
							description: 'Click or drag file to this area to upload',
							hint: 'Support PDF, Word, Excel, ZIP files. Max 20MB each.',
						},
						col: { span: 12 },
					},
				],
			},

			// ============================================
			// 分组 10: 高级字段
			// ============================================
			{
				key: 'advanced-group',
				title: '⚙️ Advanced Fields',
				type: 'group',
				columns: [
					{
						key: 'rating',
						title: 'Rating',
						type: 'rate',
						form: {
							count: 5,
							allowHalf: true,
						},
						table: {
							width: 150,
						},
						col: { span: 8 },
					},
					{
						key: 'color',
						title: 'Brand Color',
						type: 'color',
						table: false, // 不在表格中显示
						col: { span: 8 },
					},
					{
						key: 'icon',
						title: 'Icon',
						type: 'icon',
						table: false, // 不在表格中显示
						col: { span: 8 },
					},
				],
			},

			// ============================================
			// 分组 11: 内容编辑
			// ============================================
			{
				key: 'content-group',
				title: '📝 Content',
				type: 'group',
				columns: [
					{
						key: 'description',
						title: 'Description',
						type: 'textarea',
						form: {
							placeholder: 'Enter a brief description',
							maxLength: 500,
							showCount: true,
						},
						table: false, // 不在表格中显示
						col: { span: 24 },
					},
					{
						key: 'richContent',
						title: 'Rich Content (Markdown)',
						type: 'markdown',
						form: {
							height: 400,
							preview: 'live',
						},
						table: false, // 不在表格中显示
						col: { span: 24 },
					},
				],
			},

			// ============================================
			// 分组 12: 数据字段
			// ============================================
			{
				key: 'data-group',
				title: '📊 Data Fields',
				type: 'group',
				columns: [
					{
						key: 'keywords',
						title: 'Keywords',
						type: 'array',
						form: {
							placeholder: 'Enter keywords',
						},
						table: false, // 不在表格中显示
						col: { span: 12 },
					},
					{
						key: 'metadata',
						title: 'Metadata (JSON)',
						type: 'json',
						table: false, // 不在表格中显示
						col: { span: 12 },
					},
				],
			},

			// ============================================
			// 仅表格展示字段（不在表单中显示）
			// ============================================
			{
				key: 'createdAt',
				title: 'Created',
				type: 'datetime',
				table: {
					width: 160,
					sorter: true,
				},
				form: false, // 不在表单中显示
			},
		],
		[]
	);

	return (
		<SmartCrudPage
			fieldsConfig={fieldsConfig}
			actions={{
				getList: actions.getListAction,
				getDetail: actions.getDetailAction,
				create: actions.createAction,
				update: actions.updateAction,
				delete: actions.deleteAction,
			}}
			title='SmartCrudPage Full Example'
			rowKey='_id'
			// 表格配置
			tableProps={{
				scroll: { x: 1800 },
			}}
			// 表单配置
			formProps={{
				width: 1000,
			}}
			// 启用所有功能
			enableCreate={true}
			enableEdit={true}
			enableDelete={true}
			enableDetail={true}
			// 权限配置（可选）
			// permissions={{
			// 	create: 'example:create',
			// 	update: 'example:update',
			// 	delete: 'example:delete',
			// }}
		/>
	);
}
