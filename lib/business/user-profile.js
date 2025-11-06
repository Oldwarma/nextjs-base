import { getOne, updateOne, exists, count, getList, getPage } from '../database/db-api';

/**
 * 用户资料管理类
 * 处理用户个人信息的查询和更新
 * 使用统一的 DB API 接口
 */

/**
 * 获取用户完整资料
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 用户资料
 */
export async function getUserProfile(userId) {
			const { ObjectId } = await import("mongodb");
		const user = await getOne({
		dbName: 'users',
		whereJson: { _id: new ObjectId(userId) },
	});

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
			const { ObjectId } = await import("mongodb");
		if (!name || name.trim().length === 0) {
		throw new Error('Name cannot be empty');
	}

	if (name.length > 50) {
		throw new Error('Name is too long (max 50 characters)');
	}

	const modifiedCount = await updateOne({
		dbName: 'users',
		whereJson: { _id: new ObjectId(userId) },
		dataJson: {
			name: name.trim(),
		},
	});

	if (modifiedCount === 0) {
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
			const { ObjectId } = await import("mongodb");
		if (!imageUrl) {
		throw new Error('Image URL cannot be empty');
	}

	// 简单的URL格式验证
	try {
		new URL(imageUrl);
	} catch (error) {
		throw new Error('Invalid image URL format');
	}

	const modifiedCount = await updateOne({
		dbName: 'users',
		whereJson: { _id: new ObjectId(userId) },
		dataJson: {
			image: imageUrl,
		},
	});

	if (modifiedCount === 0) {
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

	// 检查邮箱是否已被其他用户使用
	const emailExists = await exists({
		dbName: 'users',
		whereJson: {
			email: email.toLowerCase(),
			id: { $ne: userId },
		},
	});

	if (emailExists) {
		throw new Error('Email is already in use');
	}

	const modifiedCount = await updateOne({
		dbName: 'users',
		whereJson: { _id: new ObjectId(userId) },
		dataJson: {
			email: email.toLowerCase(),
			emailVerified: false, // 更改邮箱后需要重新验证
		},
	});

	if (modifiedCount === 0) {
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

	// 检查用户名是否已被使用
	const usernameExists = await exists({
		dbName: 'users',
		whereJson: {
			username: username.toLowerCase(),
			id: { $ne: userId },
		},
	});

	if (usernameExists) {
		throw new Error('Username is already taken');
	}

	const modifiedCount = await updateOne({
		dbName: 'users',
		whereJson: { _id: new ObjectId(userId) },
		dataJson: {
			username: username.toLowerCase(),
		},
	});

	if (modifiedCount === 0) {
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
						const usernameExists = await exists({
							dbName: 'users',
							whereJson: {
								username: updates.username.toLowerCase(),
								id: { $ne: userId },
							},
						});

						if (usernameExists) {
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

	const modifiedCount = await updateOne({
		dbName: 'users',
		whereJson: { _id: new ObjectId(userId) },
		dataJson: updateData,
	});

	if (modifiedCount === 0) {
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
			const { ObjectId } = await import("mongodb");
		// 获取用户基本信息
	const user = await getOne({
		dbName: 'users',
		whereJson: { _id: new ObjectId(userId) },
	});

	if (!user) {
		throw new Error('User not found');
	}

	// 获取套餐购买统计
	const totalPackagesPurchased = await count({
		dbName: 'user_packages',
		whereJson: { userId },
	});

	const activePackages = await count({
		dbName: 'user_packages',
		whereJson: { userId, status: 'active' },
	});

	// 获取使用统计
	const totalUsages = await count({
		dbName: 'usage_logs',
		whereJson: { userId },
	});

	const successfulUsages = await count({
		dbName: 'usage_logs',
		whereJson: { userId, status: 'success' },
	});

	// 获取积分统计
	const creditStats = {
		current: user.credits || 0,
		totalEarned: user.totalCreditsEarned || 0,
		totalUsed: user.totalCreditsUsed || 0,
	};

	// 获取最近的活动时间
	const recentTransactions = await getList({
		dbName: 'credit_transactions',
		whereJson: { userId },
		sortJson: { createdAt: -1 },
		limit: 1,
	});
	const lastCreditActivity = recentTransactions[0]?.createdAt || null;

	const recentUsages = await getList({
		dbName: 'usage_logs',
		whereJson: { userId },
		sortJson: { createdAt: -1 },
		limit: 1,
	});
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

	const usernameExists = await exists({
		dbName: 'users',
		whereJson: { username: username.toLowerCase() },
	});

	return {
		available: !usernameExists,
		reason: usernameExists ? 'Username is already taken' : null,
	};
}

/**
 * 获取用户列表（管理员）
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 分页结果
 */
export async function getUserList(options = {}) {
	const { pageIndex = 1, pageSize = 20, role = null, search = null, includeDeleted = false } = options;

	// 构建查询条件
	const whereJson = {};

	// 排除已删除的用户（如果不包括已删除用户）
	if (!includeDeleted) {
		whereJson.$or = [{ deletedAt: { $exists: false } }, { deletedAt: null }];
	}

	// 角色筛选
	if (role) {
		// 如果已经有 $or 条件，需要合并
		if (whereJson.$or) {
			whereJson.$and = [{ $or: whereJson.$or }, { role }];
			delete whereJson.$or;
		} else {
			whereJson.role = role;
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

		if (whereJson.$and) {
			whereJson.$and.push(searchCondition);
		} else if (whereJson.$or) {
			whereJson.$and = [{ $or: whereJson.$or }, searchCondition];
			delete whereJson.$or;
		} else {
			Object.assign(whereJson, searchCondition);
		}
	}

	try {
		const result = await getPage({
			dbName: 'users',
			whereJson,
			pageIndex,
			pageSize,
			sortJson: { createdAt: -1 },
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
			const { ObjectId } = await import("mongodb");
		const allowedRoles = ['user', 'admin'];
	if (!allowedRoles.includes(role)) {
		throw new Error('Invalid role');
	}

	const modifiedCount = await updateOne({
		dbName: 'users',
		whereJson: { _id: new ObjectId(userId) },
		dataJson: {
			role,
		},
	});

	if (modifiedCount === 0) {
		throw new Error('User not found or no changes made');
	}

	return {
		success: true,
		userId,
		role,
	};
}
