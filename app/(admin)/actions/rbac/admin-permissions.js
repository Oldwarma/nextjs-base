'use server';

/**
 * 权限管理 Server Actions
 * 使用核心库自动处理权限验证和日志记录
 */

import { createCrudActions } from '@/lib/core/crud-helper';
import { wrapQueryAction } from '@/lib/core/action-wrapper';
import { permissionCrudConfig } from '@/app/(admin)/actions/rbac/configs/permission-crud.config';
import * as sysDao from '@/app/(admin)/actions/dao/sys';

/**
 * 创建标准 CRUD Actions
 */
const crudActions = createCrudActions(permissionCrudConfig);

/**
 * 导出标准 CRUD Actions
 */
export const getPermissionListAction = crudActions.getList;
export const getPermissionDetailAction = crudActions.getDetail;
export const createPermissionAction = crudActions.create;
export const updatePermissionAction = crudActions.update;
export const deletePermissionAction = crudActions.delete;
export const batchUpdatePermissionsAction = crudActions.batchUpdate;
export const batchDeletePermissionsAction = crudActions.batchDelete;

/**
 * 自定义 Actions
 */

/**
 * 获取权限树（用于树形展示）
 */
export const getPermissionTreeAction = wrapQueryAction('permission', async ({ pageIndex = 1, pageSize = 1000, filters = {} } = {}) => {
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
});

/**
 * 获取权限列表（用于选择器）
 * 按 parent 分组
 */
export const getPermissionListForSelectAction = wrapQueryAction('permission', async ({ withLabel = false } = {}) => {
	// 获取所有启用的权限
	const result = await crudActions._dao.getList({
		pageIndex: 1,
		pageSize: 1000,
		filters: { enable: true },
	});

	if (!result.success) {
		return result;
	}

	let permissions = result.data || [];

	// 如果需要标签，格式化为分组
	if (withLabel) {
		// 按 parent 分组
		const grouped = permissions.reduce((acc, perm) => {
			const parentId = perm.parent || 'root';
			if (!acc[parentId]) {
				acc[parentId] = [];
			}
			acc[parentId].push({
				...perm,
				label: `${perm.name} (${perm.id})`,
				value: perm.id,
			});
			return acc;
		}, {});

		// 转换为选项格式
		const options = Object.entries(grouped).map(([parentId, children]) => ({
			label: parentId === 'root' ? 'Root Permissions' : parentId,
			options: children,
		}));

		return {
			success: true,
			data: options,
		};
	}

	return {
		success: true,
		data: permissions,
	};
});
