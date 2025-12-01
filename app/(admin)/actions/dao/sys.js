import { getCollection } from '@/lib/database/mongodb';
import { selects } from '@/lib/database/db-api';

/**
 * SysDAO - 系统权限相关的数据访问对象
 * 管理角色(Roles)、权限(Permissions)、菜单(Menus)及其关联关系
 */

const COLLECTION_NAMES = {
	ROLES: 'roles',
	PERMISSIONS: 'permissions',
	MENUS: 'menus',
	USERS: 'users',
};

const DB_MAX_LIMIT = 1000;

/**
 * ===================
 * 角色(Role)相关方法
 * ===================
 */

/**
 * 根据角色ID查询角色
 * @param {String} roleId - 角色ID
 * @returns {Promise<Object|null>} 角色对象
 */
export async function findRoleById(roleId) {
	const collection = await getCollection(COLLECTION_NAMES.ROLES);
	return await collection.findOne({ id: roleId });
}

/**
 * 根据角色ID查询角色（包含权限和菜单的名称）
 * 使用通用的 selects 方法实现连表查询
 * @param {String} roleId - 角色ID
 * @returns {Promise<Object|null>} 角色对象，permission 和 menu 字段包含 { id, name } 对象数组
 */
export async function findRoleByIdWithNames(roleId) {
	if (!roleId) return null;

	try {
		const result = await selects({
			dbName: COLLECTION_NAMES.ROLES,
			whereJson: { id: roleId },
			pageIndex: 1,
			pageSize: 1,
			getCount: false,
			foreignDB: [
				{
					dbName: COLLECTION_NAMES.PERMISSIONS,
					localKey: 'permission',        // roles.permission 是 UUID 数组
					foreignKey: 'id',              // permissions.id 是 UUID
					as: 'permissionList',          // 连表结果存放在 permissionList
					fieldJson: { id: 1, name: 1 }, // 只返回 id 和 name
				},
				{
					dbName: COLLECTION_NAMES.MENUS,
					localKey: 'menu',              // roles.menu 是 UUID 数组
					foreignKey: 'id',              // menus.id 是 UUID
					as: 'menuList',                // 连表结果存放在 menuList
					fieldJson: { id: 1, name: 1 }, // 只返回 id 和 name
				},
			],
		});

		if (!result.rows || result.rows.length === 0) {
			return null;
		}

		const role = result.rows[0];

		// 将 permissionList 转换为 permission 字段（保持原字段名）
		role.permission = role.permissionList || [];
		delete role.permissionList;

		// 将 menuList 转换为 menu 字段（保持原字段名）
		role.menu = role.menuList || [];
		delete role.menuList;

		return role;
	} catch (error) {
		console.error('findRoleByIdWithNames error:', error);
		return null;
	}
}

/**
 * 根据多个角色ID查询角色列表
 * @param {Array<String>} roleIds - 角色ID数组
 * @returns {Promise<Array>} 角色对象数组
 */
export async function findRolesByIds(roleIds) {
	if (!Array.isArray(roleIds) || roleIds.length === 0) {
		return [];
	}

	const collection = await getCollection(COLLECTION_NAMES.ROLES);
	return await collection.find({
		id: { $in: roleIds },
	});
}

/**
 * 角色绑定权限
 * @param {Object} params
 * @param {String} params.roleId - 角色ID
 * @param {Array<String>} params.permissionIds - 权限ID数组
 * @param {Boolean} params.reset - 是否重置（true=替换，false=追加）
 * @returns {Promise<Object>} 更新结果
 */
export async function roleBindPermissions({ roleId, permissionIds = [], reset = false }) {
	const collection = await getCollection(COLLECTION_NAMES.ROLES);

	let finalPermissions = permissionIds;

	if (!reset) {
		// 追加模式：获取现有权限并合并
		const role = await findRoleById(roleId);
		const existingPermissions = role?.permission || [];
		finalPermissions = [...new Set([...existingPermissions, ...permissionIds])];
	}

	const result = await collection.updateOne({ id: roleId }, { $set: { permission: finalPermissions } });

	return {
		success: result.modifiedCount > 0,
		modifiedCount: result.modifiedCount,
	};
}

/**
 * 角色绑定菜单
 * @param {Object} params
 * @param {String} params.roleId - 角色ID
 * @param {Array<String>} params.menuIds - 菜单ID数组
 * @param {Boolean} params.reset - 是否重置（true=替换，false=追加）
 * @param {Boolean} params.autoBindMenuPermissions - 是否自动绑定菜单关联的权限
 * @returns {Promise<Object>} 更新结果
 */
