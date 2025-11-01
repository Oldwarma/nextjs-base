'use server';

import { createCrudActions } from '@/app/(admin)/actions/dao/base';
import { creditTransactionCrudConfig } from '@/app/(admin)/actions/configs/credit-transaction-crud.config';
import { checkAdminAction } from '@/lib/admin-auth';
import { adminAdjustCredits, getCreditTransactions } from '@/lib/credits';

// 创建积分交易记录 CRUD Actions（只读）
const creditTransactionCrud = createCrudActions(creditTransactionCrudConfig);

/**
 * 获取积分交易记录列表（管理员）
 * @param {Object} params - 查询参数
 * @param {Number} params.pageIndex - 页码
 * @param {Number} params.pageSize - 每页数量
 * @param {String} params.search - 搜索关键词（userId, reason, relatedId）
 * @param {Object} params.filters - 过滤条件（如 type, userId）
 * @returns {Promise<Object>} 交易记录列表结果
 */
export async function getCreditTransactionListAction(params = {}) {
	return await creditTransactionCrud.getList(params);
}

/**
 * 获取单个积分交易记录详情（管理员）
 * @param {String} transactionId - 交易记录ID
 * @returns {Promise<Object>} 交易记录详情
 */
export async function getCreditTransactionDetailAction(transactionId) {
	return await creditTransactionCrud.getDetail(transactionId);
}

/**
 * 获取指定用户的积分交易记录（管理员）
 * 这是一个便捷方法，用于查询特定用户的交易记录
 * @param {String} userId - 用户ID
 * @param {Object} options - 查询选项
 * @param {Number} options.pageIndex - 页码
 * @param {Number} options.pageSize - 每页数量
 * @returns {Promise<Object>} 交易记录列表
 */
export async function getUserCreditTransactionsAction(userId, { pageIndex = 1, pageSize = 20 } = {}) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return { success: false, error: adminCheck.error };
	}

	try {
		const result = await getCreditTransactions(userId, { pageIndex, pageSize });
		return { success: true, data: result };
	} catch (error) {
		return { success: false, error: error.message };
	}
}

/**
 * 管理员调整用户积分（管理员）
 * 可以是正数（增加）或负数（扣除）
 * @param {String} userId - 用户ID
 * @param {Number} amount - 调整数量（正数=增加，负数=扣除）
 * @param {String} reason - 调整原因
 * @returns {Promise<Object>} 调整结果
 */
export async function adminAdjustCreditsAction(userId, amount, reason = 'admin_adjustment') {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return { success: false, error: adminCheck.error };
	}

	try {
		const result = await adminAdjustCredits(userId, amount, reason, adminCheck.userId);
		return {
			success: true,
			message: amount > 0 ? 'Credits added successfully' : 'Credits deducted successfully',
			data: result,
		};
	} catch (error) {
		return { success: false, error: error.message };
	}
}

/**
 * 管理员增加用户积分（管理员）
 * 这是 adminAdjustCreditsAction 的便捷方法
 * @param {String} userId - 用户ID
 * @param {Number} amount - 积分数量（正数）
 * @param {String} reason - 原因
 * @returns {Promise<Object>} 调整结果
 */
export async function adminAddCreditsAction(userId, amount, reason = 'admin_adjustment') {
	if (amount <= 0) {
		return { success: false, error: 'Amount must be positive' };
	}
	return await adminAdjustCreditsAction(userId, amount, reason);
}

/**
 * 管理员扣除用户积分（管理员）
 * 这是 adminAdjustCreditsAction 的便捷方法
 * @param {String} userId - 用户ID
 * @param {Number} amount - 积分数量（正数）
 * @param {String} reason - 原因
 * @returns {Promise<Object>} 调整结果
 */
export async function adminDeductCreditsAction(userId, amount, reason = 'admin_adjustment') {
	if (amount <= 0) {
		return { success: false, error: 'Amount must be positive' };
	}
	return await adminAdjustCreditsAction(userId, -amount, reason);
}
