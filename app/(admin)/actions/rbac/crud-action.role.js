'use server';

import { createCrudActions } from '@/lib/core/crud-helper';
import { wrapAction } from '@/lib/core/action-wrapper';
import { prisma } from '@/lib/database/prisma';
import * as sysDao from '@/app/(admin)/actions/dao/sys';
import nb from '@/lib/function';

/**
 * 规范化权限 ID
 */
function normalizePermissionIds(permissionIds = []) {
	if (!nb.pubfn.isArray(permissionIds)) return [];
	return Array.from(new Set(permissionIds.map((p) => String(p)).filter(Boolean)));
}

/**
 * 验证父级角色是否合法，防止循环引用
 */
async function ensureValidParentRole(parentId, currentId = null) {
	if (!parentId) return null;

	if (currentId && parentId === currentId) {
		throw new Error('Role cannot be its own parent');
	}

	const parent = await prisma.role.findUnique({
		where: { id: parentId },
		select: { id: true, parentId: true, deletedAt: true },
	});

	if (!parent || parent.deletedAt) {
		throw new Error('Parent role not found or has been deleted');
	}

	if (!currentId) return parent;

	let cursor = parent.parentId;
	const visited = new Set([currentId]);
	while (cursor) {
		if (visited.has(cursor)) {
			throw new Error('Circular role hierarchy detected');
		}
		visited.add(cursor);
		const node = await prisma.role.findUnique({
			where: { id: cursor },
			select: { parentId: true },
		});
		cursor = node?.parentId || null;
	}

	return parent;
}

/**
 * 获取父级允许分配的权限范围
 */
async function computeAvailablePermissionIds(parentId) {
	if (!parentId) return null;

	const parent = await prisma.role.findUnique({
		where: { id: parentId },
		select: { id: true, parentId: true, permission: true, deletedAt: true },
	});

	if (!parent || parent.deletedAt) {
		throw new Error('Parent role not found or has been deleted');
	}

	const parentPerms = normalizePermissionIds(parent.permission);
	const parentScope = await sysDao.getRolePermissionScope(parent.id);

	if (!parentScope) {
		return parentPerms;
	}

	const scopeSet = new Set(parentScope.map(String));
	return parentPerms.filter((id) => scopeSet.has(id));
}

/**
 * 校验权限是否在父级范围内
 * @param {Object} options
 * @param {string} options.roleId - 当前角色 ID
 * @param {string[]} options.permissionIds - 要校验的权限 ID 数组
 * @param {string|null} options.parentIdOverride - 覆盖的父级 ID（用于更新父级时）
 * @param {boolean} options.isParentChange - 是否是父级变更操作
 */
async function assertPermissionWithinScope({ roleId, permissionIds, parentIdOverride, isParentChange = false }) {
	const normalized = normalizePermissionIds(permissionIds);

	const role = roleId
		? await prisma.role.findUnique({ where: { id: roleId }, select: { parentId: true, name: true } })
		: null;

	const parentId = parentIdOverride !== undefined ? parentIdOverride : role?.parentId;

	if (!parentId) return normalized;

	// 获取父角色信息用于更好的错误提示
	const parentRole = await prisma.role.findUnique({ 
		where: { id: parentId }, 
		select: { name: true, permission: true } 
	});

	const available = await computeAvailablePermissionIds(parentId);

	if (!available || available.length === 0) {
		if (normalized.length > 0) {
			// 区分是更换父级还是分配权限的场景
			if (isParentChange) {
				throw new Error(
					`Cannot set parent to "${parentRole?.name || parentId}": ` +
					`this role already has ${normalized.length} permission(s), ` +
					`but the target parent has no permissions. ` +
					`Please remove permissions first or choose a parent with sufficient permissions.`
				);
			}
			throw new Error(
				`Parent role "${parentRole?.name || parentId}" has no permissions to grant. ` +
				`Please assign permissions to the parent role first.`
			);
		}
		return normalized;
	}

	const allowedSet = new Set(available.map(String));
	const invalid = normalized.filter((id) => !allowedSet.has(id));

	if (invalid.length > 0) {
		if (isParentChange) {
			throw new Error(
				`Cannot set parent to "${parentRole?.name || parentId}": ` +
				`this role has ${invalid.length} permission(s) that exceed the parent's scope. ` +
				`Please remove those permissions first or choose a parent with sufficient permissions.`
			);
		}
		throw new Error(
			`${invalid.length} permission(s) exceed the scope of parent role "${parentRole?.name || parentId}". ` +
			`Please select permissions within the parent's scope.`
		);
	}

	return normalized;
}