export async function roleBindMenus({ roleId, menuIds = [], reset = false, autoBindMenuPermissions = false }) {
	const collection = await getCollection(COLLECTION_NAMES.ROLES);

	let finalMenus = menuIds;

	if (!reset) {
		// 追加模式：获取现有菜单并合并
		const role = await findRoleById(roleId);
		const existingMenus = role?.menu || [];
		finalMenus = [...new Set([...existingMenus, ...menuIds])];
	}

	const result = await collection.updateOne({ id: roleId }, { $set: { menu: finalMenus } });

	// 如果需要自动绑定菜单关联的权限
	if (autoBindMenuPermissions && menuIds.length > 0) {
		const menuPermissions = await getPermissionsByMenuIds(menuIds);
		if (menuPermissions.length > 0) {
			await roleBindPermissions({
				roleId,
				permissionIds: menuPermissions,
				reset: false, // 追加权限，不重置
			});
		}
	}

	return {
		success: result.modifiedCount > 0,
		modifiedCount: result.modifiedCount,
	};
}

/**
 * 获取角色列表（分页）
 * @param {Object} params
 * @param {Number} params.pageIndex - 页码
 * @param {Number} params.pageSize - 每页数量
 * @param {Object} params.filters - 过滤条件
 * @returns {Promise<Object>} 分页结果
 */
export async function getRoleList({ pageIndex = 1, pageSize = 20, filters = {} }) {
	const collection = await getCollection(COLLECTION_NAMES.ROLES);

	const query = { ...filters };

	return await collection.findWithPagination({
		query,
		pageIndex,
		pageSize,
		sort: { id: 1 },
	});
}

/**
 * ===================
 * 权限(Permission)相关方法
 * ===================
 */

/**
 * 根据权限ID查询权限
 * @param {String} permissionId - 权限ID
 * @returns {Promise<Object|null>} 权限对象
 */
export async function findPermissionById(permissionId) {
	const collection = await getCollection(COLLECTION_NAMES.PERMISSIONS);
	return await collection.findOne({ id: permissionId });
}

/**
 * 根据多个权限ID查询权限列表
 * @param {Array<String>} permissionIds - 权限ID数组
 * @returns {Promise<Array>} 权限对象数组
 */
export async function findPermissionsByIds(permissionIds) {
	if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
		return [];
	}

	const collection = await getCollection(COLLECTION_NAMES.PERMISSIONS);
	return await collection.find({
		id: { $in: permissionIds },
	});
}

/**
 * 获取权限树形列表
 * @param {Object} params
 * @param {Number} params.pageIndex - 页码
 * @param {Number} params.pageSize - 每页数量
 * @param {Object} params.filters - 过滤条件
 * @returns {Promise<Object>} 树形结构数据
 */
export async function getPermissionTree({ pageIndex = 1, pageSize = DB_MAX_LIMIT, filters = {} }) {
	const { fromObjectId } = await import('@/lib/database/mongodb');
	const collection = await getCollection(COLLECTION_NAMES.PERMISSIONS);

	// 查询顶级权限（parent_id为null或空字符串）
	const query = {
		$or: [{ parent_id: null }, { parent_id: '' }, { parent_id: { $exists: false } }],
		...filters,
	};

	const result = await collection.findWithPagination({
		query,
		pageIndex,
		pageSize,
		sort: { sort: 1, id: 1 },
	});

	// 递归获取子权限并序列化
	if (result.rows && result.rows.length > 0) {
		const serializedRows = [];
		for (const item of result.rows) {
			const serializedItem = fromObjectId(item);
			const children = await getChildPermissions(item.id);
			
			// 只有当有子节点时才添加 children 属性
			if (children && children.length > 0) {
				serializedItem.children = children;
			}
			
			serializedRows.push(serializedItem);
		}
		result.rows = serializedRows;
	}

	return result;
}

/**
 * 获取所有权限（扁平化列表）
 * @param {Object} filters - 过滤条件
 * @returns {Promise<Array>} 权限列表
 */
export async function getAllPermissions(filters = {}) {
	const collection = await getCollection(COLLECTION_NAMES.PERMISSIONS);
	return await collection.find(filters);
}

/**
 * 递归获取子权限
 * @param {String} parent_id - 父级权限ID
 * @param {Number} maxDepth - 最大递归深度，防止死循环
 * @param {Number} currentDepth - 当前递归深度
 * @returns {Promise<Array>} 子权限数组
 */
