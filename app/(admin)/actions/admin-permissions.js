'use server';

import { createCrudActions } from '@/app/(admin)/actions/dao/base';
import { permissionCrudConfig } from '@/app/(admin)/actions/configs/permission-crud.config';
import { checkAdminAction } from '@/lib/admin-auth';
import * as sysDao from '@/app/(admin)/actions/dao/sys';

// Create permission CRUD Actions using BaseDAO
const permissionCrud = createCrudActions(permissionCrudConfig);

/**
 * Get permission list (Admin)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Permission list result
 */
export async function getPermissionListAction({ pageIndex = 1, pageSize = 100, search, filters = {} } = {}) {
	return await permissionCrud.getList({
		pageIndex,
		pageSize,
		search,
		filters,
	});
}

/**
 * Get permission tree (Admin) - For tree display
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Permission tree result
 */
export async function getPermissionTreeAction({ pageIndex = 1, pageSize = 1000, filters = {} } = {}) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return {
			success: false,
			error: adminCheck.error,
		};
	}

	try {
		const result = await sysDao.getPermissionTree({
			pageIndex,
			pageSize,
			filters,
		});

		// 返回扁平化的格式，适配 SmartCrudPage
		return {
			success: true,
			data: result.rows || [],
			total: result.total || 0,
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * Get permission tree for select (Admin) - For tree selector component
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Permission tree with labels
 */
export async function getPermissionTreeForSelectAction({ withLabel = true } = {}) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return {
			success: false,
			error: adminCheck.error,
		};
	}

	try {
		const tree = await sysDao.getPermissionTreeForSelect({ withLabel });

		return {
			success: true,
			data: tree,
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * Get all permissions (flat list) - For admin operations
 * @param {Object} filters - Filter conditions
 * @returns {Promise<Object>} Permission list result
 */
export async function getAllPermissionsAction(filters = {}) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return {
			success: false,
			error: adminCheck.error,
		};
	}

	try {
		const permissions = await sysDao.getAllPermissions(filters);

		return {
			success: true,
			data: permissions,
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * Get permission detail (Admin)
 * @param {String} permissionId - Permission ID
 * @returns {Promise<Object>} Permission detail
 */
export async function getPermissionDetailAction(permissionId) {
	return await permissionCrud.getDetail(permissionId);
}

/**
 * Create permission (Admin)
 * @param {Object} data - Permission data
 * @returns {Promise<Object>} Create result
 */
export async function createPermissionAction(data) {
	return await permissionCrud.create(data);
}

/**
 * Update permission (Admin)
 * @param {String} permissionId - Permission ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Update result
 */
export async function updatePermissionAction(permissionId, data) {
	return await permissionCrud.update(permissionId, data);
}

/**
 * Delete permission (Admin)
 * @param {String} permissionId - Permission ID
 * @returns {Promise<Object>} Delete result
 */
export async function deletePermissionAction(permissionId) {
	return await permissionCrud.delete(permissionId);
}

/**
 * Batch update permissions (Admin)
 * @param {Array} permissionIds - Permission ID array
 * @param {Object} updates - Update data
 * @returns {Promise<Object>} Update result
 */
export async function batchUpdatePermissionsAction(permissionIds, updates) {
	return await permissionCrud.batchUpdate(permissionIds, updates);
}

/**
 * Batch delete permissions (Admin)
 * @param {Array} permissionIds - Permission ID array
 * @returns {Promise<Object>} Delete result
 */
export async function batchDeletePermissionsAction(permissionIds) {
	return await permissionCrud.batchDelete(permissionIds);
}

/**
 * Get all child permission IDs (recursive)
 * @param {String} permissionId - Parent permission ID
 * @returns {Promise<Object>} Child permission IDs result
 */
export async function getAllChildPermissionIdsAction(permissionId) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return {
			success: false,
			error: adminCheck.error,
		};
	}

	try {
		const childIds = await sysDao.getAllChildPermissionIds(permissionId);

		return {
			success: true,
			data: childIds,
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * Update permission actions (Admin) - Convenience method for updating actions field
 * @param {String} permissionId - Permission ID
 * @param {Array<String>} actions - Action paths array
 * @returns {Promise<Object>} Update result
 */
export async function updatePermissionActionsAction(permissionId, actions) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return {
			success: false,
			error: adminCheck.error,
		};
	}

	try {
		// Validate actions is an array
		if (!Array.isArray(actions)) {
			return {
				success: false,
				error: 'Actions must be an array',
			};
		}

		// Update using BaseDAO
		const result = await permissionCrud.update(permissionId, { actions });

		return result;
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * Add action to permission (Admin) - Add a single action path
 * @param {String} permissionId - Permission ID
 * @param {String} actionPath - Action path to add
 * @returns {Promise<Object>} Update result
 */
export async function addActionToPermissionAction(permissionId, actionPath) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return {
			success: false,
			error: adminCheck.error,
		};
	}

	try {
		// Get current permission
		const permission = await sysDao.findPermissionById(permissionId);

		if (!permission) {
			return {
				success: false,
				error: 'Permission not found',
			};
		}

		// Get current actions
		const currentActions = permission.actions || [];

		// Add new action if not exists
		if (!currentActions.includes(actionPath)) {
			currentActions.push(actionPath);

			// Update using BaseDAO
			const result = await permissionCrud.update(permissionId, { actions: currentActions });

			return result;
		}

		return {
			success: true,
			message: 'Action already exists',
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * Remove action from permission (Admin) - Remove a single action path
 * @param {String} permissionId - Permission ID
 * @param {String} actionPath - Action path to remove
 * @returns {Promise<Object>} Update result
 */
export async function removeActionFromPermissionAction(permissionId, actionPath) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return {
			success: false,
			error: adminCheck.error,
		};
	}

	try {
		// Get current permission
		const permission = await sysDao.findPermissionById(permissionId);

		if (!permission) {
			return {
				success: false,
				error: 'Permission not found',
			};
		}

		// Get current actions
		const currentActions = permission.actions || [];

		// Remove action
		const updatedActions = currentActions.filter((action) => action !== actionPath);

		// Update using BaseDAO
		const result = await permissionCrud.update(permissionId, { actions: updatedActions });

		return result;
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

