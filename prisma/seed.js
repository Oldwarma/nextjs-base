/**
 * Prisma 种子数据文件
 * 
 * 包含固定 ID 的 RBAC 和 Example 数据
 * 所有安装的系统 ID 一致，内置页面直接可用
 * 
 * 运行方式：bun run db:seed
 */

import { PrismaClient } from '../lib/generated/prisma/index.js';

const prisma = new PrismaClient();

// ============================================
// 权限数据 (Permissions)
// ============================================
const permissions = [
	// 根级分类
	{
		id: '1f9321bf-bbb6-41d6-88eb-c39cdb0cd33f',
		name: 'CRUD Basic Permissions',
		parentId: null,
		remark: '基础 CRUD 权限分类，根据 action 命名自动匹配',
		enable: true,
		sort: 0,
		crudCategory: 0,
		level: 0,
		actions: [],
		apis: [],
	},
	{
		id: '9733a3a2-5eb3-446c-a4c7-f13b8b1b77ce',
		name: 'RBAC Management',
		parentId: null,
		remark: '用户、角色、权限、菜单管理',
		enable: true,
		sort: 200,
		crudCategory: 5,
		level: 0,
		actions: [],
		apis: [],
	},
	{
		id: 'b28c912c-c8bb-44e0-9a3d-282f751dd0e0',
		name: 'Assets Management',
		parentId: null,
		remark: '素材/文件管理',
		enable: true,
		sort: 300,
		crudCategory: 5,
		level: 0,
		actions: [],
		apis: [],
	},
	{
		id: '48418b0f-685b-4a1e-a9d7-c6b7bc84cbd6',
		name: 'CMS Management',
		parentId: null,
		remark: '内容管理系统',
		enable: true,
		sort: 400,
		crudCategory: 5,
		level: 0,
		actions: [],
		apis: [],
	},
	{
		id: '9c32d333-c96f-4d83-ba0a-b3a360e5f729',
		name: 'System Management',
		parentId: null,
		remark: '系统管理功能',
		enable: true,
		sort: 500,
		crudCategory: 5,
		level: 0,
		actions: [],
		apis: [],
	},
	{
		id: '7e3eb4c3-f337-4ac7-89b0-628927aee1cd',
		name: 'API Access',
		parentId: null,
		remark: 'API 访问权限',
		enable: true,
		sort: 600,
		crudCategory: 5,
		level: 0,
		actions: [],
		apis: [],
	},
	{
		id: '55555555-5555-4555-8555-555555555550',
		name: 'Example Management',
		parentId: null,
		remark: 'Example 示例管理',
		enable: true,
		sort: 410,
		crudCategory: 0,
		level: 0,
		actions: [],
		apis: [],
	},

	// CRUD Basic Permissions 子级
	{
		id: '4fa91cdf-ea8b-47f2-b129-6ea2bc4cadfb',
		name: 'Create (All)',
		parentId: '1f9321bf-bbb6-41d6-88eb-c39cdb0cd33f',
		remark: '所有创建操作。匹配 sysCreate*/create*Action/add*Action',
		enable: true,
		sort: 101,
		crudCategory: 1,
		level: 1,
		actions: ['sysCreate*', '**/create*Action', '**/add*Action', '**/new*Action'],
		apis: [],
	},
	{
		id: '41b41452-a14b-43ee-bef4-6a75d78b18e3',
		name: 'Read (All)',
		parentId: '1f9321bf-bbb6-41d6-88eb-c39cdb0cd33f',
		remark: '所有读取/查询操作。匹配 sysGet*/sysQuery*/get*Action/query*Action',
		enable: true,
		sort: 102,
		crudCategory: 4,
		level: 1,
		actions: ['sysGet*', 'sysQuery*', '**/get*Action', '**/query*Action', '**/find*Action', '**/list*Action', '**/search*Action'],
		apis: [],
	},
	{
		id: '66ceafc5-bcd3-435e-8460-a022c533e86b',
		name: 'Update (All)',
		parentId: '1f9321bf-bbb6-41d6-88eb-c39cdb0cd33f',
		remark: '所有更新/编辑操作。匹配 sysUpdate*/update*Action/edit*Action',
		enable: true,
		sort: 103,
		crudCategory: 2,
		level: 1,
		actions: ['sysUpdate*', 'sysBatchUpdate*', 'sysToggle*', 'sysAssign*', 'sysBind*', 'sysActivate*', 'sysDeactivate*', '**/update*Action', '**/edit*Action', '**/toggle*Action', '**/assign*Action', '**/bind*Action'],
		apis: [],
	},
	{
		id: 'c2317a15-8310-4e4c-bf7d-f1647c31ca31',
		name: 'Delete (All)',
		parentId: '1f9321bf-bbb6-41d6-88eb-c39cdb0cd33f',
		remark: '所有删除操作。匹配 sysDelete*/delete*Action/remove*Action',
		enable: true,
		sort: 104,
		crudCategory: 3,
		level: 2,
		actions: ['sysDelete*', 'sysBatchDelete*', '**/delete*Action', '**/remove*Action', '**/batchDelete*Action'],
		apis: [],
	},

	// RBAC Management 子级
	{
		id: 'd6d671e4-1030-4cbd-9435-34d3ead90296',
		name: 'User Management',
		parentId: '9733a3a2-5eb3-446c-a4c7-f13b8b1b77ce',
		remark: '用户管理相关操作',
		enable: true,
		sort: 201,
		crudCategory: 5,
		level: 1,
		actions: ['sysQueryUserList', 'sysGetUserList', 'sysGetUserDetail', 'createUserAction', 'updateUserAction', 'deleteUserAction', 'getUserDetailAction', 'getUserRolesAction', 'getUserStatsAction', 'batchUpdateUsersAction'],
		apis: [],
	},
	{
		id: 'c74eccaf-85cd-4ec6-a479-d0ac71149a7a',
		name: 'User Special Operations',
		parentId: 'd6d671e4-1030-4cbd-9435-34d3ead90296',
		remark: '用户特殊操作：重置密码、绑定角色、封禁/解封',
		enable: true,
		sort: 202,
		crudCategory: 5,
		level: 2,
		actions: ['sysResetUserPassword', 'sysBindUserRoles', 'sysBanUser', 'sysUnbanUser'],
		apis: [],
	},
	{
		id: '11111111-1111-4111-8111-111111111111',
		name: 'User Create',
		parentId: 'd6d671e4-1030-4cbd-9435-34d3ead90296',
		remark: '创建用户',
		enable: true,
		sort: 211,
		crudCategory: 1,
		level: 1,
		actions: ['sysCreateUser', 'createUserAction'],
		apis: [],
	},
	{
		id: '11111111-1111-4111-8111-111111111112',
		name: 'User Read',
		parentId: 'd6d671e4-1030-4cbd-9435-34d3ead90296',
		remark: '查看用户列表与详情',
		enable: true,
		sort: 212,
		crudCategory: 4,
		level: 1,
		actions: ['sysQueryUser*', 'sysGetUser*', 'getUserDetailAction', 'getUserRolesAction', 'getUserStatsAction'],
		apis: [],
	},
	{
		id: '11111111-1111-4111-8111-111111111113',
		name: 'User Update',
		parentId: 'd6d671e4-1030-4cbd-9435-34d3ead90296',
		remark: '更新用户/绑定角色/封禁',
		enable: true,
		sort: 213,
		crudCategory: 2,
		level: 2,
		actions: ['sysUpdateUser', 'sysBatchUpdateUser', 'updateUserAction', 'sysBindUserRoles', 'sysResetUserPassword', 'sysBanUser', 'sysUnbanUser', 'batchUpdateUsersAction'],
		apis: [],
	},
	{
		id: '11111111-1111-4111-8111-111111111114',
		name: 'User Delete',
		parentId: 'd6d671e4-1030-4cbd-9435-34d3ead90296',
		remark: '删除用户',
		enable: true,
		sort: 214,
		crudCategory: 3,
		level: 2,
		actions: ['sysDeleteUser', 'sysBatchDeleteUser', 'deleteUserAction'],
		apis: [],
	},

	// Role Management
	{
		id: '242fc188-90fe-4a23-b14c-f4b8502a3826',
		name: 'Role Management',
		parentId: '9733a3a2-5eb3-446c-a4c7-f13b8b1b77ce',
		remark: '角色管理相关操作',
		enable: true,
		sort: 210,
		crudCategory: 5,
		level: 1,
		actions: ['sysGetRoleList', 'sysGetRoleDetail', 'sysCreateRole', 'sysUpdateRole', 'sysDeleteRole', 'sysBatchUpdateRole', 'sysBatchDeleteRole', 'sysQueryRoleListForSelect', 'sysAssignPermissionsToRole', 'sysAssignMenusToRole', 'sysToggleRoleStatus'],
		apis: [],
	},
	{
		id: '22222222-2222-4222-8222-222222222221',
		name: 'Role Create',
		parentId: '242fc188-90fe-4a23-b14c-f4b8502a3826',
		remark: '创建角色',
		enable: true,
		sort: 221,
		crudCategory: 1,
		level: 1,
		actions: ['sysCreateRole'],
		apis: [],
	},
	{
		id: '22222222-2222-4222-8222-222222222222',
		name: 'Role Read',
		parentId: '242fc188-90fe-4a23-b14c-f4b8502a3826',
		remark: '查看角色列表与详情',
		enable: true,
		sort: 222,
		crudCategory: 4,
		level: 1,
		actions: ['sysGetRole*', 'sysQueryRoleListForSelect'],
		apis: [],
	},
	{
		id: '22222222-2222-4222-8222-222222222223',
		name: 'Role Update',
		parentId: '242fc188-90fe-4a23-b14c-f4b8502a3826',
		remark: '更新角色/分配权限菜单',
		enable: true,
		sort: 223,
		crudCategory: 2,
		level: 1,
		actions: ['sysUpdateRole', 'sysBatchUpdateRole', 'sysAssignPermissionsToRole', 'sysAssignMenusToRole', 'sysToggleRoleStatus'],
		apis: [],
	},
	{
		id: '22222222-2222-4222-8222-222222222224',
		name: 'Role Delete',
		parentId: '242fc188-90fe-4a23-b14c-f4b8502a3826',
		remark: '删除角色',
		enable: true,
		sort: 224,
		crudCategory: 3,
		level: 2,
		actions: ['sysDeleteRole', 'sysBatchDeleteRole'],
		apis: [],
	},

	// Permission Management
	{
		id: '88165596-bca6-4b30-a7ae-fc30bbe67391',
		name: 'Permission Management',
		parentId: '9733a3a2-5eb3-446c-a4c7-f13b8b1b77ce',
		remark: '权限管理相关操作',
		enable: true,
		sort: 230,
		crudCategory: 5,
		level: 2,
		actions: ['sysGetPermissionList', 'sysGetPermissionDetail', 'sysCreatePermission', 'sysUpdatePermission', 'sysDeletePermission', 'sysBatchUpdatePermission', 'sysBatchDeletePermission', 'sysQueryPermissionTree', 'sysQueryPermissionTreeForSelect', 'sysQueryPermissionListForSelect'],
		apis: [],
	},
	{
		id: '33333333-3333-4333-8333-333333333331',
		name: 'Permission Create',
		parentId: '88165596-bca6-4b30-a7ae-fc30bbe67391',
		remark: '创建权限',
		enable: true,
		sort: 231,
		crudCategory: 1,
		level: 1,
		actions: ['sysCreatePermission'],
		apis: [],
	},
	{
		id: '33333333-3333-4333-8333-333333333332',
		name: 'Permission Read',
		parentId: '88165596-bca6-4b30-a7ae-fc30bbe67391',
		remark: '查看权限列表与详情',
		enable: true,
		sort: 232,
		crudCategory: 4,
		level: 1,
		actions: ['sysGetPermission*', 'sysQueryPermissionTree', 'sysQueryPermissionTreeForSelect', 'sysQueryPermissionListForSelect'],
		apis: [],
	},
	{
		id: '33333333-3333-4333-8333-333333333333',
		name: 'Permission Update',
		parentId: '88165596-bca6-4b30-a7ae-fc30bbe67391',
		remark: '更新权限',
		enable: true,
		sort: 233,
		crudCategory: 2,
		level: 1,
		actions: ['sysUpdatePermission', 'sysBatchUpdatePermission'],
		apis: [],
	},
	{
		id: '33333333-3333-4333-8333-333333333334',
		name: 'Permission Delete',
		parentId: '88165596-bca6-4b30-a7ae-fc30bbe67391',
		remark: '删除权限',
		enable: true,
		sort: 234,
		crudCategory: 3,
		level: 2,
		actions: ['sysDeletePermission', 'sysBatchDeletePermission'],
		apis: [],
	},

	// Menu Management
	{
		id: 'b486feac-b73e-4f56-8894-486828c6f154',
		name: 'Menu Management',
		parentId: '9733a3a2-5eb3-446c-a4c7-f13b8b1b77ce',
		remark: '菜单管理相关操作',
		enable: true,
		sort: 220,
		crudCategory: 5,
		level: 1,
		actions: ['sysGetMenuList', 'sysGetMenuDetail', 'sysCreateMenu', 'sysUpdateMenu', 'sysDeleteMenu', 'sysBatchUpdateMenu', 'sysBatchDeleteMenu', 'sysQueryMenuTree', 'sysQueryMenuTreeForSelect'],
		apis: [],
	},
	{
		id: '44444444-4444-4444-8444-444444444441',
		name: 'Menu Create',
		parentId: 'b486feac-b73e-4f56-8894-486828c6f154',
		remark: '创建菜单',
		enable: true,
		sort: 241,
		crudCategory: 1,
		level: 1,
		actions: ['sysCreateMenu'],
		apis: [],
	},
	{
		id: '44444444-4444-4444-8444-444444444442',
		name: 'Menu Read',
		parentId: 'b486feac-b73e-4f56-8894-486828c6f154',
		remark: '查看菜单列表与详情',
		enable: true,
		sort: 242,
		crudCategory: 4,
		level: 1,
		actions: ['sysGetMenu*', 'sysQueryMenuTree', 'sysQueryMenuTreeForSelect'],
		apis: [],
	},
	{
		id: '44444444-4444-4444-8444-444444444443',
		name: 'Menu Update',
		parentId: 'b486feac-b73e-4f56-8894-486828c6f154',
		remark: '更新菜单',
		enable: true,
		sort: 243,
		crudCategory: 2,
		level: 1,
		actions: ['sysUpdateMenu', 'sysBatchUpdateMenu'],
		apis: [],
	},
	{
		id: '44444444-4444-4444-8444-444444444444',
		name: 'Menu Delete',
		parentId: 'b486feac-b73e-4f56-8894-486828c6f154',
		remark: '删除菜单',
		enable: true,
		sort: 244,
		crudCategory: 3,
		level: 2,
		actions: ['sysDeleteMenu', 'sysBatchDeleteMenu'],
		apis: [],
	},

	// Assets Management 子级
	{
		id: '24d6331a-d142-48f3-bfa3-12cd831dae91',
		name: 'Assets - Read',
		parentId: 'b28c912c-c8bb-44e0-9a3d-282f751dd0e0',
		remark: '查看素材列表和详情',
		enable: true,
		sort: 301,
		crudCategory: 4,
		level: 1,
		actions: ['sysQueryUploadList', 'sysGetAssetList', 'sysGetAssetDetail'],
		apis: ['GET:/api/upload'],
	},
	{
		id: '30ab7d06-1704-4c24-86de-a77169546db8',
		name: 'Assets - Upload',
		parentId: 'b28c912c-c8bb-44e0-9a3d-282f751dd0e0',
		remark: '上传文件',
		enable: true,
		sort: 302,
		crudCategory: 1,
		level: 1,
		actions: [],
		apis: ['POST:/api/upload'],
	},
	{
		id: '63c7d7ca-33d1-4e12-8646-c02c0fc4c77b',
		name: 'Assets - Delete',
		parentId: 'b28c912c-c8bb-44e0-9a3d-282f751dd0e0',
		remark: '删除素材',
		enable: true,
		sort: 303,
		crudCategory: 3,
		level: 2,
		actions: ['sysDeleteAsset', 'sysBatchDeleteAsset'],
		apis: ['DELETE:/api/upload'],
	},

	// CMS Management 子级
	{
		id: '92e84378-d86c-4807-a998-a55c4f642c4a',
		name: 'Post Management',
		parentId: '48418b0f-685b-4a1e-a9d7-c6b7bc84cbd6',
		remark: '文章/内容管理',
		enable: true,
		sort: 401,
		crudCategory: 5,
		level: 1,
		actions: ['sysGetPostList', 'sysGetPostDetail', 'sysCreatePost', 'sysUpdatePost', 'sysDeletePost', 'sysBatchUpdatePost', 'sysBatchDeletePost', 'sysActivatePost', 'sysDeactivatePost'],
		apis: [],
	},

	// System Management 子级
	{
		id: '8b600d6b-25a1-4d33-9ee3-eaa5a904966e',
		name: 'Dashboard',
		parentId: '9c32d333-c96f-4d83-ba0a-b3a360e5f729',
		remark: '仪表盘统计数据',
		enable: true,
		sort: 501,
		crudCategory: 4,
		level: 1,
		actions: ['sysQueryDashboard'],
		apis: [],
	},
	{
		id: '416a3c28-787f-4497-b83e-f357e183f8e4',
		name: 'Action Logs',
		parentId: '9c32d333-c96f-4d83-ba0a-b3a360e5f729',
		remark: '操作日志查看',
		enable: true,
		sort: 502,
		crudCategory: 4,
		level: 1,
		actions: ['sysGetActionLogList', 'sysGetActionLogDetail'],
		apis: [],
	},
	{
		id: '4866f91d-a620-4e8f-8f37-2bc6b9d1dea3',
		name: 'Usage Statistics',
		parentId: '9c32d333-c96f-4d83-ba0a-b3a360e5f729',
		remark: '使用记录和统计',
		enable: true,
		sort: 503,
		crudCategory: 4,
		level: 1,
		actions: ['sysGetUsageLogList', 'sysGetUsageLogDetail', 'sysQueryUsageStats', 'sysQueryUserUsageStats'],
		apis: [],
	},

	// API Access 子级
	{
		id: 'd5dc395d-9319-467c-b29f-b69cac05ae2d',
		name: 'API - System Test',
		parentId: '7e3eb4c3-f337-4ac7-89b0-628927aee1cd',
		remark: '系统级别测试 API',
		enable: true,
		sort: 601,
		crudCategory: 4,
		level: 1,
		actions: ['sysGetSystemInfo'],
		apis: ['/api/v1/sys/test', 'GET:/api/v1/sys/test'],
	},

	// Example Management 子级
	{
		id: '55555555-5555-4555-8555-555555555551',
		name: 'Example Read',
		parentId: '55555555-5555-4555-8555-555555555550',
		remark: '查看示例数据',
		enable: true,
		sort: 411,
		crudCategory: 4,
		level: 1,
		actions: ['sysGetExample*', 'sysQueryExample*'],
		apis: [],
	},
	{
		id: '55555555-5555-4555-8555-555555555552',
		name: 'Example Write (no delete)',
		parentId: '55555555-5555-4555-8555-555555555550',
		remark: '创建/更新示例数据（不含删除）',
		enable: true,
		sort: 412,
		crudCategory: 2,
		level: 1,
		actions: ['sysCreateExample*', 'sysUpdateExample*', 'sysBatchUpdateExample*', 'sysActivateExample*', 'sysDeactivateExample*'],
		apis: [],
	},
	{
		id: '55555555-5555-4555-8555-555555555553',
		name: 'Example Delete',
		parentId: '55555555-5555-4555-8555-555555555550',
		remark: '删除示例数据',
		enable: true,
		sort: 413,
		crudCategory: 3,
		level: 2,
		actions: ['sysDeleteExample*', 'sysBatchDeleteExample*'],
		apis: [],
	},
];

