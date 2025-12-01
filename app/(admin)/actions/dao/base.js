import { prisma, generateId } from '@/lib/database/prisma';
import { checkBackendAccessAction, checkIsAdminAction } from '@/lib/auth/admin-auth';
import { logAction } from '@/lib/logging/action-logger';
import { validateWithConfig, runCustomValidators } from '@/lib/validation/auto-schema';

/**
 * BaseDAO - 通用数据访问对象基类
 * 
 * 直接使用 Prisma 客户端，提供标准的 CRUD 操作
 * 
 * 权限逻辑：
 * - 默认检查后台访问权限（admin 或 isBackendAllowed）
 * - 可选配置 requireAdmin: true 强制要求 admin 角色
 */
export class BaseDAO {
	/**
	 * @param {Object} config - DAO 配置
	 * @param {string} config.modelName - Prisma 模型名（如 'user', 'role'）
	 * @param {string} config.primaryKey - 主键字段名，默认 'id'
	 * @param {Object} config.fields - 字段配置
	 * @param {Object} config.query - 查询配置
	 * @param {Object} config.validation - 验证配置
	 * @param {Object} config.hooks - 钩子函数
	 * @param {Object} config.transforms - 数据转换
	 * @param {boolean} config.softDelete - 是否启用软删除
	 * @param {boolean} config.requireAdmin - 是否要求 admin 角色
	 */
	constructor(config) {
		this.config = {
			modelName: config.modelName,
			// 兼容旧代码：collectionName 映射到 modelName
			...(config.collectionName && !config.modelName && { modelName: config.collectionName }),
			primaryKey: config.primaryKey || 'id',
			fields: config.fields || {},
			query: config.query || {},
			validation: config.validation || {},
			schemas: config.schemas || {},
			uniqueFields: config.uniqueFields || [],
			hooks: config.hooks || {},
			transforms: config.transforms || {},
			softDelete: config.softDelete !== false,
			requireAdmin: config.requireAdmin || false,
		};

		// 设置默认值
		this.config.query.defaultSort = this.config.query.defaultSort || { createdAt: 'desc' };
		this.config.query.defaultPageSize = this.config.query.defaultPageSize || 20;
		this.config.query.baseFilter = this.config.query.baseFilter || {};

		// 获取 Prisma 模型
		const modelName = this.config.modelName || this.config.collectionName;
		this.model = prisma[modelName];
		
		if (!this.model) {
			throw new Error(`Prisma model "${modelName}" not found`);
		}
	}

	/**
	 * 权限检查
	 */
	async checkPermission() {
		if (this.config.requireAdmin) {
			const adminCheck = await checkIsAdminAction();
			if (!adminCheck.isAdmin) {
				throw new Error(adminCheck.error);
			}
			return adminCheck;
		} else {
			const backendCheck = await checkBackendAccessAction();
			if (!backendCheck.hasAccess) {
				throw new Error(backendCheck.error);
			}
			return backendCheck;
		}
	}

	/**
	 * 获取当前用户ID
	 */
	async getCurrentUserId() {
		try {
			const check = await checkBackendAccessAction();
			return check.user?.id || check.userId || 'system';
		} catch {
			return 'system';
		}
	}

	/**
	 * 字段过滤
	 */
	filterFields(data, action) {
		const allowedFields = this.config.fields[action] || [];
		if (allowedFields.length === 0) return data;

		const filtered = {};
		for (const field of allowedFields) {
			if (data[field] !== undefined) {
				filtered[field] = data[field];
			}
		}
		return filtered;
	}

	/**
	 * 数据验证
	 */
	async validate(data, action, recordId = null) {
		// Schema 验证
		const result = validateWithConfig(this.config, data, action);
		if (!result.success) {
			const error = new Error(result.error);
			error.name = 'ValidationError';
			error.errors = result.errors;
			throw error;
		}

		let validatedData = result.data;

		// 自定义验证器
		if (this.config.validation) {
			await runCustomValidators(this.config.validation, validatedData, action, {
				recordId,
				modelName: this.config.modelName,
			});
		}

		// 唯一性检查
		for (const field of this.config.uniqueFields) {
			const value = validatedData[field];
			if (value === undefined || value === null || value === '') continue;

			const where = { [field]: value };
			if (recordId) {
				where[this.config.primaryKey] = { not: recordId };
			}

			const exists = await this.model.findFirst({ where });
			if (exists) {
				throw new Error(`${field} already exists`);
			}
		}

		return validatedData;
	}

