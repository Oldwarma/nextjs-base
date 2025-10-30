'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import {
	getUserUsageLogs,
	getUserUsageStatistics,
	checkUserCanUseFeature,
	getFeaturePrices,
} from '@/lib/usage-logs';

/**
 * 获取用户使用记录
 * @param {Object} options - 查询选项
 * @param {number} options.pageIndex - 页码
 * @param {number} options.pageSize - 每页数量
 * @param {string} options.action - 功能类型筛选
 * @param {string} options.status - 状态筛选
 * @param {string} options.startDate - 开始日期
 * @param {string} options.endDate - 结束日期
 * @returns {Promise<Object>} 使用记录（分页）
 */
export async function getUserUsageLogsAction(options = {}) {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		return {
			success: false,
			error: 'Unauthorized',
		};
	}

	try {
		const { pageIndex = 1, pageSize = 20, action = null, status = null, startDate = null, endDate = null } = options;

		const logs = await getUserUsageLogs(session.user.id, {
			pageIndex,
			pageSize,
			action,
			status,
			startDate,
			endDate,
		});

		return {
			success: true,
			data: logs,
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * 获取用户使用统计
 * @param {Object} options - 查询选项
 * @param {string} options.startDate - 开始日期
 * @param {string} options.endDate - 结束日期
 * @returns {Promise<Object>} 使用统计
 */
export async function getUserUsageStatisticsAction({ startDate = null, endDate = null } = {}) {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		return {
			success: false,
			error: 'Unauthorized',
		};
	}

	try {
		const stats = await getUserUsageStatistics(session.user.id, {
			startDate,
			endDate,
		});

		return {
			success: true,
			data: stats,
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * 检查用户是否有足够积分使用功能
 * @param {string} action - 功能类型
 * @param {Object} parameters - 使用参数
 * @returns {Promise<Object>} 检查结果
 */
export async function checkUserCanUseFeatureAction(action, parameters = {}) {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		return {
			success: false,
			error: 'Unauthorized',
		};
	}

	try {
		const result = await checkUserCanUseFeature(session.user.id, action, parameters);

		return {
			success: true,
			data: result,
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * 获取功能价格配置
 * @param {string} action - 功能类型（可选）
 * @returns {Promise<Object>} 价格配置
 */
export async function getFeaturePricesAction(action = null) {
	try {
		const prices = getFeaturePrices(action);

		if (action && !prices) {
			return {
				success: false,
				error: 'Feature not found',
			};
		}

		return {
			success: true,
			data: prices,
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

