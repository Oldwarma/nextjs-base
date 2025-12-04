'use client';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Github, Sparkles } from 'lucide-react';
import Aurora from '@/components/motion/aurora';

export default function CTASection() {
	const t = useTranslations('home.cta');
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === 'dark';

	// 浅色模式使用更明亮纯净的颜色
	const lightColors = ['#60a5fa', '#34d399', '#a78bfa'];
	const darkColors = ['#033fc3', '#3ec7ce', '#b88888'];

	return (
		<section className='py-24 overflow-hidden'>
			<div className='container mx-auto px-4'>
				{/* CTA Card */}
				<div className='relative max-w-6xl mx-auto rounded-3xl overflow-hidden border bg-white dark:bg-black border-zinc-200 dark:border-zinc-800'>
					{/* Aurora Background - z-0 base layer */}
					<div className='absolute inset-0 z-0'>
						<Aurora
							colorStops={isDark ? darkColors : lightColors}
							speed={1.0}
							amplitude={isDark ? 1.2 : 1.0}
							blend={isDark ? 0.5 : 0.7}
						/>
					</div>

					{/* Overlay for better text readability - z-10 */}
					<div className='absolute inset-0 bg-gradient-to-b from-white/70 via-white/50 to-white/70 dark:from-zinc-950/10 dark:via-transparent dark:to-zinc-950/10 z-10' />

					{/* Content - z-20 on top */}
					<div className='relative px-8 py-16 md:px-16 md:py-20 text-center z-20'>
						{/* Badge */}
						<div className='inline-flex items-center gap-2 rounded-full border border-zinc-900/20 dark:border-white/20 bg-zinc-900/10 dark:bg-white/10 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-zinc-800 dark:text-white mb-8'>
							<Sparkles size={14} />
							Open Source & Free
						</div>

						{/* Title */}
						<h2 className='text-3xl md:text-5xl font-bold mb-6 text-zinc-900 dark:text-white'>{t('title')}</h2>

						{/* Subtitle */}
						<p className='text-lg text-zinc-700 dark:text-zinc-300 mb-10'>{t('subtitle')}</p>

						{/* Buttons */}
						<div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
							<Button
								size='lg'
								className='h-14 px-8 text-lg rounded-full bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 shadow-xl shadow-zinc-900/20 dark:shadow-white/20 hover:shadow-zinc-900/30 dark:hover:shadow-white/30 transition-all duration-300'
								asChild
							>
								<Link href='/docs/getting-started'>
									{t('start')}
									<ArrowRight className='ml-2 h-5 w-5' />
								</Link>
							</Button>
							<Button
								size='lg'
								variant='outline'
								className='h-14 px-8 text-lg rounded-full bg-zinc-900/10 dark:bg-white/10 backdrop-blur-sm border-zinc-900/20 dark:border-white/20 hover:border-zinc-900/40 dark:hover:border-white/40 hover:bg-zinc-900/20 dark:hover:bg-white/20 text-zinc-900 dark:text-white'
								asChild
							>
								<Link
									href='https://github.com/huglemon/nextjs-base'
									target='_blank'
								>
									<Github className='mr-2 h-5 w-5' />
									GitHub
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
