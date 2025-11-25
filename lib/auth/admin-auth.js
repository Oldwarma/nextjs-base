import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';

/**
 * 检查用户是否有后台访问权限（用于页面/Layout）
 * 条件：admin 角色 OR (user 角色 + isBackendAllowed = true)
 * 如果没有权限，重定向到登录页或首页
 */
export async function checkBackendAccess() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	// 检查是否登录
	if (!session?.user) {
		redirect('/en/login?error=unauthorized');
	}

	const { role, isBackendAllowed } = session.user;

	// 检查是否有后台访问权限
	// 1. admin 角色自动通过
	// 2. user 角色需要 isBackendAllowed = true
	if (role !== 'admin' && !isBackendAllowed) {
		redirect('/en?error=forbidden');
	}

	// 更新 lastLoginAt（后台运行，不阻塞）
	if (session.user.id) {
		// 使用 dynamic import 避免循环依赖
		import('@/lib/database/mongodb')
			.then(({ getCollection }) => getCollection('users'))
			.then((usersCollection) =>
				usersCollection.updateOne({ id: session.user.id }, { $set: { lastLoginAt: new Date() } })
			)
			.catch((err) => console.error('Failed to update lastLoginAt:', err));
	}

	return session;
}

/**
 * 检查后台访问权限（用于 Server Actions）
 * 返回验证结果对象，不会重定向
 * 
 * 返回格式：
 * - { hasAccess: true, isAdmin: true/false, userId, user }
 * - { hasAccess: false, error }
 */
export async function checkBackendAccessAction() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return { hasAccess: false, isAdmin: false, error: 'Unauthorized' };
	}

	const { role, isBackendAllowed } = session.user;
	const isAdmin = role === 'admin';

	// 检查后台访问权限
	if (!isAdmin && !isBackendAllowed) {
		return { 
			hasAccess: false, 
			isAdmin: false, 
			error: 'Forbidden: Backend access not allowed' 
		};
	}

	return { 
		hasAccess: true, 
		isAdmin, 
		userId: session.user.id, 
		user: session.user 
	};
}

/**
 * 仅检查是否为 admin 角色（用于需要真正 admin 权限的操作）
 * 如 RBAC 配置、系统设置等
 */
export async function checkIsAdmin() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	// 检查是否登录
	if (!session?.user) {
		redirect('/en/login?error=unauthorized');
	}

	// 必须是 admin 角色
	if (session.user.role !== 'admin') {
		redirect('/en?error=forbidden&reason=admin_only');
	}

	return session;
}

/**
 * 检查是否为 admin 角色（用于 Server Actions）
 * 返回验证结果对象，不会重定向
 */
export async function checkIsAdminAction() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return { isAdmin: false, error: 'Unauthorized' };
	}

	if (session.user.role !== 'admin') {
		return { isAdmin: false, error: 'Forbidden: Admin role required' };
	}

	return { isAdmin: true, userId: session.user.id, user: session.user };
}

// ========================================
// 向后兼容的别名函数
// ========================================

/**
 * @deprecated 使用 checkBackendAccess() 代替
 * 为了向后兼容保留
 */
export async function checkAdmin() {
	return await checkBackendAccess();
}

/**
 * @deprecated 使用 checkBackendAccessAction() 代替
 * 为了向后兼容保留，但返回格式略有不同
 */
export async function checkAdminAction() {
	const result = await checkBackendAccessAction();
	
	// 转换为旧格式以兼容现有代码
	if (!result.hasAccess) {
		return { isAdmin: false, error: result.error };
	}
	
	return { 
		isAdmin: result.isAdmin, 
		userId: result.userId, 
		user: result.user 
	};
}

/**
 * 获取后台用户 session
 * 确保用户有后台访问权限
 */
export async function getAdminSession() {
	return await checkBackendAccess();
}

/**
 * 检查用户是否有管理员权限（不重定向，返回 boolean）
 */
export async function isAdmin() {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		return session?.user?.role === 'admin';
	} catch (error) {
		return false;
	}
}

/**
 * 检查用户是否有后台访问权限（不重定向，返回 boolean）
 */
export async function hasBackendAccess() {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) return false;

		const { role, isBackendAllowed } = session.user;
		return role === 'admin' || isBackendAllowed === true;
	} catch (error) {
		return false;
	}
}

