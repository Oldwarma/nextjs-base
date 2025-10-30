/**
 * i18n 配置文件
 */

// 支持的语言列表
export const locales = ['en', 'zh', 'ja'];

// 默认语言
export const defaultLocale = 'en';

// 语言名称（用于语言切换器）
export const localeNames = {
	en: {
		name: 'English',
		shortName: 'EN',
		flag: '🇺🇸',
	},
	zh: { name: '简体中文', shortName: 'CN', flag: '🇨🇳' },
	ja: { name: '日本語', shortName: 'JP', flag: '🇯🇵' },
};

// 语言方向（从左到右 ltr / 从右到左 rtl）
export const localeDirections = {
	en: 'ltr',
	zh: 'ltr',
	ja: 'ltr',
};
