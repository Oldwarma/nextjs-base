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
 *
 * MODE 配置：
 * - ACTION_LOG_MODE=full     完整模式，展开数组和对象（深度由 DEPTH 控制，默认）
 * - ACTION_LOG_MODE=summary  摘要模式，折叠所有数组为 Array(N)，对象正常显示
 * - ACTION_LOG_MODE=simple   极简模式，单行输出关键信息
 *
 * DEPTH 配置：
 * - ACTION_LOG_DEPTH=1-5     限制展开深度（1-5层）
 * - ACTION_LOG_DEPTH=null    完全展开（默认）
 *
 * DATABASE 配置：
 * - ACTION_LOG_DATABASE=1    入库（默认，记录到数据库）
 * - ACTION_LOG_DATABASE=0    不入库（仅控制台输出）
 *
 * MAX 配置（最大记录数）：
 * - ACTION_LOG_MAX=1000      保留最新的 1000 条记录，超过后删除最旧的
 * - ACTION_LOG_MAX=0         无限记录（默认）
 * - ACTION_LOG_MAX=          留空表示无限记录
 *
 * TYPE 配置（数据库记录类型过滤，不影响控制台输出）：
 * - ACTION_LOG_TYPE=all                数据库记录所有操作（默认）
 * - ACTION_LOG_TYPE=create,delete      数据库只记录创建和删除操作
 * - ACTION_LOG_TYPE=                   留空表示数据库不记录任何操作（控制台仍输出）
 *
 * 操作类型映射：
 * - read: query, getList, getDetail
 * - create: create
 * - update: update, batchUpdate, batch_update
 * - delete: delete, batchDelete, batch_delete
 *
 * 深度说明：
 * - depth=1: 只展开第一层（数组项和对象字段会折叠）
 * - depth=2: 展开到第二层（数组项内的对象会折叠）
 * - depth=null: 完全展开所有层级
 */
const LOG_CONFIG = {
	mode: process.env.ACTION_LOG_MODE || 'full', // 'simple' | 'summary' | 'full'
	depth: (() => {
		const depth = process.env.ACTION_LOG_DEPTH;
		if (depth === undefined || depth === null || depth === '' || depth === 'null') {
			return null; // 完全展开
		}
		const parsed = parseInt(depth);
		if (isNaN(parsed) || parsed < 1 || parsed > 5) {
			console.warn(`[action-logger] Invalid ACTION_LOG_DEPTH="${depth}", must be 1-5 or null. Using default (null).`);
			return null;
		}
		return parsed;
	})(),
	database: (() => {
		const dbLog = process.env.ACTION_LOG_DATABASE;
		// 默认为 1（入库）
		if (dbLog === undefined || dbLog === null || dbLog === '' || dbLog === '1') {
			return true;
		}
		if (dbLog === '0') {
			return false;
		}
		console.warn(`[action-logger] Invalid ACTION_LOG_DATABASE="${dbLog}", must be 0 or 1. Using default (1, enabled).`);
		return true;
	})(),
	max: (() => {
		const max = process.env.ACTION_LOG_MAX;
		// 默认为 0（无限）
		if (max === undefined || max === null || max === '' || max === '0') {
			return 0; // 无限记录
		}
		const parsed = parseInt(max);
		if (isNaN(parsed) || parsed < 0) {
			console.warn(`[action-logger] Invalid ACTION_LOG_MAX="${max}", must be >= 0. Using default (0, unlimited).`);
			return 0;
		}
		return parsed;
	})(),
	types: (() => {
		const types = process.env.ACTION_LOG_TYPE;
		// 默认为 'all'
		if (types === undefined || types === null || types === '' || types === 'all') {
			return ['all'];
		}
		// 空字符串或明确设置为空
		if (types.trim() === '') {
			return [];
		}
		// 解析逗号分隔的类型列表
		const typeList = types
			.split(',')
			.map((t) => t.trim().toLowerCase())
			.filter((t) => t);
		// 验证类型
		const validTypes = ['all', 'create', 'read', 'update', 'delete'];
		const invalidTypes = typeList.filter((t) => !validTypes.includes(t));
		if (invalidTypes.length > 0) {
			console.warn(`[action-logger] Invalid ACTION_LOG_TYPE values: ${invalidTypes.join(', ')}. Valid types: ${validTypes.join(', ')}`);
		}
		return typeList.filter((t) => validTypes.includes(t));
	})(),
};

/**
 * 将操作映射到类型
 * @param {string} action - 操作名称（如 query, create, update, delete等）
 * @returns {string} 类型名称（read, create, update, delete）
 */
