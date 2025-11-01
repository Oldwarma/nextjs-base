'use client';

import { useState, useRef } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormDigit, ProFormTextArea, DrawerForm, ProDescriptions } from '@ant-design/pro-components';
import { Button, Modal, Tag, Space, Dropdown, Statistic, Row, Col } from 'antd';
import {
	PlusOutlined,
	MinusOutlined,
	EyeOutlined,
	ReloadOutlined,
	MoreOutlined,
	WalletOutlined,
	UserOutlined,
} from '@ant-design/icons';
import { toast } from 'sonner';
import {
	getCreditTransactionListAction as getList,
	getCreditTransactionDetailAction as getDetail,
	adminAdjustCreditsAction as adjustCredits,
} from '@/app/(admin)/actions/admin-credits';

export default function CreditsManagementPage() {
	const [adjustModalVisible, setAdjustModalVisible] = useState(false);
	const [adjustType, setAdjustType] = useState('add'); // 'add' or 'deduct'
	const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
	const [currentRow, setCurrentRow] = useState(null);
	const [selectedUserId, setSelectedUserId] = useState(null);
	const actionRef = useRef();

	// 表格列定义
	const columns = [
		{
			title: 'Transaction ID',
			dataIndex: '_id',
			search: false,
			width: 120,
			ellipsis: true,
			copyable: true,
		},
		{
			title: 'User ID',
			dataIndex: 'userId',
			width: 120,
			ellipsis: true,
			copyable: true,
		},
		{
			title: 'Type',
			dataIndex: 'type',
			valueType: 'select',
			width: 120,
			valueEnum: {
				earn: { text: 'Earned', status: 'Success' },
				spend: { text: 'Spent', status: 'Error' },
				refund: { text: 'Refunded', status: 'Warning' },
				expire: { text: 'Expired', status: 'Default' },
				admin_adjust: { text: 'Admin Adjusted', status: 'Processing' },
			},
			render: (_, record) => {
				const colorMap = {
					earn: 'green',
					spend: 'red',
					refund: 'orange',
					expire: 'default',
					admin_adjust: 'blue',
				};
				const textMap = {
					earn: 'Earned',
					spend: 'Spent',
					refund: 'Refunded',
					expire: 'Expired',
					admin_adjust: 'Admin Adjusted',
				};
				return (
					<Tag color={colorMap[record.type] || 'default'}>
						{textMap[record.type] || record.type}
					</Tag>
				);
			},
		},
		{
			title: 'Amount',
			dataIndex: 'amount',
			search: false,
			width: 100,
			sorter: true,
			render: (amount) => (
				<span
					style={{
						fontWeight: 600,
						color: amount > 0 ? '#52c41a' : amount < 0 ? '#ff4d4f' : '#999',
					}}
				>
					{amount > 0 ? '+' : ''}
					{amount}
				</span>
			),
		},
		{
			title: 'Balance',
			dataIndex: 'balance',
			search: false,
			width: 100,
			render: (balance) => (
				<span style={{ fontWeight: 500 }}>{balance || 0}</span>
			),
		},
		{
			title: 'Reason',
			dataIndex: 'reason',
			ellipsis: true,
			width: 150,
			render: (reason) => {
				const reasonMap = {
					manual_adjustment: 'Manual Adjustment',
					admin_adjustment: 'Admin Adjustment',
					package_purchase: 'Package Purchase',
					usage: 'Usage',
					refund: 'Refund',
					credits_expired: 'Credits Expired',
				};
				return reasonMap[reason] || reason || 'N/A';
			},
		},
		{
			title: 'Related ID',
			dataIndex: 'relatedId',
			search: false,
			hideInTable: true, // 只在详情中显示
			ellipsis: true,
			copyable: true,
		},
		{
			title: 'Expire At',
			dataIndex: 'expireAt',
			valueType: 'dateTime',
			search: false,
			hideInTable: true, // 只在详情中显示
			width: 180,
			render: (expireAt) => expireAt || 'Never',
		},
		{
			title: 'Created At',
			dataIndex: 'createdAt',
			valueType: 'dateTime',
			search: false,
			width: 180,
			sorter: true,
		},
		{
			title: 'Actions',
			valueType: 'option',
			width: 80,
			fixed: 'right',
			render: (text, record, _, action) => {
				const items = [
					{
						key: 'view',
						label: 'View',
						icon: <EyeOutlined />,
						onClick: () => handleView(record),
					},
				];

				return (
					<Dropdown menu={{ items }} trigger={['click']}>
						<Button type='text' icon={<MoreOutlined />} />
					</Dropdown>
				);
			},
		},
	];

	// 请求数据
	const request = async (params, sort) => {
		try {
			const result = await getList({
				pageIndex: params.current,
				pageSize: params.pageSize,
				search: params.userId,
				filters: {
					type: params.type,
					userId: params.userId,
				},
			});

			if (!result.success) {
				toast.error(result.error);
				return { data: [], success: false, total: 0 };
			}

			return {
				data: result.data || [],
				success: true,
				total: result.total || 0,
			};
		} catch (error) {
			toast.error('Failed to fetch credit transactions');
			return { data: [], success: false, total: 0 };
		}
	};

	// 查看详情
	const handleView = async (record) => {
		try {
			const result = await getDetail(record._id);
			if (result.success) {
				setCurrentRow(result.data);
				setDetailDrawerVisible(true);
			} else {
				toast.error(result.error);
			}
		} catch (error) {
			toast.error('Failed to fetch transaction details');
		}
	};

	// 打开调整积分弹窗
	const handleOpenAdjust = (type) => {
		setAdjustType(type);
		setAdjustModalVisible(true);
	};

	// 调整积分
	const handleAdjust = async (values) => {
		try {
			const amount = adjustType === 'add' ? values.amount : -values.amount;
			const result = await adjustCredits(values.userId, amount, values.reason || 'admin_adjustment');

			if (result.success) {
				toast.success(adjustType === 'add' ? 'Credits added successfully' : 'Credits deducted successfully');
				setAdjustModalVisible(false);
				actionRef.current?.reload();
				return true;
			} else {
				toast.error(result.error);
				return false;
			}
		} catch (error) {
			toast.error('Failed to adjust credits');
			return false;
		}
	};

	return (
		<>
			<ProTable
				columns={columns}
				actionRef={actionRef}
				request={request}
				rowKey='_id'
				pagination={{
					defaultPageSize: 20,
					showSizeChanger: true,
					showQuickJumper: true,
				}}
				search={{
					labelWidth: 'auto',
					defaultCollapsed: true,
				}}
				dateFormatter='string'
				headerTitle='Credit Transaction Management'
				scroll={{ x: 1400 }}
				toolBarRender={() => [
					<Button
						key='add'
						type='primary'
						icon={<PlusOutlined />}
						onClick={() => handleOpenAdjust('add')}
					>
						Add Credits
					</Button>,
					<Button
						key='deduct'
						icon={<MinusOutlined />}
						onClick={() => handleOpenAdjust('deduct')}
					>
						Deduct Credits
					</Button>,
					<Button
						key='refresh'
						icon={<ReloadOutlined />}
						onClick={() => actionRef.current?.reload()}
					>
						Refresh
					</Button>,
				]}
			/>

			{/* 调整积分表单 */}
			<ModalForm
				title={adjustType === 'add' ? 'Add Credits' : 'Deduct Credits'}
				open={adjustModalVisible}
				onOpenChange={setAdjustModalVisible}
				onFinish={handleAdjust}
				width={500}
			>
				<ProFormText
					name='userId'
					label='User ID'
					placeholder='Enter user ID'
					rules={[{ required: true, message: 'Please enter user ID' }]}
					tooltip='The ID of the user to adjust credits for'
				/>
				<ProFormDigit
					name='amount'
					label='Amount'
					placeholder='Enter amount'
					fieldProps={{ precision: 0, min: 1 }}
					rules={[{ required: true, message: 'Please enter amount' }]}
					tooltip={adjustType === 'add' ? 'Credits to add' : 'Credits to deduct'}
				/>
				<ProFormTextArea
					name='reason'
					label='Reason'
					placeholder='Enter reason (optional)'
					fieldProps={{ rows: 3 }}
					tooltip='Reason for the adjustment'
				/>
			</ModalForm>

			{/* 详情抽屉 */}
			<DrawerForm
				title='Transaction Details'
				open={detailDrawerVisible}
				onOpenChange={setDetailDrawerVisible}
				submitter={false}
				width={700}
			>
				{currentRow && (
					<>
						<div style={{ textAlign: 'center', marginBottom: 24, padding: '24px 0', background: '#fafafa', borderRadius: 8 }}>
							<WalletOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 12 }} />
							<Row gutter={24} style={{ marginTop: 24 }}>
								<Col span={12}>
									<Statistic
										title='Amount'
										value={currentRow.amount}
										valueStyle={{
											color: currentRow.amount > 0 ? '#52c41a' : currentRow.amount < 0 ? '#ff4d4f' : '#999',
											fontWeight: 600,
										}}
										prefix={currentRow.amount > 0 ? '+' : ''}
									/>
								</Col>
								<Col span={12}>
									<Statistic
										title='Balance After'
										value={currentRow.balance || 0}
										valueStyle={{ fontWeight: 600 }}
									/>
								</Col>
							</Row>
						</div>

						<ProDescriptions
							column={1}
							bordered
							dataSource={currentRow}
							columns={columns.filter(
								(col) => col.dataIndex && col.valueType !== 'option' && !['amount', 'balance'].includes(col.dataIndex)
							)}
						/>
					</>
				)}
			</DrawerForm>
		</>
	);
}
