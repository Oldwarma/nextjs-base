/**
 * PostgreSQL 数据库初始化脚本
 * 使用 Prisma 进行数据库迁移和初始数据插入
 */

import { prisma } from '../lib/database/postgresql.js';

async function initDatabase() {
	console.log('Starting PostgreSQL database initialization...');

	try {
		// 1. 检查数据库连接
		console.log('Checking database connection...');
		await prisma.$queryRaw`SELECT 1`;
		console.log('Database connection successful!');

		// 2. 插入默认角色
		console.log('Creating default roles...');
		const existingRoles = await prisma.role.count();
		if (existingRoles === 0) {
			await prisma.role.createMany({
				data: [
					{
						name: 'admin',
						remark: 'Super administrator with full access',
						enable: true,
						permission: [],
						menu: [],
						inheritMenuPermissions: true,
					},
					{
						name: 'editor',
						remark: 'Content editor with limited access',
						enable: true,
						permission: [],
						menu: [],
						inheritMenuPermissions: false,
					},
					{
						name: 'viewer',
						remark: 'Read-only access',
						enable: true,
						permission: [],
						menu: [],
						inheritMenuPermissions: false,
					},
				],
			});
			console.log('Default roles created successfully');
		} else {
			console.log('Roles already exist, skipping...');
		}

		// 3. 插入默认权限（树形结构）
		console.log('Creating default permissions...');
		const existingPermissions = await prisma.permission.count();
		if (existingPermissions === 0) {
			// 创建根级权限
			const sysPermission = await prisma.permission.create({
				data: {
					name: 'System Management',
					remark: 'System management permissions',
					enable: true,
					sort: 1,
					crudCategory: 0,
					level: 0,
					actions: [],
					apis: [],
				},
			});

			// 创建子权限
			await prisma.permission.createMany({
				data: [
					{
						name: 'User Management',
						parentId: sysPermission.id,
						remark: 'Manage users',
						enable: true,
						sort: 1,
						crudCategory: 5, // 全部
						level: 1,
						actions: ['sysQueryUser', 'sysCreateUser', 'sysUpdateUser', 'sysDeleteUser'],
						apis: [],
					},
					{
						name: 'Role Management',
						parentId: sysPermission.id,
						remark: 'Manage roles',
						enable: true,
						sort: 2,
						crudCategory: 5,
						level: 1,
						actions: ['sysQueryRole', 'sysCreateRole', 'sysUpdateRole', 'sysDeleteRole'],
						apis: [],
					},
					{
						name: 'Permission Management',
						parentId: sysPermission.id,
						remark: 'Manage permissions',
						enable: true,
						sort: 3,
						crudCategory: 5,
						level: 2,
						actions: ['sysQueryPermission', 'sysCreatePermission', 'sysUpdatePermission', 'sysDeletePermission'],
						apis: [],
					},
					{
						name: 'Menu Management',
						parentId: sysPermission.id,
						remark: 'Manage menus',
						enable: true,
						sort: 4,
						crudCategory: 5,
						level: 1,
						actions: ['sysQueryMenu', 'sysCreateMenu', 'sysUpdateMenu', 'sysDeleteMenu'],
						apis: [],
					},
				],
			});
			console.log('Default permissions created successfully');
		} else {
			console.log('Permissions already exist, skipping...');
		}

		// 4. 插入默认菜单（树形结构）
		console.log('Creating default menus...');
		const existingMenus = await prisma.menu.count();
		if (existingMenus === 0) {
			// 创建根级菜单
			const rbacMenu = await prisma.menu.create({
				data: {
					name: 'RBAC',
					url: '/admin/rbac',
					icon: 'SafetyCertificateOutlined',
					sort: 1,
					enable: true,
					hidden: false,
					permission: [],
				},
			});

			const systemMenu = await prisma.menu.create({
				data: {
					name: 'System',
					url: '/admin/system',
					icon: 'SettingOutlined',
					sort: 2,
					enable: true,
					hidden: false,
					permission: [],
				},
			});

			// 创建 RBAC 子菜单
			await prisma.menu.createMany({
				data: [
					{
						name: 'Users',
						parentId: rbacMenu.id,
						url: '/admin/rbac/users',
						sort: 1,
						enable: true,
						hidden: false,
						permission: [],
					},
					{
						name: 'Roles',
						parentId: rbacMenu.id,
						url: '/admin/rbac/roles',
						sort: 2,
						enable: true,
						hidden: false,
						permission: [],
					},
					{
						name: 'Permissions',
						parentId: rbacMenu.id,
						url: '/admin/rbac/permissions',
						sort: 3,
						enable: true,
						hidden: false,
						permission: [],
					},
					{
						name: 'Menus',
						parentId: rbacMenu.id,
						url: '/admin/rbac/menus',
						sort: 4,
						enable: true,
						hidden: false,
						permission: [],
					},
				],
			});

			// 创建 System 子菜单
			await prisma.menu.createMany({
				data: [
					{
						name: 'Assets',
						parentId: systemMenu.id,
						url: '/admin/system/assets',
						sort: 1,
						enable: true,
						hidden: false,
						permission: [],
					},
					{
						name: 'Action Logs',
						parentId: systemMenu.id,
						url: '/admin/system/action_logs',
						sort: 2,
						enable: true,
						hidden: false,
						permission: [],
					},
				],
			});
			console.log('Default menus created successfully');
		} else {
			console.log('Menus already exist, skipping...');
		}

		console.log('Database initialization completed successfully!');
	} catch (error) {
		console.error('Database initialization failed:', error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

// 运行初始化
initDatabase().then(() => {
	console.log('Done!');
	process.exit(0);
});

