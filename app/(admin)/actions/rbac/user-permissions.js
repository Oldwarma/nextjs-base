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
import nb from '@/lib/function';

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

		// 使用 arrayToTree 构建树形结构
		const menuTree = nb.pubfn.tree.arrayToTree(allMenus, {
			filter: (item) => item.enable && !item.hidden,
			sortBy: [{ field: 'sort', order: 'asc' }],
		});

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
	// 使用 findInTree 检查 URL 是否存在
	const hasAccess = !!nb.pubfn.tree.findInTree(menuTree, (item) => item.url === pageUrl);

	return {
		success: true,
		hasAccess,
		isAdmin: false,
	};
}, { skipLog: true });

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
