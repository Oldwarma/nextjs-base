/**
 * API 路由权限中间件
 * 
 * 用于为 Next.js API Routes 提供 RBAC 权限控制
 */

'use server';

import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';

/**
 * 验证 API 路由权限
 * @param {String} apiPath - API 路径 (如 '/api/v1/users/123')
 * @returns {Promise<Object>} { authorized: boolean, userId?: string, isAdmin?: boolean, error?: string }
 */
export async function checkApiPermission(apiPath) {
	try {
		// 1. 验证用户登录
		const session = await auth.api.getSession({ headers: await headers() });

		if (!session?.user) {
			return {
				authorized: false,
				error: 'Unauthorized: Please login first',
			};
		}

		const userId = session.user.id;
		const userRole = session.user.role;

		// 2. admin 角色自动通过
		if (userRole === 'admin') {
			return {
				authorized: true,
				userId,
				isAdmin: true,
			};
		}

		// 3. RBAC 权限检查
		const { checkUserHasApiPermission } = await import('@/app/(admin)/actions/dao/sys.js');
		const hasPermission = await checkUserHasApiPermission(userId, apiPath);

		if (!hasPermission) {
			return {
				authorized: false,
				error: `Forbidden: API '${apiPath}' not allowed`,
			};
		}

		return {
			authorized: true,
			userId,
			isAdmin: false,
		};
	} catch (error) {
		console.error('[API Permission] Check failed:', error);
		return {
			authorized: false,
			error: 'Internal server error',
		};
	}
}

/**
 * API 路由包装器
 * 
 * @param {Function} handler - 业务逻辑处理函数
 * @param {Object} options - 可选配置
 * @param {Boolean} options.skipPermission - 是否跳过权限检查（默认 false）
 * @returns {Function} 包装后的 API 处理器
 * 
 * @example
 * // 需要权限检查
 * async function handler(request, context) {
 *   const { userId, isAdmin } = context;
 *   // 业务逻辑
 *   return NextResponse.json({ success: true });
 * }
 * export const GET = withApiPermission(handler);
 * 
 * @example
 * // 跳过权限检查
 * export const POST = withApiPermission(handler, { skipPermission: true });
 */
export function withApiPermission(handler, options = {}) {
	const { skipPermission = false } = options;

	return async function wrappedApiHandler(request, context = {}) {
		try {
			// 获取请求路径
			const url = new URL(request.url);
			const apiPath = url.pathname;

			// 权限检查
			if (!skipPermission) {
				const permCheck = await checkApiPermission(apiPath);

				if (!permCheck.authorized) {
					return new Response(
						JSON.stringify({ 
							success: false, 
							error: permCheck.error 
						}),
						{
							status: permCheck.error.includes('Unauthorized') ? 401 : 403,
							headers: { 'Content-Type': 'application/json' },
						}
					);
				}

				// 将用户信息注入到 context
				context.userId = permCheck.userId;
				context.isAdmin = permCheck.isAdmin;
			}

			// 执行业务逻辑
			return await handler(request, context);
		} catch (error) {
			console.error('[API Route] Error:', error);
			return new Response(
				JSON.stringify({ 
					success: false, 
					error: 'Internal server error' 
				}),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}
	};
}