// ============================================
// 菜单数据 (Menus)
// ============================================
const menus = [
	// 根级菜单
	{
		id: '3137d6b2-63c9-4f2e-8587-2b75b18d4a4f',
		name: 'Dashboard',
		parentId: null,
		url: '/admin',
		icon: 'DashboardOutlined',
		sort: 0,
		enable: true,
		hidden: false,
		remark: null,
		permission: ['8b600d6b-25a1-4d33-9ee3-eaa5a904966e'],
	},
	{
		id: '258bcd2f-78fe-43a9-bf19-3b312a6203ee',
		name: 'Example',
		parentId: null,
		url: null,
		icon: 'MenuOutlined',
		sort: 600,
		enable: true,
		hidden: false,
		remark: null,
		permission: [],
	},
	{
		id: '92a15a2b-ed06-409e-adbe-39f27857c581',
		name: 'User & Permission',
		parentId: null,
		url: null,
		icon: 'UserOutlined',
		sort: 700,
		enable: true,
		hidden: false,
		remark: null,
		permission: [],
	},
	{
		id: '65fe976d-c642-4d2c-bf6a-78e030e3ba94',
		name: 'System',
		parentId: null,
		url: '',
		icon: 'SettingOutlined',
		sort: 800,
		enable: true,
		hidden: false,
		remark: null,
		permission: [],
	},
	{
		id: '916fb6ea-5d0e-4964-8d16-13f279d172dc',
		name: 'Links',
		parentId: null,
		url: null,
		icon: 'LinkOutlined',
		sort: 900,
		enable: true,
		hidden: false,
		remark: null,
		permission: [],
	},

	// Example 子菜单
	{
		id: 'e22058d6-c656-49be-b020-019652e8ec00',
		name: 'Data Table',
		parentId: '258bcd2f-78fe-43a9-bf19-3b312a6203ee',
		url: '',
		icon: null,
		sort: 601,
		enable: true,
		hidden: false,
		remark: null,
		permission: [],
	},
	{
		id: 'a576c008-d72c-4128-a260-f8968681a409',
		name: 'Basic',
		parentId: 'e22058d6-c656-49be-b020-019652e8ec00',
		url: '/admin/example/data-table/data-table-basic',
		icon: null,
		sort: 0,
		enable: true,
		hidden: false,
		remark: null,
		permission: [],
	},
	{
		id: '0969f5c3-fdad-487e-b423-8de0c798f3d7',
		name: 'With Permissions',
		parentId: 'e22058d6-c656-49be-b020-019652e8ec00',
		url: '/admin/example/data-table/data-table-permission',
		icon: null,
		sort: 0,
		enable: true,
		hidden: false,
		remark: null,
		permission: ['55555555-5555-4555-8555-555555555552'],
	},

	// User & Permission 子菜单
	{
		id: 'eba77ce6-cb1a-4264-bdca-c5a81640e0b1',
		name: 'Users',
		parentId: '92a15a2b-ed06-409e-adbe-39f27857c581',
		url: '/admin/rbac/users',
		icon: null,
		sort: 701,
		enable: true,
		hidden: false,
		remark: null,
		permission: [],
	},
	{
		id: 'd8b27fc8-b529-4e8f-b5ac-22a6e6ebcea4',
		name: 'Roles',
		parentId: '92a15a2b-ed06-409e-adbe-39f27857c581',
		url: '/admin/rbac/roles',
		icon: null,
		sort: 702,
		enable: true,
		hidden: false,
		remark: null,
		permission: [],
	},
	{
		id: 'ad864ae6-797f-4e82-b275-499eece4edf8',
		name: 'Permissions',
		parentId: '92a15a2b-ed06-409e-adbe-39f27857c581',
		url: '/admin/rbac/permissions',
		icon: null,
		sort: 703,
		enable: true,
		hidden: false,
		remark: null,
		permission: [],
	},
	{
		id: '8bd9d3a3-f970-4d0e-9232-77c5d56e3ccb',
		name: 'Menus',
		parentId: '92a15a2b-ed06-409e-adbe-39f27857c581',
		url: '/admin/rbac/menus',
		icon: null,
		sort: 704,
		enable: true,
		hidden: false,
		remark: null,
		permission: [],
	},

	// System 子菜单
	{
		id: '78afe8f0-b0e7-4e3a-adb9-1fd6b56f97f4',
		name: 'Assets',
		parentId: '65fe976d-c642-4d2c-bf6a-78e030e3ba94',
		url: '/admin/system/assets',
		icon: null,
		sort: 801,
		enable: true,
		hidden: false,
		remark: null,
		permission: [],
	},
	{
		id: '5e0e66af-ad36-47ec-8abb-1f378892aa67',
		name: 'Action Logs',
		parentId: '65fe976d-c642-4d2c-bf6a-78e030e3ba94',
		url: '/admin/system/action_logs',
		icon: null,
		sort: 802,
		enable: true,
		hidden: false,
		remark: null,
		permission: [],
	},
	{
		id: '25aec3f4-2cf8-4c70-974d-abb0991e5a0a',
		name: 'Login Logs',
		parentId: '65fe976d-c642-4d2c-bf6a-78e030e3ba94',
		url: '/admin/system/login_logs',
		icon: null,
		sort: 803,
		enable: true,
		hidden: false,
		remark: null,
		permission: [],
	},

	// Links 子菜单
	{
		id: '1cd08f6f-7e24-458c-ae71-25a3df3a7836',
		name: "Author's Blog",
		parentId: '916fb6ea-5d0e-4964-8d16-13f279d172dc',
		url: 'https://www.huglemon.com',
		icon: null,
		sort: 901,
		enable: true,
		hidden: false,
		remark: null,
		permission: [],
	},
];

