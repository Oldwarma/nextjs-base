import { prisma } from '@/lib/database/prisma';
import nb from '@/lib/function';

/**
 * SysDAO - 系统权限相关的数据访问对象
 * 管理角色(Roles)、权限(Permissions)、菜单(Menus)及其关联关系
 * 
 * 使用 Prisma 直接操作 PostgreSQL
 */

/**
 * ===================
 * 角色(Role)相关方法
 * ===================
 */

/**
 * 根据角色ID查询角色
 */
export async function findRoleById(roleId) {
	return prisma.role.findUnique({
		where: { id: roleId },
	});
}

/**
 * 根据角色ID查询角色（包含权限和菜单的名称）
 */
export async function findRoleByIdWithNames(roleId) {
	if (!roleId) return null;

	const role = await prisma.role.findUnique({
		where: { id: roleId },
	});

	if (!role) return null;

	// 查询关联的权限
	let permissionList = [];
	if (role.permission?.length > 0) {
		permissionList = await prisma.permission.findMany({
			where: { id: { in: role.permission } },
			select: { id: true, name: true },
		});
	}

	// 查询关联的菜单
	let menuList = [];
	if (role.menu?.length > 0) {
		menuList = await prisma.menu.findMany({
			where: { id: { in: role.menu } },
			select: { id: true, name: true },
		});
	}

	return {
		...role,
		permission: permissionList,
		menu: menuList,
	};
}

/**
 * 根据多个角色ID查询角色列表
 */
export async function findRolesByIds(roleIds) {
	if (!Array.isArray(roleIds) || roleIds.length === 0) {
		return [];
	}

	return prisma.role.findMany({
		where: { id: { in: roleIds } },
	});
}

/**
 * 角色绑定权限
 */
export async function roleBindPermissions({ roleId, permissionIds = [], reset = false }) {
	let finalPermissions = permissionIds;

	if (!reset) {
		const role = await findRoleById(roleId);
		const existingPermissions = role?.permission || [];
		finalPermissions = [...new Set([...existingPermissions, ...permissionIds])];
	}

	const result = await prisma.role.update({
		where: { id: roleId },
		data: { permission: finalPermissions },
	});

	return {
		success: !!result,
		modifiedCount: result ? 1 : 0,
	};
}

/**
 * 角色绑定菜单
 */
export async function roleBindMenus({ roleId, menuIds = [], reset = false, autoBindMenuPermissions = false }) {
	let finalMenus = menuIds;

	if (!reset) {
		const role = await findRoleById(roleId);
		const existingMenus = role?.menu || [];
		finalMenus = [...new Set([...existingMenus, ...menuIds])];
	}

	const result = await prisma.role.update({
		where: { id: roleId },
		data: { menu: finalMenus },
	});

	// 如果需要自动绑定菜单关联的权限
	if (autoBindMenuPermissions && menuIds.length > 0) {
		const menuPermissions = await getPermissionsByMenuIds(menuIds);
		if (menuPermissions.length > 0) {
			await roleBindPermissions({
				roleId,
				permissionIds: menuPermissions,
				reset: false,
			});
		}
	}

	return {
		success: !!result,
		modifiedCount: result ? 1 : 0,
	};
}

/**
 * 获取角色列表（分页）
 */
export async function getRoleList({ pageIndex = 1, pageSize = 20, filters = {} }) {
	const skip = (pageIndex - 1) * pageSize;

	const [rows, total] = await Promise.all([
		prisma.role.findMany({
			where: filters,
			orderBy: { name: 'asc' },
			skip,
			take: pageSize,
		}),
		prisma.role.count({ where: filters }),
	]);

	return {
		code: 0,
		msg: 'ok',
		rows,
		total,
		pageIndex,
		pageSize,
		totalPages: Math.ceil(total / pageSize) || 1,
		hasNext: pageIndex < Math.ceil(total / pageSize),
		hasPrev: pageIndex > 1,
	};
}

/**
 * ===================
 * 权限(Permission)相关方法
 * ===================
 */

/**
 * 根据权限ID查询权限
 */
