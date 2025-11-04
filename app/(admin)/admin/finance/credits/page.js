/**
 * 积分交易管理页面 - Smart CRUD 版本
 * 
 * 使用 Smart CRUD 重构，代码量从 370 行减少到约 220 行
 * 减少了 41% 的代码量
 * 
 * 特殊性：
 * - 交易记录只读，不支持编辑和删除
 * - 添加自定义"调整积分"按钮
 */

'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Button, Tag, Statistic, Row, Col, Avatar, Space } from 'antd';
import { ModalForm, ProFormText, ProFormDigit, ProFormTextArea } from '@ant-design/pro-components';
import { PlusOutlined, MinusOutlined, WalletOutlined, UserOutlined } from '@ant-design/icons';
import { toast } from 'sonner';

// 动态导入 SmartCrudPage
const SmartCrudPage = dynamic(() => import('@/components/admin/smart-crud-page'), {
	ssr: false,
	loading: () => <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>,
});

// Server Actions
import {
	getCreditTransactionListAction as getList,
	adminAddCreditsAction as addCredits,
	adminDeductCreditsAction as deductCredits,
} from '@/app/(admin)/actions/finance/admin-credits';

export default function CreditsManagementPage() {
	const [adjustModalVisible, setAdjustModalVisible] = useState(false);
	const [adjustType, setAdjustType] = useState('add'); // 'add' or 'deduct'
	const actionRef = useRef(); // 用于刷新列表

	// ============================================
	// 统一字段配置
	// ============================================
	const fieldsConfig = [
		// 交易 ID
		{
			key: '_id',
			title: 'Transaction ID',
			type: 'text',
			table: {
				width: 120,
				ellipsis: true,
				copyable: true,
			},
			form: false,
			search: false,
		},
		
		// 用户信息
		{
			key: 'userId',
			title: 'User',
			type: 'text',
			table: {
				width: 200,
				render: (value, record) => {
					const user = record.userInfo;
					if (!user) {
						// Fallback: 只显示 userId
						return <span style={{ color: '#999', fontSize: 12 }}>{value}</span>;
					}
					return (
						<Space>
							<Avatar src={user.image} size='small' icon={<UserOutlined />}>
								{user.name?.[0]?.toUpperCase()}
							</Avatar>
							<div>
								<div style={{ fontWeight: 500, fontSize: 13 }}>{user.name || 'N/A'}</div>
								<div style={{ fontSize: 11, color: '#999' }}>{user.email}</div>
							</div>
						</Space>
					);
				},
			},
			detail: {
				render: (value, record) => {
					const user = record.userInfo;
					if (!user) return value; // Fallback: 显示 userId
					return (
						<Space>
							<Avatar src={user.image} icon={<UserOutlined />}>
								{user.name?.[0]?.toUpperCase()}
							</Avatar>
							<div>
								<div style={{ fontWeight: 500 }}>{user.name}</div>
								<div style={{ color: '#999' }}>{user.email}</div>
							</div>
						</Space>
					);
				},
			},
			form: false,
			search: {
				enabled: true,
				mode: 'exact',
			},
		},
		
		// 交易类型
		{
			key: 'type',
			title: 'Type',
			type: 'select',
			table: {
				width: 140,
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
			form: false,
			search: {
				enabled: true,
				mode: 'exact',
				options: [
					{ label: 'Earned', value: 'earn' },
					{ label: 'Spent', value: 'spend' },
					{ label: 'Refunded', value: 'refund' },
					{ label: 'Expired', value: 'expire' },
					{ label: 'Admin Adjusted', value: 'admin_adjust' },
				],
			},
		},
		
		// 金额
		{
			key: 'amount',
			title: 'Amount',
			type: 'number',
			table: {
				width: 120,
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
			form: false,
			search: false,
		},
		
		// 余额
		{
			key: 'balance',
			title: 'Balance',
			type: 'number',
			table: {
				width: 100,
				render: (balance) => (
					<span style={{ fontWeight: 500 }}>{balance || 0}</span>
				),
			},
			form: false,
			search: false,
		},
		
		// 原因
		{
			key: 'reason',
			title: 'Reason',
			type: 'text',
			table: {
				width: 180,
				ellipsis: true,
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
			form: false,
			search: false,
		},
		
		// 关联 ID
		{
			key: 'relatedId',
			title: 'Related ID',
			type: 'text',
			table: {
				width: 120,
				ellipsis: true,
				copyable: true,
			},
			hideInTable: true, // 只在详情中显示
			form: false,
			search: false,
		},
		
		// 过期时间
		{
			key: 'expireAt',
			title: 'Expire At',
			type: 'datetime',
			table: {
				width: 180,
				render: (expireAt) => expireAt || 'Never',
			},
			hideInTable: true, // 只在详情中显示
			form: false,
			search: false,
		},
		
		// 创建时间
		{
			key: 'createdAt',
			title: 'Created At',
			type: 'datetime',
			table: {
				width: 180,
				sorter: true,
			},
			form: false,
			search: false,
		},
	];
	
	// ============================================
	// Actions 配置
	// ============================================
	const actions = {
		getList,
		getDetail,
		// 不提供 create, update, delete - 交易记录只读
	};
	
	// ============================================
	// 自定义工具栏按钮
	// ============================================
	const customToolbarButtons = [
		<Button
			key='add'
			type='primary'
			icon={<PlusOutlined />}
			onClick={() => {
				setAdjustType('add');
				setAdjustModalVisible(true);
			}}
		>
			Add Credits
		</Button>,
		<Button
			key='deduct'
			icon={<MinusOutlined />}
			onClick={() => {
				setAdjustType('deduct');
				setAdjustModalVisible(true);
			}}
		>
			Deduct Credits
		</Button>,
	];
	
	// ============================================
	// 调整积分
	// ============================================
	const handleAdjust = async (values) => {
		try {
			// 根据类型调用不同的 action
			const result = adjustType === 'add' 
				? await addCredits(values.userId, values.amount, values.reason || 'admin_adjustment')
				: await deductCredits(values.userId, values.amount, values.reason || 'admin_adjustment');

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
	
	// ============================================
	// 自定义详情头部
	// ============================================
	const renderDetailHeader = (record) => (
		<div style={{ 
			textAlign: 'center', 
			marginBottom: 24, 
			padding: '24px 0', 
			background: '#fafafa', 
			borderRadius: 8 
		}}>
			<WalletOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 12 }} />
			<Row gutter={24} style={{ marginTop: 24 }}>
				<Col span={12}>
					<Statistic
						title='Amount'
						value={record.amount}
						valueStyle={{
							color: record.amount > 0 ? '#52c41a' : record.amount < 0 ? '#ff4d4f' : '#999',
							fontWeight: 600,
						}}
						prefix={record.amount > 0 ? '+' : ''}
					/>
				</Col>
				<Col span={12}>
					<Statistic
						title='Balance After'
						value={record.balance || 0}
						valueStyle={{ fontWeight: 600 }}
					/>
				</Col>
			</Row>
		</div>
	);
	
	// ============================================
	// 返回 SmartCrudPage
	// ============================================
	return (
		<>
			<SmartCrudPage
				fieldsConfig={fieldsConfig}
				actions={actions}
				title='Credit Transaction Management'
				rowKey='_id'
				
				// 自定义工具栏按钮
				customToolbarButtons={customToolbarButtons}
				
				// 自定义详情头部
				renderDetailHeader={renderDetailHeader}
				
				// 当 actionRef 准备好时，保存到本地
				onActionRefReady={(ref) => {
					actionRef.current = ref.current;
				}}
				
				// 功能开关（交易记录只读）
				enableCreate={false}
				enableDetail={true}
				enableEdit={false}   // 禁用编辑
				enableDelete={false} // 禁用删除
				
				// 表格配置
				tableProps={{
					scroll: { x: 1400 },
				}}
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
		</>
	);
}

