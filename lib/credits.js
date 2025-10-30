import { getCollection } from './mongodb';

/**
 * 积分管理类
 * 处理用户积分的增减、过期等操作
 */

/**
 * 获取用户当前可用积分
 * @param {string} userId - 用户ID
 * @returns {Promise<number>} 可用积分数
 */
export async function getUserCredits(userId) {
	const usersCollection = await getCollection('users');
	const user = await usersCollection.findOne({ id: userId });
	return user?.credits || 0;
}

/**
 * 获取用户积分详细信息
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 积分详细信息
 */
export async function getUserCreditsInfo(userId) {
	const usersCollection = await getCollection('users');
	const user = await usersCollection.findOne({ id: userId });

	if (!user) {
		throw new Error('User not found');
	}

	return {
		credits: user.credits || 0,
		totalCreditsEarned: user.totalCreditsEarned || 0,
		totalCreditsUsed: user.totalCreditsUsed || 0,
	};
}

/**
 * 增加用户积分
 * @param {string} userId - 用户ID
 * @param {number} amount - 积分数量（正数）
 * @param {Object} options - 选项
 * @param {string} options.reason - 原因
 * @param {string} options.relatedId - 关联ID（订单ID等）
 * @param {Date} options.expireAt - 积分过期时间
 * @returns {Promise<Object>} 操作结果
 */
export async function addCredits(userId, amount, options = {}) {
	if (amount <= 0) {
		throw new Error('Amount must be positive');
	}

	const { reason = 'manual_adjustment', relatedId = null, expireAt = null } = options;

	const usersCollection = await getCollection('users');
	const transactionsCollection = await getCollection('credit_transactions');

	// 获取当前用户信息
	const user = await usersCollection.findOne({ id: userId });
	if (!user) {
		throw new Error('User not found');
	}

	const newBalance = (user.credits || 0) + amount;

	// 更新用户积分
	await usersCollection.updateOne(
		{ id: userId },
		{
			$inc: {
				credits: amount,
				totalCreditsEarned: amount,
			},
		}
	);

	// 记录交易
	const transaction = {
		userId,
		type: 'earn',
		amount,
		balance: newBalance,
		reason,
		relatedId,
		expireAt,
		createdAt: new Date(),
	};

	await transactionsCollection.insertOne(transaction);

	return {
		success: true,
		newBalance,
		transaction,
	};
}

/**
 * 扣除用户积分
 * @param {string} userId - 用户ID
 * @param {number} amount - 积分数量（正数）
 * @param {Object} options - 选项
 * @param {string} options.reason - 原因
 * @param {string} options.relatedId - 关联ID（使用记录ID等）
 * @returns {Promise<Object>} 操作结果
 */
export async function deductCredits(userId, amount, options = {}) {
	if (amount <= 0) {
		throw new Error('Amount must be positive');
	}

	const { reason = 'usage', relatedId = null } = options;

	const usersCollection = await getCollection('users');
	const transactionsCollection = await getCollection('credit_transactions');

	// 获取当前用户信息
	const user = await usersCollection.findOne({ id: userId });
	if (!user) {
		throw new Error('User not found');
	}

	const currentCredits = user.credits || 0;

	// 检查余额是否足够
	if (currentCredits < amount) {
		return {
			success: false,
			error: 'Insufficient credits',
			required: amount,
			available: currentCredits,
			shortage: amount - currentCredits,
		};
	}

	const newBalance = currentCredits - amount;

	// 更新用户积分
	await usersCollection.updateOne(
		{ id: userId },
		{
			$inc: {
				credits: -amount,
				totalCreditsUsed: amount,
			},
		}
	);

	// 记录交易
	const transaction = {
		userId,
		type: 'spend',
		amount: -amount,
		balance: newBalance,
		reason,
		relatedId,
		expireAt: null,
		createdAt: new Date(),
	};

	await transactionsCollection.insertOne(transaction);

	return {
		success: true,
		newBalance,
		transaction,
	};
}

/**
 * 退还用户积分
 * @param {string} userId - 用户ID
 * @param {number} amount - 积分数量
 * @param {Object} options - 选项
 * @param {string} options.reason - 原因
 * @param {string} options.relatedId - 关联ID
 * @returns {Promise<Object>} 操作结果
 */
