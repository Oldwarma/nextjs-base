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

import { getCollection, fromObjectId } from '@/lib/mongodb';
import { checkAdmin } from '@/lib/admin-auth';

/**
 * 获取菜单列表
 */
export async function getMenuListAction({ pageIndex = 1, pageSize = 1000, ...filters }) {
	try {
		// 权限检查
		const admin = await checkAdmin();
		if (!admin?.user) {
			return { success: false, error: 'Unauthorized' };
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
		if (filters.enabled !== undefined && filters.enabled !== null && filters.enabled !== '') {
			query.enabled = filters.enabled === true || filters.enabled === 'true';
		}

		// 获取所有菜单（不分页，因为需要构建树形结构）
		const menus = await menusCollection.find(query, {
			sort: { sortOrder: 1, createdAt: 1 }, // 按排序值升序，创建时间正序
		});

		// 转换 ObjectId
		const processedMenus = menus.map((menu) => fromObjectId(menu));

		// 构建树形结构
		const menuTree = buildMenuTree(processedMenus);

		return {
			success: true,
			data: menuTree,
			total: menuTree.length,
		};
	} catch (error) {
		console.error('Failed to get menu list:', error);
		return {
			success: false,
			error: 'Failed to get menu list',
		};
	}
}

/**
 * 构建菜单树
 */
function buildMenuTree(menus, parentId = null) {
	const tree = [];

	for (const menu of menus) {
		if (menu.parentId === parentId) {
			const children = buildMenuTree(menus, menu._id);
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
				enabled: true, // 只显示启用的菜单
			},
			{
				sort: { sortOrder: 1, createdAt: 1 },
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
function buildMenuTreeForSelector(menus, parentId = null) {
	const tree = [];

	for (const menu of menus) {
		if (menu.parentId === parentId) {
			const node = {
				title: menu.name,
				value: menu._id,
				key: menu._id,
			};

			const children = buildMenuTreeForSelector(menus, menu._id);
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
	console.log('🔵 [1/6] createMenuAction START - received data:', data);

	try {
		console.log('🔵 [2/6] Checking admin permissions...');
		const admin = await checkAdmin();
		console.log('🔵 [2/6] Admin check result:', admin);

		// checkAdmin() 返回 { session, user } 而不是 { success }
		// 如果执行到这里说明权限验证通过（否则会 redirect）
		if (!admin?.user) {
			console.error('❌ Admin check failed: No user found');
			return { success: false, error: 'Unauthorized' };
		}

		console.log('🔵 [3/6] Getting menus collection...');
		const menusCollection = await getCollection('menus');
		console.log('🔵 [3/6] Got menus collection:', !!menusCollection);

		// 验证菜单标识唯一性
		if (data.key) {
			console.log('🔵 [4/6] Checking if menu key exists:', data.key);
			const existingMenu = await menusCollection.findOne({
				key: data.key,
				deletedAt: { $exists: false },
			});
			console.log('🔵 [4/6] Existing menu found:', !!existingMenu);

			if (existingMenu) {
				console.warn('⚠️ Menu key already exists:', data.key);
				return {
					success: false,
					error: 'Menu key already exists',
				};
			}
		}

		// 准备菜单数据
		const menuData = {
			key: data.key,
			name: data.name,
			icon: data.icon || null,
			url: data.url || null,
			sortOrder: data.sortOrder !== undefined ? data.sortOrder : 0,
			parentId: data.parentId || null,
			remark: data.remark || null,
			enabled: data.enabled !== false, // 默认启用
			hidden: data.hidden || false, // 默认不隐藏
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		console.log('🔵 [5/6] Attempting to insert menu data:', menuData);

		const result = await menusCollection.insertOne(menuData);

		console.log('🔵 [6/6] Insert result:', result);
		console.log('🔵 [6/6] insertedId:', result?.insertedId);

		if (result.insertedId) {
			console.log('✅ Menu created successfully with ID:', result.insertedId.toString());
			return {
				success: true,
				message: 'Menu created successfully',
				data: { _id: result.insertedId.toString() },
			};
		}

		console.error('❌ Failed to create menu: insertedId is missing');
		return {
			success: false,
			error: 'Failed to create menu: insertedId is missing',
		};
	} catch (error) {
		console.error('❌ [ERROR] Failed to create menu - Error details:', error);
		console.error('❌ [ERROR] Error message:', error.message);
		console.error('❌ [ERROR] Error stack:', error.stack);
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
		const { ObjectId } = await import('mongodb');

		// 验证菜单标识唯一性（排除当前菜单）
		if (data.key) {
			const existingMenu = await menusCollection.findOne({
				key: data.key,
				_id: { $ne: new ObjectId(id) },
				deletedAt: { $exists: false },
			});

			if (existingMenu) {
				return {
					success: false,
					error: 'Menu key already exists',
				};
			}
		}

		// 不能将菜单的父级设置为自己或自己的子菜单
		if (data.parentId && data.parentId === id) {
			return {
				success: false,
				error: 'Cannot set menu as its own parent',
			};
		}

		// 准备更新数据
		const updateData = {
			key: data.key,
			name: data.name,
			icon: data.icon || null,
			url: data.url || null,
			sortOrder: data.sortOrder || 0,
			parentId: data.parentId || null,
			remark: data.remark || null,
			enabled: data.enabled !== false,
			hidden: data.hidden || false,
			updatedAt: new Date(),
		};

		const result = await menusCollection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });

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
		const { ObjectId } = await import('mongodb');

		// 检查是否有子菜单
		const childMenus = await menusCollection.findOne({
			parentId: id,
			deletedAt: { $exists: false },
		});

		if (childMenus) {
			return {
				success: false,
				error: 'Cannot delete menu with child menus. Please delete child menus first.',
			};
		}

		// 软删除
		const result = await menusCollection.updateOne({ _id: new ObjectId(id) }, { $set: { deletedAt: new Date() } });

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
