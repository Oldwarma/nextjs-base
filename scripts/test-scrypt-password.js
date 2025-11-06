/**
 * 测试 scrypt 密码验证
 * 运行：node scripts/test-scrypt-password.js "你的密码"
 */

const { scryptSync } = require('crypto');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// 加载环境变量
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
		console.log('   用法: node scripts/test-scrypt-password.js "你的密码"');
		process.exit(1);
	}

	console.log('🔐 测试 scrypt 密码验证...\n');
	console.log(`   测试密码: ${testPassword}`);

	const client = new MongoClient(process.env.MONGODB_URI);

	try {
		await client.connect();
		const db = client.db(process.env.MONGODB_DB_NAME);

		const email = 'karma.zhao@gmail.com';

		// 1. 获取数据库中的密码哈希
		const accountColl = db.collection('account');
		const credAccount = await accountColl.findOne({
			accountId: email,
			providerId: 'credential',
		});

		if (!credAccount || !credAccount.password) {
			console.log('❌ 未找到 credential 账户或密码');
			process.exit(1);
		}

		console.log(`\n✅ 找到 credential 账户`);
		console.log(`   - 密码哈希: ${credAccount.password}`);

		// 2. 解析密码哈希
		const parts = credAccount.password.split(':');
		if (parts.length !== 2) {
			console.log('❌ 密码哈希格式错误（应该是 salt:hash）');
			process.exit(1);
		}

		const [salt, storedHash] = parts;
		console.log(`\n🔍 密码哈希解析:`);
		console.log(`   - Salt: ${salt} (${salt.length} 字符)`);
		console.log(`   - Hash: ${storedHash.substring(0, 40)}... (${storedHash.length} 字符)`);

		// 3. 使用相同的 salt 和参数重新计算哈希
		console.log(`\n🔍 使用测试密码重新计算哈希...`);
		
		// 尝试不同的 keylen 参数
		const keylens = [64, 32];
		
		for (const keylen of keylens) {
			console.log(`\n   尝试 keylen=${keylen}:`);
			try {
				const computedHash = scryptSync(testPassword, salt, keylen).toString('hex');
				console.log(`   - 计算的哈希: ${computedHash.substring(0, 40)}...`);
				console.log(`   - 存储的哈希: ${storedHash.substring(0, 40)}...`);
				
				if (computedHash === storedHash) {
					console.log(`   ✅ 匹配！密码正确 (keylen=${keylen})`);
					
					console.log(`\n🎉 密码验证成功！`);
					console.log(`\n📊 scrypt 参数:`);
					console.log(`   - keylen: ${keylen}`);
					console.log(`   - salt length: ${salt.length}`);
					console.log(`\n💡 如果登录仍然失败，可能是 Better Auth 使用了不同的 scrypt 参数。`);
					process.exit(0);
				} else {
					console.log(`   ❌ 不匹配`);
				}
			} catch (error) {
				console.log(`   ❌ 计算失败: ${error.message}`);
			}
		}

		console.log(`\n❌ 所有尝试都失败了`);
		console.log(`\n💡 可能的原因:`);
		console.log(`   1. 密码不正确`);
		console.log(`   2. Better Auth 使用了不同的 scrypt 参数`);
		console.log(`   3. 密码哈希生成方式与 Better Auth 不兼容`);
		
	} catch (error) {
		console.error('❌ 测试失败:', error);
	} finally {
		await client.close();
	}
}

testPassword();

