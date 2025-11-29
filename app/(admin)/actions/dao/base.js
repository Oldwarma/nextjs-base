import { getCollection, generateId, fromObjectId } from '@/lib/database/mongodb';
import { checkBackendAccessAction, checkIsAdminAction } from '@/lib/auth/admin-auth';
import { logAction } from '@/lib/logging/action-logger';
import { selects } from '@/lib/database/db-api';
import { validateWithConfig, runCustomValidators } from '@/lib/validation/auto-schema';

/**
 * BaseDAO - 通用数据访问对象基类
 * 提供标准的 CRUD 操作，减少重复代码
 * 
 * 权限逻辑：
 * - 默认检查后台访问权限（admin 或 isBackendAllowed）
 * - 可选配置 requireAdmin: true 强制要求 admin 角色
 * 
 * 验证支持：
 * - 支持简单的 validation 配置对象（自动转换为 Zod Schema）
 * - 也支持直接传入 Zod Schema（高级用法）
 */
export class BaseDAO {
	/**
	 * 构造函数
	 * @param {Object} config - DAO 配置对象
	 * @param {Object} config.validation - 验证配置对象（推荐，简单直观）
	 * @param {Object} config.schemas - Zod Schema 配置（可选，高级用法）
	 * @param {Array<string>} config.uniqueFields - 需要唯一性验证的字段（数据库级别）
	 */
	constructor(config) {
		this.config = {
			collectionName: config.collectionName,
			primaryKey: config.primaryKey || 'id',
			fields: config.fields || {},
			query: config.query || {},
			validation: config.validation || {}, // 简单验证配置
			schemas: config.schemas || {}, // Zod Schema（可选）
			uniqueFields: config.uniqueFields || [], // 唯一性验证字段
			hooks: config.hooks || {},
			transforms: config.transforms || {},
			softDelete: config.softDelete !== false, // 默认启用软删除
			requireAdmin: config.requireAdmin || false, // 是否要求 admin 角色
		};

		// 设置默认值
		if (!this.config.query.defaultSort) {
			this.config.query.defaultSort = { createdAt: -1 };
		}
		if (!this.config.query.defaultPageSize) {
			this.config.query.defaultPageSize = 20;
		}
		if (!this.config.query.baseFilter) {
			this.config.query.baseFilter = {};
		}
	}

	/**
	 * 统一的权限检查
	 * 根据配置选择：后台访问权限 或 仅 admin 权限
	 * @returns {Promise<Object>} 权限信息 { hasAccess/isAdmin: true, userId, user, isAdmin }
	 */
	async checkPermission() {
		if (this.config.requireAdmin) {
			// 要求 admin 角色
			const adminCheck = await checkIsAdminAction();
			if (!adminCheck.isAdmin) {
				throw new Error(adminCheck.error);
			}
			return adminCheck;
		} else {
			// 后台访问权限（admin 或 isBackendAllowed）
			const backendCheck = await checkBackendAccessAction();
			if (!backendCheck.hasAccess) {
				throw new Error(backendCheck.error);
			}
			return backendCheck;
		}
	}
	
	/**
	 * 获取当前用户ID（用于日志记录）
	 * @returns {Promise<string>} 用户ID
	 */
	async getCurrentUserId() {
		try {
			const backendCheck = await checkBackendAccessAction();
			return backendCheck.user?.id || backendCheck.userId || 'backend_user';
		} catch {
			return 'system';
		}
	}

	/**
	 * 字段过滤 - 只保留允许的字段
	 * @param {Object} data - 输入数据
	 * @param {String} action - 操作类型：creatable, updatable
	 * @returns {Object} 过滤后的数据
	 */
	filterFields(data, action) {
		const allowedFields = this.config.fields[action] || [];
		if (allowedFields.length === 0) {
			return data; // 如果没有配置，返回全部
		}

		const filtered = {};
		allowedFields.forEach((field) => {
			if (data[field] !== undefined) {
				filtered[field] = data[field];
			}
		});
		return filtered;
	}

