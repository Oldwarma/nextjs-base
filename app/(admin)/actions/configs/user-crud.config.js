/**
 * 用户管理 CRUD 配置
 * 
 * 此配置文件定义了用户数据表的 CRUD 操作规则，包括：
 * - 字段权限控制（可创建、可更新、可搜索）
 * - 数据验证规则
 * - 生命周期钩子
 * - 数据转换规则
 */

export const userCrudConfig = {
	// 集合名称
	collectionName: 'users',

	// 日志分类（用于日志输出）
	logCategory: 'admin/users',

	// 主键字段（MongoDB 使用 _id）
	primaryKey: '_id',

	// 字段配置
	fields: {
		// 可创建的字段（目前用户创建通过注册流程，此处暂不开放）
		creatable: [],

		// 可更新的字段
		updatable: ['name', 'email', 'username', 'role', 'emailVerified', 'banned'],

		// 可搜索的字段
		searchable: ['name', 'email', 'username'],
	},

	// 查询配置
	query: {
		// 默认排序
		defaultSort: { createdAt: -1 },

		// 默认分页大小
		defaultPageSize: 20,

		// 基础过滤条件（始终应用）
		baseFilter: {},

		// 连表配置（可选）- 在 getList 时自动连表查询角色名称
		foreignDB: [
			{
				dbName: 'roles',
				localKey: 'roles',             // users.roles 是角色 ID 数组 (RBAC)
				foreignKey: 'id',              // roles.id 是 UUID
				as: 'roleList',                // 连表结果存放在 roleList 字段
				fieldJson: { id: 1, name: 1 }, // 只返回 id 和 name
			},
		],
	},

	// 数据验证规则
	validation: {
		name: {
			required: true,
			minLength: 2,
			maxLength: 50,
			message: 'Name must be between 2 and 50 characters',
		},
		email: {
			required: true,
			pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
			unique: true,
			message: 'Invalid email format or email already exists',
		},
		username: {
			required: false,
			pattern: /^[a-zA-Z0-9_]{3,20}$/,
			unique: true,
			message: 'Username must be 3-20 characters (letters, numbers, underscores) and must be unique',
		},
		role: {
			required: true,
			validator: async (value) => {
				return ['user', 'admin'].includes(value);
			},
			message: 'Role must be either "user" or "admin"',
		},
	},

	// 生命周期钩子
	hooks: {
		/**
		 * 更新前钩子 - 处理特殊字段
		 */
		beforeUpdate: async (id, data, existing) => {
			// 邮箱转小写
			if (data.email) {
				data.email = data.email.toLowerCase();
			}

			// 用户名转小写
			if (data.username) {
				data.username = data.username.toLowerCase();
			}

			// 如果修改了邮箱，将 emailVerified 设为 false
			if (data.email && data.email !== existing.email) {
				data.emailVerified = false;
			}

			return data;
		},

		/**
		 * 删除前钩子 - 检查是否可以删除
		 */
		beforeDelete: async (id, existing) => {
			// 防止删除管理员自己
			// 注意：这里需要获取当前管理员 ID，通过 checkAdminAction 已经做了检查
			// 如果需要更严格的检查，可以在这里添加

			// 可以添加其他逻辑，比如检查用户是否有未完成的订单等
			// 如果不允许删除，返回 false
			// return false;

			return true; // 允许删除
		},

		/**
		 * 删除后钩子 - 清理关联数据
		 */
		afterDelete: async (id, deleted) => {
			// 这里可以添加删除关联数据的逻辑
			// 例如：删除用户的所有图片生成记录、积分记录等

			console.log(`User ${id} deleted, cleaning up related data...`);

			// 示例：清理用户的会话数据
			// const sessionsCollection = await getCollection('sessions');
			// await sessionsCollection.deleteMany({ userId: id });
		},

		/**
		 * 批量更新前钩子
		 */
		beforeBatchUpdate: async (ids, data) => {
			// 邮箱转小写
			if (data.email) {
				data.email = data.email.toLowerCase();
			}

			// 用户名转小写
			if (data.username) {
				data.username = data.username.toLowerCase();
			}

			return data;
		},

		/**
		 * 批量删除前钩子 - 防止删除所有管理员
		 */
		beforeBatchDelete: async (ids) => {
			// 检查是否会删除所有管理员
			const { getCollection } = await import('@/lib/mongodb');
			const usersCollection = await getCollection('users');

			const adminCount = await usersCollection.countDocuments({
				role: 'admin',
				$or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
			});

			const deletingAdmins = await usersCollection.countDocuments({
				id: { $in: ids },
				role: 'admin',
			});

			if (adminCount - deletingAdmins < 1) {
				throw new Error('Cannot delete all administrators');
			}

			return true;
		},
	},

	// 数据转换
	transforms: {
		/**
		 * 输入转换 - 处理写入数据库前的数据
		 */
		input: (data) => {
			// 确保布尔值类型正确
			if (data.emailVerified !== undefined) {
				data.emailVerified = data.emailVerified === true || data.emailVerified === 'true';
			}

			if (data.banned !== undefined) {
				data.banned = data.banned === true || data.banned === 'true';
			}

			return data;
		},

		/**
		 * 输出转换 - 处理从数据库读取后的数据
		 */
		output: (data) => {
			// 移除敏感字段（如果有）
			// 注意：password 等字段在我们的系统中由 better-auth 管理，不在 users 表中

			// 确保 Better Auth 的 id 字段存在
			// MongoDB 查询可能只返回 _id，需要确保 id 字段也存在
			if (!data.id && data._id) {
				// 如果没有 id 但有 _id，可能需要从数据库重新获取完整数据
				// 或者检查数据库中是否真的有 id 字段
				console.warn('[UserCRUD] User record missing "id" field, only has "_id":', data._id);
			}

			// 确保日期字段格式正确
			if (data.createdAt && !(data.createdAt instanceof Date)) {
				data.createdAt = new Date(data.createdAt);
			}

			if (data.updatedAt && !(data.updatedAt instanceof Date)) {
				data.updatedAt = new Date(data.updatedAt);
			}

			if (data.lastLoginAt && !(data.lastLoginAt instanceof Date)) {
				data.lastLoginAt = new Date(data.lastLoginAt);
			}

			if (data.packageExpireAt && !(data.packageExpireAt instanceof Date)) {
				data.packageExpireAt = new Date(data.packageExpireAt);
			}

			return data;
		},
	},

	// 启用软删除
	softDelete: true,
};

