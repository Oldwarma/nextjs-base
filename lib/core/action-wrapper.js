/**
 * Action Wrapper - 统一的 Server Action 包装器
 * 
 * 只需要记住一个函数：wrapAction
 * 
 * ## 命名约定
 * 
 * | 前缀 | 权限级别 | 说明 |
 * |------|---------|------|
 * | `pub` | public | 公开可访问，无需登录 |
 * | `auth` | auth | 需要登录，前台用户使用 |
 * | `sys` | system | 需要后台权限，后台用户使用 |
 * | `_` | private | 私有方法，不能被前端调用 |
 * 
 * ## 使用示例
 * 
 * ```javascript
 * import { wrapAction } from '@/lib/core/action-wrapper';
 * 
 * // 公开接口
 * export const pubGetConfig = wrapAction('pubGetConfig', async () => {
 *   return { success: true, data: { ... } };
 * });
 * 
 * // 需要登录
 * export const authGetProfile = wrapAction('authGetProfile', async (params, ctx) => {
 *   const { userId } = ctx;
 *   return { success: true, data: { ... } };
 * });
 * 
 * // 后台功能
 * export const sysGetUserList = wrapAction('sysGetUserList', async (params, ctx) => {
 *   const { userId, isAdmin } = ctx;
 *   return { success: true, data: [] };
 * });
 * ```
 */

import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { checkBackendAccessAction } from '@/lib/auth/admin-auth';
import { logAction } from '@/lib/logging/action-logger';
import {
	parseActionPermission,
	PermissionLevel,
	getPermissionCheckConfig,
} from './permission-naming';

/**
 * 统一的 Action 包装器
 * 
 * 根据 actionName 中的关键词自动识别权限级别：
 * - `pub` → 公开可访问，无需登录
 * - `auth` → 需要登录
 * - `sys` → 需要后台权限 + RBAC
 * - `_` → 私有方法，不能被前端调用
 * 
 * @param {String} actionName - Action 名称（用于权限识别、日志、RBAC）
 * @param {Function} handler - 业务逻辑函数 (params, context) => result
 * @param {Object} options - 可选配置
 * @param {Boolean} options.skipLog - 跳过日志记录（默认 false）
 * @param {String} options.level - 强制指定权限级别（覆盖命名约定）
 * @returns {Function} 包装后的 Action 函数
 * 
 * @example
 * // 基本用法
 * export const pubGetConfig = wrapAction('pubGetConfig', async () => {
 *   return { success: true, config: '...' };
 * });
 * 
 * // 带参数
 * export const authUpdateProfile = wrapAction('authUpdateProfile', async (data, ctx) => {
 *   const { userId } = ctx;
 *   await updateUser(userId, data);
 *   return { success: true };
 * });
 * 
 * // 强制指定权限级别
 * export const myAction = wrapAction('myAction', handler, { level: 'public' });
 */
