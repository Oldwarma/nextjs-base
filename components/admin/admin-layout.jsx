'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Avatar, Dropdown, Breadcrumb, Button } from 'antd';
import { RightOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';

// 动态导入 ProLayout，只在客户端渲染，避免 hydration 不匹配
const ProLayout = dynamic(
	() => import('@ant-design/pro-components').then((mod) => mod.ProLayout),
	{ ssr: false }
);
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
import { signOutAction } from '@/app/(client)/actions';

/**
 * 管理后台布局组件 - 使用 Pro Components
 */
export default function AdminLayout({ children, user }) {
	const [pathname, setPathname] = useState(usePathname());
	const [collapsed, setCollapsed] = useState(false);
	const router = useRouter();

	// 登出处理函数
	const handleLogout = async () => {
		const result = await signOutAction();
		if (result.success) {
			router.push('/en/login');
		}
	};

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
			onClick: handleLogout,
			danger: true,
		},
	];

	// 根据当前路径生成面包屑
	const breadcrumbItems = useMemo(() => {
		const items = [];

		// 路径映射
		const pathMap = {
			'/admin': 'Dashboard',
			'/admin/users': 'User Management',
			'/admin/packages': 'Packages',
			'/admin/credits': 'Credits',
			'/admin/usage': 'Usage Statistics',
			'/admin/settings': 'Settings',
			'/admin/example': 'Example',
		};

		// 如果不是首页，显示 Dashboard 链接
		if (pathname && pathname !== '/admin') {
			items.push({
				title: (
					<Link 
						href="/admin" 
						style={{ 
							color: '#8c8c8c',
							fontSize: '14px',
							transition: 'color 0.2s ease',
							textDecoration: 'none'
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.color = '#1890ff';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.color = '#8c8c8c';
						}}
					>
						Dashboard
					</Link>
				),
			});
		}

		// 添加当前页面的面包屑
		if (pathname) {
			const currentPageName = pathMap[pathname] || pathname.split('/').pop() || '';
			if (currentPageName) {
				items.push({
					title: (
						<span style={{ 
							color: '#262626',
							fontSize: '14px',
							fontWeight: 500
						}}>
							{currentPageName}
						</span>
					),
				});
			}
		}

		return items;
	}, [pathname]);

		return (
		<ProLayout
			title='Jimeng Admin'
			logo='/logo.png'
			layout='mix'
			splitMenus={false}
			route={route}
			location={{ pathname }}
			collapsed={collapsed}
			onCollapse={setCollapsed}
			collapseButtonRender={false}
			menuExtraRender={false}
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
				<div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
					<Link 
						href='/admin' 
						style={{ 
							display: 'flex', 
							alignItems: 'center', 
							gap: 8,
							textDecoration: 'none',
							color: 'inherit'
						}}
					>
						{logo}
						{title}
					</Link>
					<Button
						type="text"
						icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
						onClick={() => setCollapsed(!collapsed)}
						style={{
							marginLeft: 16,
							color: '#595959',
							fontSize: '16px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							width: 32,
							height: 32,
							padding: 0
						}}
					/>
					{breadcrumbItems.length > 0 && (
						<>
							<div 
								style={{ 
									width: 1, 
									height: 16, 
									background: '#e8e8e8', 
									margin: '0 16px',
									flexShrink: 0
								}} 
							/>
							<Breadcrumb
								items={breadcrumbItems}
								separator={
									<span style={{ 
										color: '#d9d9d9',
										margin: '0px',
										fontSize: '8px'
									}}>
										<RightOutlined />
									</span>
								}
								style={{ 
									flex: 'none'
								}}
							/>
						</>
					)}
				</div>
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
				// pageContainer: {
				// 	paddingBlockPageContainerContent: 24,
				// 	paddingInlinePageContainerContent: 24,
				// 	colorBgPageContainer: '#f5f5f5',
				// },
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

