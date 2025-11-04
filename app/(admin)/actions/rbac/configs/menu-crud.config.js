/**
 * Menu Management CRUD Config
 * 
 * 菜单管理的 CRUD 配置（注意：菜单管理目前未使用 BaseDAO，此文件供参考）
 */

export const menuCrudConfig = {
	collectionName: 'menus',
	logCategory: 'admin/menus',
	primaryKey: 'id',
	
	fields: {
		creatable: ['name', 'url', 'icon', 'parent_id', 'enable', 'hidden', 'sort', 'remark'],
		updatable: ['name', 'url', 'icon', 'parent_id', 'enable', 'hidden', 'sort', 'remark'],
		searchable: ['name', 'url'],
	},
	
	query: {
		defaultSort: { sort: 1, name: 1 },
		defaultPageSize: 100,
		baseFilter: {},
	},
	
	validation: {
		name: {
			required: true,
			minLength: 2,
			maxLength: 50,
			message: 'Menu name must be between 2 and 50 characters',
		},
		parent_id: {
			required: false,
			validator: async (value) => {
				if (!value) return true;
				const { getCollection } = await import('@/lib/mongodb');
				const menus = await getCollection('menus');
				const parent = await menus.findOne({ id: value });
				return !!parent;
			},
			message: 'Parent menu does not exist',
		},
	},
	
	transforms: {
		input: (data) => {
			if (data.name) data.name = data.name.trim();
			if (data.url) data.url = data.url.trim();
			return data;
		},
		output: (data) => {
			if (data.enable === undefined) data.enable = true;
			if (data.hidden === undefined) data.hidden = false;
			if (data.sort === undefined) data.sort = 0;
			return data;
		},
	},
	
	softDelete: false,
};

