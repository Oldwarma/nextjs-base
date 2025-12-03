'use client';

// React 19 兼容补丁 - 必须在最顶部导入
import '@ant-design/v5-patch-for-react-19';

import { ConfigProvider, App } from 'antd';

// Ant Design 英文语言包
import enUS from 'antd/locale/en_US';

/**
 * Ant Design 配置提供者
 * 用于配置全局设置，包括 React 19 兼容性
 * 注意：不需要 StyleProvider，因为 @ant-design/nextjs-registry 已经处理了 SSR 样式注入
 */
export default function AntdConfigProvider({ children }) {
	return (
		<ConfigProvider
			locale={enUS}
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

