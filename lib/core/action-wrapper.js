/**
 * Action Wrapper - 统一权限验证 + 日志记录包装器
 * 
 * 核心设计理念：
 * - 自动包装所有 Server Actions
 * - 自动验证管理员权限
 * - 自动记录操作日志（成功/失败）
 * - 统一错误处理和返回格式
 * 
 * 使用方式：
 * ```javascript
 * import { wrapAdminAction } from '@/lib/core/action-wrapper';
 * 
 * export const myAction = wrapAdminAction(
 *   'create',              // action 类型
 *   'user',                // 资源类型
 *   async (params, context) => {
 *     // 业务逻辑
 *     const { userId } = context; // 自动提供的上下文
 *     return { id: '123', name: 'John' };
 *   }
 * );
 * ```
 */

import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { checkBackendAccessAction, checkIsAdminAction } from '@/lib/auth/admin-auth';
import { logAction } from '@/lib/logging/action-logger';

/**
 * 包装后台 Action（支持 admin 和有后台权限的 user）
 * 自动处理：权限验证、RBAC 检查、日志记录、错误处理
 * 
 * 权限逻辑：
 * 1. admin 角色：自动通过所有检查，拥有所有权限
 * 2. user + isBackendAllowed：需要通过 RBAC 权限检查（如果提供了 permissionId）
 * 
 * @param {String} actionType - 操作类型（create/update/delete/read/batch_update/batch_delete）
 * @param {String} resourceType - 资源类型（user/role/menu/permission 等）
 * @param {Function} handler - 实际的业务逻辑函数
 * @param {Object} options - 可选配置
 * @param {Boolean} options.skipLog - 是否跳过日志记录（默认 false）
 * @param {Boolean} options.skipAuth - 是否跳过权限验证（默认 false，慎用！）
 * @param {Boolean} options.requireAdmin - 是否要求 admin 角色（默认 false）
 * @param {String} options.skipPermission - 是否跳过 RBAC 权限检查（默认 false，慎用！）
 * @param {String} options.permissionId - RBAC 权限 ID（如果提供，非 admin 用户需要有此权限）
 * @param {Function} options.beforeExecute - 执行前钩子
 * @param {Function} options.afterExecute - 执行后钩子
 * @returns {Function} 包装后的 Action 函数
 */
