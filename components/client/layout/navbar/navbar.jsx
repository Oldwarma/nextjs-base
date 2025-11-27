import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
export default function Navbar() {
	const t = useTranslations();
	const navItems = [
		{
			href: '/',
			iconFilled: RiHome3Fill,
			label: t('nav.home'),
		},
		{
			href: '/generate/image',
			iconFilled: RiImageCircleAiFill,
			label: t('nav.image'),
		},
		{
			href: '/generate/video',
			iconFilled: RiVideoAiFill,
			label: t('nav.video'),
		},
		{
			href: '/generate/audio',
			iconFilled: RiVoiceAiFill,
			label: t('nav.audio'),
		},
	];
	return (
		<nav className='fixed top-10 left-1/2 -translate-x-1/2 w-3xl h-14 mx-auto z-50 flex items-center justify-between bg-black/5 backdrop-blur-sm shadow-xs border border-white/10 p-2 rounded-full'>
			<Link
				className='ml-4'
				href='/'
			>
				<Image
					src='/logo.png'
					alt='NextJS Base Logo'
					width={32}
					height={32}
				/>
			</Link>
			<div className='w-1/2 flex items-center justify-between gap-2'>
				{navItems.map((item) => (
					<Link
						key={item.href}
						href={item.href}
					>
						<span className={`text-zinc-400 hover:text-white transition-colors ${item.href === '/' && 'text-white!'}`}>{item.label}</span>
					</Link>
				))}
			</div>
			<div className='flex items-center justify-center gap-2'>
				<LanguageSwitcher
					iconClassName='text-zinc-400 hover:text-white transition-all'
					side='bottom'
				/>
				<Button className='flex items-center justify-center group bg-white h-full rounded-full'>
					<span className='text-zinc-500 group-hover:text-zinc-300 transition-colors'>{t('nav.getstarted')}</span>
				</Button>
			</div>
		</nav>
	);
}
