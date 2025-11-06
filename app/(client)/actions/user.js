'use server';

import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { getUserProfile, updateUserProfile, getUserStatistics } from '@/lib/business/user-profile';

/**
 * 获取当前用户资料
 * @returns {Promise<Object>} 用户资料
 */
export async function getUserProfileAction() {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		return {
			success: false,
			error: 'Unauthorized',
		};
	}

	try {
		const profile = await getUserProfile(session.user.id);
		return {
			success: true,
			data: profile,
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * 更新用户资料
 * @param {Object} updates - 更新数据 { name, image, username }
 * @returns {Promise<Object>} 更新结果
 */
export async function updateUserProfileAction(updates) {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		return {
			success: false,
			error: 'Unauthorized',
		};
	}

	try {
		const result = await updateUserProfile(session.user.id, updates);
		return {
			success: true,
			data: result,
			message: 'Profile updated successfully',
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * 获取用户统计信息
 * @returns {Promise<Object>} 统计信息
 */
export async function getUserStatisticsAction() {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		return {
			success: false,
			error: 'Unauthorized',
		};
	}

	try {
		const stats = await getUserStatistics(session.user.id);
		return {
			success: true,
			data: stats,
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

