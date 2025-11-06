import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';

/**
 * 检查用户是否为管理员（用于页面/Layout）
 * 如果不是管理员，重定向到登录页
 */
export async function checkAdmin() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	// 检查是否登录
	if (!session?.user) {
		redirect('/en/login?error=unauthorized');
	}

	// 检查角色是否为 admin
	if (session.user.role !== 'admin') {
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
 * 检查管理员权限（用于 Server Actions）
 * 返回验证结果对象，不会重定向
 */
export async function checkAdminAction() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return { isAdmin: false, error: 'Unauthorized' };
	}

	if (session.user.role !== 'admin') {
		return { isAdmin: false, error: 'Forbidden: Admin access required' };
	}

	return { isAdmin: true, userId: session.user.id, user: session.user };
}

/**
 * 获取管理员 session
 * 确保只有管理员可以访问
 */
export async function getAdminSession() {
	return await checkAdmin();
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

