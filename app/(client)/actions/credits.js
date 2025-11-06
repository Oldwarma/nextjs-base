'use server';

import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { getUserCredits, getUserCreditsInfo, getCreditTransactions } from '@/lib/credits';

/**
 * 获取用户当前积分
 * @returns {Promise<Object>} 积分数
 */
export async function getUserCreditsAction() {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		return {
			success: false,
			error: 'Unauthorized',
		};
	}

	try {
		const credits = await getUserCredits(session.user.id);
		return {
			success: true,
			data: { credits },
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * 获取用户积分详细信息
 * @returns {Promise<Object>} 积分详细信息
 */
export async function getUserCreditsInfoAction() {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		return {
			success: false,
			error: 'Unauthorized',
		};
	}

	try {
		const creditsInfo = await getUserCreditsInfo(session.user.id);
		return {
			success: true,
			data: creditsInfo,
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * 获取用户积分交易记录
 * @param {Object} options - 查询选项
 * @param {number} options.pageIndex - 页码
 * @param {number} options.pageSize - 每页数量
 * @param {string} options.type - 交易类型筛选
 * @returns {Promise<Object>} 交易记录（分页）
 */
export async function getCreditTransactionsAction({ pageIndex = 1, pageSize = 20, type = null } = {}) {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		return {
			success: false,
			error: 'Unauthorized',
		};
	}

	try {
		const transactions = await getCreditTransactions(session.user.id, {
			pageIndex,
			pageSize,
			type,
		});

		return {
			success: true,
			data: transactions,
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * 获取用户积分信息和交易记录（组合）
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 积分信息和交易记录
 */
export async function getUserCreditsWithTransactionsAction(options = {}) {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		return {
			success: false,
			error: 'Unauthorized',
		};
	}

	try {
		const { pageIndex = 1, pageSize = 20, type = null } = options;

		// 获取积分信息
		const creditsInfo = await getUserCreditsInfo(session.user.id);

		// 获取交易记录
		const transactions = await getCreditTransactions(session.user.id, {
			pageIndex,
			pageSize,
			type,
		});

		return {
			success: true,
			data: {
				...creditsInfo,
				transactions,
			},
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