// ============================================
// 角色数据 (Roles)
// ============================================
const roles = [
	// 角色分类（父级）
	{
		id: 'aaaaaaa0-aaaa-4aaa-8aaa-aaaaaaaaaaa0',
		name: 'Admin Roles',
		parentId: null,
		remark: 'Admin 角色分类',
		enable: true,
		permission: [
			'9c32d333-c96f-4d83-ba0a-b3a360e5f729', '8b600d6b-25a1-4d33-9ee3-eaa5a904966e', '416a3c28-787f-4497-b83e-f357e183f8e4', '4866f91d-a620-4e8f-8f37-2bc6b9d1dea3',
			'55555555-5555-4555-8555-555555555550', '55555555-5555-4555-8555-555555555551', '55555555-5555-4555-8555-555555555552', '55555555-5555-4555-8555-555555555553',
			'b28c912c-c8bb-44e0-9a3d-282f751dd0e0', '24d6331a-d142-48f3-bfa3-12cd831dae91', '30ab7d06-1704-4c24-86de-a77169546db8', '63c7d7ca-33d1-4e12-8646-c02c0fc4c77b',
			'9733a3a2-5eb3-446c-a4c7-f13b8b1b77ce', 'd6d671e4-1030-4cbd-9435-34d3ead90296', '242fc188-90fe-4a23-b14c-f4b8502a3826', 'b486feac-b73e-4f56-8894-486828c6f154', '88165596-bca6-4b30-a7ae-fc30bbe67391', 'c74eccaf-85cd-4ec6-a479-d0ac71149a7a',
			'11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111113', '11111111-1111-4111-8111-111111111114',
			'22222222-2222-4222-8222-222222222221', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222223', '22222222-2222-4222-8222-222222222224',
			'44444444-4444-4444-8444-444444444441', '44444444-4444-4444-8444-444444444442', '44444444-4444-4444-8444-444444444443', '44444444-4444-4444-8444-444444444444',
			'33333333-3333-4333-8333-333333333331', '33333333-3333-4333-8333-333333333332', '33333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333334',
			'1f9321bf-bbb6-41d6-88eb-c39cdb0cd33f', '4fa91cdf-ea8b-47f2-b129-6ea2bc4cadfb', '41b41452-a14b-43ee-bef4-6a75d78b18e3', '66ceafc5-bcd3-435e-8460-a022c533e86b', 'c2317a15-8310-4e4c-bf7d-f1647c31ca31',
			'48418b0f-685b-4a1e-a9d7-c6b7bc84cbd6', '92e84378-d86c-4807-a998-a55c4f642c4a',
			'7e3eb4c3-f337-4ac7-89b0-628927aee1cd', 'd5dc395d-9319-467c-b29f-b69cac05ae2d',
		],
		menu: [
			'3137d6b2-63c9-4f2e-8587-2b75b18d4a4f', 'eba77ce6-cb1a-4264-bdca-c5a81640e0b1', 'd8b27fc8-b529-4e8f-b5ac-22a6e6ebcea4', 'ad864ae6-797f-4e82-b275-499eece4edf8', '8bd9d3a3-f970-4d0e-9232-77c5d56e3ccb',
			'a576c008-d72c-4128-a260-f8968681a409', '0969f5c3-fdad-487e-b423-8de0c798f3d7',
			'78afe8f0-b0e7-4e3a-adb9-1fd6b56f97f4', '5e0e66af-ad36-47ec-8abb-1f378892aa67', '1cd08f6f-7e24-458c-ae71-25a3df3a7836', '25aec3f4-2cf8-4c70-974d-abb0991e5a0a',
		],
		inheritMenuPermissions: false,
	},
	{
		id: 'aaaaaaa9-aaaa-4aaa-8aaa-aaaaaaaaaaa9',
		name: 'User Roles',
		parentId: null,
		remark: 'User 角色分类',
		enable: true,
		permission: [],
		menu: [],
		inheritMenuPermissions: false,
	},

	// Admin 子角色
	{
		id: 'bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
		name: 'Super Admin',
		parentId: 'aaaaaaa0-aaaa-4aaa-8aaa-aaaaaaaaaaa0',
		remark: '全量权限',
		enable: true,
		permission: [],
		menu: [],
		inheritMenuPermissions: false,
	},
	{
		id: 'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
		name: 'Demo - Readonly',
		parentId: 'aaaaaaa0-aaaa-4aaa-8aaa-aaaaaaaaaaa0',
		remark: '全局只读',
		enable: true,
		permission: ['41b41452-a14b-43ee-bef4-6a75d78b18e3'],
		menu: [
			'eba77ce6-cb1a-4264-bdca-c5a81640e0b1', 'd8b27fc8-b529-4e8f-b5ac-22a6e6ebcea4', 'ad864ae6-797f-4e82-b275-499eece4edf8', '8bd9d3a3-f970-4d0e-9232-77c5d56e3ccb',
			'a576c008-d72c-4128-a260-f8968681a409', '0969f5c3-fdad-487e-b423-8de0c798f3d7',
			'5e0e66af-ad36-47ec-8abb-1f378892aa67', '1cd08f6f-7e24-458c-ae71-25a3df3a7836', '78afe8f0-b0e7-4e3a-adb9-1fd6b56f97f4', '25aec3f4-2cf8-4c70-974d-abb0991e5a0a', '3137d6b2-63c9-4f2e-8587-2b75b18d4a4f',
		],
		inheritMenuPermissions: false,
	},
	{
		id: 'bbbbbbb3-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
		name: 'Admin - RBAC Ops (No Delete)',
		parentId: 'aaaaaaa0-aaaa-4aaa-8aaa-aaaaaaaaaaa0',
		remark: 'RBAC 可写但无删除',
		enable: true,
		permission: [
			'11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111113',
			'22222222-2222-4222-8222-222222222221', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222223',
			'33333333-3333-4333-8333-333333333331', '33333333-3333-4333-8333-333333333332', '33333333-3333-4333-8333-333333333333',
			'44444444-4444-4444-8444-444444444441', '44444444-4444-4444-8444-444444444442', '44444444-4444-4444-8444-444444444443',
		],
		menu: [],
		inheritMenuPermissions: false,
	},
	{
		id: 'bbbbbbb4-bbbb-4bbb-8bbb-bbbbbbbbbbb4',
		name: 'Demo - RBAC Readonly + Example Write',
		parentId: 'aaaaaaa0-aaaa-4aaa-8aaa-aaaaaaaaaaa0',
		remark: '演示：RBAC 只读，Example 可写无删除（权限继承自菜单）',
		enable: true,
		permission: [
			'11111111-1111-4111-8111-111111111112', '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333332', '44444444-4444-4444-8444-444444444442', '55555555-5555-4555-8555-555555555551',
		],
		menu: [
			'3137d6b2-63c9-4f2e-8587-2b75b18d4a4f', 'a576c008-d72c-4128-a260-f8968681a409', '0969f5c3-fdad-487e-b423-8de0c798f3d7',
			'eba77ce6-cb1a-4264-bdca-c5a81640e0b1', 'd8b27fc8-b529-4e8f-b5ac-22a6e6ebcea4', 'ad864ae6-797f-4e82-b275-499eece4edf8', '8bd9d3a3-f970-4d0e-9232-77c5d56e3ccb',
			'78afe8f0-b0e7-4e3a-adb9-1fd6b56f97f4', '5e0e66af-ad36-47ec-8abb-1f378892aa67', '1cd08f6f-7e24-458c-ae71-25a3df3a7836', '25aec3f4-2cf8-4c70-974d-abb0991e5a0a',
		],
		inheritMenuPermissions: true,
	},

	// User 子角色
	{
		id: 'bbbbbbb5-bbbb-4bbb-8bbb-bbbbbbbbbbb5',
		name: 'Guest',
		parentId: 'aaaaaaa9-aaaa-4aaa-8aaa-aaaaaaaaaaa9',
		remark: '默认访客（占位）',
		enable: true,
		permission: [],
		menu: [],
		inheritMenuPermissions: false,
	},
	{
		id: 'bbbbbbb6-bbbb-4bbb-8bbb-bbbbbbbbbbb6',
		name: 'VIP Basic',
		parentId: 'aaaaaaa9-aaaa-4aaa-8aaa-aaaaaaaaaaa9',
		remark: '付费用户占位，可按需追加权限',
		enable: false,
		permission: [],
		menu: [],
		inheritMenuPermissions: false,
	},
];