function mapActionToType(action) {
	const actionLower = action.toLowerCase();

	// read 操作
	if (['query', 'getlist', 'getdetail', 'get'].includes(actionLower)) {
		return 'read';
	}

	// create 操作
	if (actionLower === 'create') {
		return 'create';
	}

	// update 操作
	if (['update', 'batchupdate', 'batch_update'].includes(actionLower)) {
		return 'update';
	}

	// delete 操作
	if (['delete', 'batchdelete', 'batch_delete'].includes(actionLower)) {
		return 'delete';
	}

	// 默认归类为 read
	return 'read';
}

/**
 * 检查是否应该记录该操作
 * @param {string} action - 操作名称
 * @returns {boolean} 是否应该记录
 */
function shouldLogAction(action) {
	// 如果 types 为空数组，不记录任何操作
	if (LOG_CONFIG.types.length === 0) {
		return false;
	}

	// 如果包含 'all'，记录所有操作
	if (LOG_CONFIG.types.includes('all')) {
		return true;
	}

	// 将操作映射到类型并检查
	const actionType = mapActionToType(action);
	return LOG_CONFIG.types.includes(actionType);
}

/**
 * 清理超出限制的旧日志
 * @param {Object} collection - MongoDB collection 对象
 * @returns {Promise<void>}
 */
async function cleanupOldLogs(collection) {
	if (LOG_CONFIG.max <= 0) {
		return; // 无限记录，不清理
	}

	try {
		// 获取当前记录总数
		const totalCount = await collection.count();

		if (totalCount > LOG_CONFIG.max) {
			// 计算需要删除的数量
			const deleteCount = totalCount - LOG_CONFIG.max;

			// 获取最旧的 N 条记录的 _id
			const oldestLogs = await collection.find(
				{},
				{
					sort: { createdAt: 1 },
					limit: deleteCount,
					projection: { _id: 1 },
				}
			);

			if (oldestLogs.length > 0) {
				const idsToDelete = oldestLogs.map((log) => log._id);

				// 批量删除
				const deleteResult = await collection.deleteMany({
					_id: { $in: idsToDelete },
				});

				console.log(`[action-logger] Cleaned up ${deleteResult.deletedCount} old logs (total: ${totalCount}, max: ${LOG_CONFIG.max})`);
			}
		}
	} catch (error) {
		console.error('[action-logger] Failed to cleanup old logs:', error);
	}
}

/**
 * 根据模式和深度格式化数据
 *
 * @param {any} data - 要格式化的数据
 * @param {string} mode - 格式化模式（'full' | 'summary' | 'simple'）
 * @param {number|null} maxDepth - 最大深度，null 表示无限制
 * @param {number} currentDepth - 当前深度（内部使用）
 * @returns {any} 格式化后的数据
 */
function formatDataByMode(data, mode = 'full', maxDepth = null, currentDepth = 0) {
	// 处理 null/undefined
	if (data === null || data === undefined) {
		return data;
	}

	// === summary 模式：折叠所有数组 ===
	if (mode === 'summary') {
		if (Array.isArray(data)) {
			return `Array(${data.length})`;
		}

		// 对象：递归处理字段，但遇到数组就折叠
		if (typeof data === 'object') {
			// 如果达到深度限制，折叠对象
			if (maxDepth !== null && currentDepth >= maxDepth) {
				const keys = Object.keys(data);
				return `{${keys.length} keys}`;
			}

			const result = {};
			for (const key in data) {
				if (data.hasOwnProperty(key)) {
					result[key] = formatDataByMode(data[key], mode, maxDepth, currentDepth + 1);
				}
			}
			return result;
		}

		return data;
	}

	// === full 模式：展开数组和对象（受 depth 限制）===
	if (mode === 'full') {
		// 如果达到最大深度，折叠
		if (maxDepth !== null && currentDepth >= maxDepth) {
			if (Array.isArray(data)) {
				return `[Array(${data.length})]`;
			}
			if (typeof data === 'object') {
				const keys = Object.keys(data);
				return `{${keys.length} keys}`;
			}
			return data;
		}

		// 递归处理数组
		if (Array.isArray(data)) {
			return data.map((item) => formatDataByMode(item, mode, maxDepth, currentDepth + 1));
		}

		// 递归处理对象
		if (typeof data === 'object') {
			const result = {};
			for (const key in data) {
				if (data.hasOwnProperty(key)) {
					result[key] = formatDataByMode(data[key], mode, maxDepth, currentDepth + 1);
				}
			}
			return result;
		}

		return data;
	}

	// simple 模式不应该用这个函数
	return data;
}

