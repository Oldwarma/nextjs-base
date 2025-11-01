/**
 * 智能 CRUD 页面组件
 *
 * 基于 vk-unicloud 万能表格/表单思想
 * 通过统一的字段配置自动生成表格、表单、搜索等
 *
 * 使用方式:
 *
 * ```jsx
 * <SmartCrudPage
 *   fieldsConfig={fieldsConfig}  // 统一的字段配置
 *   actions={actions}            // Server Actions
 *   title="User Management"
 * />
 * ```
 */

'use client';

import React, { useState, useRef, useMemo } from 'react';
import { ProTable, ModalForm, DrawerForm, ProDescriptions } from '@ant-design/pro-components';
import { Button, Modal, Space, Dropdown } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ReloadOutlined, MoreOutlined } from '@ant-design/icons';
import { toast } from 'sonner';

// 导入字段生成器
import {
	generateTableColumns,
	generateFormFields,
	generateDetailColumns,
	generateSearchConfig,
	generateSearchTransform,
	validateFieldsConfig,
} from '@/lib/admin/crud/field-generator';

/**
 * SmartCrudPage 组件参数
 *
 * @param {Array} fieldsConfig - 统一的字段配置 (核心)
 * @param {Object} actions - Server Actions
 * @param {Function} actions.getList - 获取列表 (必需)
 * @param {Function} actions.getDetail - 获取详情 (可选)
 * @param {Function} actions.create - 创建 (可选)
 * @param {Function} actions.update - 更新 (必需)
 * @param {Function} actions.delete - 删除 (必需)
 * @param {Function} actions.batchUpdate - 批量更新 (可选)
 * @param {String} title - 页面标题
 * @param {String} rowKey - 主键字段 (默认 '_id')
 * @param {Object} tableProps - ProTable 额外属性
 * @param {Object} formProps - ModalForm 额外属性
 * @param {Array} batchActions - 批量操作按钮配置
 * @param {Function} beforeEdit - 编辑前回调
 * @param {Function} beforeDelete - 删除前回调
 * @param {Function} beforeCreate - 创建前回调
 * @param {Function} renderDetailHeader - 自定义详情头部
 * @param {Boolean} enableCreate - 是否启用创建
 * @param {Boolean} enableDetail - 是否启用详情查看
 * @param {Boolean} enableEdit - 是否启用编辑
 * @param {Boolean} enableDelete - 是否启用删除
 * @param {Object} baseQuery - 基础查询条件 (强制应用)
 */
export default function SmartCrudPage({
	fieldsConfig,
	actions,
	title = 'Data Management',
	rowKey = '_id',
	tableProps = {},
	formProps = {},
	batchActions = [],
	customToolbarButtons = [], // 自定义工具栏按钮
	onActionRefReady, // 回调：当 actionRef 准备好时调用
	beforeEdit,
	beforeDelete,
	beforeCreate,
	renderDetailHeader,
	enableCreate = false,
	enableDetail = true,
	enableEdit = true,
	enableDelete = true,
	baseQuery = {},
}) {
	// 验证字段配置
	useMemo(() => {
		try {
			validateFieldsConfig(fieldsConfig);
		} catch (error) {
			console.error('Invalid fieldsConfig:', error);
			toast.error(`Configuration error: ${error.message}`);
		}
	}, [fieldsConfig]);

	// 状态管理
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [createModalVisible, setCreateModalVisible] = useState(false);
	const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
	const [currentRow, setCurrentRow] = useState(null);
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);
	const actionRef = useRef();
	
	// 当 actionRef 准备好时，通知父组件
	useMemo(() => {
		if (onActionRefReady && actionRef.current) {
			onActionRefReady(actionRef);
		}
	}, [onActionRefReady, actionRef]);

	// 自动生成表格列
	const tableColumns = useMemo(() => {
		return generateTableColumns(fieldsConfig);
	}, [fieldsConfig]);

	// 自动生成搜索配置
	const searchConfig = useMemo(() => {
		return generateSearchConfig(fieldsConfig);
	}, [fieldsConfig]);

	// 自动生成搜索转换函数
	const searchTransform = useMemo(() => {
		return generateSearchTransform(fieldsConfig);
	}, [fieldsConfig]);

	// 自动生成编辑表单字段
	const editFormFields = useMemo(() => {
		return generateFormFields(fieldsConfig, { isCreate: false });
	}, [fieldsConfig]);

	// 自动生成创建表单字段
	const createFormFields = useMemo(() => {
		return generateFormFields(fieldsConfig, { isCreate: true });
	}, [fieldsConfig]);

	// 自动生成详情列
	const detailColumns = useMemo(() => {
		return generateDetailColumns(fieldsConfig);
	}, [fieldsConfig]);

	// 添加操作列
	const columnsWithActions = useMemo(() => {
		return [
			...tableColumns,
			{
				title: 'Actions',
				valueType: 'option',
				width: 80,
				fixed: 'right',
				search: false,
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
						<Dropdown
							menu={{ items }}
							trigger={['click']}
						>
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
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tableColumns, enableDetail, enableEdit, enableDelete, rowKey]);

	// 获取数据
	const request = async (params, sort) => {
		try {
			// 使用自动生成的搜索转换函数转换参数
			const searchParams = searchTransform(params);

			const result = await actions.getList({
				pageIndex: params.current,
				pageSize: params.pageSize,
				...searchParams,
				sort,
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
			console.error('Failed to fetch data:', error);
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
			// 编辑前处理（可以转换数据格式）
			let processedValues = values;
			if (beforeCreate) {
				const processed = await beforeCreate(values);
				if (processed === false) return false;
				processedValues = processed || values;
			}
			
			const result = await actions.update(currentRow[rowKey], processedValues);

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
			console.error('Failed to update:', error);
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

		// 创建前回调
		if (beforeCreate) {
			const processed = await beforeCreate(values);
			if (processed === false) return false;
			values = processed || values;
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
			console.error('Failed to create:', error);
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

		// 自定义按钮（优先显示）
		if (customToolbarButtons.length > 0) {
			buttons.push(...customToolbarButtons);
		}

		// 创建按钮
		if (enableCreate && actions.create) {
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
				search={searchConfig}
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
									<Button
										size='small'
										onClick={() => setSelectedRowKeys([])}
									>
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
				width={formProps.width || 600}
				{...formProps}
			>
				{editFormFields.map((field) => (
					<React.Fragment key={field.key}>{field.component}</React.Fragment>
				))}
			</ModalForm>

			{/* 创建表单 */}
			{enableCreate && actions.create && (
				<ModalForm
					title='Create'
					open={createModalVisible}
					onOpenChange={setCreateModalVisible}
					onFinish={handleCreate}
					width={formProps.width || 600}
					{...formProps}
				>
					{createFormFields.map((field) => (
						<React.Fragment key={field.key}>{field.component}</React.Fragment>
					))}
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
								columns={detailColumns}
							/>
						</>
					)}
				</DrawerForm>
			)}
		</>
	);
}
