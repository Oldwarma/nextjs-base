import { connectToDatabase, getCollection, toObjectId, fromObjectId, isValidObjectId } from './mongodb.js';

/**
 * 统一数据库 API 层
 * 参考 VK Framework 设计，适配 MongoDB + Next.js
 * 提供高可复用的数据库操作方法
 */

/**
 * 单条记录增加
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 集合名称
 * @param {Object} options.dataJson - 需要新增的数据
 * @param {boolean} options.cancelAddTime - 取消自动生成时间戳
 * @param {Object} options.db - 可选的数据库实例
 * @returns {Promise<string>} 返回新增记录的 _id
 */
export async function add({ dbName, dataJson, cancelAddTime = false, db = null }) {
	if (!dbName) throw new Error('dbName is required');
	if (!dataJson || typeof dataJson !== 'object') throw new Error('dataJson must be an object');

	try {
		const collection = await getCollection(dbName);

		// 自动添加时间戳
		if (!cancelAddTime) {
			const now = new Date();
			dataJson.createdAt = now;
			dataJson.updatedAt = now;
		}

		const result = await collection.insertOne(dataJson);
		return result.insertedId.toString();
	} catch (error) {
		console.error('add error:', error);
		throw error;
	}
}

/**
 * 批量增加
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 集合名称
 * @param {Array} options.dataJson - 需要新增的数据数组
 * @param {boolean} options.cancelAddTime - 取消自动生成时间戳
 * @returns {Promise<Array>} 返回新增记录的 _id 数组
 */
export async function adds({ dbName, dataJson, cancelAddTime = false }) {
	if (!dbName) throw new Error('dbName is required');
	if (!Array.isArray(dataJson)) throw new Error('dataJson must be an array');
	if (dataJson.length === 0) return [];

	try {
		const collection = await getCollection(dbName);

		// 自动添加时间戳
		if (!cancelAddTime) {
			const now = new Date();
			dataJson = dataJson.map((item) => ({
				...item,
				createdAt: now,
				updatedAt: now,
			}));
		}

		const result = await collection.insertMany(dataJson);
		return Object.values(result.insertedIds).map((id) => id.toString());
	} catch (error) {
		console.error('adds error:', error);
		throw error;
	}
}

/**
 * 根据 _id 删除单条记录（真删除）
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 集合名称
 * @param {string} options._id - 记录 _id
 * @returns {Promise<number>} 返回删除的记录数
 */
export async function del({ dbName, _id }) {
	if (!dbName) throw new Error('dbName is required');
	if (!_id) throw new Error('_id is required');

	try {
		const collection = await getCollection(dbName);
		const result = await collection.deleteOne({ _id });
		return result.deletedCount;
	} catch (error) {
		console.error('del error:', error);
		throw error;
	}
}

/**
 * 根据条件删除单条记录
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 集合名称
 * @param {Object} options.whereJson - 删除条件
 * @returns {Promise<number>} 返回删除的记录数
 */
export async function remove({ dbName, whereJson }) {
	if (!dbName) throw new Error('dbName is required');
	if (!whereJson || typeof whereJson !== 'object') throw new Error('whereJson must be an object');

	try {
		const collection = await getCollection(dbName);
		const result = await collection.deleteOne(whereJson);
		return result.deletedCount;
	} catch (error) {
		console.error('remove error:', error);
		throw error;
	}
}

/**
 * 根据条件批量删除
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 集合名称
 * @param {Object} options.whereJson - 删除条件
 * @returns {Promise<number>} 返回删除的记录数
 */
export async function delMany({ dbName, whereJson }) {
	if (!dbName) throw new Error('dbName is required');
	if (!whereJson || typeof whereJson !== 'object') throw new Error('whereJson must be an object');

	try {
		const collection = await getCollection(dbName);
		const result = await collection.deleteMany(whereJson);
		return result.deletedCount;
	} catch (error) {
		console.error('delMany error:', error);
		throw error;
	}
}

/**
 * 根据 _id 修改记录
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 集合名称
 * @param {string} options._id - 记录 _id
 * @param {Object} options.dataJson - 需要修改的数据
 * @param {boolean} options.cancelUpdateTime - 取消自动更新时间戳
 * @returns {Promise<number>} 返回修改的记录数
 */
