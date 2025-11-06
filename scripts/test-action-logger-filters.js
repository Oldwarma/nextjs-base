/**
 * 测试 Action Logger 的 TYPE 过滤和 MAX 限制功能
 * 
 * 使用方法：
 * 1. 设置环境变量
 * 2. 运行脚本：node scripts/test-action-logger-filters.js
 * 3. 查看控制台输出和数据库记录
 */

// 模拟不同的操作类型
const testOperations = [
	{ action: 'query', resourceType: 'users', description: 'Read operation (query)' },
	{ action: 'getList', resourceType: 'products', description: 'Read operation (getList)' },
	{ action: 'getDetail', resourceType: 'orders', description: 'Read operation (getDetail)' },
	{ action: 'create', resourceType: 'users', description: 'Create operation' },
	{ action: 'update', resourceType: 'products', description: 'Update operation' },
	{ action: 'batchUpdate', resourceType: 'orders', description: 'Batch update operation' },
	{ action: 'delete', resourceType: 'users', description: 'Delete operation' },
	{ action: 'batchDelete', resourceType: 'products', description: 'Batch delete operation' },
];

async function testFilters() {
	console.log('\n=== Action Logger Filter Test ===\n');
	
	// 动态导入 logAction
	const { logAction } = await import('../lib/logging/action-logger.js');
	
	console.log('Current Configuration:');
	console.log('- ACTION_LOG_MODE:', process.env.ACTION_LOG_MODE || 'full (default)');
	console.log('- ACTION_LOG_DATABASE:', process.env.ACTION_LOG_DATABASE || '1 (default)');
	console.log('- ACTION_LOG_TYPE:', process.env.ACTION_LOG_TYPE || 'all (default)');
	console.log('- ACTION_LOG_MAX:', process.env.ACTION_LOG_MAX || '0 (unlimited)\n');
	
	console.log('Testing different operation types...\n');
	
	// 测试所有操作类型
	for (const op of testOperations) {
		console.log(`\n[Test] ${op.description} (${op.action})`);
		
		await logAction({
			userId: 'test-user-123',
			action: op.action,
			resourceType: op.resourceType,
			params: { test: 'data' },
			result: { success: true },
			success: true,
			duration: Math.floor(Math.random() * 100) + 10,
		});
		
		// 等待一小段时间，确保异步日志写入完成
		await new Promise(resolve => setTimeout(resolve, 100));
	}
	
	console.log('\n\n=== Test Complete ===\n');
	console.log('Check:');
	console.log('1. Console output above (filtered by ACTION_LOG_TYPE)');
	console.log('2. Database: db.action_logs.count() to see total records');
	console.log('3. Database: db.action_logs.find().sort({createdAt:-1}).limit(10) to see latest logs\n');
}

// 运行测试
testFilters()
	.then(() => {
		console.log('✅ Test script completed');
		process.exit(0);
	})
	.catch(error => {
		console.error('❌ Test failed:', error);
		process.exit(1);
	});

