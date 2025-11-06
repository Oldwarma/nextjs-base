'use server';

/**
 * Protected Action Examples (DEPRECATED)
 * 
 * ⚠️ 本文件已废弃，推荐使用 action-wrapper 来包装 Server Actions
 * 
 * 新的推荐方式：
 * ```javascript
 * import { wrapAdminAction } from '@/lib/core/action-wrapper';
 * 
 * export const myAction = wrapAdminAction('create', 'user', async (params, context) => {
 *   // 自动验证权限、自动记录日志
 *   return { success: true, data: {...} };
 * });
 * ```
 * 
 * 这个文件展示了如何在 Server Actions 中使用 RBAC 权限验证（旧方式）
 * 
 * 使用方法：
 * 1. 使用 checkActionPermission 验证 Action 路径权限
 * 2. 使用 checkPermission 验证特定权限 ID
 * 3. 使用 checkRole 验证用户角色
 */

import { checkActionPermission, checkPermission, checkRole } from '@/lib/auth/permission-auth';
import { logAction } from '@/lib/logging/action-logger';

/**
 * Example 1: 使用 Action 路径验证权限
 * 
 * 这是最常用的方式，根据当前 Action 的路径自动验证权限
 */
export async function createUserExampleAction(data) {
	const startTime = Date.now();
	const requestTime = new Date();

	try {
		// ✅ 验证权限：检查用户是否有权限执行此 Action
		const permCheck = await checkActionPermission('/admin/actions/examples/protected-action-example/createUserExample');
		
		if (!permCheck.hasPermission) {
			const result = {
				success: false,
				error: permCheck.error || 'Permission denied: You do not have permission to create users',
			};
			logActionToConsole('createUserExample', 'examples/protected', startTime, requestTime, data, result, true);
			return result;
		}

		// 执行业务逻辑
		// ...

		const result = {
			success: true,
			message: 'User created successfully',
		};

		logActionToConsole('createUserExample', 'examples/protected', startTime, requestTime, data, result, false);
		return result;
	} catch (error) {
		const result = {
			success: false,
			error: error.message,
		};
		logActionToConsole('createUserExample', 'examples/protected', startTime, requestTime, data, result, true);
		return result;
	}
}

/**
 * Example 2: 使用权限 ID 验证
 * 
 * 当需要验证特定的权限 ID 时使用
 */
export async function deleteUserExampleAction(userId) {
	const startTime = Date.now();
	const requestTime = new Date();

	try {
		// ✅ 验证权限：检查用户是否有特定的权限 ID
		const permCheck = await checkPermission('user-delete-permission-id');
		
		if (!permCheck.hasPermission) {
			const result = {
				success: false,
				error: 'Permission denied: You do not have permission to delete users',
			};
			logActionToConsole('deleteUserExample', 'examples/protected', startTime, requestTime, { userId }, result, true);
			return result;
		}

		// 执行业务逻辑
		// ...

		const result = {
			success: true,
			message: 'User deleted successfully',
		};

		logActionToConsole('deleteUserExample', 'examples/protected', startTime, requestTime, { userId }, result, false);
		return result;
	} catch (error) {
		const result = {
			success: false,
			error: error.message,
		};
		logActionToConsole('deleteUserExample', 'examples/protected', startTime, requestTime, { userId }, result, true);
		return result;
	}
}

/**
 * Example 3: 使用角色验证
 * 
 * 当需要验证用户是否拥有特定角色时使用
 */
export async function adminOnlyExampleAction() {
	const startTime = Date.now();
	const requestTime = new Date();

	try {
		// ✅ 验证角色：检查用户是否是管理员
		const roleCheck = await checkRole('admin');
		
		if (!roleCheck.hasRole) {
			const result = {
				success: false,
				error: 'Access denied: Admin role required',
			};
			logActionToConsole('adminOnlyExample', 'examples/protected', startTime, requestTime, {}, result, true);
			return result;
		}

		// 执行业务逻辑
		// ...

		const result = {
			success: true,
			message: 'Admin action executed successfully',
		};

		logActionToConsole('adminOnlyExample', 'examples/protected', startTime, requestTime, {}, result, false);
		return result;
	} catch (error) {
		const result = {
			success: false,
			error: error.message,
		};
		logActionToConsole('adminOnlyExample', 'examples/protected', startTime, requestTime, {}, result, true);
		return result;
	}
}