export async function findPermissionById(permissionId) {
	return prisma.permission.findUnique({
		where: { id: permissionId },
	});
}

/**
 * 根据多个权限ID查询权限列表
 */
export async function findPermissionsByIds(permissionIds) {
	if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
		return [];
	}

	return prisma.permission.findMany({
		where: { id: { in: permissionIds } },
	});
}

/**
 * 获取权限树形列表
 * 优化：一次性查询所有数据，在内存中构建树形结构
 */
export async function getPermissionTree({ pageIndex = 1, pageSize = 1000, filters = {} }) {
	// 一次性查询所有权限
	const allPermissions = await prisma.permission.findMany({
		where: filters,
		orderBy: [{ sort: 'asc' }, { name: 'asc' }],
	});

	// 使用 arrayToTree 构建树形结构
	const rows = nb.pubfn.tree.arrayToTree(allPermissions, {
		sortBy: [{ field: 'sort', order: 'asc' }, { field: 'name', order: 'asc' }],
	});

	return {
		code: 0,
		msg: 'ok',
		rows,
		total: allPermissions.length,
		pageIndex,
		pageSize,
	};
}

/**
 * 获取所有权限（扁平化列表）
 */
export async function getAllPermissions(filters = {}) {
	return prisma.permission.findMany({
		where: filters,
		orderBy: [{ sort: 'asc' }, { name: 'asc' }],
	});
}

/**
 * 根据角色ID数组获取所有权限ID
 */
export async function getPermissionIdsByRoleIds(roleIds) {
	if (!Array.isArray(roleIds) || roleIds.length === 0) {
		return [];
	}

	// admin角色拥有所有权限
	if (roleIds.includes('admin')) {
		return ['*'];
	}

	const roles = await findRolesByIds(roleIds);
	const permissionIds = new Set();

	roles.forEach((role) => {
		if (role.permission && Array.isArray(role.permission)) {
			role.permission.forEach(id => permissionIds.add(id));
		}
	});

	return Array.from(permissionIds);
}

/**
 * 根据权限ID数组获取所有actions路径
 */
export async function getActionsByPermissionIds(permissionIds) {
	if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
		return [];
	}

	const permissions = await findPermissionsByIds(permissionIds);
	const actions = new Set();

	permissions.forEach((permission) => {
		if (permission.actions && Array.isArray(permission.actions)) {
			permission.actions.forEach(action => actions.add(action));
		}
	});

	return Array.from(actions);
}

/**
 * ===================
 * 菜单(Menu)相关方法
 * ===================
 */

/**
 * 根据菜单ID查询菜单
 */
export async function findMenuById(menuId) {
	return prisma.menu.findUnique({
		where: { id: menuId },
	});
}

/**
 * 根据多个菜单ID查询菜单列表
 */
export async function findMenusByIds(menuIds) {
	if (!Array.isArray(menuIds) || menuIds.length === 0) {
		return [];
	}

	return prisma.menu.findMany({
		where: { id: { in: menuIds } },
	});
}

/**
 * 获取菜单树形列表
 * 优化：一次性查询所有数据，在内存中构建树形结构
 */
export async function getMenuTree({ pageIndex = 1, pageSize = 1000, filters = {} }) {
	// 一次性查询所有菜单
	const allMenus = await prisma.menu.findMany({
		where: filters,
		orderBy: [{ sort: 'asc' }, { name: 'asc' }],
	});

	// 使用 arrayToTree 构建树形结构
	const rows = nb.pubfn.tree.arrayToTree(allMenus, {
		sortBy: [{ field: 'sort', order: 'asc' }, { field: 'name', order: 'asc' }],
	});

	return {
		code: 0,
		msg: 'ok',
		rows,
		total: allMenus.length,
		pageIndex,
		pageSize,
	};
}

/**
 * 根据菜单ID数组获取关联的权限ID
 */