/**
 * Role CRUD 配置
 */
const roleConfig = {
	modelName: 'role',
	tableName: 'roles',
	primaryKey: 'id',
	softDelete: true,

	fields: {
		creatable: ['name', 'parentId', 'remark', 'enable', 'permission', 'menu', 'inheritMenuPermissions'],
		updatable: ['name', 'parentId', 'remark', 'enable', 'permission', 'menu', 'inheritMenuPermissions'],
		searchable: ['name', 'remark'],
	},

	validation: {
		name: {
			required: true,
			type: 'string',
			minLength: 2,
			maxLength: 100,
			message: 'Role name must be between 2 and 100 characters',
		},
		parentId: {
			required: false,
			type: 'string',
		},
		remark: {
			required: false,
			type: 'string',
			maxLength: 500,
		},
		enable: {
			required: false,
			type: 'boolean',
			default: true,
		},
		permission: {
			required: false,
			type: 'array',
			itemType: 'string',
		},
		menu: {
			required: false,
			type: 'array',
			itemType: 'string',
		},
		inheritMenuPermissions: {
			required: false,
			type: 'boolean',
			default: false,
		},
	},

	query: {
		defaultSort: { name: 'asc' },
		defaultPageSize: 20,
	},

	hooks: {
		beforeCreate: async (data) => {
			if (data.enable === undefined) data.enable = true;
			if (data.permission === undefined) data.permission = [];
			if (data.menu === undefined) data.menu = [];
			if (data.inheritMenuPermissions === undefined) data.inheritMenuPermissions = false;

			// 验证父级
			await ensureValidParentRole(data.parentId || null);

			// 权限不得超出父级范围
			data.permission = await assertPermissionWithinScope({
				permissionIds: data.permission,
				parentIdOverride: data.parentId || null,
			});

			return data;
		},

		beforeUpdate: async (id, data) => {
			const existing = await prisma.role.findUnique({ where: { id } });

			if (!existing) {
				throw new Error('Role not found');
			}

			if (existing.name === 'admin' || existing.name === 'Admin') {
				throw new Error('Cannot modify admin role');
			}

			if (data.parentId !== undefined) {
				await ensureValidParentRole(data.parentId || null, id);
			}

			// 权限变更或父级变更时，校验权限范围
			const isParentChange = data.parentId !== undefined;
			const targetPermissions =
				data.permission !== undefined
					? normalizePermissionIds(data.permission)
					: normalizePermissionIds(existing.permission);

			const validatedPermissions = await assertPermissionWithinScope({
				roleId: id,
				permissionIds: targetPermissions,
				parentIdOverride: isParentChange ? data.parentId || null : undefined,
				isParentChange: isParentChange && data.permission === undefined, // 仅在更换父级且未同时修改权限时标记
			});

			if (data.permission !== undefined) {
				data.permission = validatedPermissions;
			}

			return data;
		},

		beforeDelete: async (id) => {
			const existing = await prisma.role.findUnique({ where: { id } });

			if (!existing) {
				throw new Error('Role not found');
			}

			if (existing.name === 'admin' || existing.name === 'Admin') {
				throw new Error('Cannot delete admin role');
			}

			const childCount = await prisma.role.count({
				where: { parentId: id, deletedAt: null },
			});

			if (childCount > 0) {
				throw new Error(`Cannot delete role "${existing.name}": it has ${childCount} child role(s). Please adjust the hierarchy first.`);
			}

			return true;
		},

		afterDelete: async (id) => {
			// 从用户的 roles 数组中移除该角色
			const users = await prisma.user.findMany({
				where: { roles: { has: id } },
			});

			for (const user of users) {
				await prisma.user.update({
					where: { id: user.id },
					data: { roles: user.roles.filter(r => r !== id) },
				});
			}

			console.log(`Role ${id} deleted, cleaned up from users`);
		},

		beforeBatchDelete: async (ids) => {
			const adminRoles = await prisma.role.findMany({
				where: {
					id: { in: ids },
					OR: [{ name: 'admin' }, { name: 'Admin' }],
				},
			});

			if (adminRoles.length > 0) {
				throw new Error('Cannot delete admin role');
			}

			const child = await prisma.role.findFirst({
				where: {
					parentId: { in: ids },
					deletedAt: null,
				},
			});

			if (child) {
				throw new Error(`Cannot delete roles: "${child.name}" still depends on selected role(s). Please adjust hierarchy first.`);
			}

			return true;
		},
	},

	transforms: {
		input: (data) => {
			if (data.enable !== undefined) {
				data.enable = data.enable === true || data.enable === 'true';
			}
			if (data.parentId === '') data.parentId = null;
			if (data.name) data.name = data.name.trim();
			if (data.remark) data.remark = data.remark.trim();
			if (data.permission !== undefined) {
				data.permission = normalizePermissionIds(data.permission);
			}
			return data;
		},

		output: (data) => {
			if (data.enable === undefined) data.enable = true;
			if (!data.permission || !nb.pubfn.isArray(data.permission)) data.permission = [];
			if (!data.menu || !nb.pubfn.isArray(data.menu)) data.menu = [];
			if (data.inheritMenuPermissions === undefined) data.inheritMenuPermissions = false;
			if (data.parentId === undefined) data.parentId = null;
			return data;
		},
	},
};

