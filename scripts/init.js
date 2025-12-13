#!/usr/bin/env node
/**
 * 一键初始化脚本 (优化版本)
 * 
 * 执行顺序：
 * 1. 环境检查（Node.js版本、数据库连接等）
 * 2. 生成 Prisma Client 并推送 Schema
 * 3. 导入种子数据（RBAC + Example）
 * 4. 创建超级管理员
 * 
 * 运行方式：bun run init
 * 
 * 环境变量（可选）：
 *   ADMIN_EMAIL    - 管理员邮箱
 *   ADMIN_PASSWORD - 管理员密码
 *   ADMIN_NAME     - 管理员名称
 * 
 * 安全特性：
 * - 环境变量名称白名单验证
 * - 数据库连接测试
 * - 详细的错误日志
 * - 包管理器自动检测
 */

import { execSync, spawn } from 'child_process';
import { createInterface } from 'readline';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

// 环境变量名称白名单（安全性考虑）
const ALLOWED_ENV_VARS = new Set([
	'DATABASE_URL',
	'BETTER_AUTH_SECRET',
	'BETTER_AUTH_URL',
	'NEXT_PUBLIC_BETTER_AUTH_URL',
	'GOOGLE_CLIENT_ID',
	'GOOGLE_CLIENT_SECRET',
	'GITHUB_CLIENT_ID',
	'GITHUB_CLIENT_SECRET',
	'R2_ACCOUNT_ID',
	'R2_ACCESS_KEY_ID',
	'R2_SECRET_ACCESS_KEY',
	'R2_BUCKET_NAME',
	'R2_PUBLIC_URL',
	'NODE_ENV',
	'ADMIN_EMAIL',
	'ADMIN_PASSWORD',
	'ADMIN_NAME'
]);

// 验证环境变量名称是否在白名单中
function isValidEnvVar(name) {
	return ALLOWED_ENV_VARS.has(name);
}

// 加载 .env 文件（优化版本）
function loadEnv() {
	const envFiles = ['.env.local', '.env'];
	let loaded = false;
	
	for (const envFile of envFiles) {
		const envPath = resolve(process.cwd(), envFile);
		if (existsSync(envPath)) {
			try {
				const content = readFileSync(envPath, 'utf-8');
				const lines = content.split('\n');
				let loadedCount = 0;
				
				for (const line of lines) {
					const trimmed = line.trim();
					// 跳过空行和注释
					if (!trimmed || trimmed.startsWith('#')) continue;
					
					const eqIndex = trimmed.indexOf('=');
					if (eqIndex > 0) {
						const key = trimmed.substring(0, eqIndex).trim();
						let value = trimmed.substring(eqIndex + 1).trim();
						
						// 移除引号
						if ((value.startsWith('"') && value.endsWith('"')) ||
						    (value.startsWith("'") && value.endsWith("'"))) {
							value = value.slice(1, -1);
						}
						
						// 安全检查：只允许白名单中的环境变量
						if (!isValidEnvVar(key)) {
							log(`   ⚠️  Skipping unknown env var: ${key}`, 'yellow');
							continue;
						}
						
						// 只设置未定义的环境变量
						if (!process.env[key]) {
							process.env[key] = value;
							loadedCount++;
						}
					}
				}
				
				if (loadedCount > 0) {
					log(`   ✓ Loaded ${loadedCount} environment variables from ${envFile}`, 'green');
					loaded = true;
				}
				return loaded;
			} catch (e) {
				log(`   ❌ Failed to read ${envFile}: ${e.message}`, 'red');
				// 继续尝试下一个文件
			}
		}
	}
	return loaded;
}

// 在脚本开始时加载环境变量
loadEnv();

// 颜色输出
const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	red: '\x1b[31m',
	cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
	console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, total, message) {
	console.log(`\n${colors.cyan}[${step}/${total}]${colors.reset} ${colors.bright}${message}${colors.reset}`);
}

// 执行命令
function runCommand(command, description) {
	try {
		log(`   Running: ${command}`, 'yellow');
		execSync(command, { stdio: 'inherit' });
		return true;
	} catch (error) {
		log(`   ❌ Failed: ${description}`, 'red');
		return false;
	}
}

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

// 运行子脚本（支持交互）
function runScript(scriptPath) {
	return new Promise((resolve, reject) => {
		const child = spawn('node', [scriptPath], {
			stdio: 'inherit',
			env: process.env,
		});

		child.on('close', (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`Script exited with code ${code}`));
			}
		});

		child.on('error', reject);
	});
}

// 检测可用的包管理器
function detectPackageManager() {
	const managers = ['bun', 'pnpm', 'yarn', 'npm'];
	
	for (const manager of managers) {
		try {
			execSync(`${manager} --version`, { stdio: 'pipe' });
			log(`   ✓ Detected package manager: ${manager}`, 'green');
			return manager;
		} catch (e) {
			// 继续尝试下一个
		}
	}
	
	throw new Error('No supported package manager found. Please install bun, pnpm, yarn, or npm.');
}

