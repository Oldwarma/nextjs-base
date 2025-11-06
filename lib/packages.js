import { getOne, getList, add, update, updateOne, getPage } from './db-api';
import { addCredits } from './credits';

/**
 * 套餐管理类
 * 处理套餐的创建、购买、激活等操作
 * 使用统一的 DB API 接口
 */

/**
 * 获取所有可用套餐
 * @param {Object} options - 查询选项
 * @returns {Promise<Array>} 套餐列表
 */
export async function getActivePackages(options = {}) {
	const { includeInactive = false } = options;

	const whereJson = includeInactive ? {} : { isActive: true };

	const packages = await getList({
		dbName: 'packages',
		whereJson,
		sortJson: { sort: 1, createdAt: -1 },
	});

	return packages;
}

/**
 * 根据ID获取套餐详情
 * @param {string} packageId - 套餐ID
 * @returns {Promise<Object>} 套餐信息
 */
export async function getPackageById(packageId) {
	const pkg = await getOne({
		dbName: 'packages',
		whereJson: { _id: packageId },
	});

	if (!pkg) {
		throw new Error('Package not found');
	}

	return pkg;
}

/**
 * 创建套餐（管理员）
 * @param {Object} packageData - 套餐数据
 * @returns {Promise<Object>} 创建结果
 */
export async function createPackage(packageData) {
	const {
		name,
		description,
		price,
		credits,
		validDays,
		features = [],
		isActive = true,
		sort = 0,
	} = packageData;

	// 验证必填字段
	if (!name || price === undefined || credits === undefined || validDays === undefined) {
		throw new Error('Missing required fields: name, price, credits, validDays');
	}

	if (price < 0 || credits < 0 || validDays < 0) {
		throw new Error('Price, credits, and validDays must be non-negative');
	}

	const newPackage = {
		name,
		description: description || '',
		price,
		credits,
		validDays,
		features,
		isActive,
		sort,
	};

	const packageId = await add({
		dbName: 'packages',
		dataJson: newPackage,
	});

	return {
		success: true,
		packageId,
		package: {
			...newPackage,
			_id: packageId,
		},
	};
}

/**
 * 更新套餐（管理员）
 * @param {string} packageId - 套餐ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise<Object>} 更新结果
 */
export async function updatePackage(packageId, updateData) {
	// 不允许更新的字段
	delete updateData._id;
	delete updateData.createdAt;

	const modifiedCount = await update({
		dbName: 'packages',
		_id: packageId,
		dataJson: updateData,
	});

	if (modifiedCount === 0) {
		throw new Error('Package not found or no changes made');
	}

	return {
		success: true,
		packageId,
	};
}

/**
 * 删除套餐（管理员）- 软删除，只是设置为不活跃
 * @param {string} packageId - 套餐ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deletePackage(packageId) {
	return updatePackage(packageId, { isActive: false });
}

/**
 * 用户购买套餐
 * @param {string} userId - 用户ID
 * @param {string} packageId - 套餐ID
 * @param {Object} paymentInfo - 支付信息
 * @returns {Promise<Object>} 购买结果
 */
export async function purchasePackage(userId, packageId, paymentInfo = {}) {
			const { ObjectId } = await import("mongodb");
		// 获取套餐信息
	const pkg = await getOne({
		dbName: 'packages',
		whereJson: { _id: packageId, isActive: true },
	});

	if (!pkg) {
		throw new Error('Package not found or not available');
	}

	// 获取用户信息
	const user = await getOne({
		dbName: 'users',
		whereJson: { _id: new ObjectId(userId) },
	});

	if (!user) {
		throw new Error('User not found');
	}

	// 生成订单号
	const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

	// 计算过期时间
	const purchasedAt = new Date();
	const expireAt = new Date(purchasedAt);
	expireAt.setDate(expireAt.getDate() + pkg.validDays);

	// 创建用户套餐记录
	const userPackage = {
		userId,
		packageId,
		orderId,
		packageName: pkg.name,
		price: pkg.price,
		credits: pkg.credits,
		purchasedAt,
		expireAt,
		status: 'active',
		paymentInfo: {
			...paymentInfo,
			processedAt: new Date(),
		},
	};

	await add({
		dbName: 'user_packages',
		dataJson: userPackage,
	});

	// 赠送积分
	await addCredits(userId, pkg.credits, {
		reason: 'purchase_package',
		relatedId: orderId,
		expireAt: pkg.validDays > 0 ? expireAt : null, // 如果套餐有有效期，积分也有有效期
	});

	// 更新用户当前套餐信息
	await updateOne({
		dbName: 'users',
		whereJson: { _id: new ObjectId(userId) },
		dataJson: {
			currentPackageId: packageId,
			packageExpireAt: expireAt,
		},
	});

	return {
		success: true,
		orderId,
		userPackage,
		creditsGranted: pkg.credits,
	};
}

