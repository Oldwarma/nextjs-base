/**
 * API 路由认证辅助函数
 * 
 * 用于在 API Route 中进行用户认证和权限检查
 * 
 * 设计原则：
 * - 不使用包装器模式，而是提供辅助函数
 * - 在 API Route 内部调用，获取认证信息
 * - 支持 RBAC 权限检查（可选）
 * 
 * 使用示例：
 * ```javascript
 * // app/api/xxx/route.js
 * import { getApiAuth, checkApiRbacPermission } from '@/lib/api/api-auth';
 * 
 * export async function POST(request) {
 *   // 1. 获取认证信息
 *   const auth = await getApiAuth(request);
 *   if (!auth.authenticated) {
 *     return NextResponse.json({ error: auth.error }, { status: 401 });
 *   }
 *   
 *   // 2. 可选：RBAC 权限检查
 *   const permission = await checkApiRbacPermission(auth.userId, 'POST:/api/xxx');
 *   if (!permission.allowed) {
 *     return NextResponse.json({ error: permission.error }, { status: 403 });
 *   }
 *   
 *   // 3. 业务逻辑
 *   const { userId, isAdmin } = auth;
 *   // ...
 * }
 * ```
 */

import { headers } from 'next/headers';
import { auth as authLib } from '@/lib/auth/auth';

/**
 * 获取 API 请求的认证信息
 * 
 * @param {Request} request - Next.js Request 对象（可选，用于获取额外信息）
 * @returns {Promise<Object>} 认证结果
 * - authenticated: boolean - 是否已认证
 * - userId: string - 用户 ID
 * - isAdmin: boolean - 是否是管理员
 * - user: Object - 完整用户对象
 * - error: string - 错误信息（如果未认证）
 */
export async function getApiAuth(request) {
	try {
		const session = await authLib.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return {
				authenticated: false,
				error: 'Unauthorized: Please login first',
			};
		}

		return {
			authenticated: true,
			userId: session.user.id,
			isAdmin: session.user.role === 'admin',
			user: session.user,
		};
	} catch (error) {
		console.error('[API Auth] Error:', error);
		return {
			authenticated: false,
			error: 'Authentication failed',
		};
	}
}

/**
 * 检查 API RBAC 权限
 * 
 * 支持两种权限配置格式：
 * 1. 仅路径：`/api/upload/*` - 匹配所有 HTTP 方法
 * 2. 方法+路径：`POST:/api/upload/*` - 仅匹配指定 HTTP 方法
 * 
 * @param {string} userId - 用户 ID
 * @param {string} permissionPath - 权限路径（如 'POST:/api/upload' 或 '/api/upload'）
 * @param {Object} options - 可选配置
 * @param {boolean} options.isAdmin - 是否是管理员（管理员自动通过）
 * @returns {Promise<Object>} 权限检查结果
 * - allowed: boolean - 是否允许
 * - error: string - 错误信息（如果不允许）
 */
export async function checkApiRbacPermission(userId, permissionPath, options = {}) {
	const { isAdmin = false } = options;

	// 管理员自动通过
	if (isAdmin) {
		return { allowed: true };
	}

	try {
		const { checkUserHasApiPermission } = await import('@/app/(admin)/actions/dao/sys.js');
		const hasPermission = await checkUserHasApiPermission(userId, permissionPath);

		if (!hasPermission) {
			return {
				allowed: false,
				error: `Forbidden: API '${permissionPath}' not allowed`,
			};
		}

		return { allowed: true };
	} catch (error) {
		console.error('[API RBAC] Error:', error);
		return {
			allowed: false,
			error: 'Permission check failed',
		};
	}
}

/**
 * 组合认证和权限检查
 * 
 * @param {Request} request - Next.js Request 对象
 * @param {Object} options - 可选配置
 * @param {boolean} options.requireAuth - 是否要求登录（默认 true）
 * @param {string} options.rbacPath - RBAC 权限路径（如 'POST:/api/upload'，不提供则跳过 RBAC）
 * @returns {Promise<Object>} 完整的认证和权限结果
 */
export async function checkApiAccess(request, options = {}) {
	const { requireAuth = true, rbacPath = null } = options;

	// 1. 不需要认证
	if (!requireAuth) {
		return {
			success: true,
			authenticated: false,
			userId: null,
			isAdmin: false,
		};
	}

	// 2. 认证检查
	const auth = await getApiAuth(request);
	if (!auth.authenticated) {
		return {
			success: false,
			error: auth.error,
			status: 401,
		};
	}

	// 3. RBAC 权限检查（可选）
	if (rbacPath) {
		const permission = await checkApiRbacPermission(auth.userId, rbacPath, {
			isAdmin: auth.isAdmin,
		});

		if (!permission.allowed) {
			return {
				success: false,
				error: permission.error,
				status: 403,
			};
		}
	}

	return {
		success: true,
		authenticated: true,
		userId: auth.userId,
		isAdmin: auth.isAdmin,
		user: auth.user,
	};
}

