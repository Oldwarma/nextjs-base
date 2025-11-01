'use client';

import { ProCard, StatisticCard } from '@ant-design/pro-components';
import {
	UserOutlined,
	CreditCardOutlined,
	DollarOutlined,
	RiseOutlined,
} from '@ant-design/icons';

const { Statistic } = StatisticCard;

export default function AdminDashboard() {
	return (
		<div>
			{/* 页面标题 */}
			<div style={{ marginBottom: 24 }}>
				<h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>
					Dashboard Overview
				</h1>
				<p style={{ color: '#666', marginTop: 8 }}>
					Welcome to Jimeng SaaS Admin Panel
				</p>
			</div>

			{/* 统计卡片组 */}
			<StatisticCard.Group direction='row' gutter={16}>
				<StatisticCard
					statistic={{
						title: 'Total Users',
						value: 1128,
						icon: (
							<div
								style={{
									width: 48,
									height: 48,
									borderRadius: 8,
									background: '#e6f7ff',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<UserOutlined style={{ fontSize: 24, color: '#1890ff' }} />
							</div>
						),
						description: (
							<Statistic
								title='Weekly Growth'
								value='12.8%'
								trend='up'
								style={{ marginTop: 16 }}
							/>
						),
					}}
					style={{ marginBottom: 16 }}
				/>
				<StatisticCard
					statistic={{
						title: 'Active Packages',
						value: 93,
						icon: (
							<div
								style={{
									width: 48,
									height: 48,
									borderRadius: 8,
									background: '#f0f5ff',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<CreditCardOutlined style={{ fontSize: 24, color: '#597ef7' }} />
							</div>
						),
						description: (
							<Statistic
								title='Conversion Rate'
								value='76.2%'
								trend='up'
								style={{ marginTop: 16 }}
							/>
						),
					}}
					style={{ marginBottom: 16 }}
				/>
				<StatisticCard
					statistic={{
						title: 'Total Revenue',
						value: 9280.5,
						precision: 2,
						prefix: '$',
						icon: (
							<div
								style={{
									width: 48,
									height: 48,
									borderRadius: 8,
									background: '#fff2e8',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<DollarOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
							</div>
						),
						description: (
							<Statistic
								title='Monthly Growth'
								value='23.5%'
								trend='up'
								style={{ marginTop: 16 }}
							/>
						),
					}}
					style={{ marginBottom: 16 }}
				/>
				<StatisticCard
					statistic={{
						title: 'Growth Rate',
						value: 85.2,
						suffix: '%',
						icon: (
							<div
								style={{
									width: 48,
									height: 48,
									borderRadius: 8,
									background: '#f6ffed',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<RiseOutlined style={{ fontSize: 24, color: '#52c41a' }} />
							</div>
						),
						description: (
							<Statistic
								title='vs Last Month'
								value='11.28%'
								trend='up'
								style={{ marginTop: 16 }}
							/>
						),
					}}
					style={{ marginBottom: 16 }}
				/>
			</StatisticCard.Group>

			{/* 详细信息卡片 */}
			<ProCard
				title='Quick Actions'
				style={{ marginTop: 16 }}
				extra='Last 7 days'
				headerBordered
			>
				<div style={{ padding: '20px 0' }}>
					<p style={{ fontSize: 16, color: '#666', marginBottom: 16 }}>
						Use the sidebar to navigate through different management sections:
					</p>
					<ul style={{ color: '#999', lineHeight: 2 }}>
						<li>👥 <strong>User Management</strong> - View and manage all users</li>
						<li>🎁 <strong>Packages</strong> - Configure subscription packages</li>
						<li>💳 <strong>Credits</strong> - Manage user credits and transactions</li>
						<li>📊 <strong>Usage Statistics</strong> - Monitor platform usage</li>
						<li>⚙️ <strong>Settings</strong> - Configure system settings</li>
					</ul>
			</div>
			</ProCard>
		</div>
	);
}