export async function update({ dbName, _id, dataJson, cancelUpdateTime = false }) {
	if (!dbName) throw new Error('dbName is required');
	if (!_id) throw new Error('_id is required');
	if (!dataJson || typeof dataJson !== 'object') throw new Error('dataJson must be an object');

	try {
		const collection = await getCollection(dbName);

		// 自动更新时间戳
		if (!cancelUpdateTime) {
			dataJson.updatedAt = new Date();
		}

		const result = await collection.updateOne({ _id }, { $set: dataJson });
		return result.modifiedCount;
	} catch (error) {
		console.error('update error:', error);
		throw error;
	}
}

/**
 * 根据条件修改单条记录
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 集合名称
 * @param {Object} options.whereJson - 条件
 * @param {Object} options.dataJson - 需要修改的数据
 * @param {boolean} options.cancelUpdateTime - 取消自动更新时间戳
 * @returns {Promise<number>} 返回修改的记录数
 */
export async function updateOne({ dbName, whereJson, dataJson, cancelUpdateTime = false }) {
	if (!dbName) throw new Error('dbName is required');
	if (!whereJson || typeof whereJson !== 'object') throw new Error('whereJson must be an object');
	if (!dataJson || typeof dataJson !== 'object') throw new Error('dataJson must be an object');

	try {
		const collection = await getCollection(dbName);

		// 自动更新时间戳
		if (!cancelUpdateTime) {
			dataJson.updatedAt = new Date();
		}

		const result = await collection.updateOne(whereJson, { $set: dataJson });
		return result.modifiedCount;
	} catch (error) {
		console.error('updateOne error:', error);
		throw error;
	}
}

/**
 * 根据条件批量修改
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 集合名称
 * @param {Object} options.whereJson - 条件
 * @param {Object} options.dataJson - 需要修改的数据
 * @param {boolean} options.cancelUpdateTime - 取消自动更新时间戳
 * @returns {Promise<number>} 返回修改的记录数
 */
export async function updateMany({ dbName, whereJson, dataJson, cancelUpdateTime = false }) {
	if (!dbName) throw new Error('dbName is required');
	if (!whereJson || typeof whereJson !== 'object') throw new Error('whereJson must be an object');
	if (!dataJson || typeof dataJson !== 'object') throw new Error('dataJson must be an object');

	try {
		const collection = await getCollection(dbName);

		// 自动更新时间戳
		if (!cancelUpdateTime) {
			dataJson.updatedAt = new Date();
		}

		const result = await collection.updateMany(whereJson, { $set: dataJson });
		return result.modifiedCount;
	} catch (error) {
		console.error('updateMany error:', error);
		throw error;
	}
}

/**
 * 根据 _id 查询单条记录
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 集合名称
 * @param {string} options._id - 记录 _id
 * @param {Object} options.fieldJson - 字段显示规则
 * @returns {Promise<Object|null>} 返回查询结果
 */
export async function findById({ dbName, _id, fieldJson = {} }) {
	if (!dbName) throw new Error('dbName is required');
	if (!_id) throw new Error('_id is required');

	try {
		const collection = await getCollection(dbName);
		const result = await collection.findOne({ _id });
		return result ? fromObjectId(result) : null;
	} catch (error) {
		console.error('findById error:', error);
		throw error;
	}
}

/**
 * 根据条件查询单条记录
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 集合名称
 * @param {Object} options.whereJson - 查询条件
 * @param {Object} options.fieldJson - 字段显示规则
 * @param {Object} options.sortJson - 排序规则
 * @returns {Promise<Object|null>} 返回查询结果
 */
export async function getOne({ dbName, whereJson = {}, fieldJson = {}, sortJson = {} }) {
	if (!dbName) throw new Error('dbName is required');

	try {
		const collection = await getCollection(dbName);
		const result = await collection.findOne(whereJson);
		return result ? fromObjectId(result) : null;
	} catch (error) {
		console.error('getOne error:', error);
		throw error;
	}
}

