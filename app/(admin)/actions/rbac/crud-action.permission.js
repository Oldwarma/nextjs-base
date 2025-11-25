/**
 * Permission CRUD Actions
 *
 * 使用 createCrudActions 自动生成标准 CRUD Actions
 * 包含自定义的 Tree 相关 Actions
 */

'use server';

import { createCrudActions } from '@/lib/core/crud-helper';
import { wrapQueryAction } from '@/lib/core/action-wrapper';
import * as sysDao from '@/app/(admin)/actions/dao/sys';

/**
 * Permission CRUD 配置
 *
 * ✅ 所有服务端配置集中在这里
 * ✅ 不需要单独的 config 文件
 */
const permissionConfig = {
	/**
	 * 基础配置
	 */
	collectionName: 'permissions',
	primaryKey: 'id',
	softDelete: false,

	/**
	 * BaseDAO 字段配置
	 */
	fields: {
		creatable: ['name', 'parent_id', 'remark', 'enable', 'sort', 'crud_category', 'level', 'actions', 'apis'],
		updatable: ['name', 'parent_id', 'remark', 'enable', 'sort', 'crud_category', 'level', 'actions', 'apis'],
		searchable: ['name', 'remark'],
	},

	/**
	 * 查询配置
	 */
	query: {
		defaultSort: { sort: 1, name: 1 },
		defaultPageSize: 100,
		populateFields: [],
	},

	/**
	 * 字段验证规则
	 */
	validation: {
		name: {
			required: true,
			type: 'string',
			minLength: 1,
			maxLength: 100,
			message: 'Name must be 1-100 characters',
		},
		parent_id: {
			required: false,
			type: 'string',
			custom: async (value, context) => {
				if (!value) return true;

				const { getCollection } = await import('@/lib/database/mongodb');
				const collection = await getCollection(permissionConfig.collectionName);
				const parent = await collection.findOne({ id: value });

				if (!parent) {
					throw new Error('Parent permission does not exist');
				}

				if (context.id && value === context.id) {
					throw new Error('Cannot set permission as its own parent');
				}

				const checkCircular = async (parentId, targetId) => {
					if (parentId === targetId) return true;
					const parent = await collection.findOne({ id: parentId });
					if (!parent || !parent.parent_id) return false;
					return checkCircular(parent.parent_id, targetId);
				};

				if (context.id && (await checkCircular(value, context.id))) {
					throw new Error('Circular reference detected in parent hierarchy');
				}

				return true;
			},
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
		crud_category: {
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
			maxLength: 50,
			itemType: 'string',
			custom: async (value) => {
				if (!value || !Array.isArray(value)) return true;
				const uniqueValues = new Set(value);
				if (uniqueValues.size !== value.length) {
					throw new Error('Duplicate action patterns detected');
				}
				for (const pattern of value) {
					if (typeof pattern !== 'string') throw new Error('Action pattern must be a string');
					if (pattern.includes(' ')) throw new Error(`Action pattern cannot contain spaces: ${pattern}`);
					if (pattern.length > 200) throw new Error(`Action pattern too long (max 200 chars): ${pattern}`);
				}
				return true;
			},
		},
		apis: {
			required: false,
			type: 'array',
			maxLength: 50,
			itemType: 'string',
			custom: async (value) => {
				if (!value || !Array.isArray(value)) return true;
				const uniqueValues = new Set(value);
				if (uniqueValues.size !== value.length) {
					throw new Error('Duplicate API paths detected');
				}
				for (const path of value) {
					if (typeof path !== 'string') throw new Error('API path must be a string');
					if (!path.startsWith('/api/')) throw new Error(`API path must start with /api/: ${path}`);
					if (path.includes(' ')) throw new Error(`API path cannot contain spaces: ${path}`);
					if (path.length > 200) throw new Error(`API path too long (max 200 chars): ${path}`);
				}
				return true;
			},
		},
	},

	/**
	 * 生命周期钩子
	 */
	hooks: {
		beforeCreate: async (data) => {
			const { getCollection } = await import('@/lib/database/mongodb');
			const collection = await getCollection(permissionConfig.collectionName);
			const query = { name: data.name };
			if (data.parent_id) {
				query.parent_id = data.parent_id;
			} else {
				query.parent_id = { $in: [null, ''] };
			}
			const existing = await collection.findOne(query);
			if (existing) {
				throw new Error(`Permission name "${data.name}" already exists at this level`);
			}
			return data;
		},

		beforeUpdate: async (id, data) => {
			const { getCollection } = await import('@/lib/database/mongodb');
			const collection = await getCollection(permissionConfig.collectionName);
			if (data.name !== undefined || data.parent_id !== undefined) {
				const current = await collection.findOne({ id });
				if (!current) throw new Error('Permission not found');
				const newName = data.name !== undefined ? data.name : current.name;
				const newParentId = data.parent_id !== undefined ? data.parent_id : current.parent_id;
				const query = { name: newName, id: { $ne: id } };
				if (newParentId) {
					query.parent_id = newParentId;
				} else {
					query.parent_id = { $in: [null, ''] };
				}
				const existing = await collection.findOne(query);
				if (existing) {
					throw new Error(`Permission name "${newName}" already exists at this level`);
				}
			}
			return data;
		},

		beforeDelete: async (id) => {
			const { getCollection } = await import('@/lib/database/mongodb');
			const permissionsCollection = await getCollection(permissionConfig.collectionName);
			const children = await permissionsCollection.findOne({ parent_id: id });
			if (children) {
				throw new Error('Cannot delete permission with child permissions. Please delete children first.');
			}
			const rolesCollection = await getCollection('roles');
			const roleUsingPermission = await rolesCollection.findOne({ permission: id });
			if (roleUsingPermission) {
				throw new Error(`Cannot delete permission. It is currently assigned to role: ${roleUsingPermission.name}`);
			}
			return true;
		},

		afterFind: async (records) => {
			if (!Array.isArray(records) || records.length === 0) return records;
			const { getCollection } = await import('@/lib/database/mongodb');
			const collection = await getCollection(permissionConfig.collectionName);
			const parentIds = [...new Set(records.map((r) => r.parent_id).filter((id) => id && id !== ''))];
			if (parentIds.length === 0) return records;
			const parents = await collection.find({ id: { $in: parentIds } }).toArray();
			const parentMap = new Map(parents.map((p) => [p.id, p]));
			return records.map((record) => {
				if (record.parent_id && parentMap.has(record.parent_id)) {
					return { ...record, parentInfo: parentMap.get(record.parent_id) };
				}
				return record;
			});
		},
	},

	/**
	 * 数据转换
	 */
	transforms: {
		output: (data) => {
			if (!data) return data;
			if (data.actions && !Array.isArray(data.actions)) data.actions = [];
			if (typeof data.sort !== 'number') data.sort = parseInt(data.sort) || 0;
			if (typeof data.crud_category !== 'number') data.crud_category = parseInt(data.crud_category) || 0;
			if (typeof data.level !== 'number') data.level = parseInt(data.level) || 0;
			if (typeof data.enable !== 'boolean') data.enable = data.enable === true || data.enable === 'true';
			return data;
		},
		input: (data) => {
			if (!data) return data;
			if (data.parent_id === '') data.parent_id = null;
			if (data.remark === '') data.remark = null;
			if (data.actions) {
				if (!Array.isArray(data.actions)) data.actions = [];
				data.actions = [...new Set(data.actions.filter((a) => a && typeof a === 'string'))];
			}
			if (data.sort !== undefined) data.sort = parseInt(data.sort) || 0;
			if (data.crud_category !== undefined) data.crud_category = parseInt(data.crud_category) || 0;
			if (data.level !== undefined) data.level = parseInt(data.level) || 0;
			if (data.enable !== undefined) data.enable = data.enable === true || data.enable === 'true';
			return data;
		},
	},
};

/**
 * 创建标准 CRUD Actions
 */
const crudActions = createCrudActions(permissionConfig);

/**
 * 导出标准 CRUD Actions
 */
export const getPermissionListAction = crudActions.getList;
export const getPermissionDetailAction = crudActions.getDetail;
export const createPermissionAction = crudActions.create;
export const updatePermissionAction = crudActions.update;
export const deletePermissionAction = crudActions.delete;
export const batchUpdatePermissionsAction = crudActions.batchUpdate;
export const batchDeletePermissionsAction = crudActions.batchDelete;

/**
 * 自定义 Actions
 */

/**
 * 获取权限树（用于树形展示）
 * 返回扁平化格式，适配 SmartCrudPage 的树形表格
 */
export const getPermissionTreeAction = wrapQueryAction('permission', async ({ pageIndex = 1, pageSize = 1000, whereJson = {}, sortJson = null } = {}) => {
	// ✅ 如果有搜索条件，使用标准查询（支持搜索所有层级）
	if (whereJson && Object.keys(whereJson).length > 0) {
		// 使用标准的 getList 查询（支持 searchable 字段搜索）
		const result = await crudActions._dao.getList({
			pageIndex,
			pageSize,
			whereJson,  // ✅ 使用 whereJson（SmartCrudPage 传递的参数）
			sortJson,
		});
		return result;
	}
	
	// ✅ 没有搜索条件时，返回完整的树形结构
	const result = await sysDao.getPermissionTree({
		pageIndex,
		pageSize,
		filters: {},
	});

	// 返回扁平化的格式，适配 SmartCrudPage
	return {
		success: true,
		data: result.rows || [],
		total: result.total || 0,
	};
});

/**
 * 获取权限树（用于 TreeSelect 选择器）
 * 返回树形结构，用于父级权限选择
 */
export const getPermissionTreeForSelectAction = wrapQueryAction('permission', async () => {
	// 使用 sysDao.getPermissionTreeForSelect 获取完整的权限树
	const tree = await sysDao.getPermissionTreeForSelect({ withLabel: false });

	// ✅ 转换为 TreeSelect 需要的格式
	const convertToTreeSelectFormat = (nodes) => {
		if (!nodes || !Array.isArray(nodes)) return [];

		return nodes.map((node) => {
			const treeNode = {
				title: node.name,
				value: node.id,
				key: node.id,
			};

			// 递归处理子节点
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
});

/**
 * 获取权限列表（用于普通 Select 或 Checkbox）
 * 返回扁平化列表，适配角色页面的权限分配
 */
export const getPermissionListForSelectAction = wrapQueryAction('permission', async () => {
	// 获取所有启用的权限（扁平化）
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
		code: perm.code,
		category: perm.category,
		parent_id: perm.parent_id,
	}));

	return {
		success: true,
		data: permissions,
	};
});
