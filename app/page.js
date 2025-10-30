import { redirect } from 'next/navigation';
import { defaultLocale } from '@/i18n/config';

/**
 * 根页面 - 自动重定向到默认语言
 */
export default function RootPage() {
	// 这个页面实际上不会被渲染，因为中间件会处理重定向
	// 但为了防止某些情况下中间件失效，这里也做一个重定向
	redirect(`/${defaultLocale}`);
}
