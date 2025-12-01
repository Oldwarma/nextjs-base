'use server';

import { createCrudActions } from '@/lib/core/crud-helper';
import { deleteFile } from '@/lib/upload/upload-service';
import { wrapAction } from '@/lib/core/action-wrapper';

/**
 * 素材管理 CRUD Actions
 *
 * 权限配置说明：
 * 在后台 Permission 管理中，配置 actions 字段使用以下模式：
 *
 * 1. 查询操作（getList, getDetail）:
 *    - `sysQueryAsset` - 精确匹配
 *    - `sysQuery*` - 匹配所有查询操作
 *
 * 2. 更新操作:
 *    - `sysUpdateAsset` - 精确匹配
 *
 * 3. 删除操作:
 *    - `sysDeleteAsset` - 单个删除
 *    - `sysBatchDeleteAsset` - 批量删除
 *    - `sysDelete*Asset` - 匹配所有删除操作
 *
 * 4. 全部素材操作:
 *    - `sys*Asset` - 匹配所有素材相关操作
 */
const crudActions = createCrudActions({
	collectionName: 'assets',
	resourceType: 'asset',
	primaryKey: 'id',
	
	fields: {
		creatable: [],
		updatable: ['originalName', 'remark'],
		searchable: ['originalName', 'type', 'mimeType'],
	},
	
	query: {
		defaultSort: { createdAt: -1 },
		baseFilter: {},
	},
	
	softDelete: false,
});

/**
 * 获取素材列表
 */
export async function getList(params) {
	return crudActions.getList(params);
}

/**
 * 获取素材详情
 */
export async function getDetail(id) {
	return crudActions.getDetail(id);
}

/**
 * 更新素材信息
 */
export async function update(id, data) {
	return crudActions.update(id, data);
}

/**
 * 删除素材（同时删除 R2 文件）
 */
export const remove = wrapAction('sysDeleteAsset', async ({ id }, ctx) => {
	const { userId, isAdmin } = ctx;
	
	// 先获取文件信息
	const detail = await crudActions.getDetail(id);
	if (!detail.success || !detail.data) {
		return { success: false, error: 'File not found' };
	}
	
	const file = detail.data;
	
	// 删除 R2 文件和数据库记录（管理员可以删除任何文件）
	const result = await deleteFile(file.url || file.key, userId, { isAdmin });
	
	return result;
});

/**
 * 批量删除素材
 */
export const batchDelete = wrapAction('sysBatchDeleteAsset', async ({ ids }, ctx) => {
	const { userId, isAdmin } = ctx;
	
	const errors = [];
	let successCount = 0;
	
	for (const id of ids) {
		try {
			const detail = await crudActions.getDetail(id);
			if (detail.success && detail.data) {
				const file = detail.data;
				const result = await deleteFile(file.url || file.key, userId, { isAdmin });
				if (result.success) {
					successCount++;
				} else {
					errors.push(`${file.originalName}: ${result.error}`);
				}
			}
		} catch (error) {
			errors.push(`${id}: ${error.message}`);
		}
	}
	
	return {
		success: errors.length === 0,
		deletedCount: successCount,
		errors: errors.length > 0 ? errors : undefined,
	};
});
