import { getCollection } from '@/lib/mongodb';
import { checkAdminAction } from '@/lib/admin-auth';

/**
 * BaseDAO - 通用数据访问对象基类
 * 提供标准的 CRUD 操作，减少重复代码
 */
export class BaseDAO {
	/**
	 * 构造函数
	 * @param {Object} config - DAO 配置对象
	 */
	constructor(config) {
		this.config = {
			collectionName: config.collectionName,
			primaryKey: config.primaryKey || 'id',
			fields: config.fields || {},
			query: config.query || {},
			validation: config.validation || {},
			hooks: config.hooks || {},
			transforms: config.transforms || {},
			softDelete: config.softDelete !== false, // 默认启用软删除
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
	 * @returns {Promise<Object>} 管理员信息
	 */
	async checkPermission() {
		const adminCheck = await checkAdminAction();
		if (!adminCheck.isAdmin) {
			throw new Error(adminCheck.error);
		}
		return adminCheck;
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
	 * @param {Object} data - 待验证数据
	 * @param {String} action - 操作类型：create, update
	 * @param {String} recordId - 记录ID（用于唯一性验证时排除自身）
	 */
	async validate(data, action, recordId = null) {
		const rules = this.config.validation || {};

		for (const [field, rule] of Object.entries(rules)) {
			const value = data[field];

			// 必填验证
			if (rule.required && action === 'create') {
				if (value === undefined || value === null || value === '') {
					throw new Error(`${field} is required`);
				}
			}

			// 如果字段不存在且不是必填，跳过后续验证
			if (value === undefined || value === null || value === '') {
				continue;
			}

			// 长度验证
			if (rule.minLength && value.length < rule.minLength) {
				throw new Error(`${field} must be at least ${rule.minLength} characters`);
			}
			if (rule.maxLength && value.length > rule.maxLength) {
				throw new Error(`${field} must be at most ${rule.maxLength} characters`);
			}

			// 正则验证
			if (rule.pattern && !rule.pattern.test(value)) {
				throw new Error(rule.message || `${field} format is invalid`);
			}

		// 唯一性验证
		if (rule.unique) {
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

			// 自定义验证函数
			if (rule.validator) {
				const isValid = await rule.validator(value, data);
				if (!isValid) {
					throw new Error(rule.message || `${field} validation failed`);
				}
			}
		}
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
	 * @returns {Promise<Object>} 查询结果
	 */
	async getList(params = {}) {
		await this.checkPermission();

		const {
			pageIndex = 1,
			pageSize = this.config.query.defaultPageSize,
			search,
			filters = {},
			sort,
		} = params;

		const collection = await getCollection(this.config.collectionName);

		// 构建查询条件
		const query = { ...this.config.query.baseFilter };

		// 软删除过滤
		if (this.config.softDelete) {
			query.$or = [{ deletedAt: { $exists: false } }, { deletedAt: null }];
		}

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

		// 排序
		const sortOption = sort || this.config.query.defaultSort;

		// 执行查询
		const result = await collection.findWithPagination({
			query,
			pageIndex,
			pageSize,
			sort: sortOption,
		});

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

		// 输出转换
		const transform = this.config.transforms?.output;
		const data = transform ? transform(record) : record;

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

		// 验证
		await this.validate(filtered, 'create');

		// 前置钩子
		if (this.config.hooks?.beforeCreate) {
			filtered = await this.config.hooks.beforeCreate(filtered);
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

		return {
			success: true,
			data: result,
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

		// 验证（传入 id 用于唯一性验证时排除自身）
		await this.validate(filtered, 'update', id);

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
			const canDelete = await this.config.hooks.beforeDelete(id, existing);
			if (canDelete === false) {
				throw new Error('Cannot delete this record');
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
}

/**
 * 创建 CRUD Actions 的工厂函数
 * @param {Object} config - DAO 配置
 * @returns {Object} CRUD Actions 对象
 */
export function createCrudActions(config) {
	const dao = new BaseDAO(config);

	return {
		// 获取列表
		getList: async (params) => {
			try {
				return await dao.getList(params);
			} catch (error) {
				console.error('getList error:', error);
				return {
					success: false,
					error: error.message,
				};
			}
		},

		// 获取详情
		getDetail: async (id) => {
			try {
				return await dao.getDetail(id);
			} catch (error) {
				console.error('getDetail error:', error);
				return {
					success: false,
					error: error.message,
				};
			}
		},

		// 创建
		create: async (data) => {
			try {
				return await dao.create(data);
			} catch (error) {
				console.error('create error:', error);
				return {
					success: false,
					error: error.message,
				};
			}
		},

		// 更新
		update: async (id, data) => {
			try {
				return await dao.update(id, data);
			} catch (error) {
				console.error('update error:', error);
				return {
					success: false,
					error: error.message,
				};
			}
		},

		// 删除
		delete: async (id) => {
			try {
				return await dao.delete(id);
			} catch (error) {
				console.error('delete error:', error);
				return {
					success: false,
					error: error.message,
				};
			}
		},

		// 批量更新
		batchUpdate: async (ids, data) => {
			try {
				return await dao.batchUpdate(ids, data);
			} catch (error) {
				console.error('batchUpdate error:', error);
				return {
					success: false,
					error: error.message,
				};
			}
		},

		// 批量删除
		batchDelete: async (ids) => {
			try {
				return await dao.batchDelete(ids);
			} catch (error) {
				console.error('batchDelete error:', error);
				return {
					success: false,
					error: error.message,
				};
			}
		},

		// 暴露 DAO 实例，用于自定义方法
		dao,
	};
}
