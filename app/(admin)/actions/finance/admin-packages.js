'use server';

import { createCrudActions } from '@/app/(admin)/actions/dao/base';
import { packageCrudConfig } from '@/app/(admin)/actions/finance/configs/package-crud.config';
import { checkAdminAction } from '@/lib/auth/admin-auth';
import { getUserPackages } from '@/lib/business/packages';

// 创建套餐 CRUD Actions
const packageCrud = createCrudActions(packageCrudConfig);

/**
 * 获取所有套餐（管理员）
 * 包括激活和未激活的套餐
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>} 套餐列表结果
 */
export async function getAllPackagesAdminAction(params = {}) {
	return await packageCrud.getList(params);
}

/**
 * 获取套餐详情（管理员）
 * @param {String} packageId - 套餐ID
 * @returns {Promise<Object>} 套餐详情
 */
export async function getPackageDetailAction(packageId) {
	return await packageCrud.getDetail(packageId);
}

/**
 * 创建套餐（管理员）
 * @param {Object} packageData - 套餐数据
 * @returns {Promise<Object>} 创建结果
 */
export async function createPackageAction(packageData) {
	return await packageCrud.create(packageData);
}

/**
 * 更新套餐（管理员）
 * @param {String} packageId - 套餐ID
 * @param {Object} updates - 更新数据
 * @returns {Promise<Object>} 更新结果
 */
export async function updatePackageAction(packageId, updates) {
	return await packageCrud.update(packageId, updates);
}

/**
 * 删除套餐（管理员）
 * @param {String} packageId - 套餐ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deletePackageAction(packageId) {
	return await packageCrud.delete(packageId);
}

/**
 * 批量更新套餐（管理员）
 * @param {Array} packageIds - 套餐ID数组
 * @param {Object} updates - 更新数据
 * @returns {Promise<Object>} 更新结果
 */
export async function batchUpdatePackagesAction(packageIds, updates) {
	return await packageCrud.batchUpdate(packageIds, updates);
}

/**
 * 批量删除套餐（管理员）
 * @param {Array} packageIds - 套餐ID数组
 * @returns {Promise<Object>} 删除结果
 */
export async function batchDeletePackagesAction(packageIds) {
	return await packageCrud.batchDelete(packageIds);
}

/**
 * 获取用户的套餐购买记录（管理员）
 * 这是一个自定义方法，不使用 BaseDAO
 * @param {String} userId - 用户ID
 * @returns {Promise<Object>} 用户套餐列表
 */
export async function getUserPackagesAdminAction(userId) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return { success: false, error: adminCheck.error };
	}

	try {
		const packages = await getUserPackages(userId);
		return { success: true, data: packages };
	} catch (error) {
		return { success: false, error: error.message };
	}
}
