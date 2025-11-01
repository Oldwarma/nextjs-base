import { getCollection } from './mongodb';

/**
 * 用户资料管理类
 * 处理用户个人信息的查询和更新
 */

/**
 * 获取用户完整资料
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 用户资料
 */
export async function getUserProfile(userId) {
	const usersCollection = await getCollection('users');
	const user = await usersCollection.findOne({ id: userId });

	if (!user) {
		throw new Error('User not found');
	}

	// 移除敏感信息
	const { password, ...profile } = user;

	return profile;
}

/**
 * 更新用户昵称
 * @param {string} userId - 用户ID
 * @param {string} name - 新昵称
 * @returns {Promise<Object>} 更新结果
 */
export async function updateUserName(userId, name) {
	if (!name || name.trim().length === 0) {
		throw new Error('Name cannot be empty');
	}

	if (name.length > 50) {
		throw new Error('Name is too long (max 50 characters)');
	}

	const usersCollection = await getCollection('users');

	const result = await usersCollection.updateOne(
		{ id: userId },
		{
			$set: {
				name: name.trim(),
				updatedAt: new Date(),
			},
		}
	);

	if (result.modifiedCount === 0) {
		throw new Error('User not found or no changes made');
	}

	return {
		success: true,
		name: name.trim(),
	};
}

/**
 * 更新用户头像
 * @param {string} userId - 用户ID
 * @param {string} imageUrl - 头像URL
 * @returns {Promise<Object>} 更新结果
 */
export async function updateUserImage(userId, imageUrl) {
	if (!imageUrl) {
		throw new Error('Image URL cannot be empty');
	}

	// 简单的URL格式验证
	try {
		new URL(imageUrl);
	} catch (error) {
		throw new Error('Invalid image URL format');
	}

	const usersCollection = await getCollection('users');

	const result = await usersCollection.updateOne(
		{ id: userId },
		{
			$set: {
				image: imageUrl,
				updatedAt: new Date(),
			},
		}
	);

	if (result.modifiedCount === 0) {
		throw new Error('User not found or no changes made');
	}

	return {
		success: true,
		image: imageUrl,
	};
}

/**
 * 更新用户邮箱
 * @param {string} userId - 用户ID
 * @param {string} email - 新邮箱
 * @returns {Promise<Object>} 更新结果
 */
export async function updateUserEmail(userId, email) {
	if (!email) {
		throw new Error('Email cannot be empty');
	}

	// 简单的邮箱格式验证
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		throw new Error('Invalid email format');
	}

	const usersCollection = await getCollection('users');

	// 检查邮箱是否已被其他用户使用
	const existingUser = await usersCollection.findOne({ email, id: { $ne: userId } });
	if (existingUser) {
		throw new Error('Email is already in use');
	}

	const result = await usersCollection.updateOne(
		{ id: userId },
		{
			$set: {
				email: email.toLowerCase(),
				emailVerified: false, // 更改邮箱后需要重新验证
				updatedAt: new Date(),
			},
		}
	);

	if (result.modifiedCount === 0) {
		throw new Error('User not found or no changes made');
	}

	return {
		success: true,
		email: email.toLowerCase(),
		message: 'Email updated. Please verify your new email address.',
	};
}

/**
 * 更新用户名（username）
 * @param {string} userId - 用户ID
 * @param {string} username - 新用户名
 * @returns {Promise<Object>} 更新结果
 */
export async function updateUsername(userId, username) {
	if (!username || username.trim().length === 0) {
		throw new Error('Username cannot be empty');
	}

	// 用户名格式验证：只允许字母、数字、下划线，3-20个字符
	const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
	if (!usernameRegex.test(username)) {
		throw new Error('Username must be 3-20 characters and contain only letters, numbers, and underscores');
	}

	const usersCollection = await getCollection('users');

	// 检查用户名是否已被使用
	const existingUser = await usersCollection.findOne({ username, id: { $ne: userId } });
	if (existingUser) {
		throw new Error('Username is already taken');
	}

	const result = await usersCollection.updateOne(
		{ id: userId },
		{
			$set: {
				username: username.toLowerCase(),
				updatedAt: new Date(),
			},
		}
	);

	if (result.modifiedCount === 0) {
		throw new Error('User not found or no changes made');
	}

	return {
		success: true,
		username: username.toLowerCase(),
	};
}

/**
 * 批量更新用户资料
 * @param {string} userId - 用户ID
 * @param {Object} updates - 更新数据
 * @returns {Promise<Object>} 更新结果
 */
export async function updateUserProfile(userId, updates) {
	const allowedFields = ['name', 'image', 'username'];
	const updateData = {};

	// 验证并处理每个字段
	for (const field of allowedFields) {
		if (updates[field] !== undefined) {
			switch (field) {
				case 'name':
					if (!updates.name || updates.name.trim().length === 0) {
						throw new Error('Name cannot be empty');
					}
					if (updates.name.length > 50) {
						throw new Error('Name is too long (max 50 characters)');
					}
					updateData.name = updates.name.trim();
					break;

				case 'image':
					if (updates.image) {
						try {
							new URL(updates.image);
							updateData.image = updates.image;
						} catch (error) {
							throw new Error('Invalid image URL format');
						}
					}
					break;

				case 'username':
					if (updates.username) {
						const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
						if (!usernameRegex.test(updates.username)) {
							throw new Error('Username must be 3-20 characters and contain only letters, numbers, and underscores');
						}

						// 检查用户名是否已被使用
						const usersCollection = await getCollection('users');
						const existingUser = await usersCollection.findOne({
							username: updates.username.toLowerCase(),
							id: { $ne: userId },
						});
						if (existingUser) {
							throw new Error('Username is already taken');
						}

						updateData.username = updates.username.toLowerCase();
					}
					break;
			}
		}
	}

	if (Object.keys(updateData).length === 0) {
		throw new Error('No valid fields to update');
	}

	updateData.updatedAt = new Date();

	const usersCollection = await getCollection('users');
	const result = await usersCollection.updateOne({ id: userId }, { $set: updateData });

	if (result.modifiedCount === 0) {
		throw new Error('User not found or no changes made');
	}

	return {
		success: true,
		updated: updateData,
	};
}