/**
 * 获取用户的套餐购买记录
 * @param {string} userId - 用户ID
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} 分页结果
 */
export async function getUserPackages(userId, options = {}) {
	const { pageIndex = 1, pageSize = 10, status = null } = options;

	const whereJson = { userId };
	if (status) {
		whereJson.status = status;
	}

	return await getPage({
		dbName: 'user_packages',
		whereJson,
		pageIndex,
		pageSize,
		sortJson: { purchasedAt: -1 },
	});
}

/**
 * 获取用户当前有效套餐
 * @param {string} userId - 用户ID
 * @returns {Promise<Object|null>} 套餐信息或null
 */
export async function getUserCurrentPackage(userId) {
			const { ObjectId } = await import("mongodb");
		const user = await getOne({
		dbName: 'users',
		whereJson: { _id: new ObjectId(userId) },
	});

	if (!user || !user.currentPackageId) {
		return null;
	}

	// 检查是否过期
	if (user.packageExpireAt && new Date(user.packageExpireAt) < new Date()) {
		// 已过期，清除套餐信息
		await updateOne({
			dbName: 'users',
			whereJson: { _id: new ObjectId(userId) },
			dataJson: {
				currentPackageId: null,
				packageExpireAt: null,
			},
		});
		return null;
	}

	// 获取套餐详情
	const pkg = await getOne({
		dbName: 'packages',
		whereJson: { _id: user.currentPackageId },
	});

	return {
		...pkg,
		expireAt: user.packageExpireAt,
	};
}

/**
 * 处理过期套餐
 * 定时任务调用，将过期的套餐状态更新为expired
 * @returns {Promise<Object>} 处理结果
 */
export async function processExpiredPackages() {
	const { updateMany } = await import('./db-api.js');

	const now = new Date();

	// 更新过期的用户套餐记录
	const result1 = await updateMany({
		dbName: 'user_packages',
		whereJson: {
			expireAt: { $lte: now },
			status: 'active',
		},
		dataJson: {
			status: 'expired',
		},
	});

	// 清除用户表中的过期套餐信息
	await updateMany({
		dbName: 'users',
		whereJson: {
			packageExpireAt: { $lte: now },
			currentPackageId: { $ne: null },
		},
		dataJson: {
			currentPackageId: null,
			packageExpireAt: null,
		},
	});

	return {
		success: true,
		expiredCount: result1,
	};
}

/**
 * 取消用户套餐（退款场景）
 * @param {string} userId - 用户ID
 * @param {string} orderId - 订单号
 * @param {string} reason - 取消原因
 * @returns {Promise<Object>} 操作结果
 */
export async function cancelUserPackage(userId, orderId, reason = '') {
	// 查找订单
	const userPackage = await getOne({
		dbName: 'user_packages',
		whereJson: {
			userId,
			orderId,
			status: 'active',
		},
	});

	if (!userPackage) {
		throw new Error('Active package order not found');
	}

	// 更新套餐状态
	await updateOne({
		dbName: 'user_packages',
		whereJson: { _id: userPackage._id },
		dataJson: {
			status: 'cancelled',
			cancelledAt: new Date(),
			cancelReason: reason,
		},
	});

	// 如果是用户当前使用的套餐，清除用户表中的套餐信息
	const user = await getOne({
		dbName: 'users',
		whereJson: { _id: new ObjectId(userId) },
	});

	if (user.currentPackageId === userPackage.packageId) {
		await updateOne({
			dbName: 'users',
			whereJson: { _id: new ObjectId(userId) },
			dataJson: {
				currentPackageId: null,
				packageExpireAt: null,
			},
		});
	}

	return {
		success: true,
		orderId,
		message: 'Package cancelled successfully',
	};
}

/**
 * 获取套餐统计信息（管理员）
 * @returns {Promise<Object>} 统计信息
 */
export async function getPackageStatistics() {
	const { count } = await import('./db-api.js');

	// 获取所有套餐
	const packages = await getList({
		dbName: 'packages',
		whereJson: { isActive: true },
	});

	// 统计每个套餐的购买情况
	const statistics = await Promise.all(
		packages.map(async (pkg) => {
			const totalPurchases = await count({
				dbName: 'user_packages',
				whereJson: {
					packageId: pkg._id,
				},
			});

			const activePurchases = await count({
				dbName: 'user_packages',
				whereJson: {
					packageId: pkg._id,
					status: 'active',
				},
			});

			return {
				packageId: pkg._id,
				packageName: pkg.name,
				totalPurchases,
				activePurchases,
				revenue: totalPurchases * pkg.price,
			};
		})
	);

	return {
		packages: statistics,
		totalRevenue: statistics.reduce((sum, stat) => sum + stat.revenue, 0),
	};
}
