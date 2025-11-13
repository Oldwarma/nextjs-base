/**
 * {RESOURCE_LABEL} Management Page Template
 * 
 * 使用说明：
 * 1. 替换 {RESOURCE_NAME} → 资源名(小写单数), 如: permission, role, menu
 * 2. 替换 {RESOURCE_LABEL} → 资源标签(首字母大写), 如: Permission, Role, Menu
 * 3. 配置 fieldsConfig 数组
 * 4. 根据需要添加自定义渲染、自定义操作等
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { App } from 'antd';

// 动态导入 SmartCrudPage
const SmartCrudPage = dynamic(() => import('@/components/admin/smart-crud-page'), {
	ssr: false,
	loading: () => <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>,
});

// Server Actions
import * as {RESOURCE_NAME}Actions from '@/app/(admin)/actions/rbac/crud-action.{RESOURCE_NAME}';

export default function {RESOURCE_LABEL}ManagementPage() {
	const { message } = App.useApp();

	// ============================================
	// 字段配置
	// ============================================
	const fieldsConfig = useMemo(() => [
		// ID 字段
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
				sorter: true,
				copyable: true,
			},
			form: {
				required: true,
				placeholder: 'Enter name',
			},
			search: {
				enabled: true,
				mode: 'like',
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

	// ============================================
	// Actions 配置
	// ============================================
	const actions = {
		getList: {RESOURCE_NAME}Actions.get{RESOURCE_LABEL}ListAction,
		getDetail: {RESOURCE_NAME}Actions.get{RESOURCE_LABEL}DetailAction,
		create: {RESOURCE_NAME}Actions.create{RESOURCE_LABEL}Action,
		update: {RESOURCE_NAME}Actions.update{RESOURCE_LABEL}Action,
		delete: {RESOURCE_NAME}Actions.delete{RESOURCE_LABEL}Action,
	};

	// ============================================
	// 渲染页面
	// ============================================
	return (
		<SmartCrudPage
			fieldsConfig={fieldsConfig}
			actions={actions}
			title='{RESOURCE_LABEL} Management'
			rowKey='id'
			
			// 功能开关
			enableCreate={true}
			enableDetail={true}
			enableEdit={true}
			enableDelete={true}
			
			// 表格配置
			tableProps={{
				scroll: { x: 1200 },
				pagination: {
					showTotal: (total) => `Total ${total} items`,
				},
			}}
			
			// 表单配置
			formProps={{
				width: 600,
			}}
		/>
	);
}

