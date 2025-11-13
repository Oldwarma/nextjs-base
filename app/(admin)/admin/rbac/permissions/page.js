'use client';

import SmartCrudPage from '@/components/admin/smart-crud-page';
import * as actions from '@/app/(admin)/actions/rbac/crud-action.permission';

/**
 * Permission Management Page
 */
export default function PermissionsManagementPage() {
	// ✅ fieldsConfig 直接在 page 中定义（客户端安全）
	const fieldsConfig = [
		{
			key: 'id',
			title: 'ID',
			type: 'text',
			table: false,
			form: false,
			search: false,
		},

		{
			key: 'name',
			title: 'Name',
			type: 'text',
			required: true,
			width: 200,
			table: {
				width: 200,
				ellipsis: true,
			},
			form: {
				required: true,
				placeholder: 'Enter permission name',
				fieldProps: {
					showCount: true,
					maxLength: 100,
				},
			},
			search: {
				mode: 'like',
				enabled: true,
				placeholder: 'Search by name',
			},
		},

		{
			key: 'parent_id',
			title: 'Parent Permission',
			type: 'tree-select',
			table: false,  // ✅ 不在表格中显示
			form: {
				required: false,
				placeholder: 'Select parent permission (leave empty for root)',
				action: 'getPermissionTreeForSelectAction',
				fieldProps: {
					allowClear: true,
					showSearch: true,
					treeNodeFilterProp: 'title',
					// ✅ 移除 dropdownStyle/popupStyle，避免 React 警告
					// TreeSelect 会自动处理下拉菜单样式
				},
			},
			detail: {
				render: (value, record) => {
					if (!value) return <span>Root Permission</span>;
					const parent = record.parentInfo;
					if (parent && parent.name) {
						return <span>{parent.name}</span>;
					}
					return <span>{value}</span>;
				},
			},
			search: false,
		},

		{
			key: 'crud_category',
			title: 'CRUD Category',
			type: 'select',
			table: {
				width: 120,
				valueEnum: {
					0: { text: 'Unclassified', status: 'Default' },
					1: { text: 'Create', status: 'Success' },
					2: { text: 'Delete', status: 'Error' },
					3: { text: 'Update', status: 'Processing' },
					4: { text: 'Read', status: 'Default' },
					5: { text: 'Special', status: 'Warning' },
				},
			},
			form: {
				required: false,
				options: [
					{ label: 'Unclassified', value: 0 },
					{ label: 'Create', value: 1 },
					{ label: 'Delete', value: 2 },
					{ label: 'Update', value: 3 },
					{ label: 'Read', value: 4 },
					{ label: 'Special', value: 5 },
				],
				initialValue: 0,
			},
			detail: {
				valueEnum: {
					0: { text: 'Unclassified', status: 'Default' },
					1: { text: 'Create', status: 'Success' },
					2: { text: 'Delete', status: 'Error' },
					3: { text: 'Update', status: 'Processing' },
					4: { text: 'Read', status: 'Default' },
					5: { text: 'Special', status: 'Warning' },
				},
			},
			search: false,
		},

		{
			key: 'level',
			title: 'Permission Level',
			type: 'select',
			table: {
				width: 120,
				valueEnum: {
					0: { text: 'Other', status: 'Default' },
					1: { text: 'Bullet', status: 'Success' },
					2: { text: 'Bomb', status: 'Processing' },
					3: { text: 'Grenade', status: 'Error' },
					4: { text: 'Nuclear', status: 'Error' },
				},
			},
			form: {
				required: false,
				options: [
					{ label: 'Other', value: 0 },
					{ label: 'Bullet Level', value: 1 },
					{ label: 'Bomb Level', value: 2 },
					{ label: 'Grenade Level', value: 3 },
					{ label: 'Nuclear Level', value: 4 },
				],
				initialValue: 0,
			},
			detail: {
				valueEnum: {
					0: { text: 'Other', status: 'Default' },
					1: { text: 'Bullet', status: 'Success' },
					2: { text: 'Bomb', status: 'Processing' },
					3: { text: 'Grenade', status: 'Error' },
					4: { text: 'Nuclear', status: 'Error' },
				},
			},
			search: false,
		},

		{
			key: 'actions',
			title: 'Actions',
			type: 'array',  // ✅ 使用 array 类型
			table: false,  // ✅ 暂时隐藏，避免显示问题
			form: {
				placeholder: 'Enter action path (e.g., /api/users)',
				addButtonText: 'Add Action',
				max: 50,
				min: 0,
				showCopy: false,
			},
			search: false,
			detail: {
				render: (value) => {
					if (!value || !Array.isArray(value) || value.length === 0) {
						return <span style={{ color: '#999' }}>-</span>;
					}
					const stringValues = value.map(item => {
						if (typeof item === 'string') return item;
						if (typeof item === 'object' && item !== null) {
							return item.value || item.name || JSON.stringify(item);
						}
						return String(item);
					});
					return (
						<div style={{ whiteSpace: 'pre-wrap' }}>
							{stringValues.join('\n')}
						</div>
					);
				},
			},
		},

		{
			key: 'sort',
			title: 'Sort',
			type: 'number',
			table: {
				width: 80
			},
			form: {
				required: false,
				initialValue: 0,
				fieldProps: {
					min: 0,
				},
			},
			search: false,
		},

		{
			key: 'enable',
			title: 'Enable',
			type: 'switch',
			table: {
				width: 100,
				activeText: 'Enabled',
				inactiveText: 'Disabled',
				activeColor: 'success',
				inactiveColor: 'error',
				activeIcon: 'CheckCircleOutlined',
				inactiveIcon: 'CloseCircleOutlined',
			},
			form: {
				required: false,
				initialValue: true,
			},
			search: {
				type: 'select',
				options: [
					{ label: 'Enabled', value: true },
					{ label: 'Disabled', value: false },
				],
			},
		},

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
				fieldProps: {
					showCount: true,
					maxLength: 200,
					autoSize: { minRows: 2, maxRows: 5 },
				},
			},
			search: {
				mode: 'like',
				placeholder: 'Search by remark',
			},
		},

		{
			key: 'createdAt',
			title: 'Created At',
			type: 'datetime',
			table: {
				width: 180,
				sorter: true,
			},
			form: false,
			search: false,
		},

		{
			key: 'updatedAt',
			title: 'Updated At',
			type: 'datetime',
			table: {
				width: 180,
				sorter: true,
			},
			form: false,
			search: false,
		},
	];

	return (
		<SmartCrudPage
			title='Permission Management'
			description='Manage system permissions with tree structure support'
			fieldsConfig={fieldsConfig}
			actions={{
				getList: actions.getPermissionTreeAction,
				create: actions.createPermissionAction,
				update: actions.updatePermissionAction,
				delete: actions.deletePermissionAction,
				// ✅ tree-select 字段通过 action 名称自动调用
				getPermissionTreeForSelectAction: actions.getPermissionTreeForSelectAction,
			}}
			enableCreate={true}
			enableEdit={true}
			enableDelete={true}
			enableDetail={true}
			enableIndexColumn={false}
			// ✅ 树形表格配置（当 getList 返回树形数据时自动启用）
			expandable={{
				defaultExpandAllRows: false,
				indentSize: 24,
			}}
			tableProps={{
				pagination: {
					defaultPageSize: 100,
					showSizeChanger: true,
					pageSizeOptions: [50, 100, 200, 500],
				},
				scroll: { x: 1400 },
			}}
		/>
	);
}
