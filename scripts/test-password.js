/**
 * 测试密码验证
 * 运行：node scripts/test-password.js "你的密码"
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
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

async function testPassword() {
	const testPassword = process.argv[2];

	if (!testPassword) {
		console.log('❌ 请提供测试密码');
		console.log('   用法: node scripts/test-password.js "你的密码"');
		process.exit(1);
	}

	console.log('🔐 测试密码验证...\n');
	console.log(`   测试密码: ${testPassword}`);

	const client = new MongoClient(process.env.MONGODB_URI);

	try {
		await client.connect();
		const db = client.db(process.env.MONGODB_DB_NAME);

		const email = 'karma.zhao@gmail.com';

		// 1. 查找 credential 账户
		const accountColl = db.collection('account');
		const credentialAccount = await accountColl.findOne({
			accountId: email,
			providerId: 'credential',
		});

		if (!credentialAccount) {
			console.log('❌ 未找到 credential 账户');
			process.exit(1);
		}

		console.log(`\n✅ 找到 credential 账户`);
		console.log(`   - accountId: ${credentialAccount.accountId}`);
		console.log(`   - providerId: ${credentialAccount.providerId}`);
		console.log(`   - 密码哈希: ${credentialAccount.password.substring(0, 30)}...`);

		// 2. 验证密码
		console.log(`\n🔍 验证密码...`);
		const isValid = await bcrypt.compare(testPassword, credentialAccount.password);

		if (isValid) {
			console.log(`   ✅ 密码正确！`);
			console.log(`\n🎉 密码验证成功！数据库中的密码是正确的。`);
			console.log(`\n如果登录仍然失败，问题可能在于：`);
			console.log(`   1. Better Auth 配置问题`);
			console.log(`   2. 缓存问题（尝试重启应用）`);
			console.log(`   3. Session/Cookie 问题`);
		} else {
			console.log(`   ❌ 密码错误！`);
			console.log(`\n❌ 数据库中的密码与你提供的密码不匹配。`);
			console.log(`   请在后台重新设置密码。`);
		}
	} catch (error) {
		console.error('❌ 测试失败:', error);
	} finally {
		await client.close();
	}
}

testPassword();

