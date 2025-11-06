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
import { checkAdminAction } from '@/lib/auth/admin-auth';
import { logAction } from '@/lib/logging/action-logger';

/**
 * 包装管理员 Action
 * 自动处理：权限验证、日志记录、错误处理
 * 
 * @param {String} actionType - 操作类型（create/update/delete/read/batch_update/batch_delete）
 * @param {String} resourceType - 资源类型（user/role/menu/permission 等）
 * @param {Function} handler - 实际的业务逻辑函数
 * @param {Object} options - 可选配置
 * @param {Boolean} options.skipLog - 是否跳过日志记录（默认 false）
 * @param {Boolean} options.skipAuth - 是否跳过权限验证（默认 false，慎用！）
 * @param {Function} options.beforeExecute - 执行前钩子
 * @param {Function} options.afterExecute - 执行后钩子
 * @returns {Function} 包装后的 Action 函数
 */
export function wrapAdminAction(actionType, resourceType, handler, options = {}) {
	const {
		skipLog = false,
		skipAuth = false,
		beforeExecute = null,
		afterExecute = null,
	} = options;

	return async function wrappedAction(params) {
		const startTime = Date.now();
		let userId = null;
		let resourceId = null;
		let actionDetails = {};

		try {
			// 1. 权限验证
			if (!skipAuth) {
				const authResult = await checkAdminAction();
				if (!authResult.isAdmin) {
					// 权限验证失败，记录日志
					if (!skipLog) {
						await logAction({
							userId: authResult.userId || 'unknown',
							action: actionType,
							resourceType,
							details: { error: authResult.error, params },
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
			} else {
				// 跳过权限验证，但仍获取 userId（如果有）
				const session = await auth.api.getSession({ headers: await headers() });
				userId = session?.user?.id || 'system';
			}

			// 2. 执行前钩子
			if (beforeExecute) {
				await beforeExecute(params, { userId });
			}

			// 3. 执行业务逻辑
			const result = await handler(params, { userId });

			// 4. 提取资源 ID（用于日志）
			if (result && typeof result === 'object') {
				resourceId = result.id || result._id || result.data?.id || result.data?._id;
				actionDetails = {
					...params,
					result: typeof result === 'object' ? { id: resourceId } : result,
				};
			}

			// 5. 执行后钩子
			if (afterExecute) {
				await afterExecute(result, { userId, params });
			}

			// 6. 记录成功日志
			if (!skipLog) {
				await logAction({
					userId,
					action: actionType,
					resourceType,
					resourceId,
					details: actionDetails,
					success: true,
					duration: Date.now() - startTime,
				});
			}

			return result;
		} catch (error) {
			console.error(`[${actionType}] ${resourceType} failed:`, error);

			// 记录失败日志
			if (!skipLog) {
				await logAction({
					userId: userId || 'unknown',
					action: actionType,
					resourceType,
					resourceId,
					details: {
						...actionDetails,
						error: error.message,
						stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
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
	return wrapAdminAction(actionType, resourceType, async (params, context) => {
		const { ids, ...restParams } = params;

		// 执行批量操作
		const result = await handler(params, context);

		// 返回结果时附加批量信息
		return {
			...result,
			batchInfo: {
				totalIds: ids?.length || 0,
				affectedCount: result.affectedCount || result.modifiedCount || 0,
			},
		};
	}, options);
}

/**
 * 查询操作专用包装器（通常不需要日志）
 * 
 * @param {String} resourceType - 资源类型
 * @param {Function} handler - 业务逻辑
 * @param {Object} options - 可选配置
 * @returns {Function} 包装后的查询函数
 */
export function wrapQueryAction(resourceType, handler, options = {}) {
	return wrapAdminAction('read', resourceType, handler, {
		...options,
		skipLog: options.skipLog !== undefined ? options.skipLog : true, // 默认跳过日志
	});
}

/**
 * 客户端 Action 包装器（不验证管理员权限，但验证登录）
 * 
 * @param {String} actionType - 操作类型
 * @param {String} resourceType - 资源类型
 * @param {Function} handler - 业务逻辑
 * @param {Object} options - 可选配置
 * @returns {Function} 包装后的客户端 Action
 */
export function wrapClientAction(actionType, resourceType, handler, options = {}) {
	return async function wrappedClientAction(params) {
		try {
			// 验证用户登录
			const session = await auth.api.getSession({ headers: await headers() });
			if (!session?.user) {
				return {
					success: false,
					error: 'Unauthorized: Please login first',
				};
			}

			const userId = session.user.id;

			// 执行业务逻辑
			const result = await handler(params, { userId, user: session.user });

			return result;
		} catch (error) {
			console.error(`[Client Action] ${actionType} ${resourceType} failed:`, error);
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