export function wrapAction(actionName, handler, options = {}) {
	const { skipLog = false, level: forceLevel = null } = options;

	// 解析权限级别
	const permissionResult = forceLevel
		? { level: forceLevel, keyword: 'forced', isDefault: false }
		: parseActionPermission(actionName);

	const { level } = permissionResult;
	const checkConfig = getPermissionCheckConfig(level);

	return async function wrappedAction(...args) {
		const startTime = Date.now();
		let userId = null;
		let isAdmin = false;
		let user = null;
		const params = args[0];

		try {
			// 1. 私有方法检查
			if (checkConfig.isPrivate) {
				return {
					success: false,
					error: 'This method is private and cannot be called directly',
				};
			}

			// 2. 公开方法
			if (level === PermissionLevel.PUBLIC) {
				// 尝试获取用户信息（可选，不强制）
				try {
					const session = await auth.api.getSession({ headers: await headers() });
					if (session?.user) {
						userId = session.user.id;
						isAdmin = session.user.role === 'admin';
						user = session.user;
					}
				} catch {
					// 忽略错误
				}

				const ctx = { userId, isAdmin, user };
				const result = await handler(params, ctx);

				if (!skipLog) {
					await logAction({
						userId: userId || 'anonymous',
						action: actionName,
						resourceType: 'public',
						params: params || {},
						result,
						success: result?.success !== false,
						duration: Date.now() - startTime,
					});
				}

				return result;
			}

			// 3. 需要登录
			const session = await auth.api.getSession({ headers: await headers() });
			if (!session?.user) {
				return {
					success: false,
					error: 'Unauthorized: Please login first',
				};
			}

			userId = session.user.id;
			isAdmin = session.user.role === 'admin';
			user = session.user;

			// 4. 后台权限检查（sys 级别）
			if (level === PermissionLevel.SYSTEM && !isAdmin) {
				// 检查后台访问权限
				const authResult = await checkBackendAccessAction();
				if (!authResult.hasAccess) {
					if (!skipLog) {
						await logAction({
							userId,
							action: actionName,
							resourceType: 'system',
							params: params || {},
							result: { error: authResult.error },
							success: false,
							duration: Date.now() - startTime,
						});
					}
					return {
						success: false,
						error: authResult.error || 'Forbidden: Backend access required',
					};
				}

				// RBAC 权限检查
				const { checkUserHasActionPermission } = await import('@/app/(admin)/actions/dao/sys.js');
				const hasPermission = await checkUserHasActionPermission(userId, actionName);

				if (!hasPermission) {
					const error = `Forbidden: Action '${actionName}' not allowed`;
					if (!skipLog) {
						await logAction({
							userId,
							action: actionName,
							resourceType: 'system',
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

			// 5. 执行业务逻辑
			const ctx = { userId, isAdmin, user };
			const result = await handler(params, ctx);

			// 6. 记录日志
			if (!skipLog) {
				await logAction({
					userId,
					action: actionName,
					resourceType: level,
					params: params || {},
					result,
					success: result?.success !== false,
					duration: Date.now() - startTime,
				});
			}

			return result;
		} catch (error) {
			const isBusinessError = error.name === 'BusinessError';

			if (!isBusinessError) {
				console.error(`[${actionName}] failed:`, error);
			}

			if (!skipLog) {
				await logAction({
					userId: userId || 'unknown',
					action: actionName,
					resourceType: level,
					params: params || {},
					result: { error: error.message },
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

// ============================================================
// 以下为向后兼容的旧 API（已废弃，建议使用 wrapAction）
// ============================================================

/**
 * @deprecated 请使用 wrapAction，命名以 sys 开头
 * 
 * 示例迁移：
 * ```javascript
 * // 旧方式
 * export const createUser = wrapAdminAction('create', 'user', handler);
 * 
 * // 新方式
 * export const sysCreateUser = wrapAction('sysCreateUser', handler);
 * ```
 */
export function wrapAdminAction(actionType, resourceType, handler, options = {}) {
	const {
		skipLog = false,
		permissionId = null,
	} = options;

	// 生成 action 名称
	const actionName = permissionId || `sys${capitalize(actionType)}${capitalize(resourceType)}`;

	return wrapAction(actionName, async (...args) => {
		// 提取 context（wrapAction 会添加到最后）
		const context = args[args.length - 1];
		const actualArgs = args.slice(0, -1);
		
		// 调用原始 handler
		return await handler(...actualArgs, context);
	}, { skipLog, level: 'system' });
}

/**
 * @deprecated 请使用 wrapAction，命名以 sys 开头
 */
export function wrapBatchAction(actionType, resourceType, handler, options = {}) {
	return wrapAdminAction(actionType, resourceType, handler, options);
}

/**
 * @deprecated 请使用 wrapAction，命名以 sys 开头
 */
export function wrapQueryAction(resourceType, handler, options = {}) {
	return wrapAdminAction('query', resourceType, handler, {
		...options,
		skipLog: options.skipLog ?? true,
	});
}

/**
 * @deprecated 请使用 wrapAction，命名以 auth 开头
 */
export function wrapClientAction(actionType, resourceType, handler, options = {}) {
	const actionName = `auth${capitalize(actionType)}${capitalize(resourceType)}`;
	return wrapAction(actionName, handler, { ...options, level: 'auth' });
}

/**
 * @deprecated 请使用 wrapAction，命名以 pub 开头
 */
export function wrapPublicAction(actionType, resourceType, handler) {
	const actionName = `pub${capitalize(actionType)}${capitalize(resourceType)}`;
	return wrapAction(actionName, handler, { level: 'public' });
}

// 辅助函数
function capitalize(str) {
	if (!str) return '';
	return str.charAt(0).toUpperCase() + str.slice(1);
}
