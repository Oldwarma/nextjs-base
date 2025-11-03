'use server';

import { checkAdminAction } from '@/lib/admin-auth';
import { getUserUsageLogs, getGlobalUsageStatistics } from '@/lib/usage-logs';

export async function getUsageListAction(params = {}) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return { success: false, error: adminCheck.error };
	}

	try {
		const result = await getUserUsageLogs(params.userId, params);
		return { success: true, data: result };
	} catch (error) {
		return { success: false, error: error.message };
	}
}

export async function getUsageStatisticsAction(options = {}) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return { success: false, error: adminCheck.error };
	}

	try {
		const stats = await getGlobalUsageStatistics(options);
		return { success: true, data: stats };
	} catch (error) {
		return { success: false, error: error.message };
	}
}
