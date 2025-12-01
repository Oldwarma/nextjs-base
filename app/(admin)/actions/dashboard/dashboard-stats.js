'use server';

/**
 * Dashboard 统计数据 Server Action
 * 使用 Prisma 直接操作 PostgreSQL
 */

import { prisma } from '@/lib/database/prisma';
import { wrapAction } from '@/lib/core/action-wrapper';

/**
 * 获取 Dashboard 统计数据
 */
export const getDashboardStats = wrapAction('sysQueryDashboard', async (_, ctx) => {
	// 并行获取所有统计数据
	const [userCount, assetCount, logCount] = await Promise.all([
		prisma.user.count(),
		prisma.asset.count(),
		prisma.actionLog.count(),
	]);

	// 生成虚拟访问数据
	const baseVisits = 12580;
	const randomFactor = Math.floor(Math.random() * 1000);
	const visitCount = baseVisits + randomFactor;

	// 生成趋势数据
	const visitTrend = generateVisitTrend();
	const userTrend = generateUserTrend(userCount);

	return {
		success: true,
		data: {
			stats: {
				visitCount,
				userCount,
				assetCount,
				logCount,
			},
			trends: {
				visitTrend,
				userTrend,
			},
		},
	};
}, { skipLog: true });

/**
 * 生成最近7天的访问趋势数据
 */
function generateVisitTrend() {
	const days = [];
	const today = new Date();

	for (let i = 6; i >= 0; i--) {
		const date = new Date(today);
		date.setDate(date.getDate() - i);

		const baseValue = 1200;
		const variance = Math.floor(Math.random() * 800) - 400;
		const value = Math.max(500, baseValue + variance);

		days.push({
			date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
			value,
		});
	}

	return days;
}

/**
 * 生成最近7天的用户增长趋势数据
 */
function generateUserTrend(currentTotal) {
	const days = [];
	const today = new Date();

	let runningTotal = currentTotal;
	const dailyGrowth = [];

	for (let i = 0; i < 7; i++) {
		const growth = Math.floor(Math.random() * 7) + 2;
		dailyGrowth.unshift(growth);
		runningTotal -= growth;
	}

	let accumulated = Math.max(0, runningTotal);
	for (let i = 0; i < 7; i++) {
		const date = new Date(today);
		date.setDate(date.getDate() - (6 - i));

		accumulated += dailyGrowth[i];

		days.push({
			date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
			value: accumulated,
			growth: dailyGrowth[i],
		});
	}

	return days;
}
