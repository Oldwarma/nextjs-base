/**
 * Action Logs Management Page
 *
 * 操作日志管理页面
 * 基于 SmartCrudPage 实现
 */

'use client';

import { Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import SmartCrudPage from '@/components/admin/smart-crud-page';

// Server Actions
import { getActionLogListAction as getList } from '@/app/(admin)/actions/system/admin-action-logs';
// ⚠️ 注意：不导入 getDetail，直接使用表格数据（已包含连表的 userInfo）

export default function ActionLogsPage() {
	// 字段配置
	const fieldsConfig = [
		// MongoDB _id
		{
			key: '_id',
			title: 'ID',
			type: 'text',
			table: false,
			form: false,
			search: false,
		},

		// User - 显示用户名称而不是 userId
		{
			key: 'userInfo',
			title: 'User',
			type: 'custom',
			table: {
				width: 150,
				render: (userInfo, record) => {
					// 因为 limit: 1，selects 会将数组转为单个对象
					// 所以 userInfo 可能是对象（转换后）或数组（转换前）
					let user = null;
					if (Array.isArray(userInfo) && userInfo.length > 0) {
						user = userInfo[0]; // 数组形式
					} else if (userInfo && typeof userInfo === 'object' && !Array.isArray(userInfo)) {
						user = userInfo; // 对象形式
					}

					if (user && user.name) {
						return (
							<div>
								<div style={{ fontWeight: 500 }}>{user.name}</div>
								<div style={{ fontSize: 12, color: '#999' }}>{user.email || record.userId}</div>
							</div>
						);
					}

					// 如果没有关联用户信息，显示 userId
					return <div style={{ color: '#999', fontSize: 12 }}>{record.userId || 'Unknown'}</div>;
				},
			},
			detail: {
				show: true,
				render: (value, record) => {
					// 关键：value 参数就是 userInfo 字段的值
					// 兼容处理：userInfo 可能是对象、数组或 null
					let user = null;

					if (Array.isArray(value) && value.length > 0) {
						user = value[0]; // 数组格式（兼容）
					} else if (value && typeof value === 'object') {
						user = value; // 对象格式（limit: 1 的结果）
					}

					if (user && user.name) {
						return (
							<div>
								<div>
									<strong>Name:</strong> {user.name}
								</div>
								<div>
									<strong>Email:</strong> {user.email || 'N/A'}
								</div>
								<div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
									<strong>User ID:</strong> {user.id || record.userId}
								</div>
							</div>
						);
					}

					// 如果没有关联用户信息，显示原始 userId
					return (
						<div style={{ color: '#999' }}>
							<div>
								<strong>User ID:</strong> {record.userId || 'Unknown'}
							</div>
							<div style={{ fontSize: 12, marginTop: 4 }}>(User information not available)</div>
						</div>
					);
				},
			},
			form: false,
			search: false,
		},

		// Action
		{
			key: 'action',
			title: 'Action',
			type: 'select',
			options: [
				{ label: 'Query', value: 'query' },
				{ label: 'Create', value: 'create' },
				{ label: 'Update', value: 'update' },
				{ label: 'Delete', value: 'delete' },
				{ label: 'Batch Update', value: 'batch_update' },
				{ label: 'Batch Delete', value: 'batch_delete' },
			],
			table: {
				width: 100,
				render: (value) => {
					const tagColors = {
						query: 'blue',
						create: 'green',
						update: 'orange',
						delete: 'red',
						batch_update: 'purple',
						batch_delete: 'magenta',
					};
					return <Tag color={tagColors[value] || 'default'}>{value}</Tag>;
				},
			},
			form: false,
			search: true,
		},

		// Resource Type
		{
			key: 'resourceType',
			title: 'Resource Type',
			type: 'text',
			table: {
				width: 120,
			},
			form: false,
			search: true,
		},

		// Resource ID
		{
			key: 'resourceId',
			title: 'Resource ID',
			type: 'text',
			table: {
				width: 150,
				copyable: true,
				ellipsis: true,
			},
			form: false,
			search: true,
		},

		// Status (success)
		{
			key: 'success',
			title: 'Status',
			type: 'boolean',
			table: {
				width: 100,
				render: (value) =>
					value ? (
						<Tag
							icon={<CheckCircleOutlined />}
							color='success'
						>
							Success
						</Tag>
					) : (
						<Tag
							icon={<CloseCircleOutlined />}
							color='error'
						>
							Failed
						</Tag>
					),
			},
			form: false,
			search: {
				type: 'select',
				options: [
					{ label: 'Success', value: true },
					{ label: 'Failed', value: false },
				],
			},
		},

		// Duration
		{
			key: 'duration',
			title: 'Duration (ms)',
			type: 'number',
			table: {
				width: 120,
				align: 'right',
				render: (value) => {
					let color = 'default';
					if (value < 100) color = 'success';
					else if (value < 500) color = 'warning';
					else color = 'error';

					return <Tag color={color}>{value}ms</Tag>;
				},
			},
			form: false,
			search: false,
		},

		// Created At
		{
			key: 'createdAt',
			title: 'Created At',
			type: 'datetime',
			table: {
				width: 180,
				sorter: true,
			},
			form: false,
			search: {
				type: 'dateRange',
			},
		},

		// Request Params (detail only)
		{
			key: 'params',
			title: 'Request Params',
			type: 'json',
			table: false,
			form: false,
			search: false,
			detail: {
				render: (value) => (
					<pre
						style={{
							background: '#f5f5f5',
							padding: 12,
							borderRadius: 4,
							maxHeight: 400,
							overflow: 'auto',
						}}
					>
						{JSON.stringify(value, null, 2)}
					</pre>
				),
			},
		},

		// Response Result (detail only)
		{
			key: 'result',
			title: 'Response Result',
			type: 'json',
			table: false,
			form: false,
			search: false,
			detail: {
				render: (value) => (
					<pre
						style={{
							background: '#f5f5f5',
							padding: 12,
							borderRadius: 4,
							maxHeight: 400,
							overflow: 'auto',
						}}
					>
						{JSON.stringify(value, null, 2)}
					</pre>
				),
			},
		},
	];

	return (
		<SmartCrudPage
			title='Action Logs'
			description='View all system operation logs'
			rowKey='_id'
			fieldsConfig={fieldsConfig}
			actions={{
				getList,
				// 不提供 getDetail，直接使用表格数据（已包含连表的 userInfo）
			}}
			tableOptions={{
				scroll: { x: 1200 },
			}}
			enableCreate={false}
			enableEdit={false}
			enableDelete={false}
			enableDetail={true}
		/>
	);
}
