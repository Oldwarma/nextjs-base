'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';

// 动态导入 SmartCrudPage，禁用 SSR
const SmartCrudPage = dynamic(() => import('@/components/admin/smart-crud-page'), { ssr: false, loading: () => <div>Loading...</div> });

// ============================================
// 生成 1000 条静态模拟数据
// ============================================

// 状态选项
const statusOptions = [
	{ label: 'Active', value: 'active', color: 'success' },
	{ label: 'Inactive', value: 'inactive', color: 'default' },
	{ label: 'Pending', value: 'pending', color: 'processing' },
];

// 分类选项
const categoryOptions = [
	{ label: 'Electronics', value: 'electronics' },
	{ label: 'Clothing', value: 'clothing' },
	{ label: 'Food', value: 'food' },
	{ label: 'Books', value: 'books' },
	{ label: 'Sports', value: 'sports' },
];

// 生成随机数据
function generateMockData(count) {
	const data = [];
	const statuses = ['active', 'inactive', 'pending'];
	const categories = ['electronics', 'clothing', 'food', 'books', 'sports'];
	const names = ['iPhone', 'MacBook', 'T-Shirt', 'Sneakers', 'Novel', 'Basketball', 'Headphones', 'Watch', 'Jacket', 'Tablet'];

	for (let i = 1; i <= count; i++) {
		data.push({
			id: i,
			name: `${names[i % names.length]} ${i}`,
			category: categories[i % categories.length],
			price: Math.floor(Math.random() * 1000) + 10,
			stock: Math.floor(Math.random() * 500),
			status: statuses[i % statuses.length],
			sales: Math.floor(Math.random() * 10000),
			rating: (Math.random() * 4 + 1).toFixed(1),
			createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
		});
	}
	return data;
}

// 预生成 1000 条数据
const MOCK_DATA = generateMockData(1000);

/**
 * 基础数据表格示例
 *
 * 特点：
 * - 无搜索筛选
 * - 无行操作按钮
 * - 纯静态数据展示
 * - 1000 条数据
 */
export default function DataTableBasicPage() {
	// 字段配置
	const fieldsConfig = useMemo(
		() => [
			{
				key: 'id',
				title: 'ID',
				type: 'number',
				table: {
					width: 50,
					fixed: 'left',
				},
			},
			{
				key: 'name',
				title: 'Product Name',
				type: 'text',
				table: {
					width: 150,
					ellipsis: true,
				},
			},
			{
				key: 'category',
				title: 'Category',
				type: 'select',
				data: categoryOptions,
				table: {
					width: 120,
				},
			},
			{
				key: 'price',
				title: 'Price',
				type: 'money',
				table: {
					width: 100,
					sorter: true,
				},
			},
			{
				key: 'stock',
				title: 'Stock',
				type: 'number',
				table: {
					width: 100,
					sorter: true,
				},
			},
			{
				key: 'sales',
				title: 'Sales',
				type: 'number',
				table: {
					width: 100,
					sorter: true,
				},
			},
			{
				key: 'rating',
				title: 'Rating',
				type: 'rate',
				table: {
					width: 100,
				},
			},
			{
				key: 'status',
				title: 'Status',
				type: 'select',
				data: statusOptions,
				table: {
					width: 100,
				},
			},
			{
				key: 'createdAt',
				title: 'Created',
				type: 'date',
				table: {
					sorter: true,
				},
			},
		],
		[]
	);

	return (
		<SmartCrudPage
			fieldsConfig={fieldsConfig}
			// 使用静态数据，不需要 actions
			dataSource={MOCK_DATA}
			title='Basic Data Table (1000 rows)'
			rowKey='id'
			// 禁用所有操作
			enableCreate={false}
			enableEdit={false}
			enableDelete={false}
			enableDetail={false}
			// 禁用序号列（已有 ID 列）
			enableIndexColumn={false}
			// 不需要手动设置 scroll.x，系统会根据列宽自动计算
		/>
	);
}
