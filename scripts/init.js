#!/usr/bin/env node
/**
 * 一键初始化脚本
 * 
 * 执行顺序：
 * 1. 检查数据库连接
 * 2. 推送 Prisma Schema（创建表结构）
 * 3. 导入种子数据（RBAC + Example）
 * 4. 创建超级管理员
 * 
 * 运行方式：bun run init
 * 
 * 环境变量（可选）：
 *   ADMIN_EMAIL    - 管理员邮箱
 *   ADMIN_PASSWORD - 管理员密码
 *   ADMIN_NAME     - 管理员名称
 */

import { execSync, spawn } from 'child_process';
import { createInterface } from 'readline';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// 加载 .env 文件
function loadEnv() {
	const envFiles = ['.env.local', '.env'];
	
	for (const envFile of envFiles) {
		const envPath = resolve(process.cwd(), envFile);
		if (existsSync(envPath)) {
			try {
				const content = readFileSync(envPath, 'utf-8');
				const lines = content.split('\n');
				
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
						
						// 只设置未定义的环境变量
						if (!process.env[key]) {
							process.env[key] = value;
						}
					}
				}
				console.log(`   ✓ Loaded environment from ${envFile}`);
				return true;
			} catch (e) {
				// 忽略读取错误
			}
		}
	}
	return false;
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
		// Step 1: 检查环境
		logStep(1, totalSteps, 'Checking environment...');
		
		// 检查 DATABASE_URL
		if (!process.env.DATABASE_URL) {
			log('   ⚠️  DATABASE_URL not found in environment', 'yellow');
			log('   Please make sure your .env file contains DATABASE_URL', 'yellow');
			const proceed = await prompt('   Continue anyway? (yes/no): ');
			if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
				log('\n❌ Initialization cancelled.', 'red');
				process.exit(1);
			}
		} else {
			log('   ✓ DATABASE_URL found', 'green');
		}

		// Step 2: 生成 Prisma Client 并推送 Schema
		logStep(2, totalSteps, 'Setting up database schema...');
		
		log('\n   Generating Prisma Client...', 'yellow');
		if (!runCommand('bunx prisma generate', 'Generate Prisma Client')) {
			throw new Error('Failed to generate Prisma Client');
		}
		log('   ✓ Prisma Client generated', 'green');

		log('\n   Pushing schema to database...', 'yellow');
		if (!runCommand('bunx prisma db push', 'Push schema to database')) {
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

