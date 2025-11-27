'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { Modal, Upload, Input, Select, Button, Pagination, Empty, Spin, App, Row, Col } from 'antd';
import { CheckCard } from '@ant-design/pro-components';
import { 
	UploadOutlined, 
	SearchOutlined, 
	FileOutlined,
	FilePdfOutlined,
	FileWordOutlined,
	FileExcelOutlined,
	FileZipOutlined,
	FileImageOutlined,
} from '@ant-design/icons';
import { getUploadList } from '@/app/(admin)/actions/uploads/upload-actions';

/**
 * 获取文件图标
 */
function getFileIcon(mimeType, size = 48) {
	if (!mimeType) return <FileOutlined style={{ fontSize: size, color: '#666' }} />;
	
	if (mimeType.startsWith('image/')) {
		return <FileImageOutlined style={{ fontSize: size, color: '#52c41a' }} />;
	}
	if (mimeType === 'application/pdf') {
		return <FilePdfOutlined style={{ fontSize: size, color: '#ff4d4f' }} />;
	}
	if (mimeType.includes('word') || mimeType.includes('document')) {
		return <FileWordOutlined style={{ fontSize: size, color: '#1890ff' }} />;
	}
	if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
		return <FileExcelOutlined style={{ fontSize: size, color: '#52c41a' }} />;
	}
	if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('archive')) {
		return <FileZipOutlined style={{ fontSize: size, color: '#faad14' }} />;
	}
	
	return <FileOutlined style={{ fontSize: size, color: '#666' }} />;
}

/**
 * 文件选择弹窗组件
 * 
 * 使用 ProComponents CheckCard 实现图片/文件选择
 * 参考: https://procomponents.ant.design/components/check-card
 */
