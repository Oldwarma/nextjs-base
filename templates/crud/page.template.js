/**
 * {RESOURCE_LABEL} Management Page
 *
 * 基于 SmartCrudPage 实现
 * - fieldsConfig 直接在 page.js 中定义
 * - Server Actions 在 crud-action.{RESOURCE_NAME}.js 中
 *
 * 使用说明：
 * 1. 替换 {RESOURCE_NAME} → 资源名(小写单数), 如: coupon, product, article
 * 2. 替换 {RESOURCE_LABEL} → 资源标签(首字母大写), 如: Coupon, Product, Article
 * 3. 替换 {ACTION_PATH} → Action 文件路径, 如: cms, system, rbac
 * 4. 配置 fieldsConfig 数组
 */

'use client';

import SmartCrudPage from '@/components/admin/smart-crud-page';
import { Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

// Server Actions
import * as {RESOURCE_NAME}Actions from '@/app/(admin)/actions/{ACTION_PATH}/crud-action.{RESOURCE_NAME}';

export default function {RESOURCE_LABEL}ManagementPage() {
	// ============================================
	// 字段配置
	// ============================================
	const fieldsConfig = [
		// ID 字段（UUID 自动生成，不显示）
		{
			key: 'id',
			title: 'ID',
			type: 'text',
			table: false,
			form: false,
			search: false,
		},

		// 名称字段（必需）
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
				fieldProps: {
					showCount: true,
					maxLength: 100,
				},
			},
			search: {
				mode: 'like',
				placeholder: 'Search by name',
			},
		},

		// 状态字段（下拉选择示例）
		// {
		// 	key: 'status',
		// 	title: 'Status',
		// 	type: 'select',
		// 	options: [
		// 		{ label: 'Active', value: 'active', color: 'green' },
		// 		{ label: 'Inactive', value: 'inactive', color: 'default' },
		// 		{ label: 'Pending', value: 'pending', color: 'orange' },
		// 	],
		// 	table: {
		// 		width: 120,
		// 	},
		// 	form: {
		// 		required: true,
		// 		placeholder: 'Select status',
		// 	},
		// 	search: {
		// 		mode: 'exact',
		// 	},
		// },

		// 启用状态（开关）
		{
			key: 'enable',
			title: 'Status',
			type: 'switch',
			table: {
				width: 100,
				align: 'center',
				render: (value) =>
					value ? (
						<Tag icon={<CheckCircleOutlined />} color='success'>Enabled</Tag>
					) : (
						<Tag icon={<CloseCircleOutlined />} color='default'>Disabled</Tag>
					),
			},
			form: {
				fieldProps: {
					checkedChildren: 'Enabled',
					unCheckedChildren: 'Disabled',
				},
			},
			search: {
				mode: 'exact',
				fieldProps: {
					placeholder: 'Filter by status',
				},
			},
		},

		// 数字字段示例
		// {
		// 	key: 'price',
		// 	title: 'Price',
		// 	type: 'number',
		// 	table: {
		// 		width: 120,
		// 		render: (value) => `$${value?.toFixed(2) || '0.00'}`,
		// 	},
		// 	form: {
		// 		required: true,
		// 		placeholder: 'Enter price',
		// 		fieldProps: {
		// 			min: 0,
		// 			precision: 2,
		// 			prefix: '$',
		// 		},
		// 	},
		// 	search: false,
		// },

		// 日期字段示例
		// {
		// 	key: 'startDate',
		// 	title: 'Start Date',
		// 	type: 'date',
		// 	table: {
		// 		width: 120,
		// 	},
		// 	form: {
		// 		placeholder: 'Select date',
		// 	},
		// 	search: {
		// 		mode: 'range',  // 日期范围搜索
		// 	},
		// },

		// 树形选择示例（如父级菜单）
		// {
		// 	key: 'parentId',
		// 	title: 'Parent',
		// 	type: 'tree-select',
		// 	table: false,
		// 	form: {
		// 		placeholder: 'Select parent',
		// 		action: 'getTreeForSelectAction',  // 需要在 actions 中注册
		// 		fieldProps: {
		// 			allowClear: true,
		// 			showSearch: true,
		// 			treeDefaultExpandAll: false,
		// 		},
		// 	},
		// 	search: false,
		// },

		// 图片上传示例
		// {
		// 	key: 'coverImage',
		// 	title: 'Cover',
		// 	type: 'image',
		// 	table: {
		// 		width: 100,
		// 		render: (value) => value ? <img src={value} alt="cover" style={{ width: 60, height: 60, objectFit: 'cover' }} /> : '-',
		// 	},
		// 	form: {
		// 		fieldProps: {
		// 			maxCount: 1,
		// 		},
		// 	},
		// 	search: false,
		// },

		// 多图上传示例
		// {
		// 	key: 'gallery',
		// 	title: 'Gallery',
		// 	type: 'images',
		// 	table: false,
		// 	form: {
		// 		fieldProps: {
		// 			maxCount: 9,
		// 		},
		// 	},
		// 	search: false,
		// },

		// Markdown 编辑器示例
		// {
		// 	key: 'content',
		// 	title: 'Content',
		// 	type: 'markdown',
		// 	table: false,
		// 	form: {
		// 		placeholder: 'Enter content...',
		// 		fieldProps: {
		// 			height: 400,
		// 		},
		// 	},
		// 	search: false,
		// },

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
				placeholder: 'Optional description or notes',
				fieldProps: {
					rows: 3,
					showCount: true,
					maxLength: 500,
				},
			},
			search: false,
		},

		// 创建时间
		{
			key: 'createdAt',
			title: 'Created At',
			type: 'datetime',
			table: {
				width: 180,
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
			},
			form: false,
			search: false,
		},
	];

	// ============================================
	// 自定义行操作（可选）
	// ============================================
	// const customRowActions = [
	// 	{
	// 		key: 'duplicate',
	// 		text: 'Duplicate',
	// 		icon: <CopyOutlined />,
	// 		onClick: async (record) => {
	// 			const { id, createdAt, updatedAt, ...data } = record;
	// 			const result = await {RESOURCE_NAME}Actions.create{RESOURCE_LABEL}Action({
	// 				...data,
	// 				name: `${data.name} (Copy)`,
	// 			});
	// 			if (result.success) {
	// 				message.success('Duplicated successfully');
	// 				// 刷新表格
	// 			}
	// 		},
	// 	},
	// 	{
	// 		key: 'archive',
	// 		text: 'Archive',
	// 		icon: <InboxOutlined />,
	// 		inMore: true,  // 放入更多菜单
	// 		confirm: {
	// 			title: 'Archive Confirmation',
	// 			description: 'Are you sure you want to archive this item?',
	// 		},
	// 		onClick: async (record) => {
	// 			// 归档逻辑
	// 		},
	// 	},
	// ];

	// ============================================
	// 渲染页面
	// ============================================
	return (
		<SmartCrudPage
			fieldsConfig={fieldsConfig}
			actions={{
				getList: {RESOURCE_NAME}Actions.get{RESOURCE_LABEL}ListAction,
				create: {RESOURCE_NAME}Actions.create{RESOURCE_LABEL}Action,
				update: {RESOURCE_NAME}Actions.update{RESOURCE_LABEL}Action,
				delete: {RESOURCE_NAME}Actions.delete{RESOURCE_LABEL}Action,
				// 如果有树形选择，需要注册对应的 action
				// getTreeForSelectAction: {RESOURCE_NAME}Actions.get{RESOURCE_LABEL}TreeForSelectAction,
			}}
			title='{RESOURCE_LABEL} Management'
			// 功能开关
			enableCreate={true}
			enableEdit={true}
			enableDelete={true}
			enableDetail={true}
			// 表格配置
			tableProps={{
				// scroll: { x: 1200 },
			}}
			// 表单配置
			formProps={{
				width: 600,
			}}
			// 自定义行操作
			// customRowActions={customRowActions}
		/>
	);
}
