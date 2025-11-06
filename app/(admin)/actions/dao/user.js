/**
 * User DAO - 用户数据访问层
 * 
 * 职责：
 * - 用户的 CRUD 操作
 * - Better Auth 集成
 * - RBAC 角色管理
 * 
 * 数据库主键策略：
 * - users 表：使用 Better Auth 管理的 _id (ObjectId)
 * - 其他表：继续使用 id (UUID)
 * - DAO 层负责将 _id 转换为字符串 id 对外暴露
 */

import { selects, add, updateOne, updateMany, remove } from '@/lib/database/db-api';

/**
 * 字段映射：将 _id (ObjectId) 转换为字符串 id
 * @param {Object} user - 数据库中的用户对象
 * @returns {Object} 映射后的用户对象
 */
function mapUserFields(user) {
	if (!user) return null;
	
	// 将 _id 转换为字符串 id
	const mappedUser = {
		...user,
		id: user._id ? user._id.toString() : user.id,
	};
	
	return mappedUser;
}

/**
 * 批量映射用户字段
 */
function mapUsersFields(users) {
	if (!Array.isArray(users)) return [];
	return users.map(mapUserFields);
}

/**
 * 将外部 id 转换为 MongoDB ObjectId 查询条件
 * @param {string} id - 外部 id（ObjectId 字符串）
 * @returns {Promise<Object>} MongoDB 查询条件 { _id: ObjectId(...) }
 */
async function mapIdToQuery(id) {
	if (!id) {
		throw new Error('Invalid id value: id is required');
	}
	
	const { ObjectId } = await import('mongodb');
	
	// 检查是否是有效的 ObjectId 格式
	if (!ObjectId.isValid(id)) {
		throw new Error(`Invalid ObjectId format: ${id}`);
	}
	
	return { _id: new ObjectId(id) };
}

/**
 * 创建用户
 * @param {Object} userData - 用户数据
 * @returns {Promise<Object>} 创建的用户
 */
export async function createUser(userData) {
	const {
		email,
		password,
		name,
		username,
		role = 'user',
		isBackendAllowed = false,
		roles = [],
		credits = 0,
	} = userData;

	// 使用 Better Auth 提供的官方密码哈希函数
	const { hashPassword } = await import('better-auth/crypto');
	const hashedPassword = await hashPassword(password);

	// 准备用户数据（不需要生成 id，Better Auth 会生成 _id）
	const now = new Date();
	const newUser = {
		email: email.toLowerCase(),
		emailVerified: false,
		name,
		username,
		role,
		roles,
		isBackendAllowed,
		credits,
		totalCreditsEarned: 0,
		totalCreditsUsed: 0,
		banned: false,
		createdAt: now,
		updatedAt: now,
	};

	// 创建用户
	const insertedId = await add({
		dbName: 'users',
		dataJson: newUser,
	});

	if (!insertedId) {
		throw new Error('Failed to create user');
	}

	// 注意：不应该直接调用此函数创建用户
	// 应该使用 Better Auth 的 API (auth.api.signUpEmail)
	// 此函数保留用于特殊情况或数据迁移
	
	// 创建 credential account
	const newAccount = {
		userId: insertedId,
		accountId: email.toLowerCase(),
		providerId: 'credential',
		password: hashedPassword,
		createdAt: now,
		updatedAt: now,
	};

	await add({
		dbName: 'account',
		dataJson: newAccount,
	});

	// 返回完整的用户对象（包含 _id）
	return mapUserFields({ ...newUser, _id: insertedId });
}

/**
 * 更新用户信息
 * @param {string} userId - 用户ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise<Object>} 更新后的用户
 */
export async function updateUser(userId, updateData) {
	const whereJson = await mapIdToQuery(userId);

	// 移除不允许直接更新的字段
	const { id, _id, createdAt, password, ...allowedFields } = updateData;

	const result = await updateOne({
		dbName: 'users',
		whereJson,
		dataJson: {
			...allowedFields,
			updatedAt: new Date(),
		},
	});

	if (!result) {
		throw new Error('User not found');
	}

	// 重新查询更新后的用户
	const updated = await selects({
		dbName: 'users',
		getOne: true,
		whereJson,
	});

	return mapUserFields(updated);
}

/**
 * 删除用户
 * @param {string} userId - 用户ID
 * @returns {Promise<boolean>} 是否删除成功
 */
export async function deleteUser(userId) {
	const whereJson = await mapIdToQuery(userId);

	// 删除用户的账户
	const { ObjectId } = await import('mongodb');
	await remove({
		dbName: 'account',
		whereJson: { userId: new ObjectId(userId) },
	});

	// 删除用户
	const result = await remove({
		dbName: 'users',
		whereJson,
	});

	return result > 0;
}

/**
 * 根据 ID 获取用户
 * @param {string} userId - 用户ID
 * @returns {Promise<Object|null>} 用户对象
 */
export async function getUserById(userId) {
	const whereJson = await mapIdToQuery(userId);

	const user = await selects({
		dbName: 'users',
		getOne: true,
		whereJson,
	});

	return mapUserFields(user);
}

/**
 * 根据邮箱获取用户
 * @param {string} email - 邮箱
 * @returns {Promise<Object|null>} 用户对象
 */
export async function getUserByEmail(email) {
	const user = await selects({
		dbName: 'users',
		getOne: true,
		whereJson: { email: email.toLowerCase() },
	});

	return mapUserFields(user);
}

