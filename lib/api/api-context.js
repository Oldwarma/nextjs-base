/**
 * API Context - 从 Middleware 注入的 headers 中获取用户信息
 * 
 * ## 使用方式
 * 
 * ```javascript
 * import { getApiContext } from '@/lib/api/api-context';
 * 
 * export async function GET(request) {
 *   const ctx = getApiContext(request);
 *   const { userId, isAdmin } = ctx;
 *   
 *   // 业务逻辑...
 *   return NextResponse.json({ success: true, data: ... });
 * }
 * ```
 */

/**
 * 从 request headers 获取用户上下文
 * 
 * @param {Request} request - Next.js Request 对象
 * @returns {Object} 用户上下文
 */
export function getApiContext(request) {
	const userId = request.headers.get('x-user-id');
	const userRole = request.headers.get('x-user-role');
	const isAdmin = request.headers.get('x-is-admin') === 'true';

	return {
		userId,
		userRole,
		isAdmin,
		// 是否已登录
		isAuthenticated: !!userId,
	};
}

/**
 * 从 request headers 获取用户 ID
 */
export function getUserId(request) {
	return request.headers.get('x-user-id');
}

/**
 * 检查是否是管理员
 */
export function isAdminRequest(request) {
	return request.headers.get('x-is-admin') === 'true';
}

