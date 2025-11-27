'use server';

import { selects } from '@/lib/database/db-api';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';

/**
 * 获取上传文件列表
 * 
 * @param {Object} params - 查询参数
 * @param {number} params.pageIndex - 页码（从1开始）
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.search - 搜索关键词
 * @param {string} params.type - 文件类型筛选
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function getUploadList({
	pageIndex = 1,
	pageSize = 20,
	search = '',
	type = 'all',
} = {}) {
	try {
		// 验证登录
		const session = await auth.api.getSession({
			headers: await headers(),
		});
		
		if (!session?.user) {
			return { success: false, error: 'Unauthorized' };
		}
		
		// 构建查询条件
		const whereJson = {};
		
		// 搜索文件名
		if (search) {
			whereJson.originalName = { $regex: search, $options: 'i' };
		}
		
		// 类型筛选
		if (type && type !== 'all') {
			if (type === 'image') {
				// image 和 images 类型都算图片
				whereJson.type = { $in: ['image', 'images'] };
			} else {
				whereJson.type = type;
			}
		}
		
		// 使用 selects 方法查询
		const result = await selects({
			dbName: 'uploads',
			whereJson,
			sortJson: { createdAt: -1 },
			pageIndex,
			pageSize,
			getCount: true,
		});
		
		return {
			success: true,
			data: result.rows,
			total: result.total,
			pageIndex: result.pageIndex,
			pageSize: result.pageSize,
			totalPages: result.totalPages,
			hasMore: result.hasMore,
		};
	} catch (error) {
		console.error('getUploadList error:', error);
		return { success: false, error: error.message };
	}
}

