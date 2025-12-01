/**
 * Next.js 16 Proxy - 统一拦截器
 * 
 * 功能：
 * 1. 多语言路由处理（next-intl）
 * 2. API 权限自动拦截
 * 
 * ## API 路径约定
 * 
 * | 路径 | 权限 | 说明 |
 * |------|------|------|
 * | /api/pub/* | 公开 | 无需登录 |
 * | /api/auth/* | 登录 | 需要登录 |
 * | /api/sys/* | 后台 | 需要后台权限 |
 * | /api/v1/pub/* | 公开 | 带版本号 |
 * 
 * ## 使用方式
 * 
 * 只需按目录结构创建 API，权限自动生效：
 * 
 * ```
 * app/api/pub/config/route.js      → 公开
 * app/api/auth/user/route.js       → 需要登录
 * app/api/sys/users/route.js       → 需要后台权限
 * ```
 */

import { NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';
import { auth } from '@/lib/auth/auth';

// 多语言中间件
const intlMiddleware = createIntlMiddleware({
	locales,
	defaultLocale,
	localeDetection: true,
	localePrefix: 'always',
});

/**
 * 从路径解析权限级别
 * 
 * 支持任意层级，从最后一级向前查找：
 * - /api/pub/xxx          → public
 * - /api/user/pub/xxx     → public
 * - /api/user/info/pub    → public
 * - /api/v1/user/auth/xxx → auth
 * - /api/sys/xxx          → system
 * - /api/user/sys/admin   → system
 * 
 * 优先级：最后一级 > 前面的层级
 */
function getApiPermissionLevel(pathname) {
	// 排除 better-auth 的路由 /api/auth/[...all]
	// 注意：这个必须放在最前面，因为 /api/auth/* 是 better-auth 专用
	if (/^\/api\/auth\//.test(pathname)) {
		return 'skip';
	}

	// 提取路径段（去掉 /api 前缀）
	const segments = pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
	
	// 从最后一级向前查找权限关键词
	for (let i = segments.length - 1; i >= 0; i--) {
		const segment = segments[i].toLowerCase();
		
		// 跳过版本号 v1, v2 等
		if (/^v\d+$/.test(segment)) {
			continue;
		}
		
		// 检查权限关键词（使用与 permission-naming.js 相同的规则）
		// pub 开头但不是 publish/publisher 等
		if (/^pub(?![l])/.test(segment)) {
			return 'public';
		}
		
		// auth 开头但不是 author/authenticate 等
		if (/^auth(?![oe])/.test(segment)) {
			return 'auth';
		}
		
		// sys 开头但不是 system 等
		if (/^sys(?![t])/.test(segment)) {
			return 'system';
		}
		
		// admin
		if (segment === 'admin') {
			return 'system';
		}
	}
	
	// 默认需要登录
	return 'auth';
}

export default async function proxy(request) {
	const { pathname } = request.nextUrl;

	// API 路由处理
	if (pathname.startsWith('/api/')) {
		const level = getApiPermissionLevel(pathname);

		// 跳过（better-auth 路由）或公开 API
		if (level === 'skip' || level === 'public') {
			return NextResponse.next();
		}

		// 需要登录的 API
		try {
			const session = await auth.api.getSession({
				headers: request.headers,
			});

			if (!session?.user) {
				return NextResponse.json(
					{ success: false, error: 'Unauthorized: Please login first' },
					{ status: 401 }
				);
			}

			// 后台权限检查
			if (level === 'system') {
				const isAdmin = session.user.role === 'admin';
				const isBackendAllowed = session.user.isBackendAllowed === true;

				// admin 直接通过
				if (isAdmin) {
					// 继续执行
				} else if (isBackendAllowed) {
					// 非 admin 但有后台权限，需要检查 RBAC
					try {
						const { checkUserHasApiPermission } = await import('@/app/(admin)/actions/dao/sys.js');
						
						// 检查 API 权限（支持 METHOD:PATH 和 PATH 两种格式）
						const method = request.method;
						const hasMethodPermission = await checkUserHasApiPermission(
							session.user.id,
							`${method}:${pathname}`
						);
						
						if (!hasMethodPermission) {
							// 再尝试不带方法的路径
							const hasPathPermission = await checkUserHasApiPermission(
								session.user.id,
								pathname
							);
							
							if (!hasPathPermission) {
								return NextResponse.json(
									{ success: false, error: `Forbidden: API '${pathname}' not allowed` },
									{ status: 403 }
								);
							}
						}
					} catch (error) {
						console.error('[Proxy] RBAC check error:', error);
						return NextResponse.json(
							{ success: false, error: 'Permission check failed' },
							{ status: 500 }
						);
					}
				} else {
					// 既不是 admin 也没有后台权限
					return NextResponse.json(
						{ success: false, error: 'Forbidden: Backend access required' },
						{ status: 403 }
					);
				}
			}

			// 将用户信息添加到 headers
			const requestHeaders = new Headers(request.headers);
			requestHeaders.set('x-user-id', session.user.id);
			requestHeaders.set('x-user-role', session.user.role || 'user');
			requestHeaders.set('x-is-admin', String(session.user.role === 'admin'));

			return NextResponse.next({
				request: {
					headers: requestHeaders,
				},
			});
		} catch (error) {
			console.error('[Proxy] Auth error:', error);
			return NextResponse.json(
				{ success: false, error: 'Authentication failed' },
				{ status: 401 }
			);
		}
	}

	// 非 API 路由，使用多语言中间件
	return intlMiddleware(request);
}

export const config = {
	matcher: [
		// API 路由
		'/api/:path*',
		// 多语言路由（排除 api、admin、静态文件等）
		'/((?!admin|_next|_vercel|.*\\..*).*)',
		'/',
	],
};