async function getChildPermissions(parent_id, maxDepth = 5, currentDepth = 0) {
	if (currentDepth >= maxDepth) {
		return [];
	}

	const { fromObjectId } = await import('@/lib/database/mongodb');
	const collection = await getCollection(COLLECTION_NAMES.PERMISSIONS);
	const children = await collection.find({ parent_id: parent_id });

	// 序列化并递归获取每个子节点的子节点
	const serializedChildren = [];
	for (const child of children) {
		const serializedChild = fromObjectId(child);
		const grandChildren = await getChildPermissions(child.id, maxDepth, currentDepth + 1);
		
		// 只有当有子节点时才添加 children 属性
		if (grandChildren && grandChildren.length > 0) {
			serializedChild.children = grandChildren;
		}
		
		serializedChildren.push(serializedChild);
	}

	return serializedChildren.sort((a, b) => (a.sort || 0) - (b.sort || 0));
}

/**
 * 根据角色ID数组获取所有权限ID（包含继承）
 * @param {Array<String>} roleIds - 角色ID数组
 * @returns {Promise<Array<String>>} 权限ID数组
 */
export async function getPermissionIdsByRoleIds(roleIds) {
	if (!Array.isArray(roleIds) || roleIds.length === 0) {
		return [];
	}

	// admin角色拥有所有权限
	if (roleIds.includes('admin')) {
		return ['*']; // 特殊标识：所有权限
	}

	const roles = await findRolesByIds(roleIds);
	const permissionIds = [];

	roles.forEach((role) => {
		if (role.permission && Array.isArray(role.permission)) {
			permissionIds.push(...role.permission);
		}
	});

	// 去重
	return [...new Set(permissionIds)];
}

/**
 * 递归获取权限及其所有子权限ID
 * @param {String} permissionId - 权限ID
 * @returns {Promise<Array<String>>} 包含自身及所有后代的权限ID数组
 */
export async function getAllChildPermissionIds(permissionId) {
	const allIds = [permissionId];

	const collection = await getCollection(COLLECTION_NAMES.PERMISSIONS);
	const children = await collection.find({ parent_id: permissionId });

	for (const child of children) {
		const childIds = await getAllChildPermissionIds(child.id);
		allIds.push(...childIds);
	}

	return allIds;
}

/**
 * 根据权限ID数组获取所有actions路径
 * @param {Array<String>} permissionIds - 权限ID数组
 * @returns {Promise<Array<String>>} actions路径数组
 */
export async function getActionsByPermissionIds(permissionIds) {
	if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
		return [];
	}

	const permissions = await findPermissionsByIds(permissionIds);
	const actions = [];

	permissions.forEach((permission) => {
		if (permission.actions && Array.isArray(permission.actions)) {
			actions.push(...permission.actions);
		}
	});

	// 去重
	return [...new Set(actions)];
}

/**
 * ===================
 * 菜单(Menu)相关方法
 * ===================
 */

/**
 * 根据菜单ID查询菜单
 * @param {String} menuId - 菜单ID
 * @returns {Promise<Object|null>} 菜单对象
 */
export async function findMenuById(menuId) {
	const collection = await getCollection(COLLECTION_NAMES.MENUS);
	return await collection.findOne({ id: menuId });
}

/**
 * 根据多个菜单ID查询菜单列表
 * @param {Array<String>} menuIds - 菜单ID数组（UUID）
 * @returns {Promise<Array>} 菜单对象数组
 */
export async function findMenusByIds(menuIds) {
	if (!Array.isArray(menuIds) || menuIds.length === 0) {
		return [];
	}

	const collection = await getCollection(COLLECTION_NAMES.MENUS);
	return await collection.find({
		id: { $in: menuIds }, // 使用 id（UUID）查询
	});
}

/**
 * 根据多个菜单Key查询菜单列表（已废弃）
 * @deprecated 使用 findMenusByIds 代替
 * @param {Array<String>} menuKeys - 菜单Key数组
 * @returns {Promise<Array>} 菜单对象数组
 */
export async function findMenusByKeys(menuKeys) {
	// 向后兼容：现在 key 已废弃，直接使用 id
	return await findMenusByIds(menuKeys);
}

/**
 * 获取菜单树形列表
 * @param {Object} params
 * @param {Number} params.pageIndex - 页码
 * @param {Number} params.pageSize - 每页数量
 * @param {Object} params.filters - 过滤条件
 * @returns {Promise<Object>} 树形结构数据
 */
