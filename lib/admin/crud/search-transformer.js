/**
 * 搜索条件转换器
 * 
 * 将前端搜索参数转换为 MongoDB 查询条件
 * 类似 vk.baseDao.getTableData 的搜索条件处理
 */

import dayjs from 'dayjs';

/**
 * 转换搜索参数为 MongoDB 查询条件
 * 
 * @param {Object} searchParams - 前端搜索参数
 * @param {Array} fieldsConfig - 字段配置
 * @returns {Object} MongoDB 查询条件
 */
export function transformSearchToQuery(searchParams, fieldsConfig) {
	const query = {};
	
	// 创建字段映射表
	const fieldMap = {};
	fieldsConfig.forEach(field => {
		fieldMap[field.key] = field;
	});
	
	// 遍历搜索参数
	Object.keys(searchParams).forEach(key => {
		const value = searchParams[key];
		
		// 跳过空值
		if (value === undefined || value === null || value === '') return;
		
		// 处理特殊的范围参数 (如 key_start, key_end)
		if (key.endsWith('_start') || key.endsWith('_end')) {
			const baseKey = key.replace(/_start$|_end$/, '');
			const field = fieldMap[baseKey];
			
			if (!query[baseKey]) {
				query[baseKey] = {};
			}
			
			if (key.endsWith('_start')) {
				query[baseKey].$gte = parseValue(value, field);
			} else {
				query[baseKey].$lte = parseValue(value, field);
			}
			return;
		}
		
		// 处理比较操作符参数
		const operators = ['_gt', '_gte', '_lt', '_lte', '_ne'];
		const matchedOp = operators.find(op => key.endsWith(op));
		
		if (matchedOp) {
			const baseKey = key.replace(new RegExp(matchedOp + '$'), '');
			const field = fieldMap[baseKey];
			const mongoOp = matchedOp.replace('_', '$');
			
			if (!query[baseKey]) {
				query[baseKey] = {};
			}
			
			query[baseKey][mongoOp] = parseValue(value, field);
			return;
		}
		
		// 获取字段配置
		const field = fieldMap[key];
		if (!field) {
			// 如果没有字段配置,直接使用值
			query[key] = value;
			return;
		}
		
		// 根据搜索模式转换
		const mode = field.search?.mode || 'exact';
		
		switch (mode) {
			case 'like':
			case '%%':
				// 模糊搜索 (包含)
				query[key] = { $regex: value, $options: 'i' };
				break;
				
			case 'likeLeft':
			case '%=':
				// 左模糊搜索 (以...结尾)
				query[key] = { $regex: `${value}$`, $options: 'i' };
				break;
				
			case 'likeRight':
			case '=%':
				// 右模糊搜索 (以...开头)
				query[key] = { $regex: `^${value}`, $options: 'i' };
				break;
				
			case 'exact':
			case '==':
				// 精确搜索
				query[key] = parseValue(value, field);
				break;
				
			case 'range':
			case '[]':
				// 范围搜索
				if (Array.isArray(value) && value.length === 2) {
					const [start, end] = value;
					
					// 处理日期范围
					if (field.type === 'daterange' || field.type === 'datetimerange') {
						query[key] = {
							$gte: parseDateValue(start, field),
							$lte: parseDateValue(end, field),
						};
					} else {
						query[key] = {
							$gte: parseValue(start, field),
							$lte: parseValue(end, field),
						};
					}
				}
				break;
				
			case 'in':
				// 包含 (用于多选)
				if (Array.isArray(value)) {
					query[key] = { $in: value.map(v => parseValue(v, field)) };
				} else {
					query[key] = parseValue(value, field);
				}
				break;
				
			case 'nin':
				// 不包含
				if (Array.isArray(value)) {
					query[key] = { $nin: value.map(v => parseValue(v, field)) };
				}
				break;
				
			case 'exists':
				// 字段存在
				query[key] = { $exists: Boolean(value) };
				break;
				
			case 'gt':
			case '>':
				query[key] = { $gt: parseValue(value, field) };
				break;
				
			case 'gte':
			case '>=':
				query[key] = { $gte: parseValue(value, field) };
				break;
				
			case 'lt':
			case '<':
				query[key] = { $lt: parseValue(value, field) };
				break;
				
			case 'lte':
			case '<=':
				query[key] = { $lte: parseValue(value, field) };
				break;
				
			case 'ne':
			case '!=':
				query[key] = { $ne: parseValue(value, field) };
				break;
				
			default:
				// 默认精确搜索
				query[key] = parseValue(value, field);
		}
	});
	
	return query;
}

/**
 * 解析值的类型
 */
function parseValue(value, field) {
	if (!field) return value;
	
	switch (field.type) {
		case 'number':
		case 'money':
		case 'percentage':
			return Number(value);
			
		case 'date':
		case 'datetime':
			return parseDateValue(value, field);
			
		case 'switch':
			return Boolean(value);
			
		case 'json':
			return typeof value === 'string' ? JSON.parse(value) : value;
			
		default:
			return value;
	}
}

