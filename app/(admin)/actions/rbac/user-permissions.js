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
import { prisma } from '@/lib/database/prisma';
import * as sysDao from '@/app/(admin)/actions/dao/sys';
import { wrapAction } from '@/lib/core/action-wrapper';
import { checkBackendAccessAction } from '@/lib/auth/admin-auth';

/**
 * Get current user's accessible menus (RBAC-aware)
 */
export const getUserAccessibleMenusAction = wrapAction('authQueryUserAccessibleMenus', async (_, ctx) => {
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

	// Admin role: get all enabled menus
	if (userRole === 'admin') {
		const allMenus = await prisma.menu.findMany({
			where: {
				enable: true,
				deletedAt: null,
			},
			orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
		});

		const menuTree = buildMenuTreeFromFlat(allMenus);

		return {
			success: true,
			data: menuTree,
			isAdmin: true,
		};
	}

	// Regular user: get menus based on RBAC roles
	const menuTree = await sysDao.getUserMenus(userId);

	return {
		success: true,
		data: menuTree,
		isAdmin: false,
	};
}, { skipLog: true });

/**
 * Get current user's permission IDs
 */
export const getUserPermissionIdsAction = wrapAction('authQueryUserPermissionIds', async (_, ctx) => {
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
			data: ['*'],
			isAdmin: true,
		};
	}

	const permissionIds = await sysDao.getUserPermissionIds(userId);

	return {
		success: true,
		data: permissionIds,
		isAdmin: false,
	};
}, { skipLog: true });

/**
 * Check if current user can access a specific page URL
 */
export const checkPageAccessAction = wrapAction('authCheckPageAccess', async (pageUrl, ctx) => {
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

	const menuTree = await sysDao.getUserMenus(userId);
	const hasAccess = checkUrlInMenuTree(pageUrl, menuTree);

	return {
		success: true,
		hasAccess,
		isAdmin: false,
	};
}, { skipLog: true });

/**
 * Helper: Build menu tree from flat array
 */
function buildMenuTreeFromFlat(menus, parentId = null) {
	const tree = [];

	for (const menu of menus) {
		if (!menu.enable || menu.hidden) {
			continue;
		}

		if (menu.parentId === parentId) {
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
 */
function checkUrlInMenuTree(url, menuTree) {
	if (!Array.isArray(menuTree)) {
		return false;
	}

	for (const menu of menuTree) {
		if (menu.url === url) {
			return true;
		}

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
 */
export const getUserRolesAction = wrapAction('authQueryUserRoles', async (_, ctx) => {
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

	const roleIds = await sysDao.getUserRoleIds(userId);

	return {
		success: true,
		data: {
			betterAuthRole: userRole,
			rbacRoles: roleIds,
		},
	};
}, { skipLog: true });