export default function FileSelectModal({
	open,
	onClose,
	onSelect,
	multiple = false,
	maxCount = 9,
	accept,           // 'image/*' | 'file' | '*'
	fileType,         // 筛选类型: 'image' | 'file' | 'avatar' | 'all'
	title = 'Select Files',
}) {
	const { message } = App.useApp();
	const [isPending, startTransition] = useTransition();
	const [uploading, setUploading] = useState(false);
	const [files, setFiles] = useState([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(20);
	const [search, setSearch] = useState('');
	const [typeFilter, setTypeFilter] = useState(fileType || 'all');
	const [selectedIds, setSelectedIds] = useState([]);
	
	// 加载文件列表
	const doLoadFiles = async (targetPage, targetSearch, targetTypeFilter) => {
		startTransition(async () => {
			const result = await getUploadList({
				pageIndex: targetPage,
				pageSize,
				search: targetSearch,
				type: targetTypeFilter,
			});
			
			if (result.success) {
				setFiles(result.data || []);
				setTotal(result.total || 0);
			} else {
				message.error(result.error || 'Failed to load files');
			}
		});
	};
	
	// 打开弹窗时重置状态并加载
	useEffect(() => {
		if (open) {
			setSelectedIds([]);
			setPage(1);
			setSearch('');
			const initialType = fileType || 'all';
			setTypeFilter(initialType);
			doLoadFiles(1, '', initialType);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);
	
	// 页码变化时加载
	const handlePageChange = (newPage) => {
		setPage(newPage);
		doLoadFiles(newPage, search, typeFilter);
	};
	
	// 搜索变化（带防抖）
	const searchTimerRef = useRef(null);
	const handleSearchChange = (value) => {
		setSearch(value);
		setPage(1);
		
		// 清除之前的定时器
		if (searchTimerRef.current) {
			clearTimeout(searchTimerRef.current);
		}
		
		// 设置新的定时器
		searchTimerRef.current = setTimeout(() => {
			doLoadFiles(1, value, typeFilter);
		}, 300);
	};
	
	// 筛选变化时重置页码并加载
	const handleTypeFilterChange = (value) => {
		setTypeFilter(value);
		setPage(1);
		doLoadFiles(1, search, value);
	};
	
	// 处理文件上传
	const handleUpload = async (file) => {
		setUploading(true);
		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('type', typeFilter === 'all' ? 'file' : typeFilter);
			
			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData,
			});
			
			const result = await response.json();
			
			if (result.url) {
				message.success('File uploaded successfully');
				loadFiles(1); // 刷新列表
				setPage(1);
			} else {
				message.error(result.error || 'Upload failed');
			}
		} catch (error) {
			message.error('Upload failed: ' + error.message);
		} finally {
			setUploading(false);
		}
		
		return false; // 阻止默认上传行为
	};
	
	// 处理选择变化
	const handleSelectionChange = (checkedValue) => {
		if (multiple) {
			// 多选模式
			if (checkedValue.length > maxCount) {
				message.warning(`You can only select up to ${maxCount} files`);
				return;
			}
			setSelectedIds(checkedValue);
		} else {
			// 单选模式 - checkedValue 是单个值
			setSelectedIds(checkedValue ? [checkedValue] : []);
		}
	};
	
	// 确认选择
	const handleConfirm = () => {
		if (selectedIds.length === 0) {
			message.warning('Please select at least one file');
			return;
		}
		
		const selectedFiles = files.filter(f => selectedIds.includes(f._id));
		
		if (multiple) {
			onSelect(selectedFiles.map(f => ({
				url: f.url,
				name: f.originalName,
				key: f.key,
				mimeType: f.mimeType,
				size: f.size,
			})));
		} else {
			const file = selectedFiles[0];
			onSelect({
				url: file.url,
				name: file.originalName,
				key: file.key,
				mimeType: file.mimeType,
				size: file.size,
			});
		}
		
		onClose();
	};
	
	// 判断是否为图片
	const isImage = (file) => file.mimeType?.startsWith('image/');
	
	// 渲染 CheckCard 的 cover（图片/图标）
	const renderCover = (file) => {
		if (isImage(file)) {
			// 图片类型：显示缩略图
			return (
				<div style={{ 
					width: '100%', 
					height: 80, 
					display: 'flex', 
					alignItems: 'center', 
					justifyContent: 'center',
					overflow: 'hidden',
					background: '#f5f5f5',
				}}>
					<img
						src={file.url}
						alt={file.originalName}
						style={{
							maxWidth: '100%',
							maxHeight: '100%',
							objectFit: 'contain',
						}}
					/>
				</div>
			);
		}
		
		// 非图片类型：显示图标
		return (
			<div style={{ 
				width: '100%',
				height: 80, 
				display: 'flex', 
				alignItems: 'center', 
				justifyContent: 'center',
				background: '#f5f5f5',
			}}>
				{getFileIcon(file.mimeType, 40)}
			</div>
		);
	};
	
	return (
		<Modal
			title={title}
			open={open}
			onCancel={onClose}
			width={900}
			footer={[
				<div key="info" style={{ float: 'left', lineHeight: '32px', color: '#666' }}>
					{selectedIds.length > 0 && `Selected: ${selectedIds.length}${multiple ? ` / ${maxCount}` : ''}`}
				</div>,
				<Button key="cancel" onClick={onClose}>
					Cancel
				</Button>,
				<Button 
					key="confirm" 
					type="primary" 
					onClick={handleConfirm}
					disabled={selectedIds.length === 0}
				>
					Confirm ({selectedIds.length})
				</Button>,
			]}
		>
			{/* 工具栏 */}
			<div style={{ 
				display: 'flex', 
				gap: 12, 
				marginBottom: 16,
				flexWrap: 'wrap',
			}}>
				{/* 上传按钮 */}
				<Upload
					showUploadList={false}
					beforeUpload={handleUpload}
					accept={accept}
				>
					<Button 
						type="primary" 
						icon={<UploadOutlined />}
						loading={uploading}
					>
						Upload
					</Button>
				</Upload>
				
				{/* 搜索框 */}
				<Input
					placeholder="Search files..."
					prefix={<SearchOutlined />}
					value={search}
					onChange={(e) => handleSearchChange(e.target.value)}
					style={{ width: 200 }}
					allowClear
				/>
				
				{/* 类型筛选 */}
				<Select
					value={typeFilter}
					onChange={handleTypeFilterChange}
					style={{ width: 120 }}
					options={[
						{ value: 'all', label: 'All Files' },
						{ value: 'image', label: 'Images' },
						{ value: 'file', label: 'Documents' },
						{ value: 'avatar', label: 'Avatars' },
					]}
				/>
				
				{/* 统计信息 */}
				<div style={{ marginLeft: 'auto', lineHeight: '32px', color: '#999' }}>
					Total: {total} files
				</div>
			</div>
			
			{/* 文件列表 - 使用 CheckCard */}
			<div style={{ 
				minHeight: 300, 
				maxHeight: 450, 
				overflowY: 'auto',
				border: '1px solid #f0f0f0',
				borderRadius: 8,
				padding: 16,
			}}>
				<Spin spinning={isPending}>
					{files.length === 0 ? (
						<Empty 
							description="No files found" 
							style={{ padding: '60px 0' }}
						/>
					) : (
						<CheckCard.Group
							multiple={multiple}
							value={multiple ? selectedIds : selectedIds[0]}
							onChange={handleSelectionChange}
							style={{ width: '100%' }}
						>
							<Row gutter={[12, 12]}>
								{files.map(file => (
									<Col key={file._id} xs={12} sm={8} md={6} lg={4}>
										<CheckCard
											value={file._id}
											cover={renderCover(file)}
											title={
												<div style={{
													fontSize: 12,
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap',
													textAlign: 'center',
												}}>
													{file.originalName}
												</div>
											}
											style={{ 
												width: '100%',
												marginBottom: 0,
											}}
										/>
									</Col>
								))}
							</Row>
						</CheckCard.Group>
					)}
				</Spin>
			</div>
			
			{/* 分页 */}
			{total > pageSize && (
				<div style={{ marginTop: 16, textAlign: 'center' }}>
					<Pagination
						current={page}
						total={total}
						pageSize={pageSize}
						onChange={handlePageChange}
						showSizeChanger={false}
						showTotal={(total) => `Total ${total} files`}
					/>
				</div>
			)}
		</Modal>
	);
}
