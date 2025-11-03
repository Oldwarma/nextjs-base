/**
 * 套餐管理页面 - Smart CRUD 版本
 * 
 * 使用 Smart CRUD 重构，代码量从 579 行减少到约 200 行
 * 减少了 65% 的代码量
 */

'use client';

import dynamic from 'next/dynamic';
import { Tag } from 'antd';
import { DollarOutlined } from '@ant-design/icons';

// 动态导入 SmartCrudPage，避免 Hydration 错误
const SmartCrudPage = dynamic(() => import('@/components/admin/smart-crud-page'), {
	ssr: false,
	loading: () => <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>,
});

// Server Actions
import {
	getAllPackagesAdminAction as getList,
	createPackageAction as create,
	updatePackageAction as update,
	deletePackageAction as deleteItem,
} from '@/app/(admin)/actions/admin-packages';

export default function PackagesManagementPage() {
	// ============================================
	// 统一字段配置
	// ============================================
	const fieldsConfig = [
		// ID
		{
			key: '_id',
			title: 'ID',
			type: 'text',
			table: { width: 100, copyable: true },
			form: false,
			search: false,
		},
		
		// 套餐名称和描述（联合显示）
		{
			key: 'name',
			title: 'Package Name',
			type: 'text',
			table: {
				width: 200,
				copyable: true,
				ellipsis: true,
				render: (name, record) => (
					<div>
						<div style={{ fontWeight: 500 }}>{name}</div>
						<div style={{ fontSize: 12, color: '#999' }}>
							{record.description || 'No description'}
						</div>
					</div>
				),
			},
			form: {
				required: true,
				placeholder: 'Enter package name',
				minLength: 1,
				maxLength: 100,
			},
			search: {
				enabled: true,
				mode: 'like',
			},
		},
		
		// 描述（仅表单）
		{
			key: 'description',
			title: 'Description',
			type: 'textarea',
			table: false, // 已经在 name 列中显示
			form: {
				placeholder: 'Enter package description',
				props: {
					fieldProps: { rows: 3 },
				},
			},
		},
		
		// 价格
		{
			key: 'price',
			title: 'Price',
			type: 'money',
			table: {
				width: 120,
				sorter: true,
				precision: 2,
				symbol: '$',
			},
			form: {
				required: true,
				precision: 2,
				min: 0,
				prefix: '$',
			},
			search: false,
		},
		
		// 积分
		{
			key: 'credits',
			title: 'Credits',
			type: 'number',
			table: {
				width: 100,
				sorter: true,
				render: (credits) => (
					<span style={{ fontWeight: 500, color: '#52c41a' }}>
						{credits}
					</span>
				),
			},
			form: {
				required: true,
				precision: 0,
				min: 0,
			},
			search: false,
		},
		
		// 有效天数
		{
			key: 'validDays',
			title: 'Valid Days',
			type: 'number',
			table: {
				width: 120,
				render: (days) => `${days} days`,
			},
			form: {
				required: true,
				precision: 0,
				min: 0,
			},
			search: false,
		},
		
		// 状态
		{
			key: 'isActive',
			title: 'Status',
			type: 'switch',
			table: {
				width: 100,
				trueText: 'Active',
				falseText: 'Inactive',
			},
			form: {
				props: {
					initialValue: true,
				},
			},
			search: {
				enabled: true,
				mode: 'exact',
				trueText: 'Active',
				falseText: 'Inactive',
			},
		},
		
		// 特性列表
		{
			key: 'features',
			title: 'Features',
			type: 'textarea',
			table: {
				width: 200,
			},
			hideInTable: true, // 只在详情中显示
			form: {
				placeholder: 'Enter features (one per line)',
				props: {
					fieldProps: { rows: 4 },
					tooltip: 'Enter one feature per line',
				},
			},
			detail: {
				render: (features) => {
					// 如果是字符串，按行分割；如果是数组，直接使用
					const featureList = Array.isArray(features) 
						? features 
						: (features || '').split('\n').filter(f => f.trim());
					
					return (
						<>
							{featureList.map((feature, index) => (
								<Tag key={index} style={{ marginBottom: 4 }}>
									{feature}
								</Tag>
							))}
						</>
					);
				},
			},
		},
		
		// 排序
		{
			key: 'sort',
			title: 'Sort Order',
			type: 'number',
			table: {
				width: 100,
			},
			hideInTable: true, // 只在详情和表单中显示
			form: {
				precision: 0,
				props: {
					initialValue: 0,
				},
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
			hideInTable: true, // 只在详情中显示
			form: false,
		},
		
		// 更新时间
		{
			key: 'updatedAt',
			title: 'Updated At',
			type: 'datetime',
			table: {
				width: 180,
			},
			hideInTable: true, // 只在详情中显示
			form: false,
		},
	];
	
	// ============================================
	// Actions 配置
	// ============================================
	const actions = {
		getList,
		getDetail,
		create,
		update,
		delete: deleteItem,
	};
	
	// ============================================
	// 批量操作
	// ============================================
	const batchActions = [
		{
			key: 'activate',
			label: 'Activate',
			action: batchUpdate,
			params: { isActive: true },
		},
		{
			key: 'deactivate',
			label: 'Deactivate',
			action: batchUpdate,
			params: { isActive: false },
		},
	];
	
	// ============================================
	// 钩子函数
	// ============================================
	
	// 编辑前处理 - 转换 features 为字符串
	const beforeEdit = async (record) => {
		return {
			...record,
			features: Array.isArray(record.features) 
				? record.features.join('\n') 
				: record.features || '',
		};
	};
	
	// 创建前处理 - 转换 features 为数组
	const beforeCreate = async (values) => {
		return {
			...values,
			features: typeof values.features === 'string' 
				? values.features.split('\n').filter(f => f.trim()) 
				: values.features || [],
		};
	};
	
	// ============================================
	// 自定义详情头部
	// ============================================
	const renderDetailHeader = (record) => (
		<div style={{ 
			textAlign: 'center', 
			marginBottom: 24, 
			padding: '24px 0', 
			background: '#fafafa', 
			borderRadius: 8 
		}}>
			<DollarOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 12 }} />
			<div style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
				{record.name}
			</div>
			<div style={{ fontSize: 32, fontWeight: 700, color: '#1890ff', marginBottom: 8 }}>
				${Number(record.price).toFixed(2)}
			</div>
			<Tag color={record.isActive ? 'green' : 'default'} style={{ fontSize: 14 }}>
				{record.isActive ? 'Active' : 'Inactive'}
			</Tag>
		</div>
	);
	
	// ============================================
	// 返回 SmartCrudPage
	// ============================================
	return (
		<SmartCrudPage
			fieldsConfig={fieldsConfig}
			actions={actions}
			title='Package Management'
			rowKey='_id'
			
			// 批量操作
			batchActions={batchActions}
			
			// 钩子函数
			beforeEdit={beforeEdit}
			beforeCreate={beforeCreate}
			
			// 自定义详情头部
			renderDetailHeader={renderDetailHeader}
			
			// 功能开关
			enableCreate={true}   // 支持创建套餐
			enableDetail={true}
			enableEdit={true}
			enableDelete={true}
			
			// 表格配置
			tableProps={{
				scroll: { x: 1200 },
			}}
			
			// 表单配置
			formProps={{
				width: 700,
			}}
		/>
	);
}

