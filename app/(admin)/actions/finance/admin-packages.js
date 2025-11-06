'use server';

/**
 * 套餐管理 Server Actions
 * 使用核心库自动处理权限验证和日志记录
 */

import { createCrudActions } from '@/lib/core/crud-helper';
import { wrapQueryAction } from '@/lib/core/action-wrapper';
import { packageCrudConfig } from '@/app/(admin)/actions/finance/configs/package-crud.config';
import { getUserPackages } from '@/lib/business/packages';

/**
 * 创建标准 CRUD Actions
 */
const crudActions = createCrudActions(packageCrudConfig);

/**
 * 导出标准 CRUD Actions
 */
export const getAllPackagesAdminAction = crudActions.getList;
export const getPackageDetailAction = crudActions.getDetail;
export const createPackageAction = crudActions.create;
export const updatePackageAction = crudActions.update;
export const deletePackageAction = crudActions.delete;
export const batchUpdatePackagesAction = crudActions.batchUpdate;
export const batchDeletePackagesAction = crudActions.batchDelete;

/**
 * 自定义 Actions
 */

/**
 * 获取用户购买记录
 */
export const getUserPackagesAction = wrapQueryAction('package', async ({ userId, pageIndex = 1, pageSize = 20 } = {}) => {
	if (!userId) {
		return {
			success: false,
			error: 'User ID is required',
		};
	}

	const result = await getUserPackages({
		userId,
		pageIndex,
		pageSize,
	});

	return result;
});
