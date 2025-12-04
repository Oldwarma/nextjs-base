'use client';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import Prism from '@/components/motion/prism-bg';
import DecryptedText from '@/components/motion/decrypted-text';
import { Button } from '@/components/ui/button';
import { ArrowRight, Github, Book, Terminal } from 'lucide-react';
import Link from 'next/link';
import {
	SiNextdotjs,
	SiPrisma,
	SiPostgresql,
	SiAntdesign,
	SiReact,
	SiTypescript,
	SiTailwindcss,
	SiZod,
	SiVercel,
	SiDocker,
	SiGit,
	SiEslint,
} from 'react-icons/si';

// 技术栈图标列表 - 增加更多图标用于滚动
const technologies = [
	{ name: 'Next.js 16', icon: SiNextdotjs },
	{ name: 'React 19', icon: SiReact },
	{ name: 'PostgreSQL', icon: SiPostgresql },
	{ name: 'Prisma', icon: SiPrisma },
	{ name: 'TypeScript', icon: SiTypescript },
	{ name: 'Tailwind CSS', icon: SiTailwindcss },
	{ name: 'Ant Design', icon: SiAntdesign },
	{ name: 'Zod', icon: SiZod },
	{ name: 'Vercel', icon: SiVercel },
	{ name: 'Docker', icon: SiDocker },
	{ name: 'Git', icon: SiGit },
	{ name: 'ESLint', icon: SiEslint },
];

// Marquee 滚动组件
function TechMarquee() {
	// 复制两份用于无缝滚动
	const items = [...technologies, ...technologies];

	return (
		<div className='w-full overflow-hidden py-6'>
			<div className='flex animate-marquee'>
				{items.map((tech, index) => (
					<div
						key={`${tech.name}-${index}`}
						className='flex flex-col items-center justify-center gap-2 mx-8 min-w-[80px] group'
					>
						<tech.icon className='text-3xl md:text-4xl text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white group-hover:scale-110 transition-all duration-300' />
						<span className='text-xs font-medium text-zinc-500 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors duration-300 whitespace-nowrap'>
							{tech.name}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

export default function Hero() {
	const t = useTranslations('home');
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === 'dark';

	return (
		<div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden'>
			{/* Background Effect - Prism WebGL Canvas */}
			<div className='absolute inset-0 w-full h-full z-0'>
				<Prism
					animationType='3drotate'
					timeScale={0.5}
					height={3.5}
					baseWidth={5.5}
					scale={3.6}
					hueShift={isDark ? 0 : 0.3}
					colorFrequency={1}
					noise={0}
					glow={isDark ? 1 : 0.6}
					bloom={isDark ? 1 : 0.5}
				/>
			</div>
			
			{/* Light mode overlay for softer effect */}
			<div className='absolute inset-0 z-1 bg-linear-to-b from-white/40 via-white/20 to-white/60 dark:from-transparent dark:via-transparent dark:to-transparent pointer-events-none' />

			{/* Main Content - Above the Prism background */}
			<div className='w-full max-w-5xl z-10 text-center flex flex-col items-center gap-8 pt-24 pb-12 px-6 relative'>
				{/* Terminal Badge */}
				<div className='inline-flex items-center gap-2 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md px-4 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 mb-6'>
					<Terminal className='w-4 h-4 text-primary' />
					<span className='text-zinc-600 dark:text-zinc-400'>
						<DecryptedText
							text='System Status: Operational'
							speed={80}
						/>
					</span>
					<span className='w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-2' />
				</div>

				{/* Main Title */}
				<div className='relative'>
					{/* Glow behind text */}
					<div className='absolute -inset-x-20 -inset-y-10 bg-linear-to-r from-primary/20 via-purple-500/20 to-blue-500/20 blur-3xl opacity-30 rounded-full' />
					<motion.h1
						className='text-6xl md:text-7xl tracking-tighter leading-tight font-medium text-zinc-900 dark:text-white text-center drop-shadow-2xl relative'
						initial={{ opacity: 0, y: 60 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
					>
						{t('title').split('\n').map((line, i) => (
							<motion.span
								key={i}
								className='block'
								initial={{ opacity: 0, y: 40 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ 
									duration: 0.8, 
									delay: i * 0.15,
									ease: [0.25, 0.4, 0.25, 1]
								}}
							>
								{line}
							</motion.span>
						))}
					</motion.h1>
				</div>

				{/* Description */}
				<p className='text-xl md:text-2xl text-zinc-600 dark:text-zinc-300 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-backwards'>
					{t('description')}
				</p>

				{/* Buttons */}
				<div className='flex flex-col sm:flex-row items-center gap-6 mt-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700 fill-mode-backwards'>
					<Button
						size='lg'
						className='h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all duration-300'
						asChild
					>
						<Link href='/docs/getting-started'>
							{t('getStarted')}
							<ArrowRight className='h-5 w-5' />
						</Link>
					</Button>
					<Button
						size='lg'
						variant='outline'
						className='h-14 px-8 text-lg rounded-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 hover:border-zinc-400 dark:hover:border-zinc-600 hover:scale-105 transition-all duration-300'
						asChild
					>
						<Link href='/docs'>
							<Book className='h-5 w-5' />
							{t('documentation')}
						</Link>
					</Button>
					<Button
						size='lg'
						variant='ghost'
						className='h-14 px-8 text-lg rounded-full ring-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-transparent'
						asChild
					>
						<Link
							href='https://github.com/huglemon/nextjs-base'
							target='_blank'
						>
							<Github className='h-5 w-5' />
							GitHub
						</Link>
					</Button>
				</div>
			</div>

			{/* Tech Stack Bar - Frosted Glass at Bottom */}
			<div className='absolute bottom-0 left-0 right-0 z-20'>
				<div className='bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border-t border-zinc-200/50 dark:border-zinc-800/50'>
					<TechMarquee />
				</div>
			</div>
		</div>
	);
}
