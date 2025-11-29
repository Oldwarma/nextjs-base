/**
 * {RESOURCE_LABEL} Management Page
 * 
 * 基于 SmartCrudPage 实现
 * - fieldsConfig 直接在 page.js 中定义
 * - Server Actions 在 crud-action.{RESOURCE_NAME}.js 中
 * 
 * 使用说明：
 * 1. 替换 {RESOURCE_NAME} → 资源名(小写单数), 如: permission, role, menu
 * 2. 替换 {RESOURCE_LABEL} → 资源标签(首字母大写), 如: Permission, Role, Menu
 * 3. 替换 {ACTION_PATH} → Action 文件路径, 如: rbac, cms, system
 * 4. 配置 fieldsConfig 数组
 */

'use client';

import SmartCrudPage from '@/components/admin/smart-crud-page';

// Server Actions
import * as {RESOURCE_NAME}Actions from '@/app/(admin)/actions/{ACTION_PATH}/crud-action.{RESOURCE_NAME}';

export default function {RESOURCE_LABEL}ManagementPage() {
	// ============================================
	// 字段配置
	// ============================================
	const fieldsConfig = [
		// ID 字段（自动生成，不显示）
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
					maxLength: 50,
				},
			},
			search: {
				mode: 'like',
				placeholder: 'Search by name',
			},
		},

		// 启用状态
		{
			key: 'enable',
			title: 'Status',
			type: 'switch',
			table: {
				width: 100,
				align: 'center',
			},
			form: {
				fieldProps: {
					checkedChildren: 'Enabled',
					unCheckedChildren: 'Disabled',
				},
			},
			search: {
				fieldProps: {
					placeholder: 'Filter by status',
				},
			},
		},

		// 备注
		{
			key: 'remark',
			title: 'Remark',
			type: 'textarea',
			table: false,
			form: {
				placeholder: 'Optional description or notes',
				fieldProps: {
					rows: 3,
					showCount: true,
					maxLength: 200,
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
			}}
			title='{RESOURCE_LABEL} Management'
			// 功能开关
			enableCreate={true}
			enableEdit={true}
			enableDelete={true}
			enableDetail={true}
			// 表格配置
			tableProps={{
				scroll: { x: 1200 },
			}}
			// 表单配置
			formProps={{
				width: 600,
			}}
		/>
	);
}

