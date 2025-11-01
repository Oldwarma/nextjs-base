'use client';

import { useState, useRef } from 'react';
import { ProTable, ModalForm, DrawerForm, ProDescriptions } from '@ant-design/pro-components';
import { Button, Modal, Tag, Space, Avatar, Dropdown } from 'antd';
import {
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	EyeOutlined,
	ReloadOutlined,
	MoreOutlined,
} from '@ant-design/icons';
import { toast } from 'sonner';

/**
 * 通用 CRUD 页面组件
 * 
 * @param {Object} config - 页面配置
 * @param {Array} config.columns - ProTable 列配置
 * @param {Object} config.actions - Server Actions
 * @param {Function} config.actions.getList - 获取列表
 * @param {Function} config.actions.getDetail - 获取详情（可选）
 * @param {Function} config.actions.create - 创建（可选）
 * @param {Function} config.actions.update - 更新
 * @param {Function} config.actions.delete - 删除
 * @param {Function} config.actions.batchUpdate - 批量更新（可选）
 * @param {Function} config.actions.batchDelete - 批量删除（可选）
 * @param {Array} config.formFields - 表单字段配置（ModalForm）
 * @param {Array} config.detailFields - 详情字段配置（可选，默认使用 columns）
 * @param {Object} config.tableProps - ProTable 额外属性（可选）
 * @param {Object} config.formProps - ModalForm 额外属性（可选）
 * @param {String} config.rowKey - 表格行键（默认 '_id'）
 * @param {String} config.title - 页面标题（如 'User Management'）
 * @param {Object} config.searchConfig - 搜索配置（可选）
 * @param {Function} config.beforeEdit - 编辑前回调（可选）
 * @param {Function} config.beforeDelete - 删除前回调（可选）
 * @param {Array} config.batchActions - 批量操作按钮配置（可选）
 * @param {Boolean} config.enableCreate - 是否启用创建（默认 false）
 * @param {Boolean} config.enableDetail - 是否启用详情查看（默认 true）
 * @param {Boolean} config.enableEdit - 是否启用编辑（默认 true）
 * @param {Boolean} config.enableDelete - 是否启用删除（默认 true）
 * @param {Function} config.renderDetailHeader - 自定义详情头部（可选）
 */
