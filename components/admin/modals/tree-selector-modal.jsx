/**
 * TreeSelectorModal - 树形选择器 Modal 组件
 * 
 * 用途：
 * - 用户分配角色（多选）
 * - 角色分配权限（多选）
 * - 角色分配菜单（多选）
 * - 权限选择父权限（单选，但可复用此组件）
 * 
 * 特性：
 * - 支持单选/多选
 * - 支持搜索过滤
 * - 支持禁用项
 * - 支持默认展开
 * - 支持额外的配置选项（如自动绑定权限）
 * 
 * 使用示例：
 * ```jsx
 * <TreeSelectorModal
 *   visible={visible}
 *   title="Assign Roles"
 *   treeData={roleTree}
 *   checkedKeys={selectedRoles}
 *   onSave={handleSave}
 *   onCancel={handleCancel}
 *   loading={loading}
 *   multiple={true}
 * />
 * ```
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Tree, Checkbox, Spin, Empty, Input, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Search } = Input;

/**
 * TreeSelectorModal Props
 * 
 * @param {Boolean} visible - 是否显示 Modal
 * @param {String} title - Modal 标题
 * @param {Array} treeData - 树形数据（Ant Design Tree 格式）
 * @param {Array|String} checkedKeys - 已选中的 keys（多选为数组，单选为字符串）
 * @param {Function} onSave - 保存回调 (checkedKeys, extraOptions) => Promise<void>
 * @param {Function} onCancel - 取消回调
 * @param {Boolean} loading - 加载状态
 * @param {Boolean} multiple - 是否多选（默认 true）
 * @param {Boolean} checkable - 是否显示复选框（默认 true，单选时自动为 false）
 * @param {Boolean} searchable - 是否支持搜索（默认 true）
 * @param {Boolean} defaultExpandAll - 是否默认展开所有节点（默认 false）
 * @param {Number} width - Modal 宽度（默认 600）
 * @param {Number} treeHeight - Tree 最大高度（默认 400）
 * @param {String} emptyText - 空数据提示文本
 * @param {String} okText - 确认按钮文本
 * @param {String} cancelText - 取消按钮文本
 * @param {Array} extraOptions - 额外的配置选项（如 Checkbox）
 * @param {Object} extraOptions[].key - 选项的唯一标识
 * @param {Object} extraOptions[].label - 选项的显示文本
 * @param {Object} extraOptions[].checked - 是否默认选中
 * @param {Object} extraOptions[].tooltip - 提示信息
 */
