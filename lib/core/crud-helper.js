/**
 * CRUD Helper - 快速创建 CRUD Actions
 * 
 * 基于 wrapAction + 命名约定，自动生成带权限的 CRUD 操作
 * 
 * ## 使用方式
 * 
 * ```javascript
 * import { createCrudActions } from '@/lib/core/crud-helper';
 * 
 * const crud = createCrudActions({
 *   modelName: 'user',  // Prisma 模型名（小写单数）
 *   // ... 其他 BaseDAO 配置
 * });
 * 
 * // 导出（自动带 sys 前缀，需要后台权限）
 * export const sysGetUserList = crud.getList;
 * export const sysCreateUser = crud.create;
 * export const sysUpdateUser = crud.update;
 * export const sysDeleteUser = crud.delete;
 * ```
 */

import { BaseDAO } from '@/app/(admin)/actions/dao/base';
import { wrapAction } from './action-wrapper';
import nb from '@/lib/function';

/**
 * 将字符串转换为 PascalCase（单数形式）
 */
function pascalCase(str) {
	let result = str
		.replace(/[_-](.)/g, (_, char) => char.toUpperCase())
		.replace(/^(.)/, (_, char) => char.toUpperCase());
	
	// 复数 -> 单数
	if (result.endsWith('s') && !result.endsWith('ss')) {
		if (result.endsWith('ies')) {
			result = result.slice(0, -3) + 'y';
		} else if (result.endsWith('ses') || result.endsWith('xes') || result.endsWith('zes')) {
			result = result.slice(0, -2);
		} else {
			result = result.slice(0, -1);
		}
	}
	
	return result;
}

/**
 * 创建 CRUD Actions
 * 
 * 生成的 action 名称格式：sys{Action}{Resource}
 * 例如：sysGetUserList, sysCreateUser, sysUpdateUser, sysDeleteUser
 * 
 * @param {Object} config - BaseDAO 配置
 * @param {Object} options - 可选配置
 * @param {String} options.prefix - 权限前缀（默认 'sys'）
 * @param {Boolean} options.enableBatch - 启用批量操作（默认 true）
 * @returns {Object} CRUD Actions
 */
export function createCrudActions(config, options = {}) {
	const {
		prefix = 'sys',
		enableBatch = true,
	} = options;

	const dao = new BaseDAO(config);
	const resource = pascalCase(config.modelName || 'resource');

	return {
		// 获取列表
		getList: wrapAction(`${prefix}Get${resource}List`, async (params, ctx) => {
			return await dao.getList(params);
		}, { skipLog: false }),

		// 获取详情
		getDetail: wrapAction(`${prefix}Get${resource}Detail`, async (params, ctx) => {
			// 支持直接传 id 字符串或 { id } 对象
			const id = nb.pubfn.isString(params) ? params : params?.id;
			if (!id) {
				return { success: false, error: 'ID is required' };
			}
			return await dao.getDetail(id);
		}, { skipLog: false }),

		// 创建
		create: wrapAction(`${prefix}Create${resource}`, async (data, ctx) => {
			return await dao.create({ ...data, userId: ctx.userId });
		}),

		// 更新
		update: wrapAction(`${prefix}Update${resource}`, async (params, ctx) => {
			const { id, ...data } = params || {};
			if (!id) {
				return { success: false, error: 'ID is required for update' };
			}
			return await dao.update(id, data);
		}),

		// 删除
		delete: wrapAction(`${prefix}Delete${resource}`, async (params, ctx) => {
			// 支持直接传 id 字符串或 { id } 对象
			const id = nb.pubfn.isString(params) ? params : params?.id;
			if (!id) {
				return { success: false, error: 'ID is required for delete' };
			}
			return await dao.delete(id);
		}),

		// 批量操作
		...(enableBatch && {
			batchUpdate: wrapAction(`${prefix}BatchUpdate${resource}`, async (params, ctx) => {
				const { ids, data } = params;
				return await dao.batchUpdate(ids, data);
			}),

			batchDelete: wrapAction(`${prefix}BatchDelete${resource}`, async (params, ctx) => {
				const { ids } = params;
				return await dao.batchDelete(ids);
			}),
		}),

		// DAO 实例
		_dao: dao,
	};
}

/**
 * 创建只读 Actions（仅查询）
 */
export function createReadOnlyActions(config, options = {}) {
	const { prefix = 'sys' } = options;
	const dao = new BaseDAO(config);
	const resource = pascalCase(config.modelName || 'resource');

	return {
		getList: wrapAction(`${prefix}Get${resource}List`, async (params) => {
			return await dao.getList(params);
		}, { skipLog: true }),

		getDetail: wrapAction(`${prefix}Get${resource}Detail`, async (id) => {
			return await dao.getDetail(id);
		}, { skipLog: true }),

		_dao: dao,
	};
}

/**
 * 扩展 CRUD Actions
 */
export function extendCrudActions(crudActions, extensions) {
	return { ...crudActions, ...extensions };
}

// 向后兼容
export const createSimpleCrudActions = (config) => createCrudActions(config, { enableBatch: false });
export const createCrudActionsWithHooks = createCrudActions; // hooks 应该在 config 中配置
