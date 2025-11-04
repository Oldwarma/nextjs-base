/**
 * 更新菜单 URL 脚本
 * 
 * 用途：将旧的扁平化菜单 URL 更新为新的模块化 URL
 * 
 * 使用方法：
 * 1. 在 MongoDB Shell 中执行：
 *    mongosh mongodb://localhost:27017/your_database_name < scripts/update-menu-urls.js
 * 
 * 2. 或者直接在 MongoDB Compass 的 MONGOSH 窗口中粘贴执行
 */

print('开始更新菜单 URL...\n');

// RBAC 模块 - 用户权限管理
print('=== 更新 RBAC 模块菜单 ===');

const rbacUpdates = [
	{ old: '/admin/users', new: '/admin/rbac/users', name: '用户管理' },
	{ old: '/admin/roles', new: '/admin/rbac/roles', name: '角色管理' },
	{ old: '/admin/permissions', new: '/admin/rbac/permissions', name: '权限管理' },
	{ old: '/admin/menus', new: '/admin/rbac/menus', name: '菜单管理' },
];

rbacUpdates.forEach(({ old: oldUrl, new: newUrl, name }) => {
	const result = db.menus.updateOne(
		{ url: oldUrl },
		{ $set: { url: newUrl, updatedAt: new Date() } }
	);
	print(`✅ ${name}: ${oldUrl} → ${newUrl} (匹配: ${result.matchedCount}, 修改: ${result.modifiedCount})`);
});

// Finance 模块 - 财务管理
print('\n=== 更新 Finance 模块菜单 ===');

const financeUpdates = [
	{ old: '/admin/credits', new: '/admin/finance/credits', name: '积分管理' },
	{ old: '/admin/packages', new: '/admin/finance/packages', name: '套餐管理' },
];

financeUpdates.forEach(({ old: oldUrl, new: newUrl, name }) => {
	const result = db.menus.updateOne(
		{ url: oldUrl },
		{ $set: { url: newUrl, updatedAt: new Date() } }
	);
	print(`✅ ${name}: ${oldUrl} → ${newUrl} (匹配: ${result.matchedCount}, 修改: ${result.modifiedCount})`);
});

// System 模块 - 系统管理
print('\n=== 更新 System 模块菜单 ===');

const systemUpdates = [
	{ old: '/admin/usage', new: '/admin/system/usage', name: '使用统计' },
	{ old: '/admin/settings', new: '/admin/system/settings', name: '系统设置' },
];

systemUpdates.forEach(({ old: oldUrl, new: newUrl, name }) => {
	const result = db.menus.updateOne(
		{ url: oldUrl },
		{ $set: { url: newUrl, updatedAt: new Date() } }
	);
	print(`✅ ${name}: ${oldUrl} → ${newUrl} (匹配: ${result.matchedCount}, 修改: ${result.modifiedCount})`);
});

// 验证更新结果
print('\n=== 验证更新结果 ===');

const updatedMenus = db.menus.find({
	url: { $regex: '^/admin/(rbac|finance|system)' }
}).toArray();

print(`\n共找到 ${updatedMenus.length} 个使用新 URL 格式的菜单：\n`);

updatedMenus.forEach((menu) => {
	print(`  - ${menu.name || 'Unnamed'}: ${menu.url}`);
});

print('\n✅ 菜单 URL 更新完成！');
print('\n请访问后台管理页面验证菜单是否正常显示和跳转。\n');

