'use client';

import { ProCard } from '@ant-design/pro-components';
import { Button, Space, Tabs } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

export default function SettingsPage() {
	const items = [
		{
			key: 'general',
			label: 'General',
			children: <div style={{ padding: 20 }}>General settings coming soon...</div>,
		},
		{
			key: 'api',
			label: 'API Keys',
			children: <div style={{ padding: 20 }}>API key management coming soon...</div>,
		},
		{
			key: 'notifications',
			label: 'Notifications',
			children: <div style={{ padding: 20 }}>Notification settings coming soon...</div>,
		},
	];

	return (
		<div>
			<ProCard
				title='System Settings'
				extra={
					<Space>
						<Button>Reset</Button>
						<Button type='primary' icon={<SaveOutlined />}>
							Save Changes
						</Button>
					</Space>
				}
				headerBordered
			>
				<Tabs items={items} />
			</ProCard>
		</div>
	);
}
