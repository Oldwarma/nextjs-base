'use server';

/**
 * 菜单管理 Server Actions
 *
 * 功能：
 * - 获取菜单列表（树形结构）
 * - 创建菜单
 * - 更新菜单
 * - 删除菜单
 * - 获取菜单树（用于父级选择）
 */

import { getCollection, fromObjectId, generateId } from '@/lib/mongodb';
import { checkAdmin } from '@/lib/auth/admin-auth';
import { logAction } from '@/lib/logging/action-logger';

/**
 * 获取菜单列表
 */
export async function getMenuListAction({ pageIndex = 1, pageSize = 1000, ...filters }) {
	const startTime = Date.now();
	const requestTime = new Date();
	const params = { pageIndex, pageSize, ...filters };

	try {
		// 权限检查
		const admin = await checkAdmin();
		if (!admin?.user) {
			const result = { success: false, error: 'Unauthorized' };
			logAction('getMenuList', 'admin/menus', startTime, requestTime, params, result, true);
			return result;
		}

		const menusCollection = await getCollection('menus');

		// 构建查询条件
		const query = {
			deletedAt: { $exists: false },
		};

		// 名称搜索
		if (filters.name) {
			query.name = { $regex: filters.name, $options: 'i' };
		}

		// 是否启用筛选
		if (filters.enable !== undefined && filters.enable !== null && filters.enable !== '') {
			query.enable = filters.enable === true || filters.enable === 'true';
		}

		// 获取所有菜单（不分页，因为需要构建树形结构）
		const menus = await menusCollection.find(query, {
			sort: { sort: 1, createdAt: 1 }, // 按排序值升序，创建时间正序
		});

		// 转换 ObjectId
		const processedMenus = menus.map((menu) => fromObjectId(menu));

		// 构建树形结构
		const menuTree = buildMenuTree(processedMenus);

		const result = {
			success: true,
			data: menuTree,
			total: menuTree.length,
		};

		logAction('getMenuList', 'admin/menus', startTime, requestTime, params, result, false);
		return result;
	} catch (error) {
		console.error('Failed to get menu list:', error);
		const result = {
			success: false,
			error: 'Failed to get menu list',
		};
		logAction('getMenuList', 'admin/menus', startTime, requestTime, params, result, true);
		return result;
	}
}

/**
 * 构建菜单树
 * @param {Array} menus - 扁平菜单数组
 * @param {String|null} parent_id - 父级 id（UUID）
 */
function buildMenuTree(menus, parent_id = null) {
	const tree = [];

	for (const menu of menus) {
		if (menu.parent_id === parent_id) {
			const children = buildMenuTree(menus, menu.id); // ✅ 使用 id（UUID）而不是 _id
			if (children.length > 0) {
				menu.children = children;
			}
			tree.push(menu);
		}
	}

	return tree;
}

/**
 * 获取菜单树（用于父级选择下拉框）
 */
export async function getMenuTreeAction() {
	try {
		const admin = await checkAdmin();
		if (!admin?.user) {
			return { success: false, error: 'Unauthorized' };
		}

		const menusCollection = await getCollection('menus');

		const menus = await menusCollection.find(
			{
				deletedAt: { $exists: false },
				enable: true, // 只显示启用的菜单
			},
			{
				sort: { sort: 1, createdAt: 1 },
			}
		);

		const processedMenus = menus.map((menu) => fromObjectId(menu));

		// 转换为树形选择器需要的格式
		const menuTree = buildMenuTreeForSelector(processedMenus);

		return {
			success: true,
			data: menuTree,
		};
	} catch (error) {
		console.error('Failed to get menu tree:', error);
		return {
			success: false,
			error: 'Failed to get menu tree',
		};
	}
}

/**
 * 构建菜单树（用于 TreeSelect）
 */
function buildMenuTreeForSelector(menus, parent_id = null) {
	const tree = [];

	for (const menu of menus) {
		if (menu.parent_id === parent_id) {
			const node = {
				title: menu.name,
				value: menu.id,
				key: menu.id,
			};

			const children = buildMenuTreeForSelector(menus, menu.id);
			if (children.length > 0) {
				node.children = children;
			}

			tree.push(node);
		}
	}

	return tree;
}

/**
 * 创建菜单
 */
