/**
 * 直接测试 Better Auth 的数据库查询
 * 运行：node scripts/test-better-auth.js
 */

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

async function testBetterAuth() {
	console.log('🔍 测试 Better Auth 数据库查询\n');

	const client = new MongoClient(process.env.MONGODB_URI);

	try {
		await client.connect();
		const db = client.db(process.env.MONGODB_DB_NAME);
		const email = 'karma.zhao@gmail.com';

		console.log('📊 数据库:', db.databaseName);
		console.log('📧 测试邮箱:', email);
		console.log('\n' + '='.repeat(60));

		// 测试各种可能的查询方式
		const accountColl = db.collection('account');

		// 1. 标准查询（我们使用的）
		console.log('\n🔍 方式 1: 标准查询');
		const query1 = {
			accountId: email,
			providerId: 'credential',
		};
		console.log('   查询条件:', JSON.stringify(query1, null, 2));
		const result1 = await accountColl.findOne(query1);
		console.log('   结果:', result1 ? '✅ 找到' : '❌ 未找到');
		if (result1) {
			console.log('   - _id:', result1._id);
			console.log('   - id:', result1.id);
			console.log('   - accountId:', result1.accountId);
			console.log('   - providerId:', result1.providerId);
		}

		// 2. 小写邮箱查询
		console.log('\n🔍 方式 2: 小写邮箱查询');
		const query2 = {
			accountId: email.toLowerCase(),
			providerId: 'credential',
		};
		console.log('   查询条件:', JSON.stringify(query2, null, 2));
		const result2 = await accountColl.findOne(query2);
		console.log('   结果:', result2 ? '✅ 找到' : '❌ 未找到');

		// 3. 查询所有 credential 账户
		console.log('\n🔍 方式 3: 所有 credential 账户');
		const allCred = await accountColl
			.find({ providerId: 'credential' })
			.limit(10)
			.toArray();
		console.log('   找到', allCred.length, '个 credential 账户');
		allCred.forEach((acc, i) => {
			console.log(`   账户 ${i + 1}:`);
			console.log(`      - accountId: ${acc.accountId}`);
			console.log(`      - userId: ${acc.userId}`);
			console.log(`      - 有密码: ${!!acc.password}`);
		});

		// 4. 检查字段名是否有差异
		console.log('\n🔍 方式 4: 检查字段名');
		const sample = await accountColl.findOne({ providerId: 'credential' });
		if (sample) {
			console.log('   示例账户的所有字段:');
			Object.keys(sample).forEach((key) => {
				const value = key === 'password' ? '[隐藏]' : sample[key];
				console.log(`      - ${key}: ${typeof value} = ${value}`);
			});
		}

		// 5. 查询 users 表
		console.log('\n🔍 方式 5: 检查 users 表');
		const usersColl = db.collection('users');
		const user = await usersColl.findOne({ email });
		if (user) {
			console.log('   ✅ 找到用户');
			console.log('      - id:', user.id);
			console.log('      - email:', user.email);
			console.log('      - emailVerified:', user.emailVerified);
		}

		// 总结
		console.log('\n' + '='.repeat(60));
		console.log('\n📊 诊断总结:');
		console.log('   ✓ 能用标准查询找到账户:', result1 ? '是' : '否');
		console.log('   ✓ email 字段一致:', result1 && result1.accountId === email ? '是' : '否');
		console.log('   ✓ 用户邮箱已验证:', user && user.emailVerified ? '是' : '否');

		if (result1 && user) {
			console.log('\n💡 数据结构完全正确！');
			console.log('   问题可能在于 Better Auth 的内部实现或配置。');
			console.log('\n   建议尝试：');
			console.log('   1. 检查 Better Auth 是否使用了不同的数据库连接');
			console.log('   2. 尝试降级/升级 Better Auth 版本');
			console.log('   3. 使用自定义认证绕过 Better Auth');
		}
	} catch (error) {
		console.error('❌ 测试失败:', error);
	} finally {
		await client.close();
	}
}

testBetterAuth();

