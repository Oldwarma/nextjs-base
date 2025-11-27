'use server';

/**
 * User CRUD Actions
 * 
 * 本文件整合了 User 相关的所有 Server Actions：
 * 1. 标准 CRUD 操作
 * 2. Better Auth 集成操作
 * 3. 角色绑定操作
 * 
 * fieldsConfig 在 crud-config.user.js 中（客户端文件）
 */

import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { wrapQueryAction, wrapAdminAction } from '@/lib/core/action-wrapper';
import { checkBackendAccessAction } from '@/lib/auth/admin-auth';
import * as userDao from '@/app/(admin)/actions/dao/user';

// ============================================
// 标准 CRUD Actions
// ============================================

/**
 * 创建用户（后台管理员使用）
 */
export async function createUserAction(userData) {
	const backendCheck = await checkBackendAccessAction();
	if (!backendCheck.hasAccess) {
		return {
			success: false,
			error: backendCheck.error,
		};
	}

	try {
		const { email, password, name, username, role = 'user', isBackendAllowed = false, roles = [], credits = 0 } = userData;

		// 验证必填字段
		if (!email || !password || !name) {
			return {
				success: false,
				error: 'Email, password and name are required',
			};
		}

		// 验证邮箱格式
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return {
				success: false,
				error: 'Invalid email format',
			};
		}

		// 验证密码强度
		if (password.length < 8) {
			return {
				success: false,
				error: 'Password must be at least 8 characters',
			};
		}

		// 使用 Better Auth Admin Plugin 的 createUser API
		const { auth } = await import('@/lib/auth/auth');
		
		// 调用 Better Auth Admin Plugin 的 createUser
		const newUser = await auth.api.createUser({
			headers: await headers(),
			body: {
				email: email.toLowerCase(),
				password,
				name: name || username || email.split('@')[0],
				role: role || 'user',
				// 使用 data 字段传递额外的自定义字段
				data: {
					username: username || null,
					isBackendAllowed: isBackendAllowed || false,
					roles: roles || [],
					credits: credits || 0,
					totalCreditsEarned: 0,
					totalCreditsUsed: 0,
				},
			},
		});

		if (!newUser) {
			return {
				success: false,
				error: 'Failed to create user via Better Auth Admin Plugin',
			};
		}

		return {
			success: true,
			data: newUser,
		};
	} catch (error) {
		console.error('Failed to create user:', error);
		return {
			success: false,
			error: error.message || 'Failed to create user',
		};
	}
}

/**
 * 获取用户列表（分页）
 * 兼容 SmartCrudPage 的参数格式
 */
export const getUserListAction = wrapQueryAction('user', async (params = {}) => {
	const pageIndex = params.pageIndex || params.page || 1;
	const pageSize = params.pageSize || 20;
	const sortJson = params.sortJson || params.sort || { createdAt: -1 };
	
	// 提取搜索条件
	const { pageIndex: _, page: __, pageSize: ___, sortJson: ____, sort: _____, whereJson: ______, filters: _______, ...searchFields } = params;
	const conditions = params.whereJson || params.filters || searchFields;

	// 使用 DAO 获取用户列表
	const result = await userDao.getUserList({
		page: pageIndex,
		pageSize,
		filters: conditions,
		sort: sortJson,
	});

	return {
		success: true,
		data: result.data,
		total: result.total,
		page: result.page,
		pageSize: result.pageSize,
	};
});

/**
 * 获取单个用户详情
 */
export async function getUserDetailAction(userId) {
	const backendCheck = await checkBackendAccessAction();
	if (!backendCheck.hasAccess) {
		return {
			success: false,
			error: backendCheck.error,
		};
	}

	try {
		if (!userId) {
			return {
				success: false,
				error: 'User ID is required',
			};
		}

		const user = await userDao.getUserById(userId);

		if (!user) {
			return {
				success: false,
				error: 'User not found',
			};
		}

		return {
			success: true,
			data: user,
		};
	} catch (error) {
		console.error('Failed to get user:', error);
		return {
			success: false,
			error: error.message || 'Failed to get user',
		};
	}
}

/**
 * 更新用户信息
 */
export async function updateUserAction(userId, updateData) {
	const backendCheck = await checkBackendAccessAction();
	if (!backendCheck.hasAccess) {
		return {
			success: false,
			error: backendCheck.error,
		};
	}

	try {
		if (!userId) {
			return {
				success: false,
				error: 'User ID is required',
			};
		}

		// 使用 Better Auth Admin Plugin 的 updateUser API
		const updatedUser = await auth.api.adminUpdateUser({
			headers: await headers(),
			body: {
				userId,
				data: updateData,
			},
		});

		if (!updatedUser) {
			return {
				success: false,
				error: 'Failed to update user',
			};
		}

		return {
			success: true,
			data: updatedUser,
		};
	} catch (error) {
		console.error('Failed to update user:', error);
		return {
			success: false,
			error: error.message || 'Failed to update user',
		};
	}
}

/**
 * 删除用户
 */
export async function deleteUserAction(id) {
	const backendCheck = await checkBackendAccessAction();
	if (!backendCheck.hasAccess) {
		return {
			success: false,
			error: backendCheck.error,
		};
	}

	try {
		if (!id) {
			return {
				success: false,
				error: 'User ID is required',
			};
		}

		// ✅ Better Auth 的 removeUser 需要 userId 参数
		await auth.api.removeUser({
			headers: await headers(),
			body: {
				userId: id,
			},
		});

		return {
			success: true,
			message: 'User deleted successfully',
		};
	} catch (error) {
		console.error('Failed to delete user:', error);
		return {
			success: false,
			error: error.message || 'Failed to delete user',
		};
	}
}

