import { MongoClient, ObjectId } from 'mongodb';

if (!process.env.MONGODB_URI) {
	throw new Error('请在环境变量中设置 MONGODB_URI');
}
if (!process.env.MONGODB_DB_NAME) {
	throw new Error('请在环境变量中设置 MONGODB_DB_NAME');
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;

// MongoDB 连接选项优化 - 特别针对远程连接优化
const options = {
	// 连接池配置
	maxPoolSize: process.env.NODE_ENV === 'development' ? 5 : 10, // 开发环境较少连接数
	minPoolSize: process.env.NODE_ENV === 'development' ? 1 : 2,

	// 超时配置（毫秒）
	connectTimeoutMS: 20000, // 连接超时 20秒
	socketTimeoutMS: 45000, // 套接字超时 45秒
	serverSelectionTimeoutMS: 10000, // 服务器选择超时 10秒

	// 心跳和监控
	heartbeatFrequencyMS: 5000, // 心跳频率 5秒

	// 重连配置
	retryWrites: true,
	retryReads: true,

	// 压缩配置（减少网络传输）
	compressors: ['zlib'],

	// 读写偏好设置
	readPreference: 'primaryPreferred', // 优先读主节点，提高一致性

	// 其他优化
	maxIdleTimeMS: 60000, // 连接空闲时间 1分钟
	waitQueueTimeoutMS: 10000, // 等待连接队列超时 10秒

	// // 开发环境额外配置
	// ...(process.env.NODE_ENV === 'development' && {
	// 	// 更短的空闲时间，避免连接被服务器断开
	// 	maxIdleTimeMS: 30000,
	// 	// 开发环境的更严格超时设置
	// 	serverSelectionTimeoutMS: 8000,
	// }),
};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
	if (!global._mongoClientPromise) {
		client = new MongoClient(uri, options);
		global._mongoClientPromise = client.connect();
	}
	clientPromise = global._mongoClientPromise;
} else {
	client = new MongoClient(uri, options);
	clientPromise = client.connect();
}

// 导出获取数据库实例的函数
export async function connectToDatabase() {
	const client = await clientPromise;
	return client.db(dbName);
}

