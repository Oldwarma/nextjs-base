import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import Logo from '@/components/common/logo';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
	RiHome3Fill,
	RiBook2Fill,
	RiDashboardFill,
	RiGithubFill
} from 'react-icons/ri';

export default function Navbar() {
	const t = useTranslations();
	const navItems = [
		{
			href: '/',
			iconFilled: RiHome3Fill,
			label: t('nav.home'),
		},
		{
			href: '#code-showcase',
			iconFilled: RiHome3Fill,
			label: t('nav.codeShowcase'),
		},
		{
			href: '#features',
			iconFilled: RiHome3Fill,
			label: t('nav.features'),
		},
		{
			href: '/docs',
			iconFilled: RiBook2Fill,
			label: t('nav.docs'),
		},
		{
			href: '/admin',
			iconFilled: RiDashboardFill,
			label: t('nav.admin'),
		},
	];

	return (
		<nav className='fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl h-14 mx-auto z-50 flex items-center justify-between bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/10 border border-zinc-200 dark:border-zinc-500/50 px-2 rounded-full'>
			<Link
				className='ml-4 flex items-center'
				href='/'
			>
				<Logo className="h-6 w-auto" />
			</Link>
			
			<div className='flex items-center justify-center gap-6'>
				{navItems.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
					>
						{item.label}
					</Link>
				))}
			</div>

			<div className='w-1/5 flex items-center justify-end gap-2 pr-4'>
				<LanguageSwitcher
					iconClassName='text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all'
					side='bottom'
				/>
				<AnimatedThemeToggler duration={600} className="size-8 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer" />
			</div>
		</nav>
	);
}