export function wrapAdminAction(actionType, resourceType, handler, options = {}) {
	const {
		skipLog = false,
		skipAuth = false,
		requireAdmin = false,
		skipPermission = false,
		permissionId = null,
		beforeExecute = null,
		afterExecute = null,
	} = options;

	return async function wrappedAction(...args) {
		const startTime = Date.now();
		let userId = null;
		let resourceId = null;
		let isAdmin = false;
		
		// 为了兼容性，params 指向第一个参数（用于日志）
		const params = args[0];

		try {
			// 1. 权限验证
			if (!skipAuth) {
				// 如果要求 admin 角色
				if (requireAdmin) {
					const authResult = await checkIsAdminAction();
					if (!authResult.isAdmin) {
						// 权限验证失败，记录日志
						if (!skipLog) {
							await logAction({
								userId: authResult.userId || 'unknown',
								action: actionType,
								resourceType,
								params: params || {},
								result: { error: authResult.error },
								success: false,
								duration: Date.now() - startTime,
							});
						}
						return {
							success: false,
							error: authResult.error || 'Unauthorized',
						};
					}
					userId = authResult.userId;
					isAdmin = true;
				} else {
					// 检查后台访问权限（admin 或 isBackendAllowed）
					const authResult = await checkBackendAccessAction();
					if (!authResult.hasAccess) {
						// 权限验证失败，记录日志
						if (!skipLog) {
							await logAction({
								userId: authResult.userId || 'unknown',
								action: actionType,
								resourceType,
								params: params || {},
								result: { error: authResult.error },
								success: false,
								duration: Date.now() - startTime,
							});
						}
						return {
							success: false,
							error: authResult.error || 'Unauthorized',
						};
					}
					userId = authResult.userId;
					isAdmin = authResult.isAdmin;

				// 2. RBAC 权限检查（仅对非 admin 用户）
				// 注意：permissionId 在这里实际上应该是 action 函数名
				// 系统会根据用户权限中的 actions 模式（如 **/bindUser*Action）进行匹配
				if (!isAdmin && !skipPermission && permissionId) {
					// 动态导入以避免循环依赖
					const { checkUserHasActionPermission } = await import('@/app/(admin)/actions/dao/sys.js');
					// permissionId 在这里实际上是 action 路径，用于匹配 actions 模式
					const hasPermission = await checkUserHasActionPermission(userId, permissionId);
					
					if (!hasPermission) {
						const error = `Forbidden: Action '${permissionId}' not allowed`;
						if (!skipLog) {
							await logAction({
								userId,
								action: actionType,
								resourceType,
								params: params || {},
								result: { error },
								success: false,
								duration: Date.now() - startTime,
							});
						}
						return {
							success: false,
							error,
						};
					}
				}
				}
			} else {
				// 跳过权限验证，但仍获取 userId（如果有）
				const session = await auth.api.getSession({ headers: await headers() });
				userId = session?.user?.id || 'system';
				isAdmin = session?.user?.role === 'admin';
			}

			// 3. 执行前钩子
			if (beforeExecute) {
				await beforeExecute(args, { userId, isAdmin });
			}

			// 4. 执行业务逻辑（传递所有参数 + context）
			const result = await handler(...args, { userId, isAdmin });

		// 5. 提取资源 ID（用于日志）
		if (result && typeof result === 'object') {
			resourceId = result.id || result._id || result.data?.id || result.data?._id;
		}

		// 6. 执行后钩子
		if (afterExecute) {
			await afterExecute(result, { userId, isAdmin, params, args });
		}

		// 7. 记录成功日志
		if (!skipLog) {
			await logAction({
				userId,
				action: actionType,
				resourceType,
				resourceId,
				params: params || {}, // 请求参数
				result, // 返回结果
				success: true,
				duration: Date.now() - startTime,
			});
		}

		return result;
	} catch (error) {
		// 区分业务错误和系统错误
		const isBusinessError = error.name === 'BusinessError';
		
		// 只有系统错误才打印到控制台
		if (!isBusinessError) {
			console.error(`[${actionType}] ${resourceType} failed:`, error);
		}

		// 记录失败日志
		if (!skipLog) {
			await logAction({
				userId: userId || 'unknown',
				action: actionType,
				resourceType,
				resourceId,
				details: {
					params: params || {},
					error: error.message,
					stack: !isBusinessError && process.env.NODE_ENV === 'development' ? error.stack : undefined,
				},
				success: false,
				duration: Date.now() - startTime,
			});
		}

			return {
				success: false,
				error: error.message || 'Internal server error',
			};
		}
	};
}

/**
 * 批量操作专用包装器
 * 自动处理批量更新/删除的日志记录
 * 
 * @param {String} actionType - batch_update 或 batch_delete
 * @param {String} resourceType - 资源类型
 * @param {Function} handler - 业务逻辑
 * @param {Object} options - 可选配置
 * @returns {Function} 包装后的批量操作函数
 */
export function wrapBatchAction(actionType, resourceType, handler, options = {}) {
	return wrapAdminAction(actionType, resourceType, async (...args) => {
		// 获取 context（最后一个参数）
		const context = args[args.length - 1];
		// 获取实际参数（除了最后的 context）
		const actualArgs = args.slice(0, -1);
		const params = actualArgs[0]; // 第一个参数用于日志
		
		// 执行批量操作
		const result = await handler(params, context);

		// 返回结果时附加批量信息
		return {
			...result,
			batchInfo: {
				totalIds: params?.ids?.length || 0, // 修复：从 params 中提取 ids
				affectedCount: result.affectedCount || result.modifiedCount || 0,
			},
		};
	}, options);
}