export async function getPermissionsByMenuIds(menuIds) {
	if (!Array.isArray(menuIds) || menuIds.length === 0) {
		return [];
	}

	const menus = await findMenusByIds(menuIds);
	const permissionIds = new Set();

	menus.forEach((menu) => {
		if (menu.permission && Array.isArray(menu.permission)) {
			menu.permission.forEach(id => permissionIds.add(id));
		}
	});

	return Array.from(permissionIds);
}

/**
 * 根据角色ID数组获取菜单
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
	const menuIds = new Set();

	roles.forEach((role) => {
		if (role.menu && Array.isArray(role.menu)) {
			role.menu.forEach(id => menuIds.add(id));
		}
	});

	if (menuIds.size === 0) {
		return [];
	}

	// 获取所有菜单用于补全父级
	const allMenus = await prisma.menu.findMany({
		where: { deletedAt: null },
	});

	const menus = await findMenusByIds(Array.from(menuIds));
	const enableMenus = menus.filter((m) => m.enable !== false);

	// 使用 fillMissingParents 补全缺失的父级菜单
	const menusWithParents = nb.pubfn.tree.fillMissingParents(enableMenus, allMenus);

	// 使用 arrayToTree 构建树形结构
	return nb.pubfn.tree.arrayToTree(menusWithParents, {
		filter: (item) => item.enable !== false,
		sortBy: [{ field: 'sort', order: 'asc' }],
	});
}

/**
 * ===================
 * 用户-角色关联方法
 * ===================
 */

/**
 * 为用户绑定角色
 */
export async function bindUserRoles({ userId, roles = [], reset = false }) {
	let finalRoles = roles;

	if (!reset) {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { roles: true },
		});
		const existingRoles = user?.roles || [];
		finalRoles = [...new Set([...existingRoles, ...roles])];
	}

	const result = await prisma.user.update({
		where: { id: userId },
		data: { roles: finalRoles },
	});

	return {
		success: !!result,
		modifiedCount: result ? 1 : 0,
	};
}

/**
 * 获取用户的角色ID数组
 */
export async function getUserRoleIds(userId) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { roles: true },
	});

	return user?.roles || [];
}

/**
 * 获取用户的所有权限ID
 */
export async function getUserPermissionIds(userId) {
	const roleIds = await getUserRoleIds(userId);
	const rolePermissionIds = await getPermissionIdsByRoleIds(roleIds);

	// 检查菜单权限继承
	const roles = await findRolesByIds(roleIds);
	const rolesWithMenuInheritance = roles.filter(role => role.inheritMenuPermissions === true);

	let menuPermissionIds = [];
	if (rolesWithMenuInheritance.length > 0) {
		const menuIds = [];
		rolesWithMenuInheritance.forEach(role => {
			if (role.menu && Array.isArray(role.menu)) {
				menuIds.push(...role.menu);
			}
		});

		const uniqueMenuIds = [...new Set(menuIds)];
		if (uniqueMenuIds.length > 0) {
			menuPermissionIds = await getPermissionsByMenuIds(uniqueMenuIds);
		}
	}

	return [...new Set([...rolePermissionIds, ...menuPermissionIds])];
}

/**
 * 获取用户的所有菜单
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
 */
export async function checkUserHasPermission(userId, requiredPermissionId) {
	const userPermissionIds = await getUserPermissionIds(userId);

	if (userPermissionIds.includes('*')) {
		return true;
	}

	return userPermissionIds.includes(requiredPermissionId);
}

/**
 * 检查用户是否有权限访问指定的action
 */
export async function checkUserHasActionPermission(userId, actionPath) {
	const userPermissionIds = await getUserPermissionIds(userId);

	if (userPermissionIds.includes('*')) {
		return true;
	}

	if (userPermissionIds.length === 0) {
		return false;
	}

	const actions = await getActionsByPermissionIds(userPermissionIds);

	if (actions.length === 0) {
		return false;
	}

	return matchActionPath(actionPath, actions);
}

/**
 * 匹配action路径
 */
