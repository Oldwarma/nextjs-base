/**
 * 后台管理系统已知页面路径配置
 * 用于 PageAccessGuard 判断页面是否存在
 * 
 * 注意：
 * 1. 这个列表只包含静态路由
 * 2. 动态路由需要在 isKnownPage 函数中单独处理
 * 3. 添加新页面后需要更新此列表
 */

export const ADMIN_PAGES = [
	// Dashboard
	'/admin',

	// RBAC 管理
	'/admin/rbac/users',
	'/admin/rbac/roles',
	'/admin/rbac/menus',
	'/admin/rbac/permissions',

	// 财务管理
	'/admin/finance/credits',
	'/admin/finance/packages',

	// 系统管理
	'/admin/system/settings',
	'/admin/system/usage',
	'/admin/system/action_logs',
	'/admin/system/login_logs',
	'/admin/system/assets',

	// CMS
	'/admin/cms/post',

	// 示例页面
	'/admin/example',
	'/admin/example/data-table/data-table-basic',
	'/admin/example/data-table/data-table-permission',
	'/admin/examples/protected-page-example',
];

/**
 * 动态路由模式
 * 用于匹配带参数的路由，如 /admin/users/[id]
 */
export const DYNAMIC_PAGE_PATTERNS = [
	// 示例：/admin/rbac/users/edit/xxx
	// /^\/admin\/rbac\/users\/edit\/[a-zA-Z0-9_-]+$/,
	
	// 可以根据需要添加更多动态路由模式
];

/**
 * 检查路径是否是已知存在的页面
 * @param {string} pathname - 当前路径
 * @returns {boolean} 是否是已知页面
 */
export function isKnownPage(pathname) {
	// 1. 精确匹配静态路由
	if (ADMIN_PAGES.includes(pathname)) {
		return true;
	}

	// 2. 匹配动态路由模式
	for (const pattern of DYNAMIC_PAGE_PATTERNS) {
		if (pattern.test(pathname)) {
			return true;
		}
	}

	// 3. 未匹配到任何已知页面
	return false;
}
