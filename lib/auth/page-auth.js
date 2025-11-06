import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import * as sysDao from '@/app/(admin)/actions/dao/sys';

/**
 * Check if user can access admin page with RBAC permissions
 * Redirects if no access
 * 
 * @param {String} pageUrl - Optional page URL to check (e.g. '/admin/users')
 * @returns {Promise<Object>} Session object if authorized
 */
export async function checkPageAccess(pageUrl = null) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	// Check if logged in
	if (!session?.user) {
		redirect('/en/login?error=unauthorized');
	}

	const userId = session.user.id;
	const userRole = session.user.role;

	// Admin role has access to all pages
	if (userRole === 'admin') {
		return session;
	}

	// If no specific page URL, just check if user is logged in
	if (!pageUrl) {
		return session;
	}

	// Check if user has access to the specific page via RBAC menus
	const menuTree = await sysDao.getUserMenus(userId);
	const hasAccess = checkUrlInMenuTree(pageUrl, menuTree);

	if (!hasAccess) {
		redirect('/admin?error=forbidden');
	}

	return session;
}

/**
 * Check if user can access admin page (non-redirecting version)
 * Returns boolean result
 * 
 * @param {String} pageUrl - Optional page URL to check
 * @returns {Promise<Object>} Access check result
 */
export async function canAccessPage(pageUrl = null) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return { hasAccess: false, error: 'Unauthorized' };
		}

		const userId = session.user.id;
		const userRole = session.user.role;

		// Admin role has access to all pages
		if (userRole === 'admin') {
			return { hasAccess: true, isAdmin: true };
		}

		// If no specific page URL, just check if user is logged in
		if (!pageUrl) {
			return { hasAccess: true, isAdmin: false };
		}

		// Check if user has access to the specific page via RBAC menus
		const menuTree = await sysDao.getUserMenus(userId);
		const hasAccess = checkUrlInMenuTree(pageUrl, menuTree);

		return { hasAccess, isAdmin: false };
	} catch (error) {
		return { hasAccess: false, error: error.message };
	}
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
 * Check admin access with optional RBAC permission check
 * 
 * @param {String} requiredPermission - Optional permission ID to check
 * @returns {Promise<Object>} Session object if authorized
 */
export async function checkAdminOrPermission(requiredPermission = null) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	// Check if logged in
	if (!session?.user) {
		redirect('/en/login?error=unauthorized');
	}

	const userId = session.user.id;
	const userRole = session.user.role;

	// Admin role has all permissions
	if (userRole === 'admin') {
		return session;
	}

	// If no specific permission required, only admin can access
	if (!requiredPermission) {
		redirect('/admin?error=forbidden');
	}

	// Check if user has the required permission
	const hasPermission = await sysDao.checkUserHasPermission(userId, requiredPermission);

	if (!hasPermission) {
		redirect('/admin?error=forbidden');
	}

	return session;
}