const crudActions = createCrudActions(roleConfig);

export const getRoleListAction = crudActions.getList;
export const getRoleTreeAction = wrapAction('sysQueryRoleTree', async ({ pageIndex = 1, pageSize = 1000, whereJson = {}, sortJson = null } = {}, ctx) => {
	// 有筛选时也返回树形数据
	if (whereJson && Object.keys(whereJson).length > 0) {
		const listResult = await crudActions._dao.getList({
			pageIndex: 1,
			pageSize: Math.max(pageSize, 1000),
			whereJson,
			sortJson,
		});

		if (!listResult.success) return listResult;

		return {
			success: true,
			data: nb.pubfn.tree.arrayToTree(listResult.data || [], {
				sortBy: [{ field: 'name', order: 'asc' }],
			}),
			total: listResult.data?.length || 0,
			pageIndex: 1,
			pageSize: listResult.data?.length || 0,
		};
	}

	const result = await sysDao.getRoleTree({
		pageIndex,
		pageSize,
	});

	return {
		success: true,
		data: result.rows || [],
		total: result.total || 0,
		pageIndex,
		pageSize,
	};
}, { skipLog: false });

export const getRoleDetailAction = wrapAction('sysGetRoleDetail', async (params, ctx) => {
	const id = nb.pubfn.isString(params) ? params : params?.id;
	if (!id) {
		return { success: false, error: 'ID is required' };
	}

	const result = await crudActions._dao.getDetail(id, {
		fieldJson: {
			id: true,
			name: true,
			parent_id: true, // DB 列名
			remark: true,
			enable: true,
			permission: true,
			menu: true,
			inheritMenuPermissions: true,
		},
		foreignDB: [
			{
				dbName: 'permissions',
				localKey: 'permission',
				foreignKey: 'id',
				as: 'permissionList',
				type: 'array',
				fieldJson: { id: true, name: true, remark: true },
			},
			{
				dbName: 'menus',
				localKey: 'menu',
				foreignKey: 'id',
				as: 'menuList',
				type: 'array',
				fieldJson: { id: true, name: true, url: true, remark: true },
			},
			{
				dbName: 'roles',
				localKey: 'parent_id',
				foreignKey: 'id',
				as: 'parentInfo',
				type: 'one',
				fieldJson: { id: true, name: true, parent_id: true, permission: true },
			},
		],
	});

	if (!result.success) {
		return result;
	}

	const permissionScope = await sysDao.getRolePermissionScope(id);
	const { ...rest } = result.data || {};

	// 将数据库列名映射回驼峰，便于前端使用
	if (rest.parent_id !== undefined) {
		rest.parentId = rest.parent_id;
		delete rest.parent_id;
	}

	if (rest.parentInfo && rest.parentInfo.parent_id !== undefined) {
		rest.parentInfo.parentId = rest.parentInfo.parent_id;
		delete rest.parentInfo.parent_id;
	}

	return {
		...result,
		data: {
			...rest,
			parentInfo: rest.parentInfo || null,
			permissionScope,
		},
	};
}, { skipLog: false });

