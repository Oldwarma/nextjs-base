'use client';

// React 19 兼容补丁 - 必须在最顶部导入
import '@ant-design/v5-patch-for-react-19';

import { useMemo } from 'react';
import { ConfigProvider, App, theme as antdTheme } from 'antd';
import { useTheme } from 'next-themes';

// Ant Design 英文语言包
import enUS from 'antd/locale/en_US';

/**
 * Ant Design 配置提供者
 * 用于配置全局设置，包括 React 19 兼容性
 * 注意：不需要 StyleProvider，因为 @ant-design/nextjs-registry 已经处理了 SSR 样式注入
 */
export default function AntdConfigProvider({ children }) {
	const { resolvedTheme, theme, systemTheme } = useTheme();
	const effectiveTheme =
		resolvedTheme ||
		(theme === 'system' ? systemTheme : theme) ||
		'light';
	const isDarkMode = effectiveTheme === 'dark';

	const themeConfig = useMemo(() => {
		const algorithm = isDarkMode
			? [antdTheme.darkAlgorithm]
			: [antdTheme.defaultAlgorithm];

		return {
			algorithm,
			token: {
				colorPrimary: '#187ddc',
				colorBgLayout: isDarkMode ? '#0d0d0d' : '#f6f6f6',
				colorTextBase: isDarkMode ? '#f6f6f6' : '#0d0d0d',
				boxShadow: isDarkMode ? '0 8px 24px rgba(0,0,0,0.45)' : '0 8px 24px rgba(0,0,0,0.12)',
				boxShadowSecondary: isDarkMode ? '0 4px 14px rgba(0,0,0,0.35)' : '0 4px 14px rgba(0,0,0,0.1)',
				fontSize: 14,
				lineHeight: 1.5715,
				borderRadius: 6,
			},
		};
	}, [isDarkMode]);

	return (
		<ConfigProvider
			locale={enUS}
			theme={themeConfig}
		>
			<App>{children}</App>
		</ConfigProvider>
	);
}
