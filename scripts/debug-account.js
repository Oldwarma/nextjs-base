/**
 * 调试账户登录问题
 * 运行：node scripts/debug-account.js
 */

import { connectToDatabase } from '../lib/mongodb.js';
import bcrypt from 'bcryptjs';

async function debugAccount() {
	console.log('🔍 开始检查账户数据...\n');

	try {
		const db = await connectToDatabase();
		const email = 'karma.zhao@gmail.com';

		// 1. 查找用户
		console.log('📌 Step 1: 查找 users 表');
		const user = await db.collection('users').findOne({ email });
		if (user) {
			console.log('✅ 找到用户：');
			console.log(`   - ID: ${user.id}`);
			console.log(`   - Email: ${user.email}`);
			console.log(`   - Name: ${user.name}`);
			console.log(`   - Role: ${user.role}`);
			console.log(`   - isBackendAllowed: ${user.isBackendAllowed} (类型: ${typeof user.isBackendAllowed})`);
		} else {
			console.log('❌ 未找到用户');
			process.exit(1);
		}

		// 2. 查找所有账户
		console.log('\n📌 Step 2: 查找 account 表（所有账户）');
		const accounts = await db
			.collection('account')
			.find({ userId: user.id })
			.toArray();

		console.log(`✅ 找到 ${accounts.length} 个账户：`);
		accounts.forEach((acc, index) => {
			console.log(`\n   账户 ${index + 1}:`);
			console.log(`   - ID: ${acc.id}`);
			console.log(`   - providerId: ${acc.providerId}`);
			console.log(`   - accountId: ${acc.accountId}`);
			console.log(`   - 有密码: ${acc.password ? '是' : '否'}`);
			if (acc.password) {
				console.log(`   - 密码哈希: ${acc.password.substring(0, 20)}...`);
			}
		});

		// 3. 查找 credential 账户
		console.log('\n📌 Step 3: 查找 credential 类型账户');
		const credentialAccount = await db.collection('account').findOne({
			accountId: email,
			providerId: 'credential',
		});

		if (credentialAccount) {
			console.log('✅ 找到 credential 账户：');
			console.log(`   - accountId: ${credentialAccount.accountId}`);
			console.log(`   - providerId: ${credentialAccount.providerId}`);
			console.log(`   - userId: ${credentialAccount.userId}`);
			console.log(`   - 匹配用户ID: ${credentialAccount.userId === user.id ? '✅ 是' : '❌ 否'}`);

			// 4. 测试密码
			console.log('\n📌 Step 4: 测试密码验证');
			const testPassword = process.argv[2];
			if (testPassword) {
				const isValid = await bcrypt.compare(testPassword, credentialAccount.password);
				console.log(`   - 测试密码: ${testPassword}`);
				console.log(`   - 验证结果: ${isValid ? '✅ 正确' : '❌ 错误'}`);
			} else {
				console.log('   ℹ️  提示：运行 node scripts/debug-account.js YOUR_PASSWORD 来测试密码');
			}
		} else {
			console.log('❌ 未找到 credential 账户');
			console.log('\n💡 问题：用户只有 OAuth 登录方式，没有邮箱密码登录账户');
			console.log('   解决方案：在后台重置密码，系统会自动创建 credential 账户');
		}

		// 5. 总结
		console.log('\n📊 总结：');
		console.log(`   - 用户存在: ${user ? '✅' : '❌'}`);
		console.log(`   - credential 账户存在: ${credentialAccount ? '✅' : '❌'}`);
		console.log(`   - 账户关联正确: ${credentialAccount && credentialAccount.userId === user.id ? '✅' : '❌'}`);
		console.log(`   - 邮箱匹配: ${credentialAccount && credentialAccount.accountId === email ? '✅' : '❌'}`);

		if (user && credentialAccount && credentialAccount.userId === user.id) {
			console.log('\n✅ 数据结构正确，应该可以登录！');
			console.log('   如果还是登录失败，请检查：');
			console.log('   1. 密码是否正确');
			console.log('   2. Better Auth 配置是否正确');
			console.log('   3. 查看服务器日志获取更多信息');
		}

		process.exit(0);
	} catch (error) {
		console.error('❌ 检查失败:', error);
		process.exit(1);
	}
}

debugAccount();

