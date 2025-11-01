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
export async function getPage({ dbName, whereJson = {}, fieldJson = {}, sortJson = { _id: -1 }, pageIndex = 1, pageSize = 20 }) {
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
	sortJson = { _id: -1 },
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
};

// 默认导出
export default dbApi;

