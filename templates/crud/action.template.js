/**
 * {RESOURCE_LABEL} CRUD Actions
 *
 * 使用说明：
 * 1. 替换 {RESOURCE_NAME} → 资源名(小写单数), 如: coupon, product, article
 * 2. 替换 {RESOURCE_LABEL} → 资源标签(首字母大写), 如: Coupon, Product, Article
 * 3. 替换 {MODEL_NAME} → Prisma 模型名(小写单数), 如: coupon, product, article
 * 4. 替换 {TABLE_NAME} → 数据库表名(小写复数), 如: coupons, products, articles
 * 5. 根据需要配置 validation 验证规则和 hooks 钩子
 */

'use server';

import { createCrudActions } from '@/lib/core/crud-helper';
import { wrapAction } from '@/lib/core/action-wrapper';
import { prisma } from '@/lib/database/prisma';
import nb from '@/lib/function';

/**
 * {RESOURCE_LABEL} CRUD 配置
 *
 * 配置说明：
 * - modelName: Prisma 模型名（小写单数）
 * - tableName: 数据库表名（用于 selects 连表查询）
 * - primaryKey: 主键字段名，默认 'id'
 * - softDelete: 是否启用软删除（deletedAt 字段）
 * - fields: 字段配置
 *   - creatable: 创建时允许的字段
 *   - updatable: 更新时允许的字段
 *   - searchable: 可搜索的字段
 * - query: 查询配置
 *   - defaultSort: 默认排序 { fieldName: 'asc' | 'desc' }
 *   - defaultPageSize: 默认分页大小
 *   - baseFilter: 基础过滤条件（所有查询都会应用）
 *   - foreignDB: 连表查询配置（selects 格式）
 * - validation: 字段验证规则
 * - hooks: 生命周期钩子
 * - transforms: 数据转换
 */
