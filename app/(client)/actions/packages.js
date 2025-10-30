'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getActivePackages, purchasePackage, getUserPackages, getUserCurrentPackage } from '@/lib/packages';

/**
 * 获取所有可用套餐
 * @returns {Promise<Object>} 套餐列表
 */
export async function getActivePackagesAction() {
	try {
		const packages = await getActivePackages();
		return {
			success: true,
			data: packages,
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * 购买套餐
 * @param {string} packageId - 套餐ID
 * @param {Object} paymentInfo - 支付信息
 * @returns {Promise<Object>} 购买结果
 */
export async function purchasePackageAction(packageId, paymentInfo = {}) {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		return {
			success: false,
			error: 'Unauthorized',
		};
	}

	if (!packageId) {
		return {
			success: false,
			error: 'Package ID is required',
		};
	}

	try {
		const result = await purchasePackage(session.user.id, packageId, paymentInfo);

		return {
			success: true,
			data: result,
			message: 'Package purchased successfully',
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * 获取用户的套餐购买记录
 * @param {Object} options - 查询选项
 * @param {number} options.pageIndex - 页码
 * @param {number} options.pageSize - 每页数量
 * @param {string} options.status - 状态筛选
 * @returns {Promise<Object>} 购买记录（分页）
 */
export async function getUserPackagesAction({ pageIndex = 1, pageSize = 10, status = null } = {}) {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		return {
			success: false,
			error: 'Unauthorized',
		};
	}

	try {
		const packages = await getUserPackages(session.user.id, {
			pageIndex,
			pageSize,
			status,
		});

		return {
			success: true,
			data: packages,
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * 获取用户当前有效套餐
 * @returns {Promise<Object>} 当前套餐信息
 */
export async function getUserCurrentPackageAction() {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		return {
			success: false,
			error: 'Unauthorized',
		};
	}

	try {
		const currentPackage = await getUserCurrentPackage(session.user.id);

		return {
			success: true,
			data: currentPackage,
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

