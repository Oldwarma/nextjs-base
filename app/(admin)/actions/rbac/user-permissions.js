'use server';

/**
 * User Permissions Server Actions
 *
 * 功能：
 * - 获取当前用户的菜单权限
 * - 获取当前用户的操作权限
 * - 验证用户是否有访问特定页面的权限
 */

import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import * as sysDao from '@/app/(admin)/actions/dao/sys';
import { logAction } from '@/lib/logging/action-logger';

/**
 * Get current user's accessible menus (RBAC-aware)
 * @returns {Promise<Object>} User's menu tree result
 */
export async function getUserAccessibleMenusAction() {
	const startTime = Date.now();
	const requestTime = new Date();

	try {
		// Get current session
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			const result = { success: false, error: 'Unauthorized: Please login' };
			logAction('getUserAccessibleMenus', 'rbac/user-permissions', startTime, requestTime, {}, result, true);
			return result;
		}

		const userId = session.user.id;
		const userRole = session.user.role;

		// Admin role: get all enabled menus (注释用于测试)
		if (userRole === 'admin') {
			const { getCollection, fromObjectId } = await import('@/lib/mongodb');
			const menusCollection = await getCollection('menus');
			const allMenus = await menusCollection.find(
				{
					enable: true,
					deletedAt: { $exists: false },
				},
				{
					sort: { sort: 1, createdAt: 1 },
				}
			);

			const serializedMenus = allMenus.map((m) => fromObjectId(m));

			// Build tree structure
			const menuTree = buildMenuTreeFromFlat(serializedMenus);

			// 深度序列化，移除所有 ObjectId 和不可序列化的对象
			const serializedTree = JSON.parse(JSON.stringify(menuTree));

			const result = {
				success: true,
				data: serializedTree,
				isAdmin: true,
			};

			logAction('getUserAccessibleMenus', 'rbac/user-permissions', startTime, requestTime, {}, result, false);
			return result;
		}

		// Regular user: get menus based on RBAC roles
		const menuTree = await sysDao.getUserMenus(userId);

		// 深度序列化，确保可以传递给客户端组件
		const serializedTree = JSON.parse(JSON.stringify(menuTree));

		const result = {
			success: true,
			data: serializedTree,
			isAdmin: false,
		};

		logAction('getUserAccessibleMenus', 'rbac/user-permissions', startTime, requestTime, {}, result, false);
		return result;
	} catch (error) {
		console.error('Failed to get user accessible menus:', error);
		const result = {
			success: false,
			error: 'Failed to get user menus',
		};
		logAction('getUserAccessibleMenus', 'rbac/user-permissions', startTime, requestTime, {}, result, true);
		return result;
	}
}

/**
 * Get current user's permission IDs
 * @returns {Promise<Object>} User's permission IDs result
 */
export async function getUserPermissionIdsAction() {
	const startTime = Date.now();
	const requestTime = new Date();

	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			const result = { success: false, error: 'Unauthorized: Please login' };
			logAction('getUserPermissionIds', 'rbac/user-permissions', startTime, requestTime, {}, result, true);
			return result;
		}

		const userId = session.user.id;
		const userRole = session.user.role;

		// Admin role: has all permissions
		if (userRole === 'admin') {
			const result = {
				success: true,
				data: ['*'], // Special marker for all permissions
				isAdmin: true,
			};
			logAction('getUserPermissionIds', 'rbac/user-permissions', startTime, requestTime, {}, result, false);
			return result;
		}

		// Get permission IDs from RBAC
		const permissionIds = await sysDao.getUserPermissionIds(userId);

		const result = {
			success: true,
			data: permissionIds,
			isAdmin: false,
		};

		logAction('getUserPermissionIds', 'rbac/user-permissions', startTime, requestTime, {}, result, false);
		return result;
	} catch (error) {
		console.error('Failed to get user permission IDs:', error);
		const result = {
			success: false,
			error: 'Failed to get user permissions',
		};
		logAction('getUserPermissionIds', 'rbac/user-permissions', startTime, requestTime, {}, result, true);
		return result;
	}
}

/**
 * Check if current user can access a specific page URL
 * @param {String} pageUrl - Page URL to check, e.g. '/admin/users'
 * @returns {Promise<Object>} Access check result
 */
