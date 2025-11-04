import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import * as sysDao from '@/app/(admin)/actions/dao/sys';

/**
 * Check if user has specific permission
 * @param {String} requiredPermissionId - Required permission ID
 * @returns {Promise<Object>} Permission check result
 */
export async function checkPermission(requiredPermissionId) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	// Check if logged in
	if (!session?.user) {
		return {
			hasPermission: false,
			error: 'Unauthorized: Please login',
		};
	}

	const userId = session.user.id;

	try {
		// Check if user has the permission
		const hasPermission = await sysDao.checkUserHasPermission(userId, requiredPermissionId);

		return {
			hasPermission,
			userId,
			user: session.user,
		};
	} catch (error) {
		return {
			hasPermission: false,
			error: error.message,
		};
	}
}

/**
 * Check if user has permission to access specific action
 * @param {String} actionPath - Action path, e.g. '/admin/actions/user/create'
 * @returns {Promise<Object>} Permission check result
 */
export async function checkActionPermission(actionPath) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	// Check if logged in
	if (!session?.user) {
		return {
			hasPermission: false,
			error: 'Unauthorized: Please login',
		};
	}

	const userId = session.user.id;

	try {
		// Get user's role IDs
		const roleIds = await sysDao.getUserRoleIds(userId);

		// Admin has all permissions
		if (roleIds.includes('admin')) {
			return {
				hasPermission: true,
				userId,
				user: session.user,
			};
		}

		// Check if user has the action permission
		const hasPermission = await sysDao.checkUserHasActionPermission(userId, actionPath);

		return {
			hasPermission,
			userId,
			user: session.user,
		};
	} catch (error) {
		return {
			hasPermission: false,
			error: error.message,
		};
	}
}

/**
 * Check if user has any of the specified permissions (OR logic)
 * @param {Array<String>} permissionIds - Required permission IDs
 * @returns {Promise<Object>} Permission check result
 */
export async function checkAnyPermission(permissionIds) {
	if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
		return {
			hasPermission: false,
			error: 'No permissions specified',
		};
	}

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	// Check if logged in
	if (!session?.user) {
		return {
			hasPermission: false,
			error: 'Unauthorized: Please login',
		};
	}

	const userId = session.user.id;

	try {
		// Check each permission
		for (const permissionId of permissionIds) {
			const hasPermission = await sysDao.checkUserHasPermission(userId, permissionId);

			if (hasPermission) {
				return {
					hasPermission: true,
					userId,
					user: session.user,
					matchedPermission: permissionId,
				};
			}
		}

		return {
			hasPermission: false,
			userId,
			user: session.user,
		};
	} catch (error) {
		return {
			hasPermission: false,
			error: error.message,
		};
	}
}

/**
 * Check if user has all of the specified permissions (AND logic)
 * @param {Array<String>} permissionIds - Required permission IDs
 * @returns {Promise<Object>} Permission check result
 */
export async function checkAllPermissions(permissionIds) {
	if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
		return {
			hasPermission: false,
			error: 'No permissions specified',
		};
	}

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	// Check if logged in
	if (!session?.user) {
		return {
			hasPermission: false,
			error: 'Unauthorized: Please login',
		};
	}

	const userId = session.user.id;

	try {
		// Check each permission
		for (const permissionId of permissionIds) {
			const hasPermission = await sysDao.checkUserHasPermission(userId, permissionId);

			if (!hasPermission) {
				return {
					hasPermission: false,
					userId,
					user: session.user,
					missingPermission: permissionId,
				};
			}
		}

		return {
			hasPermission: true,
			userId,
			user: session.user,
		};
	} catch (error) {
		return {
			hasPermission: false,
			error: error.message,
		};
	}
}

/**
 * Get user's all permissions
 * @returns {Promise<Object>} User permissions result
 */
export async function getUserPermissions() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	// Check if logged in
	if (!session?.user) {
		return {
			success: false,
			error: 'Unauthorized: Please login',
		};
	}

	const userId = session.user.id;

	try {
		const permissionIds = await sysDao.getUserPermissionIds(userId);

		return {
			success: true,
			data: permissionIds,
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * Get user's all menus
 * @returns {Promise<Object>} User menus result
 */
export async function getUserMenus() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	// Check if logged in
	if (!session?.user) {
		return {
			success: false,
			error: 'Unauthorized: Please login',
		};
	}

	const userId = session.user.id;

	try {
		const menus = await sysDao.getUserMenus(userId);

		return {
			success: true,
			data: menus,
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * Check if user has role(s)
 * @param {String|Array<String>} requiredRoles - Required role ID(s)
 * @returns {Promise<Object>} Role check result
 */
export async function checkRole(requiredRoles) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	// Check if logged in
	if (!session?.user) {
		return {
			hasRole: false,
			error: 'Unauthorized: Please login',
		};
	}

	const userId = session.user.id;

	try {
		const userRoleIds = await sysDao.getUserRoleIds(userId);

		// Convert to array for consistency
		const requiredRoleArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

		// Check if user has any of the required roles
		const hasRole = requiredRoleArray.some((role) => userRoleIds.includes(role));

		return {
			hasRole,
			userId,
			user: session.user,
			userRoles: userRoleIds,
		};
	} catch (error) {
		return {
			hasRole: false,
			error: error.message,
		};
	}
}

/**
 * Enhanced admin check with permission support
 * Checks if user is admin OR has specific permission
 * @param {String} requiredPermission - Optional permission ID to check
 * @returns {Promise<Object>} Check result
 */
export async function checkAdminOrPermission(requiredPermission = null) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	// Check if logged in
	if (!session?.user) {
		return {
			isAuthorized: false,
			error: 'Unauthorized: Please login',
		};
	}

	const userId = session.user.id;

	try {
		const userRoleIds = await sysDao.getUserRoleIds(userId);

		// Check if admin
		if (userRoleIds.includes('admin')) {
			return {
				isAuthorized: true,
				isAdmin: true,
				userId,
				user: session.user,
			};
		}

		// If no permission specified, admin-only
		if (!requiredPermission) {
			return {
				isAuthorized: false,
				isAdmin: false,
				error: 'Admin access required',
			};
		}

		// Check permission
		const hasPermission = await sysDao.checkUserHasPermission(userId, requiredPermission);

		return {
			isAuthorized: hasPermission,
			isAdmin: false,
			hasPermission,
			userId,
			user: session.user,
		};
	} catch (error) {
		return {
			isAuthorized: false,
			error: error.message,
		};
	}
}

