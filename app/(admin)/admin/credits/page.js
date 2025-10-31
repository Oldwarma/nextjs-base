'use client';

import { ProCard } from '@ant-design/pro-components';
import { Button, Space } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';

export default function CreditsPage() {
	return (
		<div>
			<ProCard
				title='Credit Management'
				extra={
					<Space>
						<Button icon={<ReloadOutlined />}>Refresh</Button>
						<Button type='primary' icon={<PlusOutlined />}>
							Add Credits
						</Button>
					</Space>
				}
				headerBordered
			>
				<p style={{ color: '#999', padding: 20, textAlign: 'center' }}>
					Credit management interface will be implemented here using ProTable
				</p>
			</ProCard>
		</div>
	);
}
