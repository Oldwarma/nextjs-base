'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getUserUsageLogs, getSystemStatistics } from '@/lib/usage-logs';

async function checkAdmin() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return { isAdmin: false, error: 'Unauthorized' };
	if (session.user.role !== 'admin') return { isAdmin: false, error: 'Forbidden: Admin access required' };
	return { isAdmin: true, userId: session.user.id };
}

export async function getAdminUsageLogsAction(userId, options = {}) {
	const adminCheck = await checkAdmin();
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
	const adminCheck = await checkAdmin();
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
