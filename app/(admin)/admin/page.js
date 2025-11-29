'use client';

import { useEffect, useState } from 'react';
import { ProCard, StatisticCard } from '@ant-design/pro-components';
import { Card, Row, Col, Spin, Typography } from 'antd';
import {
	EyeOutlined,
	UserOutlined,
	FileImageOutlined,
	FileTextOutlined,
	TeamOutlined,
	MenuOutlined,
	PictureOutlined,
	HistoryOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getDashboardStats } from '@/app/(admin)/actions/dashboard/dashboard-stats';

// 动态导入图表组件，避免 SSR 问题
const Column = dynamic(() => import('@ant-design/charts').then(mod => mod.Column), { ssr: false });
const Area = dynamic(() => import('@ant-design/charts').then(mod => mod.Area), { ssr: false });

const { Statistic } = StatisticCard;
const { Title, Text } = Typography;

// 统计卡片组件
function StatsCard({ icon, iconColor, iconBg, title, value, growthValue, growthTrend }) {
	return (
		<Card
			style={{ borderRadius: 8, height: '100%' }}
			styles={{ body: { padding: 20 } }}
		>
			<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
				<div
					style={{
						width: 64,
						height: 64,
						borderRadius: 12,
						background: iconBg,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						flexShrink: 0,
					}}
				>
					{icon}
				</div>
				<div style={{ flex: 1, minWidth: 0 }}>
					<div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 4 }}>{title}</div>
					<div style={{ fontSize: 28, fontWeight: 600, color: '#262626', lineHeight: 1.2 }}>
						{typeof value === 'number' ? value.toLocaleString() : value}
					</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
						<span style={{ fontSize: 12, color: '#8c8c8c' }}>Weekly</span>
						<span style={{ 
							fontSize: 12, 
							color: growthTrend === 'up' ? '#52c41a' : '#ff4d4f',
							fontWeight: 500,
						}}>
							{growthTrend === 'up' ? '↑' : '↓'} {growthValue}
						</span>
					</div>
				</div>
			</div>
		</Card>
	);
}

// 快捷入口卡片组件
function QuickAccessCard({ icon, title, description, href, color }) {
	return (
		<Link href={href} style={{ textDecoration: 'none' }}>
			<Card
				hoverable
				style={{ 
					height: '100%',
					borderRadius: 8,
					transition: 'all 0.3s ease',
				}}
				styles={{
					body: { 
						padding: 20,
						display: 'flex',
						alignItems: 'center',
						gap: 16,
					}
				}}
			>
				<div
					style={{
						width: 48,
						height: 48,
						borderRadius: 12,
						background: `${color}15`,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						flexShrink: 0,
					}}
				>
					{icon}
				</div>
				<div style={{ flex: 1, minWidth: 0 }}>
					<div style={{ 
						fontSize: 15, 
						fontWeight: 600, 
						color: '#262626',
						marginBottom: 4,
					}}>
						{title}
					</div>
					<div style={{ 
						fontSize: 13, 
						color: '#8c8c8c',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap',
					}}>
						{description}
					</div>
				</div>
			</Card>
		</Link>
	);
}

