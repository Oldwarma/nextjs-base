'use server';

import { createCrudActions } from '@/lib/core/crud-helper';
import { deleteFile } from '@/lib/upload/upload-service';
import { wrapAdminAction } from '@/lib/core/action-wrapper';

/**
 * 素材管理 CRUD Actions
 *
 * 权限配置说明：
 * 在后台 Permission 管理中，配置 actions 字段使用以下模式：
 *
 * 1. 查询操作（getList, getDetail）:
 *    - `queryAssetAction` - 精确匹配
 *    - `query*Action` - 匹配所有查询操作
 *
 * 2. 更新操作:
 *    - `updateAssetAction` - 精确匹配
 *
 * 3. 删除操作:
 *    - `deleteAssetAction` - 单个删除
 *    - `batchDeleteAssetAction` - 批量删除
 *    - `delete*AssetAction` - 匹配所有删除操作
 *
 * 4. 全部素材操作:
 *    - `*AssetAction` - 匹配所有素材相关操作
 */
const crudActions = createCrudActions({
	collectionName: 'assets',
	resourceType: 'asset', // 使用单数形式，生成的 permissionId 为 xxxAssetAction
	primaryKey: 'id', // 使用 UUID 作为主键

	// 可创建字段（素材一般不支持手动创建，通过上传接口）
	fields: {
		creatable: [],
		updatable: ['originalName', 'remark'],
		searchable: ['originalName', 'type', 'mimeType'],
	},

	// 查询配置
	query: {
		defaultSort: { createdAt: -1 },
		baseFilter: {},
	},

	// 软删除（素材使用硬删除，因为需要同时删除 R2 文件）
	softDelete: false,
});

/**
 * 获取素材列表
 * permissionId: queryAssetAction
 */
export async function getList(params) {
	return crudActions.getList(params);
}

/**
 * 获取素材详情
 * permissionId: queryAssetAction
 */
export async function getDetail(id) {
	return crudActions.getDetail(id);
}

/**
 * 更新素材信息
 * permissionId: updateAssetAction
 */
export async function update(id, data) {
	return crudActions.update(id, data);
}

/**
 * 删除素材（同时删除 R2 文件）
 * permissionId: deleteAssetAction
 */
export const remove = wrapAdminAction(
	'delete',
	'asset',
	async (id, context) => {
		const { userId, isAdmin } = context;

		// 先获取文件信息
		const detail = await crudActions.getDetail(id);
		if (!detail.success || !detail.data) {
			return { success: false, error: 'File not found' };
		}

		const file = detail.data;

		// 删除 R2 文件和数据库记录（管理员可以删除任何文件）
		const result = await deleteFile(file.url || file.key, userId, { isAdmin });

		return result;
	},
	{
		permissionId: 'deleteAssetAction', // 明确指定，与 crudActions.delete 保持一致
	}
);

/**
 * 批量删除素材
 * permissionId: batchDeleteAssetAction
 */
export const batchDelete = wrapAdminAction(
	'batch_delete',
	'asset',
	async ({ ids }, context) => {
		const { userId, isAdmin } = context;

		const errors = [];
		let successCount = 0;

		for (const id of ids) {
			try {
				const detail = await crudActions.getDetail(id);
				if (detail.success && detail.data) {
					const file = detail.data;
					// 管理员可以删除任何文件
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
	},
	{
		permissionId: 'batchDeleteAssetAction', // 明确指定
	}
);
