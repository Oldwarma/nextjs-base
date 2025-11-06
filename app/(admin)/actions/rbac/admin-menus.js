'use server';

/**
 * 菜单管理 Server Actions
 * 使用核心库自动处理权限验证和日志记录
 */

import { createCrudActions } from '@/lib/core/crud-helper';
import { wrapQueryAction } from '@/lib/core/action-wrapper';
import { menuCrudConfig } from '@/app/(admin)/actions/rbac/configs/menu-crud.config';
import * as sysDao from '@/app/(admin)/actions/dao/sys';

/**
 * 创建标准 CRUD Actions
 */
const crudActions = createCrudActions(menuCrudConfig);

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
 * 获取菜单树（用于树形展示和父级选择）
 */
export const getMenuTreeAction = wrapQueryAction('menu', async ({ pageIndex = 1, pageSize = 1000, filters = {} } = {}) => {
	const result = await sysDao.getMenuTree({
		pageIndex,
		pageSize,
		filters,
	});

	return {
		success: true,
		data: result.rows || [],
		total: result.total || 0,
	};
});

/**
 * 获取菜单列表（用于父级选择器）
 * 返回扁平列表格式
 */
export const getMenuListForParentSelectAction = wrapQueryAction('menu', async () => {
	const result = await crudActions._dao.getList({
		pageIndex: 1,
		pageSize: 1000,
		filters: { enable: true },
	});

	if (!result.success) {
		return result;
	}

	// 添加 "无父级" 选项
	const menus = [
		{ id: null, name: 'Root Menu', label: '--- Root Menu ---', value: null },
		...result.data.map(menu => ({
			...menu,
			label: menu.name,
			value: menu.id,
		})),
	];

	return {
		success: true,
		data: menus,
	};
});

/**
 * 获取菜单树（用于树形选择器）
 * 返回树形结构，适合 TreeSelect 组件
 */
export const getMenuTreeForSelectAction = wrapQueryAction('menu', async () => {
	const result = await sysDao.getMenuTree({
		pageIndex: 1,
		pageSize: 1000,
		filters: { enable: true },
	});

	// 转换为 TreeSelect 所需的格式
	const convertToTreeSelect = (menus) => {
		if (!Array.isArray(menus)) return [];
		
		return menus.map(menu => ({
			title: menu.name,
			value: menu.id,
			key: menu.id,
			children: menu.children && menu.children.length > 0 
				? convertToTreeSelect(menu.children) 
				: undefined,
		}));
	};

	const treeData = [
		{ title: '--- Root Menu ---', value: null, key: 'root' },
		...convertToTreeSelect(result.rows || []),
	];

	return {
		success: true,
		data: treeData,
	};
});
