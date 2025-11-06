'use server';

/**
 * 积分管理 Server Actions
 * 使用核心库自动处理权限验证和日志记录
 */

import { createReadOnlyActions } from '@/lib/core/crud-helper';
import { wrapAdminAction } from '@/lib/core/action-wrapper';
import { creditTransactionCrudConfig } from '@/app/(admin)/actions/finance/configs/credit-transaction-crud.config';
import { adminAdjustCredits, getCreditTransactions } from '@/lib/business/credits';

/**
 * 创建只读 CRUD Actions（积分交易记录只能查看）
 */
const crudActions = createReadOnlyActions(creditTransactionCrudConfig);

/**
 * 导出标准查询 Actions
 */
export const getCreditTransactionListAction = crudActions.getList;
export const getCreditTransactionDetailAction = crudActions.getDetail;

/**
 * 自定义 Actions
 */

/**
 * 管理员调整用户积分
 */
export const adjustUserCreditsAction = wrapAdminAction(
	'adjust_credits',
	'credits',
	async ({ userId, amount, reason, expiresAt }, context) => {
		// 验证参数
		if (!userId || amount === undefined || amount === 0) {
			return {
				success: false,
				error: 'Invalid parameters: userId and non-zero amount are required',
			};
		}

		// 调用业务逻辑
		const result = await adminAdjustCredits({
			userId,
			amount: Number(amount),
			reason: reason || 'Admin adjustment',
			expiresAt: expiresAt ? new Date(expiresAt) : null,
		});

		return result;
	}
);

/**
 * 获取用户积分交易历史
 */
export const getUserCreditTransactionsAction = wrapAdminAction(
	'read',
	'credits',
	async ({ userId, pageIndex = 1, pageSize = 20 }, context) => {
		if (!userId) {
			return {
				success: false,
				error: 'User ID is required',
			};
		}

		const result = await getCreditTransactions({
			userId,
			pageIndex,
			pageSize,
		});

		return result;
	}
);
