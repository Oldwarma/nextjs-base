/**
 * Server Action Logger
 * 使用 Prisma 直接操作 PostgreSQL
 */

import { prisma } from '@/lib/database/prisma';
import nb from '@/lib/function';

/**
 * 格式化时间前缀（使用 nb.pubfn.timeFormat）
 */
function formatTimePrefix(date) {
	return nb.pubfn.timeFormat(date, 'hh:mm:ss.S');
}

/**
 * 格式化完整时间（使用 nb.pubfn.timeFormat）
 */
function formatDateTime(date) {
	if (nb.pubfn.isNull(date)) return 'N/A';
	return nb.pubfn.timeFormat(date, 'yyyy-MM-dd hh:mm:ss');
}

function isDevelopment() {
	return process.env.NODE_ENV === 'development';
}

/**
 * 日志配置
 */
const LOG_CONFIG = {
	mode: process.env.ACTION_LOG_MODE || 'simple',
	depth: (() => {
		const depth = process.env.ACTION_LOG_DEPTH;
		// 使用 nb.pubfn.isNull 判断空值
		if (nb.pubfn.isNull(depth) || depth === 'null') {
			return null;
		}
		const parsed = parseInt(depth);
		if (isNaN(parsed) || parsed < 1 || parsed > 5) {
			return null;
		}
		return parsed;
	})(),
	database: (() => {
		const dbLog = process.env.ACTION_LOG_DATABASE;
		if (nb.pubfn.isNull(dbLog) || dbLog === '1') {
			return true;
		}
		return dbLog !== '0';
	})(),
	max: (() => {
		const max = process.env.ACTION_LOG_MAX;
		if (nb.pubfn.isNull(max) || max === '0') {
			return 0;
		}
		const parsed = parseInt(max);
		return isNaN(parsed) || parsed < 0 ? 0 : parsed;
	})(),
	types: (() => {
		const types = process.env.ACTION_LOG_TYPE;
		if (nb.pubfn.isNull(types) || types === 'all') {
			return ['all'];
		}
		if (types.trim() === '') {
			return [];
		}
		const typeList = types.split(',').map((t) => t.trim().toLowerCase()).filter((t) => t);
		const validTypes = ['all', 'create', 'read', 'update', 'delete'];
		return typeList.filter((t) => validTypes.includes(t));
	})(),
};

function mapActionToType(action) {
	const actionLower = action.toLowerCase();
	if (['query', 'getlist', 'getdetail', 'get'].includes(actionLower)) return 'read';
	if (actionLower === 'create') return 'create';
	if (['update', 'batchupdate', 'batch_update'].includes(actionLower)) return 'update';
	if (['delete', 'batchdelete', 'batch_delete'].includes(actionLower)) return 'delete';
	return 'read';
}

function shouldLogAction(action) {
	if (LOG_CONFIG.types.length === 0) return false;
	if (LOG_CONFIG.types.includes('all')) return true;
	return LOG_CONFIG.types.includes(mapActionToType(action));
}

/**
 * 清理超出限制的旧日志
 */
async function cleanupOldLogs() {
	if (LOG_CONFIG.max <= 0) return;

	try {
		const totalCount = await prisma.actionLog.count();

		if (totalCount > LOG_CONFIG.max) {
			const deleteCount = totalCount - LOG_CONFIG.max;

			// 获取最旧的记录
			const oldestLogs = await prisma.actionLog.findMany({
				orderBy: { createdAt: 'asc' },
				take: deleteCount,
				select: { id: true },
			});

			if (oldestLogs.length > 0) {
				// 使用 nb.pubfn.arrayObjectGetArray 提取 id 数组
				const idsToDelete = nb.pubfn.arrayObjectGetArray(oldestLogs, 'id');
				const result = await prisma.actionLog.deleteMany({
					where: { id: { in: idsToDelete } },
				});
				console.log(`[action-logger] Cleaned up ${result.count} old logs`);
			}
		}
	} catch (error) {
		console.error('[action-logger] Failed to cleanup old logs:', error);
	}
}

