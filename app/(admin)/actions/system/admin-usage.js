'use server';

/**
 * 使用记录管理 Server Actions
 * 使用核心库自动处理权限验证和日志记录
 */

import { createReadOnlyActions } from '@/lib/core/crud-helper';
import { wrapAction } from '@/lib/core/action-wrapper';
import { getSystemUsageStatistics, getSystemUsageLogs } from '@/lib/logging/usage-logs';

/**
 * Usage Logs CRUD 配置
 */
const usageCrudConfig = {
	collectionName: 'usage_logs',
	logCategory: 'admin/usage',
	primaryKey: '_id',

	// 字段配置
	fields: {
		// 所有字段都可读
		readable: ['userId', 'action', 'creditsUsed', 'parameters', 'result', 'status', 'completedAt', 'createdAt', 'updatedAt'],

		// 不允许通过 CRUD 创建/更新 usage_logs（只能通过业务逻辑创建）
		creatable: [],
		updatable: ['status', 'result', 'error', 'completedAt'],

		// 搜索字段
		searchable: {
			fields: ['action', 'userId'],
			mode: 'like',
		},
	},

	// 查询配置
	query: {
		defaultSort: { createdAt: -1 },
		defaultPageSize: 20,
		baseFilter: {},
	},

	// 软删除：禁用（usage logs 不应该被删除）
	softDelete: false,
};

/**
 * 创建只读 CRUD Actions（使用记录只能查看）
 */
const crudActions = createReadOnlyActions(usageCrudConfig);

/**
 * 导出标准查询 Actions
 */
export const getUsageListAction = crudActions.getList;
export const getUsageDetailAction = crudActions.getDetail;

/**
 * 自定义 Actions
 */

/**
 * 获取系统使用统计
 */
export const getSystemUsageStatsAction = wrapAction('sysQueryUsageStats', async ({ timeRange = '7d' } = {}, ctx) => {
	const stats = await getSystemUsageStatistics(timeRange);

	return {
		success: true,
		data: stats,
	};
}, { skipLog: true });

/**
 * 获取用户使用统计
 */
export const getUserUsageStatsAction = wrapAction('sysQueryUserUsageStats', async ({ userId, timeRange = '7d' } = {}, ctx) => {
	if (!userId) {
		return {
			success: false,
			error: 'User ID is required',
		};
	}

	const logs = await getSystemUsageLogs({
		userId,
		timeRange,
	});

	return {
		success: true,
		data: logs,
	};
}, { skipLog: true });
