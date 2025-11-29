import { cn } from '@/lib/utils';

const Logo = ({ iconClassName, textClassName }) => {
	return (
		<div className='inline-flex justify-center items-center gap-1 md:gap-2'>
			<svg
				className={cn(iconClassName, 'w-4 h-4 md:w-6 md:h-6 lg:w-8 lg:h-8 fill-foreground')}
				viewBox='0 0 900 473'
				xmlns='http://www.w3.org/2000/svg'
			>
				<path d='M403.5 220L314.5 358.5L386 472.5L618 472.5L900 0L734.5 0L501 384.5L403.5 220Z'></path>
				<path d='M0 473L289.5 1.5L520.5 1.5L588 116L504 255.5L404.5 91.5L174.5 473L0 473Z'></path>
			</svg>
			<div className={cn(textClassName, 'text-lg md:text-2xl lg:text-3xl flex items-baseline !leading-[1]')}>
				<span>NEXT</span>
				<span className='text-[0.5em]'>.JS</span>
				<span>Base</span>
			</div>
		</div>
	);
};

export default Logo;
