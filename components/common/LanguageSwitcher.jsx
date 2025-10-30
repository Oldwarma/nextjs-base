'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { locales, localeNames } from '@/i18n/config';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Check, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
export default function LanguageSwitcher({ iconClassName = '', side = 'right' }) {
	const locale = useLocale();
	const router = useRouter();
	const pathname = usePathname();

	const handleChange = (newLocale) => {
		// 获取当前路径，移除语言前缀
		const pathWithoutLocale = pathname.replace(`/${locale}`, '');
		// 构建新的路径
		const newPath = `/${newLocale}${pathWithoutLocale}`;
		router.push(newPath);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button className='flex flex-col items-center justify-center cursor-pointer group outline-none'>
					<Languages className={cn('size-6 text-zinc-500 group-hover:text-zinc-300 transition-colors', iconClassName)} />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				side={side}
				align='center'
				sideOffset={24}
				className='bg-[#1a1a1d] border-zinc-800 min-w-[100px]'
			>
				{locales.map((loc) => (
					<DropdownMenuItem
						key={loc}
						onClick={() => handleChange(loc)}
						className={`flex items-center gap-2 p-2 cursor-pointer ${
							locale === loc
								? 'bg-zinc-800/50 text-white focus:text-white focus:bg-zinc-800'
								: ' text-zinc-400 focus:text-white focus:bg-zinc-800'
						}`}
					>
						<span className='text-base'>{localeNames[loc].flag}</span>
						<span className='flex-1 text-sm'>{localeNames[loc].name}</span>
						{locale === loc && <Check className='size-3.5 text-cyan-400' />}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
