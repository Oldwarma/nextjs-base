/**
 * 导入示例数据到 PostgreSQL
 * 
 * 将 MongoDB 格式的 JSON 数据转换并导入到 Prisma/PostgreSQL
 * 
 * 使用方法: node scripts/import-example-data.js
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../lib/generated/prisma/client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建 Prisma 客户端
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	console.error('❌ DATABASE_URL 环境变量未设置');
	process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

/**
 * 转换 MongoDB 日期格式为 JavaScript Date
 */
function convertDate(value) {
	if (!value) return null;
	
	// MongoDB 格式: { "$date": "2025-11-25T00:00:00.000Z" }
	if (typeof value === 'object' && value.$date) {
		return new Date(value.$date);
	}
	
	// ISO 字符串格式
	if (typeof value === 'string') {
		return new Date(value);
	}
	
	return null;
}

/**
 * 转换数组中的日期
 */
function convertDateArray(arr) {
	if (!arr || !Array.isArray(arr)) return [];
	return arr.map(item => {
		if (typeof item === 'string') return item;
		if (typeof item === 'object' && item.$date) return item.$date;
		return item;
	});
}

/**
 * 转换单条记录
 */
function transformRecord(record) {
	return {
		// 基础信息
		title: record.title,
		description: record.description || null,
		status: record.status || 'draft',
		
		// 分类信息
		category: record.category || null,
		subCategory: record.subCategory || null,
		
		// 联系信息
		contactType: record.contactType || null,
		email: record.email || null,
		phone: record.phone || null,
		wechat: record.wechat || null,
		address: record.address || null,
		
		// 价格信息
		price: record.price ? parseFloat(record.price) : null,
		discount: record.discount ? parseFloat(record.discount) : null,
		quantity: record.quantity ? parseInt(record.quantity) : null,
		
		// 属性信息
		priority: record.priority || null,
		features: record.features || [],
		tags: record.tags || [],
		
		// 组织信息
		department: record.department || null,
		location: record.location || [],
		
		// 日期时间
		publishDate: convertDate(record.publishDate),
		eventTime: convertDate(record.eventTime),
		validPeriod: convertDateArray(record.validPeriod),
		
		// 开关状态
		isActive: record.isActive ?? true,
		isPublic: record.isPublic ?? false,
		isVip: record.isVip ?? false,
		enableNotification: record.enableNotification ?? false,
		
		// 媒体文件 - 上传
		coverImage: record.coverImage || null,
		gallery: record.gallery || [],
		avatar: record.avatar || null,
		documents: [],
		attachments: record.attachment ? [record.attachment] : [],
		
		// 媒体文件 - 从库选择
		selectedImage: null,
		selectedGallery: [],
		selectedAvatar: null,
		selectedFiles: [],
		
		// 高级字段
		rating: record.rating ? parseFloat(record.rating) : null,
		color: record.color || null,
		icon: record.icon || null,
		
		// 内容字段
		richContent: record.richContent || null,
		
		// 数据字段
		keywords: record.keywords || [],
		metadata: record.metadata ? JSON.parse(record.metadata) : null,
		
		// 时间戳
		createdAt: convertDate(record.createdAt) || new Date(),
		updatedAt: convertDate(record.updatedAt) || new Date(),
	};
}

async function main() {
	console.log('🚀 开始导入示例数据...\n');
	
	// 读取 JSON 文件
	const jsonPath = path.join(__dirname, '..', 'nextjs_base.example_data.json');
	
	if (!fs.existsSync(jsonPath)) {
		console.error('❌ 找不到文件: nextjs_base.example_data.json');
		process.exit(1);
	}
	
	const rawData = fs.readFileSync(jsonPath, 'utf-8');
	const records = JSON.parse(rawData);
	
	console.log(`📦 读取到 ${records.length} 条记录\n`);
	
	// 清空现有数据（可选）
	const existingCount = await prisma.exampleData.count();
	if (existingCount > 0) {
		console.log(`🗑️  清空现有 ${existingCount} 条记录...`);
		await prisma.exampleData.deleteMany({});
	}
	
	// 转换并导入数据
	let successCount = 0;
	let errorCount = 0;
	
	for (const record of records) {
		try {
			const transformed = transformRecord(record);
			await prisma.exampleData.create({
				data: transformed,
			});
			successCount++;
			console.log(`✅ 导入成功: ${record.title}`);
		} catch (error) {
			errorCount++;
			console.error(`❌ 导入失败: ${record.title}`);
			console.error(`   错误: ${error.message}`);
		}
	}
	
	console.log('\n========================================');
	console.log(`📊 导入完成！`);
	console.log(`   ✅ 成功: ${successCount} 条`);
	console.log(`   ❌ 失败: ${errorCount} 条`);
	console.log('========================================\n');
}

main()
	.catch((e) => {
		console.error('导入过程出错:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
