/**
 * API 路由认证辅助函数
 * 
 * 用于在 API Route 中进行用户认证和权限检查
 * 支持基于路径命名约定的自动权限识别
 * 
 * ## 命名约定（参考 vk-unicloud）
 * 
 * | 路径关键词 | 权限级别 | 说明 |
 * |-----------|---------|------|
 * | `/api/pub/xxx` | public | 公开可访问，绕开所有权限检查 |
 * | `/api/auth/xxx` | auth | 需要登录，给前台用户使用 |
 * | `/api/sys/xxx` 或 `/api/admin/xxx` | system | 需要后台权限 |
 * 
 * ## 使用示例
 * 
 * ```javascript
 * // 方式 1：手动检查（更灵活）
 * import { getApiAuth, checkApiRbacPermission } from '@/lib/api/api-auth';
 * 
 * export async function POST(request) {
 *   const auth = await getApiAuth(request);
 *   if (!auth.authenticated) {
 *     return NextResponse.json({ error: auth.error }, { status: 401 });
 *   }
 *   // 业务逻辑...
 * }
 * 
 * // 方式 2：基于路径自动识别
 * import { checkApiAccessByPath } from '@/lib/api/api-auth';
 * 
 * export async function POST(request) {
 *   const access = await checkApiAccessByPath(request);
 *   if (!access.success) {
 *     return NextResponse.json({ error: access.error }, { status: access.status });
 *   }
 *   const { userId, isAdmin } = access;
 *   // 业务逻辑...
 * }
 * ```
 */

import { headers } from 'next/headers';
import { auth as authLib } from '@/lib/auth/auth';
import {
	parseApiPermission,
	PermissionLevel,
	getPermissionCheckConfig,
} from '@/lib/core/permission-naming';

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

/**
 * 基于路径命名约定的 API 访问检查
 * 
 * 根据 API 路径中的关键词自动识别权限级别：
 * - `/api/pub/xxx` → 公开可访问
 * - `/api/auth/xxx` → 需要登录
 * - `/api/sys/xxx` 或 `/api/admin/xxx` → 需要后台权限
 * 
 * @param {Request} request - Next.js Request 对象
 * @param {Object} options - 可选配置
 * @param {string} options.forceLevel - 强制指定权限级别（覆盖自动识别）
 * @returns {Promise<Object>} 访问检查结果
 * 
 * @example
 * // app/api/pub/config/route.js - 自动识别为公开
 * export async function GET(request) {
 *   const access = await checkApiAccessByPath(request);
 *   // access.success = true（公开接口自动通过）
 *   return NextResponse.json({ config: '...' });
 * }
 * 
 * // app/api/auth/user/profile/route.js - 自动识别为需要登录
 * export async function GET(request) {
 *   const access = await checkApiAccessByPath(request);
 *   if (!access.success) {
 *     return NextResponse.json({ error: access.error }, { status: access.status });
 *   }
 *   const { userId } = access;
 *   return NextResponse.json({ profile: '...' });
 * }
 * 
 * // app/api/sys/users/route.js - 自动识别为需要后台权限
 * export async function GET(request) {
 *   const access = await checkApiAccessByPath(request);
 *   if (!access.success) {
 *     return NextResponse.json({ error: access.error }, { status: access.status });
 *   }
 *   const { userId, isAdmin } = access;
 *   return NextResponse.json({ users: [] });
 * }
 */
export async function checkApiAccessByPath(request, options = {}) {
	const { forceLevel = null } = options;

	// 获取请求路径
	const url = new URL(request.url);
	const apiPath = url.pathname;
	const method = request.method;

	// 解析权限级别
	const permissionResult = forceLevel
		? { level: forceLevel, keyword: 'forced', isDefault: false }
		: parseApiPermission(apiPath);

	const { level } = permissionResult;

	// 1. 公开接口直接通过
	if (level === PermissionLevel.PUBLIC) {
		// 尝试获取用户信息（可选）
		let userId = null;
		let isAdmin = false;
		let user = null;

		try {
			const auth = await getApiAuth(request);
			if (auth.authenticated) {
				userId = auth.userId;
				isAdmin = auth.isAdmin;
				user = auth.user;
			}
		} catch {
			// 忽略错误，公开接口不强制要求登录
		}

		return {
			success: true,
			authenticated: !!userId,
			userId,
			isAdmin,
			user,
			level,
		};
	}

	// 2. 需要登录的接口
	const auth = await getApiAuth(request);
	if (!auth.authenticated) {
		return {
			success: false,
			error: auth.error,
			status: 401,
			level,
		};
	}

	// 3. 后台权限检查（sys/admin 级别）
	if (level === PermissionLevel.SYSTEM) {
		// admin 角色自动通过
		if (!auth.isAdmin) {
			// 检查后台访问权限
			const { checkBackendAccessAction } = await import('@/lib/auth/admin-auth');
			const backendAccess = await checkBackendAccessAction();

			if (!backendAccess.hasAccess) {
				return {
					success: false,
					error: backendAccess.error || 'Forbidden: Backend access required',
					status: 403,
					level,
				};
			}

			// RBAC 权限检查
			const rbacPath = `${method}:${apiPath}`;
			const permission = await checkApiRbacPermission(auth.userId, rbacPath, {
				isAdmin: auth.isAdmin,
			});

			if (!permission.allowed) {
				// 再尝试不带方法的路径
				const pathPermission = await checkApiRbacPermission(auth.userId, apiPath, {
					isAdmin: auth.isAdmin,
				});

				if (!pathPermission.allowed) {
					return {
						success: false,
						error: permission.error,
						status: 403,
						level,
					};
				}
			}
		}
	}

	return {
		success: true,
		authenticated: true,
		userId: auth.userId,
		isAdmin: auth.isAdmin,
		user: auth.user,
		level,
	};
}

/**
 * 获取 API 路径的权限级别信息
 * 
 * @param {string} apiPath - API 路径
 * @returns {Object} 权限级别信息
 */
export function getApiPermissionLevel(apiPath) {
	return parseApiPermission(apiPath);
}