export async function getMenuTree({ pageIndex = 1, pageSize = DB_MAX_LIMIT, filters = {} }) {
	const collection = await getCollection(COLLECTION_NAMES.MENUS);

	// 查询顶级菜单
	const query = {
		$or: [{ parent_id: null }, { parent_id: '' }, { parent_id: { $exists: false } }],
		...filters,
	};

	const result = await collection.findWithPagination({
		query,
		pageIndex,
		pageSize,
		sort: { sort: 1, id: 1 },
	});

	// 递归获取子菜单
	if (result.rows && result.rows.length > 0) {
		for (const item of result.rows) {
			const children = await getChildMenus(item.id);
			// 只有当存在子菜单时才添加 children 字段
			if (children.length > 0) {
				item.children = children;
			}
		}
	}

	return result;
}

/**
 * 递归获取子菜单
 * @param {String} parent_id - 父级菜单ID
 * @param {Number} maxDepth - 最大递归深度
 * @param {Number} currentDepth - 当前递归深度
 * @returns {Promise<Array>} 子菜单数组
 */
async function getChildMenus(parent_id, maxDepth = 5, currentDepth = 0) {
	if (currentDepth >= maxDepth) {
		return [];
	}

	const collection = await getCollection(COLLECTION_NAMES.MENUS);
	const children = await collection.find({ parent_id: parent_id });

	for (const child of children) {
		const subChildren = await getChildMenus(child.id, maxDepth, currentDepth + 1);
		// 只有当存在子菜单时才添加 children 字段
		if (subChildren.length > 0) {
			child.children = subChildren;
		}
	}

	return children.sort((a, b) => (a.sort || 0) - (b.sort || 0));
}

/**
 * 根据菜单Key数组获取关联的权限ID
 * @param {Array<String>} menuKeys - 菜单Key数组
 * @returns {Promise<Array<String>>} 权限ID数组
 */
export async function getPermissionsByMenuKeys(menuKeys) {
	if (!Array.isArray(menuKeys) || menuKeys.length === 0) {
		return [];
	}

	const menus = await findMenusByKeys(menuKeys);
	const permissionIds = [];

	menus.forEach((menu) => {
		if (menu.permission && Array.isArray(menu.permission)) {
			permissionIds.push(...menu.permission);
		}
	});

	// 去重
	return [...new Set(permissionIds)];
}

/**
 * 根据菜单ID数组获取关联的权限ID（兼容旧接口）
 * @deprecated 使用 getPermissionsByMenuKeys 代替
 */
export async function getPermissionsByMenuIds(menuIds) {
	return await getPermissionsByMenuKeys(menuIds);
}

/**
 * 根据角色ID数组获取菜单（用于菜单渲染）
 * @param {Array<String>} roleIds - 角色ID数组
 * @returns {Promise<Array>} 菜单树形数组
 */
export async function getMenusByRoleIds(roleIds) {
	if (!Array.isArray(roleIds) || roleIds.length === 0) {
		return [];
	}

	// admin角色获取所有菜单
	if (roleIds.includes('admin')) {
		const allMenus = await getMenuTree({ filters: { enable: true } });
		return allMenus.rows || [];
	}

	const roles = await findRolesByIds(roleIds);
	const menuIds = [];

	roles.forEach((role) => {
		if (role.menu && Array.isArray(role.menu)) {
			menuIds.push(...role.menu);
		}
	});

	const uniqueMenuIds = [...new Set(menuIds)];

	if (uniqueMenuIds.length === 0) {
		return [];
	}

	const menus = await findMenusByIds(uniqueMenuIds);

	// 过滤已启用的菜单
	const enableMenus = menus.filter((m) => m.enable !== false);

	// 🔧 修复：自动补全缺失的父级菜单
	const menusWithParents = await fillMissingParentMenus(enableMenus);

	// 构建树形结构
	return buildMenuTree(menusWithParents);
}

/**
 * 自动补全缺失的父级菜单
 * 当用户有子菜单权限但缺少父菜单权限时，自动从数据库查询并添加父菜单
 * 这样可以保证菜单树的完整性，避免子菜单被拉平到顶级
 * 
 * @param {Array} menus - 用户已有权限的菜单数组
 * @returns {Promise<Array>} 补全后的菜单数组
 */