	/**
	 * 构建搜索条件
	 */
	buildSearchWhere(search) {
		if (!search || !this.config.fields.searchable?.length) return {};

		return {
			OR: this.config.fields.searchable.map(field => ({
				[field]: { contains: search, mode: 'insensitive' },
			})),
		};
	}

	/**
	 * 合并查询条件
	 */
	buildWhere(params = {}) {
		const { search, filters = {}, whereJson } = params;
		
		let where = { ...this.config.query.baseFilter };

		// 直接传入的 whereJson
		if (whereJson) {
			where = { ...where, ...whereJson };
		}

		// 搜索条件
		const searchWhere = this.buildSearchWhere(search);
		if (searchWhere.OR) {
			where = { ...where, ...searchWhere };
		}

		// 过滤条件
		for (const [key, value] of Object.entries(filters)) {
			if (value !== undefined && value !== null && value !== '') {
				where[key] = value;
			}
		}

		// 软删除
		if (this.config.softDelete) {
			where.deletedAt = null;
		}

		return where;
	}

	// ==================== CRUD 操作 ====================

	/**
	 * 获取列表（分页）
	 */
	async getList(params = {}) {
		await this.checkPermission();

		const {
			pageIndex = 1,
			pageSize = this.config.query.defaultPageSize,
			sortJson,
			include,
		} = params;

		const where = this.buildWhere(params);
		const orderBy = sortJson || this.config.query.defaultSort;
		const skip = (pageIndex - 1) * pageSize;

		const queryOptions = {
			where,
			orderBy,
			skip,
			take: pageSize,
		};

		// 关联查询
		if (include) {
			queryOptions.include = include;
		}

		const [rows, total] = await Promise.all([
			this.model.findMany(queryOptions),
			this.model.count({ where }),
		]);

		// 输出转换
		const transform = this.config.transforms?.output;
		const data = transform ? rows.map(transform) : rows;

		return {
			success: true,
			data,
			total,
			pageIndex,
			pageSize,
			totalPages: Math.ceil(total / pageSize) || 1,
		};
	}

	/**
	 * 获取详情
	 */
	async getDetail(id, include) {
		await this.checkPermission();

		const queryOptions = {
			where: { [this.config.primaryKey]: id },
		};

		if (include) {
			queryOptions.include = include;
		}

		const record = await this.model.findUnique(queryOptions);

		if (!record) {
			throw new Error('Record not found');
		}

		if (this.config.softDelete && record.deletedAt) {
			throw new Error('Record has been deleted');
		}

		const transform = this.config.transforms?.output;
		return {
			success: true,
			data: transform ? transform(record) : record,
		};
	}

	/**
	 * 创建记录
	 */
	async create(data) {
		await this.checkPermission();

		let filtered = this.filterFields(data, 'creatable');

		if (this.config.transforms?.input) {
			filtered = this.config.transforms.input(filtered);
		}

		filtered = await this.validate(filtered, 'create');

		if (this.config.hooks?.beforeCreate) {
			filtered = await this.config.hooks.beforeCreate(filtered);
		}

		if (!filtered[this.config.primaryKey]) {
			filtered[this.config.primaryKey] = generateId();
		}

		const result = await this.model.create({ data: filtered });

		if (this.config.hooks?.afterCreate) {
			await this.config.hooks.afterCreate(filtered, result);
		}

		return {
			success: true,
			data: { insertedId: result.id },
			message: 'Created successfully',
		};
	}