/**
 * 根据条件查询多条记录（不分页）
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 集合名称
 * @param {Object} options.whereJson - 查询条件
 * @param {Object} options.fieldJson - 字段显示规则
 * @param {Object} options.sortJson - 排序规则
 * @param {number} options.limit - 限制条数
 * @returns {Promise<Array>} 返回查询结果数组
 */
export async function getList({ dbName, whereJson = {}, fieldJson = {}, sortJson = {}, limit = 0 }) {
	if (!dbName) throw new Error('dbName is required');

	try {
		const collection = await getCollection(dbName);

		let query = collection.find(whereJson);

		if (Object.keys(sortJson).length > 0) {
			query = query.sort(sortJson);
		}

		if (limit > 0) {
			query = query.limit(limit);
		}

		const results = await query.toArray();
		return results.map((item) => fromObjectId(item));
	} catch (error) {
		console.error('getList error:', error);
		throw error;
	}
}

/**
 * 分页查询
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 集合名称
 * @param {Object} options.whereJson - 查询条件
 * @param {Object} options.fieldJson - 字段显示规则
 * @param {Object} options.sortJson - 排序规则
 * @param {number} options.pageIndex - 当前页码（从1开始）
 * @param {number} options.pageSize - 每页条数
 * @returns {Promise<Object>} 返回分页结果
 */
export async function getPage({ dbName, whereJson = {}, fieldJson = {}, sortJson = { createdAt: -1 }, pageIndex = 1, pageSize = 20 }) {
	if (!dbName) throw new Error('dbName is required');

	try {
		const collection = await getCollection(dbName);
		return await collection.findWithPagination({
			query: whereJson,
			pageIndex,
			pageSize,
			sort: sortJson,
		});
	} catch (error) {
		console.error('getPage error:', error);
		throw error;
	}
}

/**
 * 连表分页查询
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 集合名称
 * @param {Object} options.whereJson - 查询条件
 * @param {Array} options.foreignDB - 连表规则数组
 * @param {Object} options.sortJson - 排序规则
 * @param {number} options.pageIndex - 当前页码
 * @param {number} options.pageSize - 每页条数
 * @returns {Promise<Object>} 返回分页结果
 */
export async function getPageWithLookup({
	dbName,
	whereJson = {},
	foreignDB = [],
	sortJson = { createdAt: -1 },
	pageIndex = 1,
	pageSize = 20,
}) {
	if (!dbName) throw new Error('dbName is required');

	try {
		const collection = await getCollection(dbName);
		return await collection.findWithLookup({
			query: whereJson,
			lookups: foreignDB,
			pageIndex,
			pageSize,
			sort: sortJson,
		});
	} catch (error) {
		console.error('getPageWithLookup error:', error);
		throw error;
	}
}

/**
 * 统计数量
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 集合名称
 * @param {Object} options.whereJson - 查询条件
 * @returns {Promise<number>} 返回记录总数
 */
export async function count({ dbName, whereJson = {} }) {
	if (!dbName) throw new Error('dbName is required');

	try {
		const collection = await getCollection(dbName);
		return await collection.count(whereJson);
	} catch (error) {
		console.error('count error:', error);
		throw error;
	}
}

/**
 * 求和
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 集合名称
 * @param {string} options.fieldName - 需要求和的字段名
 * @param {Object} options.whereJson - 查询条件
 * @returns {Promise<number>} 返回求和结果
 */
export async function sum({ dbName, fieldName, whereJson = {} }) {
	if (!dbName) throw new Error('dbName is required');
	if (!fieldName) throw new Error('fieldName is required');

	try {
		const db = await connectToDatabase();
		const collection = db.collection(dbName);

		const result = await collection
			.aggregate([
				{ $match: whereJson },
				{
					$group: {
						_id: null,
						total: { $sum: `$${fieldName}` },
					},
				},
			])
			.toArray();

		return result.length > 0 ? result[0].total : 0;
	} catch (error) {
		console.error('sum error:', error);
		throw error;
	}
}

/**
 * 取最大值
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 集合名称
 * @param {string} options.fieldName - 需要取最大值的字段名
 * @param {Object} options.whereJson - 查询条件
 * @returns {Promise<number>} 返回最大值
 */
