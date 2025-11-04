/**
 * Role Management Page
 *
 * Features:
 * - CRUD operations for roles
 * - Assign permissions to roles (tree selector)
 * - Assign menus to roles (tree selector)
 * - Enable/disable roles
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Tag, Button, Modal, Tree, message, Space, Checkbox } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, KeyOutlined, MenuOutlined } from '@ant-design/icons';

// Dynamically import SmartCrudPage
const SmartCrudPage = dynamic(() => import('@/components/admin/smart-crud-page'), {
	ssr: false,
	loading: () => <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>,
});

// Server Actions - Roles
import {
	getRoleListAction as getList,
	createRoleAction as create,
	updateRoleAction as update,
	deleteRoleAction as deleteItem,
	roleBindPermissionsAction,
	roleBindMenusAction,
	getRolePermissionsAction,
	getRoleMenusAction,
} from '@/app/(admin)/actions/admin-roles';

// Server Actions - Permissions & Menus
import { getPermissionTreeForSelectAction } from '@/app/(admin)/actions/admin-permissions';
import { getMenuTreeForSelectAction } from '@/app/(admin)/actions/admin-menus';

export default function RolesManagementPage() {
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	// Permission assignment modal
	const [permissionModalVisible, setPermissionModalVisible] = useState(false);
	const [selectedRole, setSelectedRole] = useState(null);
	const [permissionTree, setPermissionTree] = useState([]);
	const [selectedPermissions, setSelectedPermissions] = useState([]);
	const [permissionLoading, setPermissionLoading] = useState(false);

	// Menu assignment modal
	const [menuModalVisible, setMenuModalVisible] = useState(false);
	const [menuTree, setMenuTree] = useState([]);
	const [selectedMenus, setSelectedMenus] = useState([]);
	const [menuLoading, setMenuLoading] = useState(false);
	const [autoBindMenuPermissions, setAutoBindMenuPermissions] = useState(true);

	// Convert tree data to Ant Design Tree format (递归函数，不用 useCallback)
	const convertToTreeData = (data, keyField) => {
		if (!Array.isArray(data)) return [];

		return data.map((item) => ({
			title: item.label || item.name || item[keyField],
			value: item[keyField],
			key: item[keyField],
			children: item.children && item.children.length > 0 ? convertToTreeData(item.children, keyField) : undefined,
		}));
	};

	// Load permission and menu trees
	useEffect(() => {
		const loadPermissionTree = async () => {
			const result = await getPermissionTreeForSelectAction({ withLabel: true });
			if (result.success) {
				const treeData = convertToTreeData(result.data, 'permission_id');
				setPermissionTree(treeData);
			}
		};

		const loadMenuTree = async () => {
			const result = await getMenuTreeForSelectAction({ withLabel: true });
			if (result.success) {
				const treeData = convertToTreeData(result.data, 'key');
				setMenuTree(treeData);
			}
		};

		loadPermissionTree();
		loadMenuTree();
	}, []);

	// Handle assign permissions
	const handleAssignPermissions = async (record) => {
		if (record.role_id === 'admin') {
			message.warning('Cannot modify admin role permissions');
			return;
		}

		setSelectedRole(record);
		setPermissionLoading(true);
		setPermissionModalVisible(true);

		// Get current permissions
		const result = await getRolePermissionsAction(record.role_id);
		if (result.success) {
			setSelectedPermissions(result.data || []);
		} else {
			message.error(result.error || 'Failed to load permissions');
		}

		setPermissionLoading(false);
	};

	// Handle assign menus
	const handleAssignMenus = async (record) => {
		if (record.role_id === 'admin') {
			message.warning('Cannot modify admin role menus');
			return;
		}

		setSelectedRole(record);
		setMenuLoading(true);
		setMenuModalVisible(true);

		// Get current menus
		const result = await getRoleMenusAction(record.role_id);
		if (result.success) {
			setSelectedMenus(result.data || []);
		} else {
			message.error(result.error || 'Failed to load menus');
		}

		setMenuLoading(false);
	};

	// Save permissions
	const handleSavePermissions = async () => {
		if (!selectedRole) return;

		setPermissionLoading(true);

		const result = await roleBindPermissionsAction(selectedRole.role_id, selectedPermissions, true);

		if (result.success) {
			message.success('Permissions assigned successfully');
			setPermissionModalVisible(false);
			setRefreshTrigger((prev) => prev + 1);
		} else {
			message.error(result.error || 'Failed to assign permissions');
		}

		setPermissionLoading(false);
	};

	// Save menus
	const handleSaveMenus = async () => {
		if (!selectedRole) return;

		setMenuLoading(true);

		const result = await roleBindMenusAction(selectedRole.role_id, selectedMenus, true, autoBindMenuPermissions);

		if (result.success) {
			message.success('Menus assigned successfully');
			setMenuModalVisible(false);
			setRefreshTrigger((prev) => prev + 1);
		} else {
			message.error(result.error || 'Failed to assign menus');
		}

		setMenuLoading(false);
	};

	// Field configuration
	const fieldsConfig = useMemo(
		() => [
			// ID
			{
				key: '_id',
				title: 'ID',
				type: 'text',
				table: false,
				form: false,
				search: false,
			},

			// Role ID
			{
				key: 'role_id',
				title: 'Role ID',
				type: 'text',
				table: {
					width: 150,
					copyable: true,
				},
				form: {
					required: true,
					placeholder: 'e.g., editor, viewer, manager',
					fieldProps: {
						showCount: true,
						maxLength: 50,
					},
					tips: 'Unique identifier for the role (letters, numbers, dashes, underscores)',
				},
				search: {
					placeholder: 'Search by role ID',
				},
			},

			// Role Name
			{
				key: 'role_name',
				title: 'Role Name',
				type: 'text',
				table: {
					width: 150,
					ellipsis: true,
				},
				form: {
					required: true,
					placeholder: 'Enter role name',
					fieldProps: {
						showCount: true,
						maxLength: 100,
					},
				},
				search: {
					placeholder: 'Search by name',
				},
			},

			// Permissions Count
			{
				key: 'permission',
				title: 'Permissions',
				type: 'custom',
				table: {
					width: 120,
					render: (value) => {
						const count = Array.isArray(value) ? value.length : 0;
						return <Tag color='blue'>{count} permissions</Tag>;
					},
				},
				detail: {
					render: (value) => {
						if (!Array.isArray(value) || value.length === 0) {
							return <span style={{ color: '#999' }}>No permissions assigned</span>;
						}
						return (
							<Space wrap>
								{value.map((id, index) => (
									<Tag key={index} color='blue'>
										{id}
									</Tag>
								))}
							</Space>
						);
					},
				},
				form: false,
				search: false,
			},

			// Menus Count
			{
				key: 'menu',
				title: 'Menus',
				type: 'custom',
				table: {
					width: 100,
					render: (value) => {
						const count = Array.isArray(value) ? value.length : 0;
						return <Tag color='cyan'>{count} menus</Tag>;
					},
				},
				detail: {
					render: (value) => {
						if (!Array.isArray(value) || value.length === 0) {
							return <span style={{ color: '#999' }}>No menus assigned</span>;
						}
						return (
							<Space wrap>
								{value.map((id, index) => (
									<Tag key={index} color='cyan'>
										{id}
									</Tag>
								))}
							</Space>
						);
					},
				},
				form: false,
				search: false,
			},

			// Enable
			{
				key: 'enable',
				title: 'Status',
				type: 'switch',
				table: {
					width: 100,
					render: (value) =>
						value ? (
							<Tag icon={<CheckCircleOutlined />} color='success'>
								Enabled
							</Tag>
						) : (
							<Tag icon={<CloseCircleOutlined />} color='error'>
								Disabled
							</Tag>
						),
				},
				form: {
					required: false,
					valuePropName: 'checked',
					initialValue: true,
				},
				search: false,
			},

			// Remark
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
					placeholder: 'Enter remark (optional)',
					fieldProps: {
						rows: 3,
						showCount: true,
						maxLength: 500,
					},
				},
				search: false,
			},
		],
		[]
	);

	// Custom row actions
	const customRowActions = useMemo(
		() => [
			{
				key: 'assign-permissions',
				text: 'Assign Permissions',
				icon: <KeyOutlined />,
				onClick: handleAssignPermissions,
				show: (record) => record.role_id !== 'admin', // 不显示给 admin 角色
			},
			{
				key: 'assign-menus',
				text: 'Assign Menus',
				icon: <MenuOutlined />,
				onClick: handleAssignMenus,
				show: (record) => record.role_id !== 'admin', // 不显示给 admin 角色
			},
		],
		[]
	);

	return (
		<>
			<SmartCrudPage
				title='Role Management'
				description='Manage system roles and their permissions'
				rowKey='role_id'
				fieldsConfig={fieldsConfig}
				actions={{
					getList,
					create,
					update,
					delete: deleteItem,
				}}
				tableOptions={{
					scroll: { x: 1200 },
				}}
				formOptions={{
					modalWidth: 600,
				}}
				customRowActions={customRowActions}
				refreshTrigger={refreshTrigger}
				enableCreate={true}
				enableDetail={true}
				enableEdit={true}
				enableDelete={true}
			/>

			{/* Permission Assignment Modal */}
			<Modal
				title={`Assign Permissions: ${selectedRole?.role_name || ''}`}
				open={permissionModalVisible}
				onOk={handleSavePermissions}
				onCancel={() => setPermissionModalVisible(false)}
				width={600}
				confirmLoading={permissionLoading}
			>
				{permissionTree.length > 0 ? (
					<Tree
						checkable
						treeData={permissionTree}
						checkedKeys={selectedPermissions}
						onCheck={(checkedKeys) => setSelectedPermissions(checkedKeys)}
						style={{ maxHeight: 400, overflowY: 'auto' }}
					/>
				) : (
					<div style={{ textAlign: 'left', padding: '20px 0' }}>Loading permissions...</div>
				)}
			</Modal>

			{/* Menu Assignment Modal */}
			<Modal
				title={`Assign Menus: ${selectedRole?.role_name || ''}`}
				open={menuModalVisible}
				onOk={handleSaveMenus}
				onCancel={() => setMenuModalVisible(false)}
				width={600}
				confirmLoading={menuLoading}
			>
				<Checkbox 
					checked={autoBindMenuPermissions} 
					onChange={(e) => setAutoBindMenuPermissions(e.target.checked)}
					style={{ marginBottom: 12 }}
				>
					Auto bind menu permissions
				</Checkbox>

				{menuTree.length > 0 ? (
					<Tree
						checkable
						treeData={menuTree}
						checkedKeys={selectedMenus}
						onCheck={(checkedKeys) => setSelectedMenus(checkedKeys)}
						style={{ maxHeight: 400, overflowY: 'auto' }}
					/>
				) : (
					<div style={{ textAlign: 'left', padding: '20px 0' }}>Loading menus...</div>
				)}
			</Modal>
		</>
	);
}

