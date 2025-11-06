/**
 * 检查数据库中的集合
 * 运行：node --no-warnings scripts/check-collections.js
 */

import('../lib/mongodb.js').then(({ connectToDatabase }) => checkCollections(connectToDatabase));

async function checkCollections(connectToDatabase) {
	console.log('🔍 检查数据库集合...\n');

	try {
		const db = await connectToDatabase();

		// 获取所有集合
		const collections = await db.listCollections().toArray();

		console.log(`📊 数据库：${db.databaseName}`);
		console.log(`📦 集合总数：${collections.length}\n`);

		// 查找 account 相关的集合
		const accountCollections = collections.filter((c) =>
			c.name.toLowerCase().includes('account')
		);

		if (accountCollections.length > 0) {
			console.log('🔑 账户相关集合：');
			for (const coll of accountCollections) {
				const count = await db.collection(coll.name).countDocuments();
				console.log(`   - ${coll.name} (${count} 条记录)`);

				// 显示示例数据
				const sample = await db.collection(coll.name).findOne();
				if (sample) {
					console.log(`     示例: providerId=${sample.providerId}, accountId=${sample.accountId}`);
				}
			}
		} else {
			console.log('❌ 未找到账户相关集合');
		}

		// 列出所有集合
		console.log('\n📋 所有集合：');
		collections.forEach((coll) => {
			console.log(`   - ${coll.name}`);
		});

		process.exit(0);
	} catch (error) {
		console.error('❌ 检查失败:', error);
		process.exit(1);
	}
}

checkCollections();

