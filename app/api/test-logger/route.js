/**
 * 测试 action-logger 的 API 路由
 * 
 * 访问方式：
 * http://localhost:3000/api/test-logger
 * http://localhost:3000/api/test-logger?mode=summary
 * http://localhost:3000/api/test-logger?mode=simple
 * http://localhost:3000/api/test-logger?mode=full&depth=2
 */

import { NextResponse } from 'next/server';
import { logAction } from '@/lib/logging/action-logger';

export async function GET(request) {
	const { searchParams } = new URL(request.url);
	const testMode = searchParams.get('mode') || process.env.ACTION_LOG_MODE || 'full';
	const testDepth = searchParams.get('depth') || process.env.ACTION_LOG_DEPTH || 'null';
	
	console.log('\n' + '='.repeat(80));
	console.log(`🧪 测试 action-logger - MODE: ${testMode}, DEPTH: ${testDepth}`);
	console.log('='.repeat(80) + '\n');
	
	// 临时设置环境变量（仅用于测试）
	const originalMode = process.env.ACTION_LOG_MODE;
	const originalDepth = process.env.ACTION_LOG_DEPTH;
	process.env.ACTION_LOG_MODE = testMode;
	process.env.ACTION_LOG_DEPTH = testDepth;
	
	try {
		// 测试 1: 简单查询操作
		console.log('【测试 1】简单查询操作\n');
		await logAction({
			userId: 'test-user-123',
			action: 'query',
			resourceType: 'user',
			params: {
				name: 'John Doe',
				email: 'john@example.com',
				age: 30,
			},
			result: {
				success: true,
				data: { id: '123', name: 'John Doe', email: 'john@example.com' },
			},
			success: true,
			duration: 45,
		});
		
		await sleep(50);

		// 测试 2: 创建操作（包含数组）
		console.log('【测试 2】创建操作（包含数组）\n');
		await logAction({
			userId: 'test-user-123',
			action: 'create',
			resourceType: 'order',
			resourceId: 'order-456',
			params: {
				name: 'Product List',
				items: [
					{ id: 1, name: 'Item 1', price: 100 },
					{ id: 2, name: 'Item 2', price: 200 },
					{ id: 3, name: 'Item 3', price: 300 },
				],
				total: 3,
			},
			result: {
				success: true,
				data: { id: 'order-456', total: 3 },
			},
			success: true,
			duration: 120,
		});
		
		await sleep(50);

		// 测试 3: 更新操作（嵌套对象）
		console.log('【测试 3】更新操作（嵌套对象）\n');
		await logAction({
			userId: 'test-user-123',
			action: 'update',
			resourceType: 'profile',
			resourceId: 'profile-789',
			params: {
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
			},
			result: {
				success: true,
				message: 'Profile updated successfully',
			},
			success: true,
			duration: 88,
		});
		
		await sleep(50);

		// 测试 4: 查询列表（大数组）
		console.log('【测试 4】查询列表（大数组，50 条记录）\n');
		await logAction({
			userId: 'test-user-123',
			action: 'query',
			resourceType: 'user',
			params: { pageIndex: 1, pageSize: 20, search: 'test' },
			result: {
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
			success: true,
			duration: 256,
		});
		
		await sleep(50);

		// 测试 5: 失败操作
		console.log('【测试 5】失败操作\n');
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
		
		await sleep(50);

		// 测试 6: 批量操作
		console.log('【测试 6】批量删除操作\n');
		await logAction({
			userId: 'test-user-123',
			action: 'batch_delete',
			resourceType: 'post',
			params: { ids: ['post-1', 'post-2', 'post-3', 'post-4', 'post-5'] },
			result: {
				success: true,
				deletedCount: 5,
				message: 'Deleted 5 posts successfully',
			},
			success: true,
			duration: 178,
		});

		console.log('\n✅ 测试完成！\n');
		
		// 恢复原始环境变量
		process.env.ACTION_LOG_MODE = originalMode;
		process.env.ACTION_LOG_DEPTH = originalDepth;
		
		return NextResponse.json({
			success: true,
			message: '测试完成，请查看控制台输出',
			config: {
				mode: testMode,
				depth: testDepth,
			},
			tips: [
				'查看不同模式: ?mode=full (默认), ?mode=summary, ?mode=simple',
				'限制深度: ?depth=1, ?depth=2, ?depth=3',
				'组合使用: ?mode=full&depth=2',
			],
		});
	} catch (error) {
		// 恢复原始环境变量
		process.env.ACTION_LOG_MODE = originalMode;
		process.env.ACTION_LOG_DEPTH = originalDepth;
		
		return NextResponse.json({
			success: false,
			error: error.message,
		}, { status: 500 });
	}
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

