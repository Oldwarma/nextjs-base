/**
 * 迁移脚本：为现有用户添加新字段
 * 
 * 新增字段：
 * - roles: [] (RBAC 角色数组)
 * - isBackendAllowed: false (后台访问权限)
 * 
 * 运行：node scripts/migrate-users-add-fields.js
 */

import { getCollection } from '../lib/mongodb.js';

async function migrateUsers() {
	console.log('🚀 Starting user migration...\n');

	try {
		const usersCollection = await getCollection('users');

		// 统计需要迁移的用户
		const needsMigration = await usersCollection.count({
			$or: [
				{ roles: { $exists: false } },
				{ isBackendAllowed: { $exists: false } },
			],
		});

		console.log(`📊 Found ${needsMigration} users that need migration\n`);

		if (needsMigration === 0) {
			console.log('All users already migrated!');
			process.exit(0);
		}

		// 更新所有缺少新字段的用户
		const result = await usersCollection.updateMany(
			{
				$or: [
					{ roles: { $exists: false } },
					{ isBackendAllowed: { $exists: false } },
				],
			},
			{
				$set: {
					roles: [], // 默认无 RBAC 角色
					isBackendAllowed: false, // 默认不允许访问后台
					updatedAt: new Date(),
				},
			}
		);

		console.log(`Migration completed!`);
		console.log(`   - Matched: ${result.matchedCount}`);
		console.log(`   - Modified: ${result.modifiedCount}\n`);

		// 特殊处理：为所有 role === 'admin' 的用户设置 isBackendAllowed = true
		const adminResult = await usersCollection.updateMany(
			{
				role: 'admin',
				isBackendAllowed: { $ne: true },
			},
			{
				$set: {
					isBackendAllowed: true,
					updatedAt: new Date(),
				},
			}
		);

		console.log(`👑 Admin users auto-granted backend access:`);
		console.log(`   - Matched: ${adminResult.matchedCount}`);
		console.log(`   - Modified: ${adminResult.modifiedCount}\n`);

		// 显示示例数据
		const sampleUser = await usersCollection.findOne(
			{},
			{
				projection: {
					email: 1,
					name: 1,
					role: 1,
					roles: 1,
					isBackendAllowed: 1,
				},
			}
		);

		console.log('📝 Sample user after migration:');
		console.log(JSON.stringify(sampleUser, null, 2));

		process.exit(0);
	} catch (error) {
		console.error('❌ Migration failed:', error);
		process.exit(1);
	}
}

migrateUsers();