/**
 * 解析日期值
 */
function parseDateValue(value, field) {
	if (!value) return value;
	
	const date = dayjs(value);
	
	// 如果是日期范围的结束时间,设置为当天的 23:59:59
	if (field.type === 'daterange' && field.search?.endOfDay) {
		return date.endOf('day').toDate();
	}
	
	return date.toDate();
}

/**
 * 构建排序条件
 * 
 * @param {Object} sortParams - ProTable 的排序参数
 * @param {Array} fieldsConfig - 字段配置
 * @returns {Object} MongoDB 排序条件
 */
export function buildSortCondition(sortParams, fieldsConfig) {
	if (!sortParams || Object.keys(sortParams).length === 0) {
		// 使用默认排序
		const defaultSort = {};
		fieldsConfig.forEach(field => {
			if (field.table?.defaultSort) {
				defaultSort[field.key] = field.table.defaultSort === 'desc' ? -1 : 1;
			}
		});
		
		// 如果没有默认排序,按创建时间降序
		if (Object.keys(defaultSort).length === 0) {
			defaultSort.createdAt = -1;
		}
		
		return defaultSort;
	}
	
	// 转换 ProTable 的排序格式
	const sort = {};
	Object.keys(sortParams).forEach(key => {
		const value = sortParams[key];
		if (value === 'ascend') {
			sort[key] = 1;
		} else if (value === 'descend') {
			sort[key] = -1;
		}
	});
	
	return sort;
}

/**
 * 合并查询条件
 * 
 * @param {Object} baseQuery - 基础查询条件 (强制条件)
 * @param {Object} searchQuery - 搜索查询条件
 * @returns {Object} 合并后的查询条件
 */
export function mergeQueryConditions(baseQuery, searchQuery) {
	// 如果有冲突,baseQuery 优先
	const merged = { ...searchQuery };
	
	Object.keys(baseQuery).forEach(key => {
		if (merged[key] !== undefined) {
			// 如果都是对象,尝试合并
			if (typeof merged[key] === 'object' && typeof baseQuery[key] === 'object') {
				merged[key] = { ...merged[key], ...baseQuery[key] };
			} else {
				// 否则 baseQuery 覆盖
				merged[key] = baseQuery[key];
			}
		} else {
			merged[key] = baseQuery[key];
		}
	});
	
	return merged;
}

/**
 * 从字段配置生成 getList 的数据处理配置
 * 类似 vk.baseDao.getTableData 的参数格式
 * 
 * @param {Array} fieldsConfig - 字段配置
 * @param {Object} searchParams - 搜索参数
 * @param {Object} options - 其他选项
 * @returns {Object} 数据处理配置
 */
export function generateTableDataConfig(fieldsConfig, searchParams, options = {}) {
	const {
		pageIndex = 1,
		pageSize = 20,
		sortParams = {},
		baseQuery = {},
	} = options;
	
	// 转换搜索条件
	const searchQuery = transformSearchToQuery(searchParams, fieldsConfig);
	
	// 合并查询条件
	const where = mergeQueryConditions(baseQuery, searchQuery);
	
	// 构建排序条件
	const sort = buildSortCondition(sortParams, fieldsConfig);
	
	return {
		where,
		sort,
		page: pageIndex,
		limit: pageSize,
	};
}

/**
 * 验证搜索参数
 * 
 * @param {Object} searchParams - 搜索参数
 * @param {Array} fieldsConfig - 字段配置
 * @returns {Object} { valid: boolean, errors: Array }
 */
export function validateSearchParams(searchParams, fieldsConfig) {
	const errors = [];
	const fieldMap = {};
	
	fieldsConfig.forEach(field => {
		fieldMap[field.key] = field;
	});
	
	Object.keys(searchParams).forEach(key => {
		const value = searchParams[key];
		const field = fieldMap[key];
		
		if (!field) {
			// 允许未定义的字段 (可能是动态字段)
			return;
		}
		
		// 类型验证
		if (field.type === 'number' && isNaN(Number(value))) {
			errors.push(`${field.title} must be a number`);
		}
		
		// 范围验证
		if (field.search?.mode === 'range' && !Array.isArray(value)) {
			errors.push(`${field.title} must be a range (array)`);
		}
		
		// 自定义验证
		if (field.search?.validator) {
			try {
				const result = field.search.validator(value);
				if (!result) {
					errors.push(field.search.validatorMessage || `Invalid ${field.title}`);
				}
			} catch (e) {
				errors.push(`Validation error for ${field.title}: ${e.message}`);
			}
		}
	});
	
	return {
		valid: errors.length === 0,
		errors,
	};
}