// 连接状态监控和调试函数
export async function checkConnectionHealth() {
	try {
		const start = Date.now();
		const client = await clientPromise;
		const db = client.db(dbName);

		// 执行一个简单的 ping 命令
		await db.admin().ping();
		const duration = Date.now() - start;

		console.log(`MongoDB 连接健康检查：${duration}ms`);
		return {
			healthy: true,
			duration,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error('MongoDB 连接健康检查失败:', error);
		return {
			healthy: false,
			error: error.message,
			timestamp: new Date().toISOString(),
		};
	}
}

// 获取连接状态信息
export async function getConnectionStats() {
	try {
		const client = await clientPromise;
		const db = client.db(dbName);

		// 获取服务器状态
		const serverStatus = await db.admin().serverStatus();
		const connectionInfo = {
			isConnected: client.topology && client.topology.isConnected(),
			host: serverStatus.host,
			version: serverStatus.version,
			uptime: serverStatus.uptime,
			connections: serverStatus.connections,
			network: serverStatus.network,
		};

		return connectionInfo;
	} catch (error) {
		console.error('获取连接状态失败:', error);
		return { error: error.message };
	}
}

// 导出客户端 Promise，以保持向后兼容
export default clientPromise;

/**
 * 封装常用的数据库操作
 * @param {string} collectionName - 集合名称
 */
export async function getCollection(collectionName) {
	const db = await connectToDatabase();
	const collection = db.collection(collectionName);

	return {
		// 查询操作
		findOne: async (query = {}) => {
			query = processObjectIds(query);
			return collection.findOne(query);
		},

		find: async (query = {}, options = {}) => {
			query = processObjectIds(query);
			return collection.find(query, options).toArray();
		},

		// 分页查询
		findWithPagination: async ({ query = {}, pageIndex = 1, pageSize = 10, sort = { _id: -1 } }) => {
			query = processObjectIds(query);
			const skip = (pageIndex - 1) * pageSize;
			const total = await collection.countDocuments(query);
			const rows = await collection.find(query).sort(sort).skip(skip).limit(pageSize).toArray();

			// 转换ObjectId为字符串
			const processedRows = rows.map((row) => fromObjectId(row));

			return {
				code: 0,
				msg: 'ok',
				rows: processedRows || [],
				total: total || 0,
				pageIndex,
				pageSize,
				totalPages: Math.ceil(total / pageSize) || 1,
				hasNext: pageIndex < Math.ceil(total / pageSize) || false,
				hasPrev: pageIndex > 1 || false,
			};
		},

		// 连表分页查询
		async findWithLookup({ query = {}, pageIndex = 1, pageSize = 10, sort = { _id: -1 }, lookups = [] }) {
			query = processObjectIds(query);

			// 构建基础查询管道（用于计算总数）
			const basePipeline = [];
			if (Object.keys(query).length > 0) {
				basePipeline.push({ $match: query });
			}

			// 计算总数（不包含连表操作）
			const countResult = await collection.aggregate([...basePipeline, { $count: 'total' }]).toArray();
			const total = countResult.length > 0 ? countResult[0].total : 0;

			// 如果没有数据，直接返回空结果
			if (total === 0) {
				return {
					code: 0,
					msg: 'ok',
					rows: [],
					total: 0,
					pageIndex,
					pageSize,
					totalPages: 0,
					hasNext: false,
					hasPrev: false,
				};
			}

			// 构建完整的聚合管道
			const pipeline = [...basePipeline];

			// 批量添加连表查询
			for (const lookup of lookups) {
				const lookupStages = buildLookupStage(lookup);
				pipeline.push(...lookupStages);
			}

			// 添加排序和分页
			pipeline.push({ $sort: sort });
			pipeline.push({ $skip: (pageIndex - 1) * pageSize });
			pipeline.push({ $limit: pageSize });

			// 执行查询并转换ObjectId为字符串
			const items = await collection.aggregate(pipeline).toArray();
			const processedItems = items.map((item) => fromObjectId(item));

			return {
				code: 0,
				msg: 'ok',
				rows: processedItems,
				total,
				pageIndex,
				pageSize,
				totalPages: Math.ceil(total / pageSize),
				hasNext: pageIndex < Math.ceil(total / pageSize),
				hasPrev: pageIndex > 1,
			};
		},

		// 创建操作
		insertOne: async (doc) => {
			doc = processObjectIds(doc);
			return collection.insertOne(doc);
		},

		insertMany: async (docs) => {
			docs = processObjectIds(docs);
			return collection.insertMany(docs);
		},

		// 更新操作
		updateOne: async (query, update) => {
			query = processObjectIds(query);
			return collection.updateOne(query, update);
		},

		updateMany: async (query, update) => {
			query = processObjectIds(query);
			return collection.updateMany(query, update);
		},

		// 删除操作
		deleteOne: async (query) => {
			query = processObjectIds(query);
			return collection.deleteOne(query);
		},

		deleteMany: async (query) => {
			query = processObjectIds(query);
			return collection.deleteMany(query);
		},

		// 统计数量
		count: async (query = {}) => {
			query = processObjectIds(query);
			return collection.countDocuments(query);
		},
	};
}

// 辅助函数：处理MongoDB ID
function processObjectIds(obj) {
	if (!obj) return obj;

	const result = { ...obj };

	for (const key in result) {
		// 检查是否是ID字段 - 改进识别逻辑
		if (key === '_id') {
			const value = result[key];

			// 处理直接的字符串ID
			if (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
				try {
					result[key] = new ObjectId(value);
				} catch (e) {
					console.warn(`Cannot convert ${key} to ObjectId:`, e);
				}
			}
			// 处理MongoDB查询操作符中的ID
			else if (typeof value === 'object' && value !== null) {
				// 处理 $in, $nin 操作符中的ID数组
				if (value.$in && Array.isArray(value.$in)) {
					result[key].$in = value.$in.map((id) => {
						if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
							try {
								return new ObjectId(id);
							} catch (e) {
								console.warn(`Cannot convert ID in $in array to ObjectId:`, e);
								return id;
							}
						}
						return id;
					});
				}

				if (value.$nin && Array.isArray(value.$nin)) {
					result[key].$nin = value.$nin.map((id) => {
						if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
							try {
								return new ObjectId(id);
							} catch (e) {
								console.warn(`Cannot convert ID in $nin array to ObjectId:`, e);
								return id;
							}
						}
						return id;
					});
				}

				// 处理 $ne, $eq 操作符中的单个ID
				if (value.$ne && typeof value.$ne === 'string' && /^[0-9a-fA-F]{24}$/.test(value.$ne)) {
					try {
						result[key].$ne = new ObjectId(value.$ne);
					} catch (e) {
						console.warn(`Cannot convert ID in $ne to ObjectId:`, e);
					}
				}

				if (value.$eq && typeof value.$eq === 'string' && /^[0-9a-fA-F]{24}$/.test(value.$eq)) {
					try {
						result[key].$eq = new ObjectId(value.$eq);
					} catch (e) {
						console.warn(`Cannot convert ID in $eq to ObjectId:`, e);
					}
				}
			}
		} else if (typeof result[key] === 'object' && result[key] !== null) {
			// 递归处理嵌套对象
			// result[key] = processObjectIds(result[key]);
		}
	}

	return result;
}

