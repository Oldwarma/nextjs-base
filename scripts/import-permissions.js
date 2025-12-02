/**
 * 从 MongoDB 导出的 JSON 文件导入权限数据到 PostgreSQL
 * 
 * 使用方法:
 *   bun run scripts/import-permissions.js
 * 
 * 注意:
 *   1. 确保数据库已连接
 *   2. 此脚本会先清空现有权限数据，然后导入新数据
 *   3. 如果只想追加数据，请注释掉 clearExistingPermissions() 调用
 */

// 加载环境变量
import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../lib/generated/prisma/client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建 Prisma 客户端（使用 pg 适配器）
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	console.error('❌ DATABASE_URL environment variable is not set');
	console.error('请确保 .env 文件中设置了 DATABASE_URL');
	process.exit(1);
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// MongoDB 导出的权限数据（从 nextjs_base.permissions.json 转换）
const mongoPermissions = [
	{
		id: 'sys-crud-basic',
		name: 'CRUD Basic Permissions',
		remark: '基础 CRUD 权限分类，根据 action 命名自动匹配',
		enable: true,
		sort: 0,
		crudCategory: 0,
		level: 0,
		actions: [],
		apis: [],
		parentId: null,
	},
	{
		id: 'sys-crud-create',
		name: 'Create (All)',
		remark: '所有创建操作。匹配 sysCreate*/create*Action/add*Action',
		enable: true,
		sort: 101,
		crudCategory: 1,
		level: 1,
		parentId: 'sys-crud-basic',
		actions: ['sysCreate*', '**/create*Action', '**/add*Action', '**/new*Action'],
		apis: [],
	},
	{
		id: 'sys-crud-read',
		name: 'Read (All)',
		remark: '所有读取/查询操作。匹配 sysGet*/sysQuery*/get*Action/query*Action',
		enable: true,
		sort: 102,
		crudCategory: 4,
		level: 1,
		parentId: 'sys-crud-basic',
		actions: [
			'sysGet*',
			'sysQuery*',
			'**/get*Action',
			'**/query*Action',
			'**/find*Action',
			'**/list*Action',
			'**/search*Action',
		],
		apis: [],
	},
	{
		id: 'sys-crud-update',
		name: 'Update (All)',
		remark: '所有更新/编辑操作。匹配 sysUpdate*/update*Action/edit*Action',
		enable: true,
		sort: 103,
		crudCategory: 2,
		level: 1,
		parentId: 'sys-crud-basic',
		actions: [
			'sysUpdate*',
			'sysBatchUpdate*',
			'sysToggle*',
			'sysAssign*',
			'sysBind*',
			'sysActivate*',
			'sysDeactivate*',
			'**/update*Action',
			'**/edit*Action',
			'**/toggle*Action',
			'**/assign*Action',
			'**/bind*Action',
		],
		apis: [],
	},
	{
		id: 'sys-crud-delete',
		name: 'Delete (All)',
		remark: '所有删除操作。匹配 sysDelete*/delete*Action/remove*Action',
		enable: true,
		sort: 104,
		crudCategory: 3,
		level: 2,
		parentId: 'sys-crud-basic',
		actions: [
			'sysDelete*',
			'sysBatchDelete*',
			'**/delete*Action',
			'**/remove*Action',
			'**/batchDelete*Action',
		],
		apis: [],
	},
	{
		id: 'sys-rbac',
		name: 'RBAC Management',
		remark: '用户、角色、权限、菜单管理',
		enable: true,
		sort: 200,
		crudCategory: 5,
		level: 0,
		actions: [],
		apis: [],
		parentId: null,
	},
	{
		id: 'sys-rbac-user',
		name: 'User Management',
		remark: '用户管理相关操作',
		enable: true,
		sort: 201,
		crudCategory: 5,
		level: 1,
		parentId: 'sys-rbac',
		actions: [
			'sysQueryUserList',
			'sysGetUserList',
			'sysGetUserDetail',
			'createUserAction',
			'updateUserAction',
			'deleteUserAction',
			'getUserDetailAction',
			'getUserRolesAction',
			'getUserStatsAction',
			'batchUpdateUsersAction',
		],
		apis: [],
	},
	{
		id: 'sys-rbac-user-special',
		name: 'User Special Operations',
		remark: '用户特殊操作：重置密码、绑定角色、封禁/解封',
		enable: true,
		sort: 202,
		crudCategory: 5,
		level: 2,
		parentId: 'sys-rbac-user',
		actions: ['sysResetUserPassword', 'sysBindUserRoles', 'sysBanUser', 'sysUnbanUser'],
		apis: [],
	},
	{
		id: 'sys-rbac-role',
		name: 'Role Management',
		remark: '角色管理相关操作',
		enable: true,
		sort: 210,
		crudCategory: 5,
		level: 1,
		parentId: 'sys-rbac',
		actions: [
			'sysGetRoleList',
			'sysGetRoleDetail',
			'sysCreateRole',
			'sysUpdateRole',
			'sysDeleteRole',
			'sysBatchUpdateRole',
			'sysBatchDeleteRole',
			'sysQueryRoleListForSelect',
			'sysAssignPermissionsToRole',
			'sysAssignMenusToRole',
			'sysToggleRoleStatus',
		],
		apis: [],
	},
	{
		id: 'sys-rbac-menu',
		name: 'Menu Management',
		remark: '菜单管理相关操作',
		enable: true,
		sort: 220,
		crudCategory: 5,
		level: 1,
		parentId: 'sys-rbac',
		actions: [
			'sysGetMenuList',
			'sysGetMenuDetail',
			'sysCreateMenu',
			'sysUpdateMenu',
			'sysDeleteMenu',
			'sysBatchUpdateMenu',
			'sysBatchDeleteMenu',
			'sysQueryMenuTree',
			'sysQueryMenuTreeForSelect',
		],
		apis: [],
	},
	{
		id: 'sys-rbac-permission',
		name: 'Permission Management',
		remark: '权限管理相关操作',
		enable: true,
		sort: 230,
		crudCategory: 5,
		level: 2,
		parentId: 'sys-rbac',
		actions: [
			'sysGetPermissionList',
			'sysGetPermissionDetail',
			'sysCreatePermission',
			'sysUpdatePermission',
			'sysDeletePermission',
			'sysBatchUpdatePermission',
			'sysBatchDeletePermission',
			'sysQueryPermissionTree',
			'sysQueryPermissionTreeForSelect',
			'sysQueryPermissionListForSelect',
		],
		apis: [],
	},
	{
		id: 'sys-assets',
		name: 'Assets Management',
		remark: '素材/文件管理',
		enable: true,
		sort: 300,
		crudCategory: 5,
		level: 0,
		actions: [],
		apis: [],
		parentId: null,
	},
	{
		id: 'sys-assets-read',
		name: 'Assets - Read',
		remark: '查看素材列表和详情',
		enable: true,
		sort: 301,
		crudCategory: 4,
		level: 1,
		parentId: 'sys-assets',
		actions: ['sysQueryUploadList', 'sysGetAssetList', 'sysGetAssetDetail'],
		apis: ['GET:/api/upload'],
	},
	{
		id: 'sys-assets-upload',
		name: 'Assets - Upload',
		remark: '上传文件',
		enable: true,
		sort: 302,
		crudCategory: 1,
		level: 1,
		parentId: 'sys-assets',
		actions: [],
		apis: ['POST:/api/upload'],
	},
	{
		id: 'sys-assets-delete',
		name: 'Assets - Delete',
		remark: '删除素材',
		enable: true,
		sort: 303,
		crudCategory: 3,
		level: 2,
		parentId: 'sys-assets',
		actions: ['sysDeleteAsset', 'sysBatchDeleteAsset'],
		apis: ['DELETE:/api/upload'],
	},
	{
		id: 'sys-cms',
		name: 'CMS Management',
		remark: '内容管理系统',
		enable: true,
		sort: 400,
		crudCategory: 5,
		level: 0,
		actions: [],
		apis: [],
		parentId: null,
	},
	{
		id: 'sys-cms-post',
		name: 'Post Management',
		remark: '文章/内容管理',
		enable: true,
		sort: 401,
		crudCategory: 5,
		level: 1,
		parentId: 'sys-cms',
		actions: [
			'sysGetPostList',
			'sysGetPostDetail',
			'sysCreatePost',
			'sysUpdatePost',
			'sysDeletePost',
			'sysBatchUpdatePost',
			'sysBatchDeletePost',
			'sysActivatePost',
			'sysDeactivatePost',
		],
		apis: [],
	},
	{
		id: 'sys-system',
		name: 'System Management',
		remark: '系统管理功能',
		enable: true,
		sort: 500,
		crudCategory: 5,
		level: 0,
		actions: [],
		apis: [],
		parentId: null,
	},
	{
		id: 'sys-system-dashboard',
		name: 'Dashboard',
		remark: '仪表盘统计数据',
		enable: true,
		sort: 501,
		crudCategory: 4,
		level: 1,
		parentId: 'sys-system',
		actions: ['sysQueryDashboard'],
		apis: [],
	},
	{
		id: 'sys-system-logs',
		name: 'Action Logs',
		remark: '操作日志查看',
		enable: true,
		sort: 502,
		crudCategory: 4,
		level: 1,
		parentId: 'sys-system',
		actions: ['sysGetActionLogList', 'sysGetActionLogDetail'],
		apis: [],
	},
	{
		id: 'sys-system-usage',
		name: 'Usage Statistics',
		remark: '使用记录和统计',
		enable: true,
		sort: 503,
		crudCategory: 4,
		level: 1,
		parentId: 'sys-system',
		actions: [
			'sysGetUsageLogList',
			'sysGetUsageLogDetail',
			'sysQueryUsageStats',
			'sysQueryUserUsageStats',
		],
		apis: [],
	},
	{
		id: 'sys-api',
		name: 'API Access',
		remark: 'API 访问权限',
		enable: true,
		sort: 600,
		crudCategory: 5,
		level: 0,
		actions: [],
		apis: [],
		parentId: null,
	},
	{
		id: 'sys-api-test',
		name: 'API - System Test',
		remark: '系统级别测试 API',
		enable: true,
		sort: 601,
		crudCategory: 4,
		level: 1,
		parentId: 'sys-api',
		actions: ['sysGetSystemInfo'],
		apis: ['/api/v1/sys/test', 'GET:/api/v1/sys/test'],
	},
];

