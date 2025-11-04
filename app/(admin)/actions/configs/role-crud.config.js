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

	// Primary key field
	primaryKey: 'role_id',

	// Field configuration
	fields: {
		// Creatable fields
		creatable: ['role_id', 'role_name', 'remark', 'enable'],

		// Updatable fields
		updatable: ['role_name', 'remark', 'enable'],

		// Searchable fields
		searchable: ['role_id', 'role_name', 'remark'],
	},

	// Query configuration
	query: {
		// Default sort
		defaultSort: { role_id: 1 },

		// Default page size
		defaultPageSize: 20,

		// Base filter
		baseFilter: {},
	},

	// Data validation rules
	validation: {
		role_id: {
			required: true,
			pattern: /^[a-zA-Z0-9_-]+$/,
			unique: true,
			message: 'Role ID is required and must be unique (letters, numbers, dashes, underscores)',
		},
		role_name: {
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
			if (id === 'admin') {
				throw new Error('Cannot modify admin role');
			}

			return data;
		},

		/**
		 * Before delete hook
		 */
		beforeDelete: async (id, existing) => {
			// Prevent deleting admin role
			if (id === 'admin') {
				throw new Error('Cannot delete admin role');
			}

			return true;
		},

		/**
		 * After delete hook - clean up related data
		 */
		afterDelete: async (id, deleted) => {
			// Remove this role from all users
			const { getCollection } = await import('@/lib/mongodb');
			const usersCollection = await getCollection('users');

			// Handle both single role string and role array
			await usersCollection.updateMany(
				{ role: id },
				{ $set: { role: 'user' } } // Set to default 'user' role
			);

			// Handle role arrays
			await usersCollection.updateMany(
				{ role: { $in: [id] } },
				{ $pull: { role: id } }
			);

			console.log(`Role ${id} deleted, cleaned up from users`);
		},

		/**
		 * Before batch delete hook
		 */
		beforeBatchDelete: async (ids) => {
			// Prevent deleting admin role
			if (ids.includes('admin')) {
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
			if (data.role_id) {
				data.role_id = data.role_id.trim();
			}

			if (data.role_name) {
				data.role_name = data.role_name.trim();
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