// 测试数据库连接
async function testDatabaseConnection() {
	if (!process.env.DATABASE_URL) {
		return { success: false, error: 'DATABASE_URL not found' };
	}
	
	try {
		log('   Testing database connection...', 'yellow');
		const prisma = new PrismaClient({
			datasources: {
				db: {
					url: process.env.DATABASE_URL
				}
			}
		});
		
		// 简单的连接测试
		await prisma.$queryRaw`SELECT 1`;
		await prisma.$disconnect();
		
		log('   ✓ Database connection successful', 'green');
		return { success: true };
	} catch (error) {
		log(`   ❌ Database connection failed: ${error.message}`, 'red');
		return { success: false, error: error.message };
	}
}

// 检查 Node.js 版本
function checkNodeVersion() {
	const nodeVersion = process.version;
	const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
	const minVersion = 20;
	
	if (majorVersion < minVersion) {
		log(`   ❌ Node.js version ${nodeVersion} is too old. Minimum required: v${minVersion}`, 'red');
		return false;
	}
	
	log(`   ✓ Node.js version: ${nodeVersion}`, 'green');
	return true;
}

// 检查系统环境
async function checkEnvironment() {
	log('   Checking system environment...', 'yellow');
	
	const checks = [
		{ name: 'Node.js Version', check: checkNodeVersion },
		{ name: 'Database Connection', check: testDatabaseConnection },
		{ name: 'Package Manager', check: detectPackageManager }
	];
	
	let allPassed = true;
	
	for (const { name, check } of checks) {
		try {
			const result = await check();
			if (result === false || (result && result.success === false)) {
				log(`   ❌ ${name} check failed`, 'red');
				allPassed = false;
			}
		} catch (error) {
			log(`   ❌ ${name} check failed: ${error.message}`, 'red');
			allPassed = false;
		}
	}
	
	return allPassed;
}

async function init() {
	console.log('\n');
	log('╔═══════════════════════════════════════════════════════════╗', 'cyan');
	log('║                                                           ║', 'cyan');
	log('║           NextJS Base Admin - Initialization              ║', 'cyan');
	log('║                                                           ║', 'cyan');
	log('╚═══════════════════════════════════════════════════════════╝', 'cyan');
	console.log('\n');

	const totalSteps = 4;

	try {
		// Step 1: 环境检查（优化版本）
		logStep(1, totalSteps, 'Checking environment...');
		
		// 执行全面的环境检查
		const envChecksPassed = await checkEnvironment();
		
		if (!envChecksPassed) {
			log('   ❌ Some environment checks failed', 'red');
			const proceed = await prompt('   Continue anyway? Some features may not work properly. (yes/no): ');
			if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
				log('\n❌ Initialization cancelled due to environment issues.', 'red');
				process.exit(1);
			}
		} else {
			log('   ✓ All environment checks passed', 'green');
		}
		
		// 检测并使用包管理器
		let packageManager;
		try {
			packageManager = detectPackageManager();
		} catch (error) {
			throw new Error(`Package manager detection failed: ${error.message}`);
		}

		// Step 2: 生成 Prisma Client 并推送 Schema
		logStep(2, totalSteps, 'Setting up database schema...');
		
		log('\n   Generating Prisma Client...', 'yellow');
		if (!runCommand(`${packageManager}x prisma generate`, 'Generate Prisma Client')) {
			throw new Error('Failed to generate Prisma Client');
		}
		log('   ✓ Prisma Client generated', 'green');

		log('\n   Pushing schema to database...', 'yellow');
		if (!runCommand(`${packageManager}x prisma db push`, 'Push schema to database')) {
			throw new Error('Failed to push schema');
		}
		log('   ✓ Database schema created', 'green');

		// Step 3: 导入种子数据
		logStep(3, totalSteps, 'Importing seed data...');
		await runScript('./prisma/seed.js');
		log('   ✓ Seed data imported', 'green');

		// Step 4: 创建超级管理员
		logStep(4, totalSteps, 'Creating super admin account...');
		await runScript('./scripts/setup-admin.js');

		// 完成
		console.log('\n');
		log('╔═══════════════════════════════════════════════════════════╗', 'green');
		log('║                                                           ║', 'green');
		log('║           ✅ Initialization Completed!                    ║', 'green');
		log('║                                                           ║', 'green');
		log('╚═══════════════════════════════════════════════════════════╝', 'green');
		console.log('\n');

		log('Next steps:', 'bright');
		log('  1. Run "bun run dev" to start the development server', 'cyan');
		log('  2. Visit http://localhost:3000/admin to access the admin panel', 'cyan');
		log('  3. Login with your admin credentials', 'cyan');
		console.log('\n');

	} catch (error) {
		console.log('\n');
		log('╔═══════════════════════════════════════════════════════════╗', 'red');
		log('║                                                           ║', 'red');
		log('║           ❌ Initialization Failed                        ║', 'red');
		log('║                                                           ║', 'red');
		log('╚═══════════════════════════════════════════════════════════╝', 'red');
		console.log('\n');
		log(`Error: ${error.message}`, 'red');
		console.log('\n');
		process.exit(1);
	}
}

// 运行
init();

