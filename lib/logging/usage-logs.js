import { getOne, add, update, del, getPage, getList } from './db-api';
import { deductCredits, getUserCredits } from './credits';

/**
 * 使用记录管理类
 * 处理用户功能使用记录、积分扣除等操作
 * 使用统一的 DB API 接口
 */

/**
 * 功能价格配置
 * 可以从数据库或配置文件读取
 */
const FEATURE_PRICES = {
	text_to_image: {
		base: 10, // 基础价格
		multipliers: {
			// 尺寸倍率
			'512x512': 1,
			'768x768': 1.5,
			'1024x1024': 2,
			// 模型倍率
			standard: 1,
			hd: 1.5,
			premium: 2,
		},
	},
	image_to_image: {
		base: 8,
		multipliers: {
			'512x512': 1,
			'768x768': 1.5,
			'1024x1024': 2,
			standard: 1,
			hd: 1.5,
		},
	},
	upscale: {
		base: 5,
		multipliers: {
			'2x': 1,
			'4x': 2,
		},
	},
	remove_background: {
		base: 3,
		multipliers: {},
	},
};

/**
 * 计算功能使用所需积分
 * @param {string} action - 功能类型
 * @param {Object} parameters - 使用参数
 * @returns {number} 所需积分
 */
export function calculateCreditsNeeded(action, parameters = {}) {
	const priceConfig = FEATURE_PRICES[action];
	if (!priceConfig) {
		throw new Error(`Unknown action: ${action}`);
	}

	let credits = priceConfig.base;

	// 应用倍率
	for (const [key, value] of Object.entries(parameters)) {
		if (priceConfig.multipliers[value]) {
			credits *= priceConfig.multipliers[value];
		}
	}

	return Math.ceil(credits);
}

/**
 * 创建使用记录（带积分扣除）
 * @param {string} userId - 用户ID
 * @param {Object} usageData - 使用数据
 * @returns {Promise<Object>} 创建结果
 */
export async function createUsageLog(userId, usageData) {
	const { action, parameters = {}, result = null, status = 'pending' } = usageData;

	// 计算所需积分
	const creditsNeeded = calculateCreditsNeeded(action, parameters);

	// 检查用户积分是否足够
	const currentCredits = await getUserCredits(userId);
	if (currentCredits < creditsNeeded) {
		throw new Error(`Insufficient credits. Required: ${creditsNeeded}, Available: ${currentCredits}`);
	}

	// 创建使用记录
	const usageLog = {
		userId,
		action,
		creditsUsed: creditsNeeded,
		parameters,
		result,
		status,
		completedAt: status === 'success' ? new Date() : null,
	};

	const usageId = await add({
		dbName: 'usage_logs',
		dataJson: usageLog,
	});

	// 扣除积分
	const deductResult = await deductCredits(userId, creditsNeeded, {
		reason: action,
		relatedId: usageId.toString(),
	});

	if (!deductResult.success) {
		// 如果扣除失败，删除刚创建的记录
		await del({
			dbName: 'usage_logs',
			_id: usageId,
		});
		throw new Error(deductResult.error || 'Failed to deduct credits');
	}

	return {
		success: true,
		usageId,
		creditsUsed: creditsNeeded,
		remainingCredits: deductResult.newBalance,
		usageLog: {
			...usageLog,
			_id: usageId,
		},
	};
}

/**
 * 更新使用记录状态
 * @param {string} usageId - 使用记录ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise<Object>} 更新结果
 */
export async function updateUsageLog(usageId, updateData) {
	const { status, result, error = null } = updateData;

	const updateFields = {};
	if (status) {
		updateFields.status = status;
		if (status === 'success' || status === 'failed') {
			updateFields.completedAt = new Date();
		}
	}
	if (result !== undefined) {
		updateFields.result = result;
	}
	if (error) {
		updateFields.error = error;
	}

	const modifiedCount = await update({
		dbName: 'usage_logs',
		_id: usageId,
		dataJson: updateFields,
	});

	if (modifiedCount === 0) {
		throw new Error('Usage log not found or no changes made');
	}

	return {
		success: true,
		usageId,
	};
}

