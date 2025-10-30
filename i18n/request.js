import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

// 支持的语言列表
export const locales = ['en', 'zh', 'ja'];

// 默认语言
export const defaultLocale = 'en';

export default getRequestConfig(async ({ requestLocale }) => {
	// 获取请求的语言，如果没有则使用默认语言
	let locale = await requestLocale;

	// 验证语言是否支持
	if (!locale || !locales.includes(locale)) {
		locale = defaultLocale;
	}

	return {
		locale,
		messages: (await import(`./messages/${locale}.json`)).default,
		timeZone: 'UTC',
		now: new Date(),
	};
});