async function fillMissingParentMenus(menus) {
	if (!Array.isArray(menus) || menus.length === 0) {
		return menus;
	}

	const menuMap = new Map();
	const missingParentIds = new Set();

	// 第一步：将已有菜单放入Map
	menus.forEach((menu) => {
		menuMap.set(menu.id, menu);
	});

	// 第二步：找出所有缺失的父级ID
	menus.forEach((menu) => {
		if (menu.parent_id && !menuMap.has(menu.parent_id)) {
			missingParentIds.add(menu.parent_id);
		}
	});

	// 如果没有缺失的父级，直接返回
	if (missingParentIds.size === 0) {
		return menus;
	}

	// 第三步：从数据库查询缺失的父级菜单
	const missingParentIdsArray = Array.from(missingParentIds);
	const parentMenus = await findMenusByIds(missingParentIdsArray);

	// 第四步：将父级菜单添加到结果中，并标记为自动补全
	const result = [...menus];
	const addedParentIds = new Set();

	parentMenus.forEach((parentMenu) => {
		// 只添加已启用的父级菜单
		if (parentMenu.enable !== false) {
			// 标记这是自动补全的菜单（用于前端区分显示）
			result.push({
				...parentMenu,
				_autoFilled: true, // 标记为自动补全
			});
			addedParentIds.add(parentMenu.id);
		}
	});

	// 第五步：递归检查新添加的父级菜单是否还有缺失的父级
	// 例如：用户有三级菜单权限，但缺少一级和二级菜单
	const newMissingParentIds = new Set();
	parentMenus.forEach((menu) => {
		if (menu.parent_id && !menuMap.has(menu.parent_id) && !addedParentIds.has(menu.parent_id)) {
			newMissingParentIds.add(menu.parent_id);
		}
	});

	// 如果还有缺失的父级，递归补全
	if (newMissingParentIds.size > 0) {
		return await fillMissingParentMenus(result);
	}

	console.log(`🔧 [fillMissingParentMenus] Auto-filled ${addedParentIds.size} parent menu(s)`);
	return result;
}

/**
 * 构建菜单树形结构
 * @param {Array} menus - 扁平化的菜单数组
 * @returns {Array} 树形结构的菜单数组
 */
function buildMenuTree(menus) {
	const menuMap = new Map();
	const rootMenus = [];

	// 第一步：创建Map便于查找
	menus.forEach((menu) => {
		menuMap.set(menu.id, { ...menu, children: [] });
	});

	// 第二步：构建树形关系
	menus.forEach((menu) => {
		const node = menuMap.get(menu.id);
		if (!menu.parent_id || menu.parent_id === '' || menu.parent_id === null) {
			// 顶级菜单
			rootMenus.push(node);
		} else {
			// 子菜单
			const parent = menuMap.get(menu.parent_id);
			if (parent) {
				parent.children.push(node);
			} else {
				// 父级不存在（理论上不应该发生，因为已经自动补全了）
				// 但作为兜底，还是作为顶级处理，避免子菜单丢失
				console.warn(`⚠️ [buildMenuTree] Parent menu not found for: ${menu.title} (${menu.id}), parent_id: ${menu.parent_id}`);
				rootMenus.push(node);
			}
		}
	});

	// 第三步：清理空的 children 数组并排序
	const sortAndCleanMenus = (menuList) => {
		menuList.sort((a, b) => (a.sort || 0) - (b.sort || 0));
		menuList.forEach((menu) => {
			if (menu.children && menu.children.length > 0) {
				sortAndCleanMenus(menu.children);
			} else {
				// 删除空的 children 数组
				delete menu.children;
			}
		});
	};

	sortAndCleanMenus(rootMenus);

	return rootMenus;
}

/**
 * ===================
 * 用户-角色关联方法
 * ===================
 */

/**
 * 为用户绑定角色
 * @param {Object} params
 * @param {String} params.userId - 用户ID
 * @param {Array<String>} params.roles - 角色ID数组
 * @param {Boolean} params.reset - 是否重置（true=替换，false=追加）
 * @returns {Promise<Object>} 更新结果
 */
export async function bindUserRoles({ userId, roles = [], reset = false }) {
	const collection = await getCollection(COLLECTION_NAMES.USERS);
	const { fromObjectId } = await import('@/lib/database/mongodb');

	let finalRoles = roles;

	if (!reset) {
		// 追加模式：获取现有角色并合并
		// 尝试使用 id 字段查询，如果不存在则使用 _id
		let user = await collection.findOne({ id: userId });
		
		// 如果用 id 找不到，尝试用 _id（可能是 ObjectId）
		if (!user) {
			try {
				const objectId = fromObjectId(userId);
				user = await collection.findOne({ _id: objectId });
			} catch (e) {
				// userId 不是有效的 ObjectId，忽略
			}
		}

		// 使用 roles 字段存储 RBAC 角色数组（避免与 Better Auth 的 role 单一字段冲突）
		let existingRoles = user?.roles || [];
		if (!Array.isArray(existingRoles)) {
			existingRoles = [];
		}

		finalRoles = [...new Set([...existingRoles, ...roles])];
	}

	// 使用 roles 字段存储 RBAC 角色数组
	// 尝试用 id 更新，如果失败则用 _id
	let result = await collection.updateOne({ id: userId }, { $set: { roles: finalRoles } });
	
	// 如果用 id 更新失败（matchedCount === 0），尝试用 _id
	if (result.matchedCount === 0) {
		try {
			const objectId = fromObjectId(userId);
			result = await collection.updateOne({ _id: objectId }, { $set: { roles: finalRoles } });
		} catch (e) {
			// userId 不是有效的 ObjectId
		}
	}

	return {
		success: result.modifiedCount > 0,
		modifiedCount: result.modifiedCount,
	};
}

