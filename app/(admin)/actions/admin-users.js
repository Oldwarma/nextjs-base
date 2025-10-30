'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getUserList, updateUserRole, getUserStatistics } from '@/lib/user-profile';

/**
 * 检查管理员权限
 */
async function checkAdmin() {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		return { isAdmin: false, error: 'Unauthorized' };
	}

	if (session.user.role !== 'admin') {
		return { isAdmin: false, error: 'Forbidden: Admin access required' };
	}

	return { isAdmin: true, userId: session.user.id };
}

/**
 * 获取用户列表（管理员）
 */
export async function getUserListAction({ page = 1, limit = 20, role, search } = {}) {
	const adminCheck = await checkAdmin();
	if (!adminCheck.isAdmin) {
		return {
			success: false,
			error: adminCheck.error,
		};
	}

	try {
		const result = await getUserList({ page, limit, role, search });
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
 * 更新用户角色（管理员）
 */
export async function updateUserRoleAction(userId, role) {
	const adminCheck = await checkAdmin();
	if (!adminCheck.isAdmin) {
		return {
			success: false,
			error: adminCheck.error,
		};
	}

	try {
		await updateUserRole(userId, role);
		return {
			success: true,
			message: 'User role updated successfully',
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * 获取用户统计信息（管理员）
 */
export async function getUserStatisticsAdminAction(userId) {
	const adminCheck = await checkAdmin();
	if (!adminCheck.isAdmin) {
		return {
			success: false,
			error: adminCheck.error,
		};
	}

	try {
		const stats = await getUserStatistics(userId);
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
