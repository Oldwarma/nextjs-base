'use server';

/**
 * User Permissions Server Actions
 *
 * 功能：
 * - 获取当前用户的菜单权限
 * - 获取当前用户的操作权限
 * - 验证用户是否有访问特定页面的权限
 * 
 * 注意：这些方法是后台基础设施方法，使用 auth 前缀
 * 只要有后台访问权限就能调用，不受 RBAC 权限管理
 */

import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import * as sysDao from '@/app/(admin)/actions/dao/sys';
import { wrapAction } from '@/lib/core/action-wrapper';
import { checkBackendAccessAction } from '@/lib/auth/admin-auth';

/**
 * Get current user's accessible menus (RBAC-aware)
 * 
 * 使用 auth 前缀：只需要登录 + 后台访问权限，不需要 RBAC 检查
 * @returns {Promise<Object>} User's menu tree result
 */
export const getUserAccessibleMenusAction = wrapAction('authQueryUserAccessibleMenus', async (_, ctx) => {
	// 检查后台访问权限
	const backendCheck = await checkBackendAccessAction();
	if (!backendCheck.hasAccess) {
		return { success: false, error: backendCheck.error };
	}
	// Get current session
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return { success: false, error: 'Unauthorized: Please login' };
	}

	const userId = session.user.id;
	const userRole = session.user.role;

	// Admin role: get all enabled menus
	if (userRole === 'admin') {
		const { getCollection, fromObjectId } = await import('@/lib/database/mongodb');
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

		return {
			success: true,
			data: serializedTree,
			isAdmin: true,
		};
	}

	// Regular user: get menus based on RBAC roles
	const menuTree = await sysDao.getUserMenus(userId);

	// 深度序列化，确保可以传递给客户端组件
	const serializedTree = JSON.parse(JSON.stringify(menuTree));

	return {
		success: true,
		data: serializedTree,
		isAdmin: false,
	};
}, { skipLog: true });

/**
 * Get current user's permission IDs
 * 
 * 使用 auth 前缀：只需要登录 + 后台访问权限，不需要 RBAC 检查
 * @returns {Promise<Object>} User's permission IDs result
 */
export const getUserPermissionIdsAction = wrapAction('authQueryUserPermissionIds', async (_, ctx) => {
	// 检查后台访问权限
	const backendCheck = await checkBackendAccessAction();
	if (!backendCheck.hasAccess) {
		return { success: false, error: backendCheck.error };
	}

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return { success: false, error: 'Unauthorized: Please login' };
	}

	const userId = session.user.id;
	const userRole = session.user.role;

	// Admin role: has all permissions
	if (userRole === 'admin') {
		return {
			success: true,
			data: ['*'], // Special marker for all permissions
			isAdmin: true,
		};
	}

	// Get permission IDs from RBAC
	const permissionIds = await sysDao.getUserPermissionIds(userId);

	return {
		success: true,
		data: permissionIds,
		isAdmin: false,
	};
}, { skipLog: true });

/**
 * Check if current user can access a specific page URL
 * 
 * 使用 auth 前缀：只需要登录 + 后台访问权限，不需要 RBAC 检查
 * @param {String} pageUrl - Page URL to check, e.g. '/admin/users'
 * @returns {Promise<Object>} Access check result
 */
export const checkPageAccessAction = wrapAction('authCheckPageAccess', async (pageUrl, ctx) => {
	// 检查后台访问权限
	const backendCheck = await checkBackendAccessAction();
	if (!backendCheck.hasAccess) {
		return { success: false, hasAccess: false, error: backendCheck.error };
	}

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return { success: false, hasAccess: false, error: 'Unauthorized: Please login' };
	}

	const userId = session.user.id;
	const userRole = session.user.role;

	// Admin role: can access all pages
	if (userRole === 'admin') {
		return {
			success: true,
			hasAccess: true,
			isAdmin: true,
		};
	}

	// Get user's accessible menus
	const menuTree = await sysDao.getUserMenus(userId);

	// Check if pageUrl exists in user's menu tree
	const hasAccess = checkUrlInMenuTree(pageUrl, menuTree);

	return {
		success: true,
		hasAccess,
		isAdmin: false,
	};
}, { skipLog: true });

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
 * 
 * 使用 auth 前缀：只需要登录 + 后台访问权限，不需要 RBAC 检查
 * @returns {Promise<Object>} User's roles result
 */
export const getUserRolesAction = wrapAction('authQueryUserRoles', async (_, ctx) => {
	// 检查后台访问权限
	const backendCheck = await checkBackendAccessAction();
	if (!backendCheck.hasAccess) {
		return { success: false, error: backendCheck.error };
	}

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return { success: false, error: 'Unauthorized: Please login' };
	}

	const userId = session.user.id;
	const userRole = session.user.role;

	// Get RBAC role IDs
	const roleIds = await sysDao.getUserRoleIds(userId);

	return {
		success: true,
		data: {
			betterAuthRole: userRole, // 'admin' or 'user'
			rbacRoles: roleIds, // RBAC role UUIDs
		},
	};
}, { skipLog: true });