// ============================================
// 示例数据 (Example Data) - 仅保留少量演示数据
// ============================================
const exampleData = [
	{
		id: '735783d5-a9ef-4682-be33-b8efcd81f16a',
		title: 'Premium Widget 1',
		description: 'This is a sample product description for item 1. It demonstrates various field types and configurations.',
		status: 'published',
		category: 'electronics',
		subCategory: 'phones',
		contactType: 'email',
		email: 'user1@example.com',
		phone: null,
		wechat: null,
		address: '1234 Main Street, Suite 56',
		price: 299.99,
		discount: 15.00,
		quantity: 500,
		priority: 'high',
		features: ['wireless', 'rechargeable', 'portable'],
		tags: ['new', 'hot'],
		department: 'frontend',
		location: ['us', 'ca', 'sf'],
		publishDate: new Date('2025-06-15'),
		eventTime: new Date('2025-12-01T10:00:00'),
		validPeriod: ['2025-01-01T00:00:00.000Z', '2025-12-31T23:59:59.000Z'],
		isActive: true,
		isPublic: true,
		isVip: false,
		enableNotification: true,
		coverImage: 'https://picsum.photos/seed/1/400/300',
		gallery: ['https://picsum.photos/seed/11/400/300', 'https://picsum.photos/seed/12/400/300'],
		avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
		documents: [],
		attachments: [],
		selectedImage: null,
		selectedGallery: [],
		selectedAvatar: null,
		selectedFiles: [],
		rating: 4.5,
		color: '#1890ff',
		icon: 'StarOutlined',
		richContent: `## Product Overview

This is a high-quality product designed for modern users.

### Key Features

- **Durability**: Built to last
- **Performance**: Optimized for efficiency`,
		keywords: ['quality', 'premium', 'bestseller'],
		metadata: { tags: ['featured'], author: 'Admin', version: '1.0' },
	},
	{
		id: 'efae295b-9ac3-4a55-a9ae-15399ddfed75',
		title: 'Pro Device 3',
		description: 'This is a sample product description for item 3. It demonstrates various field types and configurations.',
		status: 'published',
		category: 'electronics',
		subCategory: 'laptops',
		contactType: 'wechat',
		email: null,
		phone: null,
		wechat: 'wechat_user_3',
		address: null,
		price: 1299.00,
		discount: 10.00,
		quantity: 150,
		priority: 'urgent',
		features: ['wireless', 'rechargeable', 'premium'],
		tags: ['hot', 'featured'],
		department: 'backend',
		location: ['us', 'ny', 'nyc'],
		publishDate: new Date('2025-03-01'),
		eventTime: new Date('2025-11-30T14:00:00'),
		validPeriod: ['2025-03-01T00:00:00.000Z', '2026-03-01T00:00:00.000Z'],
		isActive: true,
		isPublic: true,
		isVip: true,
		enableNotification: true,
		coverImage: 'https://picsum.photos/seed/3/400/300',
		gallery: ['https://picsum.photos/seed/31/400/300', 'https://picsum.photos/seed/32/400/300', 'https://picsum.photos/seed/33/400/300'],
		avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
		documents: [],
		attachments: [],
		selectedImage: null,
		selectedGallery: [],
		selectedAvatar: null,
		selectedFiles: [],
		rating: 5.0,
		color: '#722ed1',
		icon: 'RocketOutlined',
		richContent: `## Professional Laptop

### Technical Specifications

| Spec | Value |
|------|-------|
| CPU | Intel i9 |
| RAM | 32GB |
| Storage | 1TB SSD |`,
		keywords: ['laptop', 'professional', 'high-performance'],
		metadata: { tags: ['important', 'featured'], author: 'Tech Team', version: '3.0' },
	},
	{
		id: '3cc0b472-31c2-45db-9942-19683fd34255',
		title: 'Ultra Tool 4',
		description: 'This is a sample product description for item 4. It demonstrates various field types and configurations.',
		status: 'draft',
		category: 'food',
		subCategory: 'snacks',
		contactType: 'none',
		email: null,
		phone: null,
		wechat: null,
		address: '9999 Food Court, Building A',
		price: 12.99,
		discount: null,
		quantity: 5000,
		priority: 'low',
		features: ['eco_friendly'],
		tags: ['new'],
		department: 'content',
		location: ['jp', 'tokyo', 'shibuya'],
		publishDate: null,
		eventTime: null,
		validPeriod: [],
		isActive: false,
		isPublic: false,
		isVip: false,
		enableNotification: false,
		coverImage: 'https://picsum.photos/seed/4/400/300',
		gallery: [],
		avatar: null,
		documents: [],
		attachments: [],
		selectedImage: null,
		selectedGallery: [],
		selectedAvatar: null,
		selectedFiles: [],
		rating: 3.5,
		color: '#faad14',
		icon: 'GiftOutlined',
		richContent: `## Healthy Snacks

Organic and delicious snacks for everyone.`,
		keywords: ['organic', 'healthy', 'snacks'],
		metadata: { author: 'Food Team', version: '1.0' },
	},
];

