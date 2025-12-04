'use client';

/**
 * Page Access Guard - 页面访问权限守卫
 *
 * 工作流程：
 * 1. 先检查页面是否存在（基于配置文件）
 * 2. 如果页面不存在，放行让 Next.js 404 处理
 * 3. 如果页面存在，再进行权限检查：
 *    - admin 角色：自动通过，拥有所有页面权限
 *    - user + isBackendAllowed：通过 RBAC 检查是否有该页面的菜单权限
 * 4. 有权限则显示页面，无权限则显示 403
 *
 * 这样确保：不存在的页面显示 404，存在但无权限的页面显示 403
 */

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Result, Button, Spin } from 'antd';
import { LockOutlined, HomeOutlined } from '@ant-design/icons';
import { checkPageAccessAction } from '@/app/(admin)/actions/rbac/user-permissions';

export default function PageAccessGuard({ children }) {
	const pathname = usePathname();
	const router = useRouter();
	const [accessState, setAccessState] = useState({
		loading: true,
		hasAccess: false,
		isChecking: true,
	});

	useEffect(() => {
		const checkAccess = async () => {
			// Dashboard 首页和个人资料页始终允许访问
			if (pathname === '/admin' || pathname === '/admin/profile') {
				setAccessState({
					loading: false,
					hasAccess: true,
					isChecking: false,
				});
				return;
			}

			// 🔐 对所有 admin 子页面进行权限检查（默认拒绝）
			console.log('🔒 [PageAccessGuard] Check permission for page:', pathname);
			try {
				const result = await checkPageAccessAction(pathname);
				console.log('🔒 [PageAccessGuard] Permission check result:', result);

				if (result.success) {
					const hasAccess = result.hasAccess || result.isAdmin;
					console.log('🔒 [PageAccessGuard] Final decision:', hasAccess ? 'Allow' : '❌ Deny (403)');
					setAccessState({
						loading: false,
						hasAccess,
						isChecking: false,
					});
				} else {
					// 检查失败，为了安全起见，拒绝访问
					console.error('❌ [PageAccessGuard] Permission check failed:', result.error);
					setAccessState({
						loading: false,
						hasAccess: false,
						isChecking: false,
					});
				}
			} catch (error) {
				console.error('❌ [PageAccessGuard] Permission check error:', error);
				setAccessState({
					loading: false,
					hasAccess: false,
					isChecking: false,
				});
			}
		};

		checkAccess();
	}, [pathname]);

	// 加载中
	if (accessState.loading || accessState.isChecking) {
		return <></>;
	}

	// 无权限访问
	if (!accessState.hasAccess) {
		return (
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					minHeight: '60vh',
					padding: '24px',
				}}
			>
				<Result
					status='403'
					icon={<LockOutlined style={{ color: '#ff4d4f' }} />}
					title='Access Denied'
					subTitle="Sorry, you don't have permission to access this page."
					extra={[
						<Button
							type='primary'
							key='home'
							icon={<HomeOutlined />}
							onClick={() => router.push('/admin')}
						>
							Back to Dashboard
						</Button>,
						<Button
							key='back'
							onClick={() => router.back()}
						>
							Go Back
						</Button>,
					]}
				>
					<div
						style={{
							background: '#fafafa',
							padding: '16px',
							borderRadius: '8px',
							marginTop: '16px',
						}}
					>
						<p style={{ margin: 0, color: '#666' }}>
							<strong>Page:</strong> {pathname}
						</p>
						<p style={{ margin: '8px 0 0 0', color: '#666' }}>
							This page requires specific menu access. Please contact your administrator to add the corresponding menu to your role.
						</p>
					</div>
				</Result>
			</div>
		);
	}

	// 有权限，显示页面内容（包括 404 页面）
	return <>{children}</>;
}
