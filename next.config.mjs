import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
	/* config options here */

	reactStrictMode: false,   // 关闭后再重启 dev 服务器

	// 明确指定项目根目录
	turbopack: {
		root: import.meta.dirname,
	},

	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'r2.nextjsbase.com',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'lh3.googleusercontent.com',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'avatars.githubusercontent.com',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: '*.googleusercontent.com',
				pathname: '/**',
			},
		],
		dangerouslyAllowSVG: true,
		contentDispositionType: 'attachment',
		contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
	},
};

export default withNextIntl(nextConfig);
