'use server';

/**
 * 测试用 Actions - 演示权限命名约定
 * 
 * wrapAction 会在最后一个参数添加 context
 * handler 签名：(params, context) => result
 * 
 * 注意：如果没有 params，也要写成 (_, ctx) 或 (params, ctx)
 */

import { wrapAction } from '@/lib/core/action-wrapper';

/**
 * 公开 Action - 无需登录
 */
export const pubGetServerTime = wrapAction('pubGetServerTime', async (_, ctx) => {
	return {
		success: true,
		data: {
			time: new Date().toISOString(),
			message: '公开 Action 访问成功（无需登录）',
			userId: ctx?.userId || null,
		},
	};
});

/**
 * 需要登录的 Action
 */
export const authGetUserInfo = wrapAction('authGetUserInfo', async (_, ctx) => {
	const { userId, user, isAdmin } = ctx;
	
	return {
		success: true,
		data: {
			userId,
			email: user?.email,
			name: user?.name,
			role: user?.role,
			isAdmin,
			message: '需要登录的 Action 访问成功',
		},
	};
});

/**
 * 后台 Action - 需要后台权限
 */
export const sysGetSystemInfo = wrapAction('sysGetSystemInfo', async (_, ctx) => {
	const { userId, isAdmin } = ctx;
	
	return {
		success: true,
		data: {
			userId,
			isAdmin,
			nodeVersion: process.version,
			platform: process.platform,
			uptime: process.uptime(),
			message: '后台 Action 访问成功（需要后台权限）',
		},
	};
});
