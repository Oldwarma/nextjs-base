/**
 * 后台 API - 测试
 * 
 * 路径：/api/v1/sys/test
 * 权限：需要后台权限（由 proxy 自动检查 RBAC）
 */

import { NextResponse } from 'next/server';
import { getApiContext } from '@/lib/api/api-context';

export async function GET(request) {
	// proxy 已经验证后台权限
	// - admin 直接通过
	// - 非 admin 需要 isBackendAllowed + RBAC 权限
	const { userId, userRole, isAdmin } = getApiContext(request);

	try {
		const data = {
			message: '成功访问后台 API（需要后台权限）',
			userId,
			userRole,
			isAdmin,
			timestamp: new Date().toISOString(),
		};

		return NextResponse.json({ success: true, data });
	} catch (error) {
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		);
	}
}

