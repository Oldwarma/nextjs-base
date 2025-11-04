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
import { ProTable, ModalForm, DrawerForm } from '@ant-design/pro-components';
import { Button, Modal, Space, Dropdown, notification, Descriptions } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ReloadOutlined, MoreOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';

// 导入字段生成器
import {
	generateTableColumns,
	generateDetailColumns,
	generateSearchConfig,
	generateSearchTransform,
	validateFieldsConfig,
} from '@/lib/admin/crud/field-generator';

// 导入动态表单字段组件
import DynamicFormFields from '@/components/admin/dynamic-form-fields';

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
 * @param {Number} formProps.width - 表单弹窗宽度 (默认 800，全屏时为 100vw)
 * @param {Array} batchActions - 批量操作按钮配置
 * @param {Function} beforeEdit - 编辑前回调
 * @param {Function} beforeDelete - 删除前回调
 * @param {Function} beforeCreate - 创建前回调
 * @param {Function} renderDetailHeader - 自定义详情头部
 * @param {Boolean} enableCreate - 是否启用创建
 * @param {Boolean} enableDetail - 是否启用详情查看
 * @param {Boolean} enableEdit - 是否启用编辑
 * @param {Boolean} enableDelete - 是否启用删除
 * @param {Array} customRowActions - 自定义行操作按钮配置
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
	customRowActions = [], // 自定义行操作按钮
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
	// 使用 Ant Design notification hooks
	const [api, contextHolder] = notification.useNotification();
	
	// 验证字段配置
	useMemo(() => {
		try {
			validateFieldsConfig(fieldsConfig);
		} catch (error) {
			console.error('Invalid fieldsConfig:', error);
			api.error({
				message: 'Configuration Error',
				description: error.message,
				placement: 'topRight',
			});
		}
	}, [fieldsConfig, api]);

	// 状态管理
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [createModalVisible, setCreateModalVisible] = useState(false);
	const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
	const [currentRow, setCurrentRow] = useState(null);
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);
	const [editModalFullscreen, setEditModalFullscreen] = useState(false);
	const [createModalFullscreen, setCreateModalFullscreen] = useState(false);
	const actionRef = useRef();
	
	// 表单实例引用（用于动态表单字段）
	const editFormRef = useRef(null);
	const createFormRef = useRef(null);
	
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

					// 自定义行操作（插入在编辑和删除之间）
					if (customRowActions && customRowActions.length > 0) {
						// 如果前面有基础操作，添加分隔线
						if (enableDetail || enableEdit) {
							items.push({ type: 'divider' });
						}

						customRowActions.forEach((action) => {
							// 支持条件显示
							if (action.show && !action.show(record)) {
								return;
							}

							items.push({
								key: action.key || action.text,
								label: action.text,
								icon: action.icon,
								danger: action.danger || false,
								disabled: action.disabled ? action.disabled(record) : false,
								onClick: () => action.onClick(record),
							});
						});
					}

					// 分隔线
					if ((enableDetail || enableEdit || (customRowActions && customRowActions.length > 0)) && enableDelete) {
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
	}, [tableColumns, enableDetail, enableEdit, enableDelete, customRowActions, rowKey]);

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
				api.error({
					message: 'Failed to Fetch Data',
					description: result.error || 'Failed to fetch data',
					placement: 'topRight',
				});
				return { data: [], success: false, total: 0 };
			}

			return {
				data: result.data || [],
				success: true,
				total: result.total || 0,
			};
		} catch (error) {
			console.error('Failed to fetch data:', error);
			api.error({
				message: 'Failed to Fetch Data',
				description: 'An unexpected error occurred',
				placement: 'topRight',
			});
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
					api.error({
						message: 'Failed to Fetch Detail',
						description: result.error || 'Failed to fetch detail',
						placement: 'topRight',
					});
					return;
				}
			} catch (error) {
				api.error({
					message: 'Failed to Fetch Detail',
					description: 'An unexpected error occurred',
					placement: 'topRight',
				});
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
				api.success({
					message: 'Success',
					description: result.message || 'Deleted successfully',
					placement: 'topRight',
				});
				actionRef.current?.reload();
			} else {
				api.error({
					message: 'Failed to Delete',
					description: result.error || 'Failed to delete',
					placement: 'topRight',
				});
			}
		} catch (error) {
			api.error({
				message: 'Failed to Delete',
				description: 'An unexpected error occurred',
				placement: 'topRight',
			});
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
				api.success({
					message: 'Success',
					description: result.message || 'Updated successfully',
					placement: 'topRight',
				});
				setEditModalVisible(false);
				setCurrentRow(null);
				actionRef.current?.reload();
				return true;
			} else {
				api.error({
					message: 'Failed to Update',
					description: result.error || 'Failed to update',
					placement: 'topRight',
				});
				return false;
			}
		} catch (error) {
			console.error('Failed to update:', error);
			api.error({
				message: 'Failed to Update',
				description: 'An unexpected error occurred',
				placement: 'topRight',
			});
			return false;
		}
	};

	// 创建
	const handleCreate = async (values) => {
		if (!actions.create) {
			api.error({
				message: 'Action Not Available',
				description: 'Create action not provided',
				placement: 'topRight',
			});
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
				api.success({
					message: 'Success',
					description: result.message || 'Created successfully',
					placement: 'topRight',
				});
				setCreateModalVisible(false);
				actionRef.current?.reload();
				return true;
			} else {
				api.error({
					message: 'Failed to Create',
					description: result.error || 'Failed to create',
					placement: 'topRight',
				});
				return false;
			}
		} catch (error) {
			console.error('Failed to create:', error);
			api.error({
				message: 'Failed to Create',
				description: 'An unexpected error occurred',
				placement: 'topRight',
			});
			return false;
		}
	};

	// 批量操作
	const handleBatchAction = async (action, params) => {
		if (selectedRowKeys.length === 0) {
			api.warning({
				message: 'No Selection',
				description: 'Please select items first',
				placement: 'topRight',
			});
			return;
		}

		try {
			const result = await action(selectedRowKeys, params);

			if (result.success) {
				api.success({
					message: 'Success',
					description: result.message || 'Operation completed successfully',
					placement: 'topRight',
				});
				setSelectedRowKeys([]);
				actionRef.current?.reload();
			} else {
				api.error({
					message: 'Operation Failed',
					description: result.error || 'Operation failed',
					placement: 'topRight',
				});
			}
		} catch (error) {
			api.error({
				message: 'Operation Failed',
				description: 'An unexpected error occurred',
				placement: 'topRight',
			});
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
			{contextHolder}
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
			title={
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 48 }}>
					<span>Edit</span>
					<Button
						type="text"
						size="small"
						icon={editModalFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
						onClick={() => setEditModalFullscreen(!editModalFullscreen)}
						style={{ marginRight: -20, marginTop: -5, color: '#666' }}
					/>
				</div>
			}
			open={editModalVisible}
			onOpenChange={(visible) => {
				setEditModalVisible(visible);
				if (!visible) setEditModalFullscreen(false);
			}}
			initialValues={currentRow}
			onFinish={handleSave}
			width={editModalFullscreen ? '100vw' : (formProps.width || 800)}
			formRef={editFormRef}
			grid={false}
			modalProps={{
				centered: !editModalFullscreen,
				wrapClassName: editModalFullscreen ? 'fullscreen-modal' : '',
				style: editModalFullscreen ? {
					top: 0,
					maxWidth: '100vw',
					height: '100vh',
					margin: 0,
					paddingBottom: 0,
				} : {},
				styles: {
					body: {
						maxHeight: editModalFullscreen ? 'calc(100vh - 110px)' : 'calc(90vh - 110px)',
						overflowY: 'auto',
						overflowX: 'hidden',
						paddingLeft: 32,
						paddingRight: 32,
					},
				},
				destroyOnHidden: true,
			}}
			{...formProps}
		>
			<DynamicFormFields 
				fieldsConfig={fieldsConfig} 
				formInstance={editFormRef.current}
				isCreate={false}
			/>
		</ModalForm>

		{/* 创建表单 */}
		{enableCreate && actions.create && (
			<ModalForm
				title={
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 48 }}>
						<span>Create</span>
						<Button
							type="text"
							size="small"
							icon={createModalFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
							onClick={() => setCreateModalFullscreen(!createModalFullscreen)}
							style={{ marginRight: -20, marginTop: -5, color: '#666' }}
						/>
					</div>
				}
				open={createModalVisible}
				onOpenChange={(visible) => {
					setCreateModalVisible(visible);
					if (!visible) setCreateModalFullscreen(false);
				}}
				onFinish={handleCreate}
			width={createModalFullscreen ? '100vw' : (formProps.width || 800)}
			formRef={createFormRef}
			grid={false}
			modalProps={{
					centered: !createModalFullscreen,
					wrapClassName: createModalFullscreen ? 'fullscreen-modal' : '',
					style: createModalFullscreen ? {
						top: 0,
						maxWidth: '100vw',
						height: '100vh',
						margin: 0,
						paddingBottom: 0,
					} : {},
					styles: {
						body: {
							maxHeight: createModalFullscreen ? 'calc(100vh - 110px)' : 'calc(90vh - 110px)',
							overflowY: 'auto',
							overflowX: 'hidden',
							paddingLeft: 32,
							paddingRight: 32,
						},
					},
					destroyOnHidden: true,
				}}
				{...formProps}
			>
				<DynamicFormFields 
					fieldsConfig={fieldsConfig} 
					formInstance={createFormRef.current}
					isCreate={true}
				/>
			</ModalForm>
		)}

			{/* 详情抽屉 */}
				<DrawerForm
					title='Details'
			open={enableDetail && detailDrawerVisible}
			onOpenChange={(visible) => {
				if (enableDetail) {
					setDetailDrawerVisible(visible);
				}
			}}
					submitter={false}
					width={700}
				>
					{currentRow && (
				<div>
							{renderDetailHeader && renderDetailHeader(currentRow)}

					<Descriptions
								column={1}
								bordered
						items={detailColumns.map(col => ({
							key: col.key,
							label: col.title,
							children: col.render 
								? col.render(currentRow[col.dataIndex], currentRow)
								: currentRow[col.dataIndex],
						}))}
							/>
				</div>
					)}
				</DrawerForm>
		</>
	);
}
