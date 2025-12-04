/**
 * i18n 配置文件
 */

// 支持的语言列表
export const locales = ['en', 'zh'];

// 默认语言
export const defaultLocale = 'en';

// 语言名称（用于语言切换器）
// flagCode 使用 ISO 3166-1 alpha-2 国家代码（小写），对应 flag-icons 的类名
export const localeNames = {
	en: {
		name: 'English',
		shortName: 'EN',
		flagCode: 'us', // 美国国旗
	},
	zh: {
		name: '简体中文',
		shortName: 'CN',
		flagCode: 'cn', // 中国国旗
	}
};

// 语言方向（从左到右 ltr / 从右到左 rtl）
export const localeDirections = {
	en: 'ltr',
	zh: 'ltr'
};
