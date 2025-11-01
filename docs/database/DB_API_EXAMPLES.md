# Database API 实战示例

本文档提供 DB API 在实际项目中的应用示例，涵盖常见业务场景。

---

## 目录

1. [用户管理示例](#用户管理示例)
2. [积分系统示例](#积分系统示例)
3. [订单系统示例](#订单系统示例)
4. [内容管理示例](#内容管理示例)
5. [数据统计示例](#数据统计示例)
6. [复杂查询示例](#复杂查询示例)

---

## 用户管理示例

### 1. 用户注册

```javascript
'use server';

import { add, exists } from '@/lib/db-api';
import { hashPassword } from '@/lib/utils';

export async function registerUserAction(formData) {
	try {
		const { username, email, password } = formData;

		// 验证输入
		if (!username || !email || !password) {
			return { success: false, error: 'All fields are required' };
		}

		// 检查邮箱是否已存在
		const emailExists = await exists({
			dbName: 'users',
			whereJson: { email: email.toLowerCase() },
		});

		if (emailExists) {
			return { success: false, error: 'Email already registered' };
		}

		// 检查用户名是否已存在
		const usernameExists = await exists({
			dbName: 'users',
			whereJson: { username },
		});

		if (usernameExists) {
			return { success: false, error: 'Username already taken' };
		}

		// 创建用户
		const hashedPassword = await hashPassword(password);
		const userId = await add({
			dbName: 'users',
			dataJson: {
				username,
				email: email.toLowerCase(),
				password: hashedPassword,
				role: 'user',
				emailVerified: false,
				credits: 0,
				avatar: null,
			},
		});

		// 初始化用户积分记录
		await add({
			dbName: 'credit_records',
			dataJson: {
				userId,
				balance: 0,
				totalEarned: 0,
				totalSpent: 0,
			},
		});

		return {
			success: true,
			data: { userId },
			message: 'Registration successful',
		};
	} catch (error) {
		console.error('Register error:', error);
		return { success: false, error: error.message };
	}
}
```

### 2. 更新用户资料

```javascript
'use server';

import { update, exists } from '@/lib/db-api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function updateProfileAction(profileData) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		return { success: false, error: 'Unauthorized' };
	}

	try {
		const { name, bio, avatar } = profileData;
		const updateData = {};

		// 只更新提供的字段
		if (name !== undefined) updateData.name = name;
		if (bio !== undefined) updateData.bio = bio;
		if (avatar !== undefined) updateData.avatar = avatar;

		// 如果有邮箱更新，检查唯一性
		if (profileData.email) {
			const emailExists = await exists({
				dbName: 'users',
				whereJson: {
					email: profileData.email,
					_id: { $ne: session.user.id },
				},
			});

			if (emailExists) {
				return { success: false, error: 'Email already in use' };
			}

			updateData.email = profileData.email;
			updateData.emailVerified = false; // 重置验证状态
		}

		// 更新用户信息
		const modifiedCount = await update({
			dbName: 'users',
			_id: session.user.id,
			dataJson: updateData,
		});

		if (modifiedCount === 0) {
			return { success: false, error: 'No changes made' };
		}

		return {
			success: true,
			message: 'Profile updated successfully',
		};
	} catch (error) {
		console.error('Update profile error:', error);
		return { success: false, error: error.message };
	}
}
```

### 3. 查询用户列表（带搜索和过滤）

```javascript
'use server';

import { getPage } from '@/lib/db-api';
import { checkAdminAction } from '@/lib/admin-auth';

export async function getUserListAction({ pageIndex = 1, pageSize = 20, search, role, emailVerified } = {}) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return { success: false, error: adminCheck.error };
	}

	try {
		// 构建查询条件
		const whereJson = {};

		// 搜索条件（多字段模糊搜索）
		if (search) {
			whereJson.$or = [
				{ username: { $regex: search, $options: 'i' } },
				{ email: { $regex: search, $options: 'i' } },
				{ name: { $regex: search, $options: 'i' } },
			];
		}

		// 角色过滤
		if (role) {
			whereJson.role = role;
		}

		// 邮箱验证状态过滤
		if (emailVerified !== undefined) {
			whereJson.emailVerified = emailVerified === 'true' || emailVerified === true;
		}

		// 排除已删除的用户
		whereJson.$or = [{ deletedAt: { $exists: false } }, { deletedAt: null }];

		// 执行分页查询
		const result = await getPage({
			dbName: 'users',
			whereJson,
			pageIndex,
			pageSize,
			sortJson: { createdAt: -1 },
		});

		return {
			success: true,
			data: result.rows,
			total: result.total,
			pageIndex: result.pageIndex,
			pageSize: result.pageSize,
			totalPages: result.totalPages,
		};
	} catch (error) {
		console.error('Get user list error:', error);
		return { success: false, error: error.message };
	}
}
```

---

## 积分系统示例

### 1. 充值积分

```javascript
'use server';

import { inc, add, getOne } from '@/lib/db-api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function rechargeCreditsAction(packageId) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		return { success: false, error: 'Unauthorized' };
	}

	try {
		// 1. 获取套餐信息
		const packageInfo = await getOne({
			dbName: 'packages',
			whereJson: {
				_id: packageId,
				enabled: true,
			},
		});

		if (!packageInfo) {
			return { success: false, error: 'Package not found or disabled' };
		}

		// 2. 增加用户积分
		await inc({
			dbName: 'users',
			whereJson: { _id: session.user.id },
			fieldName: 'credits',
			num: packageInfo.credits,
		});

		// 3. 记录交易
		const transactionId = await add({
			dbName: 'credit_transactions',
			dataJson: {
				userId: session.user.id,
				type: 'recharge',
				amount: packageInfo.credits,
				balance: 0, // 将在后续查询后更新
				packageId: packageInfo._id,
				packageName: packageInfo.name,
				price: packageInfo.price,
				currency: packageInfo.currency || 'USD',
				description: `Recharged ${packageInfo.credits} credits`,
			},
		});

		// 4. 获取更新后的积分
		const user = await getOne({
			dbName: 'users',
			whereJson: { _id: session.user.id },
		});

		return {
			success: true,
			data: {
				credits: user.credits,
				transactionId,
			},
			message: 'Recharge successful',
		};
	} catch (error) {
		console.error('Recharge error:', error);
		return { success: false, error: error.message };
	}
}
```

### 2. 消费积分

```javascript
'use server';

import { inc, add, getOne } from '@/lib/db-api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function consumeCreditsAction({ amount, type, description, metadata = {} }) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		return { success: false, error: 'Unauthorized' };
	}

	try {
		// 1. 检查积分是否足够
		const user = await getOne({
			dbName: 'users',
			whereJson: { _id: session.user.id },
		});

		if (!user) {
			return { success: false, error: 'User not found' };
		}

		if (user.credits < amount) {
			return {
				success: false,
				error: 'Insufficient credits',
				data: { required: amount, available: user.credits },
			};
		}

		// 2. 扣除积分
		await inc({
			dbName: 'users',
			whereJson: { _id: session.user.id },
			fieldName: 'credits',
			num: -amount,
		});

		// 3. 记录交易
		const transactionId = await add({
			dbName: 'credit_transactions',
			dataJson: {
				userId: session.user.id,
				type: 'consume',
				subType: type, // 如 'image_generation', 'video_generation'
				amount: -amount,
				balance: user.credits - amount,
				description,
				metadata,
			},
		});

		return {
			success: true,
			data: {
				transactionId,
				remainingCredits: user.credits - amount,
			},
			message: 'Credits consumed successfully',
		};
	} catch (error) {
		console.error('Consume credits error:', error);
		return { success: false, error: error.message };
	}
}
```

### 3. 查询积分交易记录

```javascript
'use server';

import { getPage } from '@/lib/db-api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function getCreditTransactionsAction({ pageIndex = 1, pageSize = 20, type } = {}) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		return { success: false, error: 'Unauthorized' };
	}

	try {
		const whereJson = { userId: session.user.id };

		// 类型过滤
		if (type) {
			whereJson.type = type;
		}

		const result = await getPage({
			dbName: 'credit_transactions',
			whereJson,
			pageIndex,
			pageSize,
			sortJson: { createdAt: -1 },
		});

		return {
			success: true,
			data: result.rows,
			total: result.total,
			pageIndex: result.pageIndex,
			pageSize: result.pageSize,
		};
	} catch (error) {
		console.error('Get transactions error:', error);
		return { success: false, error: error.message };
	}
}
```

---

## 订单系统示例

### 1. 创建订单

```javascript
'use server';

import { add, getOne, inc } from '@/lib/db-api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { generateOrderId } from '@/lib/utils';

export async function createOrderAction(orderData) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		return { success: false, error: 'Unauthorized' };
	}

	try {
		const { packageId, paymentMethod } = orderData;

		// 1. 获取套餐信息
		const packageInfo = await getOne({
			dbName: 'packages',
			whereJson: { _id: packageId, enabled: true },
		});

		if (!packageInfo) {
			return { success: false, error: 'Package not found' };
		}

		// 2. 创建订单
		const orderId = await add({
			dbName: 'orders',
			dataJson: {
				orderId: generateOrderId(),
				userId: session.user.id,
				packageId: packageInfo._id,
				packageName: packageInfo.name,
				credits: packageInfo.credits,
				amount: packageInfo.price,
				currency: packageInfo.currency || 'USD',
				paymentMethod,
				status: 'pending',
				paidAt: null,
			},
		});

		return {
			success: true,
			data: { orderId },
			message: 'Order created successfully',
		};
	} catch (error) {
		console.error('Create order error:', error);
		return { success: false, error: error.message };
	}
}
```

### 2. 订单支付回调处理

```javascript
'use server';

import { updateOne, inc, add, getOne } from '@/lib/db-api';

export async function handleOrderPaidAction(orderId, paymentData) {
	try {
		// 1. 获取订单信息
		const order = await getOne({
			dbName: 'orders',
			whereJson: { orderId, status: 'pending' },
		});

		if (!order) {
			return { success: false, error: 'Order not found or already processed' };
		}

		// 2. 更新订单状态
		await updateOne({
			dbName: 'orders',
			whereJson: { orderId },
			dataJson: {
				status: 'paid',
				paidAt: new Date(),
				paymentId: paymentData.paymentId,
				paymentDetails: paymentData,
			},
		});

		// 3. 增加用户积分
		await inc({
			dbName: 'users',
			whereJson: { _id: order.userId },
			fieldName: 'credits',
			num: order.credits,
		});

		// 4. 记录积分交易
		await add({
			dbName: 'credit_transactions',
			dataJson: {
				userId: order.userId,
				type: 'recharge',
				amount: order.credits,
				orderId: order._id,
				packageId: order.packageId,
				packageName: order.packageName,
				price: order.amount,
				currency: order.currency,
				description: `Order ${orderId} payment completed`,
			},
		});

		return {
			success: true,
			message: 'Order processed successfully',
		};
	} catch (error) {
		console.error('Handle order paid error:', error);
		return { success: false, error: error.message };
	}
}
```

### 3. 查询用户订单

```javascript
'use server';

import { getPageWithLookup } from '@/lib/db-api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function getUserOrdersAction({ pageIndex = 1, pageSize = 20, status } = {}) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		return { success: false, error: 'Unauthorized' };
	}

	try {
		const whereJson = { userId: session.user.id };

		// 状态过滤
		if (status) {
			whereJson.status = status;
		}

		// 连表查询套餐信息
		const result = await getPageWithLookup({
			dbName: 'orders',
			whereJson,
			foreignDB: [
				{
					from: 'packages',
					localField: 'packageId',
					foreignField: '_id',
					as: 'package',
					single: true,
				},
			],
			pageIndex,
			pageSize,
			sortJson: { createdAt: -1 },
		});

		return {
			success: true,
			data: result.rows,
			total: result.total,
			pageIndex: result.pageIndex,
			pageSize: result.pageSize,
		};
	} catch (error) {
		console.error('Get user orders error:', error);
		return { success: false, error: error.message };
	}
}
```

---

## 内容管理示例

### 1. 发布文章

```javascript
'use server';

import { add, push } from '@/lib/db-api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { generateSlug } from '@/lib/utils';

export async function publishPostAction(postData) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		return { success: false, error: 'Unauthorized' };
	}

	try {
		const { title, content, category, tags = [] } = postData;

		// 创建文章
		const postId = await add({
			dbName: 'posts',
			dataJson: {
				title,
				content,
				slug: generateSlug(title),
				authorId: session.user.id,
				category,
				tags,
				status: 'published',
				publishedAt: new Date(),
				views: 0,
				likes: 0,
				comments: [],
			},
		});

		// 增加用户文章计数
		await inc({
			dbName: 'users',
			whereJson: { _id: session.user.id },
			fieldName: 'postCount',
			num: 1,
		});

		return {
			success: true,
			data: { postId },
			message: 'Post published successfully',
		};
	} catch (error) {
		console.error('Publish post error:', error);
		return { success: false, error: error.message };
	}
}
```

### 2. 添加评论

```javascript
'use server';

import { push, inc } from '@/lib/db-api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function addCommentAction(postId, content) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		return { success: false, error: 'Unauthorized' };
	}

	try {
		const comment = {
			commentId: new Date().getTime().toString(),
			userId: session.user.id,
			userName: session.user.name,
			userAvatar: session.user.image,
			content,
			createdAt: new Date(),
			likes: 0,
		};

		// 添加评论到文章
		await push({
			dbName: 'posts',
			whereJson: { _id: postId },
			fieldName: 'comments',
			value: comment,
		});

		// 增加评论计数
		await inc({
			dbName: 'posts',
			whereJson: { _id: postId },
			fieldName: 'commentCount',
			num: 1,
		});

		return {
			success: true,
			data: comment,
			message: 'Comment added successfully',
		};
	} catch (error) {
		console.error('Add comment error:', error);
		return { success: false, error: error.message };
	}
}
```

### 3. 增加浏览量

```javascript
'use server';

import { inc } from '@/lib/db-api';

export async function incrementViewsAction(postId) {
	try {
		await inc({
			dbName: 'posts',
			whereJson: { _id: postId },
			fieldName: 'views',
			num: 1,
		});

		return { success: true };
	} catch (error) {
		console.error('Increment views error:', error);
		return { success: false, error: error.message };
	}
}
```

---

## 数据统计示例

### 1. 用户统计仪表板

```javascript
'use server';

import { count, sum, avg, getList } from '@/lib/db-api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function getUserStatsAction() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		return { success: false, error: 'Unauthorized' };
	}

	try {
		const userId = session.user.id;

		// 生成统计
		const totalGenerations = await count({
			dbName: 'generations',
			whereJson: { userId },
		});

		// 本月生成数
		const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
		const monthlyGenerations = await count({
			dbName: 'generations',
			whereJson: {
				userId,
				createdAt: { $gte: thisMonthStart },
			},
		});

		// 总消费积分
		const totalSpent = await sum({
			dbName: 'credit_transactions',
			fieldName: 'amount',
			whereJson: {
				userId,
				type: 'consume',
			},
		});

		// 总充值积分
		const totalRecharged = await sum({
			dbName: 'credit_transactions',
			fieldName: 'amount',
			whereJson: {
				userId,
				type: 'recharge',
			},
		});

		// 最近生成记录
		const recentGenerations = await getList({
			dbName: 'generations',
			whereJson: { userId },
			sortJson: { createdAt: -1 },
			limit: 5,
		});

		return {
			success: true,
			data: {
				generations: {
					total: totalGenerations,
					monthly: monthlyGenerations,
				},
				credits: {
					totalSpent: Math.abs(totalSpent),
					totalRecharged,
				},
				recentGenerations,
			},
		};
	} catch (error) {
		console.error('Get user stats error:', error);
		return { success: false, error: error.message };
	}
}
```

### 2. 管理员仪表板统计

```javascript
'use server';

import { count, sum, avg, aggregate } from '@/lib/db-api';
import { checkAdminAction } from '@/lib/admin-auth';

export async function getAdminDashboardStatsAction() {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return { success: false, error: adminCheck.error };
	}

	try {
		const today = new Date(new Date().setHours(0, 0, 0, 0));
		const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

		// 用户统计
		const totalUsers = await count({ dbName: 'users' });
		const todayNewUsers = await count({
			dbName: 'users',
			whereJson: { createdAt: { $gte: today } },
		});
		const monthlyNewUsers = await count({
			dbName: 'users',
			whereJson: { createdAt: { $gte: thisMonth } },
		});

		// 收入统计
		const totalRevenue = await sum({
			dbName: 'orders',
			fieldName: 'amount',
			whereJson: { status: 'paid' },
		});
		const monthlyRevenue = await sum({
			dbName: 'orders',
			fieldName: 'amount',
			whereJson: {
				status: 'paid',
				paidAt: { $gte: thisMonth },
			},
		});

		// 订单统计
		const totalOrders = await count({
			dbName: 'orders',
			whereJson: { status: 'paid' },
		});
		const avgOrderAmount = await avg({
			dbName: 'orders',
			fieldName: 'amount',
			whereJson: { status: 'paid' },
		});

		// 生成统计
		const totalGenerations = await count({ dbName: 'generations' });
		const todayGenerations = await count({
			dbName: 'generations',
			whereJson: { createdAt: { $gte: today } },
		});

		// 按类型统计生成数量
		const generationsByType = await aggregate({
			dbName: 'generations',
			groupJson: {
				_id: '$type',
				count: { $sum: 1 },
			},
		});

		// 按日期统计收入（最近7天）
		const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
		const dailyRevenue = await aggregate({
			dbName: 'orders',
			whereJson: {
				status: 'paid',
				paidAt: { $gte: sevenDaysAgo },
			},
			groupJson: {
				_id: {
					$dateToString: {
						format: '%Y-%m-%d',
						date: '$paidAt',
					},
				},
				revenue: { $sum: '$amount' },
				orderCount: { $sum: 1 },
			},
		});

		return {
			success: true,
			data: {
				users: {
					total: totalUsers,
					todayNew: todayNewUsers,
					monthlyNew: monthlyNewUsers,
				},
				revenue: {
					total: totalRevenue,
					monthly: monthlyRevenue,
					daily: dailyRevenue,
				},
				orders: {
					total: totalOrders,
					average: avgOrderAmount,
				},
				generations: {
					total: totalGenerations,
					today: todayGenerations,
					byType: generationsByType,
				},
			},
		};
	} catch (error) {
		console.error('Get admin dashboard stats error:', error);
		return { success: false, error: error.message };
	}
}
```

---

## 复杂查询示例

### 1. 推荐系统

```javascript
'use server';

import { sample, getList } from '@/lib/db-api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function getRecommendationsAction() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		return { success: false, error: 'Unauthorized' };
	}

	try {
		const userId = session.user.id;

		// 1. 获取用户浏览历史
		const viewHistory = await getList({
			dbName: 'view_history',
			whereJson: { userId },
			sortJson: { createdAt: -1 },
			limit: 20,
		});

		// 2. 提取浏览过的分类和标签
		const viewedCategories = [...new Set(viewHistory.map((item) => item.category).filter(Boolean))];
		const viewedTags = [
			...new Set(viewHistory.flatMap((item) => item.tags || []).filter(Boolean)),
		];
		const viewedPostIds = viewHistory.map((item) => item.postId);

		// 3. 随机推荐相关内容（基于分类和标签）
		let recommendations = [];

		if (viewedCategories.length > 0 || viewedTags.length > 0) {
			recommendations = await sample({
				dbName: 'posts',
				size: 5,
				whereJson: {
					status: 'published',
					_id: { $nin: viewedPostIds },
					$or: [
						{ category: { $in: viewedCategories } },
						{ tags: { $in: viewedTags } },
					],
				},
			});
		}

		// 4. 如果推荐不足，补充热门内容
		if (recommendations.length < 5) {
			const popularPosts = await sample({
				dbName: 'posts',
				size: 5 - recommendations.length,
				whereJson: {
					status: 'published',
					_id: { $nin: [...viewedPostIds, ...recommendations.map((p) => p._id)] },
					views: { $gt: 100 },
				},
			});

			recommendations.push(...popularPosts);
		}

		return {
			success: true,
			data: recommendations,
		};
	} catch (error) {
		console.error('Get recommendations error:', error);
		return { success: false, error: error.message };
	}
}
```

### 2. 排行榜查询

```javascript
'use server';

import { getList } from '@/lib/db-api';

export async function getLeaderboardAction({ type = 'credits', limit = 10 } = {}) {
	try {
		const sortField = type === 'credits' ? 'credits' : 'postCount';

		const topUsers = await getList({
			dbName: 'users',
			whereJson: {
				$or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
			},
			sortJson: { [sortField]: -1 },
			limit,
		});

		return {
			success: true,
			data: topUsers.map((user, index) => ({
				rank: index + 1,
				userId: user._id,
				name: user.name,
				avatar: user.avatar,
				value: user[sortField] || 0,
			})),
		};
	} catch (error) {
		console.error('Get leaderboard error:', error);
		return { success: false, error: error.message };
	}
}
```

### 3. 数据导出

```javascript
'use server';

import { getList } from '@/lib/db-api';
import { checkAdminAction } from '@/lib/admin-auth';

export async function exportUsersAction({ role, startDate, endDate } = {}) {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return { success: false, error: adminCheck.error };
	}

	try {
		const whereJson = {};

		// 角色过滤
		if (role) {
			whereJson.role = role;
		}

		// 日期范围过滤
		if (startDate || endDate) {
			whereJson.createdAt = {};
			if (startDate) {
				whereJson.createdAt.$gte = new Date(startDate);
			}
			if (endDate) {
				whereJson.createdAt.$lte = new Date(endDate);
			}
		}

		// 获取所有数据（不分页）
		const users = await getList({
			dbName: 'users',
			whereJson,
			sortJson: { createdAt: -1 },
		});

		// 转换为 CSV 格式
		const csvData = users.map((user) => ({
			ID: user._id,
			Username: user.username,
			Email: user.email,
			Name: user.name,
			Role: user.role,
			Credits: user.credits,
			CreatedAt: user.createdAt,
		}));

		return {
			success: true,
			data: csvData,
			total: users.length,
		};
	} catch (error) {
		console.error('Export users error:', error);
		return { success: false, error: error.message };
	}
}
```

---

## 最佳实践总结

### 1. 始终进行权限检查

```javascript
const session = await auth.api.getSession({ headers: await headers() });
if (!session) {
	return { success: false, error: 'Unauthorized' };
}
```

### 2. 使用 try-catch 处理错误

```javascript
try {
	// 数据库操作
} catch (error) {
	console.error('Action error:', error);
	return { success: false, error: error.message };
}
```

### 3. 验证数据完整性

```javascript
// 检查记录是否存在
const record = await getOne({
	dbName: 'users',
	whereJson: { _id: userId },
});

if (!record) {
	return { success: false, error: 'Record not found' };
}
```

### 4. 使用统一的返回格式

```javascript
return {
	success: true, // 或 false
	data: {}, // 成功时的数据
	error: '', // 失败时的错误信息
	message: '', // 可选的提示信息
};
```

### 5. 优化查询性能

```javascript
// ✅ 使用索引字段查询
whereJson: { email: 'user@example.com' }

// ✅ 限制返回字段
fieldJson: { name: 1, email: 1 }

// ✅ 限制返回数量
limit: 10
```

---

## 总结

DB API 提供了统一、简洁的数据库操作接口，适合各种业务场景：

- ✅ 用户管理：注册、登录、资料更新
- ✅ 积分系统：充值、消费、交易记录
- ✅ 订单系统：创建订单、支付回调、订单查询
- ✅ 内容管理：发布文章、添加评论、统计数据
- ✅ 数据统计：用户统计、收入统计、趋势分析
- ✅ 复杂查询：推荐系统、排行榜、数据导出

通过这些示例，你可以快速掌握 DB API 的使用方法，提高开发效率。

