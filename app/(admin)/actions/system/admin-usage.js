'use server';

/**
 * 使用记录管理 Server Actions
 * 使用核心库自动处理权限验证和日志记录
 */

import { createReadOnlyActions } from '@/lib/core/crud-helper';
import { wrapQueryAction } from '@/lib/core/action-wrapper';
import { usageCrudConfig } from './configs/usage-crud.config';
import { getSystemUsageStatistics, getSystemUsageLogs } from '@/lib/logging/usage-logs';

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
export const getSystemUsageStatsAction = wrapQueryAction('usage', async ({ timeRange = '7d' } = {}) => {
	const stats = await getSystemUsageStatistics(timeRange);
	
	return {
		success: true,
		data: stats,
	};
});

/**
 * 获取用户使用统计
 */
export const getUserUsageStatsAction = wrapQueryAction('usage', async ({ userId, timeRange = '7d' } = {}) => {
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
});
