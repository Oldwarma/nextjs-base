import { Poppins } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/config';	
import { ThemeProvider } from '@/components/common/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import '@/app/globals.css';

// 使用 Google Fonts Poppins 字体
const poppins = Poppins({
	subsets: ['latin'],
	weight: ['400', '500', '600', '700', '800', '900'],
	variable: '--font-poppins',
	display: 'swap',
});

export function generateStaticParams() {
	return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
	const { locale } = await params;

	return {
		title: 'NextJS Base - Configuration Driven Framework',
		description: 'Build enterprise admin systems in minutes with Next.js 16 and Prisma.',
		alternates: {
			canonical: `/${locale}`,
			languages: {
				en: '/en',
				zh: '/zh',
				ja: '/ja',
			},
		},
	};
}

export default async function LocaleLayout({ children, params }) {
	const { locale } = await params;
	// 验证语言是否支持
	if (!locales.includes(locale)) {
		notFound();
	}

	// 获取翻译消息
	const messages = await getMessages();

	return (
		<html lang={locale} suppressHydrationWarning>
			<body className={`${poppins.variable} antialiased`}>
				<ThemeProvider
					attribute='class'
					defaultTheme='dark'
					enableSystem
					disableTransitionOnChange
				>
				<NextIntlClientProvider messages={messages}>
						<div className='min-h-svh bg-background text-foreground'>{children}</div>
						<Toaster />
				</NextIntlClientProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
