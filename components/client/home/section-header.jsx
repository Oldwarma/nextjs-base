'use client';

/**
 * Section Header 组件
 * 用于所有首页 section 的标题和副标题，保持一致的样式
 */
export default function SectionHeader({ title, subtitle, className = '' }) {
	return (
		<div className={`mb-12 text-center ${className}`}>
			<h2 className='text-3xl md:text-5xl font-bold mb-4 text-foreground'>
				{title}
			</h2>
			{subtitle && (
				<p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
					{subtitle}
				</p>
			)}
		</div>
	);
}

