import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
	/* config options here */

	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'inwindcms.nextjsbase.com',
				port: '',
				pathname: '/assets/**', // 只允许访问 /assets 路径下的图片
			},
			{
				protocol: 'https',
				hostname: 'lh3.googleusercontent.com',
				port: '',
			},
			{
				protocol: 'https',
				hostname: 'avatars.githubusercontent.com',
				port: '',
			},
			{
				protocol: 'https',
				hostname: '*.googleusercontent.com',
				port: '',
			},
		],
		dangerouslyAllowSVG: true,
		contentDispositionType: 'attachment',
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
	},
};

export default withNextIntl(nextConfig);
