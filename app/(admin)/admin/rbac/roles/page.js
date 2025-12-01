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
import { Tag, Button, Modal, Tree, App, Space, Switch, Tooltip } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, KeyOutlined, MenuOutlined, QuestionCircleOutlined } from '@ant-design/icons';

// Dynamically import SmartCrudPage
const SmartCrudPage = dynamic(() => import('@/components/admin/smart-crud-page'), {
	ssr: false,
	loading: () => <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>,
});

// Server Actions
import * as roleActions from '@/app/(admin)/actions/rbac/crud-action.role';
import { getPermissionTreeForSelectAction } from '@/app/(admin)/actions/rbac/crud-action.permission';
import { getMenuTreeForSelectAction } from '@/app/(admin)/actions/rbac/crud-action.menu';

export default function RolesManagementPage() {
	const { message } = App.useApp();
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
	const [inheritMenuPermissions, setInheritMenuPermissions] = useState(false);

	// Load permission and menu trees
	useEffect(() => {
		const loadPermissionTree = async () => {
			const result = await getPermissionTreeForSelectAction();
			if (result.success) {
				console.log('[Roles] Raw permission data:', result.data);
				// getPermissionTreeForSelectAction 已经返回正确格式，直接使用
				setPermissionTree(result.data || []);
			}
		};

		const loadMenuTree = async () => {
			// 不包含 "Root Menu" 选项，因为这里是分配菜单，不是选择父级
			const result = await getMenuTreeForSelectAction({ includeRootOption: false });
			if (result.success) {
				console.log('[Roles] Raw menu data:', result.data);
				// getMenuTreeForSelectAction 已经返回正确格式，直接使用
				setMenuTree(result.data || []);
			}
		};

		loadPermissionTree();
		loadMenuTree();
	}, []);

	// Handle assign permissions
	const handleAssignPermissions = useCallback(
		async (record) => {
			if (record.id === 'admin') {
				message.warning('Cannot modify admin role permissions');
				return;
			}

			setSelectedRole(record);
			setPermissionLoading(true);
			setPermissionModalVisible(true);

			// Get current permissions
			const result = await roleActions.getRoleDetailAction(record.id);
			if (result.success) {
				const currentPerms = result.data?.permission || [];
				console.log('[Roles] Current permissions:', currentPerms);
				// 确保权限ID是字符串数组
				const permIds = currentPerms.map((p) => String(typeof p === 'object' ? p.id : p));
				console.log('[Roles] Converted permission IDs:', permIds);
				setSelectedPermissions(permIds);
			} else {
				message.error(result.error || 'Failed to load permissions');
			}

			setPermissionLoading(false);
		},
		[message]
	);

	// Handle assign menus
	const handleAssignMenus = useCallback(
		async (record) => {
			if (record.id === 'admin') {
				message.warning('Cannot modify admin role menus');
				return;
			}

			setSelectedRole(record);
			setMenuLoading(true);
			setMenuModalVisible(true);

			// Get current menus and inheritMenuPermissions setting
			const result = await roleActions.getRoleDetailAction(record.id);
			if (result.success) {
				setSelectedMenus(result.data?.menu || []);
				setInheritMenuPermissions(result.data?.inheritMenuPermissions || false);
			} else {
				message.error(result.error || 'Failed to load menus');
			}

			setMenuLoading(false);
		},
		[message]
	);

	// Save permissions
	const handleSavePermissions = async () => {
		if (!selectedRole) return;

		setPermissionLoading(true);

		const result = await roleActions.assignPermissionsToRoleAction({
			roleId: selectedRole.id,
			permissionIds: selectedPermissions,
		});

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

		const result = await roleActions.assignMenusToRoleAction({
			roleId: selectedRole.id,
			menuIds: selectedMenus,
			inheritPermissions: inheritMenuPermissions,
		});

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
			// ID (UUID - 自动生成，不显示)
			{
				key: 'id',
				title: 'ID',
				type: 'text',
				table: false, // 不在表格中显示
				form: false, // 自动生成，不允许编辑
				search: false,
			},

			// Name
			{
				key: 'name',
				title: 'Name',
				type: 'text',
				table: {
					width: 150,
					ellipsis: true,
				},
				form: {
					required: true,
					placeholder: 'Enter name',
					fieldProps: {
						showCount: true,
						maxLength: 100,
					},
				},
				search: {
					mode: 'like',
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
					render: (value, record) => {
						// 优先使用连表数据 permissionList，fallback 到原始字段 permission
						const permissions = record.permissionList || value || [];

						if (!Array.isArray(permissions) || permissions.length === 0) {
							return <span style={{ color: '#999' }}>No permissions assigned</span>;
						}

						return (
							<Space wrap>
								{permissions.map((item, index) => {
									// 如果是对象，取 name；否则显示原值（UUID）
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
					render: (value, record) => {
						// 优先使用连表数据 menuList，fallback 到原始字段 menu
						const menus = record.menuList || value || [];

						if (!Array.isArray(menus) || menus.length === 0) {
							return <span style={{ color: '#999' }}>No menus assigned</span>;
						}

						return (
							<Space wrap>
								{menus.map((item, index) => {
									// 如果是对象，取 name；否则显示原值（UUID）
									const displayText = item?.name || item;
									const key = item?.id || item;
									return (
										<Tag
											key={key || index}
											color='cyan'
										>
											{displayText}
										</Tag>
									);
								})}
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
							<Tag
								icon={<CheckCircleOutlined />}
								color='success'
							>
								Enabled
							</Tag>
						) : (
							<Tag
								icon={<CloseCircleOutlined />}
								color='error'
							>
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
				inMore: true, // 放入更多菜单
				onClick: handleAssignPermissions,
				show: (record) => record.id !== 'admin', // 不显示给 admin 角色
			},
			{
				key: 'assign-menus',
				text: 'Assign Menus',
				icon: <MenuOutlined />,
				inMore: true, // 放入更多菜单
				onClick: handleAssignMenus,
				show: (record) => record.id !== 'admin', // 不显示给 admin 角色
			},
		],
		[handleAssignPermissions, handleAssignMenus]
	);

	return (
		<>
			<SmartCrudPage
				title='Role Management'
				description='Manage system roles and their permissions'
				fieldsConfig={fieldsConfig}
				actions={{
					getList: roleActions.getRoleListAction,
					// getDetail: roleActions.getRoleDetailAction, // 直接使用table行内数据渲染
					create: roleActions.createRoleAction,
					update: roleActions.updateRoleAction,
					delete: roleActions.deleteRoleAction,
				}}
				tableProps={{
					scroll: { x: 1200 },
				}}
				formProps={{
					width: 600,
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
				title={`Assign Permissions: ${selectedRole?.name || ''}`}
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
				title={`Assign Menus: ${selectedRole?.name || ''}`}
				open={menuModalVisible}
				onOk={handleSaveMenus}
				onCancel={() => setMenuModalVisible(false)}
				width={600}
				confirmLoading={menuLoading}
			>
				{/* 继承权限开关 */}
				<div style={{ 
					marginBottom: 16, 
					padding: '12px 16px', 
					background: inheritMenuPermissions ? '#e6f7ff' : '#f5f5f5', 
					borderRadius: 8,
					border: inheritMenuPermissions ? '1px solid #91d5ff' : '1px solid #d9d9d9',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					transition: 'all 0.3s'
				}}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<Switch
							checked={inheritMenuPermissions}
							onChange={setInheritMenuPermissions}
							size="small"
						/>
						<span style={{ fontWeight: 500, color: '#333' }}>
							Inherit Menu Permissions
						</span>
						<Tooltip 
							title="When enabled, users with this role will also inherit the permissions assigned to these menus. When disabled, menus only control page access without granting additional permissions."
							placement="right"
						>
							<QuestionCircleOutlined style={{ color: '#999', cursor: 'help' }} />
						</Tooltip>
					</div>
					{inheritMenuPermissions && (
						<Tag color="blue" style={{ margin: 0 }}>Active</Tag>
					)}
				</div>

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