/**
 * 清空现有权限数据
 */
async function clearExistingPermissions() {
	console.log('Clearing existing permissions...');
	await prisma.permission.deleteMany({});
	console.log('Existing permissions cleared.');
}

/**
 * 导入权限数据
 * 由于有父子关系，需要先导入父级权限，再导入子级权限
 */
async function importPermissions() {
	console.log('Starting permission import...');
	console.log(`Total permissions to import: ${mongoPermissions.length}`);

	// 创建 ID 映射表（MongoDB ID -> PostgreSQL UUID）
	const idMapping = new Map();

	// 第一步：导入所有根级权限（parentId 为 null）
	const rootPermissions = mongoPermissions.filter((p) => p.parentId === null);
	console.log(`\nImporting ${rootPermissions.length} root permissions...`);

	for (const perm of rootPermissions) {
		const created = await prisma.permission.create({
			data: {
				name: perm.name,
				remark: perm.remark,
				enable: perm.enable,
				sort: perm.sort,
				crudCategory: perm.crudCategory,
				level: perm.level,
				actions: perm.actions,
				apis: perm.apis,
				parentId: null,
			},
		});
		idMapping.set(perm.id, created.id);
		console.log(`  ✓ Created root permission: ${perm.name} (${perm.id} -> ${created.id})`);
	}

	// 第二步：导入子级权限（按层级顺序）
	// 先收集所有子权限
	const childPermissions = mongoPermissions.filter((p) => p.parentId !== null);

	// 按层级排序（确保父级先被创建）
	// 简单方法：多轮导入，每轮导入父级已存在的权限
	let remaining = [...childPermissions];
	let round = 1;
	const maxRounds = 10; // 防止无限循环

	while (remaining.length > 0 && round <= maxRounds) {
		console.log(`\nRound ${round}: Processing ${remaining.length} remaining permissions...`);
		const stillRemaining = [];

		for (const perm of remaining) {
			const parentUUID = idMapping.get(perm.parentId);

			if (parentUUID) {
				// 父级已存在，可以创建
				const created = await prisma.permission.create({
					data: {
						name: perm.name,
						remark: perm.remark,
						enable: perm.enable,
						sort: perm.sort,
						crudCategory: perm.crudCategory,
						level: perm.level,
						actions: perm.actions,
						apis: perm.apis,
						parentId: parentUUID,
					},
				});
				idMapping.set(perm.id, created.id);
				console.log(`  ✓ Created child permission: ${perm.name} (${perm.id} -> ${created.id})`);
			} else {
				// 父级还不存在，留到下一轮
				stillRemaining.push(perm);
			}
		}

		remaining = stillRemaining;
		round++;
	}

	if (remaining.length > 0) {
		console.warn(`\n⚠️ Warning: ${remaining.length} permissions could not be imported (orphaned):`);
		remaining.forEach((p) => console.warn(`  - ${p.name} (parentId: ${p.parentId})`));
	}

	console.log(`\n✅ Import completed! Total imported: ${idMapping.size} permissions`);

	// 输出 ID 映射表（方便后续参考）
	console.log('\n📋 ID Mapping (MongoDB ID -> PostgreSQL UUID):');
	idMapping.forEach((uuid, mongoId) => {
		console.log(`  ${mongoId} -> ${uuid}`);
	});

	return idMapping;
}

