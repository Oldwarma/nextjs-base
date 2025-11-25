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
 * 将字符串转换为 PascalCase（单数形式）
 * @param {String} str - 输入字符串
 * @returns {String} PascalCase 字符串（单数）
 */
function pascalCase(str) {
	// 先转换为 PascalCase
	let result = str
		.replace(/[_-](.)/g, (_, char) => char.toUpperCase())
		.replace(/^(.)/, (_, char) => char.toUpperCase());
	
	// 处理常见的复数 -> 单数转换
	// permissions -> Permission
	// users -> User
	// roles -> Role
	// menus -> Menu
	if (result.endsWith('s')) {
		// 特殊情况处理
		if (result.endsWith('ies')) {
			// categories -> Category
			result = result.slice(0, -3) + 'y';
		} else if (result.endsWith('ses') || result.endsWith('xes') || result.endsWith('zes')) {
			// classes -> Class, boxes -> Box
			result = result.slice(0, -2);
		} else {
			// 一般情况：去掉末尾的 s
			result = result.slice(0, -1);
		}
	}
	
	return result;
}

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
		 * @param {String} id - 记录 ID
		 * @returns {Promise<Object>} { success, data }
		 */
		getDetail: wrapQueryAction(resourceType, async (id) => {
			// BaseDAO.getDetail 接收一个参数：id（字符串）
			return await dao.getDetail(id);
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
	}, {
		permissionId: `create${pascalCase(resourceType)}Action`,
	}),

	/**
	 * 更新
	 * @param {String} id - 记录 ID
	 * @param {Object} data - 更新数据
	 * @returns {Promise<Object>} { success, data }
	 */
	update: wrapAdminAction('update', resourceType, async (id, data, context) => {
		// SmartCrudPage 传递两个参数：id 和 data
		// BaseDAO.update 接收两个参数：(id, data)
		return await dao.update(id, data);
	}, {
		permissionId: `update${pascalCase(resourceType)}Action`,
	}),

	/**
	 * 删除
	 * @param {String} id - 记录 ID
	 * @returns {Promise<Object>} { success }
	 */
	delete: wrapAdminAction('delete', resourceType, async (id, context) => {
		return await dao.delete(id);
	}, {
		permissionId: `delete${pascalCase(resourceType)}Action`,
	}),

		/**
		 * 批量更新（可选）
		 * @param {Object} params - { ids, data }
		 * @returns {Promise<Object>} { success, modifiedCount }
		 */
		...(enableBatchUpdate && {
			batchUpdate: wrapBatchAction('batch_update', resourceType, async (params, context) => {
				const { ids, data } = params;
				// BaseDAO.batchUpdate 接收两个参数：(ids, data)
				return await dao.batchUpdate(ids, data);
			}),
		}),

		/**
		 * 批量删除（可选）
		 * @param {Object} params - { ids }
		 * @returns {Promise<Object>} { success, deletedCount }
		 */
		...(enableBatchDelete && {
			batchDelete: wrapBatchAction('batch_delete', resourceType, async (params, context) => {
				const { ids } = params;
				// BaseDAO.batchDelete 接收一个参数：ids（数组）
				return await dao.batchDelete(ids);
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