	/**
	 * 数据验证
	 * 
	 * 验证逻辑：
	 * 1. 使用 Zod Schema 验证（config.schemas 或自动转换的 config.validation）
	 * 2. 执行自定义验证器（validator/custom 函数）
	 * 3. 数据库级别的唯一性验证（uniqueFields）
	 * 
	 * @param {Object} data - 待验证数据
	 * @param {String} action - 操作类型：create, update
	 * @param {String} recordId - 记录ID（用于唯一性验证时排除自身）
	 * @returns {Object} 验证后的数据
	 */
	async validate(data, action, recordId = null) {
		// 1. 使用自动 Schema 验证（支持 validation 配置和 Zod Schema）
		const result = validateWithConfig(this.config, data, action);
		if (!result.success) {
			const error = new Error(result.error);
			error.name = 'ValidationError';
			error.errors = result.errors;
			throw error;
		}
		
		let validatedData = result.data;

		// 2. 执行自定义验证器（validator/custom 函数）
		if (this.config.validation) {
			await runCustomValidators(this.config.validation, validatedData, action, {
				recordId,
				collectionName: this.config.collectionName,
			});
		}

		// 3. 数据库级别验证（唯一性检查）
		const uniqueFields = this.config.uniqueFields || [];
		for (const field of uniqueFields) {
			const value = validatedData[field];
			if (value === undefined || value === null || value === '') {
				continue;
			}

			const collection = await getCollection(this.config.collectionName);
			const query = { [field]: value };

			// 更新时排除自身
			if (recordId) {
				query[this.config.primaryKey] = { $ne: recordId };
			}

			const exists = await collection.findOne(query);
			if (exists) {
				throw new Error(`${field} already exists`);
			}
		}

		return validatedData;
	}

	/**
	 * 构建搜索查询
	 * @param {String} search - 搜索关键词
	 * @returns {Object} 查询条件
	 */
	buildSearchQuery(search) {
		if (!search || !this.config.fields.searchable || this.config.fields.searchable.length === 0) {
			return {};
		}

		return {
			$or: this.config.fields.searchable.map((field) => ({
				[field]: { $regex: search, $options: 'i' },
			})),
		};
	}

	/**
	 * 构建过滤查询
	 * @param {Object} filters - 过滤条件
	 * @returns {Object} 查询条件
	 */
	buildFiltersQuery(filters) {
		const query = {};

		for (const [key, value] of Object.entries(filters)) {
			if (value !== undefined && value !== null && value !== '') {
				query[key] = value;
			}
		}

		return query;
	}

	/**
	 * 获取列表（分页）
	 * @param {Object} params - 查询参数
	 * @param {Array} params.foreignDB - 连表配置（可选）
	 * @returns {Promise<Object>} 查询结果
	 */
	async getList(params = {}) {
		await this.checkPermission();

		const {
			pageIndex = 1,
			pageSize = this.config.query.defaultPageSize,
			search,
			filters = {},
			whereJson,  // 新增：支持直接传入 whereJson（SmartCrudPage 使用）
			sortJson,   // 直接接收 sortJson 参数
			foreignDB,  // 连表配置（参数传入）
		} = params;

		// 构建查询条件：优先使用 whereJson，其次使用 search + filters 构建
		let query;
		
		if (whereJson) {
			// SmartCrudPage 模式：直接使用已转换的 whereJson
			query = { ...this.config.query.baseFilter, ...whereJson };
		} else {
			// 传统模式：使用 search 和 filters 构建查询
			query = { ...this.config.query.baseFilter };

		// 搜索条件
		const searchQuery = this.buildSearchQuery(search);
		if (searchQuery.$or) {
			if (query.$or) {
				// 合并 $or 条件
				query.$and = [{ $or: query.$or }, searchQuery];
				delete query.$or;
			} else {
				Object.assign(query, searchQuery);
			}
		}

		// 额外过滤条件
		const filtersQuery = this.buildFiltersQuery(filters);
		Object.assign(query, filtersQuery);
		}

		// 软删除过滤（始终应用）
		if (this.config.softDelete) {
			if (query.$or || query.$and) {
				// 如果已经有 $or 或 $and，需要合并
				const softDeleteQuery = { $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] };
				if (query.$and) {
					query.$and.push(softDeleteQuery);
				} else {
					query.$and = [query, softDeleteQuery];
				}
			} else {
				query.$or = [{ deletedAt: { $exists: false } }, { deletedAt: null }];
			}
		}

