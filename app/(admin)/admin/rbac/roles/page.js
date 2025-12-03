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

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Tag, Button, Modal, Tree, App, Space, Switch, Tooltip, Alert } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, KeyOutlined, MenuOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import nb from '@/lib/function';

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
	const tableApiRef = useRef(null);

	// Permission assignment modal
	const [permissionModalVisible, setPermissionModalVisible] = useState(false);
	const [selectedRole, setSelectedRole] = useState(null);
	const [permissionTree, setPermissionTree] = useState([]);
	const [scopedPermissionTree, setScopedPermissionTree] = useState([]);
	const [selectedPermissions, setSelectedPermissions] = useState([]);
	const [permissionLoading, setPermissionLoading] = useState(false);
	const [permissionScope, setPermissionScope] = useState(null);

	// Menu assignment modal
	const [menuModalVisible, setMenuModalVisible] = useState(false);
	const [menuTree, setMenuTree] = useState([]);
	const [selectedMenus, setSelectedMenus] = useState([]);
	const [menuLoading, setMenuLoading] = useState(false);
	const [inheritMenuPermissions, setInheritMenuPermissions] = useState(false);

	// 仅保留叶子节点的选中值：父节点不写入状态，避免新增子节点被“继承”选中
	const filterToLeafKeys = useCallback((treeData) => {
		const leafSet = new Set();
		const walk = (nodes = []) => {
			nodes.forEach((node) => {
				const key = String(node.key ?? node.value ?? node.id);
				if (node.children && node.children.length > 0) {
					walk(node.children);
				} else {
					leafSet.add(key);
				}
			});
		};
		walk(treeData || []);
		return leafSet;
	}, []);

	const normalizeCheckedKeysToLeaves = useCallback(
		(checkedValue, treeData, info) => {
			const leafSet = filterToLeafKeys(treeData);
			const checkedArray = nb.pubfn.isArray(checkedValue) ? checkedValue : checkedValue?.checked || [];

			if (!leafSet || leafSet.size === 0) return checkedArray;

			if (info?.checkedNodes) {
				return info.checkedNodes
					.filter((node) => !node.children || node.children.length === 0)
					.map((node) => String(node.key ?? node.value ?? node.id))
					.filter((key) => leafSet.has(key));
			}

			return checkedArray.map(String).filter((key) => leafSet.has(key));
		},
		[filterToLeafKeys]
	);

	// 收集指定节点（或其子树）下的所有叶子 key
	const collectLeavesByKeys = useCallback((treeData = [], targetKeys = new Set()) => {
		const leaves = [];
		const walk = (nodes = []) => {
			nodes.forEach((node) => {
				const key = String(node.key ?? node.value ?? node.id);
				const hasChildren = node.children && node.children.length > 0;
				if (targetKeys.has(key)) {
					if (hasChildren) {
						// 收集整棵子树的叶子
						const pushLeaves = (children = []) => {
							children.forEach((child) => {
								const childKey = String(child.key ?? child.value ?? child.id);
								if (child.children && child.children.length > 0) {
									pushLeaves(child.children);
								} else {
									leaves.push(childKey);
								}
							});
						};
						pushLeaves(node.children);
					} else {
						leaves.push(key);
					}
				} else if (hasChildren) {
					walk(node.children);
				}
			});
		};
		walk(treeData);
		return leaves;
	}, []);

	// 依据已选叶子计算父节点的勾选/半选状态（用于 checkStrictly 控制渲染）
	const deriveCheckedState = useCallback((treeData = [], leafChecked = []) => {
		const leafSet = new Set(leafChecked.map(String));
		const parentChecked = new Set();
		const parentHalf = new Set();

		const walk = (node) => {
			const key = String(node.key ?? node.value ?? node.id);
			if (node.children && node.children.length > 0) {
				let leafCount = 0;
				let selectedLeafCount = 0;
				node.children.forEach((child) => {
					const { leafCount: lc, selectedLeafCount: sc } = walk(child);
					leafCount += lc;
					selectedLeafCount += sc;
				});

				if (leafCount > 0) {
					if (selectedLeafCount === leafCount) {
						parentChecked.add(key);
					} else if (selectedLeafCount > 0) {
						parentHalf.add(key);
					}
				}
				return { leafCount, selectedLeafCount };
			}

			const selected = leafSet.has(key);
			return { leafCount: 1, selectedLeafCount: selected ? 1 : 0 };
		};

		(treeData || []).forEach((node) => walk(node));

		return {
			checked: [...leafSet, ...parentChecked],
			halfChecked: [...parentHalf],
		};
	}, []);

	// 将权限树限制在父级授予范围内
	const applyPermissionScope = useCallback((tree, scope) => {
		if (scope === null) return tree;

		const allowedSet = new Set((scope || []).map(String));

		const walker = (nodes = []) =>
			(nodes || [])
				.map((node) => {
					const children = walker(node.children);
					const nodeKey = String(node.key || node.value || node.id);
					const isAllowed = allowedSet.has(nodeKey);

					// 如果节点和子节点都不在授权范围，直接过滤
					if (!isAllowed && children.length === 0) {
						return null;
					}

					return {
						...node,
						disabled: !isAllowed,
						disableCheckbox: !isAllowed,
						children,
					};
				})
				.filter(Boolean);

		return walker(tree);
	}, []);

	const permissionScopeSet = useMemo(() => {
		if (permissionScope === null) return null;
		return new Set((permissionScope || []).map(String));
	}, [permissionScope]);

	// Load permission and menu trees
	useEffect(() => {
		const loadPermissionTree = async () => {
			const result = await getPermissionTreeForSelectAction();
			if (result.success) {
				console.log('[Roles] Raw permission data:', result.data);
				// getPermissionTreeForSelectAction 已经返回正确格式，直接使用
				const tree = result.data || [];
				setPermissionTree(tree);
				setSelectedPermissions((prev) => normalizeCheckedKeysToLeaves(prev, tree));
			}
		};

		const loadMenuTree = async () => {
			// 不包含 "Root Menu" 选项，因为这里是分配菜单，不是选择父级
			const result = await getMenuTreeForSelectAction({ includeRootOption: false });
			if (result.success) {
				console.log('[Roles] Raw menu data:', result.data);
				// getMenuTreeForSelectAction 已经返回正确格式，直接使用
				const tree = result.data || [];
				setMenuTree(tree);
				setSelectedMenus((prev) => normalizeCheckedKeysToLeaves(prev, tree));
			}
		};

		loadPermissionTree();
		loadMenuTree();
	}, []);

	useEffect(() => {
		setScopedPermissionTree(applyPermissionScope(permissionTree, permissionScope));
	}, [permissionTree, permissionScope, applyPermissionScope]);

	// 当菜单树加载/变化后，重新归一选中值为叶子节点（避免早期选中包含父节点）
	useEffect(() => {
		if (menuTree && menuTree.length > 0) {
			setSelectedMenus((prev) => normalizeCheckedKeysToLeaves(prev, menuTree));
		}
	}, [menuTree, normalizeCheckedKeysToLeaves]);

	// 当权限树加载/变化后，重新归一选中值为叶子节点
	useEffect(() => {
		if (scopedPermissionTree && scopedPermissionTree.length > 0) {
			setSelectedPermissions((prev) => normalizeCheckedKeysToLeaves(prev, scopedPermissionTree));
		}
	}, [scopedPermissionTree, normalizeCheckedKeysToLeaves]);

	// Handle assign permissions
	const handleAssignPermissions = useCallback(
		async (record) => {
			if (record.id === 'admin') {
				message.warning('Cannot modify admin role permissions');
				return;
			}

			setSelectedRole(record);
			setPermissionScope(null);
			setPermissionLoading(true);
			setPermissionModalVisible(true);

			// Get current permissions
			const result = await roleActions.getRoleDetailAction(record.id);
			if (result.success) {
				const currentPerms = result.data?.permission || [];
				console.log('[Roles] Current permissions:', currentPerms);
				// 确保权限ID是字符串数组
				const permIds = currentPerms.map((p) => String(nb.pubfn.isObject(p) ? p.id : p));
				console.log('[Roles] Converted permission IDs:', permIds);
				const scope = result.data?.permissionScope;
				const normalizedScope = scope === undefined ? null : scope === null ? null : (scope || []).map(String);

				setPermissionScope(normalizedScope);
				setSelectedRole((prev) => ({
					...prev,
					parentInfo: result.data?.parentInfo || prev?.parentInfo,
				}));
				const scopedIds = normalizedScope && Array.isArray(normalizedScope) ? permIds.filter((id) => normalizedScope.includes(id)) : permIds;
				setSelectedPermissions(
					normalizeCheckedKeysToLeaves(scopedIds, scopedPermissionTree.length > 0 ? scopedPermissionTree : permissionTree)
				);
			} else {
				message.error(result.error || 'Failed to load permissions');
			}

			setPermissionLoading(false);
		},
		[message]
	);

	const handlePermissionModalClose = useCallback(() => {
		setPermissionModalVisible(false);
		setPermissionScope(null);
		setScopedPermissionTree(permissionTree);
	}, [permissionTree]);

	const handlePermissionCheck = useCallback(
		(checkedKeysValue, info) => {
			const leafKeys = normalizeCheckedKeysToLeaves(checkedKeysValue, scopedPermissionTree, info);
			const normalized = permissionScopeSet ? leafKeys.filter((key) => permissionScopeSet.has(String(key))) : leafKeys;

			setSelectedPermissions(normalized);
		},
		[permissionScopeSet, scopedPermissionTree, normalizeCheckedKeysToLeaves]
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
				setSelectedMenus(normalizeCheckedKeysToLeaves(result.data?.menu || [], menuTree));
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
			handlePermissionModalClose();
			tableApiRef.current?.refresh();
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
			tableApiRef.current?.refresh();
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

			{
				key: 'parentId',
				title: 'Parent Role',
				type: 'tree-select',
				table: false,
				form: {
					required: false,
					placeholder: 'Select parent role (optional)',
					action: 'getRoleTreeForSelectAction',
					fieldProps: {
						allowClear: true,
						showSearch: true,
						treeNodeFilterProp: 'title',
					},
				},
				detail: {
					render: (value, record) => {
						if (!value) return <span>Root Role</span>;
						const parentName = record.parentInfo?.name || record.parent?.name;
						return <span>{parentName || value}</span>;
					},
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
						const count = nb.pubfn.isArray(value) ? value.length : 0;
						return <Tag color='blue'>{count} permissions</Tag>;
					},
				},
				detail: {
					render: (value, record) => {
						// 优先使用连表数据 permissionList，fallback 到原始字段 permission
						const permissions = record.permissionList || value || [];

						if (!nb.pubfn.isArray(permissions) || permissions.length === 0) {
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
						const count = nb.pubfn.isArray(value) ? value.length : 0;
						return <Tag color='cyan'>{count} menus</Tag>;
					},
				},
				detail: {
					render: (value, record) => {
						// 优先使用连表数据 menuList，fallback 到原始字段 menu
						const menus = record.menuList || value || [];

						if (!nb.pubfn.isArray(menus) || menus.length === 0) {
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

			// inheritMenuPermissions
			{
				key: 'inheritMenuPermissions',
				title: 'Inherit Menu Permissions',
				type: 'switch',
				table: {
					width: 100,
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
					getList: roleActions.getRoleTreeAction,
					getDetail: roleActions.getRoleDetailAction,
					create: roleActions.createRoleAction,
					update: roleActions.updateRoleAction,
					delete: roleActions.deleteRoleAction,
					getRoleTreeForSelectAction: roleActions.getRoleTreeForSelectAction,
				}}
				formProps={{
					width: 600,
				}}
				customRowActions={customRowActions}
				tableApiRef={tableApiRef}
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
				onCancel={handlePermissionModalClose}
				width={600}
				confirmLoading={permissionLoading}
			>
				{permissionScope !== null && (
					<Alert
						type='info'
						message={
							<div>
								Only in the permission scope of
								{selectedRole?.parentInfo?.name ? `「${selectedRole.parentInfo.name}」` : ''}
								can be selected
							</div>
						}
						showIcon
						style={{ marginBottom: 12 }}
					/>
				)}
				{permissionLoading && scopedPermissionTree.length === 0 ? (
					<div style={{ textAlign: 'left', padding: '20px 0' }}>Loading permissions...</div>
				) : scopedPermissionTree.length > 0 ? (
					<Tree
						checkable
						treeData={scopedPermissionTree}
						checkedKeys={selectedPermissions}
						onCheck={handlePermissionCheck}
						disabled={permissionLoading}
						style={{ maxHeight: 400, overflowY: 'auto' }}
					/>
				) : (
					<div style={{ textAlign: 'left', padding: '20px 0' }}>
						{permissionScope !== null && (permissionScope?.length || 0) === 0
							? 'Parent role has no permissions to grant'
							: permissionTree.length === 0
							? 'Loading permissions...'
							: 'No permissions available'}
					</div>
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
				<div
					style={{
						marginBottom: 16,
						padding: '12px 16px',
						background: inheritMenuPermissions ? '#e6f7ff' : '#f5f5f5',
						borderRadius: 8,
						border: inheritMenuPermissions ? '1px solid #91d5ff' : '1px solid #d9d9d9',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						transition: 'all 0.3s',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<Switch
							checked={inheritMenuPermissions}
							onChange={setInheritMenuPermissions}
							size='small'
						/>
						<span style={{ fontWeight: 500, color: '#333' }}>Inherit Menu Permissions</span>
						<Tooltip
							title='When enabled, users with this role will also inherit the permissions assigned to these menus. When disabled, menus only control page access without granting additional permissions.'
							placement='right'
						>
							<QuestionCircleOutlined style={{ color: '#999', cursor: 'help' }} />
						</Tooltip>
					</div>
					{inheritMenuPermissions && (
						<Tag
							color='blue'
							style={{ margin: 0 }}
						>
							Active
						</Tag>
					)}
				</div>

				{menuLoading && menuTree.length === 0 ? (
					<div style={{ textAlign: 'left', padding: '20px 0' }}>Loading menus...</div>
				) : menuTree.length > 0 ? (
					<Tree
						checkable
						checkStrictly
						treeData={menuTree}
						checkedKeys={deriveCheckedState(menuTree, selectedMenus)}
						onCheck={(checkedKeys, info) => {
							const targetKey = String(info?.node?.key ?? info?.node?.value ?? info?.node?.id);
							const affectedLeaves = collectLeavesByKeys(menuTree, new Set([targetKey]));
							const next = new Set(selectedMenus);
							if (info.checked) {
								affectedLeaves.forEach((k) => next.add(k));
							} else {
								affectedLeaves.forEach((k) => next.delete(k));
							}
							setSelectedMenus(Array.from(next));
						}}
						disabled={menuLoading}
						style={{ maxHeight: 400, overflowY: 'auto' }}
					/>
				) : (
					<div style={{ textAlign: 'left', padding: '20px 0' }}>Loading menus...</div>
				)}
			</Modal>
		</>
	);
}
