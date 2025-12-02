/**
 * User DAO - 用户数据访问层
 * 
 * 使用 Prisma 直接操作 PostgreSQL
 */

import { prisma } from '@/lib/database/prisma';
import nb from '@/lib/function';
import { selects } from '@/lib/database/selects';

/**
 * 创建用户
 */
export async function createUser(userData) {
	const {
		email,
		password,
		name,
		username,
		role = 'user',
		isBackendAllowed = false,
		roles = [],
		credits = 0,
	} = userData;

	// 使用 Better Auth 的密码哈希
	const { hashPassword } = await import('better-auth/crypto');
	const hashedPassword = await hashPassword(password);

	const userId = nb.pubfn.uuid();

	// 创建用户
	const user = await prisma.user.create({
		data: {
			id: userId,
			email: email.toLowerCase(),
			emailVerified: false,
			name,
			username,
			role,
			roles,
			isBackendAllowed,
			credits,
			totalCreditsEarned: 0,
			totalCreditsUsed: 0,
			banned: false,
		},
	});

	// 创建 credential account
	await prisma.account.create({
		data: {
			id: nb.pubfn.uuid(),
			userId: user.id,
			accountId: email.toLowerCase(),
			providerId: 'credential',
			password: hashedPassword,
		},
	});

	return user;
}

/**
 * 更新用户信息
 */
export async function updateUser(userId, updateData) {
	const { id, createdAt, password, ...allowedFields } = updateData;

	const user = await prisma.user.update({
		where: { id: userId },
		data: allowedFields,
	});

	return user;
}

/**
 * 删除用户
 */
export async function deleteUser(userId) {
	// 删除用户的账户
	await prisma.account.deleteMany({
		where: { userId },
	});

	// 删除用户
	await prisma.user.delete({
		where: { id: userId },
	});

	return true;
}

/**
 * 根据 ID 获取用户
 */
export async function getUserById(userId) {
	return prisma.user.findUnique({
		where: { id: userId },
	});
}

/**
 * 根据邮箱获取用户
 */
export async function getUserByEmail(email) {
	return prisma.user.findUnique({
		where: { email: email.toLowerCase() },
	});
}

/**
 * 根据用户名获取用户
 */
export async function getUserByUsername(username) {
	return prisma.user.findFirst({
		where: { username },
	});
}

/**
 * 获取用户列表（分页）
 * 使用 selects 万能连表查询，一次查询获取用户及其角色信息
 */
export async function getUserList({ page = 1, pageSize = 20, filters = {}, sort = { createdAt: 'desc' } }) {
	// 构建查询条件
	const whereJson = {};

	if (filters.email) {
		whereJson.email = { contains: filters.email };
	}

	if (filters.name) {
		whereJson.name = { contains: filters.name };
	}

	if (filters.role) {
		whereJson.role = filters.role;
	}

	if (filters.isBackendAllowed !== undefined) {
		whereJson.isBackendAllowed = filters.isBackendAllowed;
	}

	if (filters.banned !== undefined) {
		whereJson.banned = filters.banned;
	}

	// 处理角色数组查询
	if (filters.roles_in && Array.isArray(filters.roles_in) && filters.roles_in.length > 0) {
		whereJson.roles = { hasSome: filters.roles_in };
	}

	// 构建排序
	const sortField = Object.keys(sort)[0] || 'createdAt';
	const sortDir = sort[sortField] || 'desc';

	// 使用 selects 连表查询
	// 注意：必须使用数据库表名，不是 Prisma model 名
	const result = await selects({
		dbName: 'users',           // 数据库表名
		pageIndex: page,
		pageSize,
		whereJson,
		sortArr: [{ name: sortField, type: sortDir }],
		foreignDB: [
			{
				dbName: 'roles',       // 数据库表名
				localKey: 'roles',     // users 表的 roles 字段（数组）
				foreignKey: 'id',      // roles 表的 id 字段
				as: 'roleList',        // 结果字段名
				type: 'array',         // 数组关联
				fieldJson: { id: true, name: true, enable: true },
			}
		]
	});

	return {
		data: result.data,
		total: result.total,
		page: result.pageIndex,
		pageSize: result.pageSize,
	};
}

/**
 * 批量更新用户
 */
export async function batchUpdateUsers(userIds, updateData) {
	const { id, createdAt, password, ...allowedFields } = updateData;

	const result = await prisma.user.updateMany({
		where: { id: { in: userIds } },
		data: allowedFields,
	});

	return result.count;
}

/**
 * 重置用户密码
 */
export async function resetUserPassword(userId, newPassword) {
	const { hashPassword } = await import('better-auth/crypto');
	const hashedPassword = await hashPassword(newPassword);

	const user = await getUserById(userId);
	if (!user) {
		throw new Error('User not found');
	}

	// 查找 credential account
	const existingAccount = await prisma.account.findFirst({
		where: {
			userId,
			providerId: 'credential',
		},
	});

	if (existingAccount) {
		// 更新密码
		await prisma.account.update({
			where: { id: existingAccount.id },
			data: { password: hashedPassword },
		});
	} else {
		// 创建新的 credential account（用户可能是通过 OAuth 注册的）
		await prisma.account.create({
			data: {
				id: nb.pubfn.uuid(),
				userId,
				accountId: user.email,
				providerId: 'credential',
				password: hashedPassword,
			},
		});
	}

	return true;
}

/**
 * 绑定用户角色
 */
export async function bindUserRoles(userId, roleIds) {
	await prisma.user.update({
		where: { id: userId },
		data: { roles: roleIds },
	});

	return true;
}

/**
 * 获取用户的角色列表
 */
export async function getUserRoles(userId) {
	const user = await getUserById(userId);
	if (!user || !user.roles || user.roles.length === 0) {
		return [];
	}

	return prisma.role.findMany({
		where: { id: { in: user.roles } },
	});
}

/**
 * 获取用户统计信息
 */
export async function getUserStats() {
	const [totalUsers, activeUsers, bannedUsers, backendUsers] = await Promise.all([
		prisma.user.count(),
		prisma.user.count({ where: { banned: false } }),
		prisma.user.count({ where: { banned: true } }),
		prisma.user.count({ where: { isBackendAllowed: true } }),
	]);

	return {
		totalUsers,
		activeUsers,
		bannedUsers,
		backendUsers,
	};
}
