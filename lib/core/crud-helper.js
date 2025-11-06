/**
 * CRUD Helper - CRUD 操作辅助类
 * 
 * 核心设计理念：
 * - 封装 BaseDAO，提供更简洁的 API
 * - 自动集成 action-wrapper 的权限+日志功能
 * - 一行代码创建完整的 CRUD Actions
 * 
 * 使用方式：
 * ```javascript
 * import { createCrudActions } from '@/lib/core/crud-helper';
 * import { couponCrudConfig } from './configs/coupon-crud.config';
 * 
 * // 一行代码创建所有 CRUD Actions
 * const crudActions = createCrudActions(couponCrudConfig);
 * 
 * // 导出
 * export const getCouponList = crudActions.getList;
 * export const createCoupon = crudActions.create;
 * export const updateCoupon = crudActions.update;
 * export const deleteCoupon = crudActions.delete;
 * ```
 */

import { BaseDAO } from '@/app/(admin)/actions/dao/base';
import { wrapAdminAction, wrapBatchAction, wrapQueryAction } from './action-wrapper';

/**
 * 创建完整的 CRUD Actions
 * 
 * @param {Object} config - CRUD 配置对象（BaseDAO 配置格式）
 * @param {Object} options - 可选配置
 * @param {Boolean} options.enableBatchUpdate - 是否启用批量更新（默认 true）
 * @param {Boolean} options.enableBatchDelete - 是否启用批量删除（默认 true）
 * @param {Object} options.customActions - 自定义额外的 Actions
 * @returns {Object} CRUD Actions 对象
 */
export function createCrudActions(config, options = {}) {
	const {
		enableBatchUpdate = true,
		enableBatchDelete = true,
		customActions = {},
	} = options;

	// 创建 DAO 实例
	const dao = new BaseDAO(config);
	const resourceType = config.collectionName || config.dbName || 'resource';

	// 返回包装后的 CRUD Actions
	return {
		/**
		 * 获取列表（分页、搜索、排序）
		 * @param {Object} params - { pageIndex, pageSize, search, filters, sort }
		 * @returns {Promise<Object>} { success, data, total }
		 */
		getList: wrapQueryAction(resourceType, async (params) => {
			return await dao.getList(params);
		}),

		/**
		 * 获取详情
		 * @param {Object} params - { id }
		 * @returns {Promise<Object>} { success, data }
		 */
		getDetail: wrapQueryAction(resourceType, async (params) => {
			return await dao.getDetail(params);
		}),

		/**
		 * 创建
		 * @param {Object} params - { data }
		 * @returns {Promise<Object>} { success, data }
		 */
		create: wrapAdminAction('create', resourceType, async (params, context) => {
			return await dao.create({
				...params,
				userId: context.userId, // 传递 userId
			});
		}),

		/**
		 * 更新
		 * @param {Object} params - { id, data }
		 * @returns {Promise<Object>} { success, data }
		 */
		update: wrapAdminAction('update', resourceType, async (params, context) => {
			return await dao.update({
				...params,
				userId: context.userId,
			});
		}),

		/**
		 * 删除
		 * @param {Object} params - { id }
		 * @returns {Promise<Object>} { success }
		 */
		delete: wrapAdminAction('delete', resourceType, async (params, context) => {
			return await dao.delete({
				...params,
				userId: context.userId,
			});
		}),

		/**
		 * 批量更新（可选）
		 * @param {Object} params - { ids, data }
		 * @returns {Promise<Object>} { success, modifiedCount }
		 */
		...(enableBatchUpdate && {
			batchUpdate: wrapBatchAction('batch_update', resourceType, async (params, context) => {
				return await dao.batchUpdate({
					...params,
					userId: context.userId,
				});
			}),
		}),

		/**
		 * 批量删除（可选）
		 * @param {Object} params - { ids }
		 * @returns {Promise<Object>} { success, deletedCount }
		 */
		...(enableBatchDelete && {
			batchDelete: wrapBatchAction('batch_delete', resourceType, async (params, context) => {
				return await dao.batchDelete({
					...params,
					userId: context.userId,
				});
			}),
		}),

		// 合并自定义 Actions
		...customActions,

		// 暴露原始 DAO 实例（高级用法）
		_dao: dao,
	};
}