export async function max({ dbName, fieldName, whereJson = {} }) {
	if (!dbName) throw new Error('dbName is required');
	if (!fieldName) throw new Error('fieldName is required');

	try {
		const db = await connectToDatabase();
		const collection = db.collection(dbName);

		const result = await collection
			.aggregate([
				{ $match: whereJson },
				{
					$group: {
						_id: null,
						maxValue: { $max: `$${fieldName}` },
					},
				},
			])
			.toArray();

		return result.length > 0 ? result[0].maxValue : null;
	} catch (error) {
		console.error('max error:', error);
		throw error;
	}
}

/**
 * 取最小值
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 集合名称
 * @param {string} options.fieldName - 需要取最小值的字段名
 * @param {Object} options.whereJson - 查询条件
 * @returns {Promise<number>} 返回最小值
 */
export async function min({ dbName, fieldName, whereJson = {} }) {
	if (!dbName) throw new Error('dbName is required');
	if (!fieldName) throw new Error('fieldName is required');

	try {
		const db = await connectToDatabase();
		const collection = db.collection(dbName);

		const result = await collection
			.aggregate([
				{ $match: whereJson },
				{
					$group: {
						_id: null,
						minValue: { $min: `$${fieldName}` },
					},
				},
			])
			.toArray();

		return result.length > 0 ? result[0].minValue : null;
	} catch (error) {
		console.error('min error:', error);
		throw error;
	}
}

/**
 * 取平均值
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 集合名称
 * @param {string} options.fieldName - 需要取平均值的字段名
 * @param {Object} options.whereJson - 查询条件
 * @returns {Promise<number>} 返回平均值
 */
export async function avg({ dbName, fieldName, whereJson = {} }) {
	if (!dbName) throw new Error('dbName is required');
	if (!fieldName) throw new Error('fieldName is required');

	try {
		const db = await connectToDatabase();
		const collection = db.collection(dbName);

		const result = await collection
			.aggregate([
				{ $match: whereJson },
				{
					$group: {
						_id: null,
						avgValue: { $avg: `$${fieldName}` },
					},
				},
			])
			.toArray();

		return result.length > 0 ? result[0].avgValue : 0;
	} catch (error) {
		console.error('avg error:', error);
		throw error;
	}
}

/**
 * 随机取N条数据
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 集合名称
 * @param {number} options.size - 随机条数
 * @param {Object} options.whereJson - 查询条件
 * @returns {Promise<Array>} 返回随机结果数组
 */
export async function sample({ dbName, size = 1, whereJson = {} }) {
	if (!dbName) throw new Error('dbName is required');

	try {
		const db = await connectToDatabase();
		const collection = db.collection(dbName);

		const pipeline = [];

		// 添加查询条件
		if (Object.keys(whereJson).length > 0) {
			pipeline.push({ $match: whereJson });
		}

		// 随机取样
		pipeline.push({ $sample: { size } });

		const results = await collection.aggregate(pipeline).toArray();
		return results.map((item) => fromObjectId(item));
	} catch (error) {
		console.error('sample error:', error);
		throw error;
	}
}

/**
 * 分组聚合查询
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 集合名称
 * @param {Object} options.whereJson - 查询条件
 * @param {Object} options.groupJson - 分组规则
 * @param {Array} options.foreignDB - 连表规则
 * @returns {Promise<Array>} 返回聚合结果
 */
export async function aggregate({ dbName, whereJson = {}, groupJson = {}, foreignDB = [] }) {
	if (!dbName) throw new Error('dbName is required');

	try {
		const db = await connectToDatabase();
		const collection = db.collection(dbName);

		const pipeline = [];

		// 添加查询条件
		if (Object.keys(whereJson).length > 0) {
			pipeline.push({ $match: whereJson });
		}

		// 添加连表操作
		if (foreignDB && foreignDB.length > 0) {
			foreignDB.forEach((lookup) => {
				pipeline.push({
					$lookup: {
						from: lookup.from,
						localField: lookup.localField,
						foreignField: lookup.foreignField,
						as: lookup.as,
					},
				});

				// 如果只需要第一个匹配项
				if (lookup.single) {
					pipeline.push({
						$addFields: {
							[lookup.as]: { $arrayElemAt: [`$${lookup.as}`, 0] },
						},
					});
				}
			});
		}

		// 添加分组规则
		if (Object.keys(groupJson).length > 0) {
			pipeline.push({ $group: groupJson });
		}

		const results = await collection.aggregate(pipeline).toArray();
		return results.map((item) => fromObjectId(item));
	} catch (error) {
		console.error('aggregate error:', error);
		throw error;
	}
}

