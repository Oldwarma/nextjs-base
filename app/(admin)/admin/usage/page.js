'use client';

import { ProCard, StatisticCard } from '@ant-design/pro-components';
import { Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

export default function UsagePage() {
	return (
		<div>
			<ProCard
				title='Usage Statistics'
				extra={<Button icon={<ReloadOutlined />}>Refresh</Button>}
				headerBordered
			>
				<StatisticCard.Group direction='row' gutter={16}>
					<StatisticCard
						statistic={{
							title: 'Image Generation',
							value: 8526,
							suffix: 'requests',
						}}
					/>
					<StatisticCard
						statistic={{
							title: 'Video Generation',
							value: 1234,
							suffix: 'requests',
						}}
					/>
					<StatisticCard
						statistic={{
							title: 'Audio Generation',
							value: 456,
							suffix: 'requests',
						}}
					/>
				</StatisticCard.Group>
				<div style={{ marginTop: 24, padding: 20, textAlign: 'center', color: '#999' }}>
					<p>Detailed usage charts and analytics will be displayed here</p>
				</div>
			</ProCard>
		</div>
	);
}
