'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Avatar, Dropdown, Breadcrumb, Button, Spin } from 'antd';
import { RightOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';

// 动态导入 ProLayout，只在客户端渲染，避免 hydration 不匹配
const ProLayout = dynamic(
	() => import('@ant-design/pro-components').then((mod) => mod.ProLayout),
	{ ssr: false }
);
import * as Icons from '@ant-design/icons';
import { UserOutlined, HomeOutlined, LogoutOutlined, LinkOutlined } from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOutAction } from '@/app/(client)/actions/auth';
import { getMenuListAction } from '@/app/(admin)/actions/rbac/admin-menus';

/**
 * 管理后台布局组件 - 使用 Pro Components
 */
export default function AdminLayout({ children, user }) {
	const [pathname, setPathname] = useState(usePathname());
	const [collapsed, setCollapsed] = useState(false);
	const [menuData, setMenuData] = useState([]);
	const [menuLoading, setMenuLoading] = useState(true);
	const router = useRouter();

	// 加载菜单数据
	useEffect(() => {
		const loadMenus = async () => {
			setMenuLoading(true);
			try {
				const result = await getMenuListAction({});
				if (result.success) {
					setMenuData(result.data || []);
				} else {
					console.error('Failed to load menus:', result.error);
				}
			} catch (error) {
				console.error('Error loading menus:', error);
			} finally {
				setMenuLoading(false);
			}
		};

		loadMenus();
	}, []);

	// 登出处理函数
	const handleLogout = async () => {
		const result = await signOutAction();
		if (result.success) {
			router.push('/en/login');
		}
	};

	// 将数据库菜单转换为 ProLayout 路由配置
	const convertMenuToRoute = (menu) => {
		// 获取图标组件
		const IconComponent = menu.icon && Icons[menu.icon] ? Icons[menu.icon] : null;

		// 使用 url 字段作为跳转路径
		const menuPath = menu.url || `/admin/${menu.id}`; // ✅ 使用 id（UUID）

		const route = {
			path: menuPath,
			name: menu.name,
			key: menu.id, // ✅ 使用 id（UUID）作为唯一标识
			icon: IconComponent ? <IconComponent /> : null,
		};

		// 递归处理子菜单
		if (menu.children && menu.children.length > 0) {
			route.routes = menu.children
				.filter(child => child.enable && !child.hidden) // ✅ 使用 enable（不是 enabled）
				.map(convertMenuToRoute);
		}

		return route;
	};

	// 路由配置（从数据库菜单生成）
	const route = useMemo(() => {
		if (!menuData || menuData.length === 0) {
			return {
				path: '/admin',
				routes: [],
			};
		}

		const routes = menuData
			.filter(menu => menu.enable && !menu.hidden) // ✅ 使用 enable（不是 enabled）
			.map(convertMenuToRoute);

		return {
			path: '/admin',
			routes,
		};
	}, [menuData]);

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

	// 根据当前路径从菜单数据中查找菜单名称
	const findMenuByPath = (menus, path) => {
		for (const menu of menus) {
			const menuPath = menu.url || `/admin/${menu.id}`; // ✅ 使用 id（UUID）
			if (menuPath === path) {
				return menu;
			}
			if (menu.children && menu.children.length > 0) {
				const found = findMenuByPath(menu.children, path);
				if (found) return found;
			}
		}
		return null;
	};

	// 根据当前路径生成面包屑
	const breadcrumbItems = useMemo(() => {
		const items = [];

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

		// 从菜单数据中查找当前页面的名称
		if (pathname && menuData.length > 0) {
			const currentMenu = findMenuByPath(menuData, pathname);
			const currentPageName = currentMenu?.name || pathname.split('/').pop() || '';
			
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
	}, [pathname, menuData]);

		// 如果菜单正在加载，显示加载指示器
	if (menuLoading) {
		return (
			<div style={{ 
				display: 'flex', 
				justifyContent: 'center', 
				alignItems: 'center', 
				height: '100vh',
				background: '#f5f5f5'
			}}>
				<Spin size="large" spinning={true} tip="">
					<div style={{ minHeight: 100 }} />
				</Spin>
			</div>
		);
	}

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
		menuItemRender={(item, dom) => {
			// item.path 已经是数据库中的 url 字段（在 convertMenuToRoute 中设置）
			const linkPath = item.path || '/admin';
			
			// 检查是否是外部链接（以 http:// 或 https:// 开头）
			const isExternalLink = linkPath.startsWith('http://') || linkPath.startsWith('https://');
			
			if (isExternalLink) {
				// 外部链接：在新标签页打开，添加外部链接图标
				return (
					<a
						href={linkPath}
						target="_blank"
						rel="noopener noreferrer"
						style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
					>
						{dom}
						<LinkOutlined style={{ fontSize: '12px', opacity: 0.65 }} />
					</a>
				);
			} else {
				// 内部链接：使用 Next.js Link
				return (
					<Link
						href={linkPath}
						onClick={() => setPathname(linkPath)}
					>
						{dom}
					</Link>
				);
			}
		}}
			avatarProps={{
				src: user?.image,
				icon: <UserOutlined />,
				size: 'default',
				title: user?.name || 'Admin',
				render: (_, dom) => (
					<Dropdown menu={{ items: userMenuItems }} placement='bottomRight'>
						<div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
							{dom}
							{/* <span style={{ fontWeight: 500 }}>{user?.name || 'Admin'}</span> */}
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