/**
 * 检查记录是否存在
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 集合名称
 * @param {Object} options.whereJson - 查询条件
 * @returns {Promise<boolean>} 返回是否存在
 */
export async function exists({ dbName, whereJson }) {
	if (!dbName) throw new Error('dbName is required');
	if (!whereJson || typeof whereJson !== 'object') throw new Error('whereJson must be an object');

	try {
		const num = await count({ dbName, whereJson });
		return num > 0;
	} catch (error) {
		console.error('exists error:', error);
		throw error;
	}
}

/**
 * 万能连表查询方法（参考 VK-UniCloud selects）
 * 支持一对一、一对多的连表查询，可以级联多个副表
 * 
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 主表集合名称
 * @param {boolean} options.getOne - 是否只返回第一条数据（返回对象而非数组），默认false
 * @param {boolean} options.getMain - 是否只返回 rows 数组（兼容旧代码），默认false
 * @param {Object} options.whereJson - 主表查询条件
 * @param {Object} options.fieldJson - 主表字段过滤 { field1: 1, field2: 1 } 或 { field1: 0 }
 * @param {Object} options.sortJson - 排序规则 { field1: 1, field2: -1 } 或 [{ name: 'field1', type: 'asc' }]
 * @param {number} options.pageIndex - 页码（从1开始），默认1
 * @param {number} options.pageSize - 每页数量，默认20
 * @param {boolean} options.getCount - 是否查询总数，默认true
 * @param {Array} options.foreignDB - 副表配置数组
 * @param {string} options.foreignDB[].dbName - 副表集合名称
 * @param {string} options.foreignDB[].localKey - 主表关联字段（支持嵌套，如 'user.id'）
 * @param {string} options.foreignDB[].foreignKey - 副表关联字段（支持嵌套）
 * @param {string} options.foreignDB[].as - 副表数据存放字段名
 * @param {number} options.foreignDB[].limit - 副表返回记录数限制（1表示一对一）
 * @param {Object} options.foreignDB[].whereJson - 副表额外查询条件
 * @param {Object} options.foreignDB[].fieldJson - 副表字段过滤
 * @param {Object} options.foreignDB[].sortJson - 副表排序规则
 * 
 * @returns {Promise<Object|Array|null>} 
 *   - 默认: { rows, total, hasMore, pageIndex, pageSize, totalPages }
 *   - getOne=true: 返回单个对象或 null
 *   - getMain=true: 返回 rows 数组
 * 
 * @example
 * // 1. 查询列表（默认）
 * const result = await selects({
 *   dbName: 'roles',
 *   whereJson: { enable: true },
 *   pageIndex: 1,
 *   pageSize: 10,
 *   foreignDB: [
 *     {
 *       dbName: 'permissions',
 *       localKey: 'permission',      // roles.permission 是 UUID 数组
 *       foreignKey: 'id',             // permissions.id 是 UUID
 *       as: 'permissionList',         // 结果存放在 permissionList 字段
 *       fieldJson: { id: 1, name: 1 } // 只返回 id 和 name
 *     }
 *   ]
 * });
 * // 返回: { rows: [...], total: 100, pageIndex: 1, pageSize: 10, ... }
 * 
 * @example
 * // 2. 查询单条数据
 * const user = await selects({
 *   dbName: 'users',
 *   whereJson: { id: 'user-123' },
 *   getOne: true,
 *   foreignDB: [{ dbName: 'roles', localKey: 'roles', foreignKey: 'id', as: 'roleList' }]
 * });
 * // 返回: { id: 'user-123', name: 'John', roleList: [...] } 或 null
 * 
 * @example
 * // 3. 只获取数据数组
 * const userList = await selects({
 *   dbName: 'users',
 *   whereJson: { role: 'admin' },
 *   getMain: true
 * });
 * // 返回: [{ id: '1', name: 'Admin' }, { id: '2', name: 'Admin2' }]
 */
