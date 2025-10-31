'use client';

import { ProCard } from '@ant-design/pro-components';
import { Button, Space } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';

export default function UsersPage() {
	return (
		<div>
			<ProCard
				title='User Management'
				extra={
					<Space>
						<Button icon={<ReloadOutlined />}>Refresh</Button>
						<Button type='primary' icon={<PlusOutlined />}>
							Add User
						</Button>
					</Space>
				}
				headerBordered
			>
				<p style={{ color: '#999', padding: 20, textAlign: 'center' }}>
					User management table will be implemented here using ProTable
				</p>
			</ProCard>
		</div>
	);
}

