import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
	// 支持的语言列表
	locales,

	// 默认语言
	defaultLocale,

	// 语言检测策略
	localeDetection: true,

	// 语言前缀策略：总是显示语言前缀（推荐）
	localePrefix: 'always',
});

export const config = {
	// 匹配所有路径，除了以下路径：
	// - api 路由
	// - admin 路由（管理后台不使用多语言）
	// - _next 静态文件
	// - favicon.ico
	// - 其他静态资源
	matcher: [
		// 匹配除了 api 和 admin 之外的所有路径
		'/((?!api|admin|_next|_vercel|.*\\..*).*)',
		// 匹配根路径
		'/',
	],
};

