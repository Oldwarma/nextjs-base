/**
 * 静态数据模式示例
 * 
 * 演示如何使用 SmartCrudPage 展示静态数据或直接赋值的数据
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import SmartCrudPage from '@/components/admin/smart-crud-page';
import { postCrudConfig } from '@/app/(admin)/actions/cms/configs/crud-config.post';
import * as actions from '@/app/(admin)/actions/cms/crud-action.post';

export default function StaticDataExample() {
	// 🚀 性能优化：延迟加载大数据，避免阻塞首次渲染
	const [staticData, setStaticData] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	
	useEffect(() => {
		// 使用 setTimeout 将数据生成推迟到下一个事件循环
		// 让页面先渲染 loading 状态，避免卡顿
		const timer = setTimeout(() => {
			const data = [];
			for (let i = 0; i < 10000; i++) {
				data.push({
					_id: i.toString(),
					name: `Static Post ${i}`,
					status: i % 2 === 0 ? 'active' : 'inactive',
					order: i,
					expiresAt: '2024-12-31',
					description: `This is a static post ${i}`,
				});
			}
			setStaticData(data);
			setIsLoading(false);
		}, 0); // 0ms 延迟，推迟到下一个事件循环
		
		return () => clearTimeout(timer);
	}, []);

	// 方式 2：从其他 API 获取数据
	const [dynamicData, setDynamicData] = useState([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		// 模拟从其他 API 获取数据
		async function fetchData() {
			setLoading(true);
			try {
				// 假设从其他 API 获取数据
				// const response = await fetch('/api/other-source');
				// const data = await response.json();
				
				// 这里使用模拟数据
				const data = [
					{
						_id: '3',
						name: 'Dynamic Post 1',
						status: 'active',
						order: 3,
						expiresAt: '2024-12-31',
						description: 'Fetched from external API',
					},
				];
				
				setDynamicData(data);
			} catch (error) {
				console.error('Failed to fetch data:', error);
			} finally {
				setLoading(false);
			}
		}
		
		fetchData();
	}, []);

	// 方式 3：从父组件传递的数据
	// const dataFromProps = props.data;

	return (
		<SmartCrudPage
			title="Static Data Example"
			fieldsConfig={postCrudConfig.fieldsConfig}
			
			// 🔑 关键：直接传入 dataSource
			dataSource={staticData} // 或 dynamicData 或 dataFromProps
			
			// 🎯 显示加载状态
			loading={isLoading}
			
			// 注意：使用 dataSource 模式时，getList action 不需要
			actions={{
				// getList: 不需要了！
				create: actions.createPostAction,
				update: actions.updatePostAction,
				delete: actions.deletePostAction,
			}}
			
			// 功能开关
			enableCreate={false}
			enableEdit={false}
			enableDelete={false}
			enableDetail={false}
			enableIndexColumn={false}
			
			// 表格配置
			tableProps={{
				pagination: {
					defaultPageSize: 10000, // 修复：使用合理的分页大小
					showSizeChanger: true,
					pageSizeOptions: [10, 20, 50, 100, 200], // 最大建议不超过 200
				},
				scroll: { 
					x: 1200,
					y: 600, // 添加垂直滚动，固定表格高度
				},
				// 🚀 启用虚拟滚动（可选，适用于超大数据集）
				// virtual: true, // ProTable 可能不支持，需要确认版本
			}}
		/>
	);
}

