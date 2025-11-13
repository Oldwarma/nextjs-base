/**
 * 用户管理页面
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Avatar, Modal, Tree, Tag, Space, Button, Form, Input, Select, InputNumber, Switch, App } from 'antd';
import { UserOutlined, TeamOutlined, PlusOutlined, KeyOutlined, StopOutlined } from '@ant-design/icons';

// 动态导入 SmartCrudPage，禁用 SSR 避免 Hydration 错误
const SmartCrudPage = dynamic(() => import('@/components/admin/smart-crud-page'), {
	ssr: false,
	loading: () => <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>,
});

// Server Actions - 统一从 crud-action.user.js 导入
import * as userActions from '@/app/(admin)/actions/rbac/crud-action.user';

import { getRoleListForSelectAction } from '@/app/(admin)/actions/rbac/crud-action.role';

const { Option } = Select;

export default function UsersManagementPage() {
	const { message: messageApi } = App.useApp();
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	// Create user modal
	const [createModalVisible, setCreateModalVisible] = useState(false);
	const [createForm] = Form.useForm();
	const [createLoading, setCreateLoading] = useState(false);

	// Reset password modal
	const [passwordModalVisible, setPasswordModalVisible] = useState(false);
	const [passwordForm] = Form.useForm();
	const [passwordLoading, setPasswordLoading] = useState(false);
	const [selectedUserId, setSelectedUserId] = useState(null);

	// 动态选项：角色列表
	const [roleOptions, setRoleOptions] = useState([]);

	// Role assignment modal
	const [roleModalVisible, setRoleModalVisible] = useState(false);
	const [selectedUser, setSelectedUser] = useState(null);
	const [allRoles, setAllRoles] = useState([]);
	const [roleTree, setRoleTree] = useState([]);
	const [selectedRoles, setSelectedRoles] = useState([]);
	const [roleLoading, setRoleLoading] = useState(false);
	const [rolesLoaded, setRolesLoaded] = useState(false);

	// 搜索表单展开状态
	const [searchExpanded, setSearchExpanded] = useState(false);

	// ✅ 加载角色数据的回调函数
	const loadAllRoles = useCallback(async () => {
		try {
			// 使用专门的选择器 Action，统一格式
			const result = await getRoleListForSelectAction({ withLabel: true });

			if (result.success) {
				const roles = result.data || [];
				console.log('[Users] Loaded roles:', roles);
				setAllRoles(roles);

				// Convert to tree data for Tree component (角色绑定模态框)
				const treeData = roles
					.filter((role) => role && role.id) // 过滤无效数据
					.map((role) => ({
						title: String(role.label || role.name || 'Unknown'), // 确保是字符串
						value: String(role.id), // 确保是字符串
						key: String(role.id), // 确保是字符串
						disabled: !role.enable,
					}));

				console.log('[Users] Tree data:', treeData);
				setRoleTree(treeData);

				// 为搜索表单准备选项数据（只包含启用的角色）
				const searchOptions = roles
					.filter((role) => role && role.id && role.enable)
					.map((role) => ({
						label: String(role.label || role.name || 'Unknown'),
						value: String(role.id),
					}));
				setRoleOptions(searchOptions);

				setRolesLoaded(true);
			} else {
				console.error('[Users] Failed to load roles:', result.error);
				messageApi.error(result.error || 'Failed to load roles');
				setRolesLoaded(true);
			}
		} catch (error) {
			console.error('[Users] Failed to load roles:', error);
			messageApi.error('Failed to load roles');
			setRolesLoaded(true);
		}
	}, [messageApi]);

	// ✅ 页面加载时立即加载角色数据（用于角色分配 Modal）
	useEffect(() => {
		if (!rolesLoaded) {
			loadAllRoles();
		}
	}, [rolesLoaded, loadAllRoles]);

	// Handle assign roles
	const handleAssignRoles = async (record) => {
		// Better Auth 应该使用 id 字段，但如果没有则使用 _id
		const userId = record.id || record._id;

		if (!userId) {
			messageApi.error('User ID is missing');
			return;
		}

		setSelectedUser(record);
		setRoleModalVisible(true);
		setRoleLoading(true);

		try {
			// Get current user roles (使用 Better Auth 的 id 字段，或 _id 作为后备)
			const result = await userActions.getUserRolesAction(userId);

			if (result.success) {
				const userRoles = result.data || [];
				console.log('[Users] User roles:', userRoles);

				// 将角色对象数组转换为 ID 字符串数组
				// getUserRolesAction 返回的是角色对象数组，需要提取 id
				const roleIds = userRoles
					.map((role) => {
						// 兼容不同的数据格式
						if (typeof role === 'string') {
							return role; // 已经是字符串 ID
						}
						return String(role.id || role._id || '');
					})
					.filter((id) => id); // 过滤空值

				console.log('[Users] Role IDs:', roleIds);
				setSelectedRoles(roleIds);
			} else {
				console.error('[Users] Failed to get user roles:', result.error);
				messageApi.error(result.error || 'Failed to load user roles');
			}
		} catch (error) {
			console.error('[Users] Failed to load user roles:', error);
			messageApi.error('Failed to load user roles');
		} finally {
			setRoleLoading(false);
		}
	};

	// Save roles
	const handleSaveRoles = async () => {
		if (!selectedUser) return;

		// Better Auth 应该使用 id 字段，但如果没有则使用 _id
		const userId = selectedUser.id || selectedUser._id;

		if (!userId) {
			messageApi.error('User ID is missing');
			return;
		}

		setRoleLoading(true);

		try {
			// 使用 Better Auth 的 id 字段，或 _id 作为后备
			const result = await userActions.bindUserRolesAction(userId, selectedRoles, true);

			if (result.success) {
				messageApi.success('Roles assigned successfully');
				setRoleModalVisible(false);
				setRefreshTrigger((prev) => prev + 1);
			} else {
				messageApi.error(result.error || 'Failed to assign roles');
			}
		} catch (error) {
			console.error('[Users] Failed to save roles:', error);
			messageApi.error('Failed to assign roles');
		} finally {
			setRoleLoading(false);
		}
	};

	// Handle create user
	const handleCreateUser = async (values) => {
		setCreateLoading(true);
		try {
			const result = await userActions.createUserAction(values);
			if (result.success) {
				messageApi.success('User created successfully');
				setCreateModalVisible(false);
				createForm.resetFields();
				setRefreshTrigger((prev) => prev + 1);
			} else {
				messageApi.error(result.error || 'Failed to create user');
			}
		} catch (error) {
			messageApi.error('Failed to create user');
			console.error(error);
		} finally {
			setCreateLoading(false);
		}
	};

	// Handle reset password
	const handleResetPassword = async (values) => {
		setPasswordLoading(true);
		try {
			const result = await userActions.resetUserPasswordAction(selectedUserId, values.password);
			if (result.success) {
				messageApi.success('Password reset successfully');
				setPasswordModalVisible(false);
				passwordForm.resetFields();
				setSelectedUserId(null);
			} else {
				messageApi.error(result.error || 'Failed to reset password');
			}
		} catch (error) {
			messageApi.error('Failed to reset password');
			console.error(error);
		} finally {
			setPasswordLoading(false);
		}
	};

	// Handle ban/unban user
	const handleToggleBanUser = async (record) => {
		const userId = record.id || record._id;
		if (!userId) {
			messageApi.error('User ID is missing');
			return;
		}

		const isBanned = record.banned;

		try {
			let result;
			if (isBanned) {
				// 解封用户
				result = await userActions.unbanUserAction(userId);
			} else {
				// 封禁用户
				result = await userActions.banUserAction(userId, 'Banned by administrator');
			}

			if (result.success) {
				messageApi.success(isBanned ? 'User unbanned successfully' : 'User banned successfully');
				setRefreshTrigger((prev) => prev + 1);
			} else {
				messageApi.error(result.error || `Failed to ${isBanned ? 'unban' : 'ban'} user`);
			}
		} catch (error) {
			console.error(`Failed to ${isBanned ? 'unban' : 'ban'} user:`, error);
			messageApi.error(`Failed to ${isBanned ? 'unban' : 'ban'} user`);
		}
	};

	// ============================================
	// 统一字段配置
	// ============================================
	const fieldsConfig = useMemo(
		() => [
			// Better Auth 主键 (id)
			{
				key: 'id',
				title: 'ID',
				type: 'text',
				table: false,
				form: false,
				search: false,
			},
			// MongoDB _id
			{
				key: '_id',
				title: 'MongoDB ID',
				type: 'text',
				table: false,
				form: false,
				search: false,
			},
			// 头像
			{
				key: 'image',
				title: 'Avatar',
				type: 'image',
				table: {
					width: 80,
					render: (image, record) => (
						<Avatar
							src={image}
							icon={<UserOutlined />}
							size={40}
						>
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
							<div style={{ fontSize: 12, color: '#999' }}>@{record.username || 'N/A'}</div>
						</div>
					),
				},
				form: {
					required: true,
					placeholder: 'Enter name',
					fieldProps: {
						minLength: 2,
						maxLength: 50,
					},
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
					rules: [
						{
							type: 'email',
							message: 'Invalid email format',
						},
					],
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
					rules: [
						{
							pattern: /^[a-zA-Z0-9_]{3,20}$/,
							message: 'Username must be 3-20 characters (letters, numbers, underscores)',
						},
					],
				},
				detail: {
					render: (value) => `@${value || 'N/A'}`,
				},
			},

			// Better Auth 角色 (单一角色: admin/user)
			{
				key: 'role',
				title: 'Auth Role',
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

			// 后台访问权限
			{
				key: 'isBackendAllowed',
				title: 'Backend Access',
				type: 'switch',
				table: {
					width: 140,
				},
				form: {
					required: true,
					fieldProps: {
						checkedChildren: 'Allowed',
						unCheckedChildren: 'Denied',
					},
				},
				search: {
					enabled: true,
					mode: 'exact',
				},
			},

			// RBAC 角色 (多角色数组)
			{
				key: 'roles',
				title: 'RBAC Roles',
				type: 'select',
				options: roleOptions,
				form: {
					fieldProps: {
						mode: 'multiple',
					},
					placeholder: 'Select roles',
				},
				table: {
					width: 100,
					ellipsis: true,
					render: (value, record) => {
						const roles = record.roleList || value || [];
						if (!Array.isArray(roles) || roles.length === 0) {
							return <span style={{ color: '#999' }}>No roles assigned</span>;
						}
						return (
							<Space wrap>
								{roles.map((item, index) => {
									const displayText = item?.name || item;
									const key = item?.id || item;
									return (
										<Tag
											key={key || index}
											color='blue'
										>
											{displayText}
										</Tag>
									);
								})}
							</Space>
						);
					},
				},
				search: {
					enabled: true,
					mode: 'in',
					placeholder: 'Filter by roles',
					lazyLoad: true,
					fieldProps: {
						mode: 'multiple',
						loading: searchExpanded && !rolesLoaded,
					},
				},
				detail: {
					render: (value, record) => {
						const roles = record.roleList || value || [];
						if (!Array.isArray(roles) || roles.length === 0) {
							return <span style={{ color: '#999' }}>No roles assigned</span>;
						}
						return (
							<Space wrap>
								{roles.map((item, index) => {
									const displayText = item?.name || item;
									const key = item?.id || item;
									return (
										<Tag
											key={key || index}
											color='blue'
										>
											{displayText}
										</Tag>
									);
								})}
							</Space>
						);
					},
				},
			},

			// ban state
			{
				key: 'banned',
				title: 'Ban State',
				type: 'switch',
				table: {
					width: 100,
				},
				form: false,
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
						<span
							style={{
								fontWeight: 500,
								color: credits > 0 ? '#52c41a' : '#999',
							}}
						>
							{credits || 0}
						</span>
					),
				},
				form: {
					disabled: true,
					tooltip: 'Credits can only be adjusted through Credits Management',
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
				},
				hideInTable: true,
				form: {
					required: true,
					fieldProps: {
						checkedChildren: 'Verified',
						unCheckedChildren: 'Unverified',
					},
				},
				search: {
					enabled: true,
					mode: 'exact',
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
				hideInTable: true,
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
				hideInTable: true,
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
				hideInTable: true,
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
				hideInTable: true,
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
				hideInTable: true,
				detail: {
					render: (value) => {
						if (!value) return 'N/A';
						try {
							const date = value instanceof Date ? value : new Date(value);
							return date.toLocaleString('zh-CN', {
								year: 'numeric',
								month: '2-digit',
								day: '2-digit',
								hour: '2-digit',
								minute: '2-digit',
								second: '2-digit',
							});
						} catch (e) {
							return String(value);
						}
					},
				},
			},

			// 更新时间
			{
				key: 'updatedAt',
				title: 'Updated At',
				type: 'datetime',
				table: false,
				form: false,
				hideInTable: true,
			},
		],
		[roleOptions, rolesLoaded, searchExpanded]
	);

	// ============================================
	// 批量操作
	// ============================================
	const batchActions = [
		{
			key: 'verifyEmail',
			label: 'Verify Email',
			action: userActions.batchUpdateUsersAction,
			params: { emailVerified: true },
		},
	];

	// ============================================
	// 自定义详情头部
	// ============================================
	const renderDetailHeader = (record) => (
		<div style={{ textAlign: 'center', marginBottom: 24 }}>
			<Avatar
				src={record.image}
				size={80}
				icon={<UserOutlined />}
			>
				{record.name?.[0]?.toUpperCase()}
			</Avatar>
			<div style={{ marginTop: 12, fontSize: 18, fontWeight: 500 }}>{record.name || 'N/A'}</div>
			<div style={{ color: '#999' }}>@{record.username || 'N/A'}</div>
		</div>
	);

	// ============================================
	// 自定义行操作
	// ============================================
	const customRowActions = [
		{
			key: 'assign-roles',
			text: 'Assign Roles',
			icon: <TeamOutlined />,
			inMore: true,
			onClick: handleAssignRoles,
		},
		{
			key: 'reset-password',
			text: 'Reset Password',
			icon: <KeyOutlined />,
			inMore: true,
			onClick: (record) => {
				const userId = record.id || record._id;
				if (!userId) {
					messageApi.error('User ID is missing');
					return;
				}
				setSelectedUserId(userId);
				setPasswordModalVisible(true);
			},
		},
		{
			key: 'toggle-ban',
			text: (record) => (record.banned ? 'Unban User' : 'Ban User'),
			icon: <StopOutlined />,
			danger: (record) => !record.banned,
			showText: true,
			inMore: true,
			// 使用新的 confirm 配置，支持动态内容
			confirm: (record) => ({
				title: record.banned ? 'Unban User' : 'Ban User',
				description: record.banned
					? `Are you sure you want to unban "${record.name || record.email}"? They will be able to sign in again.`
					: `Are you sure you want to ban "${record.name || record.email}"? This will revoke all active sessions and prevent sign-in.`,
				okText: record.banned ? 'Unban' : 'Ban',
				okType: record.banned ? 'primary' : 'danger',
				cancelText: 'Cancel',
				placement: 'topRight',
			}),
			onClick: handleToggleBanUser,
		},
	];

	// ============================================
	// 返回 SmartCrudPage
	// ============================================
	return (
		<>
			<SmartCrudPage
				fieldsConfig={fieldsConfig}
				actions={{
					getList: userActions.getUserListAction,
					getDetail: userActions.getUserDetailAction,
					update: userActions.updateUserAction,
					delete: userActions.deleteUserAction,
				}}
				title='User Management'
				rowKey='id'
				// 批量操作
				batchActions={batchActions}
				// 自定义详情头部
				renderDetailHeader={renderDetailHeader}
				// 自定义行操作
				customRowActions={customRowActions}
				// ✅ 监听搜索表单展开状态
				onSearchExpandChange={setSearchExpanded}
				// 功能开关
				enableCreate={false} // ✅ 关闭默认创建，使用自定义模态框
				enableDetail={true}
				enableEdit={true}
				enableDelete={true}
				// 自定义工具栏按钮
				customToolbarButtons={[
					<Button
						key='create'
						type='primary'
						icon={<PlusOutlined />}
						onClick={() => setCreateModalVisible(true)}
					>
						Create User
					</Button>,
				]}
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
				// 刷新触发器
				refreshTrigger={refreshTrigger}
			/>

			{/* Create User Modal */}
			<Modal
				title='Create User'
				open={createModalVisible}
				onOk={() => createForm.submit()}
				onCancel={() => {
					setCreateModalVisible(false);
					createForm.resetFields();
				}}
				confirmLoading={createLoading}
				width={600}
			>
				<Form
					form={createForm}
					layout='vertical'
					onFinish={handleCreateUser}
				>
					<Form.Item
						name='email'
						label='Email'
						rules={[
							{ required: true, message: 'Please enter email' },
							{ type: 'email', message: 'Invalid email format' },
						]}
					>
						<Input placeholder='user@example.com' />
					</Form.Item>

					<Form.Item
						name='password'
						label='Password'
						rules={[
							{ required: true, message: 'Please enter password' },
							{ min: 8, message: 'Password must be at least 8 characters' },
						]}
					>
						<Input.Password placeholder='Enter password' />
					</Form.Item>

					<Form.Item
						name='name'
						label='Name'
						rules={[{ required: true, message: 'Please enter name' }]}
					>
						<Input placeholder='Full name' />
					</Form.Item>

					<Form.Item
						name='username'
						label='Username'
					>
						<Input placeholder='username' />
					</Form.Item>

					<Form.Item
						name='role'
						label='System Role'
						initialValue='user'
						rules={[{ required: true, message: 'Please select role' }]}
					>
						<Select>
							<Option value='user'>User</Option>
							<Option value='admin'>Admin</Option>
						</Select>
					</Form.Item>

					<Form.Item
						name='isBackendAllowed'
						label='Backend Access'
						valuePropName='checked'
						initialValue={false}
					>
						<Switch
							checkedChildren='Allowed'
							unCheckedChildren='Denied'
						/>
					</Form.Item>

					<Form.Item
						name='credits'
						label='Initial Credits'
						initialValue={0}
					>
						<InputNumber
							min={0}
							style={{ width: '100%' }}
						/>
					</Form.Item>
				</Form>
			</Modal>

			{/* Reset Password Modal */}
			<Modal
				title='Reset Password'
				open={passwordModalVisible}
				onOk={() => passwordForm.submit()}
				onCancel={() => {
					setPasswordModalVisible(false);
					passwordForm.resetFields();
					setSelectedUserId(null);
				}}
				confirmLoading={passwordLoading}
			>
				<Form
					form={passwordForm}
					layout='vertical'
					onFinish={handleResetPassword}
				>
					<Form.Item
						name='password'
						label='New Password'
						rules={[
							{ required: true, message: 'Please enter new password' },
							{ min: 8, message: 'Password must be at least 8 characters' },
						]}
					>
						<Input.Password placeholder='Enter new password' />
					</Form.Item>
				</Form>
			</Modal>

			{/* Role Assignment Modal */}
			<Modal
				title={`Assign Roles: ${selectedUser?.name || 'User'}`}
				open={roleModalVisible}
				onOk={handleSaveRoles}
				onCancel={() => setRoleModalVisible(false)}
				width={600}
				confirmLoading={roleLoading}
				okButtonProps={{ disabled: !rolesLoaded || roleLoading }}
			>
				{!rolesLoaded || roleLoading ? (
					<div style={{ textAlign: 'left' }}>{!rolesLoaded ? 'Loading available roles...' : 'Loading user roles...'}</div>
				) : roleTree.length > 0 ? (
					<Tree
						checkable
						treeData={roleTree}
						checkedKeys={selectedRoles}
						onCheck={(checkedKeys) => setSelectedRoles(checkedKeys)}
						style={{ maxHeight: 400, overflowY: 'auto' }}
					/>
				) : (
					<div style={{ textAlign: 'left' }}>No roles available</div>
				)}
			</Modal>
		</>
	);
}
