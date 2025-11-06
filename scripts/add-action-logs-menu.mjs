/**
 * 添加 Action Logs 菜单项（Node.js 版本）
 * 
 * 使用方法：
 * node scripts/add-action-logs-menu.mjs
 */

import { MongoClient } from 'mongodb';
import { randomUUID } from 'crypto';

// MongoDB 连接配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'jimeng_saas';

async function addActionLogsMenu() {
	console.log('=== 添加 Action Logs 菜单项 ===\n');
	
	const client = new MongoClient(MONGODB_URI);
	
	try {
		// 连接数据库
		await client.connect();
		console.log('✅ 数据库连接成功\n');
		
		const db = client.db(DB_NAME);
		const menusCollection = db.collection('menus');
		
		// 1. 查找 System 模块的父菜单
		const systemParent = await menusCollection.findOne({
			$or: [
				{ name: 'System', type: 'group' },
				{ name: '系统管理', type: 'group' },
			],
		});
		
		if (!systemParent) {
			console.error('❌ 未找到 System 父菜单');
			console.log('\n请先创建 System 模块，或手动在数据库中添加：');
			console.log('```javascript');
			console.log('{');
			console.log('  id: "system-group",');
			console.log('  name: "System",');
			console.log('  icon: "SettingOutlined",');
			console.log('  type: "group",');
			console.log('  parentId: null,');
			console.log('  sort: 30,');
			console.log('  isVisible: true');
			console.log('}');
			console.log('```');
			process.exit(1);
		}
		
		console.log(`✅ 找到 System 父菜单: ${systemParent.name}`);
		console.log(`   ID: ${systemParent.id}\n`);
		
		// 2. 检查是否已存在 Action Logs 菜单
		const existing = await menusCollection.findOne({
			url: '/admin/system/action_logs',
		});
		
		if (existing) {
			console.log('⚠️  Action Logs 菜单已存在：');
			console.log(`   ID: ${existing.id}`);
			console.log(`   Name: ${existing.name}`);
			console.log(`   URL: ${existing.url}`);
			console.log('\n如需重新创建，请先删除现有菜单');
			return;
		}
		
		// 3. 创建新菜单
		const menuId = randomUUID();
		const newMenu = {
			id: menuId,
			name: 'Action Logs',
			icon: 'FileTextOutlined',
			url: '/admin/system/action_logs',
			type: 'menu',
			parentId: systemParent.id,
			sort: 30, // 排在 System 模块的第三位
			isVisible: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		
		// 4. 插入数据库
		const result = await menusCollection.insertOne(newMenu);
		
		if (result.acknowledged) {
			console.log('✅ Action Logs 菜单创建成功！\n');
			console.log('菜单信息：');
			console.log(`   ID: ${menuId}`);
			console.log(`   Name: ${newMenu.name}`);
			console.log(`   Icon: ${newMenu.icon}`);
			console.log(`   URL: ${newMenu.url}`);
			console.log(`   Parent: ${systemParent.name} (${systemParent.id})`);
			console.log(`   Sort: ${newMenu.sort}`);
			console.log('\n下一步：');
			console.log('1. 在角色管理中为相关角色分配此菜单权限');
			console.log('2. 访问 /admin/system/action_logs 查看页面');
		} else {
			console.error('❌ Action Logs 菜单创建失败');
		}
		
	} catch (error) {
		console.error('❌ 执行失败:', error);
		process.exit(1);
	} finally {
		await client.close();
		console.log('\n=== 脚本执行完成 ===');
	}
}

// 运行脚本
addActionLogsMenu();