/**
 * 验证导入结果
 */
async function verifyImport() {
	console.log('\n🔍 Verifying import...');

	const count = await prisma.permission.count();
	console.log(`Total permissions in database: ${count}`);

	// 检查树形结构
	const rootCount = await prisma.permission.count({ where: { parentId: null } });
	const childCount = await prisma.permission.count({ where: { parentId: { not: null } } });
	console.log(`  - Root permissions: ${rootCount}`);
	console.log(`  - Child permissions: ${childCount}`);

	// 列出所有权限（树形展示）
	console.log('\n📂 Permission Tree:');
	const allPermissions = await prisma.permission.findMany({
		orderBy: [{ sort: 'asc' }, { name: 'asc' }],
	});

	const rootPerms = allPermissions.filter((p) => p.parentId === null);

	function printTree(permissions, parentId, indent = '') {
		const children = permissions.filter((p) => p.parentId === parentId);
		children.forEach((child, index) => {
			const isLast = index === children.length - 1;
			const prefix = isLast ? '└── ' : '├── ';
			const childIndent = isLast ? '    ' : '│   ';
			console.log(`${indent}${prefix}${child.name} (sort: ${child.sort})`);
			printTree(permissions, child.id, indent + childIndent);
		});
	}

	rootPerms.forEach((root) => {
		console.log(`📁 ${root.name} (sort: ${root.sort})`);
		printTree(allPermissions, root.id, '');
	});
}

/**
 * 主函数
 */
async function main() {
	console.log('='.repeat(60));
	console.log('Permission Import Script');
	console.log('='.repeat(60));

	try {
		// 检查数据库连接
		await prisma.$queryRaw`SELECT 1`;
		console.log('✓ Database connection successful\n');

		// 询问是否清空现有数据（这里默认清空，如需保留请注释下一行）
		await clearExistingPermissions();

		// 导入权限
		await importPermissions();

		// 验证导入结果
		await verifyImport();

		console.log('\n' + '='.repeat(60));
		console.log('✅ All done!');
		console.log('='.repeat(60));
	} catch (error) {
		console.error('\n❌ Error:', error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

// 运行
main();