/**
 * 获取用户统计信息
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 统计信息
 */
export async function getUserStatistics(userId) {
	const usersCollection = await getCollection('users');
	const userPackagesCollection = await getCollection('user_packages');
	const usageLogsCollection = await getCollection('usage_logs');
	const creditTransactionsCollection = await getCollection('credit_transactions');

	const user = await usersCollection.findOne({ id: userId });
	if (!user) {
		throw new Error('User not found');
	}

	// 获取套餐购买统计
	const totalPackagesPurchased = await userPackagesCollection.count({ userId });
	const activePackages = await userPackagesCollection.count({ userId, status: 'active' });

	// 获取使用统计
	const totalUsages = await usageLogsCollection.count({ userId });
	const successfulUsages = await usageLogsCollection.count({ userId, status: 'success' });

	// 获取积分统计
	const creditStats = {
		current: user.credits || 0,
		totalEarned: user.totalCreditsEarned || 0,
		totalUsed: user.totalCreditsUsed || 0,
	};

	// 获取最近的活动时间
	const recentTransactions = await creditTransactionsCollection.find(
		{ userId },
		{ limit: 1, sort: { createdAt: -1 } }
	);
	const lastCreditActivity = recentTransactions[0]?.createdAt || null;

	const recentUsages = await usageLogsCollection.find(
		{ userId },
		{ limit: 1, sort: { createdAt: -1 } }
	);
	const lastUsageActivity = recentUsages[0]?.createdAt || null;

	return {
		userId,
		credits: creditStats,
		packages: {
			total: totalPackagesPurchased,
			active: activePackages,
		},
		usage: {
			total: totalUsages,
			successful: successfulUsages,
			failureRate: totalUsages > 0 ? ((totalUsages - successfulUsages) / totalUsages) * 100 : 0,
		},
		activity: {
			lastCreditActivity,
			lastUsageActivity,
			memberSince: user.createdAt,
			lastLogin: user.lastLoginAt,
		},
	};
}

/**
 * 检查用户名是否可用
 * @param {string} username - 要检查的用户名
 * @returns {Promise<Object>} 检查结果
 */
export async function checkUsernameAvailability(username) {
	if (!username) {
		return {
			available: false,
			reason: 'Username cannot be empty',
		};
	}

	const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
	if (!usernameRegex.test(username)) {
		return {
			available: false,
			reason: 'Username must be 3-20 characters and contain only letters, numbers, and underscores',
		};
	}

	const usersCollection = await getCollection('users');
	const existingUser = await usersCollection.findOne({ username: username.toLowerCase() });

	return {
		available: !existingUser,
		reason: existingUser ? 'Username is already taken' : null,
	};
}

/**
 * 获取用户列表（管理员）
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 分页结果
 */
export async function getUserList(options = {}) {
	const { pageIndex = 1, pageSize = 20, role = null, search = null, includeDeleted = false } = options;

	const usersCollection = await getCollection('users');

	// 构建查询条件
	const query = {};

	// 排除已删除的用户（如果不包括已删除用户）
	if (!includeDeleted) {
		// 只查询 deletedAt 不存在或为 null 的用户
		query.$or = [{ deletedAt: { $exists: false } }, { deletedAt: null }];
	}

	// 角色筛选
	if (role) {
		// 如果已经有 $or 条件，需要合并
		if (query.$or) {
			query.$and = [{ $or: query.$or }, { role }];
			delete query.$or;
		} else {
			query.role = role;
		}
	}

	// 搜索条件
	if (search) {
		const searchCondition = {
			$or: [
				{ name: { $regex: search, $options: 'i' } },
				{ email: { $regex: search, $options: 'i' } },
				{ username: { $regex: search, $options: 'i' } },
			],
		};

		if (query.$and) {
			query.$and.push(searchCondition);
		} else if (query.$or) {
			query.$and = [{ $or: query.$or }, searchCondition];
			delete query.$or;
		} else {
			Object.assign(query, searchCondition);
		}
	}

	// console.log('getUserList query:', JSON.stringify(query, null, 2));

	try {
		const result = await usersCollection.findWithPagination({
			query,
			pageIndex,
			pageSize,
			sort: { createdAt: -1 },
		});

		console.log('getUserList result:', {
			total: result.total,
			rowsCount: result.rows?.length,
			pageIndex: result.pageIndex,
		});

		return result;
	} catch (error) {
		console.error('getUserList error:', error);
		throw error;
	}
}

/**
 * 更新用户角色（管理员）
 * @param {string} userId - 用户ID
 * @param {string} role - 新角色
 * @returns {Promise<Object>} 更新结果
 */
export async function updateUserRole(userId, role) {
	const allowedRoles = ['user', 'admin'];
	if (!allowedRoles.includes(role)) {
		throw new Error('Invalid role');
	}

	const usersCollection = await getCollection('users');

	const result = await usersCollection.updateOne(
		{ id: userId },
		{
			$set: {
				role,
				updatedAt: new Date(),
			},
		}
	);

	if (result.modifiedCount === 0) {
		throw new Error('User not found or no changes made');
	}

	return {
		success: true,
		userId,
		role,
	};
}

