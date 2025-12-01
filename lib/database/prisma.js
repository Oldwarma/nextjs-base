/**
 * Prisma 客户端单例
 */

import { PrismaClient } from '@/lib/generated/prisma';

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
	log: process.env.NODE_ENV === 'development' 
		? ['error', 'warn'] 
		: ['error'],
});

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
