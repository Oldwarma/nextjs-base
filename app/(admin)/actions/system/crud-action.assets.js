'use server';

import { createCrudActions } from '@/lib/core/crud-helper';

/**
 * 素材管理 CRUD Actions
 */
const crudActions = createCrudActions({
	collectionName: 'uploads',
	resourceType: 'upload',
	primaryKey: 'id',  // 使用 UUID 作为主键
	
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

// 导出标准 CRUD 操作
export async function getList(params) {
	return crudActions.getList(params);
}

export async function getDetail(id) {
	return crudActions.getDetail(id);
}

export async function update(id, data) {
	return crudActions.update(id, data);
}

// 删除操作需要特殊处理，同时删除 R2 文件
import { deleteFile } from '@/lib/upload/upload-service';
import { wrapAdminAction } from '@/lib/core/action-wrapper';

export const remove = wrapAdminAction('delete', 'upload', async (id, context) => {
	const { userId } = context;
	
	// 先获取文件信息
	const detail = await crudActions.getDetail(id);
	if (!detail.success || !detail.data) {
		return { success: false, error: 'File not found' };
	}
	
	const file = detail.data;
	
	// 删除 R2 文件和数据库记录
	const result = await deleteFile(file.url || file.key, userId);
	
	return result;
});

// 批量删除
export const batchDelete = wrapAdminAction('batch_delete', 'upload', async ({ ids }, context) => {
	const { userId } = context;
	
	const errors = [];
	let successCount = 0;
	
	for (const id of ids) {
		try {
			const detail = await crudActions.getDetail(id);
			if (detail.success && detail.data) {
				const file = detail.data;
				const result = await deleteFile(file.url || file.key, userId);
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

