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
 * 获取权限树（用于 TreeSelect 选择器）
 * 返回树形结构
 */
export const getPermissionTreeForSelectAction = wrapQueryAction('permission', async () => {
	// 使用 sysDao.getPermissionTreeForSelect 获取完整的权限树
	const tree = await sysDao.getPermissionTreeForSelect({ withLabel: false });
	
	return {
		success: true,
		data: tree || [],
	};
});

/**
 * 获取权限列表（用于普通 Select 或 Checkbox）
 * 返回扁平化列表，适配角色页面的权限分配
 */
export const getPermissionListForSelectAction = wrapQueryAction('permission', async () => {
	// 获取所有启用的权限（扁平化）
	const result = await crudActions._dao.getList({
		pageIndex: 1,
		pageSize: 1000,
		filters: { enable: true },
	});

	if (!result.success) {
		return result;
	}

	const permissions = (result.data || []).map(perm => ({
		id: perm.id,
		name: perm.name,
		code: perm.code,
		category: perm.category,
		parent_id: perm.parent_id,
	}));

	return {
		success: true,
		data: permissions,
	};
});
