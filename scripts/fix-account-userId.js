/**
 * 修复 account 表中缺失的 userId 字段
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'jimeng';

async function fixAccounts() {
	console.log('🔧 开始修复 account 表的 userId 字段...\n');
	
	const client = await MongoClient.connect(MONGODB_URI);
	const db = client.db(MONGODB_DB_NAME);
	
	// 查找所有缺少 userId 的 account
	const accounts = await db.collection('account').find({
		userId: { $exists: false }
	}).toArray();
	
	console.log(`📋 找到 ${accounts.length} 个缺少 userId 的 account 记录\n`);
	
	if (accounts.length === 0) {
		console.log('✅ 所有 account 都有 userId，无需修复！');
		await client.close();
		process.exit(0);
	}
	
	// 为每个 account 添加 userId
	for (const account of accounts) {
		// Google OAuth: accountId 是 Google 用户 ID，需要根据 email 查找用户
		let user = null;
		
		if (account.providerId === 'google' || account.providerId === 'github') {
			// OAuth 账户：根据 email 查找用户
			// 注意：我们需要先从 users 表找到对应的用户
			console.log(`🔍 处理 ${account.providerId} 账户: ${account.accountId}`);
			
			// 尝试根据 accountId (Google user ID) 的邮箱查找
			// 但我们没有邮箱，所以需要手动指定
			// 根据你的数据，这个 Google account 对应的用户是 karma.zhao@gmail.com
			user = await db.collection('users').findOne({
				email: 'karma.zhao@gmail.com'
			});
		} else if (account.providerId === 'credential') {
			// 密码账户：accountId 就是 email
			user = await db.collection('users').findOne({
				email: account.accountId
			});
		}
		
		if (user) {
			console.log(`✅ 找到用户: ${user.email} (${user._id})`);
			
			// 更新 account 添加 userId
			await db.collection('account').updateOne(
				{ _id: account._id },
				{ $set: { userId: user._id } }
			);
			
			console.log(`   已添加 userId: ${user._id}\n`);
		} else {
			console.warn(`⚠️  未找到对应的用户，跳过 account ${account._id}\n`);
		}
	}
	
	console.log('✅ 修复完成！');
	await client.close();
	process.exit(0);
}

fixAccounts().catch(err => {
	console.error('❌ 修复失败:', err);
	process.exit(1);
});

