/**
 * Prisma 7 客户端单例
 * 使用 @prisma/adapter-pg 驱动适配器连接 PostgreSQL
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/lib/generated/prisma/client';

const globalForPrisma = globalThis;

function createPrismaClient() {
	const connectionString = process.env.DATABASE_URL;
	
	if (!connectionString) {
		throw new Error('DATABASE_URL environment variable is not set');
	}
	
	const adapter = new PrismaPg({ connectionString });
	
	return new PrismaClient({
		adapter,
		log: process.env.NODE_ENV === 'development' 
			? ['error', 'warn'] 
			: ['error'],
	});
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma;
}

export default prisma;

/**
 * 生成 UUID
 */
export function generateId() {
	return crypto.randomUUID();
}
