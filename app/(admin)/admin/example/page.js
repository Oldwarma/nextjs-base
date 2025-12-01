'use client';

import dynamic from 'next/dynamic';

// 动态导入 SmartCrudPage，禁用 SSR
const SmartCrudPage = dynamic(
	() => import('@/components/admin/smart-crud-page'),
	{ ssr: false, loading: () => <div>Loading...</div> }
);

/**
 * 示例页面 - 展示所有 26 种字段类型
 * 
 * 本页面仅用于演示 Smart CRUD 系统的所有功能
 * 包括：基础输入、选择类、日期时间、上传类、高级类
 */
export default function ExamplePage() {
	// 模拟的树形数据
	const departmentTree = [
		{
			value: 'engineering',
			title: 'Engineering',
			children: [
				{ value: 'frontend', title: 'Frontend Team' },
				{ value: 'backend', title: 'Backend Team' },
				{ value: 'mobile', title: 'Mobile Team' },
			],
		},
		{
			value: 'product',
			title: 'Product',
			children: [
				{ value: 'design', title: 'Design Team' },
				{ value: 'pm', title: 'Product Management' },
			],
		},
		{
			value: 'marketing',
			title: 'Marketing',
			children: [
				{ value: 'seo', title: 'SEO' },
				{ value: 'content', title: 'Content' },
				{ value: 'social', title: 'Social Media' },
			],
		},
	];

	// 模拟的级联数据
	const locationData = [
		{
			value: 'us',
			label: 'United States',
			children: [
				{
					value: 'ca',
					label: 'California',
					children: [
						{ value: 'sf', label: 'San Francisco' },
						{ value: 'la', label: 'Los Angeles' },
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
			],
		},
		{
			value: 'cn',
			label: 'China',
			children: [
				{
					value: 'beijing',
					label: 'Beijing',
					children: [
						{ value: 'haidian', label: 'Haidian' },
						{ value: 'chaoyang', label: 'Chaoyang' },
					],
				},
				{
					value: 'shanghai',
					label: 'Shanghai',
					children: [
						{ value: 'pudong', label: 'Pudong' },
						{ value: 'puxi', label: 'Puxi' },
					],
				},
			],
		},
	];

	// 字段配置 - 展示所有 26 种类型 + 分组布局
	const fieldsConfig = [
		// ============================================
		// 分组布局示例
		// ============================================
		{
			key: 'basic-info-group',
			title: 'Basic Information',
			type: 'group',
			justify: 'start',
			hideInTable: true,
			columns: [
				{
					key: 'title',
					title: 'Title',
					type: 'text',
					form: {
						required: true,
					},
					col: { span: 12 }, // 50% 宽度
				},
				{
					key: 'category',
					title: 'Category',
					type: 'select',
					form: {
						required: true,
					},
					data: [
						{ label: 'Electronics', value: 'electronics' },
						{ label: 'Clothing', value: 'clothing' },
						{ label: 'Food', value: 'food' },
					],
					col: { span: 12 }, // 50% 宽度
				},
			],
		},
		{
			key: 'price-info-group',
			title: 'Price Information',
			type: 'group',
			justify: 'start',
			hideInTable: true,
			columns: [
				{
					key: 'price',
					title: 'Price',
					type: 'money',
					form: {
						required: true,
						min: 0,
					},
					col: { span: 8 }, // 33.3% 宽度
				},
				{
					key: 'discountRate',
					title: 'Discount',
					type: 'percent',
					form: {
						min: 0,
						max: 100,
					},
					col: { span: 8 }, // 33.3% 宽度
				},
				{
					key: 'quantity',
					title: 'Quantity',
					type: 'number',
					form: {
						min: 0,
					},
					col: { span: 8 }, // 33.3% 宽度
				},
			],
		},
		
		// ============================================
		// 基础输入（6 个）
		// ============================================
		{
			key: 'title',
			title: 'Title',
			type: 'text',
			table: {
				width: 200,
				fixed: 'left',
			},
			form: {
				required: true,
			},
			search: {
				enabled: true,
				mode: 'like',
			},
			tips: 'Enter a descriptive title',
		},
		{
			key: 'description',
			title: 'Description',
			type: 'textarea',
			table: {
				width: 250,
				ellipsis: true,
			},
			form: {
				placeholder: 'Enter detailed description',
			},
			hideInTable: true,
		},
		{
			key: 'richContent',
			title: 'Rich Content (Markdown)',
			type: 'markdown',
			hideInTable: true,
			form: {
				required: true,
				height: 500,
				preview: 'live',
				placeholder: 'Write content in Markdown format...',
			},
			tips: 'Supports full Markdown syntax including headers, bold, italic, lists, code blocks, etc.',
		},
		{
			key: 'quantity',
			title: 'Quantity',
			type: 'number',
			table: {
				width: 120,
			},
			form: {
				min: 0,
				max: 999999,
			},
			search: {
				enabled: true,
				mode: 'range',
			},
		},
		{
			key: 'price',
			title: 'Price',
			type: 'money',
			table: {
				width: 120,
			},
			form: {
				required: true,
				min: 0,
			},
			search: {
				enabled: true,
				mode: 'range',
			},
		},
		{
			key: 'discountRate',
			title: 'Discount',
			type: 'percent',
			table: {
				width: 120,
			},
			form: {
				min: 0,
				max: 100,
			},
		},

		// ============================================
		// 选择类（6 个）
		// ============================================
		{
			key: 'category',
			title: 'Category',
			type: 'select',
			table: {
				width: 150,
			},
			form: {
				required: true,
			},
			search: {
				enabled: true,
			},
			data: [
				{ label: 'Electronics', value: 'electronics' },
				{ label: 'Clothing', value: 'clothing' },
				{ label: 'Food', value: 'food' },
				{ label: 'Books', value: 'books' },
				{ label: 'Sports', value: 'sports' },
			],
		},
		{
			key: 'priority',
			title: 'Priority',
			type: 'radio',
			table: {
				width: 120,
			},
			form: {
				required: true,
			},
			search: {
				enabled: true,
			},
			data: [
				{ label: 'Low', value: 'low' },
				{ label: 'Medium', value: 'medium' },
				{ label: 'High', value: 'high' },
				{ label: 'Urgent', value: 'urgent' },
			],
		},
		{
			key: 'features',
			title: 'Features',
			type: 'checkbox',
			hideInTable: true,
			data: [
				{ label: 'Waterproof', value: 'waterproof' },
				{ label: 'Wireless', value: 'wireless' },
				{ label: 'Rechargeable', value: 'rechargeable' },
				{ label: 'Portable', value: 'portable' },
			],
		},
		{
			key: 'isActive',
			title: 'Active',
			type: 'switch',
			table: {
				width: 100,
			},
			search: {
				enabled: true,
			},
		},
		{
			key: 'location',
			title: 'Location',
			type: 'cascader',
			table: {
				width: 200,
			},
			form: {
				required: true,
			},
			data: locationData,
			tips: 'Select country > state > city',
		},
		{
			key: 'department',
			title: 'Department',
			type: 'tree-select',
			table: {
				width: 180,
			},
			form: {
				showSearch: true,
			},
			search: {
				enabled: true,
			},
			data: departmentTree,
			tips: 'Select department from tree structure',
		},

		// ============================================
		// 日期时间（4 个）
		// ============================================
		{
			key: 'launchDate',
			title: 'Launch Date',
			type: 'date',
			table: {
				width: 150,
			},
			form: {
				required: true,
			},
			search: {
				enabled: true,
				mode: 'range',
			},
		},
		{
			key: 'publishedAt',
			title: 'Published At',
			type: 'datetime',
			table: {
				width: 180,
			},
			search: {
				enabled: true,
				mode: 'range',
			},
		},
		{
			key: 'campaignPeriod',
			title: 'Campaign Period',
			type: 'daterange',
			hideInTable: true,
			form: {
				required: true,
			},
		},
		{
			key: 'deliveryTime',
			title: 'Delivery Time',
			type: 'time',
			table: {
				width: 120,
			},
		},

		// ============================================
		// 上传类（3 个）
		// ============================================
		{
			key: 'coverImage',
			title: 'Cover Image',
			type: 'image',
			table: {
				width: 120,
			},
			form: {
				required: true,
			},
			tips: 'Upload cover image (max 5MB)',
		},
		{
			key: 'authorAvatar',
			title: 'Author Avatar',
			type: 'avatar',
			table: {
				width: 100,
			},
		},
		{
			key: 'attachment',
			title: 'Attachment',
			type: 'file',
			hideInTable: true,
			tips: 'Upload document or file',
		},

		// ============================================
		// 高级类（7 个）
		// ============================================
		{
			key: 'tags',
			title: 'Tags',
			type: 'tag',
			table: {
				width: 200,
			},
			data: [
				{ label: 'New', value: 'new', color: 'green' },
				{ label: 'Hot', value: 'hot', color: 'red' },
				{ label: 'Sale', value: 'sale', color: 'orange' },
				{ label: 'Limited', value: 'limited', color: 'purple' },
			],
		},
		{
			key: 'apiKey',
			title: 'API Key',
			type: 'password',
			hideInTable: true,
			form: {
				placeholder: 'Enter secure API key',
			},
		},
		{
			key: 'rating',
			title: 'Rating',
			type: 'rate',
			table: {
				width: 150,
			},
			form: {
				count: 5,
				allowHalf: true,
			},
		},
		{
			key: 'satisfaction',
			title: 'Satisfaction',
			type: 'slider',
			table: {
				width: 120,
			},
			form: {
				min: 0,
				max: 100,
				marks: {
					0: '0%',
					50: '50%',
					100: '100%',
				},
			},
		},
		{
			key: 'brandColor',
			title: 'Brand Color',
			type: 'color',
			table: {
				width: 120,
			},
		},
		{
			key: 'icon',
			title: 'Icon',
			type: 'icon',
			table: {
				width: 180,
			},
			form: {
				required: true,
			},
			tips: 'Select an icon for this item',
		},
		{
			key: 'metadata',
			title: 'Metadata',
			type: 'json',
			hideInTable: true,
			tips: 'Enter metadata in JSON format',
		},
		{
			key: 'keywords',
			title: 'Keywords',
			type: 'array',
			table: {
				width: 200,
			},
			form: {
				placeholder: 'Enter keywords, one per line',
			},
			tips: 'Enter one keyword per line',
		},
	];

	// 模拟的 Server Actions
	const actions = {
		getList: async (params) => {
			console.log('Fetching list with params:', params);

			// 模拟延迟
			await new Promise((resolve) => setTimeout(resolve, 500));

			const pageIndex = params.pageIndex || 1;
			const pageSize = params.pageSize || 10;

			// 模拟数据
			const mockData = Array.from({ length: pageSize }, (_, i) => ({
				_id: `example-${(pageIndex - 1) * pageSize + i + 1}`,
				title: `Product ${(pageIndex - 1) * pageSize + i + 1}`,
				description: 'This is a sample product description for demonstration purposes.',
				richContent: '<p>This is <strong>rich text</strong> content.</p>',
				quantity: Math.floor(Math.random() * 1000),
				price: Math.floor(Math.random() * 10000),
				discountRate: Math.floor(Math.random() * 50),
				category: ['electronics', 'clothing', 'food', 'books'][Math.floor(Math.random() * 4)],
				priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)],
				features: ['waterproof', 'wireless'],
				isActive: Math.random() > 0.5,
				location: ['us', 'ca', 'sf'],
				department: ['engineering', 'frontend'][Math.floor(Math.random() * 2)],
				launchDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
				publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
				campaignPeriod: [
					new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
					new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
				],
				deliveryTime: '09:00:00',
				coverImage: 'https://via.placeholder.com/150',
				authorAvatar: 'https://via.placeholder.com/100',
				attachment: 'https://example.com/document.pdf',
				tags: ['new', 'hot'],
				apiKey: '••••••••',
				rating: Math.floor(Math.random() * 5) + 1,
				satisfaction: Math.floor(Math.random() * 100),
				brandColor: '#1890ff',
				icon: ['HomeOutlined', 'UserOutlined', 'SettingOutlined', 'StarOutlined', 'HeartOutlined', 'SearchOutlined'][Math.floor(Math.random() * 6)],
				metadata: JSON.stringify({ version: '1.0', author: 'Admin' }),
				keywords: ['keyword1', 'keyword2', 'keyword3'],
			}));

			return {
				success: true,
				data: mockData,
				total: 100, // 模拟总数
			};
		},

		create: async (data) => {
			console.log('Creating item:', data);
			await new Promise((resolve) => setTimeout(resolve, 500));
			return {
				success: true,
				message: 'Item created successfully',
			};
		},

		update: async (id, data) => {
			console.log('Updating item:', id, data);
			await new Promise((resolve) => setTimeout(resolve, 500));
			return {
				success: true,
				message: 'Item updated successfully',
			};
		},

		delete: async (id) => {
			console.log('Deleting item:', id);
			await new Promise((resolve) => setTimeout(resolve, 500));
			return {
				success: true,
				message: 'Item deleted successfully',
			};
		},
	};

	return (
		<SmartCrudPage
			fieldsConfig={fieldsConfig}
			actions={actions}
			title="Example Page"
			rowKey="id"
			// 表格配置
			tableProps={{
				scroll: { x: 2500 },
			}}
			// 表单配置
			formProps={{
				width: 900, // 表单弹窗宽度（全屏按钮可切换到 100vw）
			}}
			// 启用所有功能
			enableCreate={true}
			enableEdit={true}
			enableDelete={true}
			enableDetail={true}
		/>
	);
}