/**
 * 构建lookup聚合阶段
 * @param {Object} lookup - lookup配置对象
 * @returns {Array} 返回聚合管道阶段数组
 */
function buildLookupStage(lookup) {
	const stages = [];
	const isArrayField = lookup.localField.endsWith('Ids') || lookup.localField.endsWith('ids');
	const hasObjectIdField = lookup.foreignField === '_id' || lookup.localField === '_id';

	// 构建lookup阶段
	if (hasObjectIdField) {
		// 涉及_id字段的lookup，需要特殊处理ObjectId类型匹配
		if (isArrayField) {
			// 数组字段 + ObjectId
			stages.push({
				$lookup: {
					from: lookup.from,
					let: { localKeys: { $ifNull: [`$${lookup.localField}`, []] } },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [
										{ $gt: [{ $size: '$$localKeys' }, 0] },
										{
											$in: [
												{ $toString: `$${lookup.foreignField}` },
												{
													$map: {
														input: '$$localKeys',
														as: 'key',
														in: { $toString: '$$key' },
													},
												},
											],
										},
									],
								},
							},
						},
					],
					as: lookup.as,
				},
			});
		} else {
			// 单一字段 + ObjectId
			stages.push({
				$lookup: {
					from: lookup.from,
					let: { localKey: `$${lookup.localField}` },
					pipeline: [
						{
							$match: {
								$expr: {
									$eq: [{ $toString: `$${lookup.foreignField}` }, { $toString: '$$localKey' }],
								},
							},
						},
					],
					as: lookup.as,
				},
			});
		}
	} else {
		// 普通字段的lookup
		if (isArrayField) {
			// 数组字段
			stages.push({
				$lookup: {
					from: lookup.from,
					let: { localKeys: { $ifNull: [`$${lookup.localField}`, []] } },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [{ $gt: [{ $size: '$$localKeys' }, 0] }, { $in: [`$${lookup.foreignField}`, '$$localKeys'] }],
								},
							},
						},
					],
					as: lookup.as,
				},
			});
		} else {
			// 单一字段
			stages.push({
				$lookup: {
					from: lookup.from,
					localField: lookup.localField,
					foreignField: lookup.foreignField,
					as: lookup.as,
				},
			});
		}
	}

	// 如果只需要第一个匹配项，将数组转为对象
	if (lookup.single) {
		stages.push({
			$addFields: {
				[lookup.as]: { $arrayElemAt: [`$${lookup.as}`, 0] },
			},
		});
	}

	// 如果需要展开特定字段
	if (lookup.addFields) {
		const addFieldsStage = {};
		for (const [key, value] of Object.entries(lookup.addFields)) {
			addFieldsStage[key] = `$${lookup.as}.${value}`;
		}
		stages.push({ $addFields: addFieldsStage });
	}

	return stages;
}

