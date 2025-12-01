/**
 * User DAO - 用户数据访问层
 * 
 * 使用 Prisma 直接操作 PostgreSQL
 */

import { prisma, generateId } from '@/lib/database/prisma';

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

	const userId = generateId();

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
			id: generateId(),
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
 */
export async function getUserList({ page = 1, pageSize = 20, filters = {}, sort = { createdAt: 'desc' } }) {
	const where = {};

	// 处理搜索条件
	if (filters.email) {
		where.email = { contains: filters.email, mode: 'insensitive' };
	}

	if (filters.name) {
		where.name = { contains: filters.name, mode: 'insensitive' };
	}

	if (filters.role) {
		where.role = filters.role;
	}

	if (filters.isBackendAllowed !== undefined) {
		where.isBackendAllowed = filters.isBackendAllowed;
	}

	if (filters.banned !== undefined) {
		where.banned = filters.banned;
	}

	// 处理角色数组查询
	if (filters.roles_in && Array.isArray(filters.roles_in) && filters.roles_in.length > 0) {
		where.roles = { hasSome: filters.roles_in };
	}

	const skip = (page - 1) * pageSize;

	const [users, total] = await Promise.all([
		prisma.user.findMany({
			where,
			orderBy: sort,
			skip,
			take: pageSize,
		}),
		prisma.user.count({ where }),
	]);

	// 查询关联的角色信息
	const roleIds = new Set();
	users.forEach(user => {
		if (user.roles?.length > 0) {
			user.roles.forEach(id => roleIds.add(id));
		}
	});

	let roleMap = new Map();
	if (roleIds.size > 0) {
		const roles = await prisma.role.findMany({
			where: { id: { in: Array.from(roleIds) } },
			select: { id: true, name: true, enable: true },
		});
		roles.forEach(role => roleMap.set(role.id, role));
	}

	// 附加角色信息
	const usersWithRoles = users.map(user => ({
		...user,
		roleList: user.roles?.map(id => roleMap.get(id)).filter(Boolean) || [],
	}));

	return {
		data: usersWithRoles,
		total,
		page,
		pageSize,
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
				id: generateId(),
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
