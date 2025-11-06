/**
 * Role Management CRUD Config
 * 
 * Defines CRUD operation rules for role data, including:
 * - Field access control (creatable, updatable, searchable)
 * - Data validation rules
 * - Lifecycle hooks
 * - Data transformation rules
 */

export const roleCrudConfig = {
	// Collection name
	collectionName: 'roles',

	// Log category
	logCategory: 'admin/roles',

	// Primary key field (UUID)
	primaryKey: 'id',

	// Field configuration
	fields: {
		// Creatable fields
		creatable: ['name', 'remark', 'enable'],

		// Updatable fields
		updatable: ['name', 'remark', 'enable'],

		// Searchable fields
		searchable: ['name', 'remark'],
	},

	// Query configuration
	query: {
		// Default sort
		defaultSort: { name: 1 },

		// Default page size
		defaultPageSize: 20,

		// Base filter
		baseFilter: {},

		// 连表配置（可选）- 在 getList 时自动连表查询权限和菜单的名称
		foreignDB: [
			{
				dbName: 'permissions',
				localKey: 'permission',        // roles.permission 是 UUID 数组
				foreignKey: 'id',              // permissions.id 是 UUID
				as: 'permissionList',          // 连表结果存放在 permissionList 字段
				fieldJson: { id: 1, name: 1 }, // 只返回 id 和 name
			},
			{
				dbName: 'menus',
				localKey: 'menu',              // roles.menu 是 UUID 数组
				foreignKey: 'id',              // menus.id 是 UUID
				as: 'menuList',                // 连表结果存放在 menuList 字段
				fieldJson: { id: 1, name: 1 }, // 只返回 id 和 name
			},
		],
	},

	// Data validation rules
	validation: {
		name: {
			required: true,
			minLength: 2,
			maxLength: 100,
			message: 'Role name must be between 2 and 100 characters',
		},
		enable: {
			required: false,
			validator: (value) => {
				return typeof value === 'boolean';
			},
			message: 'Enable must be a boolean value',
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

			// Initialize permission and menu arrays
			if (data.permission === undefined) {
				data.permission = [];
			}

			if (data.menu === undefined) {
				data.menu = [];
			}

			return data;
		},

		/**
		 * Before update hook
		 */
		beforeUpdate: async (id, data, existing) => {
			// Prevent modifying admin role
			if (existing.name === 'admin' || existing.name === 'Admin') {
				throw new Error('Cannot modify admin role');
			}

			return data;
		},

		/**
		 * Before delete hook
		 */
		beforeDelete: async (id, existing) => {
			// Prevent deleting admin role
			if (existing.name === 'admin' || existing.name === 'Admin') {
				throw new Error('Cannot delete admin role');
			}

			return true;
		},

		/**
		 * After delete hook - clean up related data
		 */
		afterDelete: async (id, deleted) => {
			// Remove this role from all users
			const { getCollection } = await import('@/lib/database/mongodb');
			const usersCollection = await getCollection('users');

			// Remove role from users' roles array
			await usersCollection.updateMany(
				{ roles: id },
				{ $pull: { roles: id } }
			);

			console.log(`Role ${id} deleted, cleaned up from users`);
		},

		/**
		 * Before batch delete hook
		 */
		beforeBatchDelete: async (ids) => {
			// Prevent deleting admin role
			const { getCollection } = await import('@/lib/database/mongodb');
			const collection = await getCollection('roles');
			
			const adminRoles = await collection.find({
				id: { $in: ids },
				$or: [{ name: 'admin' }, { name: 'Admin' }]
			});

			if (adminRoles.length > 0) {
				throw new Error('Cannot delete admin role');
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

			// Trim string fields
			if (data.name) {
				data.name = data.name.trim();
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

			// Ensure permission and menu are arrays
			if (!data.permission || !Array.isArray(data.permission)) {
				data.permission = [];
			}

			if (!data.menu || !Array.isArray(data.menu)) {
				data.menu = [];
			}

			return data;
		},
	},

	// Disable soft delete for roles (use hard delete)
	softDelete: false,
};