function formatDataByMode(data, mode = 'full', maxDepth = null, currentDepth = 0) {
	if (nb.pubfn.isNull(data)) return data;

	if (mode === 'summary') {
		if (nb.pubfn.isArray(data)) return `Array(${data.length})`;
		if (nb.pubfn.isObject(data)) {
			if (maxDepth !== null && currentDepth >= maxDepth) {
				return `{${Object.keys(data).length} keys}`;
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

	if (mode === 'full') {
		if (maxDepth !== null && currentDepth >= maxDepth) {
			if (nb.pubfn.isArray(data)) return `[Array(${data.length})]`;
			if (nb.pubfn.isObject(data)) return `{${Object.keys(data).length} keys}`;
			return data;
		}
		if (nb.pubfn.isArray(data)) {
			return data.map((item) => formatDataByMode(item, mode, maxDepth, currentDepth + 1));
		}
		if (nb.pubfn.isObject(data)) {
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

	return data;
}

function formatSimpleLine(action, resourceType, params, result, duration, success) {
	const status = success ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
	const actionName = `${action}_${resourceType}`;

	const getKeyFields = (obj, maxFields = 3) => {
		if (nb.pubfn.isNull(obj) || !nb.pubfn.isObject(obj)) return String(obj);
		const keys = Object.keys(obj);
		if (keys.length === 0) return '{}';

		const importantKeys = ['id', 'name', 'email', 'title', 'status', 'type'];
		const selectedKeys = [];

		for (const key of importantKeys) {
			if (obj[key] !== undefined) {
				selectedKeys.push(key);
				if (selectedKeys.length >= maxFields) break;
			}
		}

		if (selectedKeys.length < maxFields) {
			for (const key of keys) {
				if (!selectedKeys.includes(key)) {
					selectedKeys.push(key);
					if (selectedKeys.length >= maxFields) break;
				}
			}
		}

		const fields = selectedKeys.map((key) => {
			let value = obj[key];
			if (typeof value === 'string' && value.length > 20) {
				value = value.slice(0, 20) + '...';
			} else if (nb.pubfn.isArray(value)) {
				value = `[${value.length}]`;
			} else if (nb.pubfn.isObject(value)) {
				value = '{...}';
			}
			return `${key}:${JSON.stringify(value)}`;
		}).join(', ');

		const more = keys.length > selectedKeys.length ? `, +${keys.length - selectedKeys.length} more` : '';
		return `{${fields}${more}}`;
	};

	const paramsStr = getKeyFields(params);
	const resultStr = success ? getKeyFields(result) : result?.error || 'error';

	return `[${status}] ${actionName} | params: ${paramsStr} | result: ${resultStr} | ${duration}ms`;
}

/**
 * 记录 Server Action 日志
 */
export async function logAction({ userId, action, resourceType, resourceId, params, result, details, success, duration } = {}) {
	if (!action || !resourceType) {
		console.warn('[logAction] Missing required parameters:', { action, resourceType, userId });
		return;
	}

	// 开发环境控制台输出
	if (isDevelopment()) {
		const timePrefix = formatTimePrefix(new Date());
		const actionName = `${action}_${resourceType}`;
		const category = resourceType;
		const isError = !success;
		const requestParams = params || details || {};

		if (LOG_CONFIG.mode === 'simple') {
			const simpleLine = formatSimpleLine(action, resourceType, requestParams, result, duration, success);
			console.log(`${timePrefix} ${simpleLine}`);
		} else {
			console.log(`\x1b[36m\x1b[1m--------【开始】【Server Action】【${category}】【${actionName}】--------\x1b[0m`);
			const formattedParams = formatDataByMode(requestParams, LOG_CONFIG.mode, LOG_CONFIG.depth);
			console.log(`${timePrefix} 【请求参数】:`, formattedParams);

			if (isError) {
				const errorMsg = details?.error || result?.error || 'Unknown error';
				console.log(`${timePrefix} \x1b[31m\x1b[1m【Error】:\x1b[0m`, errorMsg);
			} else {
				const formattedResult = formatDataByMode(result, LOG_CONFIG.mode, LOG_CONFIG.depth);
				console.log(`${timePrefix} 【返回数据】:`, formattedResult);
			}

			console.log(`${timePrefix} \x1b[${isError ? '33' : '32'}m\x1b[1m【总体耗时】: ${duration} 毫秒\x1b[0m`);
			console.log(`${timePrefix} 【请求时间】: ${formatDateTime(new Date())}`);
			console.log(`\x1b[36m\x1b[1m--------【结束】【Server Action】【${category}】【${actionName}】--------\x1b[0m\n`);
		}
	}

	// 异步写入数据库
	if (LOG_CONFIG.database && shouldLogAction(action)) {
		setImmediate(async () => {
			try {
				await prisma.actionLog.create({
					data: {
						id: nb.pubfn.uuid(),
						userId: userId || 'system',
						action,
						resourceType,
						resourceId: resourceId || null,
						params: params || details || {},
						result: result || {},
						success: success !== false,
						duration: duration || 0,
						ip: null,
						userAgent: null,
					},
				});

				await cleanupOldLogs();
			} catch (error) {
				// 只打印错误消息，避免打印整个 Prisma 运行时代码
				console.error('[logAction] Failed to write action log:', error?.message || 'Unknown error');
			}
		});
	}
}