/**
 * 快速创建简化版 CRUD Actions（仅基础 4 个操作）
 * 
 * @param {Object} config - CRUD 配置对象
 * @returns {Object} 简化的 CRUD Actions
 */
export function createSimpleCrudActions(config) {
	return createCrudActions(config, {
		enableBatchUpdate: false,
		enableBatchDelete: false,
	});
}

/**
 * 创建只读 Actions（仅 getList 和 getDetail）
 * 用于日志查看、统计报表等场景
 * 
 * @param {Object} config - CRUD 配置对象
 * @returns {Object} 只读 Actions
 */
export function createReadOnlyActions(config) {
	const dao = new BaseDAO(config);
	const resourceType = config.collectionName || config.dbName || 'resource';

	return {
		getList: wrapQueryAction(resourceType, async (params) => {
			return await dao.getList(params);
		}),

		getDetail: wrapQueryAction(resourceType, async (params) => {
			return await dao.getDetail(params);
		}),

		_dao: dao,
	};
}

/**
 * 扩展 CRUD Actions
 * 在现有 CRUD Actions 基础上添加自定义方法
 * 
 * @param {Object} crudActions - 基础 CRUD Actions
 * @param {Object} extensions - 扩展方法
 * @returns {Object} 扩展后的 Actions
 * 
 * @example
 * const crudActions = createCrudActions(config);
 * 
 * export default extendCrudActions(crudActions, {
 *   // 添加自定义 Action
 *   async activate(params) {
 *     return wrapAdminAction('activate', 'coupon', async () => {
 *       // 自定义逻辑
 *     })(params);
 *   },
 * });
 */
export function extendCrudActions(crudActions, extensions) {
	return {
		...crudActions,
		...extensions,
	};
}

/**
 * 创建带钩子的 CRUD Actions
 * 在创建/更新/删除前后执行自定义逻辑
 * 
 * @param {Object} config - CRUD 配置对象
 * @param {Object} hooks - 钩子函数
 * @param {Function} hooks.beforeCreate - 创建前钩子
 * @param {Function} hooks.afterCreate - 创建后钩子
 * @param {Function} hooks.beforeUpdate - 更新前钩子
 * @param {Function} hooks.afterUpdate - 更新后钩子
 * @param {Function} hooks.beforeDelete - 删除前钩子
 * @param {Function} hooks.afterDelete - 删除后钩子
 * @returns {Object} 带钩子的 CRUD Actions
 * 
 * @example
 * const crudActions = createCrudActionsWithHooks(config, {
 *   beforeCreate: async (params, context) => {
 *     // 数据验证、预处理
 *     console.log('Creating...', params);
 *   },
 *   afterCreate: async (result, context) => {
 *     // 发送通知、同步数据
 *     console.log('Created:', result);
 *   },
 * });
 */
export function createCrudActionsWithHooks(config, hooks = {}) {
	const dao = new BaseDAO(config);
	const resourceType = config.collectionName || config.dbName || 'resource';

	const {
		beforeCreate,
		afterCreate,
		beforeUpdate,
		afterUpdate,
		beforeDelete,
		afterDelete,
	} = hooks;

	return {
		getList: wrapQueryAction(resourceType, async (params) => {
			return await dao.getList(params);
		}),

		getDetail: wrapQueryAction(resourceType, async (params) => {
			return await dao.getDetail(params);
		}),

		create: wrapAdminAction('create', resourceType, async (params, context) => {
			return await dao.create({ ...params, userId: context.userId });
		}, {
			beforeExecute: beforeCreate,
			afterExecute: afterCreate,
		}),

		update: wrapAdminAction('update', resourceType, async (params, context) => {
			return await dao.update({ ...params, userId: context.userId });
		}, {
			beforeExecute: beforeUpdate,
			afterExecute: afterUpdate,
		}),

		delete: wrapAdminAction('delete', resourceType, async (params, context) => {
			return await dao.delete({ ...params, userId: context.userId });
		}, {
			beforeExecute: beforeDelete,
			afterExecute: afterDelete,
		}),

		_dao: dao,
	};
}