export default function AdminDashboard() {
	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState(null);
	const [trends, setTrends] = useState(null);

	useEffect(() => {
		loadDashboardData();
	}, []);

	async function loadDashboardData() {
		try {
			setLoading(true);
			const result = await getDashboardStats();
			if (result.success) {
				setStats(result.data.stats);
				setTrends(result.data.trends);
			}
		} catch (error) {
			console.error('Failed to load dashboard data:', error);
		} finally {
			setLoading(false);
		}
	}

	// 计算增长率（虚拟）
	const getGrowthRate = (type) => {
		const rates = {
			visit: { value: 12.5, trend: 'up' },
			user: { value: 8.2, trend: 'up' },
			asset: { value: 15.3, trend: 'up' },
			log: { value: 23.8, trend: 'up' },
		};
		return rates[type] || { value: 0, trend: 'up' };
	};

	// 柱状图配置
	const columnConfig = {
		data: trends?.visitTrend || [],
		xField: 'date',
		yField: 'value',
		color: '#667eea',
		columnStyle: {
			radius: [4, 4, 0, 0],
		},
		label: {
			position: 'top',
			style: {
				fill: '#666',
				fontSize: 11,
			},
			formatter: (datum) => datum?.value?.toLocaleString() || '',
		},
		xAxis: {
			label: {
				style: {
					fill: '#666',
					fontSize: 11,
				},
			},
		},
		yAxis: {
			label: {
				style: {
					fill: '#999',
					fontSize: 11,
				},
				formatter: (v) => v ? `${(v / 1000).toFixed(1)}k` : '0',
			},
			grid: {
				line: {
					style: {
						stroke: '#f0f0f0',
						lineDash: [4, 4],
					},
				},
			},
		},
		tooltip: {
			formatter: (datum) => ({
				name: 'Visits',
				value: datum?.value?.toLocaleString() || '0',
			}),
		},
		animation: {
			appear: {
				animation: 'wave-in',
				duration: 1000,
			},
		},
	};

	// 面积图配置
	const areaConfig = {
		data: trends?.userTrend || [],
		xField: 'date',
		yField: 'value',
		smooth: true,
		color: '#52c41a',
		areaStyle: {
			fill: 'l(270) 0:#52c41a00 1:#52c41a40',
		},
		line: {
			style: {
				stroke: '#52c41a',
				lineWidth: 2,
			},
		},
		point: {
			size: 4,
			shape: 'circle',
			style: {
				fill: '#fff',
				stroke: '#52c41a',
				lineWidth: 2,
			},
		},
		xAxis: {
			label: {
				style: {
					fill: '#666',
					fontSize: 11,
				},
			},
		},
		yAxis: {
			label: {
				style: {
					fill: '#999',
					fontSize: 11,
				},
			},
			grid: {
				line: {
					style: {
						stroke: '#f0f0f0',
						lineDash: [4, 4],
					},
				},
			},
		},
		tooltip: {
			formatter: (datum) => ({
				name: 'Users',
				value: datum?.value?.toLocaleString() || '0',
			}),
		},
		animation: {
			appear: {
				animation: 'wave-in',
				duration: 1000,
			},
		},
	};

	if (loading) {
		return (
			<div style={{ 
				display: 'flex', 
				justifyContent: 'center', 
				alignItems: 'center', 
				minHeight: 400 
			}}>
				<Spin size="large" />
			</div>
		);
	}

	return (
		<div>
			{/* 页面标题 */}
			<div style={{ marginBottom: 24 }}>
				<Title level={3} style={{ margin: 0 }}>
					Dashboard Overview
				</Title>
				<Text type="secondary">
					Welcome to NextJS Base Admin Panel - System Statistics & Quick Access
				</Text>
			</div>

			{/* 核心统计卡片 */}
			<Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
				<Col xs={24} sm={12} lg={6}>
					<StatsCard
						icon={<EyeOutlined style={{ fontSize: 28, color: '#8b5cf6' }} />}
						iconBg="#f5f3ff"
						title="Total Visits"
						value={stats?.visitCount || 0}
						growthValue={`${getGrowthRate('visit').value}%`}
						growthTrend={getGrowthRate('visit').trend}
					/>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<StatsCard
						icon={<UserOutlined style={{ fontSize: 28, color: '#10b981' }} />}
						iconBg="#ecfdf5"
						title="Total Users"
						value={stats?.userCount || 0}
						growthValue={`${getGrowthRate('user').value}%`}
						growthTrend={getGrowthRate('user').trend}
					/>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<StatsCard
						icon={<FileImageOutlined style={{ fontSize: 28, color: '#f43f5e' }} />}
						iconBg="#fff1f2"
						title="Total Assets"
						value={stats?.assetCount || 0}
						growthValue={`${getGrowthRate('asset').value}%`}
						growthTrend={getGrowthRate('asset').trend}
					/>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<StatsCard
						icon={<FileTextOutlined style={{ fontSize: 28, color: '#0ea5e9' }} />}
						iconBg="#f0f9ff"
						title="Action Logs"
						value={stats?.logCount || 0}
						growthValue={`${getGrowthRate('log').value}%`}
						growthTrend={getGrowthRate('log').trend}
					/>
				</Col>
			</Row>

			{/* 图表区域 */}
			<Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
				<Col xs={24} lg={12}>
					<ProCard
						title="Visit Trend"
						subTitle="Last 7 days"
						headerBordered
						style={{ borderRadius: 8 }}
					>
						<div style={{ height: 280 }}>
							{trends?.visitTrend && trends.visitTrend.length > 0 && (
								<Column {...columnConfig} />
							)}
						</div>
					</ProCard>
				</Col>
				<Col xs={24} lg={12}>
					<ProCard
						title="User Growth"
						subTitle="Last 7 days"
						headerBordered
						style={{ borderRadius: 8 }}
					>
						<div style={{ height: 280 }}>
							{trends?.userTrend && trends.userTrend.length > 0 && (
								<Area {...areaConfig} />
							)}
						</div>
					</ProCard>
				</Col>
			</Row>

			{/* 快捷入口 */}
			<ProCard
				title="Quick Access"
				subTitle="Frequently used features"
				headerBordered
				style={{ borderRadius: 8 }}
			>
				<Row gutter={[16, 16]}>
					<Col xs={24} sm={12} lg={6}>
						<QuickAccessCard
							icon={<TeamOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
							title="User Management"
							description="Manage system users"
							href="/admin/rbac/users"
							color="#1890ff"
						/>
					</Col>
					<Col xs={24} sm={12} lg={6}>
						<QuickAccessCard
							icon={<MenuOutlined style={{ fontSize: 24, color: '#52c41a' }} />}
							title="Menu Management"
							description="Configure navigation menus"
							href="/admin/rbac/menus"
							color="#52c41a"
						/>
					</Col>
					<Col xs={24} sm={12} lg={6}>
						<QuickAccessCard
							icon={<PictureOutlined style={{ fontSize: 24, color: '#fa8c16' }} />}
							title="Asset Management"
							description="Manage uploaded files"
							href="/admin/system/assets"
							color="#fa8c16"
						/>
					</Col>
					<Col xs={24} sm={12} lg={6}>
						<QuickAccessCard
							icon={<HistoryOutlined style={{ fontSize: 24, color: '#722ed1' }} />}
							title="Action Logs"
							description="View operation history"
							href="/admin/system/action_logs"
							color="#722ed1"
						/>
					</Col>
				</Row>
			</ProCard>
		</div>
	);
}
