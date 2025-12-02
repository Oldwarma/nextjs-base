'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
	getUserPermissionIdsAction, 
	getUserAccessibleMenusAction,
	checkPageAccessAction 
} from '@/app/(admin)/actions/rbac/user-permissions';
import nb from '@/lib/function';

/**
 * Hook to check if user has specific permission
 * @returns {Object} Permission checker functions and state
 */
export function usePermission() {
	const [permissions, setPermissions] = useState([]);
	const [isAdmin, setIsAdmin] = useState(false);
	const [loading, setLoading] = useState(true);

	// Load user permissions on mount
	useEffect(() => {
		const loadPermissions = async () => {
			setLoading(true);
			try {
				const result = await getUserPermissionIdsAction();
				if (result.success) {
					setPermissions(result.data || []);
					setIsAdmin(result.isAdmin || false);
				}
			} catch (error) {
				console.error('Failed to load permissions:', error);
			} finally {
				setLoading(false);
			}
		};

		loadPermissions();
	}, []);

	/**
	 * Check if user has specific permission
	 * @param {String} permissionId - Permission ID to check
	 * @returns {Boolean} Whether user has permission
	 */
	const hasPermission = useCallback(
		(permissionId) => {
			// Admin has all permissions
			if (isAdmin || permissions.includes('*')) {
				return true;
			}

			return permissions.includes(permissionId);
		},
		[permissions, isAdmin]
	);

	/**
	 * Check if user has any of the specified permissions
	 * @param {Array<String>} permissionIds - Permission IDs to check
	 * @returns {Boolean} Whether user has any permission
	 */
	const hasAnyPermission = useCallback(
		(permissionIds) => {
			if (!nb.pubfn.isArray(permissionIds)) {
				return false;
			}

			// Admin has all permissions
			if (isAdmin || permissions.includes('*')) {
				return true;
			}

			return permissionIds.some((id) => permissions.includes(id));
		},
		[permissions, isAdmin]
	);

	/**
	 * Check if user has all of the specified permissions
	 * @param {Array<String>} permissionIds - Permission IDs to check
	 * @returns {Boolean} Whether user has all permissions
	 */
	const hasAllPermissions = useCallback(
		(permissionIds) => {
			if (!nb.pubfn.isArray(permissionIds)) {
				return false;
			}

			// Admin has all permissions
			if (isAdmin || permissions.includes('*')) {
				return true;
			}

			return permissionIds.every((id) => permissions.includes(id));
		},
		[permissions, isAdmin]
	);

	return {
		permissions,
		isAdmin,
		loading,
		hasPermission,
		hasAnyPermission,
		hasAllPermissions,
	};
}

/**
 * Hook to check if user can access specific page
 * @param {String} pageUrl - Page URL to check
 * @returns {Object} Access check state
 */
export function usePageAccess(pageUrl) {
	const [hasAccess, setHasAccess] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (!pageUrl) {
			setLoading(false);
			return;
		}

		const checkAccess = async () => {
			setLoading(true);
			setError(null);
			try {
				const result = await checkPageAccessAction(pageUrl);
				if (result.success) {
					setHasAccess(result.hasAccess);
				} else {
					setError(result.error);
					setHasAccess(false);
				}
			} catch (err) {
				setError(err.message);
				setHasAccess(false);
			} finally {
				setLoading(false);
			}
		};

		checkAccess();
	}, [pageUrl]);

	return {
		hasAccess,
		loading,
		error,
	};
}

/**
 * Hook to get user's accessible menus
 * @returns {Object} Menu state
 */
export function useUserMenus() {
	const [menus, setMenus] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const loadMenus = async () => {
			setLoading(true);
			setError(null);
			try {
				const result = await getUserAccessibleMenusAction();
				if (result.success) {
					setMenus(result.data || []);
				} else {
					setError(result.error);
				}
			} catch (err) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		loadMenus();
	}, []);

	return {
		menus,
		loading,
		error,
	};
}

