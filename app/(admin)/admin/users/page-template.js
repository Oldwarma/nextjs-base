'use client';

import { ProFormText, ProFormSelect, ProFormDigit } from '@ant-design/pro-components';
import { Tag, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
// 引入通用 CRUD 页面组件
import CrudPage from '@/components/admin/crud-page';
// 引入 Server Actions
import {
	getUserListAction as getList,
	updateUserInfoAction as updateInfo,
	deleteUserAction as deleteItem,	
	batchUpdateUsersAction as batchUpdateItems,
} from '@/app/(admin)/actions/admin-users';

/**
 * 用户管理页面 - CrudPage 使用示例
 * 
 * ⚠️ 注意：这是一个示例文件，仅供参考
 * 实际使用请复制 app/(admin)/admin/_template/page.js
 * 
 * 本文件展示了：
 * - 如何配置复杂的表格列（头像、标签、自定义渲染）
 * - 如何配置表单字段（验证、禁用、options）
 * - 如何配置批量操作
 * - 如何自定义详情头部
 * 
 * 可以作为参考，但不建议直接复制使用
 * 推荐使用 _template/page.js 作为起点
 */
export default function UsersManagementPage() {
	// 1. 定义表格列
	const columns = [
		{
			title: 'Avatar',
			dataIndex: 'image',
			search: false,
			width: 80,
			render: (image, record) => (
				<Avatar src={image} icon={<UserOutlined />} size={40}>
					{record.name?.[0]?.toUpperCase()}
				</Avatar>
			),
		},
		{
			title: 'Name',
			dataIndex: 'name',
			copyable: true,
			ellipsis: true,
			width: 120,
			render: (name, record) => (
				<div>
					<div style={{ fontWeight: 500 }}>{name || 'N/A'}</div>
					<div style={{ fontSize: 12, color: '#999' }}>
						@{record.username || 'N/A'}
					</div>
				</div>
			),
		},
		{
			title: 'Email',
			dataIndex: 'email',
			copyable: true,
			ellipsis: true,
			width: 150,
		},
		{
			title: 'Role',
			dataIndex: 'role',
			valueType: 'select',
			width: 100,
			valueEnum: {
				admin: { text: 'Admin', status: 'Success' },
				user: { text: 'User', status: 'Default' },
			},
			render: (_, record) => (
				<Tag color={record.role === 'admin' ? 'blue' : 'default'}>
					{record.role === 'admin' ? 'Admin' : 'User'}
				</Tag>
			),
		},
		{
			title: 'Credits',
			dataIndex: 'credits',
			search: false,
			width: 100,
			sorter: true,
			render: (credits) => (
				<span style={{ fontWeight: 500, color: credits > 0 ? '#52c41a' : '#999' }}>
					{credits || 0}
				</span>
			),
		},
		{
			title: 'Email Verified',
			dataIndex: 'emailVerified',
			search: false,
			hideInTable: true,
			valueType: 'select',
			valueEnum: {
				true: { text: 'Verified', status: 'Success' },
				false: { text: 'Unverified', status: 'Default' },
			},
			render: (verified) => (
				<Tag color={verified ? 'green' : 'default'}>
					{verified ? 'Verified' : 'Unverified'}
				</Tag>
			),
		},
		{
			title: 'Created At',
			dataIndex: 'createdAt',
			valueType: 'dateTime',
			search: false,
			width: 180,
			sorter: true,
		},
		{
			title: 'Last Login',
			dataIndex: 'lastLoginAt',
			valueType: 'dateTime',
			search: false,
			hideInTable: true,
			sorter: true,
			render: (text) => (text ? text : 'Never'),
		},
		{
			title: 'Total Credits Earned',
			dataIndex: 'totalCreditsEarned',
			search: false,
			hideInTable: true,
			render: (value) => value || 0,
		},
		{
			title: 'Total Credits Used',
			dataIndex: 'totalCreditsUsed',
			search: false,
			hideInTable: true,
			render: (value) => value || 0,
		},
		{
			title: 'Current Package',
			dataIndex: 'currentPackageId',
			search: false,
			hideInTable: true,
			render: (value) => value || 'None',
		},
		{
			title: 'Package Expires At',
			dataIndex: 'packageExpireAt',
			valueType: 'dateTime',
			search: false,
			hideInTable: true,
			render: (value) => (value ? new Date(value).toLocaleString() : 'N/A'),
		},
		{
			title: 'Updated At',
			dataIndex: 'updatedAt',
			valueType: 'dateTime',
			search: false,
			hideInTable: true,
		},
	];

	// 2. 定义表单字段
	const formFields = (
		<>
			<ProFormText
				name='name'
				label='Name'
				placeholder='Enter name'
				rules={[{ required: true, message: 'Please enter name' }]}
			/>

			<ProFormText
				name='email'
				label='Email'
				placeholder='user@example.com'
				rules={[
					{ required: true, message: 'Please enter email' },
					{ type: 'email', message: 'Invalid email format' },
				]}
			/>

			<ProFormText
				name='username'
				label='Username'
				placeholder='username'
				rules={[
					{ required: false },
					{
						pattern: /^[a-zA-Z0-9_]{3,20}$/,
						message: 'Username must be 3-20 characters (letters, numbers, underscores)',
					},
				]}
			/>

			<ProFormSelect
				name='role'
				label='Role'
				valueEnum={{
					user: 'User',
					admin: 'Admin',
				}}
				rules={[{ required: true, message: 'Please select role' }]}
			/>

			<ProFormDigit
				name='credits'
				label='Credits'
				disabled
				tooltip='Credits can only be adjusted through Credits Management'
				fieldProps={{ precision: 0 }}
			/>

			<ProFormSelect
				name='emailVerified'
				label='Email Verified'
				options={[
					{ label: 'Verified', value: true },
					{ label: 'Unverified', value: false },
				]}
				rules={[{ required: true, message: 'Please select verification status' }]}
			/>
		</>
	);

	// 3. 定义 Actions
	const actions = {
		getList,
		update: updateInfo,
		delete: deleteItem,
		batchUpdate,
	};

	// 4. 定义搜索配置（将 ProTable 的搜索参数转换为 getList 参数）
	const searchConfig = {
		transform: (params) => ({
			role: params.role,
			search: params.name || params.email,
		}),
	};

	// 5. 定义批量操作
	const batchActions = [
		{
			key: 'verify',
			label: 'Verify Email',
			action: batchUpdate,
			params: { emailVerified: true },
		},
	];

	// 6. 自定义详情头部
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

	// 7. 返回通用 CRUD 页面
	return (
		<CrudPage
			columns={columns}
			formFields={formFields}
			actions={actions}
			rowKey='_id'
			title='User Management'
			searchConfig={searchConfig}
			batchActions={batchActions}
			renderDetailHeader={renderDetailHeader}
			enableCreate={false}
			enableDetail={true}
			enableEdit={true}
			enableDelete={true}
		/>
	);
}

