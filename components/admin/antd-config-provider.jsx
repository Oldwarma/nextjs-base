'use client';

import { ConfigProvider, App } from 'antd';
import { useEffect } from 'react';

/**
 * Ant Design 配置提供者
 * 用于配置全局设置，包括禁用兼容性警告
 */
export default function AntdConfigProvider({ children }) {
	useEffect(() => {
		// 禁用 React 19 兼容性警告
		if (typeof window !== 'undefined') {
			const originalWarn = console.warn;
			console.warn = (...args) => {
				// 过滤掉 antd compatible 警告
				if (
					args[0]?.includes?.('antd v5 support React is 16 ~ 18') ||
					args[0]?.includes?.('[antd: compatible]')
				) {
					return;
				}
				originalWarn.apply(console, args);
			};
		}
	}, []);

	return (
		<ConfigProvider
			theme={{
				token: {
					// 可以在这里自定义主题
				},
			}}
		>
			<App>{children}</App>
		</ConfigProvider>
	);
}