/**
 * 查询操作专用包装器
 * 
 * @param {String} resourceType - 资源类型
 * @param {Function} handler - 业务逻辑
 * @param {Object} options - 可选配置
 * @param {Boolean} options.skipLog - 是否跳过日志（默认 false，记录日志）
 * @returns {Function} 包装后的查询函数
 */
export function wrapQueryAction(resourceType, handler, options = {}) {
	return wrapAdminAction('query', resourceType, handler, {
		...options,
		skipLog: options.skipLog !== undefined ? options.skipLog : false, // 默认记录日志
	});
}

/**
 * 客户端 Action 包装器（验证登录 + 可选 RBAC）
 * 
 * @param {String} actionType - 操作类型
 * @param {String} resourceType - 资源类型
 * @param {Function} handler - 业务逻辑
 * @param {Object} options - 可选配置
 * @param {String} options.permissionId - 权限标识（Action 函数名）
 * @param {Boolean} options.skipPermission - 是否跳过权限检查（默认 true）
 * @param {Boolean} options.skipLog - 是否跳过日志记录（默认 true）
 * @returns {Function} 包装后的客户端 Action
 */
export function wrapClientAction(actionType, resourceType, handler, options = {}) {
	const {
		permissionId = null,
		skipPermission = true,  // Client Actions 默认跳过 RBAC
		skipLog = true,
	} = options;

	return async function wrappedClientAction(...args) {
		try {
			// 1. 验证用户登录
			const session = await auth.api.getSession({ headers: await headers() });
			if (!session?.user) {
				return {
					success: false,
					error: 'Unauthorized: Please login first',
				};
			}

			const userId = session.user.id;
			const userRole = session.user.role;
			const isAdmin = userRole === 'admin';

			// 2. RBAC 权限检查（如果需要）
			if (!skipPermission && permissionId) {
				// admin 角色自动通过
				if (!isAdmin) {
					const { checkUserHasActionPermission } = await import('@/app/(admin)/actions/dao/sys.js');
					const hasPermission = await checkUserHasActionPermission(userId, permissionId);

					if (!hasPermission) {
						const error = `Forbidden: Action '${permissionId}' not allowed`;

						// 记录失败日志（如果需要）
						if (!skipLog) {
							await logActionToDatabase({
								userId,
								isAdmin: false,
								actionType,
								resourceType,
								permissionId,
								status: 'forbidden',
								error,
								timestamp: new Date(),
							});
						}

						return {
							success: false,
							error,
						};
					}
				}
			}

			// 3. 执行业务逻辑
			const result = await handler(...args, {
				userId,
				user: session.user,
				isAdmin,
			});

			// 4. 记录成功日志（如果需要）
			if (!skipLog && !skipPermission && permissionId) {
				await logActionToDatabase({
					userId,
					isAdmin,
					actionType,
					resourceType,
					permissionId,
					status: 'success',
					timestamp: new Date(),
				});
			}

			return result;
		} catch (error) {
			console.error(`[Client Action] ${actionType} ${resourceType} failed:`, error);

			// 记录错误日志（如果需要）
			if (!skipLog && !skipPermission && permissionId) {
				await logActionToDatabase({
					userId: session?.user?.id || 'unknown',
					isAdmin: false,
					actionType,
					resourceType,
					permissionId,
					status: 'error',
					error: error.message,
					timestamp: new Date(),
				});
			}

			return {
				success: false,
				error: error.message || 'Internal server error',
			};
		}
	};
}

/**
 * 公开 Action 包装器（无需登录）
 * 仅用于公开 API，如获取公开套餐列表等
 * 
 * @param {String} actionType - 操作类型
 * @param {String} resourceType - 资源类型
 * @param {Function} handler - 业务逻辑
 * @returns {Function} 包装后的公开 Action
 */
export function wrapPublicAction(actionType, resourceType, handler) {
	return async function wrappedPublicAction(params) {
		try {
			const result = await handler(params, {});
			return result;
		} catch (error) {
			console.error(`[Public Action] ${actionType} ${resourceType} failed:`, error);
			return {
				success: false,
				error: error.message || 'Internal server error',
			};
		}
	};
}

