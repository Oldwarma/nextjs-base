import { getOne, selects, updateOne } from '../database/db-api';

/**
 * 用户初始化模块
 * 处理新用户的数据初始化和登录时间更新
 * 使用统一的 DB API 接口
 */

/**
 * 初始化新用户的数据
 * @param {string} userId - 用户ID
 * @returns {Promise<void>}
 */
export async function initializeNewUser(userId) {
		const { ObjectId } = await import("mongodb");
	try {
		// userId 现在是 UUID 字符串（不是 ObjectId）
		
		// 检查用户是否存在
		const user = await selects({
			dbName: 'users',
			getOne: true,
			whereJson: { _id: new ObjectId(userId) },
			pageIndex: 1,
			pageSize: 1,
		});

		if (!user) {
			console.error('User not found:', userId);
			return;
		}

		// 检查是否已经初始化过（通过 credits 字段判断）
		if (user.credits !== undefined && user.credits !== null) {
			// 已经初始化过，只更新最后登录时间
			await updateOne({
				dbName: 'users',
				whereJson: { _id: user._id },
				dataJson: {
					lastLoginAt: new Date(),
				},
			});
			return;
		}

		// 初始化新用户数据
		await updateOne({
			dbName: 'users',
			whereJson: { _id: user._id },
			dataJson: {
				credits: 0,
				totalCreditsEarned: 0,
				totalCreditsUsed: 0,
				role: user.role || 'user',
				lastLoginAt: new Date(),
			},
		});

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
		const { ObjectId } = await import("mongodb");
	try {
		// userId 现在是 UUID 字符串（不是 ObjectId）
		
		await updateOne({
			dbName: 'users',
			whereJson: { _id: new ObjectId(userId) },
			dataJson: {
				lastLoginAt: new Date(),
			},
		});
	} catch (error) {
		console.error('Error updating last login:', error);
	}
}
