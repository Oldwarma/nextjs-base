#!/usr/bin/env node
/**
 * 超级管理员创建脚本
 * 
 * 使用 Better Auth 的密码哈希方式创建管理员账户
 * 
 * 运行方式：
 *   交互式：bun run db:admin
 *   非交互式：ADMIN_EMAIL=xxx ADMIN_PASSWORD=xxx bun run db:admin
 */

import { createInterface } from 'readline';
import { v4 as uuidv4 } from 'uuid';

// 读取用户输入
function prompt(question) {
	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			rl.close();
			resolve(answer.trim());
		});
	});
}

// 验证邮箱格式
function isValidEmail(email) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

// 验证密码强度
function isValidPassword(password) {
	return password && password.length >= 8;
}

async function setupAdmin() {
	console.log('\n🔐 Super Admin Setup\n');
	console.log('This script will create a super admin account with role="admin".');
	console.log('The admin has full access to the backend without needing RBAC roles.\n');

	try {
		// 动态导入
		const { PrismaClient } = await import('../lib/generated/prisma/index.js');
		const { hashPassword } = await import('better-auth/crypto');
		
		const prisma = new PrismaClient();

		try {
			// 检查数据库连接
			await prisma.$queryRaw`SELECT 1`;
			console.log('✓ Database connection successful\n');

			// 检查是否已存在 admin 用户
			const existingAdmin = await prisma.user.findFirst({
				where: { role: 'admin' },
			});

			if (existingAdmin) {
				console.log(`⚠️  An admin user already exists: ${existingAdmin.email}`);
				const proceed = await prompt('Do you want to create another admin? (yes/no): ');
				if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
					console.log('Cancelled.');
					return;
				}
			}

			// 获取管理员信息
			let email = process.env.ADMIN_EMAIL;
			let password = process.env.ADMIN_PASSWORD;
			let name = process.env.ADMIN_NAME || 'Administrator';

			// 交互式输入
			if (!email) {
				email = await prompt('Admin Email: ');
			}
			if (!isValidEmail(email)) {
				console.error('❌ Invalid email format');
				process.exit(1);
			}

			// 检查邮箱是否已存在
			const existingUser = await prisma.user.findUnique({
				where: { email: email.toLowerCase() },
			});
			if (existingUser) {
				console.error(`❌ User with email "${email}" already exists`);
				process.exit(1);
			}

			if (!password) {
				password = await prompt('Admin Password (min 8 chars): ');
			}
			if (!isValidPassword(password)) {
				console.error('❌ Password must be at least 8 characters');
				process.exit(1);
			}

			if (!process.env.ADMIN_NAME) {
				const inputName = await prompt('Admin Name (default: Administrator): ');
				if (inputName) name = inputName;
			}

			console.log('\n📝 Creating admin user...');

			// 使用 Better Auth 的 hashPassword 函数
			const hashedPassword = await hashPassword(password);

			// 生成 UUID
			const userId = uuidv4();

			// 创建用户
			const user = await prisma.user.create({
				data: {
					id: userId,
					email: email.toLowerCase(),
					name,
					emailVerified: true,
					role: 'admin',           // Better Auth admin 角色
					roles: [],               // 不需要 RBAC 角色
					isBackendAllowed: true,  // 允许访问后台
					banned: false,
					credits: 0,
					totalCreditsEarned: 0,
					totalCreditsUsed: 0,
				},
			});
			console.log('   ✓ User created');

			// 创建账户记录（用于密码登录）
			// 注意：accountId 使用 email，与 Better Auth 的 credential provider 一致
			await prisma.account.create({
				data: {
					id: uuidv4(),
					userId: user.id,
					accountId: email.toLowerCase(),
					providerId: 'credential',
					password: hashedPassword,
				},
			});
			console.log('   ✓ Account credential created');

			console.log('\n✅ Super admin created successfully!\n');
			console.log('┌─────────────────────────────────────────┐');
			console.log('│           Admin Account Info            │');
			console.log('├─────────────────────────────────────────┤');
			console.log(`│  Email:    ${email.padEnd(28)}│`);
			console.log(`│  Password: ${'*'.repeat(Math.min(password.length, 20)).padEnd(28)}│`);
			console.log(`│  Name:     ${name.padEnd(28)}│`);
			console.log(`│  Role:     ${'admin'.padEnd(28)}│`);
			console.log('└─────────────────────────────────────────┘');
			console.log('\n⚠️  Please save these credentials securely!');
			console.log('⚠️  Change the password after first login.\n');

		} finally {
			await prisma.$disconnect();
		}

	} catch (error) {
		console.error('❌ Setup failed:', error.message);
		process.exit(1);
	}
}

// 运行
setupAdmin()
	.then(() => process.exit(0))
	.catch(() => process.exit(1));
