/**
 * 数据库初始化脚本
 * 创建必要的索引和初始数据
 */

import { connectToDatabase } from '../lib/mongodb.js';

async function initDatabase() {
	console.log('Starting database initialization...');

	try {
		const db = await connectToDatabase();

		// 1. 创建 users 集合的索引
		console.log('Creating indexes for users collection...');
		await db.collection('users').createIndexes([
			{ key: { id: 1 }, unique: true },
			{ key: { email: 1 }, unique: true },
			{ key: { username: 1 }, sparse: true },
			{ key: { createdAt: 1 } },
			{ key: { role: 1 } },
		]);

		// 2. 创建 packages 集合的索引
		console.log('Creating indexes for packages collection...');
		await db.collection('packages').createIndexes([
			{ key: { isActive: 1 } },
			{ key: { sort: 1 } },
			{ key: { createdAt: 1 } },
		]);

		// 3. 创建 user_packages 集合的索引
		console.log('Creating indexes for user_packages collection...');
		await db.collection('user_packages').createIndexes([
			{ key: { userId: 1 } },
			{ key: { orderId: 1 }, unique: true },
			{ key: { status: 1 } },
			{ key: { expireAt: 1 } },
			{ key: { purchasedAt: 1 } },
		]);

		// 4. 创建 credit_transactions 集合的索引
		console.log('Creating indexes for credit_transactions collection...');
		await db.collection('credit_transactions').createIndexes([
			{ key: { userId: 1 } },
			{ key: { type: 1 } },
			{ key: { createdAt: 1 } },
			{ key: { expireAt: 1 }, sparse: true },
		]);

		// 5. 创建 usage_logs 集合的索引
		console.log('Creating indexes for usage_logs collection...');
		await db.collection('usage_logs').createIndexes([
			{ key: { userId: 1 } },
			{ key: { action: 1 } },
			{ key: { status: 1 } },
			{ key: { createdAt: 1 } },
		]);

		// 6. 插入默认套餐
		console.log('Creating default packages...');
		const packagesCollection = db.collection('packages');

		const existingPackages = await packagesCollection.countDocuments();
		if (existingPackages === 0) {
			await packagesCollection.insertMany([
				{
					name: 'Starter',
					description: 'Perfect for trying out our service',
					price: 9.99,
					credits: 100,
					validDays: 30,
					features: ['100 credits', 'Basic models', 'Standard resolution', 'Email support'],
					isActive: true,
					sort: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					name: 'Pro',
					description: 'Best for regular users',
					price: 29.99,
					credits: 500,
					validDays: 30,
					features: [
						'500 credits',
						'All models',
						'HD resolution',
						'Priority support',
						'Commercial use',
					],
					isActive: true,
					sort: 2,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					name: 'Business',
					description: 'For teams and businesses',
					price: 99.99,
					credits: 2000,
					validDays: 30,
					features: [
						'2000 credits',
						'All models',
						'HD & 4K resolution',
						'Priority support',
						'Commercial use',
						'API access',
						'Team collaboration',
					],
					isActive: true,
					sort: 3,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			]);
			console.log('Default packages created successfully');
		} else {
			console.log('Packages already exist, skipping...');
		}

		console.log('Database initialization completed successfully!');
	} catch (error) {
		console.error('Database initialization failed:', error);
		process.exit(1);
	}
}

// 运行初始化
initDatabase().then(() => {
	console.log('Done!');
	process.exit(0);
});

