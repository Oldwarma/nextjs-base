'use server';

import { createCrudActions } from '@/app/(admin)/actions/dao/base';
import { userCrudConfig } from '@/app/(admin)/actions/configs/user-crud.config';
import { checkAdminAction } from '@/lib/admin-auth';
import { getUserStatistics } from '@/lib/user-profile';

// 创建用户 CRUD Actions
const userCrud = createCrudActions(userCrudConfig);

/**
 * 获取用户列表（管理员）
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>} 用户列表结果
 */
export async function getUserListAction({ pageIndex = 1, pageSize = 20, role, search } = {}) {
	return await userCrud.getList({
		pageIndex,
		pageSize,
		search,
		filters: role ? { role } : {},
	});
}

/**
 * 获取用户详细信息（管理员）
 * @param {String} userId - 用户ID
 * @returns {Promise<Object>} 用户详情
 */
export async function getUserDetailAction(userId) {
	return await userCrud.getDetail(userId);
}

/**
 * 更新用户信息（管理员）
 * @param {String} userId - 用户ID
 * @param {Object} data - 更新数据
 * @returns {Promise<Object>} 更新结果
 */
export async function updateUserInfoAction(userId, data) {
	return await userCrud.update(userId, data);
}

/**
 * 删除用户（管理员）- 软删除
 * @param {String} userId - 用户ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteUserAction(userId) {
	// 防止删除管理员自己
	const adminCheck = await checkAdminAction();
	if (adminCheck.isAdmin && adminCheck.userId === userId) {
		return {
			success: false,
			error: 'Cannot delete your own account',
		};
	}

	return await userCrud.delete(userId);
}

/**
 * 批量更新用户状态（管理员）
 * @param {Array} userIds - 用户ID数组
 * @param {Object} updates - 更新数据
 * @returns {Promise<Object>} 更新结果
 */
export async function batchUpdateUsersAction(userIds, updates) {
	return await userCrud.batchUpdate(userIds, updates);
}

/**
 * 批量删除用户（管理员）
 * @param {Array} userIds - 用户ID数组
 * @returns {Promise<Object>} 删除结果
 */
export async function batchDeleteUsersAction(userIds) {
	// 防止删除管理员自己
	const adminCheck = await checkAdminAction();
	if (adminCheck.isAdmin && userIds.includes(adminCheck.userId)) {
		return {
			success: false,
			error: 'Cannot delete your own account',
		};
	}

	return await userCrud.batchDelete(userIds);
}

/**
 * 更新用户角色（管理员）
 * 这是一个便捷方法，专门用于更新角色
 * @param {String} userId - 用户ID
 * @param {String} role - 新角色
 * @returns {Promise<Object>} 更新结果
 */
export async function updateUserRoleAction(userId, role) {
	return await userCrud.update(userId, { role });
}

/**
 * 获取用户统计信息（管理员）
 * 这个方法不使用 BaseDAO，因为它需要复杂的聚合查询
 * @param {String} userId - 用户ID
 * @returns {Promise<Object>} 统计信息
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
 * 为用户绑定角色（管理员）
 * @param {String} userId - 用户ID
 * @param {Array<String>} roleIds - 角色ID数组
 * @param {Boolean} reset - 是否重置（true=替换，false=追加）
 * @returns {Promise<Object>} 更新结果
 */
export async function bindUserRolesAction(userId, roleIds, reset = true) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return {
			success: false,
			error: adminCheck.error,
		};
	}

	try {
		const { bindUserRoles } = await import('@/app/(admin)/actions/dao/sys');

		const result = await bindUserRoles({
			userId,
			roleIds,
			reset,
		});

		return {
			success: result.success,
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
 * 获取用户的角色（管理员）
 * @param {String} userId - 用户ID
 * @returns {Promise<Object>} 角色ID数组
 */
export async function getUserRolesAction(userId) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return {
			success: false,
			error: adminCheck.error,
		};
	}

	try {
		const { getUserRoleIds } = await import('@/app/(admin)/actions/dao/sys');

		const roleIds = await getUserRoleIds(userId);

		return {
			success: true,
			data: roleIds,
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * 批量为用户绑定角色（管理员）
 * @param {Array<String>} userIds - 用户ID数组
 * @param {Array<String>} roleIds - 角色ID数组
 * @param {Boolean} reset - 是否重置（true=替换，false=追加）
 * @returns {Promise<Object>} 更新结果
 */
export async function batchBindUserRolesAction(userIds, roleIds, reset = true) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return {
			success: false,
			error: adminCheck.error,
		};
	}

	try {
		const { bindUserRoles } = await import('@/app/(admin)/actions/dao/sys');

		let successCount = 0;
		let failedCount = 0;
		const errors = [];

		for (const userId of userIds) {
			try {
				await bindUserRoles({
					userId,
					roleIds,
					reset,
				});
				successCount++;
			} catch (error) {
				failedCount++;
				errors.push({ userId, error: error.message });
			}
		}

		return {
			success: failedCount === 0,
			data: {
				successCount,
				failedCount,
				errors,
			},
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}
