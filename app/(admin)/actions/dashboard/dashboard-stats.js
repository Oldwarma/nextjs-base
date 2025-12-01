'use server';

/**
 * Dashboard 统计数据 Server Action
 * 获取系统核心数据统计
 */

import { getCollection } from '@/lib/database/mongodb';
import { wrapAction } from '@/lib/core/action-wrapper';

/**
 * 获取 Dashboard 统计数据
 * @returns {Promise<Object>} 统计数据
 */
export const getDashboardStats = wrapAction('sysQueryDashboard', async (_, ctx) => {
	const usersCollection = await getCollection('users');
	const assetsCollection = await getCollection('assets');
	const actionLogsCollection = await getCollection('action_logs');

	// 并行获取所有统计数据
	const [userCount, assetCount, logCount] = await Promise.all([
		usersCollection.count({}),
		assetsCollection.count({}),
		actionLogsCollection.count({}),
	]);

	// 生成虚拟访问数据（基于当前时间生成一个看起来合理的数字）
	const baseVisits = 12580;
	const randomFactor = Math.floor(Math.random() * 1000);
	const visitCount = baseVisits + randomFactor;

	// 生成最近7天的访问趋势数据（虚拟）
	const visitTrend = generateVisitTrend();

	// 生成最近7天的用户增长趋势数据（虚拟）
	const userTrend = generateUserTrend(userCount);

	return {
		success: true,
		data: {
			// 核心统计数据
			stats: {
				visitCount,
				userCount,
				assetCount,
				logCount,
			},
			// 趋势数据
			trends: {
				visitTrend,
				userTrend,
			},
		},
	};
}, { skipLog: true });

/**
 * 生成最近7天的访问趋势数据（虚拟）
 */
function generateVisitTrend() {
	const days = [];
	const today = new Date();
	
	for (let i = 6; i >= 0; i--) {
		const date = new Date(today);
		date.setDate(date.getDate() - i);
		
		// 生成一个在 800-2000 之间波动的访问数
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
 * 生成最近7天的用户增长趋势数据（虚拟）
 */
function generateUserTrend(currentTotal) {
	const days = [];
	const today = new Date();
	
	// 假设每天增长 2-8 个用户
	let runningTotal = currentTotal;
	const dailyGrowth = [];
	
	for (let i = 0; i < 7; i++) {
		const growth = Math.floor(Math.random() * 7) + 2;
		dailyGrowth.unshift(growth);
		runningTotal -= growth;
	}
	
	// 重新计算累计值
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
