'use client';

import { Tag } from 'antd';
import SmartCrudPage from '@/components/admin/smart-crud-page';
import nb from '@/lib/function';

// Server Actions
import { getLoginLogListAction as getList, getLoginLogDetailAction as getDetail } from '@/app/(admin)/actions/system/admin-login-logs';

export default function LoginLogsPage() {
	// 字段配置
	const fieldsConfig = [
		{
			key: 'id',
			title: 'ID',
			type: 'text',
			table: false,
			form: false,
			search: false,
		},

		// User
		{
			key: 'userInfo',
			title: 'User',
			type: 'custom',
			table: {
				width: 180,
				render: (userInfo, record) => {
					let user = null;
					if (nb.pubfn.isArray(userInfo) && userInfo.length > 0) {
						user = userInfo[0];
					} else if (userInfo && nb.pubfn.isObject(userInfo) && !nb.pubfn.isArray(userInfo)) {
						user = userInfo;
					}

					if (user?.name || user?.email) {
						return (
							<div>
								<div style={{ fontWeight: 500 }}>{user.name || 'Unknown'}</div>
								<div style={{ fontSize: 12, color: '#999' }}>{user.email || record.userId}</div>
							</div>
						);
					}

					return <div style={{ color: '#999', fontSize: 12 }}>{record.userId || 'Unknown'}</div>;
				},
			},
			detail: {
				show: true,
				render: (value, record) => {
					let user = null;
					if (nb.pubfn.isArray(value) && value.length > 0) {
						user = value[0];
					} else if (value && nb.pubfn.isObject(value)) {
						user = value;
					}

					if (user) {
						return (
							<div>
								<div>
									<strong>Name:</strong> {user.name || 'Unknown'}
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

		// IP Address
		{
			key: 'ipAddress',
			title: 'IP Address',
			type: 'text',
			table: {
				width: 140,
			},
			form: false,
			search: {
				mode: 'like',
				placeholder: 'Search IP',
			},
		},

		// User Agent
		{
			key: 'userAgent',
			title: 'User Agent',
			type: 'text',
			table: {
				width: 240,
				ellipsis: true,
			},
			form: false,
			search: false,
			detail: {
				render: (value) => (
					<pre
						style={{
							background: '#f5f5f5',
							padding: 12,
							borderRadius: 4,
							maxHeight: 240,
							overflow: 'auto',
						}}
					>
						{value || 'N/A'}
					</pre>
				),
			},
		},

		// Session Token
		// {
		// 	key: 'token',
		// 	title: 'Session Token',
		// 	type: 'text',
		// 	table: {
		// 		width: 260,
		// 		ellipsis: true,
		// 		copyable: true,
		// 	},
		// 	form: false,
		// 	search: false,
		// 	detail: {
		// 		render: (value) => (
		// 			<pre
		// 				style={{
		// 					background: '#f5f5f5',
		// 					padding: 12,
		// 					borderRadius: 4,
		// 					whiteSpace: 'pre-wrap',
		// 					wordBreak: 'break-all',
		// 				}}
		// 			>
		// 				{value || 'N/A'}
		// 			</pre>
		// 		),
		// 	},
		// },

		// Status
		{
			key: 'status',
			title: 'Status',
			type: 'custom',
			table: {
				width: 120,
				render: (_, record) => {
					const now = Date.now();
					const expiresAt = record.expiresAt ? new Date(record.expiresAt).getTime() : null;
					const isExpired = expiresAt ? expiresAt <= now : false;

					return <Tag color={isExpired ? 'error' : 'success'}>{isExpired ? 'Expired' : 'Active'}</Tag>;
				},
			},
			form: false,
			search: false,
		},

		// Login Time
		{
			key: 'createdAt',
			title: 'Login Time',
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

		// Expires At
		{
			key: 'expiresAt',
			title: 'Expires At',
			type: 'datetime',
			table: {
				width: 180,
			},
			form: false,
			search: false,
		},
	];

	return (
		<SmartCrudPage
			title='Login Logs'
			description='View login sessions and client information'
			rowKey='id'
			fieldsConfig={fieldsConfig}
			actions={{
				getList,
				getDetail,
			}}
			enableCreate={false}
			enableEdit={false}
			enableDelete={false}
			enableDetail={true}
		/>
	);
}
