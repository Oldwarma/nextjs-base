/**
 * 诊断登录问题
 * 运行：MONGODB_URI="your_uri" MONGODB_DB_NAME="your_db" node scripts/diagnose-login.js
 * 或者：node scripts/diagnose-login.js（会尝试从 .env 加载）
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// 尝试从 .env 文件加载环境变量
try {
	const envPath = path.join(__dirname, '..', '.env.local');
	if (fs.existsSync(envPath)) {
		const envContent = fs.readFileSync(envPath, 'utf-8');
		envContent.split('\n').forEach((line) => {
			const match = line.match(/^([^=]+)=(.*)$/);
			if (match && !process.env[match[1]]) {
				process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
			}
		});
	}
} catch (e) {
	// Ignore
}

async function diagnose() {
	console.log('🔍 开始诊断登录问题...\n');

	const client = new MongoClient(process.env.MONGODB_URI);

	try {
		await client.connect();
		const db = client.db(process.env.MONGODB_DB_NAME);

		const email = 'karma.zhao@gmail.com';

		// 1. 列出所有集合
		console.log('📦 Step 1: 检查数据库集合');
		const collections = await db.listCollections().toArray();
		const collectionNames = collections.map((c) => c.name);
		console.log('   所有集合:', collectionNames.join(', '));

		// 找出账户相关的集合
		const accountCollections = collectionNames.filter((name) =>
			name.toLowerCase().includes('account')
		);
		console.log('   账户相关集合:', accountCollections.join(', ') || '无\n');

		// 2. 检查 users 表
		console.log('\n📌 Step 2: 检查 users 表');
		const usersCollection = db.collection('users');
		const user = await usersCollection.findOne({ email });

		if (user) {
			console.log('   ✅ 找到用户:');
			console.log(`      - id: ${user.id}`);
			console.log(`      - email: ${user.email}`);
			console.log(`      - name: ${user.name}`);
		} else {
			console.log('   ❌ 未找到用户');
			process.exit(1);
		}

		// 3. 检查所有可能的账户表
		console.log('\n📌 Step 3: 检查账户表');

		for (const collName of ['account', 'accounts']) {
			if (collectionNames.includes(collName)) {
				console.log(`\n   🔍 检查 ${collName} 表:`);
				const accountColl = db.collection(collName);

				// 查找用户的所有账户
				const userAccounts = await accountColl.find({ userId: user.id }).toArray();
				console.log(`      该用户的账户数: ${userAccounts.length}`);

				userAccounts.forEach((acc, index) => {
					console.log(`\n      账户 ${index + 1}:`);
					console.log(`         - providerId: ${acc.providerId}`);
					console.log(`         - accountId: ${acc.accountId}`);
					console.log(`         - 有密码: ${acc.password ? '是' : '否'}`);
				});

				// 查找 credential 账户
				const credentialAccount = await accountColl.findOne({
					accountId: email,
					providerId: 'credential',
				});

				console.log(
					`\n      ${collName} 表中的 credential 账户: ${credentialAccount ? '✅ 存在' : '❌ 不存在'}`
				);

				if (credentialAccount) {
					console.log(`         - accountId: ${credentialAccount.accountId}`);
					console.log(`         - userId: ${credentialAccount.userId}`);
					console.log(`         - 密码哈希: ${credentialAccount.password?.substring(0, 20)}...`);
				}
			}
		}

		// 4. 总结
		console.log('\n\n📊 诊断总结:');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

		const accountColl = collectionNames.includes('account')
			? db.collection('account')
			: db.collection('accounts');
		const credAccount = await accountColl.findOne({
			accountId: email,
			providerId: 'credential',
		});

		console.log(`✓ users 表存在: ${collectionNames.includes('users') ? '是' : '否'}`);
		console.log(`✓ account 表存在: ${collectionNames.includes('account') ? '是' : '否'}`);
		console.log(`✓ accounts 表存在: ${collectionNames.includes('accounts') ? '是' : '否'}`);
		console.log(`✓ 用户存在: ${user ? '是' : '否'}`);
		console.log(`✓ credential 账户存在: ${credAccount ? '是' : '否'}`);

		console.log('\n💡 建议:');

		if (!credAccount) {
			console.log('   ❌ 未找到 credential 账户！');
			console.log('   → 请在后台重置该用户的密码，系统会自动创建 credential 账户');
		} else {
			console.log('   ✅ credential 账户存在，数据结构正确');
			console.log('   → 如果仍然无法登录，可能是以下原因：');
			console.log('      1. Better Auth 配置的表名与实际表名不匹配');
			console.log('      2. 密码错误');
			console.log('      3. Better Auth 版本问题');
			console.log('\n   🔧 请检查 lib/auth.js 中的配置：');

			if (collectionNames.includes('account') && !collectionNames.includes('accounts')) {
				console.log('      - account.modelName: "account" (单数)');
			} else if (!collectionNames.includes('account') && collectionNames.includes('accounts')) {
				console.log('      - account.modelName: "accounts" (复数)');
			} else {
				console.log('      ⚠️  同时存在 account 和 accounts 表，这可能导致混乱！');
			}
		}

		console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
	} catch (error) {
		console.error('❌ 诊断失败:', error);
	} finally {
		await client.close();
	}
}

diagnose();

