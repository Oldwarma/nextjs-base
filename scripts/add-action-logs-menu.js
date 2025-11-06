/**
 * 添加 Action Logs 菜单项
 * 
 * 使用方法：
 * 在 MongoDB Shell (mongosh) 中执行，或在 MongoDB Compass 的 MONGOSH 窗口中执行
 * 
 * 或使用 Node.js 执行：
 * node scripts/add-action-logs-menu.mjs
 */

// MongoDB Shell 版本（在 mongosh 中执行）
print('=== 添加 Action Logs 菜单项 ===\n');

// 1. 查找 System 模块的父菜单
const systemParent = db.menus.findOne({ name: 'System', type: 'group' });

if (!systemParent) {
	print('❌ 未找到 System 父菜单，请先创建 System 模块');
} else {
	print(`✅ 找到 System 父菜单: ${systemParent.name} (ID: ${systemParent.id})\n`);
	
	// 2. 检查是否已存在 Action Logs 菜单
	const existing = db.menus.findOne({ url: '/admin/system/action_logs' });
	
	if (existing) {
		print('⚠️  Action Logs 菜单已存在，跳过创建');
	} else {
		// 3. 生成新的菜单 ID
		const { v4: uuidv4 } = require('crypto');
		const menuId = uuidv4();
		
		// 4. 插入新菜单
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
		
		const result = db.menus.insertOne(newMenu);
		
		if (result.acknowledged) {
			print('✅ Action Logs 菜单创建成功！');
			print(`   - ID: ${menuId}`);
			print(`   - Name: ${newMenu.name}`);
			print(`   - URL: ${newMenu.url}`);
			print(`   - Parent: ${systemParent.name}`);
		} else {
			print('❌ Action Logs 菜单创建失败');
		}
	}
}

print('\n=== 脚本执行完成 ===');