// ============================================
// 主函数
// ============================================
async function seed() {
	console.log('🌱 Starting database seeding...\n');

	try {
		// 1. 清空现有数据（按照外键依赖顺序）
		console.log('🗑️  Cleaning existing data...');
		await prisma.exampleData.deleteMany({});
		await prisma.role.deleteMany({});
		await prisma.menu.deleteMany({});
		await prisma.permission.deleteMany({});
		console.log('   ✓ Existing data cleaned\n');

		// 2. 插入权限数据
		console.log('📝 Seeding permissions...');
		for (const perm of permissions) {
			await prisma.permission.create({ data: perm });
		}
		console.log(`   ✓ ${permissions.length} permissions created\n`);

		// 3. 插入菜单数据
		console.log('📝 Seeding menus...');
		for (const menu of menus) {
			await prisma.menu.create({ data: menu });
		}
		console.log(`   ✓ ${menus.length} menus created\n`);

		// 4. 插入角色数据
		console.log('📝 Seeding roles...');
		for (const role of roles) {
			await prisma.role.create({ data: role });
		}
		console.log(`   ✓ ${roles.length} roles created\n`);

		// 5. 插入示例数据
		console.log('📝 Seeding example data...');
		for (const data of exampleData) {
			await prisma.exampleData.create({ data });
		}
		console.log(`   ✓ ${exampleData.length} example records created\n`);

		console.log('✅ Database seeding completed successfully!\n');
		console.log('📌 Next step: Run "bun run db:admin" to create the super admin account.\n');

	} catch (error) {
		console.error('❌ Seeding failed:', error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

// 运行
seed()
	.then(() => process.exit(0))
	.catch(() => process.exit(1));

