/**
 * 公开 API - 获取 CMS 列表
 * 
 * 路径：/api/v1/pub/cms/getList
 * 权限：公开（无需登录，由 proxy 自动处理）
 */

import { NextResponse } from 'next/server';

export async function GET(request) {
	// 直接写业务逻辑，不需要权限检查代码！
	// proxy 已经根据路径 /api/v1/pub/* 自动放行
	
	try {
		// 业务逻辑
		const data = {
			list: [
				{ id: 1, title: '文章1' },
				{ id: 2, title: '文章2' },
			],
			total: 2,
			message: '公开 API 访问成功（无需登录）',
		};

		return NextResponse.json({ success: true, data });
	} catch (error) {
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		);
	}
}
