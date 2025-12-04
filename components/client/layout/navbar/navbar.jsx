'use client';

import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Logo from '@/components/common/logo';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
	RiHome3Fill,
	RiBook2Fill,
	RiDashboardFill,
	RiMenuFill,
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
		<nav className='fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 w-[94%] sm:w-[90%] max-w-5xl h-14 mx-auto z-50 flex items-center justify-between bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/10 border border-zinc-200 dark:border-zinc-500/50 px-3 sm:px-4 rounded-2xl'>
			<Link
				className='ml-1 sm:ml-2 flex items-center'
				href='/'
			>
				<Logo className="h-6 w-auto" />
			</Link>
			
			<div className='hidden md:flex items-center justify-center gap-6'>
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

			<div className='flex items-center justify-end gap-2 pr-1 sm:pr-2'>
				<div className='hidden md:flex items-center gap-2'>
					<LanguageSwitcher
						iconClassName='text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all'
						side='bottom'
					/>
					<AnimatedThemeToggler duration={600} className="size-8 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer" />
				</div>

				<Sheet>
					<SheetTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							className="md:hidden border border-zinc-200/80 dark:border-zinc-700/80 bg-white/70 dark:bg-zinc-900/70 hover:bg-white dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300"
							aria-label="Toggle navigation"
						>
							<RiMenuFill className="size-5" />
						</Button>
					</SheetTrigger>
					<SheetContent side="right" className="bg-background/95 backdrop-blur-xl border-l border-zinc-200/80 dark:border-zinc-800/80 px-4 pt-4 pb-6">
						<SheetHeader className="sr-only">
							<SheetTitle>Navigation Menu</SheetTitle>
						</SheetHeader>
						<div className="flex items-center justify-between pr-10">
							<Link href="/" className="flex items-center gap-2">
								<Logo className="h-7 w-auto" />
							</Link>
						</div>
						<div className="flex flex-col gap-2 pt-4">
							{navItems.map((item) => (
								<SheetClose asChild key={item.href}>
									<Link
										href={item.href}
										className="flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
									>
										<item.iconFilled className="size-5 text-zinc-500" />
										{item.label}
									</Link>
								</SheetClose>
							))}
						</div>
						<div className="mt-auto flex items-center gap-3 px-1 pb-3 pt-4">
							<LanguageSwitcher
								iconClassName='text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all'
								side='top'
							/>
							<AnimatedThemeToggler duration={600} className="size-9 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer" />
						</div>
					</SheetContent>
				</Sheet>
			</div>
		</nav>
	);
}