		// 排序：优先使用传入的 sortJson，否则使用 config 中的默认排序
		const sortOption = sortJson || this.config.query.defaultSort || {};

		// 连表配置：优先使用参数传入的，否则使用 config 中配置的
		const finalForeignDB = foreignDB || this.config.query?.foreignDB || [];

		// 统一使用 selects 方法（即使没有连表）
		// 优点：参数统一、逻辑统一、易于维护
		const selectsParams = {
			dbName: this.config.collectionName,
			whereJson: query,
			sortJson: sortOption,  // 统一使用 sortJson 参数名
			pageIndex,
			pageSize,
			getCount: true,
			foreignDB: finalForeignDB,  // 没有连表时为空数组
		};
		
		const result = await selects(selectsParams);

		// 输出转换
		const transform = this.config.transforms?.output;
		const data = transform ? result.rows.map(transform) : result.rows;

		return {
			success: true,
			data,
			total: result.total,
			pageIndex: result.pageIndex,
			pageSize: result.pageSize,
			totalPages: result.totalPages,
		};
	}

	/**
	 * 获取详情
	 * @param {String} id - 记录ID
	 * @returns {Promise<Object>} 记录详情
	 */
	async getDetail(id) {
		await this.checkPermission();

		const collection = await getCollection(this.config.collectionName);
		const record = await collection.findOne({
			[this.config.primaryKey]: id,
		});

		if (!record) {
			throw new Error('Record not found');
		}

		// 检查是否已删除
		if (this.config.softDelete && record.deletedAt) {
			throw new Error('Record has been deleted');
		}

		// 序列化 ObjectId
		const serialized = fromObjectId(record);

		// 输出转换
		const transform = this.config.transforms?.output;
		const data = transform ? transform(serialized) : serialized;

		return {
			success: true,
			data,
		};
	}

	/**
	 * 创建记录
	 * @param {Object} data - 创建数据
	 * @returns {Promise<Object>} 创建结果
	 */
	async create(data) {
		await this.checkPermission();

		// 字段过滤
		let filtered = this.filterFields(data, 'creatable');

		// 输入转换
		if (this.config.transforms?.input) {
			filtered = this.config.transforms.input(filtered);
		}

		// 验证（返回验证后的数据，可能经过 Zod 转换）
		filtered = await this.validate(filtered, 'create');

		// 前置钩子
		if (this.config.hooks?.beforeCreate) {
			filtered = await this.config.hooks.beforeCreate(filtered);
		}

		// 自动生成 UUID 作为主键（如果没有提供）
		if (!filtered[this.config.primaryKey]) {
			filtered[this.config.primaryKey] = generateId();
		}

		// 添加时间戳
		filtered.createdAt = new Date();
		filtered.updatedAt = new Date();

		// 执行创建
		const collection = await getCollection(this.config.collectionName);
		const result = await collection.insertOne(filtered);

		// 后置钩子
		if (this.config.hooks?.afterCreate) {
			await this.config.hooks.afterCreate(filtered, result);
		}

		// 转换 ObjectId 为字符串
		const serializedResult = {
			acknowledged: result.acknowledged,
			insertedId: result.insertedId?.toString(),
		};

		return {
			success: true,
			data: serializedResult,
			message: 'Created successfully',
		};
	}

	/**
	 * 更新记录
	 * @param {String} id - 记录ID
	 * @param {Object} data - 更新数据
	 * @returns {Promise<Object>} 更新结果
	 */
	async update(id, data) {
		await this.checkPermission();

		// 检查记录是否存在
		const collection = await getCollection(this.config.collectionName);
		const existing = await collection.findOne({
			[this.config.primaryKey]: id,
		});

		if (!existing) {
			throw new Error('Record not found');
		}

		// 检查是否已删除
		if (this.config.softDelete && existing.deletedAt) {
			throw new Error('Cannot update deleted record');
		}

		// 字段过滤
		let filtered = this.filterFields(data, 'updatable');

		// 输入转换
		if (this.config.transforms?.input) {
			filtered = this.config.transforms.input(filtered);
		}

		// 验证（传入 id 用于唯一性验证时排除自身，返回验证后的数据）
		filtered = await this.validate(filtered, 'update', id);

		// 前置钩子
		if (this.config.hooks?.beforeUpdate) {
			filtered = await this.config.hooks.beforeUpdate(id, filtered, existing);
		}

		// 添加更新时间戳
		filtered.updatedAt = new Date();

		// 执行更新
		const result = await collection.updateOne({ [this.config.primaryKey]: id }, { $set: filtered });

		if (result.modifiedCount === 0) {
			throw new Error('No changes made');
		}

		// 后置钩子
		if (this.config.hooks?.afterUpdate) {
			await this.config.hooks.afterUpdate(id, filtered, result);
		}

		return {
			success: true,
			message: 'Updated successfully',
		};
	}

	/**
	 * 删除记录
	 * @param {String} id - 记录ID
	 * @returns {Promise<Object>} 删除结果
	 */
	async delete(id) {
		await this.checkPermission();

		// 检查记录是否存在
		const collection = await getCollection(this.config.collectionName);
		const existing = await collection.findOne({
			[this.config.primaryKey]: id,
		});

		if (!existing) {
			throw new Error('Record not found');
		}

		// 前置钩子（可用于检查关联数据）
		if (this.config.hooks?.beforeDelete) {
			try {
				const canDelete = await this.config.hooks.beforeDelete(id, existing);
				if (canDelete === false) {
					throw new Error('Cannot delete this record');
				}
			} catch (error) {
				// 将业务错误标记为 BusinessError，避免作为系统错误处理
				const businessError = new Error(error.message);
				businessError.name = 'BusinessError';
				throw businessError;
			}
		}

		let result;

		if (this.config.softDelete) {
			// 软删除
			result = await collection.updateOne(
				{ [this.config.primaryKey]: id },
				{
					$set: {
						deletedAt: new Date(),
						updatedAt: new Date(),
					},
				}
			);
		} else {
			// 硬删除
			result = await collection.deleteOne({
				[this.config.primaryKey]: id,
			});
		}

		// 后置钩子
		if (this.config.hooks?.afterDelete) {
			await this.config.hooks.afterDelete(id, existing);
		}

		return {
			success: true,
			message: 'Deleted successfully',
		};
	}

	/**
	 * 批量更新
	 * @param {Array} ids - 记录ID数组
	 * @param {Object} data - 更新数据
	 * @returns {Promise<Object>} 更新结果
	 */
	async batchUpdate(ids, data) {
		await this.checkPermission();

		if (!Array.isArray(ids) || ids.length === 0) {
			throw new Error('IDs array is required');
		}

		// 字段过滤
		let filtered = this.filterFields(data, 'updatable');

		// 输入转换
		if (this.config.transforms?.input) {
			filtered = this.config.transforms.input(filtered);
		}

		// 前置钩子
		if (this.config.hooks?.beforeBatchUpdate) {
			filtered = await this.config.hooks.beforeBatchUpdate(ids, filtered);
		}

		// 添加更新时间戳
		filtered.updatedAt = new Date();

		// 执行批量更新
		const collection = await getCollection(this.config.collectionName);
		const result = await collection.updateMany(
			{ [this.config.primaryKey]: { $in: ids } },
			{ $set: filtered }
		);

		// 后置钩子
		if (this.config.hooks?.afterBatchUpdate) {
			await this.config.hooks.afterBatchUpdate(ids, filtered, result);
		}

		return {
			success: true,
			message: `Updated ${result.modifiedCount} records`,
			count: result.modifiedCount,
		};
	}

	/**
	 * 批量删除
	 * @param {Array} ids - 记录ID数组
	 * @returns {Promise<Object>} 删除结果
	 */
	async batchDelete(ids) {
		await this.checkPermission();

		if (!Array.isArray(ids) || ids.length === 0) {
			throw new Error('IDs array is required');
		}

		// 前置钩子
		if (this.config.hooks?.beforeBatchDelete) {
			const canDelete = await this.config.hooks.beforeBatchDelete(ids);
			if (canDelete === false) {
				throw new Error('Cannot delete these records');
			}
		}

		const collection = await getCollection(this.config.collectionName);
		let result;

		if (this.config.softDelete) {
			// 软删除
			result = await collection.updateMany(
				{ [this.config.primaryKey]: { $in: ids } },
				{
					$set: {
						deletedAt: new Date(),
						updatedAt: new Date(),
					},
				}
			);
		} else {
			// 硬删除
			result = await collection.deleteMany({
				[this.config.primaryKey]: { $in: ids },
			});
		}

		// 后置钩子
		if (this.config.hooks?.afterBatchDelete) {
			await this.config.hooks.afterBatchDelete(ids, result);
		}

		return {
			success: true,
			message: `Deleted ${result.modifiedCount || result.deletedCount} records`,
			count: result.modifiedCount || result.deletedCount,
		};
	}

	// ==================== 聚合统计方法 ====================

	/**
	 * 统计记录数量
	 * @param {Object} whereJson - 查询条件
	 * @returns {Promise<number>} 记录数量
	 */
	async count(whereJson = {}) {
		await this.checkPermission();

		const collection = await getCollection(this.config.collectionName);

		// 合并基础过滤条件（软删除等）
		const query = {
			...this.config.query.baseFilter,
			...whereJson,
		};

		const count = await collection.count(query);
		return count;
	}

	/**
	 * 字段求和
	 * @param {String} fieldName - 字段名
	 * @param {Object} whereJson - 查询条件
	 * @returns {Promise<number>} 求和结果
	 */
	async sum(fieldName, whereJson = {}) {
		await this.checkPermission();

		if (!fieldName) {
			throw new Error('Field name is required for sum operation');
		}

		const collection = await getCollection(this.config.collectionName);

		// 合并基础过滤条件
		const matchQuery = {
			...this.config.query.baseFilter,
			...whereJson,
		};

		const result = await collection.aggregate([{ $match: matchQuery }, { $group: { _id: null, total: { $sum: `$${fieldName}` } } }]);

		return result[0]?.total || 0;
	}

	/**
	 * 获取字段最大值
	 * @param {String} fieldName - 字段名
	 * @param {Object} whereJson - 查询条件
	 * @returns {Promise<any>} 最大值
	 */
	async max(fieldName, whereJson = {}) {
		await this.checkPermission();

		if (!fieldName) {
			throw new Error('Field name is required for max operation');
		}

		const collection = await getCollection(this.config.collectionName);

		const matchQuery = {
			...this.config.query.baseFilter,
			...whereJson,
		};

		const result = await collection.aggregate([{ $match: matchQuery }, { $group: { _id: null, maxValue: { $max: `$${fieldName}` } } }]);

		return result[0]?.maxValue || null;
	}

	/**
	 * 获取字段最小值
	 * @param {String} fieldName - 字段名
	 * @param {Object} whereJson - 查询条件
	 * @returns {Promise<any>} 最小值
	 */
	async min(fieldName, whereJson = {}) {
		await this.checkPermission();

		if (!fieldName) {
			throw new Error('Field name is required for min operation');
		}

		const collection = await getCollection(this.config.collectionName);

		const matchQuery = {
			...this.config.query.baseFilter,
			...whereJson,
		};

		const result = await collection.aggregate([{ $match: matchQuery }, { $group: { _id: null, minValue: { $min: `$${fieldName}` } } }]);

		return result[0]?.minValue || null;
	}

	/**
	 * 计算字段平均值
	 * @param {String} fieldName - 字段名
	 * @param {Object} whereJson - 查询条件
	 * @returns {Promise<number>} 平均值
	 */
	async avg(fieldName, whereJson = {}) {
		await this.checkPermission();

		if (!fieldName) {
			throw new Error('Field name is required for avg operation');
		}

		const collection = await getCollection(this.config.collectionName);

		const matchQuery = {
			...this.config.query.baseFilter,
			...whereJson,
		};

		const result = await collection.aggregate([{ $match: matchQuery }, { $group: { _id: null, avgValue: { $avg: `$${fieldName}` } } }]);

		return result[0]?.avgValue || 0;
	}

	/**
	 * 随机获取 N 条记录
	 * @param {number} size - 获取数量
	 * @param {Object} whereJson - 查询条件
	 * @returns {Promise<Array>} 记录数组
	 */
	async sample(size, whereJson = {}) {
		await this.checkPermission();

		if (!size || size < 1) {
			throw new Error('Size must be a positive number');
		}

		const collection = await getCollection(this.config.collectionName);

		const matchQuery = {
			...this.config.query.baseFilter,
			...whereJson,
		};

		const result = await collection.aggregate([{ $match: matchQuery }, { $sample: { size } }]);

		// 输出转换
		const transform = this.config.transforms?.output;
		return transform ? result.map(transform) : result;
	}

	/**
	 * 自定义聚合查询（高级用户使用）
	 * @param {Array} pipeline - MongoDB 聚合管道
	 * @returns {Promise<Array>} 聚合结果
	 */
	async aggregate(pipeline) {
		await this.checkPermission();

		if (!Array.isArray(pipeline)) {
			throw new Error('Pipeline must be an array');
		}

		const collection = await getCollection(this.config.collectionName);

		// 自动添加 baseFilter 到 pipeline 开头（如果有的话）
		if (Object.keys(this.config.query.baseFilter).length > 0) {
			pipeline.unshift({ $match: this.config.query.baseFilter });
		}

		const result = await collection.aggregate(pipeline);
		return result;
	}

	/**
	 * 获取所有记录（不分页）
	 * @param {Object} whereJson - 查询条件
	 * @param {Object} sortJson - 排序条件
	 * @returns {Promise<Array>} 记录数组
	 */
	async getAll(whereJson = {}, sortJson = null) {
		await this.checkPermission();

		const collection = await getCollection(this.config.collectionName);

		const query = {
			...this.config.query.baseFilter,
			...whereJson,
		};

		const sortOption = sortJson || this.config.query.defaultSort;

		const records = await collection.find(query, {
			sort: sortOption,
		});

		// 输出转换
		const transform = this.config.transforms?.output;
		return transform ? records.map(transform) : records;
	}
}