export async function checkPageAccessAction(pageUrl) {
	const startTime = Date.now();
	const requestTime = new Date();
	const params = { pageUrl };

	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			const result = { success: false, hasAccess: false, error: 'Unauthorized: Please login' };
			logAction('checkPageAccess', 'rbac/user-permissions', startTime, requestTime, params, result, true);
			return result;
		}

		const userId = session.user.id;
		const userRole = session.user.role;

		// Admin role: can access all pages (注释用于测试)
		if (userRole === 'admin') {
			const result = {
				success: true,
				hasAccess: true,
				isAdmin: true,
			};
			logAction('checkPageAccess', 'rbac/user-permissions', startTime, requestTime, params, result, false);
			return result;
		}

		// Get user's accessible menus
		const menuTree = await sysDao.getUserMenus(userId);

		// 调试日志：输出用户的菜单树
		console.log('🔍 [checkPageAccess] User ID:', userId);
		console.log('🔍 [checkPageAccess] User Role:', userRole);
		console.log('🔍 [checkPageAccess] Checking URL:', pageUrl);
		console.log('🔍 [checkPageAccess] User Menu Tree:', JSON.stringify(menuTree, null, 2));

		// Check if pageUrl exists in user's menu tree
		const hasAccess = checkUrlInMenuTree(pageUrl, menuTree);

		console.log('🔍 [checkPageAccess] Has Access:', hasAccess);

		const result = {
			success: true,
			hasAccess,
			isAdmin: false,
		};

		logAction('checkPageAccess', 'rbac/user-permissions', startTime, requestTime, params, result, false);
		return result;
	} catch (error) {
		console.error('Failed to check page access:', error);
		const result = {
			success: false,
			hasAccess: false,
			error: 'Failed to check page access',
		};
		logAction('checkPageAccess', 'rbac/user-permissions', startTime, requestTime, params, result, true);
		return result;
	}
}

/**
 * Helper: Build menu tree from flat array
 * @param {Array} menus - Flat menu array
 * @param {String|null} parent_id - Parent ID
 * @returns {Array} Menu tree
 */
function buildMenuTreeFromFlat(menus, parent_id = null) {
	const tree = [];

	for (const menu of menus) {
		// Filter by enable and not hidden
		if (!menu.enable || menu.hidden) {
			continue;
		}

		if (menu.parent_id === parent_id) {
			const children = buildMenuTreeFromFlat(menus, menu.id);
			const menuNode = { ...menu };
			if (children.length > 0) {
				menuNode.children = children;
			}
			tree.push(menuNode);
		}
	}

	return tree.sort((a, b) => (a.sort || 0) - (b.sort || 0));
}

/**
 * Helper: Check if URL exists in menu tree (recursive)
 * @param {String} url - URL to check
 * @param {Array} menuTree - Menu tree
 * @returns {Boolean} Whether URL exists
 */
function checkUrlInMenuTree(url, menuTree) {
	if (!Array.isArray(menuTree)) {
		return false;
	}

	for (const menu of menuTree) {
		// Exact match
		if (menu.url === url) {
			return true;
		}

		// Check children
		if (menu.children && menu.children.length > 0) {
			if (checkUrlInMenuTree(url, menu.children)) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Get current user's roles
 * @returns {Promise<Object>} User's roles result
 */
export async function getUserRolesAction() {
	const startTime = Date.now();
	const requestTime = new Date();

	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			const result = { success: false, error: 'Unauthorized: Please login' };
			logAction('getUserRoles', 'rbac/user-permissions', startTime, requestTime, {}, result, true);
			return result;
		}

		const userId = session.user.id;
		const userRole = session.user.role;

		// Get RBAC role IDs
		const roleIds = await sysDao.getUserRoleIds(userId);

		const result = {
			success: true,
			data: {
				betterAuthRole: userRole, // 'admin' or 'user'
				rbacRoles: roleIds, // RBAC role UUIDs
			},
		};

		logAction('getUserRoles', 'rbac/user-permissions', startTime, requestTime, {}, result, false);
		return result;
	} catch (error) {
		console.error('Failed to get user roles:', error);
		const result = {
			success: false,
			error: 'Failed to get user roles',
		};
		logAction('getUserRoles', 'rbac/user-permissions', startTime, requestTime, {}, result, true);
		return result;
	}
}
