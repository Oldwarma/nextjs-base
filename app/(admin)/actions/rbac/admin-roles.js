'use server';

/**
 * 角色管理 Server Actions
 * 使用核心库自动处理权限验证和日志记录
 */

import { createCrudActions } from '@/lib/core/crud-helper';
import { wrapQueryAction, wrapAdminAction } from '@/lib/core/action-wrapper';
import { roleCrudConfig } from '@/app/(admin)/actions/rbac/configs/role-crud.config';
import * as sysDao from '@/app/(admin)/actions/dao/sys';

/**
 * 创建标准 CRUD Actions
 * 自动包含：权限验证、日志记录、错误处理
 */
const crudActions = createCrudActions(roleCrudConfig);

/**
 * 导出标准 CRUD Actions
 */
export const getRoleListAction = crudActions.getList;
export const getRoleDetailAction = wrapQueryAction('role', async ({ id }) => {
	// 获取角色详情，包含权限和菜单名称
	const role = await sysDao.findRoleByIdWithNames(id);
	
	if (!role) {
		return {
			success: false,
			error: 'Role not found',
		};
	}

	return {
		success: true,
		data: role,
	};
});

export const createRoleAction = crudActions.create;
export const updateRoleAction = crudActions.update;
export const deleteRoleAction = crudActions.delete;
export const batchUpdateRolesAction = crudActions.batchUpdate;
export const batchDeleteRolesAction = crudActions.batchDelete;

/**
 * 自定义 Actions
 */

/**
 * 获取角色列表（用于选择器）
 * 只返回启用的角色，可选添加标签
 */
export const getRoleListForSelectAction = wrapQueryAction('role', async ({ withLabel = false } = {}) => {
	// 获取所有启用的角色（不分页）
	const result = await crudActions._dao.getList({
		pageIndex: 1,
		pageSize: 1000,
		filters: { enable: true },
	});

	if (!result.success) {
		return result;
	}

	let roles = result.data || [];

	// 如果需要标签，添加详细标签
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
				label: `${role.name} (${role.id})${badgeStr}${remarkStr}`,
				value: role.id,
			};
		});
	}

	return {
		success: true,
		data: roles,
	};
});

/**
 * 分配权限给角色
 */
export const assignPermissionsToRoleAction = wrapAdminAction(
	'assign_permissions',
	'role',
	async ({ roleId, permissionIds }, context) => {
		// 验证输入
		if (!roleId || !Array.isArray(permissionIds)) {
			return {
				success: false,
				error: 'Invalid parameters: roleId and permissionIds (array) are required',
			};
		}

	// 更新角色的权限列表
	const result = await crudActions._dao.update(roleId, { permission: permissionIds });

	return result;
	}
);

/**
 * 分配菜单给角色
 */
export const assignMenusToRoleAction = wrapAdminAction(
	'assign_menus',
	'role',
	async ({ roleId, menuIds }, context) => {
		// 验证输入
		if (!roleId || !Array.isArray(menuIds)) {
			return {
				success: false,
				error: 'Invalid parameters: roleId and menuIds (array) are required',
			};
		}

		// 更新角色的菜单列表
		const result = await crudActions._dao.update(roleId, { menu: menuIds });

		return result;
	}
);

/**
 * 切换角色启用/禁用状态
 */
export const toggleRoleStatusAction = wrapAdminAction(
	'toggle_status',
	'role',
	async ({ roleId, enable }, context) => {
		const result = await crudActions._dao.update({
			id: roleId,
			data: { enable },
			userId: context.userId,
		});

		return result;
	}
);