export const createRoleAction = crudActions.create;
export const updateRoleAction = crudActions.update;
export const deleteRoleAction = crudActions.delete;
export const batchUpdateRolesAction = crudActions.batchUpdate;
export const batchDeleteRolesAction = crudActions.batchDelete;

/**
 * 获取角色列表（用于选择器）
 */
export const getRoleListForSelectAction = wrapAction('sysQueryRoleListForSelect', async ({ withLabel = false, asTree = false, includeDisabled = true } = {}, ctx) => {
	const result = await crudActions._dao.getList({
		pageIndex: 1,
		pageSize: 1000,
		whereJson: includeDisabled ? {} : { enable: true },
	});

	if (!result.success) {
		return result;
	}

	let roles = (result.data || []).map((role) => ({
		...role,
		enable: role.enable !== false,
	}));

	if (withLabel) {
		roles = roles.map((role) => {
			const badges = [];

			if (!role.enable) badges.push('[Disabled]');

			const permCount = nb.pubfn.isArray(role.permission) ? role.permission.length : 0;
			if (permCount > 0) badges.push(`${permCount} permissions`);

			const menuCount = nb.pubfn.isArray(role.menu) ? role.menu.length : 0;
			if (menuCount > 0) badges.push(`${menuCount} menus`);

			const badgeStr = badges.length > 0 ? ` ${badges.join(' ')}` : '';

			return {
				...role,
				label: `${role.name} ${nb.pubfn.isNotNull(badgeStr) && `(${badgeStr})`}`,
				value: role.id,
				key: role.id,
			};
		});
	}

	if (asTree) {
		return {
			success: true,
			data: nb.pubfn.tree.arrayToTree(roles, {
				sortBy: [{ field: 'name', order: 'asc' }],
			}),
		};
	}

	return {
		success: true,
		data: roles,
	};
}, { skipLog: true });

/**
 * 获取角色树（用于 tree-select）
 */
export const getRoleTreeForSelectAction = wrapAction('sysQueryRoleTreeForSelect', async ({ withLabel = false, includeDisabled = true } = {}, ctx) => {
	const result = await sysDao.getRoleTree({
		includeDisabled,
	});

	const formattedTree = nb.pubfn.tree.mapTree(result.rows || [], (node) => ({
		title: withLabel ? `${node.name} (${node.id})` : node.name,
		value: node.id,
		key: node.id,
		disabled: node.enable === false,
		children: node.children || [],
	}));

	return {
		success: true,
		data: formattedTree,
	};
}, { skipLog: true });

/**
 * 分配权限给角色
 */
export const assignPermissionsToRoleAction = wrapAction('sysAssignPermissionsToRole', async (params, ctx) => {
	const { roleId, permissionIds } = params;

	if (!roleId) {
		return { success: false, error: 'roleId is required' };
	}

	if (!nb.pubfn.isArray(permissionIds)) {
		return { success: false, error: 'permissionIds must be an array' };
	}

	const normalizedIds = await assertPermissionWithinScope({
		roleId,
		permissionIds,
	});

	const result = await crudActions._dao.update(roleId, { permission: normalizedIds });

	return result;
});

/**
 * 分配菜单给角色
 */
export const assignMenusToRoleAction = wrapAction('sysAssignMenusToRole', async (params, ctx) => {
	const { roleId, menuIds, inheritPermissions = false } = params;

	if (!roleId) {
		return { success: false, error: 'roleId is required' };
	}

	if (!nb.pubfn.isArray(menuIds)) {
		return { success: false, error: 'menuIds must be an array' };
	}

	const result = await crudActions._dao.update(roleId, {
		menu: menuIds,
		inheritMenuPermissions: inheritPermissions,
	});

	return result;
});

/**
 * 切换角色启用/禁用状态
 */
export const toggleRoleStatusAction = wrapAction('sysToggleRoleStatus', async ({ roleId, enable }, ctx) => {
	if (!roleId) {
		return { success: false, error: 'roleId is required' };
	}

	const result = await crudActions._dao.update(roleId, { enable: Boolean(enable) });

	return result;
});
