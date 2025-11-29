import { Poppins } from 'next/font/google';
import { checkBackendAccess } from '@/lib/auth/admin-auth';
import { Toaster } from '@/components/ui/sonner';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import AdminLayout from '@/components/admin/admin-layout';
import AntdConfigProvider from '@/components/admin/antd-config-provider';
import '../globals.css';
import './admin-styles.css';

// 使用 Google Fonts Poppins 字体
const poppins = Poppins({
	subsets: ['latin'],
	weight: ['400', '500', '600', '700', '800', '900'],
	variable: '--font-poppins',
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
			<body className={`${poppins.variable} antialiased`}>
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
