'use server';

import { checkAdminAction } from '@/lib/admin-auth';
import { getUserUsageLogs, getSystemStatistics } from '@/lib/usage-logs';

export async function getAdminUsageLogsAction(userId, options = {}) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return { success: false, error: adminCheck.error };
	}

	try {
		const result = await getUserUsageLogs(userId, options);
		return { success: true, data: result };
	} catch (error) {
		return { success: false, error: error.message };
	}
}

export async function getSystemStatisticsAction(options = {}) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return { success: false, error: adminCheck.error };
	}

	try {
		const stats = await getSystemStatistics(options);
		return { success: true, data: stats };
	} catch (error) {
		return { success: false, error: error.message };
	}
}
