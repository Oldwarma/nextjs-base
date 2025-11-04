/**
 * Permission Management CRUD Config
 * 
 * Defines CRUD operation rules for permission data, including:
 * - Field access control (creatable, updatable, searchable)
 * - Data validation rules
 * - Lifecycle hooks
 * - Data transformation rules
 */

export const permissionCrudConfig = {
	// Collection name
	collectionName: 'permissions',

	// Log category
	logCategory: 'admin/permissions',

	// Primary key field
	primaryKey: 'permission_id',

	// Field configuration
	fields: {
		// Creatable fields
		creatable: [
			'permission_id',
			'permission_name',
			'parent_id',
			'remark',
			'enable',
			'sort',
			'curd_category',
			'level',
			'actions',
		],

		// Updatable fields
		updatable: [
			'permission_name',
			'parent_id',
			'remark',
			'enable',
			'sort',
			'curd_category',
			'level',
			'actions',
		],

		// Searchable fields
		searchable: ['permission_id', 'permission_name', 'remark'],
	},

	// Query configuration
	query: {
		// Default sort
		defaultSort: { sort: 1, permission_id: 1 },

		// Default page size
		defaultPageSize: 100,

		// Base filter (always applied)
		baseFilter: {},
	},

	// Data validation rules
	validation: {
		permission_id: {
			required: true,
			pattern: /^[a-zA-Z0-9._-]+$/,
			unique: true,
			message: 'Permission ID is required and must be unique (letters, numbers, dots, dashes, underscores)',
		},
		permission_name: {
			required: true,
			minLength: 2,
			maxLength: 100,
			message: 'Permission name must be between 2 and 100 characters',
		},
		parent_id: {
			required: false,
			validator: async (value, data) => {
				// 如果没有parent_id，说明是顶级权限
				if (!value || value === '') {
					return true;
				}

				// 检查父级是否存在
				const { getCollection } = await import('@/lib/mongodb');
				const collection = await getCollection('permissions');
				const parent = await collection.findOne({ permission_id: value });

				return !!parent;
			},
			message: 'Parent permission does not exist',
		},
		enable: {
			required: false,
			validator: (value) => {
				return typeof value === 'boolean';
			},
			message: 'Enable must be a boolean value',
		},
		sort: {
			required: false,
			validator: (value) => {
				return typeof value === 'number' && value >= 0;
			},
			message: 'Sort must be a non-negative number',
		},
		curd_category: {
			required: false,
			validator: (value) => {
				// 0=未分类, 1=增, 2=删, 3=改, 4=查, 5=特殊
				return [0, 1, 2, 3, 4, 5].includes(value);
			},
			message: 'CURD category must be 0-5 (0=Unclassified, 1=Create, 2=Delete, 3=Update, 4=Read, 5=Special)',
		},
		level: {
			required: false,
			validator: (value) => {
				// 0=其他, 1=子弹级, 2=炸弹级, 3=榴弹级, 4=核弹级
				return [0, 1, 2, 3, 4].includes(value);
			},
			message: 'Level must be 0-4 (0=Other, 1=Bullet, 2=Bomb, 3=Grenade, 4=Nuclear)',
		},
		actions: {
			required: false,
			validator: (value) => {
				// actions必须是数组
				if (!Array.isArray(value)) {
					return false;
				}

				// 每个元素必须是字符串且符合路径格式
				return value.every((action) => {
					return typeof action === 'string' && action.length > 0;
				});
			},
			message: 'Actions must be an array of non-empty strings (action paths)',
		},
	},

	// Lifecycle hooks
	hooks: {
		/**
		 * Before create hook
		 */
		beforeCreate: async (data) => {
			// Set default values
			if (data.enable === undefined) {
				data.enable = true;
			}

			if (data.sort === undefined) {
				data.sort = 0;
			}

			if (data.parent_id === undefined || data.parent_id === '') {
				data.parent_id = null;
			}

			if (data.actions === undefined) {
				data.actions = [];
			}

			if (data.curd_category === undefined) {
				data.curd_category = 0;
			}

			if (data.level === undefined) {
				data.level = 0;
			}

			return data;
		},

		/**
		 * Before update hook
		 */
		beforeUpdate: async (id, data, existing) => {
			// Prevent setting parent_id to self
			if (data.parent_id === id) {
				throw new Error('Cannot set parent_id to self');
			}

			// Prevent circular reference (basic check)
			if (data.parent_id) {
				const { getCollection } = await import('@/lib/mongodb');
				const collection = await getCollection('permissions');

				// Check if parent_id would create a circular reference
				let currentParentId = data.parent_id;
				let depth = 0;
				const maxDepth = 10;

				while (currentParentId && depth < maxDepth) {
					if (currentParentId === id) {
						throw new Error('Circular reference detected in parent_id');
					}

					const parent = await collection.findOne({ permission_id: currentParentId });
					if (!parent) {
						break;
					}

					currentParentId = parent.parent_id;
					depth++;
				}
			}

			return data;
		},

		/**
		 * Before delete hook - check if it can be deleted
		 */
		beforeDelete: async (id, existing) => {
			// Check if this permission has children
			const { getCollection } = await import('@/lib/mongodb');
			const collection = await getCollection('permissions');

			const childrenCount = await collection.count({ parent_id: id });

			if (childrenCount > 0) {
				throw new Error('Cannot delete permission with children. Please delete children first.');
			}

			return true;
		},

		/**
		 * After delete hook - clean up related data
		 */
		afterDelete: async (id, deleted) => {
			// Remove this permission from all roles
			const { getCollection } = await import('@/lib/mongodb');
			const rolesCollection = await getCollection('roles');

			await rolesCollection.updateMany(
				{ permission: id },
				{ $pull: { permission: id } }
			);

			// Remove this permission from all menus
			const menusCollection = await getCollection('menus');

			await menusCollection.updateMany(
				{ permission: id },
				{ $pull: { permission: id } }
			);

			console.log(`Permission ${id} deleted, cleaned up from roles and menus`);
		},

		/**
		 * Before batch delete hook
		 */
		beforeBatchDelete: async (ids) => {
			// Check if any permission has children
			const { getCollection } = await import('@/lib/mongodb');
			const collection = await getCollection('permissions');

			const childrenCount = await collection.count({
				parent_id: { $in: ids },
			});

			if (childrenCount > 0) {
				throw new Error('Cannot delete permissions with children. Please delete children first.');
			}

			return true;
		},
	},

	// Data transformation
	transforms: {
		/**
		 * Input transform - process data before writing to DB
		 */
		input: (data) => {
			// Ensure boolean type
			if (data.enable !== undefined) {
				data.enable = data.enable === true || data.enable === 'true';
			}

			// Ensure number type
			if (data.sort !== undefined) {
				data.sort = parseInt(data.sort, 10);
			}

			if (data.curd_category !== undefined) {
				data.curd_category = parseInt(data.curd_category, 10);
			}

			if (data.level !== undefined) {
				data.level = parseInt(data.level, 10);
			}

			// Transform actions from ProFormList format [{value: 'a'}, {value: 'b'}] to ['a', 'b']
			if (data.actions) {
				if (!Array.isArray(data.actions)) {
					data.actions = [];
				} else if (data.actions.length > 0 && typeof data.actions[0] === 'object' && data.actions[0] !== null) {
					// ProFormList 格式：对象数组 → 字符串数组
					data.actions = data.actions
						.map(item => {
							if (typeof item === 'object' && item !== null) {
								return item.value || '';
							}
							return item || '';
						})
						.filter(v => v && typeof v === 'string' && v.trim().length > 0);
				} else {
					// 已经是字符串数组，只需过滤空值
					data.actions = data.actions.filter(v => v && typeof v === 'string' && v.trim().length > 0);
				}
			} else {
				data.actions = [];
			}

			// Trim string fields
			if (data.permission_id) {
				data.permission_id = data.permission_id.trim();
			}

			if (data.permission_name) {
				data.permission_name = data.permission_name.trim();
			}

			return data;
		},

		/**
		 * Output transform - process data after reading from DB
		 */
		output: (data) => {
			// Ensure enable is boolean
			if (data.enable === undefined) {
				data.enable = true;
			}

			// Ensure actions is an array
			if (!data.actions || !Array.isArray(data.actions)) {
				data.actions = [];
			}

			return data;
		},
	},

	// Disable soft delete for permissions (use hard delete)
	softDelete: false,
};

