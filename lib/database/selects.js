/**
 * 万能连表查询工具
 * 
 * 参考 vk-unicloud 的 selects API 设计
 * 文档: https://vkdoc.fsq.pub/client/uniCloud/db/selects.html
 * 
 * 特点：
 * 1. 支持数组字段关联（如 users.roles[] -> roles.id）
 * 2. 支持普通外键关联（如 action_logs.user_id -> users.id）
 * 3. 支持一对一、一对多关系
 * 4. 自动处理分页、排序、过滤
 * 5. 无需中间表，利用 PostgreSQL 原生能力
 * 
 * 注意：直接使用数据库的表名和列名，不做任何转换！
 */

import { prisma } from './prisma';

/**
 * 构建 WHERE 子句
 * @param {Object} whereJson - 查询条件（key 必须是数据库列名）
 * @param {string} alias - 表别名
 * @param {number} startIndex - 参数起始索引
 * @returns {{ clause: string, params: Array, nextIndex: number }}
 */
function buildWhereClause(whereJson, alias = 'main', startIndex = 1) {
	const conditions = [];
	const params = [];
	let paramIndex = startIndex;

	if (!whereJson || Object.keys(whereJson).length === 0) {
		return { clause: '', params: [], nextIndex: paramIndex };
	}

	for (const [key, value] of Object.entries(whereJson)) {
		// 直接使用传入的列名，不做转换
		const fullColumn = `${alias}."${key}"`;

		if (value === null) {
			conditions.push(`${fullColumn} IS NULL`);
		} else if (value === undefined) {
			continue;
		} else if (typeof value === 'object' && !Array.isArray(value)) {
			// 处理操作符对象
			if (value.contains !== undefined) {
				// 模糊搜索
				conditions.push(`${fullColumn} ILIKE $${paramIndex}`);
				params.push(`%${value.contains}%`);
				paramIndex++;
			} else if (value.equals !== undefined) {
				conditions.push(`${fullColumn} = $${paramIndex}`);
				params.push(value.equals);
				paramIndex++;
			} else if (value.in !== undefined && Array.isArray(value.in)) {
				conditions.push(`${fullColumn} = ANY($${paramIndex})`);
				params.push(value.in);
				paramIndex++;
			} else if (value.notIn !== undefined && Array.isArray(value.notIn)) {
				conditions.push(`NOT (${fullColumn} = ANY($${paramIndex}))`);
				params.push(value.notIn);
				paramIndex++;
			} else if (value.gt !== undefined) {
				conditions.push(`${fullColumn} > $${paramIndex}`);
				params.push(value.gt);
				paramIndex++;
			} else if (value.gte !== undefined) {
				conditions.push(`${fullColumn} >= $${paramIndex}`);
				params.push(value.gte);
				paramIndex++;
			} else if (value.lt !== undefined) {
				conditions.push(`${fullColumn} < $${paramIndex}`);
				params.push(value.lt);
				paramIndex++;
			} else if (value.lte !== undefined) {
				conditions.push(`${fullColumn} <= $${paramIndex}`);
				params.push(value.lte);
				paramIndex++;
			} else if (value.hasSome !== undefined && Array.isArray(value.hasSome)) {
				// 数组包含任意一个
				conditions.push(`${fullColumn} && $${paramIndex}::text[]`);
				params.push(value.hasSome);
				paramIndex++;
			} else if (value.hasEvery !== undefined && Array.isArray(value.hasEvery)) {
				// 数组包含所有
				conditions.push(`${fullColumn} @> $${paramIndex}::text[]`);
				params.push(value.hasEvery);
				paramIndex++;
			}
		} else if (Array.isArray(value)) {
			// 数组值，使用 IN
			conditions.push(`${fullColumn} = ANY($${paramIndex})`);
			params.push(value);
			paramIndex++;
		} else {
			// 精确匹配
			conditions.push(`${fullColumn} = $${paramIndex}`);
			params.push(value);
			paramIndex++;
		}
	}

	return {
		clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
		params,
		nextIndex: paramIndex,
	};
}

/**
 * 构建字段选择
 * @param {Object} fieldJson - 字段配置 { fieldName: true/false }
 * @param {string} alias - 表别名
 * @param {Array} allFields - 所有可用字段（可选）
 * @returns {string} SELECT 字段列表
 */
function buildFieldSelect(fieldJson, alias = 'main', allFields = null) {
	if (!fieldJson || Object.keys(fieldJson).length === 0) {
		return `${alias}.*`;
	}

	const includeFields = [];
	const excludeFields = [];

	for (const [key, include] of Object.entries(fieldJson)) {
		if (include === true) {
			includeFields.push(key);
		} else if (include === false) {
			excludeFields.push(key);
		}
	}

	// 如果有明确包含的字段，只选择这些字段
	if (includeFields.length > 0) {
		return includeFields.map(f => `${alias}."${f}"`).join(', ');
	}

	// 如果只有排除字段，需要知道所有字段才能排除
	// 这里简化处理，返回 *，实际排除在结果处理中进行
	return `${alias}.*`;
}