/**
 * 获取用户使用记录
 * @param {string} userId - 用户ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 分页结果
 */
export async function getUserUsageLogs(userId, options = {}) {
	const { pageIndex = 1, pageSize = 20, action = null, status = null, startDate = null, endDate = null } = options;

	const whereJson = { userId };

	if (action) {
		whereJson.action = action;
	}

	if (status) {
		whereJson.status = status;
	}

	if (startDate || endDate) {
		whereJson.createdAt = {};
		if (startDate) {
			whereJson.createdAt.$gte = new Date(startDate);
		}
		if (endDate) {
			whereJson.createdAt.$lte = new Date(endDate);
		}
	}

	return await getPage({
		dbName: 'usage_logs',
		whereJson,
		pageIndex,
		pageSize,
		sortJson: { createdAt: -1 },
	});
}

/**
 * 获取用户使用统计
 * @param {string} userId - 用户ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 统计信息
 */
export async function getUserUsageStatistics(userId, options = {}) {
	const { startDate = null, endDate = null } = options;

	const whereJson = { userId };

	if (startDate || endDate) {
		whereJson.createdAt = {};
		if (startDate) {
			whereJson.createdAt.$gte = new Date(startDate);
		}
		if (endDate) {
			whereJson.createdAt.$lte = new Date(endDate);
		}
	}

	// 获取所有记录进行统计
	const logs = await getList({
		dbName: 'usage_logs',
		whereJson,
	});

	// 统计各种指标
	const statistics = {
		total: logs.length,
		successful: logs.filter((log) => log.status === 'success').length,
		failed: logs.filter((log) => log.status === 'failed').length,
		pending: logs.filter((log) => log.status === 'pending').length,
		totalCreditsUsed: logs.reduce((sum, log) => sum + (log.creditsUsed || 0), 0),
		byAction: {},
	};

	// 按功能类型统计
	for (const log of logs) {
		if (!statistics.byAction[log.action]) {
			statistics.byAction[log.action] = {
				count: 0,
				creditsUsed: 0,
				successful: 0,
				failed: 0,
			};
		}
		statistics.byAction[log.action].count++;
		statistics.byAction[log.action].creditsUsed += log.creditsUsed || 0;
		if (log.status === 'success') {
			statistics.byAction[log.action].successful++;
		} else if (log.status === 'failed') {
			statistics.byAction[log.action].failed++;
		}
	}

	return statistics;
}

/**
 * 获取使用记录详情
 * @param {string} usageId - 使用记录ID
 * @returns {Promise<Object>} 使用记录详情
 */
export async function getUsageLogById(usageId) {
	const usageLog = await getOne({
		dbName: 'usage_logs',
		whereJson: { _id: usageId },
	});

	if (!usageLog) {
		throw new Error('Usage log not found');
	}

	return usageLog;
}

/**
 * 删除使用记录（管理员）
 * @param {string} usageId - 使用记录ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteUsageLog(usageId) {
	const deletedCount = await del({
		dbName: 'usage_logs',
		_id: usageId,
	});

	if (deletedCount === 0) {
		throw new Error('Usage log not found');
	}

	return {
		success: true,
		usageId,
	};
}

/**
 * 获取全局使用统计（管理员）
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 全局统计信息
 */
