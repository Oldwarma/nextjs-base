'use server';

import { checkAdminAction } from '@/lib/admin-auth';
import { getUserList, updateUserRole, getUserStatistics, updateUserProfile } from '@/lib/user-profile';
import { getCollection } from '@/lib/mongodb';

/**
 * 获取用户列表（管理员）
 */
export async function getUserListAction({ pageIndex = 1, pageSize = 20, role, search } = {}) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return {
			success: false,
			error: adminCheck.error,
		};
	}

	try {
		const result = await getUserList({
			pageIndex,
			pageSize,
			role,
			search,
		});

		// findWithPagination 返回的是 rows 字段，需要转换为 data
		return {
			success: true,
			data: result.rows || result.data || [],
			total: result.total || 0,
			pageIndex: result.pageIndex,
			pageSize: result.pageSize,
			totalPages: result.totalPages,
		};
	} catch (error) {
		console.error('getUserListAction error:', error);
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
	const adminCheck = await checkAdminAction();
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
 * 更新用户信息（管理员）
 */
export async function updateUserInfoAction(userId, data) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return {
			success: false,
			error: adminCheck.error,
		};
	}

	try {
		const usersCollection = await getCollection('users');
		const updateData = {};

		// 允许管理员更新的字段
		if (data.name !== undefined) updateData.name = data.name;
		if (data.email !== undefined) updateData.email = data.email.toLowerCase();
		if (data.username !== undefined) updateData.username = data.username.toLowerCase();
		if (data.role !== undefined) updateData.role = data.role;
		if (data.credits !== undefined) updateData.credits = Number(data.credits);
		if (data.emailVerified !== undefined) updateData.emailVerified = data.emailVerified;

		updateData.updatedAt = new Date();

		const result = await usersCollection.updateOne({ id: userId }, { $set: updateData });

		if (result.modifiedCount === 0) {
			throw new Error('User not found or no changes made');
		}

		return {
			success: true,
			message: 'User information updated successfully',
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * 删除用户（管理员）- 软删除
 */
export async function deleteUserAction(userId) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return {
			success: false,
			error: adminCheck.error,
		};
	}

	// 防止删除管理员自己
	if (adminCheck.userId === userId) {
		return {
			success: false,
			error: 'Cannot delete your own account',
		};
	}

	try {
		const usersCollection = await getCollection('users');

		// 软删除：标记为已删除
		const result = await usersCollection.updateOne(
			{ id: userId },
			{
				$set: {
					deletedAt: new Date(),
					email: `deleted_${userId}@deleted.com`, // 防止邮箱冲突
					updatedAt: new Date(),
				},
			}
		);

		if (result.modifiedCount === 0) {
			throw new Error('User not found');
		}

		return {
			success: true,
			message: 'User deleted successfully',
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * 获取用户详细信息（管理员）
 */
export async function getUserDetailAction(userId) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return {
			success: false,
			error: adminCheck.error,
		};
	}

	try {
		const usersCollection = await getCollection('users');
		const user = await usersCollection.findOne({ id: userId });

		if (!user) {
			throw new Error('User not found');
		}

		// 移除敏感信息
		const { password, ...userInfo } = user;

		return {
			success: true,
			data: userInfo,
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
	const adminCheck = await checkAdminAction();
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

/**
 * 批量更新用户状态（管理员）
 */
export async function batchUpdateUsersAction(userIds, updates) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return {
			success: false,
			error: adminCheck.error,
		};
	}

	try {
		const usersCollection = await getCollection('users');

		const updateData = {
			...updates,
			updatedAt: new Date(),
		};

		const result = await usersCollection.updateMany({ id: { $in: userIds } }, { $set: updateData });

		return {
			success: true,
			message: `Updated ${result.modifiedCount} users`,
			count: result.modifiedCount,
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}
