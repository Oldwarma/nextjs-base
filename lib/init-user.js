import { getCollection } from './mongodb';

/**
 * 初始化新用户的数据
 * @param {string} userId - 用户ID
 * @returns {Promise<void>}
 */
export async function initializeNewUser(userId) {
	try {
		const usersCollection = await getCollection('users');

		// 检查用户是否存在
		const user = await usersCollection.findOne({ id: userId });

		if (!user) {
			console.error('User not found:', userId);
			return;
		}

		// 检查是否已经初始化过（通过 credits 字段判断）
		if (user.credits !== undefined && user.credits !== null) {
			// 已经初始化过，只更新最后登录时间
			await usersCollection.updateOne({ id: userId }, { $set: { lastLoginAt: new Date() } });
			return;
		}

		// 初始化新用户数据
		await usersCollection.updateOne(
			{ id: userId },
			{
				$set: {
					credits: 0,
					totalCreditsEarned: 0,
					totalCreditsUsed: 0,
					role: user.role || 'user',
					lastLoginAt: new Date(),
				},
			}
		);

		console.log('User initialized successfully:', userId);
	} catch (error) {
		console.error('Error initializing user:', error);
		throw error;
	}
}

/**
 * 更新用户最后登录时间
 * @param {string} userId - 用户ID
 * @returns {Promise<void>}
 */
export async function updateLastLogin(userId) {
	try {
		const usersCollection = await getCollection('users');

		await usersCollection.updateOne({ id: userId }, { $set: { lastLoginAt: new Date() } });
	} catch (error) {
		console.error('Error updating last login:', error);
	}
}

