'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * 主题提供者组件
 * 支持深色/浅色模式切换
 */
export function ThemeProvider({ children, ...props }) {
	return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}


