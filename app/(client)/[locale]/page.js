import { useTranslations } from 'next-intl';

import LanguageSwitcher from '@/components/common/LanguageSwitcher';
export default function HomePage() {
	const t = useTranslations('home');

	return (
		<div className="flex flex-col items-center justify-center min-h-screen">
			<LanguageSwitcher />
			<h1 className="text-4xl font-bold">{t('title')}</h1>
			<p className="mt-4 text-lg text-gray-600">{t('description')}</p>
		</div>
	);
}

