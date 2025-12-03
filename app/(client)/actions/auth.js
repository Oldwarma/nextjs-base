'use server';

import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/database/prisma';

/**
 * 初始化/更新用户登录状态（积分 + 最后登录时间）
 */
async function initializeUserOnLogin(userId) {
	if (!userId) return;

	try {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { credits: true },
		});

		if (!user) return;

		const updateData = {
			lastLoginAt: new Date(),
		};

		// 仅在没有积分时补充初始积分
		if (!user.credits || user.credits <= 0) {
			updateData.credits = 100;
		}

		await prisma.user.update({
			where: { id: userId },
			data: updateData,
		});
	} catch (error) {
		console.error('Failed to initialize user on login:', error);
	}
}

/**
 * 邮箱密码登录 - 仅用于已有账号
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} 登录结果
 */
export async function signInWithEmailAction(credentials) {
	try {
		const { email, password } = credentials;

		// 验证输入
		if (!email || !password) {
			return {
				success: false,
				error: 'Email and password are required',
			};
		}

		// 使用 better-auth API 进行登录
		const result = await auth.api.signInEmail({
			body: {
				email,
				password,
			},
			headers: await headers(),
		});
		
		if (!result) {
			return {
				success: false,
				error: 'Invalid email or password',
			};
		}

		// 更新最后登录时间 & 初始积分
		if (result.user?.id) {
			await initializeUserOnLogin(result.user.id);
		}

		return {
			success: true,
			data: result,
			message: 'Login successful',
		};
	} catch (error) {
		console.error('Sign in error:', error);
		return {
			success: false,
			error: error.message || 'Login failed',
		};
	}
}

/**
 * 邮箱密码注册 - 创建新账号
 * @param {Object} credentials - { email, password, name }
 * @returns {Promise<Object>} 注册结果
 */
export async function signUpWithEmailAction(credentials) {
	try {
		const { email, password, name } = credentials;

		// 验证输入
		if (!email || !password) {
			return {
				success: false,
				error: 'Email and password are required',
			};
		}

		if (password.length < 8) {
			return {
				success: false,
				error: 'Password must be at least 8 characters',
			};
		}

		// 使用 better-auth API 进行注册
		const result = await auth.api.signUpEmail({
			body: {
				email,
				password,
				name: name || email.split('@')[0], // 如果没有提供名字，使用邮箱前缀
			},
			headers: await headers(),
		});

		if (!result) {
			return {
				success: false,
				error: 'Registration failed',
			};
		}

		// 初始化新用户数据
		if (result.user?.id) {
			await initializeUserOnLogin(result.user.id);
		}

		return {
			success: true,
			data: result,
			message: 'Account created successfully',
		};
	} catch (error) {
		console.error('Sign up error:', error);
		return {
			success: false,
			error: error.message || 'Registration failed',
		};
	}
}

/**
 * Google 第三方登录
 * 注意：这个 action 返回授权 URL，客户端需要重定向到该 URL
 * @returns {Promise<Object>} 包含授权 URL
 */
export async function getGoogleAuthUrlAction() {
	try {
		const baseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000';
		const authUrl = `${baseURL}/api/auth/google`;

		return {
			success: true,
			data: { url: authUrl },
		};
	} catch (error) {
		console.error('Google auth URL error:', error);
		return {
			success: false,
			error: 'Failed to get Google auth URL',
		};
	}
}

/**
 * GitHub 第三方登录
 * 注意：这个 action 返回授权 URL，客户端需要重定向到该 URL
 * @returns {Promise<Object>} 包含授权 URL
 */
export async function getGithubAuthUrlAction() {
	try {
		const baseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000';
		const authUrl = `${baseURL}/api/auth/github`;

		return {
			success: true,
			data: { url: authUrl },
		};
	} catch (error) {
		console.error('GitHub auth URL error:', error);
		return {
			success: false,
			error: 'Failed to get GitHub auth URL',
		};
	}
}

/**
 * 退出登录
 * @returns {Promise<Object>} 登出结果
 */
export async function signOutAction() {
	try {
		await auth.api.signOut({
			headers: await headers(),
		});

		return {
			success: true,
			message: 'Logged out successfully',
		};
	} catch (error) {
		console.error('Sign out error:', error);
		return {
			success: false,
			error: 'Logout failed',
		};
	}
}

/**
 * 获取当前会话信息
 * @returns {Promise<Object>} 会话信息
 */
export async function getSessionAction() {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return {
				success: false,
				error: 'Not authenticated',
			};
		}

		return {
			success: true,
			data: session,
		};
	} catch (error) {
		console.error('Get session error:', error);
		return {
			success: false,
			error: 'Failed to get session',
		};
	}
}

/**
 * 检查并初始化当前登录用户（用于三方登录回调后）
 * @returns {Promise<Object>} 初始化结果
 */
export async function checkAndInitUserAction() {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session || !session.user) {
			return {
				success: false,
				error: 'Not authenticated',
			};
		}

		// 初始化用户数据
		await initializeUserOnLogin(session.user.id);

		return {
			success: true,
			message: 'User initialized',
		};
	} catch (error) {
		console.error('Check and init user error:', error);
		return {
			success: false,
			error: 'Failed to initialize user',
		};
	}
}