/**
 * 批量更新用户
 */
export async function batchUpdateUsersAction(userIds, updateData) {
	const backendCheck = await checkBackendAccessAction();
	if (!backendCheck.hasAccess) {
		return {
			success: false,
			error: backendCheck.error,
		};
	}

	try {
		if (!Array.isArray(userIds) || userIds.length === 0) {
			return {
				success: false,
				error: 'User IDs array is required',
			};
		}

		const modifiedCount = await userDao.batchUpdateUsers(userIds, updateData);

		return {
			success: true,
			data: {
				modifiedCount,
				matchedCount: userIds.length,
			},
		};
	} catch (error) {
		console.error('Failed to batch update users:', error);
		return {
			success: false,
			error: error.message || 'Failed to batch update users',
		};
	}
}

// ============================================
// 特殊 User Actions
// ============================================

/**
 * 重置用户密码
 * 权限检查：根据 actions 模式匹配 (如 ** /resetUserPassword*Action)
 */
export const resetUserPasswordAction = wrapAdminAction(
	'set_password',
	'user',
	async (userId, newPassword, { userId: operatorId, isAdmin }) => {
		if (!userId || !newPassword) {
			return {
				success: false,
				error: 'User ID and new password are required',
			};
		}

		if (newPassword.length < 8) {
			return {
				success: false,
				error: 'Password must be at least 8 characters',
			};
		}

		// 优先使用 DAO 层方法
		try {
			await userDao.resetUserPassword(userId, newPassword);
			return {
				success: true,
				message: 'Password reset successfully',
				data: { userId },
			};
		} catch (daoError) {
			// 如果 DAO 失败，尝试使用 Better Auth Admin API
			const result = await auth.api.setUserPassword({
				headers: await headers(),
				body: {
					newPassword,
					userId,
				},
			});

			if (result?.error) {
				throw new Error(result.error.message || daoError.message || 'Failed to reset password');
			}

			return {
				success: true,
				message: 'Password reset successfully',
				data: { userId },
			};
		}
	},
	{
		permissionId: 'resetUserPasswordAction', // action 函数名，用于匹配 actions 模式
		skipLog: false,
	}
);

/**
 * 为用户绑定角色
 * 权限检查：根据 actions 模式匹配 (如 ** /bindUser*Action 或 ** /updateUser*Action)
 */
export const bindUserRolesAction = wrapAdminAction(
	'update',
	'user_roles',
	async (userId, roleIds, reset = false, { userId: operatorId, isAdmin }) => {
		if (!userId) {
			return {
				success: false,
				error: 'User ID is required',
			};
		}

		await userDao.bindUserRoles(userId, roleIds, reset);

		return {
			success: true,
			message: 'Roles assigned successfully',
			data: { userId, roleIds, reset },
		};
	},
	{
		permissionId: 'bindUserRolesAction', // action 函数名，用于匹配 actions 模式
		skipLog: false,
	}
);

/**
 * 获取用户的角色列表
 */
export async function getUserRolesAction(userId) {
	const backendCheck = await checkBackendAccessAction();
	if (!backendCheck.hasAccess) {
		return {
			success: false,
			error: backendCheck.error,
		};
	}

	try {
		if (!userId) {
			return {
				success: false,
				error: 'User ID is required',
			};
		}

		const roles = await userDao.getUserRoles(userId);

		return {
			success: true,
			data: roles,
		};
	} catch (error) {
		console.error('Failed to get user roles:', error);
		return {
			success: false,
			error: error.message || 'Failed to get user roles',
		};
	}
}

/**
 * 封禁用户
 * 权限检查：根据 actions 模式匹配 (如 ** /banUser*Action)
 */
export const banUserAction = wrapAdminAction(
	'ban',
	'user',
	async (userId, banReason, banExpiresIn, { userId: operatorId, isAdmin }) => {
		if (!userId) {
			return {
				success: false,
				error: 'User ID is required',
			};
		}

		await auth.api.banUser({
			headers: await headers(),
			body: {
				userId,
				banReason,
				banExpiresIn,
			},
		});

		return {
			success: true,
			message: 'User banned successfully',
			data: { userId, banReason, banExpiresIn },
		};
	},
	{
		permissionId: 'banUserAction', // action 函数名，用于匹配 actions 模式
		skipLog: false,
	}
);

/**
 * 解封用户
 * 权限检查：根据 actions 模式匹配 (如 ** /unbanUser*Action)
 */
export const unbanUserAction = wrapAdminAction(
	'unban',
	'user',
	async (userId, { userId: operatorId, isAdmin }) => {
		if (!userId) {
			return {
				success: false,
				error: 'User ID is required',
			};
		}

		await auth.api.unbanUser({
			headers: await headers(),
			body: {
				userId,
			},
		});

		return {
			success: true,
			message: 'User unbanned successfully',
			data: { userId },
		};
	},
	{
		permissionId: 'unbanUserAction', // action 函数名，用于匹配 actions 模式
		skipLog: false,
	}
);

/**
 * 获取用户统计信息
 */
export async function getUserStatsAction() {
	const backendCheck = await checkBackendAccessAction();
	if (!backendCheck.hasAccess) {
		return {
			success: false,
			error: backendCheck.error,
		};
	}

	try {
		const stats = await userDao.getUserStats();

		return {
			success: true,
			data: stats,
		};
	} catch (error) {
		console.error('Failed to get user stats:', error);
		return {
			success: false,
			error: error.message || 'Failed to get user stats',
		};
	}
}