	/**
	 * 更新记录
	 */
	async update(id, data) {
		await this.checkPermission();

		const existing = await this.model.findUnique({
			where: { [this.config.primaryKey]: id },
		});

		if (!existing) {
			throw new Error('Record not found');
		}

		if (this.config.softDelete && existing.deletedAt) {
			throw new Error('Cannot update deleted record');
		}

		let filtered = this.filterFields(data, 'updatable');

		if (this.config.transforms?.input) {
			filtered = this.config.transforms.input(filtered);
		}

		filtered = await this.validate(filtered, 'update', id);

		if (this.config.hooks?.beforeUpdate) {
			filtered = await this.config.hooks.beforeUpdate(id, filtered, existing);
		}

		await this.model.update({
			where: { [this.config.primaryKey]: id },
			data: filtered,
		});

		if (this.config.hooks?.afterUpdate) {
			await this.config.hooks.afterUpdate(id, filtered);
		}

		return {
			success: true,
			message: 'Updated successfully',
		};
	}

	/**
	 * 删除记录
	 */
	async delete(id) {
		await this.checkPermission();

		const existing = await this.model.findUnique({
			where: { [this.config.primaryKey]: id },
		});

		if (!existing) {
			throw new Error('Record not found');
		}

		if (this.config.hooks?.beforeDelete) {
			try {
				const canDelete = await this.config.hooks.beforeDelete(id, existing);
				if (canDelete === false) {
					throw new Error('Cannot delete this record');
				}
			} catch (error) {
				const businessError = new Error(error.message);
				businessError.name = 'BusinessError';
				throw businessError;
			}
		}

		if (this.config.softDelete) {
			await this.model.update({
				where: { [this.config.primaryKey]: id },
				data: { deletedAt: new Date() },
			});
		} else {
			await this.model.delete({
				where: { [this.config.primaryKey]: id },
			});
		}

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
	 */
	async batchUpdate(ids, data) {
		await this.checkPermission();

		if (!Array.isArray(ids) || ids.length === 0) {
			throw new Error('IDs array is required');
		}

		let filtered = this.filterFields(data, 'updatable');

		if (this.config.transforms?.input) {
			filtered = this.config.transforms.input(filtered);
		}

		if (this.config.hooks?.beforeBatchUpdate) {
			filtered = await this.config.hooks.beforeBatchUpdate(ids, filtered);
		}

		const result = await this.model.updateMany({
			where: { [this.config.primaryKey]: { in: ids } },
			data: filtered,
		});

		if (this.config.hooks?.afterBatchUpdate) {
			await this.config.hooks.afterBatchUpdate(ids, filtered, result);
		}

		return {
			success: true,
			message: `Updated ${result.count} records`,
			count: result.count,
		};
	}

	/**
	 * 批量删除
	 */
	async batchDelete(ids) {
		await this.checkPermission();

		if (!Array.isArray(ids) || ids.length === 0) {
			throw new Error('IDs array is required');
		}

		if (this.config.hooks?.beforeBatchDelete) {
			const canDelete = await this.config.hooks.beforeBatchDelete(ids);
			if (canDelete === false) {
				throw new Error('Cannot delete these records');
			}
		}

		let result;

		if (this.config.softDelete) {
			result = await this.model.updateMany({
				where: { [this.config.primaryKey]: { in: ids } },
				data: { deletedAt: new Date() },
			});
		} else {
			result = await this.model.deleteMany({
				where: { [this.config.primaryKey]: { in: ids } },
			});
		}

		if (this.config.hooks?.afterBatchDelete) {
			await this.config.hooks.afterBatchDelete(ids, result);
		}

		return {
			success: true,
			message: `Deleted ${result.count} records`,
			count: result.count,
		};
	}

	// ==================== 聚合方法 ====================

	async count(where = {}) {
		await this.checkPermission();
		const finalWhere = { ...this.config.query.baseFilter, ...where };
		if (this.config.softDelete) finalWhere.deletedAt = null;
		return this.model.count({ where: finalWhere });
	}

	async sum(field, where = {}) {
		await this.checkPermission();
		const finalWhere = { ...this.config.query.baseFilter, ...where };
		if (this.config.softDelete) finalWhere.deletedAt = null;
		const result = await this.model.aggregate({
			where: finalWhere,
			_sum: { [field]: true },
		});
		return result._sum[field] || 0;
	}

	async max(field, where = {}) {
		await this.checkPermission();
		const finalWhere = { ...this.config.query.baseFilter, ...where };
		if (this.config.softDelete) finalWhere.deletedAt = null;
		const result = await this.model.aggregate({
			where: finalWhere,
			_max: { [field]: true },
		});
		return result._max[field];
	}

	async min(field, where = {}) {
		await this.checkPermission();
		const finalWhere = { ...this.config.query.baseFilter, ...where };
		if (this.config.softDelete) finalWhere.deletedAt = null;
		const result = await this.model.aggregate({
			where: finalWhere,
			_min: { [field]: true },
		});
		return result._min[field];
	}

	async avg(field, where = {}) {
		await this.checkPermission();
		const finalWhere = { ...this.config.query.baseFilter, ...where };
		if (this.config.softDelete) finalWhere.deletedAt = null;
		const result = await this.model.aggregate({
			where: finalWhere,
			_avg: { [field]: true },
		});
		return result._avg[field] || 0;
	}

	/**
	 * 获取所有记录（不分页）
	 */
	async getAll(where = {}, orderBy = null) {
		await this.checkPermission();
		const finalWhere = { ...this.config.query.baseFilter, ...where };
		if (this.config.softDelete) finalWhere.deletedAt = null;

		const records = await this.model.findMany({
			where: finalWhere,
			orderBy: orderBy || this.config.query.defaultSort,
		});

		const transform = this.config.transforms?.output;
		return transform ? records.map(transform) : records;
	}
}

/**
 * 创建 CRUD Actions 的工厂函数
 */
export function createCrudActions(config) {
	const dao = new BaseDAO(config);
	const resourceType = config.modelName || config.collectionName;

	return {
		getList: async (params) => {
			const startTime = Date.now();
			const userId = await dao.getCurrentUserId();

			try {
				const result = await dao.getList(params);
				await logAction({
					userId,
					action: 'query',
					resourceType,
					params,
					result,
					success: true,
					duration: Date.now() - startTime,
				});
				return result;
			} catch (error) {
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
					success: true,
					duration: Date.now() - startTime,
				});
				return result;
			} catch (error) {
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

		create: async (data) => {
			const startTime = Date.now();
			const userId = await dao.getCurrentUserId();

			try {
				const result = await dao.create(data);
				await logAction({
					userId,
					action: 'create',
					resourceType,
					resourceId: result.data?.insertedId,
					params: data,
					result,
					success: true,
					duration: Date.now() - startTime,
				});
				return result;
			} catch (error) {
				const errorResult = { success: false, error: error.message };
				await logAction({
					userId,
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

		update: async (id, data) => {
			const startTime = Date.now();
			const userId = await dao.getCurrentUserId();

			try {
				const result = await dao.update(id, data);
				await logAction({
					userId,
					action: 'update',
					resourceType,
					resourceId: id,
					params: { id, data },
					result,
					success: true,
					duration: Date.now() - startTime,
				});
				return result;
			} catch (error) {
				const errorResult = { success: false, error: error.message };
				await logAction({
					userId,
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

		delete: async (id) => {
			const startTime = Date.now();
			const userId = await dao.getCurrentUserId();

			try {
				const result = await dao.delete(id);
				await logAction({
					userId,
					action: 'delete',
					resourceType,
					resourceId: id,
					params: { id },
					result,
					success: true,
					duration: Date.now() - startTime,
				});
				return result;
			} catch (error) {
				const errorResult = { success: false, error: error.message };
				await logAction({
					userId,
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

		batchUpdate: async (ids, data) => {
			const startTime = Date.now();
			const userId = await dao.getCurrentUserId();

			try {
				const result = await dao.batchUpdate(ids, data);
				await logAction({
					userId,
					action: 'batch_update',
					resourceType,
					params: { ids, data },
					result,
					success: true,
					duration: Date.now() - startTime,
				});
				return result;
			} catch (error) {
				const errorResult = { success: false, error: error.message };
				await logAction({
					userId,
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

		batchDelete: async (ids) => {
			const startTime = Date.now();
			const userId = await dao.getCurrentUserId();

			try {
				const result = await dao.batchDelete(ids);
				await logAction({
					userId,
					action: 'batch_delete',
					resourceType,
					params: { ids },
					result,
					success: true,
					duration: Date.now() - startTime,
				});
				return result;
			} catch (error) {
				const errorResult = { success: false, error: error.message };
				await logAction({
					userId,
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

		dao,
	};
}
