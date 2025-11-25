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
import { Button, Modal, Space, Dropdown, Popconfirm, message, Descriptions, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ReloadOutlined, MoreOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';

// 导入字段生成器
import {
	generateTableColumns,
	generateDetailColumns,
	generateSearchConfig,
	generateSearchTransform,
	validateFieldsConfig,
} from '@/lib/crud/field-generator';
import { buildSortCondition } from '@/lib/crud/search-transformer';

// 导入动态表单字段组件
import DynamicFormFields from '@/components/admin/dynamic-form-fields';

/**
 * 清理表单数据中的空 array 项
 * @param {Object} values - 表单数据
 * @returns {Object} 清理后的数据
 */
function cleanArrayFields(values) {
	const cleaned = { ...values };
	
	Object.keys(cleaned).forEach(key => {
		const value = cleaned[key];
		// 如果是数组，过滤掉空值、空字符串和只有空格的项
		if (Array.isArray(value)) {
			cleaned[key] = value.filter(item => {
				if (item === null || item === undefined) return false;
				if (typeof item === 'string') {
					return item.trim().length > 0;
				}
				return true;
			});
		}
	});
	
	return cleaned;
}

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
 * @param {Function} onSearchExpandChange - 搜索表单展开状态变化回调
 */
export default function SmartCrudPage({
	fieldsConfig,
	actions,
	dataSource, // 可选：直接传入数据（不使用 request）
	loading, // 可选：加载状态
	title = 'Data Management',
	rowKey = 'id',  // ✅ 默认使用 'id' 而不是 '_id'，兼容未来数据库迁移
	tableProps = {},
	formProps = {},
	batchActions = [],
	customToolbarButtons = [], // 自定义工具栏按钮
	customRowActions = [], // 自定义行操作按钮
	onActionRefReady, // 回调：当 actionRef 准备好时调用
	onSearchExpandChange, // 回调：搜索表单展开状态变化时调用
	beforeEdit,
	beforeDelete,
	beforeCreate,
	renderDetailHeader,
	enableCreate = false,
	enableDetail = true,
	enableEdit = true,
	enableDelete = true,
	enableIndexColumn = false, // 是否显示序号列
	baseQuery = {},
}) {
	// 使用 Ant Design App hooks
	const { message: messageApi, modal: modalApi } = App.useApp();
	
	// 验证字段配置
	useMemo(() => {
		try {
			validateFieldsConfig(fieldsConfig);
		} catch (error) {
			console.error('Invalid fieldsConfig:', error);
			messageApi.error(`Configuration Error: ${error.message}`);
		}
	}, [fieldsConfig, messageApi]);

	// 状态管理
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [createModalVisible, setCreateModalVisible] = useState(false);
	const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
	const [currentRow, setCurrentRow] = useState(null);
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);
	const [editModalFullscreen, setEditModalFullscreen] = useState(false);
	const [createModalFullscreen, setCreateModalFullscreen] = useState(false);
	const [searchExpanded, setSearchExpanded] = useState(false); // 搜索表单展开状态
	const [isTreeData, setIsTreeData] = useState(false); // ✅ 树形数据标识
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

	// 自动生成表格列（根据搜索表单展开状态）
	const tableColumns = useMemo(() => {
		const columns = generateTableColumns(fieldsConfig, { searchExpanded });
		
		// 如果启用序号列，添加到最前面
		if (enableIndexColumn) {
			const indexColumn = {
				title: '#',
				dataIndex: 'index',
				key: 'index',
				width: 50,
				fixed: 'left',
				search: false,
				render: (_, __, index) => {
					// 计算全局序号：(当前页码 - 1) * 每页条数 + 当前行序号 + 1
					const pagination = actionRef.current?.pageInfo;
					const current = pagination?.current || 1;
					const pageSize = pagination?.pageSize || 20;
					return (current - 1) * pageSize + index + 1;
				},
			};
			return [indexColumn, ...columns];
		}
		
		return columns;
	}, [fieldsConfig, searchExpanded, enableIndexColumn]);

	// 自动生成搜索配置
	const searchConfig = useMemo(() => {
		const config = generateSearchConfig(fieldsConfig, { searchExpanded });
		
		// 监听搜索表单的展开/收起事件
		config.onCollapse = (collapsed) => {
			const expanded = !collapsed;
			setSearchExpanded(expanded);
			
			// 通知父组件
			if (onSearchExpandChange) {
				onSearchExpandChange(expanded);
			}
		};
		
		return config;
	}, [fieldsConfig, searchExpanded, onSearchExpandChange]);

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
		// 检查是否有任何操作按钮需要显示
		const hasAnyAction = enableDetail || enableEdit || enableDelete || (customRowActions && customRowActions.length > 0);
		
		// 如果没有任何操作，不添加 Actions 列
		if (!hasAnyAction) {
			return tableColumns;
		}
		
		return [
			...tableColumns,
			{
				title: 'Actions',
			valueType: 'option',
			width: 120,
			fixed: 'right',
			search: false,
			render: (_, record) => {
				// 平铺显示的按钮
				const flatButtons = [];
				// 更多下拉菜单项
				const moreMenuItems = [];

				// 查看详情 - 平铺显示
				if (enableDetail) {
					flatButtons.push(
						<Button
							key='view'
							type='text'
							size='small'
							icon={<EyeOutlined />}
							onClick={(e) => {
								e.stopPropagation();
								handleViewDetail(record);
							}}
						/>
					);
				}

				// 编辑 - 平铺显示
				if (enableEdit) {
					flatButtons.push(
						<Button
							key='edit'
							type='text'
							size='small'
							icon={<EditOutlined />}
							onClick={(e) => {
								e.stopPropagation();
								handleEdit(record);
							}}
						/>
					);
				}

				// 删除 - 平铺显示（使用 Popconfirm）
				if (enableDelete) {
					flatButtons.push(
						<Popconfirm
							key='delete'
							title='Delete Confirmation'
							description='Are you sure you want to delete this record? This action cannot be undone.'
							okText='Delete'
							okType='danger'
							cancelText='Cancel'
							onConfirm={() => handleDelete(record[rowKey])}
							placement='topRight'
						>
							<Button
								type='text'
								size='small'
								danger
								icon={<DeleteOutlined />}
								onClick={(e) => e.stopPropagation()}
							/>
						</Popconfirm>
					);
				}

				// 自定义行操作
				if (customRowActions && customRowActions.length > 0) {
					customRowActions.forEach((action) => {
						// 支持条件显示
						if (action.show && !action.show(record)) {
							return;
						}

						// 计算动态属性
						const actionText = typeof action.text === 'function' ? action.text(record) : action.text;
						const isDanger = typeof action.danger === 'function' ? action.danger(record) : action.danger || false;

						// 判断是平铺显示还是放入更多菜单
						// inMore 为 true 时放入更多菜单，否则平铺显示
						if (action.inMore) {
							// Dropdown 菜单项的处理
							// 注意：Ant Design Dropdown menu.items 不支持嵌套 Popconfirm
							// 如果需要确认，必须使用 modalApi.confirm（模态对话框）
							const handleClick = action.confirm
								? () => {
										const confirmConfig = typeof action.confirm === 'function' 
											? action.confirm(record) 
											: action.confirm;
										
										modalApi.confirm({
											title: confirmConfig.title || 'Confirmation',
											content: confirmConfig.description || 'Are you sure?',
											okText: confirmConfig.okText || 'OK',
											okType: confirmConfig.okType || 'primary',
											cancelText: confirmConfig.cancelText || 'Cancel',
											onOk: () => action.onClick(record),
										});
								  }
								: () => action.onClick(record);

							moreMenuItems.push({
								key: action.key || actionText,
								label: actionText,
								icon: action.icon,
								danger: isDanger,
								disabled: action.disabled ? action.disabled(record) : false,
								onClick: handleClick,
							});
						} else {
							// 如果配置了 confirm，使用 Popconfirm 包裹
							if (action.confirm) {
								const confirmConfig = typeof action.confirm === 'function' 
									? action.confirm(record) 
									: action.confirm;
								
								flatButtons.push(
									<Popconfirm
										key={action.key || actionText}
										title={confirmConfig.title || 'Confirmation'}
										description={confirmConfig.description || 'Are you sure?'}
										okText={confirmConfig.okText || 'OK'}
										okType={confirmConfig.okType || 'primary'}
										cancelText={confirmConfig.cancelText || 'Cancel'}
										placement={confirmConfig.placement || 'topRight'}
										onConfirm={() => action.onClick(record)}
									>
										<Button
											type='text'
											size='small'
											danger={isDanger}
											disabled={action.disabled ? action.disabled(record) : false}
											icon={action.icon}
											onClick={(e) => e.stopPropagation()}
										>
											{action.showText ? actionText : null}
										</Button>
									</Popconfirm>
								);
							} else {
								flatButtons.push(
									<Button
										key={action.key || actionText}
										type='text'
										size='small'
										danger={isDanger}
										disabled={action.disabled ? action.disabled(record) : false}
										icon={action.icon}
										onClick={(e) => {
											e.stopPropagation();
											action.onClick(record);
										}}
									>
										{action.showText ? actionText : null}
									</Button>
								);
							}
						}
					});
				}

				return (
					<Space size='small'>
						{flatButtons}
						{moreMenuItems.length > 0 && (
							<Dropdown
								menu={{ items: moreMenuItems }}
								trigger={['click']}
								placement='bottomRight'
							>
								<Button
									type='text'
									size='small'
									icon={<MoreOutlined />}
									onClick={(e) => e.stopPropagation()}
								/>
							</Dropdown>
						)}
					</Space>
				);
			},
			},
		];
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tableColumns, enableDetail, enableEdit, enableDelete, customRowActions, rowKey]);

	// 获取数据
	const request = async (params, sort, filter) => {
		try {
			// 使用自动生成的搜索转换函数转换参数
			const whereJson = searchTransform(params);

			// 转换排序参数 (ProTable 的 sort 格式 -> MongoDB 的 sortJson 格式)
			// ProTable: { fieldName: 'ascend' | 'descend' }
			// MongoDB: { fieldName: 1 | -1 }
			const sortJson = buildSortCondition(sort, fieldsConfig);

			const requestParams = {
				pageIndex: params.current,
				pageSize: params.pageSize,
				whereJson,    // ✅ 统一使用 whereJson 传递查询条件
				sortJson,     // ✅ 统一使用 sortJson 传递排序条件
			};

		const result = await actions.getList(requestParams);

		if (!result.success) {
			messageApi.error(result.error || 'Failed to fetch data');
			return { data: [], success: false, total: 0 };
		}

		// ✅ 自动检测是否为树形数据（vk-unicloud 风格）
		const dataList = result.data || [];
		if (dataList.length > 0) {
			const hasChildren = dataList.some(item => 
				item.children && Array.isArray(item.children) && item.children.length > 0
			);
			if (hasChildren && !isTreeData) {
				setIsTreeData(true);
			} else if (!hasChildren && isTreeData) {
				setIsTreeData(false);
			}
		}

		return {
			data: dataList,
			success: true,
			total: result.total || 0,
		};
		} catch (error) {
			console.error('Failed to fetch data:', error);
			messageApi.error('An unexpected error occurred');
			return { data: [], success: false, total: 0 };
		}
	};

	// 查看详情
	const handleViewDetail = async (record) => {
		// 清理 record 中的 Date 对象和其他复杂类型
		const cleanRecord = (obj) => {
			if (!obj || typeof obj !== 'object') return obj;
			
			const cleaned = {};
			for (const [key, value] of Object.entries(obj)) {
				if (value instanceof Date) {
					// Date 对象转换为 ISO 字符串
					cleaned[key] = value.toISOString();
				} else if (Array.isArray(value)) {
					// 递归清理数组
					cleaned[key] = value.map(item => 
						typeof item === 'object' ? cleanRecord(item) : item
					);
				} else if (value && typeof value === 'object' && value.constructor === Object) {
					// 递归清理普通对象
					cleaned[key] = cleanRecord(value);
				} else {
					// 基本类型直接复制
					cleaned[key] = value;
				}
			}
			return cleaned;
		};
		
		if (actions.getDetail) {
			try {
				const result = await actions.getDetail(record[rowKey]);
				if (result.success) {
					setCurrentRow(cleanRecord(result.data));
				} else {
				messageApi.error(result.error || 'Failed to fetch detail');
					return;
				}
			} catch (error) {
				messageApi.error('An unexpected error occurred');
				return;
			}
		} else {
			setCurrentRow(cleanRecord(record));
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
		messageApi.success(result.message || 'Deleted successfully');
			actionRef.current?.reload();
		} else {
			// 业务失败，只显示用户友好的提示，不触发 Next.js 错误覆盖层
			messageApi.error(result.error || 'Failed to delete');
		}
		} catch (error) {
			console.error('Delete error:', error);
			messageApi.error(error.message || 'An unexpected error occurred');
		}
	};

	// 保存（编辑）
	const handleSave = async (values) => {
		try {
			// 清理 array 类型字段的空值
			const cleanedValues = cleanArrayFields(values);
			
			// 编辑前处理（可以转换数据格式）
			let processedValues = cleanedValues;
			if (beforeCreate) {
				const processed = await beforeCreate(cleanedValues);
				if (processed === false) return false;
				processedValues = processed || cleanedValues;
			}
			
			// 获取 row 的 key（支持 string 或 function）
			const id = typeof rowKey === 'function' ? rowKey(currentRow) : currentRow[rowKey];
			
			const result = await actions.update(id, processedValues);

			if (result.success) {
			messageApi.success(result.message || 'Updated successfully');
				setEditModalVisible(false);
				setCurrentRow(null);
				actionRef.current?.reload();
				return true;
		} else {
			messageApi.error(result.error || 'Failed to update');
			return false;
		}
	} catch (error) {
		console.error('Failed to update:', error);
		messageApi.error('An unexpected error occurred');
		return false;
	}
	};

	// 创建
	const handleCreate = async (values) => {
	if (!actions.create) {
		messageApi.error('Create action not provided');
		return false;
	}

		// 清理 array 类型字段的空值
		let cleanedValues = cleanArrayFields(values);

		// 创建前回调
		if (beforeCreate) {
			const processed = await beforeCreate(cleanedValues);
			if (processed === false) return false;
			cleanedValues = processed || cleanedValues;
		}

		try {
			const result = await actions.create(cleanedValues);

			if (result.success) {
		messageApi.success(result.message || 'Created successfully');
				setCreateModalVisible(false);
				actionRef.current?.reload();
				return true;
		} else {
			messageApi.error(result.error || 'Failed to create');
			return false;
		}
	} catch (error) {
		console.error('Failed to create:', error);
		messageApi.error('An unexpected error occurred');
		return false;
	}
	};

	// 批量操作
	const handleBatchAction = async (action, params) => {
	if (selectedRowKeys.length === 0) {
		messageApi.warning('Please select items first');
		return;
	}

		try {
			const result = await action(selectedRowKeys, params);

		if (result.success) {
			messageApi.success(result.message || 'Operation completed successfully');
			setSelectedRowKeys([]);
			actionRef.current?.reload();
		} else {
			messageApi.error(result.error || 'Operation failed');
		}
	} catch (error) {
		messageApi.error('An unexpected error occurred');
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

		// 不再手动添加刷新按钮，ProTable 自带刷新功能

		return buttons;
	};

	// 合并 tableProps，单独处理 pagination、scroll 和 expandable
	const { pagination: userPagination, scroll: userScroll, expandable: userExpandable, ...restTableProps } = tableProps || {};
	
	// ✅ 自动生成树形表格配置（vk-unicloud 风格）
	const autoExpandable = isTreeData ? {
		defaultExpandAllRows: false, // 默认不展开
		indentSize: 24, // 缩进大小
	} : undefined;
	
	// 用户配置优先，如果用户没有配置且检测到树形数据，则使用自动配置
	const finalExpandable = userExpandable !== undefined ? userExpandable : autoExpandable;
	
	return (
		<>
			<ProTable
				columns={columnsWithActions}
				actionRef={actionRef}
				// 如果提供了 dataSource，使用静态数据模式；否则使用 request 模式
				{...(dataSource ? { dataSource } : { request })}
				loading={loading} // 加载状态
				rowKey={rowKey}
				search={dataSource ? false : searchConfig} // 静态数据模式禁用搜索
				dateFormatter='string'
				headerTitle={title}
				pagination={dataSource ? {
					defaultPageSize: 20,
					showSizeChanger: true,
					showTotal: (total) => `Total ${total} items`,
					pageSizeOptions: [10, 20, 50, 100],
					...userPagination,
				} : (
					// ✅ 树形数据禁用分页
					isTreeData ? false : {
						defaultPageSize: 20, // 使用 defaultPageSize 让组件自己管理状态
						showSizeChanger: true,
						showTotal: (total) => `Total ${total} items`,
						pageSizeOptions: [10, 20, 50, 100],
						...userPagination, // 用户配置覆盖默认值
					}
				)}
				scroll={{ x: 1400, ...userScroll }}
				expandable={finalExpandable}
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
				{...restTableProps}
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
				actions={actions}
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
					actions={actions}
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
						items={detailColumns.map(col => {
							const value = currentRow[col.dataIndex];
							let displayValue;
							
							if (col.render) {
								// 使用自定义 render 函数
								displayValue = col.render(value, currentRow);
							} else if (value === null || value === undefined) {
								// 空值显示为 -
								displayValue = '-';
							} else if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)) && value.includes('T'))) {
								// Date 对象或 ISO 日期字符串
								const date = value instanceof Date ? value : new Date(value);
								displayValue = date.toLocaleString('zh-CN', {
									year: 'numeric',
									month: '2-digit',
									day: '2-digit',
									hour: '2-digit',
									minute: '2-digit',
									second: '2-digit',
								});
							} else if (Array.isArray(value)) {
								// 数组转换为逗号分隔的字符串
								displayValue = value.join(', ');
							} else if (typeof value === 'object') {
								// 其他对象转换为 JSON
								displayValue = JSON.stringify(value, null, 2);
							} else if (typeof value === 'boolean') {
								// 布尔值转换为 Yes/No
								displayValue = value ? 'Yes' : 'No';
							} else {
								// 基本类型直接显示
								displayValue = String(value);
							}
							
							return {
								key: col.key,
								label: col.title,
								children: displayValue,
							};
						})}
							/>
				</div>
					)}
				</DrawerForm>
		</>
	);
}
