/**
 * 清理测试用户数据
 * 移除所有测试用户（test*@huglemon.com）和相关的 account 记录
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function cleanup() {
	console.log('🧹 开始清理测试数据...\n');
	
	const client = await MongoClient.connect(process.env.MONGODB_URI);
	const db = client.db(process.env.MONGODB_DB_NAME);
	
	// 1. 查找所有测试用户
	const testUsers = await db.collection('users').find({
		email: { $regex: /^test.*@huglemon\.com$/ }
	}).toArray();
	
	console.log(`📋 找到 ${testUsers.length} 个测试用户:`);
	testUsers.forEach(user => {
		console.log(`   - ${user.email} (${user._id})`);
	});
	
	if (testUsers.length === 0) {
		console.log('\n✅ 没有找到测试用户，无需清理！');
		await client.close();
		process.exit(0);
	}
	
	// 2. 删除这些用户的 account 记录
	const userIds = testUsers.map(u => u._id);
	const accountResult = await db.collection('account').deleteMany({
		userId: { $in: userIds }
	});
	console.log(`\n🗑️  删除了 ${accountResult.deletedCount} 个 account 记录`);
	
	// 3. 删除这些用户的 session 记录
	const sessionResult = await db.collection('session').deleteMany({
		userId: { $in: userIds.map(id => id.toString()) }
	});
	console.log(`🗑️  删除了 ${sessionResult.deletedCount} 个 session 记录`);
	
	// 4. 删除这些用户
	const userResult = await db.collection('users').deleteMany({
		_id: { $in: userIds }
	});
	console.log(`🗑️  删除了 ${userResult.deletedCount} 个 user 记录`);
	
	console.log('\n✅ 清理完成！');
	await client.close();
	process.exit(0);
}

cleanup().catch(err => {
	console.error('❌ 清理失败:', err);
	process.exit(1);
});
