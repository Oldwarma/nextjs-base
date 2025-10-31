'use client';
import { useTranslations } from 'next-intl';
import Prism from '@/components/motion/prism-bg';
import SplitText from '@/components/motion/split-text';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function Hero() {
	const t = useTranslations('home');



	return (
		<div className='flex min-h-svh flex-col items-center justify-center p-6 md:p-10'>
			<div className='w-full max-w-5xl z-10 text-center'>
				<SplitText
					text={t('title')}
					className='text-[9rem] italic tracking-[-0.05em] leading-none font-extrabold text-zinc-50 text-center'
					delay={100}
					duration={1}
					ease='power3.out'
					splitType='words'
					from={{ opacity: 0, y: 40 }}
					to={{ opacity: 1, y: 0 }}
					threshold={0.2}
					rootMargin='-100px'
					textAlign='center'
					tag='h1'
				/>
				<p className='text-2xl text-zinc-100 mt-4'>{t('description')}</p>
			</div>
			<div className='absolute top-0 left-0 w-full h-full'>
				<Prism
					animationType='3drotate'
					timeScale={0.5}
					height={3.5}
					baseWidth={5.5}
					scale={3.6}
					hueShift={0}
					colorFrequency={1}
					noise={0}
					glow={1}
				/>
			</div>
		</div>
	);
}