/**
 * Example 4: 组合验证（需要多个权限之一）
 * 
 * 使用 checkAnyPermission 验证用户是否拥有多个权限中的任意一个
 */
export async function flexibleAccessExampleAction(data) {
	const startTime = Date.now();
	const requestTime = new Date();

	try {
		const { checkAnyPermission } = await import('@/lib/permission-auth');
		
		// ✅ 验证权限：用户需要有以下任一权限
		const permCheck = await checkAnyPermission([
			'user-create-permission',
			'user-manage-permission',
			'admin-permission',
		]);
		
		if (!permCheck.hasPermission) {
			const result = {
				success: false,
				error: 'Permission denied: You need at least one of the required permissions',
			};
			logActionToConsole('flexibleAccessExample', 'examples/protected', startTime, requestTime, data, result, true);
			return result;
		}

		// 执行业务逻辑
		// ...

		const result = {
			success: true,
			message: 'Action executed successfully',
		};

		logActionToConsole('flexibleAccessExample', 'examples/protected', startTime, requestTime, data, result, false);
		return result;
	} catch (error) {
		const result = {
			success: false,
			error: error.message,
		};
		logActionToConsole('flexibleAccessExample', 'examples/protected', startTime, requestTime, data, result, true);
		return result;
	}
}

/**
 * Example 5: 严格验证（需要所有权限）
 * 
 * 使用 checkAllPermissions 验证用户是否拥有所有指定的权限
 */
export async function strictAccessExampleAction(data) {
	const startTime = Date.now();
	const requestTime = new Date();

	try {
		const { checkAllPermissions } = await import('@/lib/permission-auth');
		
		// ✅ 验证权限：用户需要有以下所有权限
		const permCheck = await checkAllPermissions([
			'user-read-permission',
			'user-write-permission',
			'user-delete-permission',
		]);
		
		if (!permCheck.hasPermission) {
			const result = {
				success: false,
				error: `Permission denied: Missing permission ${permCheck.missingPermission}`,
			};
			logActionToConsole('strictAccessExample', 'examples/protected', startTime, requestTime, data, result, true);
			return result;
		}

		// 执行业务逻辑
		// ...

		const result = {
			success: true,
			message: 'Action executed successfully',
		};

		logActionToConsole('strictAccessExample', 'examples/protected', startTime, requestTime, data, result, false);
		return result;
	} catch (error) {
		const result = {
			success: false,
			error: error.message,
		};
		logActionToConsole('strictAccessExample', 'examples/protected', startTime, requestTime, data, result, true);
		return result;
	}
}

/**
 * Example 6: 自定义权限逻辑
 * 
 * 结合多种验证方式实现复杂的权限逻辑
 */
export async function complexPermissionExampleAction(userId, data) {
	const startTime = Date.now();
	const requestTime = new Date();

	try {
		const { checkActionPermission } = await import('@/lib/permission-auth');
		const { auth } = await import('@/lib/auth');
		const { headers } = await import('next/headers');
		
		// 获取当前用户
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			const result = {
				success: false,
				error: 'Unauthorized: Please login',
			};
			logActionToConsole('complexPermissionExample', 'examples/protected', startTime, requestTime, data, result, true);
			return result;
		}

		// 场景1: 用户可以编辑自己的数据，无需权限
		if (session.user.id === userId) {
			// 允许用户编辑自己的数据
			const result = {
				success: true,
				message: 'Own data updated successfully',
			};
			logActionToConsole('complexPermissionExample', 'examples/protected', startTime, requestTime, data, result, false);
			return result;
		}

		// 场景2: 编辑其他用户的数据，需要权限验证
		const permCheck = await checkActionPermission('/admin/actions/examples/protected-action-example/complexPermissionExample');
		
		if (!permCheck.hasPermission) {
			const result = {
				success: false,
				error: 'Permission denied: You can only edit your own data or need admin permission',
			};
			logActionToConsole('complexPermissionExample', 'examples/protected', startTime, requestTime, data, result, true);
			return result;
		}

		// 执行业务逻辑
		// ...

		const result = {
			success: true,
			message: 'User data updated successfully',
		};

		logActionToConsole('complexPermissionExample', 'examples/protected', startTime, requestTime, data, result, false);
		return result;
	} catch (error) {
		const result = {
			success: false,
			error: error.message,
		};
		logActionToConsole('complexPermissionExample', 'examples/protected', startTime, requestTime, data, result, true);
		return result;
	}
}