/**
 * 创建 CRUD Actions 的工厂函数
 * @param {Object} config - DAO 配置
 * @returns {Object} CRUD Actions 对象
 */
export function createCrudActions(config) {
	const dao = new BaseDAO(config);
	const resourceType = config.collectionName;

	return {
		// 获取列表
		getList: async (params) => {
			const startTime = Date.now();
			const userId = await dao.getCurrentUserId(); // 获取实际用户ID
			
			try {
				const result = await dao.getList(params);
				
				await logAction({
					userId,
					action: 'query',
					resourceType,
					params,
					result,
					success: result.success !== false,
					duration: Date.now() - startTime,
				});
				
				return result;
			} catch (error) {
				console.error('getList error:', error);
				const errorResult = { success: false, error: error.message };
				
				await logAction({
					userId,
					action: 'query',
					resourceType,
					params,
					result: errorResult,
					success: false,
					duration: Date.now() - startTime,
				});
				
				return errorResult;
			}
		},

		// 获取详情
		getDetail: async (id) => {
			const startTime = Date.now();
			const userId = await dao.getCurrentUserId();
			
			try {
				const result = await dao.getDetail(id);
				
				await logAction({
					userId,
					action: 'query',
					resourceType,
					resourceId: id,
					params: { id },
					result,
					success: result.success !== false,
					duration: Date.now() - startTime,
				});
				
				return result;
			} catch (error) {
				console.error('getDetail error:', error);
				const errorResult = { success: false, error: error.message };
				
				await logAction({
					userId,
					action: 'query',
					resourceType,
					resourceId: id,
					params: { id },
					result: errorResult,
					success: false,
					duration: Date.now() - startTime,
				});
				
				return errorResult;
			}
		},

		// 创建
		create: async (data) => {
			const startTime = Date.now();
			
			try {
				const result = await dao.create(data);
				
				await logAction({
					userId: 'admin',
					action: 'create',
					resourceType,
					resourceId: result.data?.insertedId,
					params: data,
					result,
					success: result.success !== false,
					duration: Date.now() - startTime,
				});
				
				return result;
			} catch (error) {
				console.error('create error:', error);
				const errorResult = { success: false, error: error.message };
				
				await logAction({
					userId: 'admin',
					action: 'create',
					resourceType,
					params: data,
					result: errorResult,
					success: false,
					duration: Date.now() - startTime,
				});
				
				return errorResult;
			}
		},

		// 更新
		update: async (id, data) => {
			const startTime = Date.now();
			
			try {
				const result = await dao.update(id, data);
				
				await logAction({
					userId: 'admin',
					action: 'update',
					resourceType,
					resourceId: id,
					params: { id, data },
					result,
					success: result.success !== false,
					duration: Date.now() - startTime,
				});
				
				return result;
			} catch (error) {
				console.error('update error:', error);
				const errorResult = { success: false, error: error.message };
				
				await logAction({
					userId: 'admin',
					action: 'update',
					resourceType,
					resourceId: id,
					params: { id, data },
					result: errorResult,
					success: false,
					duration: Date.now() - startTime,
				});
				
				return errorResult;
			}
		},

		// 删除
		delete: async (id) => {
			const startTime = Date.now();
			
			try {
				const result = await dao.delete(id);
				
				await logAction({
					userId: 'admin',
					action: 'delete',
					resourceType,
					resourceId: id,
					params: { id },
					result,
					success: result.success !== false,
					duration: Date.now() - startTime,
				});
				
				return result;
			} catch (error) {
				console.error('delete error:', error);
				const errorResult = { success: false, error: error.message };
				
				await logAction({
					userId: 'admin',
					action: 'delete',
					resourceType,
					resourceId: id,
					params: { id },
					result: errorResult,
					success: false,
					duration: Date.now() - startTime,
				});
				
				return errorResult;
			}
		},

		// 批量更新
		batchUpdate: async (ids, data) => {
			const startTime = Date.now();
			
			try {
				const result = await dao.batchUpdate(ids, data);
				
				await logAction({
					userId: 'admin',
					action: 'batch_update',
					resourceType,
					params: { ids, data },
					result,
					success: result.success !== false,
					duration: Date.now() - startTime,
				});
				
				return result;
			} catch (error) {
				console.error('batchUpdate error:', error);
				const errorResult = { success: false, error: error.message };
				
				await logAction({
					userId: 'admin',
					action: 'batch_update',
					resourceType,
					params: { ids, data },
					result: errorResult,
					success: false,
					duration: Date.now() - startTime,
				});
				
				return errorResult;
			}
		},

		// 批量删除
		batchDelete: async (ids) => {
			const startTime = Date.now();
			
			try {
				const result = await dao.batchDelete(ids);
				
				await logAction({
					userId: 'admin',
					action: 'batch_delete',
					resourceType,
					params: { ids },
					result,
					success: result.success !== false,
					duration: Date.now() - startTime,
				});
				
				return result;
			} catch (error) {
				console.error('batchDelete error:', error);
				const errorResult = { success: false, error: error.message };
				
				await logAction({
					userId: 'admin',
					action: 'batch_delete',
					resourceType,
					params: { ids },
					result: errorResult,
					success: false,
					duration: Date.now() - startTime,
				});
				
				return errorResult;
			}
		},

		// 暴露 DAO 实例，用于自定义方法
		dao,
	};
}
