'use client';

import { ProCard } from '@ant-design/pro-components';
import { Button, Space } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';

export default function PackagesPage() {
	return (
		<div>
			<ProCard
				title='Package Management'
				extra={
					<Space>
						<Button icon={<ReloadOutlined />}>Refresh</Button>
						<Button type='primary' icon={<PlusOutlined />}>
							Create Package
						</Button>
					</Space>
				}
				headerBordered
			>
				<p style={{ color: '#999', padding: 20, textAlign: 'center' }}>
					Package management interface will be implemented here using ProTable
				</p>
			</ProCard>
		</div>
	);
}
