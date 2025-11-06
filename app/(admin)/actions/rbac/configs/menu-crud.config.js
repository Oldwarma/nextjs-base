/**
 * 菜单管理 CRUD 配置
 */
export const menuCrudConfig = {
	collectionName: 'menus',
	
	fieldsConfig: {
		name: {
			type: 'text',
			label: 'Menu Name',
			required: true,
			tableShow: true,
			formShow: true,
			searchShow: true,
			rules: [
				{ required: true, message: 'Menu name is required' },
				{ min: 2, max: 50, message: 'Name length: 2-50 characters' },
			],
		},
		
		parent: {
			type: 'select',
			label: 'Parent Menu',
			required: false,
			tableShow: true,
			formShow: true,
			defaultValue: null,
		},
		
		url: {
			type: 'text',
			label: 'URL Path',
			required: false,
			tableShow: true,
			formShow: true,
			rules: [
				{ max: 200, message: 'URL max length: 200' },
			],
		},
		
		icon: {
			type: 'text',
			label: 'Icon',
			required: false,
			tableShow: true,
			formShow: true,
		},
		
		sort: {
			type: 'number',
			label: 'Display Order',
			required: false,
			tableShow: true,
			formShow: true,
			defaultValue: 0,
		},
		
		enable: {
			type: 'switch',
			label: 'Enabled',
			required: false,
			tableShow: true,
			formShow: true,
			defaultValue: true,
		},
	},
	
	enableSoftDelete: false,
	searchFields: ['name', 'url'],
	defaultSort: { sort: 1, createdAt: 1 },
};
