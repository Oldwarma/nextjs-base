'use server';

import { createCrudActions } from '@/lib/core/crud-helper';
import { wrapQueryAction, wrapAdminAction } from '@/lib/core/action-wrapper';

/**
 * Role CRUD 配置
 */
const roleConfig = {
	/**
	 * 基础配置
	 */
	collectionName: 'roles',
	primaryKey: 'id',
	softDelete: false,

	/**
	 * BaseDAO 字段配置
	 */
	fields: {
		creatable: ['name', 'remark', 'enable'],
		updatable: ['name', 'remark', 'enable', 'permission', 'menu'],
		searchable: ['name', 'remark'],
	},

	/**
	 * 字段验证规则
	 */
	validation: {
		name: {
			required: true,
			type: 'string',
			minLength: 2,
			maxLength: 100,
			message: 'Role name must be between 2 and 100 characters',
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
	},

	/**
	 * 查询配置
	 */
	query: {
		defaultSort: { name: 1 },
		defaultPageSize: 20,
		// 连表配置 - 自动关联权限和菜单的名称
		foreignDB: [
			{
				dbName: 'permissions',
				localKey: 'permission',
				foreignKey: 'id',
				as: 'permissionList',
				fieldJson: { id: 1, name: 1 },
			},
			{
				dbName: 'menus',
				localKey: 'menu',
				foreignKey: 'id',
				as: 'menuList',
				fieldJson: { id: 1, name: 1 },
			},
		],
	},

	/**
	 * 生命周期钩子
	 */
	hooks: {
		beforeCreate: async (data) => {
			// 设置默认值
			if (data.enable === undefined) {
				data.enable = true;
			}

			// 初始化权限和菜单数组
			if (data.permission === undefined) {
				data.permission = [];
			}

			if (data.menu === undefined) {
				data.menu = [];
			}

			return data;
		},

		beforeUpdate: async (id, data) => {
			// 获取当前角色信息
			const { getCollection } = await import('@/lib/database/mongodb');
			const collection = await getCollection(roleConfig.collectionName);
			const existing = await collection.findOne({ id });

			if (!existing) {
				throw new Error('Role not found');
			}

			// 防止修改 admin 角色
			if (existing.name === 'admin' || existing.name === 'Admin') {
				throw new Error('Cannot modify admin role');
			}

			return data;
		},

		beforeDelete: async (id) => {
			// 获取角色信息
			const { getCollection } = await import('@/lib/database/mongodb');
			const collection = await getCollection(roleConfig.collectionName);
			const existing = await collection.findOne({ id });

			if (!existing) {
				throw new Error('Role not found');
			}

			// 防止删除 admin 角色
			if (existing.name === 'admin' || existing.name === 'Admin') {
				throw new Error('Cannot delete admin role');
			}

			return true;
		},

		afterDelete: async (id) => {
			// 删除角色后，清理用户表中的引用
			const { getCollection } = await import('@/lib/database/mongodb');
			const usersCollection = await getCollection('users');

			await usersCollection.updateMany({ roles: id }, { $pull: { roles: id } });

			console.log(`Role ${id} deleted, cleaned up from users`);
		},

		beforeBatchDelete: async (ids) => {
			// 防止批量删除 admin 角色
			const { getCollection } = await import('@/lib/database/mongodb');
			const collection = await getCollection(roleConfig.collectionName);

			const adminRoles = await collection.find({
				id: { $in: ids },
				$or: [{ name: 'admin' }, { name: 'Admin' }],
			});

			if (adminRoles.length > 0) {
				throw new Error('Cannot delete admin role');
			}

			return true;
		},
	},

	/**
	 * 数据转换
	 */
	transforms: {
		input: (data) => {
			// 确保 boolean 类型
			if (data.enable !== undefined) {
				data.enable = data.enable === true || data.enable === 'true';
			}

			// 去除字符串首尾空格
			if (data.name) {
				data.name = data.name.trim();
			}

			if (data.remark) {
				data.remark = data.remark.trim();
			}

			return data;
		},

		output: (data) => {
			// 确保 enable 是 boolean
			if (data.enable === undefined) {
				data.enable = true;
			}

			// 确保 permission 和 menu 是数组
			if (!data.permission || !Array.isArray(data.permission)) {
				data.permission = [];
			}

			if (!data.menu || !Array.isArray(data.menu)) {
				data.menu = [];
			}

			return data;
		},
	},
};

/**
 * 创建标准 CRUD Actions
 */
const crudActions = createCrudActions(roleConfig);

/**
 * 导出标准 CRUD Actions
 */
export const getRoleListAction = crudActions.getList;
export const getRoleDetailAction = crudActions.getDetail;
export const createRoleAction = crudActions.create;
export const updateRoleAction = crudActions.update;
export const deleteRoleAction = crudActions.delete;
export const batchUpdateRolesAction = crudActions.batchUpdate;
export const batchDeleteRolesAction = crudActions.batchDelete;

/**
 * 自定义 Actions
 */

/**
 * 获取角色列表（用于选择器）
 * 只返回启用的角色，可选添加标签
 */
export const getRoleListForSelectAction = wrapQueryAction('role', async ({ withLabel = false } = {}) => {
	// 获取所有启用的角色（不分页）
	const result = await crudActions._dao.getList({
		pageIndex: 1,
		pageSize: 1000,
		whereJson: { enable: true },
	});

	if (!result.success) {
		return result;
	}

	let roles = result.data || [];

	// 如果需要标签，添加详细标签
	if (withLabel) {
		roles = roles.map((role) => {
			const badges = [];

			// 禁用标签
			if (!role.enable) {
				badges.push('[已禁用]');
			}

			// 权限数量
			const permCount = Array.isArray(role.permission) ? role.permission.length : 0;
			if (permCount > 0) {
				badges.push(`${permCount}权限`);
			}

			// 菜单数量
			const menuCount = Array.isArray(role.menu) ? role.menu.length : 0;
			if (menuCount > 0) {
				badges.push(`${menuCount}菜单`);
			}

			const badgeStr = badges.length > 0 ? ` ${badges.join(' ')}` : '';
			const remarkStr = role.remark ? ` - ${role.remark}` : '';

			return {
				...role,
				label: `${role.name} (${role.id})${badgeStr}${remarkStr}`,
				value: role.id,
			};
		});
	}

	return {
		success: true,
		data: roles,
	};
});

/**
 * 分配权限给角色
 */
export const assignPermissionsToRoleAction = wrapAdminAction('assign_permissions', 'role', async (params) => {
	const { roleId, permissionIds } = params;

	// 简单验证
	if (!roleId) {
		return { success: false, error: 'roleId is required' };
	}

	if (!Array.isArray(permissionIds)) {
		return { success: false, error: 'permissionIds must be an array' };
	}

	// 更新角色的权限列表
	const result = await crudActions._dao.update(roleId, { permission: permissionIds });

	return result;
});

/**
 * 分配菜单给角色
 */
export const assignMenusToRoleAction = wrapAdminAction('assign_menus', 'role', async (params) => {
	const { roleId, menuIds } = params;

	// 简单验证
	if (!roleId) {
		return { success: false, error: 'roleId is required' };
	}

	if (!Array.isArray(menuIds)) {
		return { success: false, error: 'menuIds must be an array' };
	}

	// 更新角色的菜单列表
	const result = await crudActions._dao.update(roleId, { menu: menuIds });

	return result;
});

/**
 * 切换角色启用/禁用状态
 */
export const toggleRoleStatusAction = wrapAdminAction('toggle_status', 'role', async ({ roleId, enable }) => {
	// 简单验证
	if (!roleId) {
		return { success: false, error: 'roleId is required' };
	}

	const result = await crudActions._dao.update(roleId, { enable: Boolean(enable) });

	return result;
});

