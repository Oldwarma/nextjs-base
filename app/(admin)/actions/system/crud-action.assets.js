'use server';

import { prisma } from '@/lib/database/prisma';
import { deleteFile } from '@/lib/upload/upload-service';
import { wrapAction } from '@/lib/core/action-wrapper';
import nb from '@/lib/function';

/**
 * 素材管理 Actions（登录用户可用，RBAC 放宽）
 * - 列表/详情/更新/删除只需登录
 * - 非 admin 仅能访问/管理自己上传的文件
 */
/**
 * 登录后即可访问的素材列表
 * 非 admin 只能看到自己上传的文件
 */
export const getList = wrapAction('authGetAssetList', async (params = {}, ctx) => {
	const { userId, isAdmin } = ctx;
	if (!userId) {
		return { success: false, error: 'Unauthorized' };
	}

	const pageIndex = Number(params.pageIndex) || 1;
	const pageSize = Number(params.pageSize) || 20;
	const whereJson = params.whereJson || {};

	const where = { ...whereJson };
	if (!isAdmin) {
		where.userId = userId;
	}

	const [data, total] = await Promise.all([
		prisma.asset.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			skip: (pageIndex - 1) * pageSize,
			take: pageSize,
		}),
		prisma.asset.count({ where }),
	]);

	return {
		success: true,
		data,
		total,
		pageIndex,
		pageSize,
	};
});

/**
 * 获取素材详情（非 admin 只能查看自己的文件）
 */
export const getDetail = wrapAction('authGetAssetDetail', async (params, ctx) => {
	const { userId, isAdmin } = ctx;
	const id = nb.pubfn.isString(params) ? params : params?.id;

	if (!id) {
		return { success: false, error: 'ID is required' };
	}

	const asset = await prisma.asset.findUnique({ where: { id } });
	if (!asset) {
		return { success: false, error: 'File not found' };
	}

	if (!isAdmin && asset.userId && asset.userId !== userId) {
		return { success: false, error: 'Permission denied' };
	}

	return { success: true, data: asset };
});

/**
 * 更新素材信息（非 admin 只能更新自己的文件）
 */
export const update = wrapAction('authUpdateAsset', async (params, ctx) => {
	const { userId, isAdmin } = ctx;
	const { id, ...data } = params || {};

	if (!id) {
		return { success: false, error: 'ID is required for update' };
	}

	const asset = await prisma.asset.findUnique({ where: { id } });
	if (!asset) {
		return { success: false, error: 'File not found' };
	}

	if (!isAdmin && asset.userId && asset.userId !== userId) {
		return { success: false, error: 'Permission denied' };
	}

	const payload = {};
	if (data.originalName !== undefined) payload.originalName = data.originalName;
	if (data.remark !== undefined) payload.remark = data.remark;

	await prisma.asset.update({
		where: { id },
		data: payload,
	});

	return { success: true };
});

/**
 * 删除素材（同时删除 R2 文件）
 * 支持直接传入 id 字符串或 { id }
 */
export const remove = wrapAction('authDeleteAsset', async (params, ctx) => {
	const { userId, isAdmin } = ctx;
	const id = nb.pubfn.isString(params) ? params : params?.id;

	if (!id) {
		return { success: false, error: 'ID is required' };
	}
	
	const file = await prisma.asset.findUnique({ where: { id } });
	if (!file) {
		return { success: false, error: 'File not found' };
	}

	if (!isAdmin && file.userId && file.userId !== userId) {
		return { success: false, error: 'Permission denied' };
	}
	
	// 删除 R2 文件和数据库记录（管理员可以删除任何文件）
	const result = await deleteFile(file.url || file.key, userId, { isAdmin });
	
	return result;
});

/**
 * 批量删除素材
 */
export const batchDelete = wrapAction('authBatchDeleteAsset', async ({ ids }, ctx) => {
	const { userId, isAdmin } = ctx;
	if (!Array.isArray(ids) || ids.length === 0) {
		return { success: false, error: 'IDs are required' };
	}
	
	const errors = [];
	let successCount = 0;
	
	for (const id of ids) {
		try {
			if (!id) {
				errors.push('Invalid id: empty');
				continue;
			}
			const file = await prisma.asset.findUnique({ where: { id } });
			if (!file) {
				errors.push(`${id}: File not found`);
				continue;
			}

			if (!isAdmin && file.userId && file.userId !== userId) {
				errors.push(`${file.originalName}: Permission denied`);
				continue;
			}

			const result = await deleteFile(file.url || file.key, userId, { isAdmin });
			if (result.success) {
				successCount++;
			} else {
				errors.push(`${file.originalName}: ${result.error}`);
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