/**
 * 生成 simple 模式的单行日志
 * 格式: [✓/✗] action resourceType | params: {...} | result: {...} | 100ms
 *
 * @param {string} action - 操作类型
 * @param {string} resourceType - 资源类型
 * @param {Object} params - 请求参数
 * @param {Object} result - 返回结果
 * @param {number} duration - 执行时长（毫秒）
 * @param {boolean} success - 是否成功
 * @returns {string} 单行日志字符串
 */
function formatSimpleLine(action, resourceType, params, result, duration, success) {
	const status = success ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
	const actionName = `${action}_${resourceType}`;

	// 提取关键参数（最多3个字段）
	const getKeyFields = (obj, maxFields = 3) => {
		if (!obj || typeof obj !== 'object') return String(obj);

		const keys = Object.keys(obj);
		if (keys.length === 0) return '{}';

		const importantKeys = ['id', 'name', 'email', 'title', 'status', 'type'];
		const selectedKeys = [];

		// 优先选择重要字段
		for (const key of importantKeys) {
			if (obj[key] !== undefined) {
				selectedKeys.push(key);
				if (selectedKeys.length >= maxFields) break;
			}
		}

		// 如果不够，补充其他字段
		if (selectedKeys.length < maxFields) {
			for (const key of keys) {
				if (!selectedKeys.includes(key)) {
					selectedKeys.push(key);
					if (selectedKeys.length >= maxFields) break;
				}
			}
		}

		const fields = selectedKeys
			.map((key) => {
				let value = obj[key];
				if (typeof value === 'string' && value.length > 20) {
					value = value.slice(0, 20) + '...';
				} else if (Array.isArray(value)) {
					value = `[${value.length}]`;
				} else if (typeof value === 'object' && value !== null) {
					value = '{...}';
				}
				return `${key}:${JSON.stringify(value)}`;
			})
			.join(', ');

		const more = keys.length > selectedKeys.length ? `, +${keys.length - selectedKeys.length} more` : '';
		return `{${fields}${more}}`;
	};

	const paramsStr = getKeyFields(params);
	const resultStr = success ? getKeyFields(result) : result?.error || 'error';

	return `[${status}] ${actionName} | params: ${paramsStr} | result: ${resultStr} | ${duration}ms`;
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
			callStack: new Error().stack?.split('\n').slice(2, 5).join('\n'),
		});
		return;
	}

	// 在开发环境输出详细日志到控制台（始终输出，不受 TYPE 过滤影响）
	if (isDevelopment()) {
		const timePrefix = formatTimePrefix(new Date());
		const actionName = `${action}_${resourceType}`;
		const category = resourceType;
		const isError = !success;
		const requestParams = params || details || {};

		// === simple 模式：单行输出 ===
		if (LOG_CONFIG.mode === 'simple') {
			const simpleLine = formatSimpleLine(action, resourceType, requestParams, result, duration, success);
			console.log(`${timePrefix} ${simpleLine}`);
			return; // simple 模式只输出一行，直接返回
		}

		// === full/summary 模式：详细输出 ===
		console.log(`\x1b[36m\x1b[1m--------【开始】【Server Action】【${category}】【${actionName}】--------\x1b[0m`);

		// 打印参数
		const formattedParams = formatDataByMode(requestParams, LOG_CONFIG.mode, LOG_CONFIG.depth);
		console.log(`${timePrefix} 【请求参数】:`, formattedParams);

		// 打印结果
		if (isError) {
			const errorMsg = details?.error || result?.error || 'Unknown error';
			const formattedError = formatDataByMode(errorMsg, LOG_CONFIG.mode, LOG_CONFIG.depth);
			console.log(`${timePrefix} \x1b[31m\x1b[1m【Error】:\x1b[0m`, formattedError);
		} else {
			const formattedResult = formatDataByMode(result, LOG_CONFIG.mode, LOG_CONFIG.depth);
			console.log(`${timePrefix} 【返回数据】:`, formattedResult);
		}

		console.log(`${timePrefix} \x1b[${isError ? '33' : '32'}m\x1b[1m【总体耗时】: ${duration} 毫秒\x1b[0m`);
		console.log(`${timePrefix} 【请求时间】: ${formatDateTime(new Date())}`);
		console.log(`\x1b[36m\x1b[1m--------【结束】【Server Action】【${category}】【${actionName}】--------\x1b[0m\n`);
	}

	// 根据配置决定是否异步写入数据库
	// ✅ 数据库写入受 TYPE 过滤影响
	if (LOG_CONFIG.database && shouldLogAction(action)) {
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

				// ✅ 清理超出限制的旧日志
				await cleanupOldLogs(collection);
			} catch (error) {
				// 日志记录失败不应该影响主流程
				console.error('[logAction] Failed to write action log:', error);
			}
		});
	}
}
