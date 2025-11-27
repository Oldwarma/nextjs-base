'use server';

import { createCrudActions } from '@/lib/core/crud-helper';
import { wrapQueryAction } from '@/lib/core/action-wrapper';
import * as sysDao from '@/app/(admin)/actions/dao/sys';

/**
 * Menu CRUD 配置
 */
const menuConfig = {
	/**
	 * 基础配置
	 */
	collectionName: 'menus',
	primaryKey: 'id',
	softDelete: false,

	/**
	 * BaseDAO 字段配置
	 */
	fields: {
		creatable: ['name', 'parent_id', 'url', 'icon', 'sort', 'enable', 'hidden', 'remark'],
		updatable: ['name', 'parent_id', 'url', 'icon', 'sort', 'enable', 'hidden', 'remark'],
		searchable: ['name', 'url'],
	},

	/**
	 * 查询配置
	 */
	query: {
		defaultSort: { sort: 1, createdAt: 1 },
		defaultPageSize: 1000, // 菜单数量通常不多，一次性加载
	},

	/**
	 * 字段验证规则
	 */
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
			message: 'URL max length: 200 characters',
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
			if (data.hidden === undefined) {
				data.hidden = false;
			}
			if (data.sort === undefined) {
				data.sort = 0;
			}

			// 如果选择了父级菜单，清空图标（子菜单不显示图标）
			if (data.parent_id && data.icon) {
				data.icon = null;
			}

			return data;
		},

		beforeUpdate: async (id, data) => {
			// 如果选择了父级菜单，清空图标（子菜单不显示图标）
			if (data.parent_id !== undefined && data.parent_id && data.icon !== undefined) {
				data.icon = null;
			}

			return data;
		},

		beforeDelete: async (id) => {
			// 检查是否有子菜单
			const { getCollection } = await import('@/lib/database/mongodb');
			const collection = await getCollection(menuConfig.collectionName);

			const existing = await collection.findOne({ id });
			if (!existing) {
				throw new Error('Menu not found');
			}

			const childCount = await collection.countDocuments({ parent_id: id });
			if (childCount > 0) {
				throw new Error(`Cannot delete menu "${existing.name}": it has ${childCount} child menu(s). Please delete or reassign them first.`);
			}

			return true;
		},

		afterDelete: async (id) => {
			// 从角色的 menu 数组中移除该菜单
			const { getCollection } = await import('@/lib/database/mongodb');
			const rolesCollection = await getCollection('roles');

			await rolesCollection.updateMany({ menu: id }, { $pull: { menu: id } });

			console.log(`Menu ${id} deleted, cleaned up from roles`);
		},

		beforeBatchDelete: async (ids) => {
			// 检查所有要删除的菜单是否有子菜单
			const { getCollection } = await import('@/lib/database/mongodb');
			const collection = await getCollection(menuConfig.collectionName);

			for (const id of ids) {
				const childCount = await collection.countDocuments({ parent_id: id });
				if (childCount > 0) {
					const menu = await collection.findOne({ id });
					throw new Error(`Cannot delete menu "${menu?.name || id}": it has child menus`);
				}
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
			if (data.hidden !== undefined) {
				data.hidden = data.hidden === true || data.hidden === 'true';
			}

			// 去除字符串首尾空格
			if (data.name) {
				data.name = data.name.trim();
			}
			if (data.url) {
				data.url = data.url.trim();
			}
			if (data.remark) {
				data.remark = data.remark.trim();
			}

			// 处理空字符串为 null
			if (data.parent_id === '') {
				data.parent_id = null;
			}
			if (data.icon === '') {
				data.icon = null;
			}
			if (data.remark === '') {
				data.remark = null;
			}

			return data;
		},

		output: (data) => {
			// 确保默认值
			if (data.enable === undefined) {
				data.enable = true;
			}
			if (data.hidden === undefined) {
				data.hidden = false;
			}
			if (data.sort === undefined || data.sort === null) {
				data.sort = 0;
			}

			return data;
		},
	},
};

/**
 * 创建标准 CRUD Actions
 */
const crudActions = createCrudActions(menuConfig);

/**
 * 导出标准 CRUD Actions
 */
export const getMenuListAction = crudActions.getList;
export const getMenuDetailAction = crudActions.getDetail;
export const createMenuAction = crudActions.create;
export const updateMenuAction = crudActions.update;
export const deleteMenuAction = crudActions.delete;
export const batchUpdateMenusAction = crudActions.batchUpdate;
export const batchDeleteMenusAction = crudActions.batchDelete;

/**
 * 自定义 Actions
 */

/**
 * 获取菜单树（用于树形展示）
 * 返回扁平化格式，适配 SmartCrudPage 的树形表格
 */
export const getMenuTreeAction = wrapQueryAction('menu', async ({ pageIndex = 1, pageSize = 1000, whereJson = {}, sortJson = null } = {}) => {
	// ✅ 如果有搜索条件，使用标准查询（支持搜索所有层级）
	if (whereJson && Object.keys(whereJson).length > 0) {
		const result = await crudActions._dao.getList({
			pageIndex,
			pageSize,
			whereJson,
			sortJson,
		});
		return result;
	}

	// ✅ 没有搜索条件时，返回完整的树形结构
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
});

/**
 * 获取菜单树（用于 TreeSelect 选择器）
 * 返回树形结构，用于父级菜单选择
 */
export const getMenuTreeForSelectAction = wrapQueryAction('menu', async () => {
	const result = await sysDao.getMenuTree({
		pageIndex: 1,
		pageSize: 1000,
		filters: { enable: true },
	});

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

	const formattedTree = [
		{ title: '--- Root Menu ---', value: '', key: '' }, // ✅ 使用空字符串而不是 null，避免 TreeSelect 警告
		...convertToTreeSelectFormat(result.rows || []),
	];

	return {
		success: true,
		data: formattedTree,
	};
});