function matchActionPath(actionPath, patterns) {
	for (const pattern of patterns) {
		if (pattern === actionPath) {
			return true;
		}

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
 */
function patternToRegex(pattern) {
	let regexStr = pattern
		.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
		.replace(/\*\*/g, '__DOUBLE_STAR__')
		.replace(/\*/g, '[^/]*')
		.replace(/__DOUBLE_STAR__/g, '.*');

	if (regexStr.startsWith('.*/')) {
		regexStr = '(.*/)?' + regexStr.substring(3);
	}

	return new RegExp(`^${regexStr}$`);
}

/**
 * ===================
 * 菜单绑定权限
 * ===================
 */

export async function menuBindPermissions({ menuId, permissionIds = [], reset = false }) {
	let finalPermissions = permissionIds;

	if (!reset) {
		const menu = await findMenuById(menuId);
		const existingPermissions = menu?.permission || [];
		finalPermissions = [...new Set([...existingPermissions, ...permissionIds])];
	}

	const result = await prisma.menu.update({
		where: { id: menuId },
		data: { permission: finalPermissions },
	});

	return {
		success: !!result,
		modifiedCount: result ? 1 : 0,
	};
}

/**
 * ===================
 * 树形选择器数据
 * ===================
 */

export async function getPermissionTreeForSelect({ withLabel = true } = {}) {
	const allPermissions = await prisma.permission.findMany({
		where: { deletedAt: null },
		orderBy: [{ sort: 'asc' }, { name: 'asc' }],
	});

	const tree = buildPermissionTree(allPermissions);

	if (withLabel) {
		addLabelsToTree(tree);
	}

	return tree;
}

function buildPermissionTree(permissions) {
	const permissionMap = new Map();
	const rootPermissions = [];

	permissions.forEach((permission) => {
		permissionMap.set(permission.id, { ...permission, children: [] });
	});

	permissions.forEach((permission) => {
		const node = permissionMap.get(permission.id);
		if (!permission.parentId) {
			rootPermissions.push(node);
		} else {
			const parent = permissionMap.get(permission.parentId);
			if (parent) {
				parent.children.push(node);
			} else {
				rootPermissions.push(node);
			}
		}
	});

	const sortAndClean = (list) => {
		list.sort((a, b) => (a.sort || 0) - (b.sort || 0));
		list.forEach((item) => {
			if (item.children?.length > 0) {
				sortAndClean(item.children);
			} else {
				delete item.children;
			}
		});
	};

	sortAndClean(rootPermissions);
	return rootPermissions;
}

function addLabelsToTree(tree) {
	const levelNames = ['其他', '子弹', '炸弹', '榴弹', '核弹'];
	const crudNames = ['未分类', '增', '删', '改', '查', '特殊'];

	tree.forEach((node) => {
		const badges = [];

		if (node.crudCategory !== undefined && node.crudCategory !== null && node.crudCategory !== 0) {
			badges.push(crudNames[node.crudCategory] || '未分类');
		}

		if (node.level !== undefined && node.level !== null && node.level !== 0) {
			badges.push(levelNames[node.level] || '其他');
		}

		if (node.enable === false) {
			badges.push('已禁用');
		}

		const badgeText = badges.length > 0 ? ` [${badges.join('/')}]` : '';
		node.label = `${node.name || node.id}${badgeText}`;

		if (node.children?.length > 0) {
			addLabelsToTree(node.children);
		}
	});
}

export async function getMenuTreeForSelect({ withLabel = true } = {}) {
	const allMenus = await prisma.menu.findMany({
		where: { deletedAt: null },
		orderBy: [{ sort: 'asc' }, { name: 'asc' }],
	});

	// 使用 arrayToTree 构建树形结构，可选添加 label
	const tree = nb.pubfn.tree.arrayToTree(allMenus, {
		sortBy: [{ field: 'sort', order: 'asc' }, { field: 'name', order: 'asc' }],
		transform: withLabel ? (node) => {
		const badges = [];
		if (node.enable === false) badges.push('已禁用');
		if (node.hidden === true) badges.push('隐藏');
		const badgeText = badges.length > 0 ? ` [${badges.join('/')}]` : '';
			return { ...node, label: `${node.name}${badgeText}` };
		} : undefined,
	});

	return tree;
}
