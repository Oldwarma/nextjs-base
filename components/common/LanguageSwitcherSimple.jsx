'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { locales, localeNames } from '@/i18n/config';

/**
 * 简单的语言切换器 - 使用链接而非下拉菜单
 */
export default function LanguageSwitcherSimple() {
	const locale = useLocale();
	const pathname = usePathname();

	// 获取当前路径（移除语言前缀）
	const getLocalizedPath = (newLocale) => {
		const pathWithoutLocale = pathname.replace(`/${locale}`, '');
		return `/${newLocale}${pathWithoutLocale}`;
	};

	return (
		<div className="flex items-center gap-2">
			{locales.map((loc) => (
				<Link
					key={loc}
					href={getLocalizedPath(loc)}
					className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
						locale === loc
							? 'bg-blue-600 text-white'
							: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
					}`}
				>
					{localeNames[loc]}
				</Link>
			))}
		</div>
	);
}