export async function refundCredits(userId, amount, options = {}) {
	if (amount <= 0) {
		throw new Error('Amount must be positive');
	}

	const { reason = 'refund', relatedId = null } = options;

	const usersCollection = await getCollection('users');
	const transactionsCollection = await getCollection('credit_transactions');

	// 获取当前用户信息
	const user = await usersCollection.findOne({ id: userId });
	if (!user) {
		throw new Error('User not found');
	}

	const newBalance = (user.credits || 0) + amount;

	// 更新用户积分（退款不计入 totalCreditsEarned）
	await usersCollection.updateOne(
		{ id: userId },
		{
			$inc: {
				credits: amount,
				totalCreditsUsed: -amount, // 减少使用量
			},
		}
	);

	// 记录交易
	const transaction = {
		userId,
		type: 'refund',
		amount,
		balance: newBalance,
		reason,
		relatedId,
		expireAt: null,
		createdAt: new Date(),
	};

	await transactionsCollection.insertOne(transaction);

	return {
		success: true,
		newBalance,
		transaction,
	};
}

/**
 * 获取用户积分交易记录
 * @param {string} userId - 用户ID
 * @param {Object} options - 查询选项
 * @param {number} options.pageIndex - 页码
 * @param {number} options.pageSize - 每页数量
 * @param {string} options.type - 交易类型筛选
 * @returns {Promise<Object>} 分页结果
 */
export async function getCreditTransactions(userId, options = {}) {
	const { pageIndex = 1, pageSize = 20, type = null } = options;

	const transactionsCollection = await getCollection('credit_transactions');

	const query = { userId };
	if (type) {
		query.type = type;
	}

	return transactionsCollection.findWithPagination({
		query,
		pageIndex,
		pageSize,
		sort: { createdAt: -1 },
	});
}

/**
 * 处理过期积分
 * 定时任务调用，将过期的积分标记并从用户余额中扣除
 * @returns {Promise<Object>} 处理结果
 */
export async function processExpiredCredits() {
	const transactionsCollection = await getCollection('credit_transactions');
	const usersCollection = await getCollection('users');

	// 查找所有未过期但现在已过期的积分记录
	const expiredTransactions = await transactionsCollection.find({
		type: 'earn',
		expireAt: { $lte: new Date(), $ne: null },
		// 可以添加一个标记字段来标识是否已处理
	});

	let totalExpired = 0;
	const results = [];

	for (const transaction of expiredTransactions) {
		const { userId, amount } = transaction;

		// 扣除用户积分
		const result = await usersCollection.updateOne(
			{ id: userId, credits: { $gte: amount } },
			{
				$inc: { credits: -amount },
			}
		);

		if (result.modifiedCount > 0) {
			// 记录过期交易
			await transactionsCollection.insertOne({
				userId,
				type: 'expire',
				amount: -amount,
				balance: 0, // 需要重新查询用户才能知道余额
				reason: 'credits_expired',
				relatedId: transaction._id?.toString(),
				expireAt: null,
				createdAt: new Date(),
			});

			totalExpired += amount;
			results.push({ userId, amount });
		}
	}

	return {
		success: true,
		totalExpired,
		affectedUsers: results.length,
		results,
	};
}

/**
 * 管理员手动调整积分
 * @param {string} userId - 用户ID
 * @param {number} amount - 调整数量（可以是正数或负数）
 * @param {string} reason - 调整原因
 * @returns {Promise<Object>} 操作结果
 */
export async function adminAdjustCredits(userId, amount, reason = 'admin_adjustment') {
	if (amount === 0) {
		throw new Error('Amount cannot be zero');
	}

	if (amount > 0) {
		return addCredits(userId, amount, { reason });
	} else {
		return deductCredits(userId, Math.abs(amount), { reason });
	}
}

/**
 * 批量赠送积分（营销活动）
 * @param {Array<string>} userIds - 用户ID数组
 * @param {number} amount - 积分数量
 * @param {Object} options - 选项
 * @returns {Promise<Object>} 操作结果
 */
export async function batchGrantCredits(userIds, amount, options = {}) {
	const { reason = 'promotion', expireAt = null } = options;

	const results = {
		success: [],
		failed: [],
	};

	for (const userId of userIds) {
		try {
			await addCredits(userId, amount, { reason, expireAt });
			results.success.push(userId);
		} catch (error) {
			results.failed.push({ userId, error: error.message });
		}
	}

	return {
		total: userIds.length,
		successCount: results.success.length,
		failedCount: results.failed.length,
		results,
	};
}

