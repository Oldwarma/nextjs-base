/**
 * 测试 action-logger 的不同模式
 * 
 * 使用方法：
 * 1. 测试 full 模式（默认）:
 *    node scripts/test-action-logger.js
 * 
 * 2. 测试 summary 模式:
 *    ACTION_LOG_MODE=summary node scripts/test-action-logger.js
 * 
 * 3. 测试 simple 模式:
 *    ACTION_LOG_MODE=simple node scripts/test-action-logger.js
 * 
 * 4. 测试 depth 限制:
 *    ACTION_LOG_DEPTH=2 node scripts/test-action-logger.js
 *    ACTION_LOG_MODE=summary ACTION_LOG_DEPTH=1 node scripts/test-action-logger.js
 */

const { logAction } = require('../lib/logging/action-logger.js');

// 模拟测试数据
const testData = {
	// 简单对象
	simpleParams: {
		name: 'John Doe',
		email: 'john@example.com',
		age: 30,
	},
	
	// 包含数组的对象
	arrayParams: {
		name: 'Product List',
		items: [
			{ id: 1, name: 'Item 1', price: 100 },
			{ id: 2, name: 'Item 2', price: 200 },
			{ id: 3, name: 'Item 3', price: 300 },
		],
		total: 3,
	},
	
	// 嵌套对象
	nestedParams: {
		user: {
			id: '123',
			profile: {
				name: 'John',
				address: {
					city: 'Shanghai',
					street: 'Nanjing Road',
					zipCode: '200000',
				},
			},
			settings: {
				theme: 'dark',
				language: 'zh',
			},
		},
		metadata: {
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	},
	
	// 大数组
	largeArrayResult: {
		success: true,
		data: Array.from({ length: 50 }, (_, i) => ({
			id: i + 1,
			name: `User ${i + 1}`,
			email: `user${i + 1}@example.com`,
			status: i % 2 === 0 ? 'active' : 'inactive',
			profile: {
				age: 20 + (i % 30),
				city: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen'][i % 4],
			},
		})),
		total: 50,
		pageIndex: 1,
		pageSize: 20,
	},
};

async function runTests() {
	console.log('🧪 开始测试 action-logger 的不同模式...\n');
	console.log(`📊 当前配置:`);
	console.log(`   MODE: ${process.env.ACTION_LOG_MODE || 'full (默认)'}`);
	console.log(`   DEPTH: ${process.env.ACTION_LOG_DEPTH || 'null (完全展开，默认)'}\n`);
	console.log('='.repeat(80));
	console.log('\n');

	// 测试 1: 简单查询操作
	console.log('【测试 1】简单查询操作');
	await logAction({
		userId: 'test-user-123',
		action: 'query',
		resourceType: 'user',
		params: testData.simpleParams,
		result: { success: true, data: { id: '123', ...testData.simpleParams } },
		success: true,
		duration: 45,
	});
	
	await sleep(100);

	// 测试 2: 创建操作（包含数组）
	console.log('【测试 2】创建操作（包含数组）');
	await logAction({
		userId: 'test-user-123',
		action: 'create',
		resourceType: 'order',
		resourceId: 'order-456',
		params: testData.arrayParams,
		result: { success: true, data: { id: 'order-456', ...testData.arrayParams } },
		success: true,
		duration: 120,
	});
	
	await sleep(100);

	// 测试 3: 更新操作（嵌套对象）
	console.log('【测试 3】更新操作（嵌套对象）');
	await logAction({
		userId: 'test-user-123',
		action: 'update',
		resourceType: 'profile',
		resourceId: 'profile-789',
		params: testData.nestedParams,
		result: { success: true, message: 'Profile updated successfully' },
		success: true,
		duration: 88,
	});
	
	await sleep(100);

	// 测试 4: 查询列表（大数组）
	console.log('【测试 4】查询列表（大数组，50 条记录）');
	await logAction({
		userId: 'test-user-123',
		action: 'query',
		resourceType: 'user',
		params: { pageIndex: 1, pageSize: 20, search: 'test' },
		result: testData.largeArrayResult,
		success: true,
		duration: 256,
	});
	
	await sleep(100);

	// 测试 5: 失败操作
	console.log('【测试 5】失败操作');
	await logAction({
		userId: 'test-user-123',
		action: 'delete',
		resourceType: 'user',
		resourceId: 'user-999',
		params: { id: 'user-999' },
		result: { error: 'User not found or already deleted' },
		success: false,
		duration: 12,
	});
	
	await sleep(100);

	// 测试 6: 批量操作
	console.log('【测试 6】批量删除操作');
	await logAction({
		userId: 'test-user-123',
		action: 'batch_delete',
		resourceType: 'post',
		params: { ids: ['post-1', 'post-2', 'post-3', 'post-4', 'post-5'] },
		result: { success: true, deletedCount: 5, message: 'Deleted 5 posts successfully' },
		success: true,
		duration: 178,
	});

	console.log('\n✅ 测试完成！\n');
	console.log('💡 提示：');
	console.log('   - 如需查看其他模式，请使用环境变量：');
	console.log('     ACTION_LOG_MODE=summary node scripts/test-action-logger.js');
	console.log('     ACTION_LOG_MODE=simple node scripts/test-action-logger.js');
	console.log('   - 如需限制展开深度：');
	console.log('     ACTION_LOG_DEPTH=2 node scripts/test-action-logger.js');
	console.log('     ACTION_LOG_MODE=full ACTION_LOG_DEPTH=1 node scripts/test-action-logger.js\n');
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// 运行测试
runTests().catch(console.error);

