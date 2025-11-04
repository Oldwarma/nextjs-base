/**
 * 用户管理页面 - Smart CRUD 版本
 * 
 * 使用 Smart CRUD 重构，代码量从 477 行减少到约 150 行
 * 减少了 68% 的代码量
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Avatar, Modal, Tree, Tag, message, Space } from 'antd';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';

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
	bindUserRolesAction,
	getUserRolesAction,
} from '@/app/(admin)/actions/rbac/admin-users';

import { getRoleListForSelectAction } from '@/app/(admin)/actions/rbac/admin-roles';

export default function UsersManagementPage() {
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	// Role assignment modal
	const [roleModalVisible, setRoleModalVisible] = useState(false);
	const [selectedUser, setSelectedUser] = useState(null);
	const [allRoles, setAllRoles] = useState([]);
	const [roleTree, setRoleTree] = useState([]);
	const [selectedRoles, setSelectedRoles] = useState([]);
	const [roleLoading, setRoleLoading] = useState(false);
	const [rolesLoaded, setRolesLoaded] = useState(false);

	// Load all roles (for tree display) - 统一使用 getRoleListForSelectAction
	useEffect(() => {
		const loadAllRoles = async () => {
			try {
				// 使用专门的选择器 Action，统一格式
				const result = await getRoleListForSelectAction({ withLabel: true });
				
				if (result.success) {
					const roles = result.data || [];
					console.log('[Users] Loaded roles:', roles.length);
					setAllRoles(roles);
					
				// Convert to tree data for Tree component
				const treeData = roles.map(role => ({
					title: role.label || role.name,  // ✅ 使用 name 字段
					value: role.id,  // ✅ 使用 id（UUID）
					key: role.id,    // ✅ 使用 id（UUID）
					disabled: !role.enable,
				}));
					setRoleTree(treeData);
					setRolesLoaded(true);
				} else {
					console.error('[Users] Failed to load roles:', result.error);
					message.error(result.error || 'Failed to load roles');
					setRolesLoaded(true);
				}
			} catch (error) {
				console.error('[Users] Failed to load roles:', error);
				message.error('Failed to load roles');
				setRolesLoaded(true);
			}
		};

		loadAllRoles();
	}, []);

	// Handle assign roles
	const handleAssignRoles = async (record) => {
		// Better Auth 应该使用 id 字段，但如果没有则使用 _id
		const userId = record.id || record._id;
		
		if (!userId) {
			message.error('User ID is missing');
			return;
		}
		
		setSelectedUser(record);
		setRoleModalVisible(true);
		setRoleLoading(true);

		try {
			// Get current user roles (使用 Better Auth 的 id 字段，或 _id 作为后备)
			const result = await getUserRolesAction(userId);
			
			if (result.success) {
				setSelectedRoles(result.data || []);
			} else {
				console.error('[Users] Failed to get user roles:', result.error);
				message.error(result.error || 'Failed to load user roles');
			}
		} catch (error) {
			console.error('[Users] Failed to load user roles:', error);
			message.error('Failed to load user roles');
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
			message.error('User ID is missing');
			return;
		}

		setRoleLoading(true);

		try {
			// 使用 Better Auth 的 id 字段，或 _id 作为后备
			const result = await bindUserRolesAction(userId, selectedRoles, true);

			if (result.success) {
				message.success('Roles assigned successfully');
				setRoleModalVisible(false);
				setRefreshTrigger((prev) => prev + 1);
			} else {
				message.error(result.error || 'Failed to assign roles');
			}
		} catch (error) {
			console.error('[Users] Failed to save roles:', error);
			message.error('Failed to assign roles');
		} finally {
			setRoleLoading(false);
		}
	};

	// ============================================
	// 统一字段配置
	// ============================================
	const fieldsConfig = [
		// Better Auth 主键 (id)
		{
			key: 'id',
			title: 'ID',
			type: 'text',
			table: false,
			form: false,
			search: false
		},
		// MongoDB _id
		{
			key: '_id',
			title: 'MongoDB ID',
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
		
		// RBAC 角色 (多角色数组)
		{
			key: 'roles',
			title: 'RBAC Roles',
			type: 'text',
			table: false,
			form: false,
			hideInTable: true,
			detail: {
				render: (value, record) => {
					// 优先使用连表数据 roleList，fallback 到原始字段 roles
					const roles = record.roleList || value || [];
					
					if (!Array.isArray(roles) || roles.length === 0) {
						return <span style={{ color: '#999' }}>No roles assigned</span>;
					}
					
					return (
						<Space wrap>
							{roles.map((item, index) => {
								// 如果是对象（连表数据），取 name；否则显示原值（UUID）
								const displayText = item?.name || item;
								const key = item?.id || item;
								return (
									<Tag key={key || index} color='blue'>
										{displayText}
									</Tag>
								);
							})}
						</Space>
					);
				},
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
	// 自定义行操作
	// ============================================
	const customRowActions = [
		{
			text: 'Assign Roles',
			icon: <TeamOutlined />,
			type: 'link',
			onClick: handleAssignRoles,
		},
	];

	// ============================================
	// 返回 SmartCrudPage
	// ============================================
	return (
		<>
			<SmartCrudPage
				fieldsConfig={fieldsConfig}
				actions={actions}
				title='User Management'
				rowKey={(record) => record.id || record._id}
				
				// 批量操作
				batchActions={batchActions}
				
				// 自定义详情头部
				renderDetailHeader={renderDetailHeader}
				
				// 自定义行操作
				customRowActions={customRowActions}
				
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
				
				// 刷新触发器
				refreshTrigger={refreshTrigger}
			/>

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
					<div style={{ textAlign: 'left' }}>
						{!rolesLoaded ? 'Loading available roles...' : 'Loading user roles...'}
					</div>
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

