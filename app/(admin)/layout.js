import { Geist, Geist_Mono } from 'next/font/google';
import '../globals.css';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata = {
	title: 'Admin Panel - Jimeng SaaS',
	description: 'Administration panel for Jimeng SaaS',
};

/**
 * Admin Layout - 不使用多语言
 * 管理后台始终使用英文界面
 */
export default function AdminLayout({ children }) {
	return (
		<html lang="en">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				{/* 管理后台内容 */}
				{children}
			</body>
		</html>
	);
}
