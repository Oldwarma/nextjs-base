import localFont from 'next/font/local';
import { checkBackendAccess } from '@/lib/auth/admin-auth';
import { Toaster } from '@/components/ui/sonner';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import AdminLayout from '@/components/admin/admin-layout';
import AntdConfigProvider from '@/components/admin/antd-config-provider';
import '../globals.css';
import './admin-styles.css';

// 使用本地 HarmonyOS Sans 字体
const harmonyOS = localFont({
	src: [
		{
			path: '../../public/fonts/HarmonyOS_Sans_SC_Medium.ttf',
			weight: '500',
			style: 'normal',
		},
		{
			path: '../../public/fonts/HarmonyOS_Sans_SC_Bold.ttf',
			weight: '700',
			style: 'normal',
		},
		{
			path: '../../public/fonts/HarmonyOS_Sans_SC_Black.ttf',
			weight: '900',
			style: 'normal',
		},
	],
	variable: '--font-harmony-os',
	display: 'swap',
});

export const metadata = {
	title: 'Admin Panel - NextJS Base',
	description: 'Administration panel for NextJS Base',
};

/**
 * Admin Layout Root - 不使用多语言
 * 管理后台始终使用英文界面
 * 需要后台访问权限：admin 角色 或 user + isBackendAllowed
 */
export default async function AdminLayoutRoot({ children }) {
	// 验证后台访问权限
	const session = await checkBackendAccess();

	return (
		<html lang='en' suppressHydrationWarning>
			<body className={`${harmonyOS.variable} antialiased`}>
				<AntdRegistry>
					<AntdConfigProvider>
						<AdminLayout user={session?.user}>
							{children}
						</AdminLayout>
					</AntdConfigProvider>
				</AntdRegistry>
				<Toaster />
			</body>
		</html>
	);
}
