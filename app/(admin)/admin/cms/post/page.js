/**
 * Post Management Page
 *
 * 基于 SmartCrudPage 实现
 * - fieldsConfig 直接在 page.js 中定义
 * - Server Actions 在 crud-action.post.js 中
 */

'use client';

import SmartCrudPage from '@/components/admin/smart-crud-page';
import * as postActions from '@/app/(admin)/actions/cms/crud-action.post';

export default function PostManagementPage() {
	// ============================================
	// 字段配置
	// ============================================
	const fieldsConfig = [
		// ID 字段（MongoDB _id）
		{
			key: '_id',
			title: 'ID',
			type: 'text',
			table: false,
			form: false,
			search: false,
		},

		// 名称
		{
			key: 'name',
			title: 'Name',
			type: 'text',
			table: {
				width: 200,
				sorter: true,
				copyable: true,
			},
			form: {
				required: true,
				placeholder: 'Enter post name',
				rules: [
					{ required: true, message: 'Name is required' },
					{ min: 2, max: 50, message: 'Name length: 2-50 characters' },
				],
			},
			search: {
				enabled: true,
				mode: 'like',
			},
		},

		// 状态
		{
			key: 'status',
			title: 'Status',
			type: 'select',
			options: [
				{ label: 'Active', value: 'active', color: 'green' },
				{ label: 'Inactive', value: 'inactive', color: 'red' },
			],
			table: {
				width: 120,
			},
			form: {
				required: true,
				rules: [{ required: true, message: 'Status is required' }],
			},
			search: {
				enabled: true,
				mode: 'exact',
			},
		},

		// 显示顺序
		{
			key: 'order',
			title: 'Display Order',
			type: 'number',
			table: {
				width: 120,
				sorter: true,
			},
			form: {
				required: false,
				placeholder: 'Enter display order',
				fieldProps: {
					min: 0,
				},
				rules: [{ type: 'number', min: 0, message: 'Order must >= 0' }],
			},
			search: false,
		},

		// 过期时间
		{
			key: 'expiresAt',
			title: 'Expires At',
			type: 'date',
			table: {
				width: 180,
			},
			form: {
				required: false,
			},
			search: false,
		},

		// 描述
		{
			key: 'description',
			title: 'Description',
			type: 'textarea',
			table: {
				width: 200,
				ellipsis: true,
			},
			form: {
				required: false,
				fieldProps: {
					rows: 3,
					showCount: true,
					maxLength: 500,
				},
				rules: [{ max: 500, message: 'Description max length: 500' }],
			},
			search: false,
		},

		// 内容（Markdown）
		{
			key: 'content',
			title: 'Content',
			type: 'markdown',
			table: false,
			form: {
				required: false,
				fieldProps: {
					rows: 10,
					showCount: true,
					maxLength: 5000,
				},
				rules: [{ max: 5000, message: 'Content max length: 5000' }],
			},
			detail: {
				render: (value) => <div dangerouslySetInnerHTML={{ __html: value }} />,
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
	];

	// ============================================
	// 批量操作配置
	// ============================================
	const batchActions = [
		{
			key: 'batchActivate',
			label: 'Batch Activate',
			action: async (selectedKeys) => {
				return await postActions.batchUpdatePostsAction({
					ids: selectedKeys,
					data: { status: 'active' },
				});
			},
		},
		{
			key: 'batchUnactivate',
			label: 'Batch Unactivate',
			action: async (selectedKeys) => {
				return await postActions.batchUpdatePostsAction({
					ids: selectedKeys,
					data: { status: 'inactive' },
				});
			},
		},
		{
			key: 'batchDelete',
			label: 'Batch Delete',
			action: async (selectedKeys) => {
				return await postActions.batchDeletePostsAction({
					ids: selectedKeys,
				});
			},
		},
	];

	// ============================================
	// 渲染页面
	// ============================================
	return (
		<SmartCrudPage
			fieldsConfig={fieldsConfig}
			actions={{
				getList: postActions.getPostListAction,
				create: postActions.createPostAction,
				update: postActions.updatePostAction,
				delete: postActions.deletePostAction,
			}}
			title='Post Management'
			rowKey='_id'
			// 功能开关
			enableCreate={true}
			enableEdit={true}
			enableDelete={true}
			enableDetail={true}
			enableIndexColumn={true}
			// 批量操作
			batchActions={batchActions}
			// 表格配置
			tableProps={{
				pagination: {
					defaultPageSize: 10,
					showSizeChanger: true,
					pageSizeOptions: [10, 20, 50, 100],
				},
				scroll: { x: 1200 },
			}}
			// 表单配置
			formProps={{
				width: 800, // Markdown 编辑器需要更宽
			}}
		/>
	);
}
