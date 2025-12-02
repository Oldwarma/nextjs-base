'use server';

import { createCrudActions } from '@/lib/core/crud-helper';
import { wrapAction } from '@/lib/core/action-wrapper';
import { prisma } from '@/lib/database/prisma';
import * as sysDao from '@/app/(admin)/actions/dao/sys';
import nb from '@/lib/function';

/**
 * Menu CRUD 配置
 */
const menuConfig = {
	modelName: 'menu',
	tableName: 'menus', // 数据库表名，selects 连表查询需要
	primaryKey: 'id',
	softDelete: true,

	fields: {
		creatable: ['name', 'parentId', 'url', 'icon', 'sort', 'enable', 'hidden', 'remark', 'permission'],
		updatable: ['name', 'parentId', 'url', 'icon', 'sort', 'enable', 'hidden', 'remark', 'permission'],
		searchable: ['name', 'url'],
	},

	query: {
		defaultSort: { sort: 'asc' },
		defaultPageSize: 1000,
		foreignDB: [
			{
				dbName: 'permissions',
				localKey: 'permission',
				foreignKey: 'id',
				as: 'permissionList',
				type: 'array',
				fieldJson: { id: true, name: true, enable: true },
			},
		],
	},

	validation: {
		name: {
			required: true,
			type: 'string',
			minLength: 2,
			maxLength: 50,
			message: 'Menu name must be between 2 and 50 characters',
		},
		url: {
			required: false,
			type: 'string',
			maxLength: 200,
		},
		icon: {
			required: false,
			type: 'string',
			maxLength: 50,
		},
		sort: {
			required: false,
			type: 'number',
			min: 0,
			max: 9999,
			default: 0,
		},
		enable: {
			required: false,
			type: 'boolean',
			default: true,
		},
		hidden: {
			required: false,
			type: 'boolean',
			default: false,
		},
		remark: {
			required: false,
			type: 'string',
			maxLength: 200,
		},
		permission: {
			required: false,
			type: 'array',
			itemType: 'string',
		},
	},

	hooks: {
		beforeCreate: async (data) => {
			if (data.enable === undefined) data.enable = true;
			if (data.hidden === undefined) data.hidden = false;
			if (data.sort === undefined) data.sort = 0;

			// 子菜单不显示图标
			if (data.parentId && data.icon) {
				data.icon = null;
			}

			return data;
		},

		beforeUpdate: async (id, data) => {
			if (data.parentId !== undefined && data.parentId && data.icon !== undefined) {
				data.icon = null;
			}
			return data;
		},

		beforeDelete: async (id) => {
			const existing = await prisma.menu.findUnique({ where: { id } });
			if (!existing) {
				throw new Error('Menu not found');
			}

			const childCount = await prisma.menu.count({ where: { parentId: id } });
			if (childCount > 0) {
				throw new Error(`Cannot delete menu "${existing.name}": it has ${childCount} child menu(s). Please delete or reassign them first.`);
			}

			return true;
		},

		afterDelete: async (id) => {
			// 从角色的 menu 数组中移除该菜单
			const roles = await prisma.role.findMany({
				where: { menu: { has: id } },
			});

			for (const role of roles) {
				await prisma.role.update({
					where: { id: role.id },
					data: { menu: role.menu.filter(m => m !== id) },
				});
			}

			console.log(`Menu ${id} deleted, cleaned up from roles`);
		},

		beforeBatchDelete: async (ids) => {
			for (const id of ids) {
				const childCount = await prisma.menu.count({ where: { parentId: id } });
				if (childCount > 0) {
					const menu = await prisma.menu.findUnique({ where: { id } });
					throw new Error(`Cannot delete menu "${menu?.name || id}": it has child menus`);
				}
			}
			return true;
		},
	},

	transforms: {
		input: (data) => {
			if (data.enable !== undefined) {
				data.enable = data.enable === true || data.enable === 'true';
			}
			if (data.hidden !== undefined) {
				data.hidden = data.hidden === true || data.hidden === 'true';
			}
			if (data.name) data.name = data.name.trim();
			if (data.url) data.url = data.url.trim();
			if (data.remark) data.remark = data.remark.trim();
			if (data.parentId === '') data.parentId = null;
			if (data.icon === '') data.icon = null;
			if (data.remark === '') data.remark = null;
			return data;
		},

		output: (data) => {
			if (data.enable === undefined) data.enable = true;
			if (data.hidden === undefined) data.hidden = false;
			if (data.sort === undefined || data.sort === null) data.sort = 0;
			return data;
		},
	},
};

const crudActions = createCrudActions(menuConfig);

export const getMenuListAction = crudActions.getList;
export const getMenuDetailAction = crudActions.getDetail;
export const createMenuAction = crudActions.create;
export const updateMenuAction = crudActions.update;
export const deleteMenuAction = crudActions.delete;
export const batchUpdateMenusAction = crudActions.batchUpdate;
export const batchDeleteMenusAction = crudActions.batchDelete;

/**
 * 获取菜单树
 */
export const getMenuTreeAction = wrapAction('sysQueryMenuTree', async ({ pageIndex = 1, pageSize = 1000, whereJson = {}, sortJson = null } = {}, ctx) => {
	if (whereJson && Object.keys(whereJson).length > 0) {
		const result = await crudActions._dao.getList({
			pageIndex,
			pageSize,
			whereJson,
			sortJson,
		});
		return result;
	}

	const result = await sysDao.getMenuTree({
		pageIndex,
		pageSize,
		filters: {},
	});

	return {
		success: true,
		data: result.rows || [],
		total: result.total || 0,
	};
}, { skipLog: true });

/**
 * 获取菜单树（用于选择器）
 */
export const getMenuTreeForSelectAction = wrapAction('sysQueryMenuTreeForSelect', async (params = {}, ctx) => {
	const { includeRootOption = true } = params;

	const result = await sysDao.getMenuTree({
		pageIndex: 1,
		pageSize: 1000,
		filters: { enable: true },
	});

	// 使用 mapTree 转换为 TreeSelect 格式
	const menuItems = nb.pubfn.tree.mapTree(result.rows || [], (node) => ({
				title: node.name,
				value: node.id,
				key: node.id,
	}));

	const formattedTree = includeRootOption
		? [{ title: '--- Root Menu ---', value: '', key: '' }, ...menuItems]
		: menuItems;

	return {
		success: true,
		data: formattedTree,
	};
}, { skipLog: true });

/**
 * 分配权限给菜单
 */
export const assignPermissionsToMenuAction = wrapAction('sysAssignPermissionsToMenu', async (params, ctx) => {
	const { menuId, permissionIds } = params;

	if (!menuId) {
		return { success: false, error: 'menuId is required' };
	}

	if (!Array.isArray(permissionIds)) {
		return { success: false, error: 'permissionIds must be an array' };
	}

	const result = await crudActions._dao.update(menuId, { permission: permissionIds });

	return result;
});
