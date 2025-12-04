'use client';

import Link from 'next/link';
import Logo from '@/components/common/logo';
import { useTranslations } from 'next-intl';

const Footer = () => {
	const currentYear = new Date().getFullYear();
	const t = useTranslations();
	return (
		<footer className='border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 backdrop-blur-xl'>
			<div className='max-w-6xl mx-auto px-4 py-12'>
				<div className='grid grid-cols-1 md:grid-cols-4 gap-8 mb-12'>
					<div className='col-span-1 md:col-span-2'>
						<Link
							href='/'
							className='inline-block mb-4'
						>
							<Logo />
						</Link>
						<p className='text-muted-foreground max-w-xs'>
							{t('footer.description', { name: 'NextJS base' })}
						</p>
					</div>

					<div>
						<h4 className='font-semibold mb-4'>{t('footer.resources')}</h4>
						<ul className='space-y-2 text-sm text-muted-foreground'>
							<li>
								<Link
									href='/docs'
									className='hover:text-foreground transition-colors'
								>
									{t('nav.docs')}
								</Link>
							</li>
							<li>
								<Link
									href='/docs/getting-started'
									className='hover:text-foreground transition-colors'
								>
									{t('nav.getstarted')}
								</Link>
							</li>
							<li>
								<Link
									href='/api/reference'
									className='hover:text-foreground transition-colors'
								>
									{t('nav.api')}
								</Link>
							</li>
						</ul>
					</div>

					<div>
						<h4 className='font-semibold mb-4'>{t('footer.community')}</h4>
						<ul className='space-y-2 text-sm text-muted-foreground'>
							<li>
								<Link
									href='https://github.com/huglemon/nextjs-base'
									target='_blank'
									className='hover:text-foreground transition-colors'
								>
									{t('nav.github')}
								</Link>
							</li>
							<li>
								<Link
									href='#'
									className='hover:text-foreground transition-colors'
								>
									{t('nav.discord')}
								</Link>
							</li>
							<li>
								<Link
									href='#'
									className='hover:text-foreground transition-colors'
								>
									{t('nav.twitter')}
								</Link>
							</li>
						</ul>
					</div>
				</div>

				<div className='pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4'>
					<p className='text-sm text-muted-foreground'>
						© {t('footer.copyright', { year: currentYear, name: 'NextJS Base' })}{' '}
						by{' '}
						<Link
							href='https://www.huglemon.com'
							target='_blank'
							className='hover:text-foreground transition-colors underline underline-offset-2'
						>
							Huglemon
						</Link>
					</p>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
