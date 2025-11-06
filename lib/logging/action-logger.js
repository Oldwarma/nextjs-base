/**
 * Server Action Logger
 * 用于在任何 Server Action 中添加日志
 */

/**
 * 格式化时间前缀
 */
function formatTimePrefix(date) {
	const h = String(date.getHours()).padStart(2, '0');
	const m = String(date.getMinutes()).padStart(2, '0');
	const s = String(date.getSeconds()).padStart(2, '0');
	const ms = String(date.getMilliseconds()).padStart(3, '0');
	return `${h}:${m}:${s}.${ms}`;
}

/**
 * 格式化完整时间
 */
function formatDateTime(date) {
	if (!date) {
		return 'N/A';
	}
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	const h = String(date.getHours()).padStart(2, '0');
	const min = String(date.getMinutes()).padStart(2, '0');
	const s = String(date.getSeconds()).padStart(2, '0');
	return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

/**
 * 检查是否在开发环境
 */
function isDevelopment() {
	return process.env.NODE_ENV === 'development';
}

/**
 * 日志配置
 * 可以通过环境变量控制：
 * - ACTION_LOG_MODE=simple   极简模式，完全折叠数据
 * - ACTION_LOG_MODE=summary  摘要模式，只显示关键信息
 * - ACTION_LOG_MODE=full     完整模式，显示所有数据（默认）
 * 
 * - ACTION_LOG_DEPTH=1       只显示第一层（data 折叠）
 * - ACTION_LOG_DEPTH=2       展开到第二层（data 展开，但 data.children 折叠）
 * - ACTION_LOG_DEPTH=3       展开到第三层（data.children 也展开一层）
 * - ACTION_LOG_DEPTH=null    完全展开（默认）
 */
const LOG_CONFIG = {
	mode: process.env.ACTION_LOG_MODE || 'full', // 'simple' | 'summary' | 'full'
	depth: process.env.ACTION_LOG_DEPTH ? parseInt(process.env.ACTION_LOG_DEPTH) : null, // null = 完全展开
};

/**
 * 根据深度限制格式化数据
 * @param {any} data - 要格式化的数据
 * @param {number|null} maxDepth - 最大深度，null 表示无限制
 * @param {number} currentDepth - 当前深度
 * @returns {any} 格式化后的数据
 */
function formatWithDepth(data, maxDepth = null, currentDepth = 0) {
	// 如果没有深度限制，直接返回原数据
	if (maxDepth === null || maxDepth === undefined) {
		return data;
	}
	
	// 如果达到最大深度，返回摘要
	if (currentDepth >= maxDepth) {
		if (data === null || data === undefined) {
			return data;
		}
		if (Array.isArray(data)) {
			return `[Array(${data.length})]`;
		}
		if (typeof data === 'object') {
			const keys = Object.keys(data);
			return `{Object: ${keys.length} keys}`;
		}
		return data;
	}
	
	// 递归处理数组
	if (Array.isArray(data)) {
		return data.map(item => formatWithDepth(item, maxDepth, currentDepth + 1));
	}
	
	// 递归处理对象
	if (data !== null && typeof data === 'object') {
		const result = {};
		for (const key in data) {
			if (data.hasOwnProperty(key)) {
				result[key] = formatWithDepth(data[key], maxDepth, currentDepth + 1);
			}
		}
		return result;
	}
	
	// 基本类型直接返回
	return data;
}

/**
 * 获取数据摘要
 */
function getSummary(data) {
	if (data === null || data === undefined) {
		return 'null';
	}
	
	if (Array.isArray(data)) {
		return `Array(${data.length})`;
	}
	
	if (typeof data === 'object') {
		const keys = Object.keys(data);
		const preview = {};
		
		// 优先显示的关键字段
		const importantKeys = ['success', 'error', 'message', 'total', 'count'];
		importantKeys.forEach(key => {
			if (data[key] !== undefined) {
				preview[key] = data[key];
			}
		});
		
		// 如果有 data 字段且是数组，显示数组长度
		if (data.data && Array.isArray(data.data)) {
			preview.data = `Array(${data.data.length})`;
		} else if (data.data !== undefined && keys.length <= 5) {
			// 如果 data 字段不是数组但很小，显示它
			preview.data = data.data;
		}
		
		// 如果字段很少，直接返回完整数据
		if (keys.length <= 3) {
			return data;
		}
		
		// 否则返回摘要
		return { ...preview, _keys: `总计 ${keys.length} 个字段` };
	}
	
	return data;
}

/**
 * 获取简单描述（用于 simple 模式）
 */
function getSimpleDesc(data) {
	if (data === null || data === undefined) {
		return 'null';
	}
	
	if (Array.isArray(data)) {
		return `Array(${data.length})`;
	}
	
	if (typeof data === 'object') {
		return `Object`;
	}
	
	if (typeof data === 'string') {
		return data.length > 50 ? `"${data.slice(0, 50)}..."` : `"${data}"`;
	}
	
	return String(data);
}

/**
 * 记录 Server Action 日志（旧版本 - 控制台日志）
 * @deprecated 使用新版本的 logActionToConsole
 */
export function logActionToConsole(actionName, category, startTime, requestTime, params, result, isError = false) {
	if (!isDevelopment()) return;

	const duration = Date.now() - startTime;
	const timePrefix = formatTimePrefix(new Date());

	console.log(`\x1b[36m\x1b[1m--------【开始】【Server Action】【${category}】【${actionName}】--------\x1b[0m`);
	
	// 打印请求参数
	if (LOG_CONFIG.mode === 'simple') {
		// 极简模式：完全折叠
		console.log(`${timePrefix} 【请求参数】: ${getSimpleDesc(params)}`);
	} else if (LOG_CONFIG.mode === 'summary') {
		// 摘要模式：显示关键信息
		console.log(`${timePrefix} 【请求参数】:`, getSummary(params));
	} else {
		// 完整模式：显示所有数据
		console.log(`${timePrefix} 【请求参数】:`, params || {});
	}

	// 打印返回数据
	if (isError) {
		// 错误时始终显示完整信息
		console.log(`${timePrefix} \x1b[31m\x1b[1m【Error】:\x1b[0m`, result);
	} else {
		if (LOG_CONFIG.mode === 'simple') {
			// 极简模式：只显示成功状态和基本信息
			const success = result?.success !== false;
			const status = success ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
			
			if (result?.data && Array.isArray(result.data)) {
				console.log(`${timePrefix} 【返回数据】: ${status} Array(${result.data.length}), total: ${result.total || result.data.length}`);
			} else if (result?.success !== undefined) {
				console.log(`${timePrefix} 【返回数据】: ${status} { success: ${result.success} }`);
			} else {
				console.log(`${timePrefix} 【返回数据】: ${status} ${getSimpleDesc(result)}`);
			}
		} else if (LOG_CONFIG.mode === 'summary') {
			// 摘要模式：显示关键信息
			const summary = getSummary(result);
			console.log(`${timePrefix} 【返回数据】:`, summary);
			
			// 如果有大数组，额外提示
			if (result?.data && Array.isArray(result.data) && result.data.length > 0) {
				console.log(`${timePrefix} \x1b[90m提示: 设置 ACTION_LOG_MODE=full 查看完整数据\x1b[0m`);
			}
		} else {
			// 完整模式：显示所有数据
			console.log(`${timePrefix} 【返回数据】:`, result);
		}
	}

	console.log(`${timePrefix} \x1b[${isError ? '33' : '32'}m\x1b[1m【总体耗时】: ${duration} 毫秒\x1b[0m`);
	console.log(`${timePrefix} 【请求时间】: ${formatDateTime(requestTime)}`);
	console.log(`\x1b[36m\x1b[1m--------【结束】【Server Action】【${category}】【${actionName}】--------\x1b[0m\n`);
}

/**
 * 包装 Server Action，自动添加日志
 * 
 * @example
 * export const getUserList = withActionLog('getUserList', 'admin/users', async (params) => {
 *   // action logic...
 *   return { success: true, data: [...] };
 * });
 */
export function withActionLog(actionName, category, actionFn) {
	return async function (...args) {
		const startTime = Date.now();
		const requestTime = new Date();

		try {
			const result = await actionFn(...args);

			logActionToConsole(
				actionName,
				category,
				startTime,
				requestTime,
				args.length === 1 ? args[0] : args,
				result,
				result?.success === false || result?.error
			);

			return result;
		} catch (error) {
			const errorResult = {
				success: false,
				error: error.message,
				stack: error.stack,
			};

			logActionToConsole(actionName, category, startTime, requestTime, args.length === 1 ? args[0] : args, errorResult, true);

			throw error;
		}
	};
}

/**
 * 记录 Server Action 日志到数据库（新版本）
 * 
 * @param {Object} options - 日志选项
 * @param {string} options.userId - 用户 ID
 * @param {string} options.action - 操作类型 (create/update/delete/query等)
 * @param {string} options.resourceType - 资源类型 (user/role/permission等)
 * @param {string} [options.resourceId] - 资源 ID（可选）
 * @param {Object} [options.params] - 请求参数（可选）
 * @param {Object} [options.result] - 返回结果（可选）
 * @param {Object} [options.details] - 详细信息（可选，兼容旧版）
 * @param {boolean} options.success - 是否成功
 * @param {number} options.duration - 执行时长（毫秒）
 * @returns {Promise<void>}
 */
export async function logAction({ userId, action, resourceType, resourceId, params, result, details, success, duration } = {}) {
	// 参数验证 - 如果关键参数缺失，不记录日志
	if (!action || !resourceType) {
		console.warn('[logAction] Missing required parameters:', { 
			action, 
			resourceType,
			userId,
			callStack: new Error().stack?.split('\n').slice(2, 5).join('\n')
		});
		return;
	}
	
	// 在开发环境输出详细日志到控制台
	if (isDevelopment()) {
		const timePrefix = formatTimePrefix(new Date());
		const actionName = `${action}_${resourceType}`;
		const category = resourceType;
		const isError = !success;
		
		console.log(`\x1b[36m\x1b[1m--------【开始】【Server Action】【${category}】【${actionName}】--------\x1b[0m`);
		
		// 打印参数
		const requestParams = params || details || {};
		if (LOG_CONFIG.mode === 'simple') {
			console.log(`${timePrefix} 【请求参数】: ${getSimpleDesc(requestParams)}`);
		} else if (LOG_CONFIG.mode === 'summary') {
			console.log(`${timePrefix} 【请求参数】:`, getSummary(requestParams));
		} else {
			// full 模式应用深度限制
			const formattedParams = formatWithDepth(requestParams, LOG_CONFIG.depth);
			console.log(`${timePrefix} 【请求参数】:`, formattedParams);
		}
		
	// 打印结果
	if (isError) {
		const errorMsg = details?.error || result?.error || 'Unknown error';
		const formattedError = formatWithDepth(errorMsg, LOG_CONFIG.depth);
		console.log(`${timePrefix} \x1b[31m\x1b[1m【Error】:\x1b[0m`, formattedError);
	} else {
		if (LOG_CONFIG.mode === 'simple') {
			const status = '\x1b[32m✓\x1b[0m';
			// 简化模式：显示数组长度或成功状态
			if (result?.data && Array.isArray(result.data)) {
				console.log(`${timePrefix} 【返回数据】: ${status} Array(${result.data.length}), total: ${result.total || result.data.length}`);
			} else if (resourceId) {
				console.log(`${timePrefix} 【返回数据】: ${status} resourceId: ${resourceId}`);
			} else {
				console.log(`${timePrefix} 【返回数据】: ${status} Success`);
			}
		} else if (LOG_CONFIG.mode === 'summary') {
			// 摘要模式：显示关键信息
			console.log(`${timePrefix} 【返回数据】:`, getSummary(result));
		} else {
			// full 模式应用深度限制
			const formattedResult = formatWithDepth(result, LOG_CONFIG.depth);
			console.log(`${timePrefix} 【返回数据】:`, formattedResult);
		}
	}
		
		console.log(`${timePrefix} \x1b[${isError ? '33' : '32'}m\x1b[1m【总体耗时】: ${duration} 毫秒\x1b[0m`);
		console.log(`${timePrefix} 【请求时间】: ${formatDateTime(new Date())}`);
		console.log(`\x1b[36m\x1b[1m--------【结束】【Server Action】【${category}】【${actionName}】--------\x1b[0m\n`);
	}
	
	// 异步写入数据库（不阻塞主流程）
	setImmediate(async () => {
		try {
			// 导入数据库操作模块
			const { getCollection } = await import('@/lib/database/mongodb');
			
			// 准备日志数据
			const logData = {
				userId: userId || 'system',
				action,
				resourceType,
				resourceId: resourceId || null,
				params: params || details || {}, // 请求参数
				result: result || {}, // 返回结果
				success: success !== false,
				duration: duration || 0,
				createdAt: new Date(),
				ip: null, // 可以从 headers 中获取
				userAgent: null, // 可以从 headers 中获取
			};
			
			// 写入数据库
			const collection = await getCollection('action_logs');
			await collection.insertOne(logData);
		} catch (error) {
			// 日志记录失败不应该影响主流程
			console.error('[logAction] Failed to write action log:', error);
		}
	});
}
