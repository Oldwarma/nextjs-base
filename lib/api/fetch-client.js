/**
 * 客户端 fetch 封装
 * 
 * 功能：
 * - 自动处理 401 跳转登录
 * - 自动处理 403 权限不足（toast 提示）
 * - 统一错误处理
 * 
 * 使用方式：
 * ```javascript
 * import { fetchApi } from '@/lib/api/fetch-client';
 * 
 * const { data, error } = await fetchApi('/api/v1/auth/user/profile');
 * ```
 */

import { toast } from 'sonner';

/**
 * 获取当前语言
 */
function getCurrentLocale() {
	if (typeof window === 'undefined') return 'en';
	
	// 从 URL 路径获取语言
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
 * 封装的 fetch 函数
 * 
 * @param {string} url - API 路径
 * @param {RequestInit} options - fetch 选项
 * @param {Object} config - 额外配置
 * @param {boolean} config.redirectOnUnauth - 401 时是否跳转登录，默认 true
 * @param {boolean} config.showErrorToast - 是否显示错误 toast，默认 true
 * @param {boolean} config.throwOnError - 是否抛出错误，默认 false
 * @returns {Promise<{data: any, error: string|null, status: number}>}
 */
export async function fetchApi(url, options = {}, config = {}) {
	const { 
		redirectOnUnauth = true, 
		showErrorToast = true,
		throwOnError = false 
	} = config;
	
	try {
		const res = await fetch(url, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...options.headers,
			},
		});

		// 401 未登录
		if (res.status === 401) {
			if (redirectOnUnauth) {
				toast.info('请先登录');
				redirectToLogin();
				return { data: null, error: 'Redirecting to login...', status: 401 };
			}
			const errorData = await res.json().catch(() => ({}));
			const error = errorData.error || 'Please login first';
			if (showErrorToast) {
				toast.warning(error);
			}
			return { data: null, error, status: 401 };
		}

		// 403 权限不足
		if (res.status === 403) {
			const errorData = await res.json().catch(() => ({}));
			const error = errorData.error || 'Permission denied';
			if (showErrorToast) {
				toast.error(error);
			}
			if (throwOnError) throw new Error(error);
			return { data: null, error, status: 403 };
		}

		// 其他错误
		if (!res.ok) {
			const errorData = await res.json().catch(() => ({}));
			const error = errorData.error || `Request failed with status ${res.status}`;
			if (showErrorToast) {
				toast.error(error);
			}
			if (throwOnError) throw new Error(error);
			return { data: null, error, status: res.status };
		}

		// 成功
		const data = await res.json();
		return { data, error: null, status: res.status };
		
	} catch (error) {
		const errorMessage = error.message || 'Network error';
		if (showErrorToast) {
			toast.error(errorMessage);
		}
		if (throwOnError) throw error;
		return { 
			data: null, 
			error: errorMessage, 
			status: 0 
		};
	}
}

/**
 * GET 请求
 */
export function get(url, config) {
	return fetchApi(url, { method: 'GET' }, config);
}

/**
 * POST 请求
 */
export function post(url, body, config) {
	return fetchApi(url, { 
		method: 'POST', 
		body: JSON.stringify(body) 
	}, config);
}

/**
 * PUT 请求
 */
export function put(url, body, config) {
	return fetchApi(url, { 
		method: 'PUT', 
		body: JSON.stringify(body) 
	}, config);
}

/**
 * DELETE 请求
 */
export function del(url, config) {
	return fetchApi(url, { method: 'DELETE' }, config);
}

export default {
	fetchApi,
	get,
	post,
	put,
	del,
};
