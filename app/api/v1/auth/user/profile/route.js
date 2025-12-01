/**
 * 需要登录的 API - 获取用户资料
 * 
 * 路径：/api/v1/auth/user/profile
 * 权限：需要登录（由 proxy 自动检查）
 */

import { NextResponse } from 'next/server';
import { getApiContext } from '@/lib/api/api-context';

export async function GET(request) {
	// proxy 已经验证登录，未登录会返回 401
	// 这里直接获取用户信息
	const { userId, userRole, isAdmin } = getApiContext(request);

	try {
		// 业务逻辑
		const profile = {
			id: userId,
			role: userRole,
			isAdmin,
			message: '成功获取用户资料（需要登录）',
		};

		return NextResponse.json({ success: true, data: profile });
	} catch (error) {
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		);
	}
}
