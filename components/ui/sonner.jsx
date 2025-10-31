'use client';

import {
	CircleCheckIcon,
	InfoIcon,
	Loader2Icon,
	OctagonXIcon,
	TriangleAlertIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

const Toaster = ({ ...props }) => {
	const { theme = 'dark' } = useTheme();

	return (
		<Sonner
			theme='dark'
			position='top-right'
			className='toaster group'
			icons={{
				success: <CircleCheckIcon className='size-4' />,
				info: <InfoIcon className='size-4' />,
				warning: <TriangleAlertIcon className='size-4' />,
				error: <OctagonXIcon className='size-4' />,
				loading: <Loader2Icon className='size-4 animate-spin' />,
			}}
			toastOptions={{
				style: {
					fontFamily: 'var(--font-harmony-os)',
					background: '#27272a', // zinc-800
					color: '#fafafa', // zinc-50
					border: '1px solid rgba(255, 255, 255, 0.1)',
				},
			}}
			{...props}
		/>
	);
};

export { Toaster };