/**
 * 根据用户名获取用户
 * @param {string} username - 用户名
 * @returns {Promise<Object|null>} 用户对象
 */
export async function getUserByUsername(username) {
	const user = await selects({
		dbName: 'users',
		getOne: true,
		whereJson: { username },
	});

	return mapUserFields(user);
}

/**
 * 获取用户列表（分页）
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 用户列表和分页信息
 */
export async function getUserList({ page = 1, pageSize = 20, filters = {}, sort = { createdAt: -1 } }) {
	// 构建查询条件
	const query = {};

	if (filters.email) {
		query.email = { $regex: filters.email, $options: 'i' };
	}

	if (filters.name) {
		query.name = { $regex: filters.name, $options: 'i' };
	}

	if (filters.role) {
		query.role = filters.role;
	}

	if (filters.isBackendAllowed !== undefined) {
		query.isBackendAllowed = filters.isBackendAllowed;
	}

	if (filters.banned !== undefined) {
		query.banned = filters.banned;
	}

	// 查询用户并关联角色信息
	const results = await selects({
		dbName: 'users',
		whereJson: query,
		pageIndex: page,
		pageSize,
		sortJson: sort,
		getCount: true,
		foreignDB: [
			{
				dbName: 'roles',          // ✅ 使用 dbName 而不是 from
				localKey: 'roles',        // ✅ 使用 localKey 而不是 localField (users.roles 是数组)
				foreignKey: 'id',         // ✅ 使用 foreignKey 而不是 foreignField (roles.id 是 UUID)
				as: 'roleList',           // ✅ 连表结果存放在 roleList 字段
				fieldJson: { id: 1, name: 1, enable: 1 }, // 只返回需要的字段
			},
		],
	});

	return {
		data: mapUsersFields(results.rows || []),
		total: results.total || 0,
		page,
		pageSize,
	};
}

/**
 * 批量更新用户
 * @param {Array<string>} userIds - 用户ID列表
 * @param {Object} updateData - 更新数据
 * @returns {Promise<number>} 更新的用户数量
 */
export async function batchUpdateUsers(userIds, updateData) {
	const { ObjectId } = await import('mongodb');
	const objectIds = userIds.map((id) => new ObjectId(id));

	// 移除不允许直接更新的字段
	const { id, _id, createdAt, password, ...allowedFields } = updateData;

	const result = await updateMany({
		dbName: 'users',
		whereJson: { _id: { $in: objectIds } },
		dataJson: {
			...allowedFields,
			updatedAt: new Date(),
		},
	});

	return result;
}

/**
 * 重置用户密码
 * @param {string} userId - 用户ID
 * @param {string} newPassword - 新密码
 * @returns {Promise<boolean>} 是否重置成功
 */
export async function resetUserPassword(userId, newPassword) {
	// 使用 Better Auth 的密码哈希
	const { hashPassword } = await import('better-auth/crypto');
	const hashedPassword = await hashPassword(newPassword);

	const { ObjectId } = await import('mongodb');

	// 查询用户以获取邮箱
	const user = await getUserById(userId);
	if (!user) {
		throw new Error('User not found');
	}

	// 查找 credential account
	const existingAccount = await selects({
		dbName: 'account',
		getOne: true,
		whereJson: {
			userId: new ObjectId(userId),
			providerId: 'credential',
		},
	});

	if (existingAccount) {
		// 更新现有账户的密码
		await updateOne({
			dbName: 'account',
			whereJson: { _id: existingAccount._id },
			dataJson: {
				password: hashedPassword,
				updatedAt: new Date(),
			},
		});
	} else {
		// 创建新的 credential account（用户可能是通过 OAuth 注册的）
		await add({
			dbName: 'account',
			dataJson: {
				userId: new ObjectId(userId),
				accountId: user.email,
				providerId: 'credential',
				password: hashedPassword,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});
	}

	return true;
}

/**
 * 绑定用户角色
 * @param {string} userId - 用户ID
 * @param {Array<string>} roleIds - 角色ID列表
 * @returns {Promise<boolean>} 是否绑定成功
 */
export async function bindUserRoles(userId, roleIds) {
	const whereJson = await mapIdToQuery(userId);

	await updateOne({
		dbName: 'users',
		whereJson,
		dataJson: {
			roles: roleIds,
			updatedAt: new Date(),
		},
	});

	return true;
}

/**
 * 获取用户的角色列表
 * @param {string} userId - 用户ID
 * @returns {Promise<Array>} 角色列表
 */
export async function getUserRoles(userId) {
	const user = await getUserById(userId);
	if (!user || !user.roles || user.roles.length === 0) {
		return [];
	}

	// 查询角色详情
	const roles = await selects({
		dbName: 'roles',
		getMain: true,
		whereJson: { id: { $in: user.roles } },
	});

	return roles || [];
}

/**
 * 获取用户统计信息
 * @returns {Promise<Object>} 统计信息
 */
export async function getUserStats() {
	const { getDatabase } = await import('@/lib/database/mongodb');
	const db = await getDatabase();

	const totalUsers = await db.collection('users').countDocuments();
	const activeUsers = await db.collection('users').countDocuments({ banned: false });
	const bannedUsers = await db.collection('users').countDocuments({ banned: true });
	const backendUsers = await db.collection('users').countDocuments({ isBackendAllowed: true });

	return {
		totalUsers,
		activeUsers,
		bannedUsers,
		backendUsers,
	};
}