export default function TreeSelectorModal({
	visible,
	title = 'Select Items',
	treeData = [],
	checkedKeys = [],
	onSave,
	onCancel,
	loading = false,
	multiple = true,
	checkable = true,
	searchable = true,
	defaultExpandAll = false,
	width = 600,
	treeHeight = 400,
	emptyText = 'No data available',
	okText = 'Save',
	cancelText = 'Cancel',
	extraOptions = [],
	description, // 可选的说明文字
}) {
	// 内部状态
	const [internalCheckedKeys, setInternalCheckedKeys] = useState([]);
	const [expandedKeys, setExpandedKeys] = useState([]);
	const [searchValue, setSearchValue] = useState('');
	const [filteredTreeData, setFilteredTreeData] = useState([]);
	const [extraOptionsState, setExtraOptionsState] = useState({});
	const [confirmLoading, setConfirmLoading] = useState(false);

	// 初始化选中状态
	useEffect(() => {
		if (visible) {
			if (multiple) {
				setInternalCheckedKeys(Array.isArray(checkedKeys) ? checkedKeys : []);
			} else {
				setInternalCheckedKeys(checkedKeys ? [checkedKeys] : []);
			}

			// 初始化额外选项状态
			const initialExtraState = {};
			extraOptions.forEach((option) => {
				initialExtraState[option.key] = option.checked !== undefined ? option.checked : false;
			});
			setExtraOptionsState(initialExtraState);

			// 清空搜索
			setSearchValue('');
		}
	}, [visible, checkedKeys, multiple, extraOptions]);

	// 初始化树形数据
	useEffect(() => {
		if (visible) {
			setFilteredTreeData(treeData);

			// 默认展开
			if (defaultExpandAll && treeData.length > 0) {
				const allKeys = getAllKeys(treeData);
				setExpandedKeys(allKeys);
			}
		}
	}, [visible, treeData, defaultExpandAll]);

	// 获取所有节点的 key
	const getAllKeys = (data) => {
		const keys = [];
		const traverse = (nodes) => {
			nodes.forEach((node) => {
				keys.push(node.key);
				if (node.children && node.children.length > 0) {
					traverse(node.children);
				}
			});
		};
		traverse(data);
		return keys;
	};

	// 搜索过滤
	const handleSearch = (value) => {
		setSearchValue(value);

		if (!value.trim()) {
			setFilteredTreeData(treeData);
			setExpandedKeys([]);
			return;
		}

		// 过滤树形数据
		const filterTree = (data) => {
			return data.reduce((acc, node) => {
				const title = node.title || '';
				const match = title.toLowerCase().includes(value.toLowerCase());

				if (match) {
					acc.push(node);
					return acc;
				}

				if (node.children && node.children.length > 0) {
					const filteredChildren = filterTree(node.children);
					if (filteredChildren.length > 0) {
						acc.push({
							...node,
							children: filteredChildren,
						});
					}
				}

				return acc;
			}, []);
		};

		const filtered = filterTree(treeData);
		setFilteredTreeData(filtered);

		// 展开所有匹配的节点
		if (filtered.length > 0) {
			const allKeys = getAllKeys(filtered);
			setExpandedKeys(allKeys);
		}
	};

	// 处理树形选择变化
	const handleTreeCheck = (checkedKeysValue) => {
		setInternalCheckedKeys(checkedKeysValue);
	};

	// 处理树形选择（单选模式）
	const handleTreeSelect = (selectedKeys) => {
		if (!multiple) {
			setInternalCheckedKeys(selectedKeys);
		}
	};

	// 处理额外选项变化
	const handleExtraOptionChange = (key, checked) => {
		setExtraOptionsState((prev) => ({
			...prev,
			[key]: checked,
		}));
	};

	// 保存
	const handleOk = async () => {
		if (!onSave) return;

		setConfirmLoading(true);

		try {
			// 返回选中的 keys
			const result = multiple ? internalCheckedKeys : internalCheckedKeys[0] || null;

			// 如果有额外选项，一起返回
			if (extraOptions.length > 0) {
				await onSave(result, extraOptionsState);
			} else {
				await onSave(result);
			}
		} catch (error) {
			console.error('[TreeSelectorModal] Save failed:', error);
		} finally {
			setConfirmLoading(false);
		}
	};

	// 取消
	const handleCancel = () => {
		if (onCancel) {
			onCancel();
		}
	};

	return (
		<Modal
			title={title}
			open={visible}
			onOk={handleOk}
			onCancel={handleCancel}
			width={width}
			confirmLoading={confirmLoading || loading}
			okText={okText}
			cancelText={cancelText}
			destroyOnClose
		>
			{/* 说明文字 */}
			{description && (
				<div style={{ marginBottom: 16, color: '#666', fontSize: 14 }}>
					{description}
				</div>
			)}

			{/* 额外选项 */}
			{extraOptions.length > 0 && (
				<Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
					{extraOptions.map((option) => (
						<Checkbox
							key={option.key}
							checked={extraOptionsState[option.key]}
							onChange={(e) => handleExtraOptionChange(option.key, e.target.checked)}
						>
							{option.label}
							{option.tooltip && (
								<span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
									({option.tooltip})
								</span>
							)}
						</Checkbox>
					))}
				</Space>
			)}

			{/* 搜索框 */}
			{searchable && treeData.length > 0 && (
				<Search
					placeholder="Search..."
					allowClear
					prefix={<SearchOutlined />}
					value={searchValue}
					onChange={(e) => handleSearch(e.target.value)}
					style={{ marginBottom: 12 }}
				/>
			)}

			{/* 加载状态 */}
			{loading ? (
				<div style={{ textAlign: 'center', padding: '40px 0' }}>
					<Spin tip="Loading..." />
				</div>
			) : filteredTreeData.length > 0 ? (
				/* 树形选择器 */
				<div style={{ maxHeight: treeHeight, overflowY: 'auto' }}>
					<Tree
						checkable={checkable && multiple}
						selectable={!multiple}
						treeData={filteredTreeData}
						checkedKeys={internalCheckedKeys}
						selectedKeys={!multiple ? internalCheckedKeys : []}
						expandedKeys={expandedKeys}
						onCheck={handleTreeCheck}
						onSelect={handleTreeSelect}
						onExpand={setExpandedKeys}
						defaultExpandAll={defaultExpandAll && !searchValue}
					/>
				</div>
			) : (
				/* 空状态 */
				<Empty
					description={emptyText}
					style={{ padding: '40px 0' }}
				/>
			)}
		</Modal>
	);
}