export default function CrudPage({
	columns,
	actions,
	formFields,
	detailFields,
	tableProps = {},
	formProps = {},
	rowKey = '_id',
	title = 'Data Management',
	searchConfig = {},
	beforeEdit,
	beforeDelete,
	batchActions = [],
	enableCreate = false,
	enableDetail = true,
	enableEdit = true,
	enableDelete = true,
	renderDetailHeader,
}) {
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [createModalVisible, setCreateModalVisible] = useState(false);
	const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
	const [currentRow, setCurrentRow] = useState(null);
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);
	const actionRef = useRef();

	// 添加操作列
	const columnsWithActions = [
		...columns,
		{
			title: 'Actions',
			valueType: 'option',
			width: 80,
			fixed: 'right',
			render: (_, record) => {
				const items = [];

				// 查看详情
				if (enableDetail) {
					items.push({
						key: 'view',
						label: 'View Details',
						icon: <EyeOutlined />,
						onClick: () => handleViewDetail(record),
					});
				}

				// 编辑
				if (enableEdit) {
					items.push({
						key: 'edit',
						label: 'Edit',
						icon: <EditOutlined />,
						onClick: () => handleEdit(record),
					});
				}

				// 分隔线
				if ((enableDetail || enableEdit) && enableDelete) {
					items.push({ type: 'divider' });
				}

				// 删除
				if (enableDelete) {
					items.push({
						key: 'delete',
						label: 'Delete',
						icon: <DeleteOutlined />,
						danger: true,
						onClick: () => {
							Modal.confirm({
								title: 'Delete Confirmation',
								content: 'Are you sure you want to delete this record? This action cannot be undone.',
								okText: 'Delete',
								okType: 'danger',
								cancelText: 'Cancel',
								onOk: () => handleDelete(record[rowKey]),
							});
						},
					});
				}

				return (
					<Dropdown menu={{ items }} trigger={['click']}>
						<Button
							type='text'
							icon={<MoreOutlined />}
							onClick={(e) => e.stopPropagation()}
						/>
					</Dropdown>
				);
			},
		},
	];

	// 获取数据
	const request = async (params, sort) => {
		try {
			const result = await actions.getList({
				pageIndex: params.current,
				pageSize: params.pageSize,
				...searchConfig.transform?.(params) || params,
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
			toast.error('Failed to fetch data');
			return { data: [], success: false, total: 0 };
		}
	};

	// 查看详情
	const handleViewDetail = async (record) => {
		if (actions.getDetail) {
			try {
				const result = await actions.getDetail(record[rowKey]);
				if (result.success) {
					setCurrentRow(result.data);
				} else {
					toast.error(result.error);
					return;
				}
			} catch (error) {
				toast.error('Failed to fetch detail');
				return;
			}
		} else {
			setCurrentRow(record);
		}
		setDetailDrawerVisible(true);
	};

	// 编辑
	const handleEdit = async (record) => {
		if (beforeEdit) {
			const processed = await beforeEdit(record);
			if (processed === false) return;
			setCurrentRow(processed || record);
		} else {
			setCurrentRow(record);
		}
		setEditModalVisible(true);
	};

	// 删除
	const handleDelete = async (id) => {
		if (beforeDelete) {
			const canDelete = await beforeDelete(id);
			if (canDelete === false) return;
		}

		try {
			const result = await actions.delete(id);

			if (result.success) {
				toast.success('Deleted successfully');
				actionRef.current?.reload();
			} else {
				toast.error(result.error);
			}
		} catch (error) {
			toast.error('Failed to delete');
		}
	};

	// 保存（编辑）
	const handleSave = async (values) => {
		try {
			const result = await actions.update(currentRow[rowKey], values);

			if (result.success) {
				toast.success('Updated successfully');
				setEditModalVisible(false);
				setCurrentRow(null);
				actionRef.current?.reload();
				return true;
			} else {
				toast.error(result.error);
				return false;
			}
		} catch (error) {
			toast.error('Failed to update');
			return false;
		}
	};

	// 创建
	const handleCreate = async (values) => {
		if (!actions.create) {
			toast.error('Create action not provided');
			return false;
		}

		try {
			const result = await actions.create(values);

			if (result.success) {
				toast.success('Created successfully');
				setCreateModalVisible(false);
				actionRef.current?.reload();
				return true;
			} else {
				toast.error(result.error);
				return false;
			}
		} catch (error) {
			toast.error('Failed to create');
			return false;
		}
	};

	// 批量操作
	const handleBatchAction = async (action, params) => {
		if (selectedRowKeys.length === 0) {
			toast.warning('Please select items first');
			return;
		}

		try {
			const result = await action(selectedRowKeys, params);

			if (result.success) {
				toast.success(result.message || 'Operation completed successfully');
				setSelectedRowKeys([]);
				actionRef.current?.reload();
			} else {
				toast.error(result.error);
			}
		} catch (error) {
			toast.error('Operation failed');
		}
	};

	// 工具栏按钮
	const toolBarRender = () => {
		const buttons = [];

		// 创建按钮
		if (enableCreate) {
			buttons.push(
				<Button
					key='create'
					type='primary'
					icon={<PlusOutlined />}
					onClick={() => setCreateModalVisible(true)}
				>
					Create
				</Button>
			);
		}

		// 刷新按钮
		buttons.push(
			<Button
				key='reload'
				icon={<ReloadOutlined />}
				onClick={() => actionRef.current?.reload()}
			>
				Refresh
			</Button>
		);

		return buttons;
	};

	return (
		<>
			<ProTable
				columns={columnsWithActions}
				actionRef={actionRef}
				request={request}
				rowKey={rowKey}
				pagination={{
					pageSize: 20,
					showSizeChanger: true,
					showTotal: (total) => `Total ${total} items`,
				}}
				search={{
					labelWidth: 'auto',
					defaultCollapsed: true,
					...searchConfig,
				}}
				dateFormatter='string'
				headerTitle={title}
				scroll={{ x: 1400 }}
				rowSelection={
					batchActions.length > 0
						? {
								selectedRowKeys,
								onChange: (keys) => setSelectedRowKeys(keys),
						  }
						: undefined
				}
				tableAlertRender={
					batchActions.length > 0
						? ({ selectedRowKeys }) => (
								<Space>
									<span>Selected {selectedRowKeys.length} items</span>
								</Space>
						  )
						: undefined
				}
				tableAlertOptionRender={
					batchActions.length > 0
						? () => (
								<Space>
									{batchActions.map((action) => (
										<Button
											key={action.key}
											size='small'
											onClick={() => handleBatchAction(action.action, action.params)}
										>
											{action.label}
										</Button>
									))}
									<Button size='small' onClick={() => setSelectedRowKeys([])}>
										Clear
									</Button>
								</Space>
						  )
						: undefined
				}
				toolBarRender={toolBarRender}
				{...tableProps}
			/>

			{/* 编辑表单 */}
			<ModalForm
				title='Edit'
				open={editModalVisible}
				onOpenChange={setEditModalVisible}
				initialValues={currentRow}
				onFinish={handleSave}
				width={600}
				{...formProps}
			>
				{formFields}
			</ModalForm>

			{/* 创建表单 */}
			{enableCreate && (
				<ModalForm
					title='Create'
					open={createModalVisible}
					onOpenChange={setCreateModalVisible}
					onFinish={handleCreate}
					width={600}
					{...formProps}
				>
					{formFields}
				</ModalForm>
			)}

			{/* 详情抽屉 */}
			{enableDetail && (
				<DrawerForm
					title='Details'
					open={detailDrawerVisible}
					onOpenChange={setDetailDrawerVisible}
					submitter={false}
					width={700}
				>
					{currentRow && (
						<>
							{renderDetailHeader && renderDetailHeader(currentRow)}

							<ProDescriptions
								column={1}
								bordered
								dataSource={currentRow}
								columns={(detailFields || columns).filter(
									(col) => col.dataIndex && col.valueType !== 'option'
								)}
							/>
						</>
					)}
				</DrawerForm>
			)}
		</>
	);
}