const {RESOURCE_NAME}Config = {
	// ============================================
	// 基础配置
	// ============================================
	modelName: '{MODEL_NAME}',
	tableName: '{TABLE_NAME}',
	primaryKey: 'id',
	softDelete: true,

	// ============================================
	// 字段配置
	// ============================================
	fields: {
		creatable: ['name', 'enable', 'remark'],
		updatable: ['name', 'enable', 'remark'],
		searchable: ['name', 'remark'],
	},

	// ============================================
	// 查询配置
	// ============================================
	query: {
		defaultSort: { createdAt: 'desc' },
		defaultPageSize: 20,
		// 基础过滤条件（可选）
		// baseFilter: { status: 'active' },
		
		// 连表查询配置（可选）
		// foreignDB: [
		// 	{
		// 		dbName: 'users',
		// 		localKey: 'userId',
		// 		foreignKey: 'id',
		// 		as: 'user',
		// 		type: 'object',  // 'object' 或 'array'
		// 	},
		// ],
	},

	// ============================================
	// 字段验证规则
	//
	// 支持的配置项：
	// - required: 是否必填
	// - type: 类型（string, number, boolean, array, date, email, url）
	// - minLength/maxLength: 字符串长度限制
	// - min/max: 数值范围
	// - pattern: 正则表达式
	// - enum: 枚举值数组
	// - default: 默认值
	// - message: 自定义错误消息
	// ============================================
	validation: {
		name: {
			required: true,
			type: 'string',
			minLength: 2,
			maxLength: 100,
			message: 'Name must be between 2 and 100 characters',
		},
		enable: {
			type: 'boolean',
			default: true,
		},
		remark: {
			type: 'string',
			maxLength: 500,
		},
	},

	// ============================================
	// 唯一性字段（可选）
	// 创建/更新时会自动检查唯一性
	// ============================================
	// uniqueFields: ['code', 'email'],

	// ============================================
	// 生命周期钩子
	// ============================================
	hooks: {
		/**
		 * 创建前处理
		 * @param {Object} data - 创建数据
		 * @returns {Object} 处理后的数据
		 */
		beforeCreate: async (data) => {
			// 设置默认值
			if (data.enable === undefined) {
				data.enable = true;
			}

			// 示例：检查唯一性
			// const existing = await prisma.{MODEL_NAME}.findFirst({
			// 	where: { code: data.code, deletedAt: null },
			// });
			// if (existing) {
			// 	const error = new Error('Code already exists');
			// 	error.name = 'BusinessError';
			// 	throw error;
			// }

			return data;
		},

		/**
		 * 创建后处理
		 * @param {Object} data - 创建数据
		 * @param {Object} result - 创建结果
		 */
		// afterCreate: async (data, result) => {
		// 	console.log(`Created {RESOURCE_NAME}: ${result.id}`);
		// },

		/**
		 * 更新前处理
		 * @param {String} id - 记录 ID
		 * @param {Object} data - 更新数据
		 * @param {Object} existing - 现有记录
		 * @returns {Object} 处理后的数据
		 */
		beforeUpdate: async (id, data, existing) => {
			// 示例：禁止修改某些字段
			// delete data.code;

			// 示例：记录修改历史
			// data.lastModifiedBy = ctx.userId;

			return data;
		},

		/**
		 * 更新后处理
		 * @param {String} id - 记录 ID
		 * @param {Object} data - 更新数据
		 */
		// afterUpdate: async (id, data) => {
		// 	console.log(`Updated {RESOURCE_NAME}: ${id}`);
		// },

		/**
		 * 删除前处理
		 * @param {String} id - 记录 ID
		 * @param {Object} existing - 现有记录
		 * @returns {Boolean} 是否允许删除
		 */
		beforeDelete: async (id, existing) => {
			// 示例：检查是否可以删除
			// if (existing.usedCount > 0) {
			// 	const error = new Error('Cannot delete: item has been used');
			// 	error.name = 'BusinessError';
			// 	throw error;
			// }

			return true;
		},

		/**
		 * 删除后处理
		 * @param {String} id - 记录 ID
		 * @param {Object} existing - 删除前的记录
		 */
		// afterDelete: async (id, existing) => {
		// 	// 清理关联数据
		// 	console.log(`Deleted {RESOURCE_NAME}: ${id}`);
		// },

		/**
		 * 批量删除前处理
		 * @param {Array} ids - 记录 ID 数组
		 * @returns {Boolean} 是否允许删除
		 */
		// beforeBatchDelete: async (ids) => {
		// 	// 检查是否有不能删除的记录
		// 	return true;
		// },
	},

	// ============================================
	// 数据转换
	// ============================================
	transforms: {
		/**
		 * 输入转换（创建/更新前）
		 * @param {Object} data - 输入数据
		 * @returns {Object} 转换后的数据
		 */
		input: (data) => {
			// 去除字符串首尾空格
			if (data.name) {
				data.name = data.name.trim();
			}
			if (data.remark) {
				data.remark = data.remark.trim();
			}
			// 处理空字符串为 null
			if (data.remark === '') {
				data.remark = null;
			}
			return data;
		},

		/**
		 * 输出转换（查询后）
		 * @param {Object} data - 数据库记录
		 * @returns {Object} 转换后的数据
		 */
		output: (data) => {
			// 确保默认值
			if (data.enable === undefined) {
				data.enable = true;
			}
			return data;
		},
	},
};

// ============================================
// 创建标准 CRUD Actions
// ============================================
const crudActions = createCrudActions({RESOURCE_NAME}Config);

/**
 * 导出标准 CRUD Actions
 *
 * 自动生成的 action 名称格式：sys{Action}{Resource}
 * 例如：sysGetCouponList, sysCreateCoupon, sysUpdateCoupon, sysDeleteCoupon
 *
 * 这些名称会用于：
 * 1. 权限检查（RBAC）
 * 2. 操作日志记录
 */
export const get{RESOURCE_LABEL}ListAction = crudActions.getList;
export const get{RESOURCE_LABEL}DetailAction = crudActions.getDetail;
export const create{RESOURCE_LABEL}Action = crudActions.create;
export const update{RESOURCE_LABEL}Action = crudActions.update;
export const delete{RESOURCE_LABEL}Action = crudActions.delete;
export const batchUpdate{RESOURCE_LABEL}sAction = crudActions.batchUpdate;
export const batchDelete{RESOURCE_LABEL}sAction = crudActions.batchDelete;

// ============================================
// 自定义 Actions（可选）
// ============================================