export async function selects({
	dbName,
	getOne = false, // true只返回第一条数据
	getMain = false, // true只返回rows
	whereJson = {},
	fieldJson = {},
	sortJson = {},
	pageIndex = 1,
	pageSize = 20,
	getCount = true,
	foreignDB = [],
}) {
	if (!dbName) throw new Error('dbName is required');

	try {
		const collection = await getCollection(dbName);
		const pipeline = [];

		// 1. Match stage - 主表查询条件
		if (Object.keys(whereJson).length > 0) {
			pipeline.push({ $match: whereJson });
		}

		// 2. Lookup stages - 连表查询
		if (Array.isArray(foreignDB) && foreignDB.length > 0) {
			for (const foreign of foreignDB) {
				const {
					dbName: foreignDbName,
					localKey,
					foreignKey,
					as,
					limit,
					whereJson: foreignWhereJson = {},
					fieldJson: foreignFieldJson = {},
					sortJson: foreignSortJson = {},
				} = foreign;

				if (!foreignDbName || !localKey || !foreignKey || !as) {
					console.warn('foreignDB item missing required fields:', foreign);
					continue;
				}

				// 构建 lookup pipeline
				const lookupPipeline = [];

				// 副表查询条件
				if (Object.keys(foreignWhereJson).length > 0) {
					lookupPipeline.push({ $match: foreignWhereJson });
				}

				// 副表字段过滤
				if (Object.keys(foreignFieldJson).length > 0) {
					lookupPipeline.push({ $project: foreignFieldJson });
				}

				// 副表排序
				if (Object.keys(foreignSortJson).length > 0) {
					lookupPipeline.push({ $sort: foreignSortJson });
				}

				// 副表数量限制
				if (limit && limit > 0) {
					lookupPipeline.push({ $limit: limit });
				}

				// 执行 lookup - 支持数组字段的连表
				pipeline.push({
					$lookup: {
						from: foreignDbName,
						let: { local_field: `$${localKey}` },
						pipeline: [
							{
								$match: {
									$expr: {
										// 如果 localKey 是数组，使用 $in；否则使用 $eq
										$cond: {
											if: { $isArray: '$$local_field' },
											then: { $in: [`$${foreignKey}`, '$$local_field'] },
											else: { $eq: [`$${foreignKey}`, '$$local_field'] },
										},
									},
								},
							},
							...lookupPipeline,
						],
						as,
					},
				});

				// 如果 limit === 1，则将数组转为单个对象
				if (limit === 1) {
					pipeline.push({
						$addFields: {
							[as]: {
								$arrayElemAt: [`$${as}`, 0],
							},
						},
					});
				}
			}
		}

		// 3. Project stage - 主表字段过滤
		if (Object.keys(fieldJson).length > 0) {
			pipeline.push({ $project: fieldJson });
		}

		// 4. Sort stage - 主表排序
		if (Object.keys(sortJson).length > 0) {
			pipeline.push({ $sort: sortJson });
		}

		// 5. Count stage - 统计总数（在分页之前）
		let total = 0;
		if (getCount) {
			const countPipeline = [...pipeline, { $count: 'total' }];
			const countResult = await collection.aggregate(countPipeline).toArray();
			total = countResult[0]?.total || 0;
		}

		// 6. Pagination stages - 分页
		// 如果 getOne=true，只返回第一条数据
		if (getOne) {
			pipeline.push({ $limit: 1 });
		} else {
		const skip = (pageIndex - 1) * pageSize;
		pipeline.push({ $skip: skip });
		pipeline.push({ $limit: pageSize });
		}

		// 7. 执行聚合查询
		const rows = await collection.aggregate(pipeline).toArray();

		// 8. 序列化 ObjectId
		const serializedRows = rows.map((row) => fromObjectId(row));

		// 9. 根据参数返回不同格式
		// getOne=true: 只返回第一条数据对象（不是数组）
		if (getOne) {
			return serializedRows[0] || null;
		}

		// getMain=true: 只返回 rows 数组（兼容旧代码）
		if (getMain) {
			return serializedRows;
		}

		// 默认：返回完整分页信息
		const skip = getOne ? 0 : (pageIndex - 1) * pageSize;
		return {
			rows: serializedRows,
			total,
			hasMore: getCount ? skip + rows.length < total : rows.length === pageSize,
			pageIndex,
			pageSize,
			totalPages: getCount ? Math.ceil(total / pageSize) : undefined,
		};
	} catch (error) {
		console.error('selects error:', error);
		throw error;
	}
}

