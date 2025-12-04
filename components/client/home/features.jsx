'use client';

import { useTranslations } from 'next-intl';
import SpotlightCard from '@/components/ui/spotlight-card';
import { Zap, Code, Shield, Database, LayoutTemplate, History } from 'lucide-react';
import SectionHeader from './section-header';

const features = [
	{
		key: 'speed',
		icon: Zap,
		className: 'md:col-span-2',
		spotlightColor: 'rgba(245, 158, 11, 0.2)', // Amber
		iconColor: 'text-amber-500',
		iconBg: 'bg-amber-500/10',
	},
	{
		key: 'code',
		icon: Code,
		className: 'md:col-span-1',
		spotlightColor: 'rgba(59, 130, 246, 0.2)', // Blue
		iconColor: 'text-blue-500',
		iconBg: 'bg-blue-500/10',
	},
	{
		key: 'auth',
		icon: Shield,
		className: 'md:col-span-1',
		spotlightColor: 'rgba(16, 185, 129, 0.2)', // Emerald
		iconColor: 'text-green-500',
		iconBg: 'bg-green-500/10',
	},
	{
		key: 'form',
		icon: LayoutTemplate,
		className: 'md:col-span-2',
		spotlightColor: 'rgba(168, 85, 247, 0.2)', // Purple
		iconColor: 'text-purple-500',
		iconBg: 'bg-purple-500/10',
	},
	{
		key: 'logs',
		icon: History,
		className: 'md:col-span-1',
		spotlightColor: 'rgba(239, 68, 68, 0.2)', // Red
		iconColor: 'text-red-500',
		iconBg: 'bg-red-500/10',
	},
	{
		key: 'stack',
		icon: Database,
		className: 'md:col-span-2',
		spotlightColor: 'rgba(99, 102, 241, 0.2)', // Indigo
		iconColor: 'text-indigo-500',
		iconBg: 'bg-indigo-500/10',
	},
];

export default function Features() {
	const t = useTranslations('home.features');

	return (
		<section id='features' className='container mx-auto px-4 py-24'>
			<SectionHeader
				title={t('title')}
				subtitle={t('subtitle')}
			/>

			<div className='grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto'>
				{features.map((feature) => {
					const Icon = feature.icon;
					return (
						<SpotlightCard
							key={feature.key}
							className={`p-8 flex flex-col justify-between h-full ${feature.className}`}
							spotlightColor={feature.spotlightColor}
						>
							<div
								className={`h-14 w-14 rounded-2xl ${feature.iconBg} flex items-center justify-center mb-6 ${feature.iconColor}`}
							>
								<Icon size={28} />
							</div>
							<div>
								<h3 className='text-2xl font-semibold mb-3'>{t(`${feature.key}.title`)}</h3>
								<p className='text-muted-foreground text-lg leading-relaxed'>
									{t(`${feature.key}.desc`)}
								</p>
							</div>
						</SpotlightCard>
					);
				})}
			</div>
		</section>
	);
}
