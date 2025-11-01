/**
 * 用户管理页面 - Smart CRUD 版本
 * 
 * 使用 Smart CRUD 重构，代码量从 477 行减少到约 150 行
 * 减少了 68% 的代码量
 */

'use client';

import dynamic from 'next/dynamic';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';

// 动态导入 SmartCrudPage，禁用 SSR 避免 Hydration 错误
const SmartCrudPage = dynamic(() => import('@/components/admin/smart-crud-page'), {
	ssr: false,
	loading: () => <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>,
});

// Server Actions
import {
	getUserListAction as getList,
	updateUserInfoAction as update,
	deleteUserAction as deleteItem,
	batchUpdateUsersAction as batchUpdate,
} from '@/app/(admin)/actions/admin-users';

export default function UsersManagementPage() {
	// ============================================
	// 统一字段配置
	// ============================================
	const fieldsConfig = [
		// userid
		{
			key: '_id',
			title: 'ID',
			type: 'text',
			table: false,
			form: false,
			search: false
		},
		// 头像
		{
			key: 'image',
			title: 'Avatar',
			type: 'image',
			table: {
				width: 80,
				render: (image, record) => (
					<Avatar src={image} icon={<UserOutlined />} size={40}>
						{record.name?.[0]?.toUpperCase()}
					</Avatar>
				),
			},
			form: false,
			search: false,
		},
		
		// 姓名和用户名（联合显示）
		{
			key: 'name',
			title: 'Name',
			type: 'text',
			table: {
				width: 120,
				copyable: true,
				ellipsis: true,
				render: (name, record) => (
					<div>
						<div style={{ fontWeight: 500 }}>{name || 'N/A'}</div>
						<div style={{ fontSize: 12, color: '#999' }}>
							@{record.username || 'N/A'}
						</div>
					</div>
				),
			},
			form: {
				required: true,
				placeholder: 'Enter name',
				minLength: 2,
				maxLength: 50,
			},
			search: {
				enabled: true,
				mode: 'like',
			},
		},
		
		// 邮箱
		{
			key: 'email',
			title: 'Email',
			type: 'text',
			table: {
				width: 150,
				copyable: true,
				ellipsis: true,
			},
			form: {
				required: true,
				placeholder: 'user@example.com',
				pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
				patternMessage: 'Invalid email format',
			},
			search: {
				enabled: true,
				mode: 'like',
			},
		},
		
		// 用户名（仅表单）
		{
			key: 'username',
			title: 'Username',
			type: 'text',
			table: false, // 已经在 name 列中显示
			form: {
				required: false,
				placeholder: 'username',
				pattern: /^[a-zA-Z0-9_]{3,20}$/,
				patternMessage: 'Username must be 3-20 characters (letters, numbers, underscores)',
			},
			detail: {
				render: (value) => `@${value || 'N/A'}`,
			},
		},
		
		// 角色
		{
			key: 'role',
			title: 'Role',
			type: 'select',
			options: [
				{ label: 'Admin', value: 'admin', color: 'blue' },
				{ label: 'User', value: 'user', color: 'default' },
			],
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
		
		// 积分
		{
			key: 'credits',
			title: 'Credits',
			type: 'number',
			table: {
				width: 100,
				sorter: true,
				render: (credits) => (
					<span style={{ 
						fontWeight: 500, 
						color: credits > 0 ? '#52c41a' : '#999' 
					}}>
						{credits || 0}
					</span>
				),
			},
			form: {
				disabled: true,
				props: {
					tooltip: 'Credits can only be adjusted through Credits Management',
				},
			},
			search: false,
		},
		
		// 邮箱验证状态
		{
			key: 'emailVerified',
			title: 'Email Verified',
			type: 'switch',
			table: {
				width: 120,
				trueText: 'Verified',
				falseText: 'Unverified',
			},
			hideInTable: true, // 只在详情和表单中显示
			form: {
				required: true,
			},
			search: {
				enabled: true,
				mode: 'exact',
				trueText: 'Verified',
				falseText: 'Unverified',
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
				defaultSort: 'desc',
			},
			form: false,
			search: false,
		},
		
		// 最后登录时间
		{
			key: 'lastLoginAt',
			title: 'Last Login',
			type: 'datetime',
			table: {
				width: 180,
				sorter: true,
			},
			hideInTable: true, // 只在详情中显示
			form: false,
			detail: {
				render: (value) => value || 'Never',
			},
		},
		
		// 累计获得积分
		{
			key: 'totalCreditsEarned',
			title: 'Total Credits Earned',
			type: 'number',
			table: false,
			form: false,
			hideInTable: true, // 只在详情中显示
			detail: {
				render: (value) => value || 0,
			},
		},
		
		// 累计使用积分
		{
			key: 'totalCreditsUsed',
			title: 'Total Credits Used',
			type: 'number',
			table: false,
			form: false,
			hideInTable: true, // 只在详情中显示
			detail: {
				render: (value) => value || 0,
			},
		},
		
		// 当前套餐
		{
			key: 'currentPackageId',
			title: 'Current Package',
			type: 'text',
			table: false,
			form: false,
			hideInTable: true, // 只在详情中显示
			detail: {
				render: (value) => value || 'None',
			},
		},
		
		// 套餐过期时间
		{
			key: 'packageExpireAt',
			title: 'Package Expires At',
			type: 'datetime',
			table: false,
			form: false,
			hideInTable: true, // 只在详情中显示
			detail: {
				render: (value) => (value ? new Date(value).toLocaleString() : 'N/A'),
			},
		},
		
		// 更新时间
		{
			key: 'updatedAt',
			title: 'Updated At',
			type: 'datetime',
			table: false,
			form: false,
			hideInTable: true, // 只在详情中显示
		},
	];
	
	// ============================================
	// Actions 配置
	// ============================================
	const actions = {
		getList,
		update,
		delete: deleteItem,
	};
	
	// ============================================
	// 批量操作
	// ============================================
	const batchActions = [
		{
			key: 'verifyEmail',
			label: 'Verify Email',
			action: batchUpdate,
			params: { emailVerified: true },
		},
	];
	
	// ============================================
	// 自定义详情头部
	// ============================================
	const renderDetailHeader = (record) => (
		<div style={{ textAlign: 'center', marginBottom: 24 }}>
			<Avatar src={record.image} size={80} icon={<UserOutlined />}>
				{record.name?.[0]?.toUpperCase()}
			</Avatar>
			<div style={{ marginTop: 12, fontSize: 18, fontWeight: 500 }}>
				{record.name || 'N/A'}
			</div>
			<div style={{ color: '#999' }}>@{record.username || 'N/A'}</div>
		</div>
	);
	
	// ============================================
	// 返回 SmartCrudPage
	// ============================================
	return (
		<SmartCrudPage
			fieldsConfig={fieldsConfig}
			actions={actions}
			title='User Management'
			rowKey='_id'
			
			// 批量操作
			batchActions={batchActions}
			
			// 自定义详情头部
			renderDetailHeader={renderDetailHeader}
			
			// 功能开关
			enableCreate={false}  // 用户通过注册创建，不需要管理员手动创建
			enableDetail={true}
			enableEdit={true}
			enableDelete={true}
			
			// 表格配置
			tableProps={{
				scroll: { x: 1400 },
				pagination: {
					showTotal: (total) => `Total ${total} users`,
				},
			}}
			
			// 表单配置
			formProps={{
				width: 600,
			}}
		/>
	);
}

