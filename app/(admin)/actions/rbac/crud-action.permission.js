'use server';

import { createCrudActions } from '@/lib/core/crud-helper';
import { wrapAction } from '@/lib/core/action-wrapper';
import { prisma } from '@/lib/database/prisma';
import * as sysDao from '@/app/(admin)/actions/dao/sys';

/**
 * Permission CRUD 配置
 */
const permissionConfig = {
	modelName: 'permission',
	primaryKey: 'id',
	softDelete: false,

	fields: {
		creatable: ['name', 'parentId', 'remark', 'enable', 'sort', 'crudCategory', 'level', 'actions', 'apis'],
		updatable: ['name', 'parentId', 'remark', 'enable', 'sort', 'crudCategory', 'level', 'actions', 'apis'],
		searchable: ['name', 'remark'],
	},

	query: {
		defaultSort: { sort: 'asc' },
		defaultPageSize: 100,
	},

	validation: {
		name: {
			required: true,
			type: 'string',
			minLength: 1,
			maxLength: 100,
			message: 'Name must be 1-100 characters',
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
		sort: {
			required: false,
			type: 'number',
			min: 0,
			max: 9999,
			default: 0,
		},
		crudCategory: {
			required: false,
			type: 'number',
			enum: [0, 1, 2, 3, 4, 5],
			default: 0,
		},
		level: {
			required: false,
			type: 'number',
			enum: [0, 1, 2, 3, 4],
			default: 0,
		},
		actions: {
			required: false,
			type: 'array',
			itemType: 'string',
		},
		apis: {
			required: false,
			type: 'array',
			itemType: 'string',
		},
	},

	hooks: {
		beforeCreate: async (data) => {
			// 检查同级名称唯一性
			const existing = await prisma.permission.findFirst({
				where: {
					name: data.name,
					parentId: data.parentId || null,
				},
			});
			if (existing) {
				throw new Error(`Permission name "${data.name}" already exists at this level`);
			}
			return data;
		},

		beforeUpdate: async (id, data) => {
			// 检查循环引用
			if (data.parentId) {
				if (data.parentId === id) {
					throw new Error('Cannot set permission as its own parent');
				}

				const checkCircular = async (parentId, targetId) => {
					if (parentId === targetId) return true;
					const parent = await prisma.permission.findUnique({ where: { id: parentId } });
					if (!parent || !parent.parentId) return false;
					return checkCircular(parent.parentId, targetId);
				};

				if (await checkCircular(data.parentId, id)) {
					throw new Error('Circular reference detected in parent hierarchy');
				}
			}

			// 检查名称唯一性
			if (data.name !== undefined || data.parentId !== undefined) {
				const current = await prisma.permission.findUnique({ where: { id } });
				if (!current) throw new Error('Permission not found');

				const newName = data.name !== undefined ? data.name : current.name;
				const newParentId = data.parentId !== undefined ? data.parentId : current.parentId;

				const existing = await prisma.permission.findFirst({
					where: {
						name: newName,
						parentId: newParentId || null,
						id: { not: id },
					},
				});

				if (existing) {
					throw new Error(`Permission name "${newName}" already exists at this level`);
				}
			}
			return data;
		},

		beforeDelete: async (id) => {
			// 检查是否有子权限
			const children = await prisma.permission.findFirst({ where: { parentId: id } });
			if (children) {
				throw new Error('Cannot delete permission with child permissions. Please delete children first.');
			}

			// 检查是否被角色使用
			const roleUsingPermission = await prisma.role.findFirst({
				where: { permission: { has: id } },
			});
			if (roleUsingPermission) {
				throw new Error(`Cannot delete permission. It is currently assigned to role: ${roleUsingPermission.name}`);
			}

			return true;
		},
	},

	transforms: {
		output: (data) => {
			if (!data) return data;
			if (data.actions && !Array.isArray(data.actions)) data.actions = [];
			if (typeof data.sort !== 'number') data.sort = parseInt(data.sort) || 0;
			if (typeof data.crudCategory !== 'number') data.crudCategory = parseInt(data.crudCategory) || 0;
			if (typeof data.level !== 'number') data.level = parseInt(data.level) || 0;
			if (typeof data.enable !== 'boolean') data.enable = data.enable === true || data.enable === 'true';
			return data;
		},
		input: (data) => {
			if (!data) return data;
			if (data.parentId === '') data.parentId = null;
			if (data.remark === '') data.remark = null;
			if (data.actions) {
				if (!Array.isArray(data.actions)) data.actions = [];
				data.actions = [...new Set(data.actions.filter((a) => a && typeof a === 'string'))];
			}
			if (data.sort !== undefined) data.sort = parseInt(data.sort) || 0;
			if (data.crudCategory !== undefined) data.crudCategory = parseInt(data.crudCategory) || 0;
			if (data.level !== undefined) data.level = parseInt(data.level) || 0;
			if (data.enable !== undefined) data.enable = data.enable === true || data.enable === 'true';
			return data;
		},
	},
};

const crudActions = createCrudActions(permissionConfig);

export const getPermissionListAction = crudActions.getList;
export const getPermissionDetailAction = crudActions.getDetail;
export const createPermissionAction = crudActions.create;
export const updatePermissionAction = crudActions.update;
export const deletePermissionAction = crudActions.delete;
export const batchUpdatePermissionsAction = crudActions.batchUpdate;
export const batchDeletePermissionsAction = crudActions.batchDelete;

/**
 * 获取权限树
 */
export const getPermissionTreeAction = wrapAction('sysQueryPermissionTree', async ({ pageIndex = 1, pageSize = 1000, whereJson = {}, sortJson = null } = {}, ctx) => {
	if (whereJson && Object.keys(whereJson).length > 0) {
		const result = await crudActions._dao.getList({
			pageIndex,
			pageSize,
			whereJson,
			sortJson,
		});
		return result;
	}

	const result = await sysDao.getPermissionTree({
		pageIndex,
		pageSize,
		filters: {},
	});

	return {
		success: true,
		data: result.rows || [],
		total: result.total || 0,
	};
}, { skipLog: false });

/**
 * 获取权限树（用于选择器）
 */
export const getPermissionTreeForSelectAction = wrapAction('sysQueryPermissionTreeForSelect', async (_, ctx) => {
	const tree = await sysDao.getPermissionTreeForSelect({ withLabel: false });

	const convertToTreeSelectFormat = (nodes) => {
		if (!nodes || !Array.isArray(nodes)) return [];

		return nodes.map((node) => {
			const treeNode = {
				title: node.name,
				value: node.id,
				key: node.id,
			};

			if (node.children && node.children.length > 0) {
				treeNode.children = convertToTreeSelectFormat(node.children);
			}

			return treeNode;
		});
	};

	const formattedTree = convertToTreeSelectFormat(tree);

	return {
		success: true,
		data: formattedTree || [],
	};
}, { skipLog: true });

/**
 * 获取权限列表（用于选择器）
 */
export const getPermissionListForSelectAction = wrapAction('sysQueryPermissionListForSelect', async (_, ctx) => {
	const result = await crudActions._dao.getList({
		pageIndex: 1,
		pageSize: 1000,
		filters: { enable: true },
	});

	if (!result.success) {
		return result;
	}

	const permissions = (result.data || []).map((perm) => ({
		id: perm.id,
		name: perm.name,
		parentId: perm.parentId,
	}));

	return {
		success: true,
		data: permissions,
	};
}, { skipLog: true });
