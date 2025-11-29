/**
 * 菜单管理页面
 *
 * 功能：
 * - 树形表格展示菜单
 * - 支持新增、编辑、删除菜单
 * - 父级菜单树形选择
 * - 图标选择器
 * - 排序功能
 */

'use client';

import { Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import SmartCrudPage from '@/components/admin/smart-crud-page';

// 导入图标渲染函数
import { renderIcon } from '@/components/admin/icon-picker';

// Server Actions
import * as menuActions from '@/app/(admin)/actions/rbac/crud-action.menu';

export default function MenusManagementPage() {
	// fieldsConfig 直接在 page 中定义（客户端安全）
	const fieldsConfig = [
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
						<Tag
							icon={<CheckCircleOutlined />}
							color='success'
						>
							Enabled
						</Tag>
					) : (
						<Tag
							icon={<CloseCircleOutlined />}
							color='default'
						>
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
						<Tag
							icon={<EyeInvisibleOutlined />}
							color='warning'
						>
							Hidden
						</Tag>
					) : (
						<Tag
							icon={<EyeOutlined />}
							color='default'
						>
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
	];

	return (
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
		/>
	);
}
