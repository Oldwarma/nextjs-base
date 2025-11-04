'use server';

import { createCrudActions } from '@/app/(admin)/actions/dao/base';
import { roleCrudConfig } from '@/app/(admin)/actions/configs/role-crud.config';
import { checkAdminAction } from '@/lib/admin-auth';
import * as sysDao from '@/app/(admin)/actions/dao/sys';

// Create role CRUD Actions using BaseDAO
const roleCrud = createCrudActions(roleCrudConfig);

/**
 * Get role list (Admin)
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Role list result
 */
export async function getRoleListAction({ pageIndex = 1, pageSize = 20, search, filters = {} } = {}) {
	return await roleCrud.getList({
		pageIndex,
		pageSize,
		search,
		filters,
	});
}

/**
 * Get role list for selection (Admin)
 * 专门用于选择器的角色列表，只返回启用的角色，带标签格式
 * @param {Object} params - Query parameters
 * @param {Boolean} params.withLabel - Whether to add label field
 * @returns {Promise<Object>} Role list with labels
 */
export async function getRoleListForSelectAction({ withLabel = false } = {}) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return {
			success: false,
			error: adminCheck.error,
		};
	}

	try {
		// 获取所有启用的角色（不分页）
		const result = await roleCrud.getList({
			pageIndex: 1,
			pageSize: 1000,
			filters: { enable: true },
		});

		if (!result.success) {
			return result;
		}

		let roles = result.data || [];

		// 如果需要标签，添加标签字段
		if (withLabel) {
			roles = roles.map((role) => {
				const badges = [];
				
				// 禁用标签
				if (!role.enable) {
					badges.push('[已禁用]');
				}
				
				// 权限数量
				const permCount = Array.isArray(role.permission) ? role.permission.length : 0;
				if (permCount > 0) {
					badges.push(`${permCount}权限`);
				}
				
				// 菜单数量
				const menuCount = Array.isArray(role.menu) ? role.menu.length : 0;
				if (menuCount > 0) {
					badges.push(`${menuCount}菜单`);
				}

				const badgeStr = badges.length > 0 ? ` ${badges.join(' ')}` : '';
				const remarkStr = role.remark ? ` - ${role.remark}` : '';

				return {
					...role,
					label: `${role.role_name} (${role.role_id})${badgeStr}${remarkStr}`,
				};
			});
		}

		return {
			success: true,
			data: roles,
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * Get role detail (Admin)
 * @param {String} roleId - Role ID
 * @returns {Promise<Object>} Role detail
 */
export async function getRoleDetailAction(roleId) {
	return await roleCrud.getDetail(roleId);
}

/**
 * Create role (Admin)
 * @param {Object} data - Role data
 * @returns {Promise<Object>} Create result
 */
export async function createRoleAction(data) {
	return await roleCrud.create(data);
}

/**
 * Update role (Admin)
 * @param {String} roleId - Role ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Update result
 */
export async function updateRoleAction(roleId, data) {
	return await roleCrud.update(roleId, data);
}

/**
 * Delete role (Admin)
 * @param {String} roleId - Role ID
 * @returns {Promise<Object>} Delete result
 */
export async function deleteRoleAction(roleId) {
	return await roleCrud.delete(roleId);
}

/**
 * Batch update roles (Admin)
 * @param {Array} roleIds - Role ID array
 * @param {Object} updates - Update data
 * @returns {Promise<Object>} Update result
 */
export async function batchUpdateRolesAction(roleIds, updates) {
	return await roleCrud.batchUpdate(roleIds, updates);
}

/**
 * Batch delete roles (Admin)
 * @param {Array} roleIds - Role ID array
 * @returns {Promise<Object>} Delete result
 */
export async function batchDeleteRolesAction(roleIds) {
	return await roleCrud.batchDelete(roleIds);
}

/**
 * Bind permissions to role (Admin)
 * @param {String} roleId - Role ID
 * @param {Array<String>} permissionIds - Permission ID array
 * @param {Boolean} reset - Whether to reset (true=replace, false=append)
 * @returns {Promise<Object>} Update result
 */
export async function roleBindPermissionsAction(roleId, permissionIds, reset = false) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return {
			success: false,
			error: adminCheck.error,
		};
	}

	try {
		const result = await sysDao.roleBindPermissions({
			roleId,
			permissionIds,
			reset,
		});

		return {
			success: result.success,
			data: result,
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * Bind menus to role (Admin)
 * @param {String} roleId - Role ID
 * @param {Array<String>} menuIds - Menu ID array
 * @param {Boolean} reset - Whether to reset (true=replace, false=append)
 * @param {Boolean} autoBindMenuPermissions - Whether to auto bind menu's permissions
 * @returns {Promise<Object>} Update result
 */
export async function roleBindMenusAction(roleId, menuIds, reset = false, autoBindMenuPermissions = false) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return {
			success: false,
			error: adminCheck.error,
		};
	}

	try {
		const result = await sysDao.roleBindMenus({
			roleId,
			menuIds,
			reset,
			autoBindMenuPermissions,
		});

		return {
			success: result.success,
			data: result,
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * Get role's permissions (Admin)
 * @param {String} roleId - Role ID
 * @returns {Promise<Object>} Permission IDs result
 */
export async function getRolePermissionsAction(roleId) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return {
			success: false,
			error: adminCheck.error,
		};
	}

	try {
		const role = await sysDao.findRoleById(roleId);

		if (!role) {
			return {
				success: false,
				error: 'Role not found',
			};
		}

		return {
			success: true,
			data: role.permission || [],
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * Get role's menus (Admin)
 * @param {String} roleId - Role ID
 * @returns {Promise<Object>} Menu IDs result
 */
export async function getRoleMenusAction(roleId) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return {
			success: false,
			error: adminCheck.error,
		};
	}

	try {
		const role = await sysDao.findRoleById(roleId);

		if (!role) {
			return {
				success: false,
				error: 'Role not found',
			};
		}

		return {
			success: true,
			data: role.menu || [],
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

