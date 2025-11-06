/**
 * Permission Management Page
 *
 * Features:
 * - Tree table display of permissions
 * - Create, edit, delete permissions
 * - Parent permission tree selector
 * - Actions configuration (support wildcards)
 * - CRUD category and level management
 * - Sorting functionality
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

// Dynamically import SmartCrudPage
const SmartCrudPage = dynamic(() => import('@/components/admin/smart-crud-page'), {
	ssr: false,
	loading: () => <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>,
});

// Server Actions
import {
	getPermissionTreeAction as getList,
	createPermissionAction as create,
	updatePermissionAction as update,
	deletePermissionAction as deleteItem,
	getPermissionTreeForSelectAction,
} from '@/app/(admin)/actions/rbac/admin-permissions';

// Convert permission tree to Ant Design Tree format
const convertToTreeData = (data) => {
	if (!Array.isArray(data)) return [];

	return data.map((item) => {
		const node = {
			title: item.name || item.label,
			value: item.id,
			key: item.id,
		};
		
		// 只有当 children 存在且不为空时才添加 children 属性
		if (item.children && item.children.length > 0) {
			node.children = convertToTreeData(item.children);
		}
		
		return node;
	});
};

export default function PermissionsManagementPage() {
	const [permissionTree, setPermissionTree] = useState([]);

	// Load permission tree (for parent selector)
	const loadPermissionTree = async () => {
		// 使用专门的 TreeSelect action 获取树形结构
		const result = await getPermissionTreeForSelectAction();
		
		if (result.success) {
			// 添加 "Root Permission" 选项（value 和 key 必须一致）
			const treeData = [
				{
					title: '--- Root Permission ---',
					value: null,
					key: null, // key 必须和 value 一致
				},
				...convertToTreeData(result.data || []),
			];
			setPermissionTree(treeData);
		}
	};

	// Load permission tree on mount - 只加载一次
	useEffect(() => {
		let isMounted = true;
		
		if (isMounted) {
			loadPermissionTree();
		}
		
		return () => {
			isMounted = false;
		};
	}, []); // 空依赖数组，只在mount时执行一次

	// Field configuration
	const fieldsConfig = useMemo(
		() => [
		// ID (UUID - 自动生成，不显示)
		{
			key: 'id',
			title: 'ID',
			type: 'text',
			table: false, // 不在表格中显示
			form: false,  // 自动生成，不允许编辑
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
					maxLength: 100,
				},
			},
			search: {
				placeholder: 'Search by name',
			},
			},

		// Parent Permission
		{
			key: 'parent_id',
			title: 'Parent Permission',
			type: 'tree-select',
			table: false,
			form: {
				required: false,
				placeholder: 'Select parent permission (leave empty for root)',
				fieldProps: {
					treeData: permissionTree,
					allowClear: true,
					showSearch: true,
					treeNodeFilterProp: 'title',
					dropdownStyle: { maxHeight: 400, overflow: 'auto' },
				},
			},
		detail: {
			render: (value, record) => {
				if (!value) return 'Root Permission';
				
				// 优先使用连表数据 parentInfo
				const parent = record.parentInfo;
				if (parent && parent.name) {
					return parent.name;
				}
				
				// Fallback: 从树中查找父权限名称（为了兼容性保留）
				const findName = (tree, id) => {
					for (const node of tree) {
						if (node.value === id) return node.title;
						if (node.children) {
							const found = findName(node.children, id);
							if (found) return found;
						}
					}
					return null;
				};
				const parentName = findName(permissionTree, value);
				return parentName || value;
			},
		},
			search: false,
		},

		// CRUD Category
		{
			key: 'crud_category',
			title: 'CRUD Category',
			type: 'radio',
			table: {
				width: 120,
				render: (value) => {
					const categoryMap = {
						0: { text: 'Unclassified', color: 'default' },
						1: { text: 'Create', color: 'green' },
						2: { text: 'Delete', color: 'red' },
						3: { text: 'Update', color: 'blue' },
						4: { text: 'Read', color: 'cyan' },
						5: { text: 'Special', color: 'purple' },
					};
					const category = categoryMap[value] || categoryMap[0];
					return <Tag color={category.color}>{category.text}</Tag>;
				},
			},
			form: {
				required: false,
				valueType: 'radio',
				fieldProps: {
					options: [
						{ label: 'Unclassified', value: 0 },
						{ label: 'Create', value: 1 },
						{ label: 'Delete', value: 2 },
						{ label: 'Update', value: 3 },
						{ label: 'Read', value: 4 },
						{ label: 'Special', value: 5 },
					],
				},
				initialValue: 0,
			},
			detail: {
				render: (value) => {
					const categoryMap = {
						0: { text: 'Unclassified', color: 'default' },
						1: { text: 'Create', color: 'green' },
						2: { text: 'Delete', color: 'red' },
						3: { text: 'Update', color: 'blue' },
						4: { text: 'Read', color: 'cyan' },
						5: { text: 'Special', color: 'purple' },
					};
					const category = categoryMap[value] || categoryMap[0];
					return <Tag color={category.color}>{category.text}</Tag>;
				},
			},
			search: false,
		},

		// Permission Level
		{
			key: 'level',
			title: 'Permission Level',
			type: 'radio',
			table: {
				width: 120,
				render: (value) => {
					const levelMap = {
						0: { text: 'Other', color: 'default' },
						1: { text: 'Bullet', color: 'green' },
						2: { text: 'Bomb', color: 'orange' },
						3: { text: 'Grenade', color: 'red' },
						4: { text: 'Nuclear', color: 'purple' },
					};
					const level = levelMap[value] || levelMap[0];
					return <Tag color={level.color}>{level.text}</Tag>;
				},
			},
			form: {
				required: false,
				valueType: 'radio',
				fieldProps: {
					options: [
						{ label: 'Other', value: 0 },
						{ label: 'Bullet Level', value: 1 },
						{ label: 'Bomb Level', value: 2 },
						{ label: 'Grenade Level', value: 3 },
						{ label: 'Nuclear Level', value: 4 },
					],
				},
				initialValue: 0,
			},
			detail: {
				render: (value) => {
					const levelMap = {
						0: { text: 'Other', color: 'default' },
						1: { text: 'Bullet', color: 'green' },
						2: { text: 'Bomb', color: 'orange' },
						3: { text: 'Grenade', color: 'red' },
						4: { text: 'Nuclear', color: 'purple' },
					};
					const level = levelMap[value] || levelMap[0];
					return <Tag color={level.color}>{level.text}</Tag>;
				},
			},
			search: false,
		},

			// Actions
			{
				key: 'actions',
				title: 'Actions',
				type: 'array',
				table: {
					width: 250,
					maxDisplay: 2,
					render: (value) => {
						if (!value || value.length === 0) return '-';
						const displayCount = 2;
						return (
							<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
								{value.slice(0, displayCount).map((action, index) => (
									<Tag
										key={index}
										color={action.includes('*') ? 'blue' : 'default'}
										style={{ marginBottom: 0, fontSize: 12 }}
									>
										{action}
									</Tag>
								))}
								{value.length > displayCount && (
									<Tag color="processing" style={{ marginBottom: 0 }}>
										+{value.length - displayCount} more
									</Tag>
								)}
							</div>
						);
					},
				},
				form: {
					required: false,
					placeholder: 'Enter action path (e.g., /admin/actions/user/*, /api/users/**)',
					addButtonText: 'Add Action Path',
					max: 50,
					min: 0,
					showCopy: true,
					showDelete: true,
					alwaysShowItemLabel: false,
					tips: 'Wildcard support:\n• * - Match single path segment (e.g., /admin/actions/user/*)\n• ** - Match any depth (e.g., /admin/actions/**)\n\nCommon patterns:\n• /admin/actions/user/* - All user actions\n• /api/** - All API endpoints\n• /admin/actions/*/create - All create actions\n\nBest practices:\n• Use specific paths when possible\n• Avoid overly broad wildcards like /**\n• Group related actions together',
					copyIconProps: {
						tooltipText: 'Copy this action path',
					},
					deleteIconProps: {
						tooltipText: 'Remove this action path',
					},
					// 添加验证规则
					rules: [
						{
							validator: (_, value) => {
								if (!value || value.length === 0) {
									return Promise.resolve();
								}
								// 检查是否有重复项
								const uniqueValues = new Set(value);
								if (uniqueValues.size !== value.length) {
									return Promise.reject(new Error('Duplicate action paths detected'));
								}
								// 检查每个路径格式
								// for (const path of value) {
								// 	// if (!path || typeof path !== 'string') {
								// 	// 	return Promise.reject(new Error('Invalid action path'));
								// 	// }
								// 	// 基本路径验证
								// 	if (!path.startsWith('/')) {
								// 		return Promise.reject(new Error(`Action path must start with / : ${path}`));
								// 	}
								// 	// 检查是否包含空格
								// 	if (path.includes(' ')) {
								// 		return Promise.reject(new Error(`Action path cannot contain spaces: ${path}`));
								// 	}
								// }
								return Promise.resolve();
							},
						},
					],
				},
				search: false,
			},

			// Sort
			{
				key: 'sort',
				title: 'Sort',
				type: 'number',
				table: {
					width: 80,
					sorter: true,
				},
				form: {
					required: false,
					placeholder: 'Enter sort order',
					fieldProps: {
						min: 0,
						max: 9999,
					},
					initialValue: 0,
				},
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
		[permissionTree]
	);

	return (
		<SmartCrudPage
			title='Permission Management'
			description='Manage system permissions with tree structure support'
			rowKey='id'
			fieldsConfig={fieldsConfig}
			actions={{
				getList,
				create,
				update,
				delete: deleteItem,
			}}
			tableOptions={{
				scroll: { x: 1500 },
				expandable: {
					defaultExpandAllRows: false,
				},
			}}
			formOptions={{
				modalWidth: 800,
			}}
			onDataChange={loadPermissionTree} // Reload tree when data changes
			enableCreate={true}
			enableDetail={true}
			enableEdit={true}
			enableDelete={true}
		/>
	);
}