export async function createMenuAction(data) {
	try {
		const admin = await checkAdmin();

		// checkAdmin() 返回 { session, user } 而不是 { success }
		// 如果执行到这里说明权限验证通过（否则会 redirect）
		if (!admin?.user) {
			return { success: false, error: 'Unauthorized' };
		}

		const menusCollection = await getCollection('menus');

		// 准备菜单数据（生成 UUID 作为 id）
		const menuData = {
			id: generateId(), // ✅ 生成 UUID
			name: data.name,
			icon: data.icon || null,
			url: data.url || null,
			sort: data.sort !== undefined ? data.sort : 0,
			parent_id: data.parent_id || null,
			remark: data.remark || null,
			enable: data.enable !== false, // 默认启用
			hidden: data.hidden || false, // 默认不隐藏
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const result = await menusCollection.insertOne(menuData);

		if (result.insertedId) {
			return {
				success: true,
				message: 'Menu created successfully',
				data: { _id: result.insertedId.toString() },
			};
		}

		return {
			success: false,
			error: 'Failed to create menu: insertedId is missing',
		};
	} catch (error) {
		console.error('Failed to create menu:', error);
		return {
			success: false,
			error: `Failed to create menu: ${error.message}`,
		};
	}
}

/**
 * 更新菜单
 */
export async function updateMenuAction(id, data) {
	try {
		const admin = await checkAdmin();
		if (!admin?.user) {
			return { success: false, error: 'Unauthorized' };
		}

		const menusCollection = await getCollection('menus');

		// 不能将菜单的父级设置为自己或自己的子菜单
		if (data.parent_id && data.parent_id === id) {
			return {
				success: false,
				error: 'Cannot set menu as its own parent',
			};
		}

		// 准备更新数据（id 不可修改）
		const updateData = {
			name: data.name,
			icon: data.icon || null,
			url: data.url || null,
			sort: data.sort || 0,
			parent_id: data.parent_id || null,
			remark: data.remark || null,
			enable: data.enable !== false,
			hidden: data.hidden || false,
			updatedAt: new Date(),
		};

		const result = await menusCollection.updateOne({ id: id }, { $set: updateData });

		if (result.matchedCount > 0) {
			return {
				success: true,
				message: 'Menu updated successfully',
			};
		}

		return {
			success: false,
			error: 'Menu not found',
		};
	} catch (error) {
		console.error('Failed to update menu:', error);
		return {
			success: false,
			error: 'Failed to update menu',
		};
	}
}

/**
 * 删除菜单（软删除）
 */
export async function deleteMenuAction(id) {
	try {
		const admin = await checkAdmin();
		if (!admin?.user) {
			return { success: false, error: 'Unauthorized' };
		}

		const menusCollection = await getCollection('menus');

		// 检查是否有子菜单
		const childMenus = await menusCollection.findOne({
			parent_id: id,
			deletedAt: { $exists: false },
		});

		if (childMenus) {
			return {
				success: false,
				error: 'Cannot delete menu with child menus. Please delete child menus first.',
			};
		}

		// 软删除
		const result = await menusCollection.updateOne({ id: id }, { $set: { deletedAt: new Date() } });

		if (result.matchedCount > 0) {
			return {
				success: true,
				message: 'Menu deleted successfully',
			};
		}

		return {
			success: false,
			error: 'Menu not found',
		};
	} catch (error) {
		console.error('Failed to delete menu:', error);
		return {
			success: false,
			error: 'Failed to delete menu',
		};
	}
}

/**
 * 获取菜单树形结构（用于树形选择器）
 * 返回格式化的树形数据，包含 label 字段
 */
export async function getMenuTreeForSelectAction({ withLabel = true } = {}) {
	const startTime = Date.now();
	const requestTime = new Date();

	try {
		// 权限检查
		const admin = await checkAdmin();
		if (!admin?.user) {
			const result = { success: false, error: 'Unauthorized' };
			logAction('getMenuTreeForSelect', 'admin/menus', startTime, requestTime, {}, result, true);
			return result;
		}

		// 使用 sysDao 的方法获取菜单树
		const { getMenuTreeForSelect } = await import('../dao/sys');
		const menuTree = await getMenuTreeForSelect({ withLabel });

		const result = {
			success: true,
			data: menuTree,
		};

		logAction('getMenuTreeForSelect', 'admin/menus', startTime, requestTime, {}, result);
		return result;
	} catch (error) {
		console.error('Failed to get menu tree for select:', error);
		const result = {
			success: false,
			error: 'Failed to get menu tree',
		};
		logAction('getMenuTreeForSelect', 'admin/menus', startTime, requestTime, {}, result, true);
		return result;
	}
}
