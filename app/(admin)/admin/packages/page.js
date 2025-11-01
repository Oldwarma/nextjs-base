'use client';

import { useState, useRef } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormTextArea, ProFormDigit, ProFormSwitch, ProFormSelect, DrawerForm, ProDescriptions } from '@ant-design/pro-components';
import { Button, Modal, Tag, Space, Dropdown } from 'antd';
import {
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	EyeOutlined,
	ReloadOutlined,
	MoreOutlined,
	DollarOutlined,
} from '@ant-design/icons';
import { toast } from 'sonner';
import {
	getAllPackagesAdminAction as getList,
	getPackageDetailAction as getDetail,
	createPackageAction as create,
	updatePackageAction as update,
	deletePackageAction as deleteItem,
	batchUpdatePackagesAction as batchUpdate,
	batchDeletePackagesAction as batchDelete,
} from '@/app/(admin)/actions/admin-packages';

export default function PackagesManagementPage() {
	const [createModalVisible, setCreateModalVisible] = useState(false);
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
	const [currentRow, setCurrentRow] = useState(null);
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);
	const actionRef = useRef();

	// 表格列定义
	const columns = [
		{
			title: 'Name',
			dataIndex: 'name',
			copyable: true,
			ellipsis: true,
			width: 150,
			render: (name, record) => (
				<div>
					<div style={{ fontWeight: 500 }}>{name}</div>
					<div style={{ fontSize: 12, color: '#999' }}>{record.description || 'No description'}</div>
				</div>
			),
		},
		{
			title: 'Price',
			dataIndex: 'price',
			valueType: 'money',
			search: false,
			width: 100,
			sorter: true,
			render: (price) => (
				<span style={{ fontWeight: 500, color: '#1890ff' }}>
					${Number(price).toFixed(2)}
				</span>
			),
		},
		{
			title: 'Credits',
			dataIndex: 'credits',
			search: false,
			width: 100,
			sorter: true,
			render: (credits) => (
				<span style={{ fontWeight: 500, color: '#52c41a' }}>
					{credits}
				</span>
			),
		},
		{
			title: 'Valid Days',
			dataIndex: 'validDays',
			search: false,
			width: 100,
			render: (days) => `${days} days`,
		},
		{
			title: 'Status',
			dataIndex: 'isActive',
			valueType: 'select',
			width: 100,
			valueEnum: {
				true: { text: 'Active', status: 'Success' },
				false: { text: 'Inactive', status: 'Default' },
			},
			render: (_, record) => (
				<Tag color={record.isActive ? 'green' : 'default'}>
					{record.isActive ? 'Active' : 'Inactive'}
				</Tag>
			),
		},
		{
			title: 'Sort',
			dataIndex: 'sort',
			search: false,
			hideInTable: true, // 只在详情中显示
			width: 80,
		},
		{
			title: 'Features',
			dataIndex: 'features',
			search: false,
			hideInTable: true, // 只在详情中显示
			render: (features) => (
				<>
					{features?.map((feature, index) => (
						<Tag key={index} style={{ marginBottom: 4 }}>
							{feature}
						</Tag>
					))}
				</>
			),
		},
		{
			title: 'Created At',
			dataIndex: 'createdAt',
			valueType: 'dateTime',
			search: false,
			width: 180,
			sorter: true,
			hideInTable: true, // 只在详情中显示
		},
		{
			title: 'Updated At',
			dataIndex: 'updatedAt',
			valueType: 'dateTime',
			search: false,
			width: 180,
			hideInTable: true, // 只在详情中显示
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
					{
						key: 'edit',
						label: 'Edit',
						icon: <EditOutlined />,
						onClick: () => handleEdit(record),
					},
					{
						type: 'divider',
					},
					{
						key: 'delete',
						label: 'Delete',
						icon: <DeleteOutlined />,
						danger: true,
						onClick: () => handleDelete(record._id),
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
				search: params.name,
				filters: {
					isActive: params.isActive,
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
			toast.error('Failed to fetch package list');
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
			toast.error('Failed to fetch package details');
		}
	};

	// 编辑
	const handleEdit = (record) => {
		setCurrentRow(record);
		setEditModalVisible(true);
	};

	// 删除
	const handleDelete = async (packageId) => {
		Modal.confirm({
			title: 'Confirm Delete',
			content: 'Are you sure you want to delete this package? This action cannot be undone.',
			okText: 'Delete',
			okType: 'danger',
			cancelText: 'Cancel',
			onOk: async () => {
				try {
					const result = await deleteItem(packageId);
					if (result.success) {
						toast.success('Package deleted successfully');
						actionRef.current?.reload();
					} else {
						toast.error(result.error);
					}
				} catch (error) {
					toast.error('Failed to delete package');
				}
			},
		});
	};

	// 创建套餐
	const handleCreate = async (values) => {
		try {
			// 处理 features（确保是数组）
			const data = {
				...values,
				features: typeof values.features === 'string' ? values.features.split('\n').filter((f) => f.trim()) : values.features || [],
			};

			const result = await create(data);
			if (result.success) {
				toast.success('Package created successfully');
				setCreateModalVisible(false);
				actionRef.current?.reload();
				return true;
			} else {
				toast.error(result.error);
				return false;
			}
		} catch (error) {
			toast.error('Failed to create package');
			return false;
		}
	};

	// 保存编辑
	const handleSave = async (values) => {
		try {
			// 处理 features（确保是数组）
			const data = {
				...values,
				features: typeof values.features === 'string' ? values.features.split('\n').filter((f) => f.trim()) : values.features || [],
			};

			const result = await update(currentRow._id, data);
			if (result.success) {
				toast.success('Package updated successfully');
				setEditModalVisible(false);
				setCurrentRow(null);
				actionRef.current?.reload();
				return true;
			} else {
				toast.error(result.error);
				return false;
			}
		} catch (error) {
			toast.error('Failed to update package');
			return false;
		}
	};

	// 批量更新
	const handleBatchUpdate = async (updates) => {
		if (selectedRowKeys.length === 0) {
			toast.warning('Please select packages first');
			return;
		}

		try {
			const result = await batchUpdate(selectedRowKeys, updates);
			if (result.success) {
				toast.success(result.message);
				setSelectedRowKeys([]);
				actionRef.current?.reload();
			} else {
				toast.error(result.error);
			}
		} catch (error) {
			toast.error('Failed to update packages');
		}
	};

	// 批量删除
	const handleBatchDelete = async () => {
		if (selectedRowKeys.length === 0) {
			toast.warning('Please select packages first');
			return;
		}

		Modal.confirm({
			title: 'Confirm Batch Delete',
			content: `Are you sure you want to delete ${selectedRowKeys.length} package(s)? This action cannot be undone.`,
			okText: 'Delete',
			okType: 'danger',
			cancelText: 'Cancel',
			onOk: async () => {
				try {
					const result = await batchDelete(selectedRowKeys);
					if (result.success) {
						toast.success(result.message);
						setSelectedRowKeys([]);
						actionRef.current?.reload();
					} else {
						toast.error(result.error);
					}
				} catch (error) {
					toast.error('Failed to delete packages');
				}
			},
		});
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
				headerTitle='Package Management'
				scroll={{ x: 1200 }}
				rowSelection={{
					selectedRowKeys,
					onChange: setSelectedRowKeys,
				}}
				tableAlertRender={({ selectedRowKeys }) => (
					<Space size={16}>
						<span>Selected {selectedRowKeys.length} item(s)</span>
					</Space>
				)}
				tableAlertOptionRender={({ selectedRowKeys }) => (
					<Space size={16}>
						<Button
							size='small'
							onClick={() => handleBatchUpdate({ isActive: true })}
						>
							Activate
						</Button>
						<Button
							size='small'
							onClick={() => handleBatchUpdate({ isActive: false })}
						>
							Deactivate
						</Button>
						<Button size='small' danger onClick={handleBatchDelete}>
							Batch Delete
						</Button>
					</Space>
				)}
				toolBarRender={() => [
					<Button
						key='create'
						type='primary'
						icon={<PlusOutlined />}
						onClick={() => setCreateModalVisible(true)}
					>
						Create Package
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

			{/* 创建表单 */}
			<ModalForm
				title='Create Package'
				open={createModalVisible}
				onOpenChange={setCreateModalVisible}
				onFinish={handleCreate}
				width={700}
			>
				<ProFormText
					name='name'
					label='Package Name'
					placeholder='Enter package name'
					rules={[{ required: true, message: 'Please enter package name' }]}
				/>
				<ProFormTextArea
					name='description'
					label='Description'
					placeholder='Enter package description'
					fieldProps={{ rows: 3 }}
				/>
				<ProFormDigit
					name='price'
					label='Price'
					placeholder='Enter price'
					fieldProps={{ precision: 2, prefix: '$', min: 0 }}
					rules={[{ required: true, message: 'Please enter price' }]}
				/>
				<ProFormDigit
					name='credits'
					label='Credits'
					placeholder='Enter credits'
					fieldProps={{ precision: 0, min: 0 }}
					rules={[{ required: true, message: 'Please enter credits' }]}
				/>
				<ProFormDigit
					name='validDays'
					label='Valid Days'
					placeholder='Enter valid days'
					fieldProps={{ precision: 0, min: 0 }}
					rules={[{ required: true, message: 'Please enter valid days' }]}
				/>
				<ProFormTextArea
					name='features'
					label='Features'
					placeholder='Enter features (one per line)'
					fieldProps={{ rows: 4 }}
					tooltip='Enter one feature per line'
				/>
				<ProFormDigit
					name='sort'
					label='Sort Order'
					placeholder='Enter sort order'
					fieldProps={{ precision: 0 }}
					initialValue={0}
				/>
				<ProFormSwitch
					name='isActive'
					label='Active'
					initialValue={true}
				/>
			</ModalForm>

			{/* 编辑表单 */}
			<ModalForm
				title='Edit Package'
				open={editModalVisible}
				onOpenChange={setEditModalVisible}
				initialValues={{
					...currentRow,
					features: currentRow?.features?.join('\n') || '',
				}}
				onFinish={handleSave}
				width={700}
			>
				<ProFormText
					name='name'
					label='Package Name'
					placeholder='Enter package name'
					rules={[{ required: true, message: 'Please enter package name' }]}
				/>
				<ProFormTextArea
					name='description'
					label='Description'
					placeholder='Enter package description'
					fieldProps={{ rows: 3 }}
				/>
				<ProFormDigit
					name='price'
					label='Price'
					placeholder='Enter price'
					fieldProps={{ precision: 2, prefix: '$', min: 0 }}
					rules={[{ required: true, message: 'Please enter price' }]}
				/>
				<ProFormDigit
					name='credits'
					label='Credits'
					placeholder='Enter credits'
					fieldProps={{ precision: 0, min: 0 }}
					rules={[{ required: true, message: 'Please enter credits' }]}
				/>
				<ProFormDigit
					name='validDays'
					label='Valid Days'
					placeholder='Enter valid days'
					fieldProps={{ precision: 0, min: 0 }}
					rules={[{ required: true, message: 'Please enter valid days' }]}
				/>
				<ProFormTextArea
					name='features'
					label='Features'
					placeholder='Enter features (one per line)'
					fieldProps={{ rows: 4 }}
					tooltip='Enter one feature per line'
				/>
				<ProFormDigit
					name='sort'
					label='Sort Order'
					placeholder='Enter sort order'
					fieldProps={{ precision: 0 }}
				/>
				<ProFormSwitch
					name='isActive'
					label='Active'
				/>
			</ModalForm>

			{/* 详情抽屉 */}
			<DrawerForm
				title='Package Details'
				open={detailDrawerVisible}
				onOpenChange={setDetailDrawerVisible}
				submitter={false}
				width={700}
			>
				{currentRow && (
					<>
						<div style={{ textAlign: 'center', marginBottom: 24, padding: '24px 0', background: '#fafafa', borderRadius: 8 }}>
							<DollarOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 12 }} />
							<div style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
								{currentRow.name}
							</div>
							<div style={{ fontSize: 32, fontWeight: 700, color: '#1890ff', marginBottom: 8 }}>
								${Number(currentRow.price).toFixed(2)}
							</div>
							<Tag color={currentRow.isActive ? 'green' : 'default'} style={{ fontSize: 14 }}>
								{currentRow.isActive ? 'Active' : 'Inactive'}
							</Tag>
						</div>

						<ProDescriptions
							column={1}
							bordered
							dataSource={currentRow}
							columns={columns.filter(
								(col) => col.dataIndex && col.valueType !== 'option' && !['name', 'isActive'].includes(col.dataIndex)
							)}
						/>
					</>
				)}
			</DrawerForm>
		</>
	);
}
