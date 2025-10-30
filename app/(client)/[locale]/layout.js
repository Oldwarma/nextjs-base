import { Geist, Geist_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/config';	
import '@/app/globals.css';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export function generateStaticParams() {
	return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
	const { locale } = await params;

	return {
		title: 'Jimeng SaaS - AI Image Generation',
		description: 'AI-powered image generation platform',
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
		<html lang={locale}>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
			</body>
		</html>
	);
}