/**
 * 获取用户的角色ID数组
 * @param {String} userId - 用户ID
 * @returns {Promise<Array<String>>} 角色ID数组
 */
export async function getUserRoleIds(userId) {
	const collection = await getCollection(COLLECTION_NAMES.USERS);
	const { fromObjectId } = await import('@/lib/database/mongodb');
	
	// 尝试使用 id 字段查询
	let user = await collection.findOne({ id: userId });
	
	// 如果用 id 找不到，尝试用 _id（可能是 ObjectId）
	if (!user) {
		try {
			const objectId = fromObjectId(userId);
			user = await collection.findOne({ _id: objectId });
		} catch (e) {
			// userId 不是有效的 ObjectId，忽略
		}
	}

	if (!user) {
		return [];
	}

	// 使用 roles 字段存储 RBAC 角色数组（避免与 Better Auth 的 role 单一字段冲突）
	const roles = user.roles;

	if (!roles) {
		return [];
	}

	if (Array.isArray(roles)) {
		return roles;
	}

	return [];
}

/**
 * 获取用户的所有权限ID（通过角色继承）
 * @param {String} userId - 用户ID
 * @returns {Promise<Array<String>>} 权限ID数组
 */
export async function getUserPermissionIds(userId) {
	const roleIds = await getUserRoleIds(userId);
	return await getPermissionIdsByRoleIds(roleIds);
}

/**
 * 获取用户的所有菜单（通过角色继承）
 * @param {String} userId - 用户ID
 * @returns {Promise<Array>} 菜单树形数组
 */
export async function getUserMenus(userId) {
	const roleIds = await getUserRoleIds(userId);
	return await getMenusByRoleIds(roleIds);
}

/**
 * ===================
 * 权限验证方法
 * ===================
 */

/**
 * 检查用户是否有指定的权限
 * @param {String} userId - 用户ID
 * @param {String} requiredPermissionId - 需要的权限ID
 * @returns {Promise<Boolean>} 是否有权限
 */
export async function checkUserHasPermission(userId, requiredPermissionId) {
	const userPermissionIds = await getUserPermissionIds(userId);

	// admin拥有所有权限
	if (userPermissionIds.includes('*')) {
		return true;
	}

	return userPermissionIds.includes(requiredPermissionId);
}

/**
 * 检查用户是否有权限访问指定的action
 * @param {String} userId - 用户ID
 * @param {String} actionPath - action路径，如 '/admin/actions/user/create'
 * @returns {Promise<Boolean>} 是否有权限
 */
export async function checkUserHasActionPermission(userId, actionPath) {
	const userPermissionIds = await getUserPermissionIds(userId);

	// admin拥有所有权限
	if (userPermissionIds.includes('*')) {
		return true;
	}

	if (userPermissionIds.length === 0) {
		return false;
	}

	// 获取所有权限的actions配置
	const actions = await getActionsByPermissionIds(userPermissionIds);

	if (actions.length === 0) {
		return false;
	}

	// 检查是否匹配（支持通配符）
	return matchActionPath(actionPath, actions);
}

/**
 * 检查用户是否有 API 访问权限
 * @param {String} userId - 用户ID
 * @param {String} apiPath - API 路径 (如 '/api/v1/users/123')
 * @returns {Promise<Boolean>}
 */
export async function checkUserHasApiPermission(userId, apiPath) {
	const userPermissionIds = await getUserPermissionIds(userId);

	// 超级权限
	if (userPermissionIds.includes('*')) {
		return true;
	}

	if (userPermissionIds.length === 0) {
		return false;
	}

	// 获取所有权限的 apis 配置
	const apis = await getApisByPermissionIds(userPermissionIds);

	if (apis.length === 0) {
		return false;
	}

	// 检查是否匹配（复用通配符匹配逻辑）
	return matchActionPath(apiPath, apis);
}

/**
 * 根据权限ID获取 API 配置
 * @param {Array<String>} permissionIds
 * @returns {Promise<Array<String>>}
 */
