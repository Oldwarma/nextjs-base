'use server';

/**
 * 后台用户管理 Server Actions
 * 集成 Better Auth 的用户创建、更新等功能
 * 使用 DAO 层进行数据操作
 */

import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { wrapQueryAction } from '@/lib/core/action-wrapper';
import * as userDao from '@/app/(admin)/actions/dao/user';

/**
 * 检查是否有后台访问权限
 */
async function checkBackendAccess() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return {
			hasAccess: false,
			error: 'Unauthorized: Please login',
		};
	}

	// 检查是否允许访问后台
	if (!session.user.isBackendAllowed) {
		return {
			hasAccess: false,
			error: 'Forbidden: Backend access not allowed',
		};
	}

	return {
		hasAccess: true,
		isAdmin: session.user.role === 'admin',
		user: session.user,
	};
}

/**
 * 创建用户（后台管理员使用）
 */
export async function createUserAction(userData) {
	const backendCheck = await checkBackendAccess();
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
 * 更新用户信息
 */
export async function updateUserAction(userId, updateData) {
	const backendCheck = await checkBackendAccess();
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
				data: updateData, // Better Auth 会自动更新 additionalFields 中定义的字段
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
 * 更新用户信息（别名，兼容旧代码）
 */
export async function updateUserInfoAction(userId, updateData) {
	return await updateUserAction(userId, updateData);
}

/**
 * 重置用户密码
 */
export async function resetUserPasswordAction(userId, newPassword) {
	const backendCheck = await checkBackendAccess();
	if (!backendCheck.hasAccess) {
		return {
			success: false,
			error: backendCheck.error,
		};
	}

	try {
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

		// 使用 Better Auth Admin Plugin 的 setUserPassword API
		await auth.api.setUserPassword({
			headers: await headers(),
			body: {
				userId,
				newPassword,
			},
		});

		return {
			success: true,
			message: 'Password reset successfully',
		};
	} catch (error) {
		console.error('Failed to reset password:', error);
		return {
			success: false,
			error: error.message || 'Failed to reset password',
		};
	}
}

/**
 * 删除用户
 */
export async function deleteUserAction(userId) {
	const backendCheck = await checkBackendAccess();
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

		// 使用 Better Auth Admin Plugin 的 removeUser API
		await auth.api.removeUser({
			headers: await headers(),
			body: {
				userId,
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
 * 获取用户列表（分页）
 * 兼容 SmartCrudPage 的参数格式
 * 参数格式: { pageIndex, pageSize, whereJson, sortJson }
 */
export const getUserListAction = wrapQueryAction('user', async (params = {}) => {
	// 兼容两种参数格式
	// 格式 1（SmartCrudPage）: { pageIndex, pageSize, ...searchFields, sortJson }
	// 格式 2（标准格式）: { pageIndex, pageSize, whereJson, sortJson }
	const pageIndex = params.pageIndex || params.page || 1;
	const pageSize = params.pageSize || 20;
	const sortJson = params.sortJson || params.sort || { createdAt: -1 };
	
	// 提取搜索条件（排除分页和排序参数）
	const { pageIndex: _, page: __, pageSize: ___, sortJson: ____, sort: _____, whereJson: ______, filters: _______, ...searchFields } = params;
	
	// 优先使用 whereJson，其次是 filters，最后是顶层的搜索字段
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
export async function getUserByIdAction(userId) {
	const backendCheck = await checkBackendAccess();
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

		// 使用 DAO 获取用户
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
 * 批量更新用户
 */
export async function batchUpdateUsersAction(userIds, updateData) {
	const backendCheck = await checkBackendAccess();
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

		// 使用 DAO 批量更新
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

/**
 * 为用户绑定角色
 */
export async function bindUserRolesAction(userId, roleIds, reset = false) {
	const backendCheck = await checkBackendAccess();
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

		// 使用 DAO 绑定角色
		await userDao.bindUserRoles(userId, roleIds, reset);

		return {
			success: true,
			message: 'Roles assigned successfully',
		};
	} catch (error) {
		console.error('Failed to bind user roles:', error);
		return {
			success: false,
			error: error.message || 'Failed to bind user roles',
		};
	}
}

/**
 * 获取用户的角色列表
 */
export async function getUserRolesAction(userId) {
	const backendCheck = await checkBackendAccess();
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

		// 使用 DAO 获取角色
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
 */
export async function banUserAction(userId, banReason, banExpiresIn) {
	const backendCheck = await checkBackendAccess();
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

		// 使用 Better Auth Admin Plugin 的 banUser API
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
		};
	} catch (error) {
		console.error('Failed to ban user:', error);
		return {
			success: false,
			error: error.message || 'Failed to ban user',
		};
	}
}

/**
 * 解封用户
 */
export async function unbanUserAction(userId) {
	const backendCheck = await checkBackendAccess();
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

		// 使用 Better Auth Admin Plugin 的 unbanUser API
		await auth.api.unbanUser({
			headers: await headers(),
			body: {
				userId,
			},
		});

		return {
			success: true,
			message: 'User unbanned successfully',
		};
	} catch (error) {
		console.error('Failed to unban user:', error);
		return {
			success: false,
			error: error.message || 'Failed to unban user',
		};
	}
}

/**
 * 获取用户统计信息
 */
export async function getUserStatsAction() {
	const backendCheck = await checkBackendAccess();
	if (!backendCheck.hasAccess) {
		return {
			success: false,
			error: backendCheck.error,
		};
	}

	try {
		// 使用 DAO 获取统计
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
