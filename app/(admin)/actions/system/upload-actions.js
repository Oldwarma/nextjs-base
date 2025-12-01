'use server';

import { prisma } from '@/lib/database/prisma';
import { wrapAction } from '@/lib/core/action-wrapper';

/**
 * 获取上传文件列表
 */
export const getUploadList = wrapAction('sysQueryUploadList', async ({
	pageIndex = 1,
	pageSize = 20,
	search = '',
	type = 'all',
} = {}, ctx) => {
	const where = {};

	// 搜索文件名
	if (search) {
		where.originalName = { contains: search, mode: 'insensitive' };
	}

	// 类型筛选
	if (type && type !== 'all') {
		if (type === 'image') {
			where.type = { in: ['image', 'images'] };
		} else {
			where.type = type;
		}
	}

	const skip = (pageIndex - 1) * pageSize;

	const [rows, total] = await Promise.all([
		prisma.asset.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			skip,
			take: pageSize,
		}),
		prisma.asset.count({ where }),
	]);

	return {
		success: true,
		data: rows,
		total,
		pageIndex,
		pageSize,
		totalPages: Math.ceil(total / pageSize) || 1,
		hasMore: pageIndex < Math.ceil(total / pageSize),
	};
}, { skipLog: true });