/**
 * 获取列表（用于选择器）
 * 跳过日志记录，提高性能
 */
export const get{RESOURCE_LABEL}ListForSelectAction = wrapAction(
	'sysQuery{RESOURCE_LABEL}ListForSelect',
	async (params, ctx) => {
		const result = await crudActions._dao.getList({
			pageIndex: 1,
			pageSize: 1000,
			whereJson: { enable: true },
			sortJson: { name: 'asc' },
		});

		if (!result.success) {
			return result;
		}

		// 转换为 Select 选项格式
		const options = (result.data || []).map((item) => ({
			label: item.name,
			value: item.id,
		}));

		return {
			success: true,
			data: options,
		};
	},
	{ skipLog: true }
);

/**
 * 获取树形数据（用于 TreeSelect）
 * 适用于有 parentId 字段的模型
 */
// export const get{RESOURCE_LABEL}TreeForSelectAction = wrapAction(
// 	'sysQuery{RESOURCE_LABEL}TreeForSelect',
// 	async (params, ctx) => {
// 		const { includeRootOption = false } = params || {};
//
// 		const result = await crudActions._dao.getList({
// 			pageIndex: 1,
// 			pageSize: 1000,
// 			whereJson: { enable: true },
// 			sortJson: { sort: 'asc', name: 'asc' },
// 		});
//
// 		if (!result.success) {
// 			return result;
// 		}
//
// 		// 转换为树形结构
// 		const items = (result.data || []).map((item) => ({
// 			title: item.name,
// 			value: item.id,
// 			key: item.id,
// 			parentId: item.parentId,
// 		}));
//
// 		const tree = nb.pubfn.tree.arrayToTree(items, {
// 			id: 'value',
// 			parentId: 'parentId',
// 			children: 'children',
// 		});
//
// 		// 可选：添加根节点选项
// 		if (includeRootOption) {
// 			tree.unshift({
// 				title: 'Root',
// 				value: null,
// 				key: 'root',
// 			});
// 		}
//
// 		return {
// 			success: true,
// 			data: tree,
// 		};
// 	},
// 	{ skipLog: true }
// );

/**
 * 切换启用/禁用状态
 */
// export const toggle{RESOURCE_LABEL}StatusAction = wrapAction(
// 	'sysToggle{RESOURCE_LABEL}Status',
// 	async ({ id, enable }, ctx) => {
// 		if (!id) {
// 			return { success: false, error: 'ID is required' };
// 		}
//
// 		const result = await crudActions._dao.update(id, { enable: Boolean(enable) });
// 		return result;
// 	}
// );

/**
 * 批量更新状态
 */
// export const batchToggle{RESOURCE_LABEL}StatusAction = wrapAction(
// 	'sysBatchToggle{RESOURCE_LABEL}Status',
// 	async ({ ids, enable }, ctx) => {
// 		if (!nb.pubfn.isArray(ids) || ids.length === 0) {
// 			return { success: false, error: 'IDs array is required' };
// 		}
//
// 		const result = await crudActions._dao.batchUpdate(ids, { enable: Boolean(enable) });
// 		return result;
// 	}
// );

/**
 * 公开接口示例（无需登录）
 */
// export const pubGet{RESOURCE_LABEL}ListAction = wrapAction(
// 	'pubGet{RESOURCE_LABEL}List',
// 	async (params, ctx) => {
// 		// 只返回启用的记录
// 		const result = await crudActions._dao.getList({
// 			...params,
// 			whereJson: { enable: true },
// 		});
// 		return result;
// 	},
// 	{ skipLog: true }
// );

/**
 * 需要登录的接口示例（前台用户）
 */
// export const authGet{RESOURCE_LABEL}DetailAction = wrapAction(
// 	'authGet{RESOURCE_LABEL}Detail',
// 	async ({ id }, ctx) => {
// 		const { userId } = ctx;  // 自动注入用户ID
//
// 		const result = await crudActions._dao.getDetail(id);
// 		if (!result.success) {
// 			return result;
// 		}
//
// 		// 可以根据用户ID做额外的权限检查
// 		// if (result.data.userId !== userId) {
// 		// 	return { success: false, error: 'Access denied' };
// 		// }
//
// 		return result;
// 	}
// );
