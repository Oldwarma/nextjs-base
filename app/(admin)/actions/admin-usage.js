'use server';

/**
 * 使用统计 Server Actions
 *
 * 功能：
 * - 获取使用记录列表（支持筛选）
 * - 获取全局使用统计
 * - 获取用户使用统计
 */

import { createCrudActions } from './dao/base';
import { usageCrudConfig } from './configs/usage-crud.config';
import { logAction } from '@/lib/action-logger';

// 创建基础 CRUD Actions
const crudActions = createCrudActions(usageCrudConfig);

// 导出基础 CRUD 方法
export const {
	getList: getUsageListAction,
	getDetail: getUsageDetailAction,
	update: updateUsageAction,
	delete: deleteUsageAction,
} = crudActions;

// 获取 DAO 实例用于统计方法
const { dao } = crudActions;

/**
 * 获取全局使用统计
 * @param {Object} options - 查询选项（startDate, endDate）
 * @returns {Promise<Object>} 统计信息
 */
export async function getUsageStatisticsAction(options = {}) {
	const startTime = Date.now();
	const requestTime = new Date();

	try {
		const { startDate = null, endDate = null } = options;

		// 构建查询条件
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

		// 获取所有符合条件的记录
		const logs = await dao.getAll(whereJson);

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

		const result = { success: true, data: statistics };
		logAction('getUsageStatistics', 'admin/usage', startTime, requestTime, options, result, false);
		return result;
	} catch (error) {
		console.error('Failed to get usage statistics:', error);
		const result = { success: false, error: error.message };
		logAction('getUsageStatistics', 'admin/usage', startTime, requestTime, options, result, true);
		return result;
	}
}

/**
 * 获取用户使用统计
 * @param {string} userId - 用户ID
 * @param {Object} options - 查询选项（startDate, endDate）
 * @returns {Promise<Object>} 用户统计信息
 */
export async function getUserUsageStatisticsAction(userId, options = {}) {
	const startTime = Date.now();
	const requestTime = new Date();
	const params = { userId, ...options };

	try {
		const { startDate = null, endDate = null } = options;

		// 构建查询条件
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

		// 获取用户的所有记录
		const logs = await dao.getAll(whereJson);

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

		const result = { success: true, data: statistics };
		logAction('getUserUsageStatistics', 'admin/usage', startTime, requestTime, params, result, false);
		return result;
	} catch (error) {
		console.error('Failed to get user usage statistics:', error);
		const result = { success: false, error: error.message };
		logAction('getUserUsageStatistics', 'admin/usage', startTime, requestTime, params, result, true);
		return result;
	}
}
