import localFont from 'next/font/local';
import { checkAdmin } from '@/lib/admin-auth';
import { Toaster } from '@/components/ui/sonner';
import '../globals.css';

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
	title: 'Admin Panel - Jimeng SaaS',
	description: 'Administration panel for Jimeng SaaS',
};

/**
 * Admin Layout - 不使用多语言
 * 管理后台始终使用英文界面
 * 需要管理员权限才能访问
 */
export default async function AdminLayout({ children }) {
	// 验证管理员权限
	await checkAdmin();

	return (
		<html lang='en'>
			<body className={`${harmonyOS.variable} antialiased`}>
				{/* 管理后台内容 */}
				{children}
				<Toaster />
			</body>
		</html>
	);
}