/**
 * 将字符串ID转换为MongoDB ObjectId
 * @param {string|string[]|Object} id - 要转换的ID、ID数组或包含ID的对象
 * @param {boolean} [silent=true] - 是否静默处理错误（不抛出异常）
 * @returns {ObjectId|ObjectId[]|Object|null} 转换后的ObjectId、ObjectId数组或对象
 */
export function toObjectId(id, silent = true) {
	// 处理null或undefined
	if (id == null) return null;

	// 处理字符串ID
	if (typeof id === 'string') {
		try {
			// 检查是否是有效的ObjectId格式
			if (/^[0-9a-fA-F]{24}$/.test(id)) {
				return new ObjectId(id);
			}
			return id; // 不是有效格式则返回原始值
		} catch (error) {
			if (!silent) throw error;
			console.warn(`无法将ID转换为ObjectId: ${id}`, error);
			return id; // 转换失败返回原始值
		}
	}

	// 处理已经是ObjectId的情况
	if (id instanceof ObjectId) {
		return id;
	}

	// 处理ID数组
	if (Array.isArray(id)) {
		return id.map((item) => toObjectId(item, silent));
	}

	// 处理对象（递归转换所有可能的ID字段）
	if (typeof id === 'object') {
		const result = { ...id };

		for (const key in result) {
			// 检查是否是ID字段
			if (key === '_id' || key.endsWith('Id') || key.endsWith('_id')) {
				result[key] = toObjectId(result[key], silent);
			} else if (typeof result[key] === 'object') {
				// 递归处理嵌套对象
				result[key] = toObjectId(result[key], silent);
			}
		}

		return result;
	}

	// 其他类型返回原始值
	return id;
}

/**
 * 检查字符串是否是有效的ObjectId格式
 * @param {string} id - 要检查的ID字符串
 * @returns {boolean} 是否是有效格式
 */
export function isValidObjectId(id) {
	if (typeof id !== 'string') return false;
	return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * 将ObjectId转换为字符串
 * @param {ObjectId|ObjectId[]|Object} id - 要转换的ObjectId、ObjectId数组或包含ObjectId的对象
 * @returns {string|string[]|Object} 转换后的字符串、字符串数组或对象
 */
export function fromObjectId(id) {
	// 处理null或undefined
	if (id == null) return null;

	// 处理ObjectId
	if (id instanceof ObjectId) {
		return id.toString();
	}

	// 处理Date对象 - 直接返回，不要转换
	if (id instanceof Date) {
		return id;
	}

	// 处理数组
	if (Array.isArray(id)) {
		return id.map((item) => fromObjectId(item));
	}

	// 处理对象（递归转换所有ObjectId）
	if (typeof id === 'object' && !(id instanceof ObjectId) && !(id instanceof Date)) {
		const result = { ...id };

		for (const key in result) {
			if (result[key] instanceof ObjectId) {
				result[key] = result[key].toString();
			} else if (result[key] instanceof Date) {
				// 保持Date对象不变
				result[key] = result[key];
			} else if (typeof result[key] === 'object' && result[key] !== null) {
				// 递归处理嵌套对象
				result[key] = fromObjectId(result[key]);
			}
		}

		return result;
	}

	// 其他类型返回原始值
	return id;
}