/**
 * 自增字段值
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 集合名称
 * @param {Object} options.whereJson - 查询条件
 * @param {string} options.fieldName - 字段名
 * @param {number} options.num - 自增数量（可为负数表示自减）
 * @returns {Promise<number>} 返回修改的记录数
 */
export async function inc({ dbName, whereJson, fieldName, num = 1 }) {
	if (!dbName) throw new Error('dbName is required');
	if (!whereJson || typeof whereJson !== 'object') throw new Error('whereJson must be an object');
	if (!fieldName) throw new Error('fieldName is required');

	try {
		const collection = await getCollection(dbName);
		const result = await collection.updateMany(whereJson, {
			$inc: { [fieldName]: num },
			$set: { updatedAt: new Date() },
		});
		return result.modifiedCount;
	} catch (error) {
		console.error('inc error:', error);
		throw error;
	}
}

/**
 * 数组字段添加元素
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 集合名称
 * @param {Object} options.whereJson - 查询条件
 * @param {string} options.fieldName - 字段名
 * @param {*} options.value - 要添加的值
 * @returns {Promise<number>} 返回修改的记录数
 */
export async function push({ dbName, whereJson, fieldName, value }) {
	if (!dbName) throw new Error('dbName is required');
	if (!whereJson || typeof whereJson !== 'object') throw new Error('whereJson must be an object');
	if (!fieldName) throw new Error('fieldName is required');

	try {
		const collection = await getCollection(dbName);
		const result = await collection.updateMany(whereJson, {
			$push: { [fieldName]: value },
			$set: { updatedAt: new Date() },
		});
		return result.modifiedCount;
	} catch (error) {
		console.error('push error:', error);
		throw error;
	}
}

/**
 * 数组字段删除元素
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 集合名称
 * @param {Object} options.whereJson - 查询条件
 * @param {string} options.fieldName - 字段名
 * @param {*} options.value - 要删除的值
 * @returns {Promise<number>} 返回修改的记录数
 */
export async function pull({ dbName, whereJson, fieldName, value }) {
	if (!dbName) throw new Error('dbName is required');
	if (!whereJson || typeof whereJson !== 'object') throw new Error('whereJson must be an object');
	if (!fieldName) throw new Error('fieldName is required');

	try {
		const collection = await getCollection(dbName);
		const result = await collection.updateMany(whereJson, {
			$pull: { [fieldName]: value },
			$set: { updatedAt: new Date() },
		});
		return result.modifiedCount;
	} catch (error) {
		console.error('pull error:', error);
		throw error;
	}
}

/**
 * 获取去重后的字段值列表
 * @param {Object} options - 配置对象
 * @param {string} options.dbName - 集合名称
 * @param {string} options.fieldName - 字段名
 * @param {Object} options.whereJson - 查询条件
 * @returns {Promise<Array>} 返回去重后的字段值数组
 */
export async function distinct({ dbName, fieldName, whereJson = {} }) {
	if (!dbName) throw new Error('dbName is required');
	if (!fieldName) throw new Error('fieldName is required');

	try {
		const db = await connectToDatabase();
		const collection = db.collection(dbName);
		return await collection.distinct(fieldName, whereJson);
	} catch (error) {
		console.error('distinct error:', error);
		throw error;
	}
}

// 导出所有方法的命名空间对象
export const dbApi = {
	// 增
	add,
	adds,

	// 删
	del,
	remove,
	delMany,

	// 改
	update,
	updateOne,
	updateMany,
	inc,
	push,
	pull,

	// 查
	findById,
	getOne,
	getList,
	getPage,
	getPageWithLookup,

	// 聚合统计
	count,
	sum,
	max,
	min,
	avg,
	sample,
	aggregate,
	distinct,

	// 工具方法
	exists,
	
	// 连表查询
	selects,
};

// 默认导出
export default dbApi;

