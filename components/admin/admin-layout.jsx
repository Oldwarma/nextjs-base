'use client';

import { useState } from 'react';
import { ProLayout } from '@ant-design/pro-components';
import { Avatar, Dropdown } from 'antd';
import {
	DashboardOutlined,
	UserOutlined,
	CreditCardOutlined,
	GiftOutlined,
	BarChartOutlined,
	SettingOutlined,
	LogoutOutlined,
	HomeOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

/**
 * 管理后台布局组件 - 使用 Pro Components
 */
export default function AdminLayout({ children, user }) {
	const [pathname, setPathname] = useState(usePathname());
	const router = useRouter();

	// 路由配置
	const route = {
		path: '/admin',
		routes: [
			{
				path: '/admin',
				name: 'Dashboard',
				icon: <DashboardOutlined />,
			},
			{
				path: '/admin/users',
				name: 'User Management',
				icon: <UserOutlined />,
			},
			{
				path: '/admin/packages',
				name: 'Packages',
				icon: <GiftOutlined />,
			},
			{
				path: '/admin/credits',
				name: 'Credits',
				icon: <CreditCardOutlined />,
			},
			{
				path: '/admin/usage',
				name: 'Usage Statistics',
				icon: <BarChartOutlined />,
			},
			{
				path: '/admin/settings',
				name: 'Settings',
				icon: <SettingOutlined />,
			},
		],
	};

	// 用户下拉菜单
	const userMenuItems = [
		{
			key: 'home',
			icon: <HomeOutlined />,
			label: 'Go to Home',
			onClick: () => router.push('/en'),
		},
		{
			key: 'dashboard',
			icon: <UserOutlined />,
			label: 'User Dashboard',
			onClick: () => router.push('/en/dashboard'),
		},
		{
			type: 'divider',
		},
		{
			key: 'logout',
			icon: <LogoutOutlined />,
			label: 'Logout',
			onClick: () => router.push('/api/auth/sign-out'),
			danger: true,
		},
	];

	return (
		<ProLayout
			title='Jimeng Admin'
			logo='/logo.png'
			layout='mix'
			splitMenus={false}
			route={route}
			location={{ pathname }}
			fixSiderbar
			fixedHeader
			contentWidth='Fluid'
			navTheme='light'
			colorPrimary='#1890ff'
			menuItemRender={(item, dom) => (
				<Link
					href={item.path || '/admin'}
					onClick={() => setPathname(item.path || '/admin')}
				>
					{dom}
				</Link>
			)}
			avatarProps={{
				src: user?.image,
				icon: <UserOutlined />,
				size: 'default',
				title: user?.name || 'Admin',
				render: (_, dom) => (
					<Dropdown menu={{ items: userMenuItems }} placement='bottomRight'>
						<div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
							{dom}
							<span style={{ fontWeight: 500 }}>{user?.name || 'Admin'}</span>
						</div>
					</Dropdown>
				),
			}}
			actionsRender={() => []}
			headerTitleRender={(logo, title) => (
				<Link href='/admin' style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					{logo}
					{title}
				</Link>
			)}
			menuProps={{
				style: { paddingTop: 8 },
			}}
			token={{
				header: {
					colorBgHeader: '#fff',
					colorHeaderTitle: '#000',
					colorTextMenu: '#595959',
					colorTextMenuSelected: '#1890ff',
					colorBgMenuItemSelected: '#e6f4ff',
					heightLayoutHeader: 56,
				},
				sider: {
					colorMenuBackground: '#fff',
					colorTextMenu: '#595959',
					colorTextMenuSelected: '#1890ff',
					colorBgMenuItemSelected: '#e6f4ff',
					colorBgMenuItemHover: '#f5f5f5',
				},
				pageContainer: {
					paddingBlockPageContainerContent: 24,
					paddingInlinePageContainerContent: 24,
					colorBgPageContainer: '#f5f5f5',
				},
			}}
			style={{
				height: '100vh',
			}}
		>
			<div style={{ minHeight: '100%', background: '#f5f5f5' }}>
				{children}
			</div>
		</ProLayout>
	);
}