/**
 * 构建排序子句
 * @param {Array} sortArr - 排序配置 [{ name: '列名', type: 'asc'|'desc' }]
 * @param {string} alias - 表别名
 * @returns {string} ORDER BY 子句
 */
function buildOrderClause(sortArr, alias = 'main') {
	if (!sortArr || sortArr.length === 0) {
		return `ORDER BY ${alias}."createdAt" DESC`;
	}

	const orders = sortArr.map(({ name, type }) => {
		const dir = type?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
		// 处理副表排序
		if (name.includes('.')) {
			return `"${name}" ${dir}`;
		}
		// 直接使用传入的列名
		return `${alias}."${name}" ${dir}`;
	});

	return `ORDER BY ${orders.join(', ')}`;
}

/**
 * 构建副表子查询
 * @param {Object} foreignConfig - 副表配置
 * @returns {string} 子查询 SQL
 */
function buildForeignSubquery(foreignConfig) {
	const {
		dbName,        // 副表名（数据库表名）
		localKey,      // 主表的列名
		foreignKey = 'id',  // 副表的列名
		as,            // 结果字段名
		type = 'array', // 'array' | 'one' | 'many'
		limit = 100,
		fieldJson = {},
		whereJson = {},
	} = foreignConfig;

	const subAlias = 'sub';

	// 构建字段选择
	let fieldSelect;
	if (fieldJson && Object.keys(fieldJson).length > 0) {
		const includeFields = Object.entries(fieldJson)
			.filter(([_, include]) => include !== false)
			.map(([key]) => `'${key}', ${subAlias}."${key}"`);  // 直接使用传入的列名
		
		if (includeFields.length > 0) {
			fieldSelect = `json_build_object(${includeFields.join(', ')})`;
		} else {
			fieldSelect = `to_jsonb(${subAlias}.*)`;
		}
	} else {
		fieldSelect = `to_jsonb(${subAlias}.*)`;
	}

	// 构建副表 WHERE 条件
	let subWhere = '';
	if (whereJson && Object.keys(whereJson).length > 0) {
		const conditions = Object.entries(whereJson).map(([key, value]) => {
			// 直接使用传入的列名
			if (value === null) return `${subAlias}."${key}" IS NULL`;
			if (typeof value === 'boolean') return `${subAlias}."${key}" = ${value}`;
			if (typeof value === 'number') return `${subAlias}."${key}" = ${value}`;
			return `${subAlias}."${key}" = '${value}'`;
		});
		if (conditions.length > 0) {
			subWhere = ` AND ${conditions.join(' AND ')}`;
		}
	}

	// 检查是否有软删除字段
	const softDeleteCheck = ` AND ${subAlias}."deletedAt" IS NULL`;

	// 根据关系类型构建不同的子查询
	if (type === 'array') {
		// 主表字段是数组，副表 ID 在数组中
		// 例如: users.roles[] -> roles.id
		return `
			COALESCE(
				(SELECT json_agg(${fieldSelect})
				 FROM ${dbName} ${subAlias}
				 WHERE ${subAlias}."${foreignKey}" = ANY(main."${localKey}")${softDeleteCheck}${subWhere}
				 LIMIT ${limit}),
				'[]'::json
			) as "${as}"`;
	} else if (type === 'one') {
		// 一对一关系
		// 例如: action_logs.user_id -> users.id
		return `
			(SELECT ${fieldSelect}
			 FROM ${dbName} ${subAlias}
			 WHERE ${subAlias}."${foreignKey}" = main."${localKey}"${subWhere}
			 LIMIT 1) as "${as}"`;
	} else if (type === 'many') {
		// 一对多关系（主表 ID 在副表中）
		// 例如: users.id -> posts.user_id
		// localKey 是副表的外键字段，foreignKey 是主表的主键字段
		return `
			COALESCE(
				(SELECT json_agg(${fieldSelect})
				 FROM ${dbName} ${subAlias}
				 WHERE ${subAlias}."${localKey}" = main."${foreignKey}"${softDeleteCheck}${subWhere}
				 LIMIT ${limit}),
				'[]'::json
			) as "${as}"`;
	}

	return '';
}

