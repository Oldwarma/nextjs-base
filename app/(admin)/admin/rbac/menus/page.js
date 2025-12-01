/**
 * 菜单管理页面
 *
 * 功能：
 * - 树形表格展示菜单
 * - 支持新增、编辑、删除菜单
 * - 父级菜单树形选择
 * - 图标选择器
 * - 排序功能
 * - 分配权限给菜单（菜单继承权限）
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Tag, Modal, Tree, App, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, EyeInvisibleOutlined, KeyOutlined } from '@ant-design/icons';
import SmartCrudPage from '@/components/admin/smart-crud-page';

// 导入图标渲染函数
import { renderIcon } from '@/components/admin/icon-picker';

// Server Actions
import * as menuActions from '@/app/(admin)/actions/rbac/crud-action.menu';
import { getPermissionTreeForSelectAction } from '@/app/(admin)/actions/rbac/crud-action.permission';

export default function MenusManagementPage() {
	const { message } = App.useApp();
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	// Permission assignment modal
	const [permissionModalVisible, setPermissionModalVisible] = useState(false);
	const [selectedMenu, setSelectedMenu] = useState(null);
	const [permissionTree, setPermissionTree] = useState([]);
	const [selectedPermissions, setSelectedPermissions] = useState([]);
	const [permissionLoading, setPermissionLoading] = useState(false);

	// Load permission tree
	useEffect(() => {
		const loadPermissionTree = async () => {
			const result = await getPermissionTreeForSelectAction();
			if (result.success) {
				setPermissionTree(result.data || []);
			}
		};
		loadPermissionTree();
	}, []);

	// Handle assign permissions to menu
	const handleAssignPermissions = useCallback(
		async (record) => {
			setSelectedMenu(record);
			setPermissionLoading(true);
			setPermissionModalVisible(true);

			// Get current permissions
			const result = await menuActions.getMenuDetailAction(record.id);
			if (result.success) {
				const currentPerms = result.data?.permission || [];
				const permIds = currentPerms.map((p) => String(typeof p === 'object' ? p.id || p._id : p));
				setSelectedPermissions(permIds);
			} else {
				message.error(result.error || 'Failed to load permissions');
			}

			setPermissionLoading(false);
		},
		[message]
	);

	// Save permissions
	const handleSavePermissions = async () => {
		if (!selectedMenu) return;

		setPermissionLoading(true);

		const result = await menuActions.assignPermissionsToMenuAction({
			menuId: selectedMenu.id,
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

	// fieldsConfig 直接在 page 中定义（客户端安全）
	const fieldsConfig = useMemo(
		() => [
			// ID (UUID - 自动生成)
			{
				key: 'id',
				title: 'ID',
				type: 'text',
				table: false,
				form: false, // 自动生成，不允许编辑
				search: false,
			},

			// Name
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

			// 图标
			{
				key: 'icon',
				title: 'Icon',
				type: 'icon',
				table: {
					width: 80,
					align: 'center',
					render: (icon) => {
						if (!icon) return '-';
						const IconComponent = renderIcon(icon, { style: { fontSize: 18 } });
						return IconComponent || <span>{icon}</span>;
					},
				},
				form: {
					placeholder: 'Select an icon',
					tips: 'Icon is only for top-level menus. Sub-menu items do not display icons.',
					// 依赖 parent_id 字段，当 parent_id 有值时禁用图标选择
					dependencies: ['parent_id'],
					fieldProps: (form) => {
						const parent_id = form?.getFieldValue('parent_id');
						return {
							disabled: !!parent_id, // 有父级菜单时禁用图标选择
						};
					},
				},
				search: false,
			},

			// URL
			{
				key: 'url',
				title: 'URL',
				type: 'text',
				table: {
					width: 200,
					ellipsis: true,
					copyable: true,
				},
				form: {
					placeholder: 'e.g., /admin/users or https://example.com',
					fieldProps: {
						prefix: '🔗',
					},
					tips: 'Internal URLs start with "/" (e.g., /admin/users). External URLs start with "http"',
				},
				search: false,
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
						return count > 0 ? (
							<Tag color='blue'>{count} permissions</Tag>
						) : (
							<span style={{ color: '#999' }}>-</span>
						);
					},
				},
				detail: {
					render: (value) => {
						if (!Array.isArray(value) || value.length === 0) {
							return <span style={{ color: '#999' }}>No permissions assigned</span>;
						}
						return (
							<Space wrap>
								{value.map((item, index) => {
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
				form: false,
				search: false,
			},

			// 排序值
			{
				key: 'sort',
				title: 'Sort Order',
				type: 'number',
				table: {
					width: 100,
					align: 'center',
				},
				form: {
					required: true,
					placeholder: '0',
					fieldProps: {
						min: 0,
						max: 9999,
						step: 1,
						precision: 0,
					},
					tips: 'Lower numbers appear first (ascending order)',
				},
				search: false,
			},

			// 父级菜单
			{
				key: 'parent_id',
				title: 'Parent Menu',
				type: 'tree-select',
				table: false,
				form: {
					required: false,
					placeholder: 'Select parent menu (leave empty for root)',
					action: 'getMenuTreeForSelectAction',
					fieldProps: {
						allowClear: true,
						showSearch: true,
						treeNodeFilterProp: 'title',
						treeDefaultExpandAll: false,
					},
					tips: 'Sub-menus do not display icons. Selecting a parent will clear the icon field.',
				},
				search: false,
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

			// 是否启用
			{
				key: 'enable',
				title: 'Enabled',
				type: 'switch',
				table: {
					width: 100,
					align: 'center',
					render: (enable) => {
						return enable ? (
							<Tag icon={<CheckCircleOutlined />} color='success'>
								Enabled
							</Tag>
						) : (
							<Tag icon={<CloseCircleOutlined />} color='default'>
								Disabled
							</Tag>
						);
					},
				},
				form: {
					fieldProps: {
						checkedChildren: 'Enabled',
						unCheckedChildren: 'Disabled',
					},
					tips: 'Disabled menus will not appear in the navigation',
				},
				search: {
					fieldProps: {
						placeholder: 'Filter by status',
					},
				},
			},

			// 是否隐藏
			{
				key: 'hidden',
				title: 'Hidden',
				type: 'switch',
				table: {
					width: 100,
					align: 'center',
					render: (hidden) => {
						return hidden ? (
							<Tag icon={<EyeInvisibleOutlined />} color='warning'>
								Hidden
							</Tag>
						) : (
							<Tag icon={<EyeOutlined />} color='default'>
								Visible
							</Tag>
						);
					},
				},
				form: {
					fieldProps: {
						checkedChildren: 'Hidden',
						unCheckedChildren: 'Visible',
					},
					tips: 'Hidden menus are enable but not shown in the navigation (useful for direct access pages)',
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
				inMore: true,
				onClick: handleAssignPermissions,
			},
		],
		[handleAssignPermissions]
	);

	return (
		<>
			<SmartCrudPage
				fieldsConfig={fieldsConfig}
				actions={{
					getList: menuActions.getMenuTreeAction,
					create: menuActions.createMenuAction,
					update: menuActions.updateMenuAction,
					delete: menuActions.deleteMenuAction,
					// tree-select 字段通过 action 名称自动调用
					getMenuTreeForSelectAction: menuActions.getMenuTreeForSelectAction,
				}}
				title='Menu Management'
				description='Manage navigation menus and their associated permissions. Menus can inherit permissions that will be granted to users who have access to them.'
				enableCreate={true}
				enableEdit={true}
				enableDelete={true}
				enableDetail={true}
				expandable={{
					defaultExpandAllRows: true,
					indentSize: 24,
				}}
				tableProps={{
					pagination: false, // 树形表格通常不需要分页
				}}
				formProps={{
					width: 800,
				}}
				customRowActions={customRowActions}
				refreshTrigger={refreshTrigger}
			/>

			{/* Permission Assignment Modal */}
			<Modal
				title={`Assign Permissions: ${selectedMenu?.name || ''}`}
				open={permissionModalVisible}
				onOk={handleSavePermissions}
				onCancel={() => setPermissionModalVisible(false)}
				width={600}
				confirmLoading={permissionLoading}
			>
				<div style={{ marginBottom: 16, padding: '12px', background: '#f5f5f5', borderRadius: 6 }}>
					<p style={{ margin: 0, color: '#666', fontSize: 13 }}>
						<strong>Note:</strong> Permissions assigned to a menu will be automatically granted to users
						who have access to this menu through their roles. This allows fine-grained control over
						what actions users can perform on specific pages.
					</p>
				</div>
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
		</>
	);
}
