'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
	RiHome3Line,
	RiHome3Fill,
	RiImageCircleAiLine,
	RiImageCircleAiFill,
	RiVideoAiLine,
	RiVideoAiFill,
	RiVoiceAiLine,
	RiVoiceAiFill,
} from 'react-icons/ri';

export function NavMenu() {
	const pathname = usePathname();
	const t = useTranslations();

	// 判断是否为当前活跃路由
	const isActive = (href) => {
		if (href === '/') {
			// 首页精确匹配
			return pathname === '/' || pathname.match(/^\/[a-z]{2}$/);
		}
		// 其他路径包含匹配
		return pathname.includes(href);
	};

	const navItems = [
		{
			href: '/',
			icon: RiHome3Line,
			iconFilled: RiHome3Fill,
			label: t('nav.home'),
		},
		{
			href: '/generate/image',
			icon: RiImageCircleAiLine,
			iconFilled: RiImageCircleAiFill,
			label: t('nav.image'),
		},
		{
			href: '/generate/video',
			icon: RiVideoAiLine,
			iconFilled: RiVideoAiFill,
			label: t('nav.video'),
		},
		{
			href: '/generate/audio',
			icon: RiVoiceAiLine,
			iconFilled: RiVoiceAiFill,
			label: t('nav.audio'),
		},
	];

		return (
			<nav className='flex w-full flex-col items-center justify-center gap-y-6 h-1/3'>
				{navItems.map((item) => {
					const Icon = item.icon;
					const IconFilled = item.iconFilled;
					const active = isActive(item.href);

					return (
						<Link
							key={item.href}
							href={item.href}
							className='flex flex-col items-center justify-center gap-1.5 group'
						>
							{active ? (
								<>
									<IconFilled className='size-6 text-white' />
									<span className='text-xs text-white'>{item.label}</span>
								</>
							) : (
								<>
									<Icon className='size-6 text-zinc-400 group-hover:hidden' />
									<IconFilled className='size-6 text-white hidden group-hover:block' />
									<span className='text-xs text-zinc-400 group-hover:text-white'>
										{item.label}
									</span>
								</>
							)}
						</Link>
					);
				})}
			</nav>
		);
	}

