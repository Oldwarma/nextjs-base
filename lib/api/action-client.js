/**
 * 客户端 Action 调用封装
 * 
 * 功能：
 * - 自动处理 401 跳转登录
 * - 自动处理 403 权限不足（toast 提示）
 * - 统一错误处理
 * 
 * 使用方式：
 * ```javascript
 * import { callAction } from '@/lib/api/action-client';
 * import { authGetUserInfo } from '@/app/(client)/actions/test-actions';
 * 
 * const { data, error } = await callAction(authGetUserInfo);
 * const { data, error } = await callAction(authUpdateProfile, { name: 'xxx' });
 * ```
 */

import { toast } from 'sonner';

/**
 * 获取当前语言
 */
function getCurrentLocale() {
	if (typeof window === 'undefined') return 'en';
	
	const path = window.location.pathname;
	const match = path.match(/^\/([a-z]{2})(\/|$)/);
	return match ? match[1] : 'en';
}

/**
 * 跳转到登录页
 */
function redirectToLogin() {
	if (typeof window === 'undefined') return;
	
	const locale = getCurrentLocale();
	const currentPath = window.location.pathname + window.location.search;
	window.location.href = `/${locale}/login?redirect=${encodeURIComponent(currentPath)}`;
}

/**
 * 封装的 Action 调用函数
 * 
 * @param {Function} action - Server Action 函数
 * @param {any} params - 传递给 Action 的参数
 * @param {Object} config - 额外配置
 * @param {boolean} config.redirectOnUnauth - 401 时是否跳转登录，默认 true
 * @param {boolean} config.showErrorToast - 是否显示错误 toast，默认 true
 * @param {boolean} config.showSuccessToast - 是否显示成功 toast，默认 false
 * @param {string} config.successMessage - 成功时的 toast 消息
 * @returns {Promise<{data: any, error: string|null, success: boolean}>}
 */
export async function callAction(action, params = null, config = {}) {
	const { 
		redirectOnUnauth = true, 
		showErrorToast = true,
		showSuccessToast = false,
		successMessage = '操作成功',
	} = config;
	
	try {
		const result = await action(params);
		
		// 检查是否未登录
		if (result.error?.includes('Unauthorized') || result.error?.includes('Please login')) {
			if (redirectOnUnauth) {
				toast.info('请先登录');
				redirectToLogin();
				return { data: null, error: 'Redirecting to login...', success: false };
			}
			if (showErrorToast) {
				toast.warning(result.error);
			}
			return { data: null, error: result.error, success: false };
		}
		
		// 检查是否权限不足
		if (result.error?.includes('Forbidden') || result.error?.includes('not allowed')) {
			if (showErrorToast) {
				toast.error(result.error);
			}
			return { data: null, error: result.error, success: false };
		}
		
		// 其他错误
		if (!result.success) {
			if (showErrorToast && result.error) {
				toast.error(result.error);
			}
			return { data: null, error: result.error, success: false };
		}
		
		// 成功
		if (showSuccessToast) {
			toast.success(successMessage);
		}
		return { data: result.data || result, error: null, success: true };
		
	} catch (error) {
		const errorMessage = error.message || 'Action failed';
		if (showErrorToast) {
			toast.error(errorMessage);
		}
		return { data: null, error: errorMessage, success: false };
	}
}

export default { callAction };

