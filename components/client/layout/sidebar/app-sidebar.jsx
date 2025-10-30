'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Bell, Menu } from 'lucide-react';
import LanguageSwitcherSidebar from '@/components/common/LanguageSwitcherSidebar';
import { UserMenu } from './user-menu';
import { NavMenu } from './nav-menu';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function AppSidebar({ user }) {
	const router = useRouter();
	const t = useTranslations();
	return (
		<aside className='w-[78px] min-w-[78px] h-screen bg-[#0f0f12] flex flex-col items-center justify-between'>
			{/* Logo Section - Top */}
			<div className='flex items-start justify-start py-8 h-1/6'>
				<Link
					href='/'
					className='flex items-center justify-center'
				>
					<div className='size-6 flex items-center justify-center'>
						<Image
							src='/logo.png'
							alt='Jimeng Logo'
							width={40}
							height={40}
							className='object-contain'
						/>
					</div>
		</Link>
		</div>

		{/* Navigation Menu - Middle */}
		<NavMenu />

		{/* Bottom Section */}
			<div className='w-full flex flex-col items-center justify-end gap-y-5 h-1/3 pb-10'>
				{/* User Avatar with Menu or Login Button */}
				{user ? (
					<UserMenu user={user} />
				) : (
					<button
						onClick={() => router.push('/login')}
						className='flex items-center justify-center group bg-zinc-500/10 rounded-md p-2'
					>
						<span className='text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors'>{t('auth.login')}</span>
					</button>
				)}

				{/* Notifications */}
				{user && (
					<Link
						href='/notifications'
						className='flex items-center justify-center group'
					>
						<Bell className='size-5 text-zinc-500 group-hover:text-zinc-300 transition-colors' />
					</Link>
				)}

				<LanguageSwitcherSidebar />

				{/* Menu */}
				<Link
					href='/menu'
					className='flex items-center justify-center group'
				>
					<Menu className='size-5 text-zinc-500 group-hover:text-zinc-300 transition-colors' />
				</Link>
			</div>
		</aside>
	);
}