async function getApisByPermissionIds(permissionIds) {
	const collection = await getCollection(COLLECTION_NAMES.PERMISSIONS);
	// getCollection 返回的 find 方法已经包含 toArray()
	const permissions = await collection.find({
		id: { $in: permissionIds },
		enable: true,
		apis: { $exists: true, $ne: null, $not: { $size: 0 } },
	});

	const allApis = [];
	permissions.forEach((perm) => {
		if (Array.isArray(perm.apis)) {
			allApis.push(...perm.apis);
		}
	});

	return [...new Set(allApis)];
}

/**
 * 匹配action路径（支持通配符）
 * @param {String} actionPath - 待检查的action路径
 * @param {Array<String>} patterns - 权限配置的路径模式数组
 * @returns {Boolean} 是否匹配
 */
function matchActionPath(actionPath, patterns) {
	for (const pattern of patterns) {
		// 精确匹配
		if (pattern === actionPath) {
			return true;
		}

		// 通配符匹配
		if (pattern.includes('*')) {
			const regex = patternToRegex(pattern);
			if (regex.test(actionPath)) {
				return true;
			}
		}
	}

	return false;
}

/**
 * 将通配符模式转换为正则表达式
 * @param {String} pattern - 通配符模式，如 '/admin/actions/user/ *' 或 '** /create*Action'
 * @returns {RegExp} 正则表达式
 */
function patternToRegex(pattern) {
	// 转义特殊字符，但保留 * 和 * *
	let regexStr = pattern
		.replace(/[.+?^${}()|[\]\\]/g, '\\$&') // 转义特殊字符
		.replace(/\*\*/g, '__DOUBLE_STAR__') // 临时替换 * *
		.replace(/\*/g, '[^/]*') // * 匹配单层路径（不包含 /）
		.replace(/__DOUBLE_STAR__/g, '.*'); // * * 匹配任意层级（包括空）
	
	// 特殊处理：如果模式以 * * / 开头，让它也能匹配没有路径前缀的情况
	// 例如：* * /createAction 应该匹配 createAction（没有前导路径）
	// 注意：此时 regexStr 还没有添加 ^ 前缀，所以检查 .* / 而不是 ^ .* /
	if (regexStr.startsWith('.*/')) {
		// 将 .* / 改为 (.*/ )?，表示前面的路径部分是可选的
		regexStr = '(.*/)?' + regexStr.substring(3);
	}

	return new RegExp(`^${regexStr}$`);
}

/**
 * ===================
 * 菜单绑定权限
 * ===================
 */

/**
 * 为菜单绑定权限
 * @param {Object} params
 * @param {String} params.menuId - 菜单ID
 * @param {Array<String>} params.permissionIds - 权限ID数组
 * @param {Boolean} params.reset - 是否重置（true=替换，false=追加）
 * @returns {Promise<Object>} 更新结果
 */
export async function menuBindPermissions({ menuId, permissionIds = [], reset = false }) {
	const collection = await getCollection(COLLECTION_NAMES.MENUS);

	let finalPermissions = permissionIds;

	if (!reset) {
		// 追加模式：获取现有权限并合并
		const menu = await findMenuById(menuId);
		const existingPermissions = menu?.permission || [];
		finalPermissions = [...new Set([...existingPermissions, ...permissionIds])];
	}

	const result = await collection.updateOne({ id: menuId }, { $set: { permission: finalPermissions } });

	return {
		success: result.modifiedCount > 0,
		modifiedCount: result.modifiedCount,
	};
}

/**
 * ===================
 * 获取权限树（用于前端展示）
 * ===================
 */

/**
 * 获取权限树形结构（用于树形选择器）
 * @param {Object} params
 * @param {Boolean} params.withLabel - 是否包含格式化的label字段
 * @returns {Promise<Array>} 权限树形数组
 */
export async function getPermissionTreeForSelect({ withLabel = true } = {}) {
	const { fromObjectId } = await import('@/lib/database/mongodb');
	// 获取所有未删除的权限（包括已禁用的，让管理员可以选择）
	const allPermissions = await getAllPermissions({ 
		deletedAt: { $exists: false }
	});

	// 转换 ObjectId 为字符串
	const serializedPermissions = allPermissions.map((p) => fromObjectId(p));

	// 构建树形结构
	const tree = buildPermissionTree(serializedPermissions);

	if (withLabel) {
		// 为每个节点添加label字段
		addLabelsToTree(tree);
	}

	return tree;
}

/**
 * 构建权限树形结构
 * @param {Array} permissions - 扁平化的权限数组
 * @returns {Array} 树形结构的权限数组
 */