/**
 * 万能连表查询
 * 
 * 注意：所有表名和列名都必须使用数据库中的实际名称，不做任何转换！
 * 
 * @param {Object} options - 查询配置
 * @param {string} options.dbName - 主表名（数据库表名，如 'users', 'action_logs'）
 * @param {number} [options.pageIndex=1] - 页码（从 1 开始）
 * @param {number} [options.pageSize=20] - 每页数量
 * @param {boolean} [options.getCount=true] - 是否返回总数
 * @param {Object} [options.whereJson={}] - 查询条件（key 必须是数据库列名）
 * @param {Object} [options.fieldJson={}] - 字段选择 { 列名: true/false }
 * @param {Array} [options.sortArr=[]] - 排序配置 [{ name: '列名', type: 'asc'|'desc' }]
 * @param {Array} [options.foreignDB=[]] - 副表配置
 * 
 * @returns {Promise<{ data: Array, total?: number, pageIndex: number, pageSize: number }>}
 * 
 * @example
 * // 查询用户列表，连表获取角色信息
 * const result = await selects({
 *   dbName: 'users',           // 数据库表名
 *   pageIndex: 1,
 *   pageSize: 20,
 *   whereJson: { banned: false },
 *   sortArr: [{ name: 'createdAt', type: 'desc' }],
 *   foreignDB: [
 *     {
 *       dbName: 'roles',       // 数据库表名
 *       localKey: 'roles',     // users 表的 roles 列（数组）
 *       foreignKey: 'id',      // roles 表的 id 列
 *       as: 'roleList',        // 结果字段名
 *       type: 'array',         // 数组关联
 *       fieldJson: { id: true, name: true, enable: true },
 *     }
 *   ]
 * });
 * 
 * @example
 * // 查询操作日志，连表获取用户信息
 * const result = await selects({
 *   dbName: 'action_logs',     // 数据库表名
 *   pageIndex: 1,
 *   pageSize: 10,
 *   foreignDB: [
 *     {
 *       dbName: 'users',       // 数据库表名
 *       localKey: 'user_id',   // action_logs 表的 user_id 列
 *       foreignKey: 'id',      // users 表的 id 列
 *       as: 'userInfo',        // 结果字段名
 *       type: 'one',           // 一对一关联
 *       fieldJson: { id: true, name: true, email: true },
 *     }
 *   ]
 * });
 */
export async function selects(options) {
	const {
		dbName,
		pageIndex = 1,
		pageSize = 20,
		getCount = true,
		whereJson = {},
		fieldJson = {},
		sortArr = [],
		foreignDB = [],
	} = options;

	// 直接使用传入的表名，不做转换
	const offset = (pageIndex - 1) * pageSize;

	// 构建 WHERE 子句
	const { clause: whereClause, params, nextIndex } = buildWhereClause(whereJson, 'main', 1);

	// 构建字段选择
	const fieldSelect = buildFieldSelect(fieldJson, 'main');

	// 构建副表子查询
	const foreignSelects = foreignDB.map(config => buildForeignSubquery(config)).filter(Boolean);
	const foreignSelectStr = foreignSelects.length > 0 ? `,${foreignSelects.join(',')}` : '';

	// 构建排序
	const orderClause = buildOrderClause(sortArr, 'main');

	// 主查询（直接使用 dbName 作为表名）
	const query = `
		SELECT ${fieldSelect}${foreignSelectStr}
		FROM ${dbName} main
		${whereClause}
		${orderClause}
		LIMIT $${nextIndex} OFFSET $${nextIndex + 1}
	`;

	// 执行查询
	const queryParams = [...params, pageSize, offset];
	const data = await prisma.$queryRawUnsafe(query, ...queryParams);

	// 处理字段排除
	let processedData = data;
	if (fieldJson && Object.keys(fieldJson).length > 0) {
		const excludeFields = Object.entries(fieldJson)
			.filter(([_, include]) => include === false)
			.map(([key]) => key);
		
		if (excludeFields.length > 0) {
			processedData = data.map(row => {
				const newRow = { ...row };
				excludeFields.forEach(field => delete newRow[field]);
				return newRow;
			});
		}
	}

	// 获取总数
	let total;
	if (getCount) {
		const countQuery = `SELECT COUNT(*) as count FROM ${dbName} main ${whereClause}`;
		const countResult = await prisma.$queryRawUnsafe(countQuery, ...params);
		total = Number(countResult[0]?.count || 0);
	}

	return {
		data: processedData,
		...(getCount && { total }),
		pageIndex,
		pageSize,
	};
}

/**
 * 查询单条记录（连表）
 * 
 * @param {Object} options - 查询配置（同 selects，但不需要分页参数）
 * @returns {Promise<Object|null>} 单条记录或 null
 * 
 * @example
 * const user = await selectOne({
 *   dbName: 'user',
 *   whereJson: { id: 'xxx' },
 *   foreignDB: [
 *     {
 *       dbName: 'role',
 *       localKey: 'roles',
 *       foreignKey: 'id',
 *       as: 'roleList',
 *       type: 'array',
 *     }
 *   ]
 * });
 */
export async function selectOne(options) {
	const result = await selects({
		...options,
		pageIndex: 1,
		pageSize: 1,
		getCount: false,
	});

	return result.data[0] || null;
}

export default selects;

