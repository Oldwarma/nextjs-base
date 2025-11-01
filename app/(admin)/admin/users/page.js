'use client';

import { useState, useRef } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormSelect, ProFormDigit, DrawerForm, ProDescriptions } from '@ant-design/pro-components';
import { Button, message, Modal, Tag, Space, Avatar, Dropdown } from 'antd';
import {
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	EyeOutlined,
	ReloadOutlined,
	UserOutlined,
	MoreOutlined,
} from '@ant-design/icons';
import {
	getUserListAction,
	updateUserInfoAction,
	deleteUserAction,
	getUserDetailAction,
	batchUpdateUsersAction,
} from '@/app/(admin)/actions';

export default function UsersManagementPage() {
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
	const [currentRow, setCurrentRow] = useState(null);
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);
	const actionRef = useRef();

	// 表格列定义
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
					<div style={{ fontSize: 12, color: '#999' }}>@{record.username || 'N/A'}</div>
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
			hideInTable: true, // 只在详情中显示
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
			hideInTable: true, // 只在详情中显示
			sorter: true,
			render: (text) => text ? text : 'Never',
		},
		{
			title: 'Total Credits Earned',
			dataIndex: 'totalCreditsEarned',
			search: false,
			hideInTable: true, // 只在详情中显示
			render: (value) => value || 0,
		},
		{
			title: 'Total Credits Used',
			dataIndex: 'totalCreditsUsed',
			search: false,
			hideInTable: true, // 只在详情中显示
			render: (value) => value || 0,
		},
		{
			title: 'Current Package',
			dataIndex: 'currentPackageId',
			search: false,
			hideInTable: true, // 只在详情中显示
			render: (value) => value || 'None',
		},
		{
			title: 'Package Expires At',
			dataIndex: 'packageExpireAt',
			valueType: 'dateTime',
			search: false,
			hideInTable: true, // 只在详情中显示
			render: (value) => (value ? new Date(value).toLocaleString() : 'N/A'),
		},
		{
			title: 'Updated At',
			dataIndex: 'updatedAt',
			valueType: 'dateTime',
			search: false,
			hideInTable: true, // 只在详情中显示
		},
		{
			title: 'Actions',
			valueType: 'option',
			width: 80,
			fixed: 'right',
			render: (_, record) => {
				const items = [
					{
						key: 'view',
						label: 'View Details',
						icon: <EyeOutlined />,
						onClick: () => handleViewDetail(record),
					},
					{
						key: 'edit',
						label: 'Edit',
						icon: <EditOutlined />,
						onClick: () => handleEdit(record),
					},
					{
						type: 'divider',
					},
					{
						key: 'delete',
						label: 'Delete',
						icon: <DeleteOutlined />,
						danger: true,
						onClick: () => {
							Modal.confirm({
								title: 'Delete User',
								content: 'Are you sure you want to delete this user? This action cannot be undone.',
								okText: 'Delete',
								okType: 'danger',
								cancelText: 'Cancel',
								onOk: () => handleDelete(record.id),
							});
						},
					},
				];

				return (
					<Dropdown
						menu={{ items }}
						trigger={['click']}
					>
						<Button
							type='text'
							icon={<MoreOutlined />}
							onClick={(e) => e.stopPropagation()}
						/>
					</Dropdown>
				);
			},
		},
	];

	// 获取数据
	const request = async (params, sort) => {
		try {
			const result = await getUserListAction({
				pageIndex: params.current,
				pageSize: params.pageSize,
				role: params.role,
				search: params.name || params.email,
			});

			if (!result.success) {
				message.error(result.error);
				return { data: [], success: false, total: 0 };
			}

			return {
				data: result.data || [],
				success: true,
				total: result.total || 0,
			};
		} catch (error) {
			message.error('Failed to fetch user list');
			return { data: [], success: false, total: 0 };
		}
	};

	// 查看详情
	const handleViewDetail = (record) => {
		// 直接使用 record 数据，不需要重新请求
		setCurrentRow(record);
		setDetailDrawerVisible(true);
	};

	// 编辑
	const handleEdit = (record) => {
		setCurrentRow(record);
		setEditModalVisible(true);
	};

	// 删除
	const handleDelete = async (userId) => {
		try {
			const result = await deleteUserAction(userId);

			if (result.success) {
				message.success('User deleted successfully');
				actionRef.current?.reload();
			} else {
				message.error(result.error);
			}
		} catch (error) {
			message.error('Failed to delete user');
		}
	};

	// 保存
	const handleSave = async (values) => {
		try {
			const result = await updateUserInfoAction(currentRow.id, values);

			if (result.success) {
				message.success('User updated successfully');
				setEditModalVisible(false);
				setCurrentRow(null);
				actionRef.current?.reload();
				return true;
			} else {
				message.error(result.error);
				return false;
			}
		} catch (error) {
			message.error('Failed to update user');
			return false;
		}
	};

	// 批量操作
	const handleBatchUpdate = async (updates) => {
		if (selectedRowKeys.length === 0) {
			message.warning('Please select users first');
			return;
		}

		try {
			const result = await batchUpdateUsersAction(selectedRowKeys, updates);

			if (result.success) {
				message.success(result.message);
				setSelectedRowKeys([]);
				actionRef.current?.reload();
			} else {
				message.error(result.error);
			}
		} catch (error) {
			message.error('Failed to update users');
		}
	};

	return (
		<>
			<ProTable
				columns={columns}
				actionRef={actionRef}
				request={request}
				rowKey='id'
				pagination={{
					pageSize: 20,
					showSizeChanger: true,
					showTotal: (total) => `Total ${total} users`,
				}}
				search={{
					labelWidth: 'auto',
					defaultCollapsed: true,
				}}
				dateFormatter='string'
				headerTitle='User Management'
				scroll={{ x: 1400 }}
				rowSelection={{
					selectedRowKeys,
					onChange: (keys) => setSelectedRowKeys(keys),
				}}
				tableAlertRender={({ selectedRowKeys }) => (
					<Space>
						<span>Selected {selectedRowKeys.length} users</span>
					</Space>
				)}
				tableAlertOptionRender={({ selectedRowKeys }) => (
					<Space>
						<Button
							size='small'
							onClick={() =>
								handleBatchUpdate({ emailVerified: true })
							}
						>
							Verify Email
						</Button>
						<Button
							size='small'
							onClick={() => setSelectedRowKeys([])
							}
						>
							Clear
						</Button>
					</Space>
				)}
				toolBarRender={() => [
					<Button
						key='reload'
						icon={<ReloadOutlined />}
						onClick={() => actionRef.current?.reload()}
					>
						Refresh
					</Button>,
				]}
			/>

			{/* 编辑表单 */}
			<ModalForm
				title='Edit User'
				open={editModalVisible}
				onOpenChange={setEditModalVisible}
				initialValues={currentRow}
				onFinish={handleSave}
				width={600}
			>
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
					valueEnum={{
						true: 'Verified',
						false: 'Unverified',
					}}
					rules={[{ required: true, message: 'Please select verification status' }]}
					transform={(value) => ({ emailVerified: value === 'true' })}
				/>
			</ModalForm>

			{/* 详情抽屉 */}
			<DrawerForm
				title='User Details'
				open={detailDrawerVisible}
				onOpenChange={setDetailDrawerVisible}
				submitter={false}
				width={700}
			>
				{currentRow && (
					<>
						<div style={{ textAlign: 'center', marginBottom: 24 }}>
							<Avatar src={currentRow.image} size={80} icon={<UserOutlined />}>
								{currentRow.name?.[0]?.toUpperCase()}
							</Avatar>
							<div style={{ marginTop: 12, fontSize: 18, fontWeight: 500 }}>
								{currentRow.name || 'N/A'}
							</div>
							<div style={{ color: '#999' }}>@{currentRow.username || 'N/A'}</div>
						</div>

						<ProDescriptions
							column={1}
							bordered
							dataSource={currentRow}
							columns={columns.filter(
								(col) =>
									col.dataIndex &&
									col.dataIndex !== 'image' &&
									col.valueType !== 'option'
							)}
						/>
					</>
				)}
			</DrawerForm>
		</>
	);
}