function buildPermissionTree(permissions) {
	const permissionMap = new Map();
	const rootPermissions = [];

	// 第一步：创建Map便于查找
	permissions.forEach((permission) => {
		permissionMap.set(permission.id, { ...permission, children: [] });
	});

	// 第二步：构建树形关系
	permissions.forEach((permission) => {
		const node = permissionMap.get(permission.id);
		if (!permission.parent_id || permission.parent_id === '' || permission.parent_id === null) {
			// 顶级权限
			rootPermissions.push(node);
		} else {
			// 子权限
			const parent = permissionMap.get(permission.parent_id);
			if (parent) {
				parent.children.push(node);
			} else {
				// 父级不存在，作为顶级处理
				rootPermissions.push(node);
			}
		}
	});

	// 第三步：清理空的 children 数组并排序
	const sortAndCleanPermissions = (permissionList) => {
		permissionList.sort((a, b) => (a.sort || 0) - (b.sort || 0));
		permissionList.forEach((permission) => {
			if (permission.children && permission.children.length > 0) {
				sortAndCleanPermissions(permission.children);
			} else {
				// 删除空的 children 数组
				delete permission.children;
			}
		});
	};

	sortAndCleanPermissions(rootPermissions);

	return rootPermissions;
}

/**
 * 为树形结构添加label字段（递归）
 * @param {Array} tree - 树形结构数组
 */
function addLabelsToTree(tree) {
	const levelNames = ['其他', '子弹', '炸弹', '榴弹', '核弹'];
	const crudNames = ['未分类', '增', '删', '改', '查', '特殊'];

	tree.forEach((node) => {
		const badges = [];
		
		// CRUD 类型
		if (node.crud_category !== undefined && node.crud_category !== null && node.crud_category !== 0) {
			badges.push(crudNames[node.crud_category] || '未分类');
		}
		
		// 权限级别
		if (node.level !== undefined && node.level !== null && node.level !== 0) {
			badges.push(levelNames[node.level] || '其他');
		}
		
		// 状态
		if (node.enable === false) {
			badges.push('已禁用');
		}
		
		const badgeText = badges.length > 0 ? ` [${badges.join('/')}]` : '';
		node.label = `${node.name || node.id}${badgeText}`;

		if (node.children && node.children.length > 0) {
			addLabelsToTree(node.children);
		}
	});
}

/**
 * 获取菜单树形结构（用于树形选择器）
 * @param {Object} params
 * @param {Boolean} params.withLabel - 是否包含格式化的label字段
 * @returns {Promise<Array>} 菜单树形数组
 */
export async function getMenuTreeForSelect({ withLabel = true } = {}) {
	const { fromObjectId } = await import('@/lib/database/mongodb');
	const collection = await getCollection(COLLECTION_NAMES.MENUS);
	
	// 获取所有未删除的菜单（包括已禁用的，让管理员可以选择）
	const allMenus = await collection.find(
		{ 
			deletedAt: { $exists: false }
		},
		{
			sort: { sort: 1, createdAt: 1 }
		}
	);

	// 转换 ObjectId 为字符串
	const serializedMenus = allMenus.map((m) => fromObjectId(m));

	// 构建树形结构（使用 parent_id 字段）
	const tree = buildMenuTreeFromFlat(serializedMenus, null);

	if (withLabel) {
		// 为每个节点添加label字段
		addLabelsToMenuTree(tree);
	}

	return tree;
}

/**
 * 从扁平数组构建菜单树（递归）
 * @param {Array} menus - 扁平化的菜单数组
 * @param {String|null} parent_id - 父级 id（UUID）
 * @returns {Array} 树形结构数组
 */
function buildMenuTreeFromFlat(menus, parent_id = null) {
	const tree = [];
	
	for (const menu of menus) {
		// 数据库中 parent_id 字段存的是父菜单的 id（UUID）
		if (menu.parent_id === parent_id) {
			const children = buildMenuTreeFromFlat(menus, menu.id); // 使用 id（UUID）而不是 _id
			if (children.length > 0) {
				menu.children = children;
			}
			tree.push(menu);
		}
	}
	
	return tree;
}

/**
 * 为菜单树形结构添加label字段（递归）
 * @param {Array} tree - 树形结构数组
 */
function addLabelsToMenuTree(tree) {
	tree.forEach((node) => {
		const badges = [];
		if (node.enable === false) badges.push('已禁用');
		if (node.hidden === true) badges.push('隐藏');
		
		const badgeText = badges.length > 0 ? ` [${badges.join('/')}]` : '';
		node.label = `${node.name}${badgeText}`;

		if (node.children && node.children.length > 0) {
			addLabelsToMenuTree(node.children);
		}
	});
}