export async function getGlobalUsageStatistics(options = {}) {
	const { startDate = null, endDate = null } = options;

	const whereJson = {};

	if (startDate || endDate) {
		whereJson.createdAt = {};
		if (startDate) {
			whereJson.createdAt.$gte = new Date(startDate);
		}
		if (endDate) {
			whereJson.createdAt.$lte = new Date(endDate);
		}
	}

	const logs = await getList({
		dbName: 'usage_logs',
		whereJson,
	});

	// 统计各种指标
	const statistics = {
		total: logs.length,
		successful: logs.filter((log) => log.status === 'success').length,
		failed: logs.filter((log) => log.status === 'failed').length,
		pending: logs.filter((log) => log.status === 'pending').length,
		totalCreditsUsed: logs.reduce((sum, log) => sum + (log.creditsUsed || 0), 0),
		uniqueUsers: new Set(logs.map((log) => log.userId)).size,
		byAction: {},
		byDate: {},
	};

	// 按功能类型统计
	for (const log of logs) {
		if (!statistics.byAction[log.action]) {
			statistics.byAction[log.action] = {
				count: 0,
				creditsUsed: 0,
				successful: 0,
				failed: 0,
			};
		}
		statistics.byAction[log.action].count++;
		statistics.byAction[log.action].creditsUsed += log.creditsUsed || 0;
		if (log.status === 'success') {
			statistics.byAction[log.action].successful++;
		} else if (log.status === 'failed') {
			statistics.byAction[log.action].failed++;
		}

		// 按日期统计
		const dateKey = log.createdAt.toISOString().split('T')[0];
		if (!statistics.byDate[dateKey]) {
			statistics.byDate[dateKey] = {
				count: 0,
				creditsUsed: 0,
			};
		}
		statistics.byDate[dateKey].count++;
		statistics.byDate[dateKey].creditsUsed += log.creditsUsed || 0;
	}

	return statistics;
}

/**
 * 检查用户是否有足够积分执行操作
 * @param {string} userId - 用户ID
 * @param {string} action - 功能类型
 * @param {Object} parameters - 使用参数
 * @returns {Promise<Object>} 检查结果
 */
export async function checkUserCanUseFeature(userId, action, parameters = {}) {
	try {
		const creditsNeeded = calculateCreditsNeeded(action, parameters);
		const currentCredits = await getUserCredits(userId);

		return {
			canUse: currentCredits >= creditsNeeded,
			creditsNeeded,
			currentCredits,
			shortage: Math.max(0, creditsNeeded - currentCredits),
		};
	} catch (error) {
		return {
			canUse: false,
			error: error.message,
		};
	}
}

/**
 * 获取功能价格配置
 * @param {string} action - 功能类型（可选）
 * @returns {Object} 价格配置
 */
export function getFeaturePrices(action = null) {
	if (action) {
		return FEATURE_PRICES[action] || null;
	}
	return FEATURE_PRICES;
}

/**
 * 更新功能价格配置（管理员）
 * @param {string} action - 功能类型
 * @param {Object} priceConfig - 价格配置
 * @returns {Object} 更新结果
 */
export function updateFeaturePrice(action, priceConfig) {
	if (!FEATURE_PRICES[action]) {
		throw new Error(`Unknown action: ${action}`);
	}

	FEATURE_PRICES[action] = {
		...FEATURE_PRICES[action],
		...priceConfig,
	};

	return {
		success: true,
		action,
		priceConfig: FEATURE_PRICES[action],
	};
}

/**
 * 批量获取使用记录（管理员）
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 分页结果
 */
export async function getAllUsageLogs(options = {}) {
	const { pageIndex = 1, pageSize = 20, action = null, status = null, userId = null, startDate = null, endDate = null } = options;

	const whereJson = {};

	if (action) {
		whereJson.action = action;
	}

	if (status) {
		whereJson.status = status;
	}

	if (userId) {
		whereJson.userId = userId;
	}

	if (startDate || endDate) {
		whereJson.createdAt = {};
		if (startDate) {
			whereJson.createdAt.$gte = new Date(startDate);
		}
		if (endDate) {
			whereJson.createdAt.$lte = new Date(endDate);
		}
	}

	return await getPage({
		dbName: 'usage_logs',
		whereJson,
		pageIndex,
		pageSize,
		sortJson: { createdAt: -1 },
	});
}
