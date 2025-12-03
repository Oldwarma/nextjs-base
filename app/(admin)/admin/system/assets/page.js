'use client';

import React, { useState, useTransition, useEffect } from 'react';
import {
	Card,
	Button,
	Input,
	Select,
	Upload,
	Pagination,
	Empty,
	Spin,
	App,
	Row,
	Col,
	Popconfirm,
	Modal,
	Descriptions,
	Space,
	Checkbox,
	Tooltip,
} from 'antd';
import { CheckCard } from '@ant-design/pro-components';
import {
	UploadOutlined,
	SearchOutlined,
	DeleteOutlined,
	EyeOutlined,
	FileOutlined,
	FilePdfOutlined,
	FileWordOutlined,
	FileExcelOutlined,
	FileZipOutlined,
	FileImageOutlined,
	ReloadOutlined,
	CopyOutlined,
} from '@ant-design/icons';
import * as uploadActions from '@/app/(admin)/actions/system/crud-action.assets';

// ============================================
// 工具函数
// ============================================

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
 * 格式化文件大小
 */
function formatFileSize(bytes) {
	if (!bytes) return '-';
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * 格式化日期
 */
function formatDate(date) {
	if (!date) return '-';
	const d = new Date(date);
	return d.toLocaleString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	});
}

/**
 * 判断是否为图片
 */
function isImage(file) {
	return file.mimeType?.startsWith('image/');
}

/**
 * 获取文件唯一标识（兼容 id 和 _id）
 */
function getFileId(file) {
	return file.id || file._id;
}

// ============================================
// 文件类型筛选选项
// ============================================
const FILE_TYPE_OPTIONS = [
	{ value: 'all', label: 'All Files' },
	{ value: 'image', label: 'Images' },
	{ value: 'file', label: 'Documents' },
	{ value: 'avatar', label: 'Avatars' },
];

// ============================================
// 素材管理页面
// ============================================
export default function AssetsPage() {
	const { message } = App.useApp();
	const [isPending, startTransition] = useTransition();
	const [uploading, setUploading] = useState(false);

	// 数据状态
	const [files, setFiles] = useState([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(24);

	// 筛选状态
	const [search, setSearch] = useState('');
	const [typeFilter, setTypeFilter] = useState('all');

	// 选择状态
	const [selectedIds, setSelectedIds] = useState([]);

	// 弹窗状态
	const [previewFile, setPreviewFile] = useState(null);
	const [detailFile, setDetailFile] = useState(null);

	// ============================================
	// 数据加载
	// ============================================

	/**
	 * 加载文件列表
	 */
	const loadFiles = async (targetPage = page, targetSearch = search, targetType = typeFilter) => {
		startTransition(async () => {
			// 构建搜索条件 (Prisma 格式)
			const whereJson = {};

			if (targetSearch) {
				whereJson.originalName = { contains: targetSearch, mode: 'insensitive' };
			}

			if (targetType && targetType !== 'all') {
				if (targetType === 'image') {
					whereJson.type = { in: ['image', 'images'] };
				} else {
					whereJson.type = targetType;
				}
			}

			const result = await uploadActions.getList({
				pageIndex: targetPage,
				pageSize,
				whereJson,
			});

			if (result.success) {
				setFiles(result.data || []);
				setTotal(result.total || 0);
			} else {
				message.error(result.error || 'Failed to load files');
			}
		});
	};

	// 初始加载
	useEffect(() => {
		loadFiles(1, '', 'all');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// ============================================
	// 事件处理
	// ============================================

	/**
	 * 页码变化
	 */
	const handlePageChange = (newPage) => {
		setPage(newPage);
		setSelectedIds([]);
		loadFiles(newPage, search, typeFilter);
	};

	/**
	 * 搜索输入变化（只更新状态，不触发搜索）
	 */
	const handleSearchChange = (e) => {
		setSearch(e.target.value);
	};

	/**
	 * 执行搜索（点击按钮或按回车时触发）
	 * @param {string} value - 搜索值（Input.Search 的 onSearch 会传入当前值）
	 */
	const handleSearch = (value) => {
		// 使用传入的 value，确保清空时使用空字符串
		const searchValue = value ?? '';
		setSearch(searchValue);
		setPage(1);
		setSelectedIds([]);
		loadFiles(1, searchValue, typeFilter);
	};

	/**
	 * 类型筛选变化
	 */
	const handleTypeFilterChange = (value) => {
		setTypeFilter(value);
		setPage(1);
		setSelectedIds([]);
		loadFiles(1, search, value);
	};

	/**
	 * 刷新
	 */
	const handleRefresh = () => {
		setSelectedIds([]);
		loadFiles(page, search, typeFilter);
	};

	/**
	 * 上传文件
	 */
	const handleUpload = async (file, fileList) => {
		if (fileList && fileList.length > 3) {
			message.error('You can only upload up to 3 files at a time');
			return Upload.LIST_IGNORE;
		}

		const isImageType = file.type?.startsWith('image/');
		const limitMB = isImageType ? 2 : 10;
		if (file.size > limitMB * 1024 * 1024) {
			message.error(`File too large. ${isImageType ? 'Images' : 'Files'} must be <= ${limitMB}MB.`);
			return Upload.LIST_IGNORE;
		}

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
				message.success('Upload successful');
				setPage(1);
				loadFiles(1, search, typeFilter);
			} else {
				message.error(result.error || 'Upload failed');
			}
		} catch (error) {
			message.error('Upload failed: ' + error.message);
		} finally {
			setUploading(false);
		}

		return false;
	};

	/**
	 * 删除单个文件
	 */
	const handleDelete = async (file) => {
		const result = await uploadActions.remove(getFileId(file));
		if (result.success) {
			message.success('Deleted successfully');
			loadFiles(page, search, typeFilter);
		} else {
			message.error(result.error || 'Delete failed');
		}
	};

	/**
	 * 批量删除
	 */
	const handleBatchDelete = async () => {
		if (selectedIds.length === 0) {
			message.warning('Please select files to delete');
			return;
		}

		const result = await uploadActions.batchDelete({ ids: selectedIds });
		if (result.success) {
			message.success(`Deleted ${result.deletedCount} files`);
			setSelectedIds([]);
			loadFiles(page, search, typeFilter);
		} else {
			message.error(result.error || 'Batch delete failed');
			if (result.deletedCount > 0) {
				loadFiles(page, search, typeFilter);
			}
		}
	};

	/**
	 * 选择/取消选择
	 */
	const handleSelect = (fileId) => {
		setSelectedIds((prev) => {
			if (prev.includes(fileId)) {
				return prev.filter((id) => id !== fileId);
			}
			return [...prev, fileId];
		});
	};

	/**
	 * 全选/取消全选
	 */
	const handleSelectAll = () => {
		if (selectedIds.length === files.length) {
			setSelectedIds([]);
		} else {
			setSelectedIds(files.map((f) => getFileId(f)));
		}
	};

	/**
	 * 复制链接
	 */
	const handleCopyUrl = (url) => {
		navigator.clipboard
			.writeText(url)
			.then(() => {
				message.success('URL copied to clipboard');
			})
			.catch(() => {
				message.error('Failed to copy URL');
			});
	};

	// ============================================
	// 渲染函数
	// ============================================

	/**
	 * 渲染 CheckCard 的 cover（图片/图标）
	 */
	const renderCover = (file) => {
		if (isImage(file)) {
			return (
				<div
					style={{
						width: '100%',
						height: 100,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						overflow: 'hidden',
						background: '#f5f5f5',
					}}
				>
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

		return (
			<div
				style={{
					width: '100%',
					height: 100,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					background: '#f5f5f5',
				}}
			>
				{getFileIcon(file.mimeType, 40)}
			</div>
		);
	};

	/**
	 * 渲染文件卡片
	 */
	const FileCard = ({ file }) => {
		const [isHovered, setIsHovered] = useState(false);
		const fileId = getFileId(file);
		const isSelected = selectedIds.includes(fileId);

		return (
			<div
				style={{
					position: 'relative',
					border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
					borderRadius: 8,
					overflow: 'hidden',
					background: isSelected ? '#e6f7ff' : '#fff',
					cursor: 'pointer',
					transition: 'all 0.2s',
				}}
				onClick={() => handleSelect(fileId)}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				{/* 选择框 */}
				<div style={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>
					<Checkbox
						checked={isSelected}
						onClick={(e) => e.stopPropagation()}
						onChange={() => handleSelect(fileId)}
					/>
				</div>

				{/* 缩略图/图标 */}
				{renderCover(file)}

				{/* 文件名 */}
				<div
					style={{
						padding: '8px 12px',
						borderTop: '1px solid #f0f0f0',
					}}
				>
					<Tooltip title={file.originalName}>
						<div
							style={{
								fontSize: 12,
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
								marginBottom: 4,
							}}
						>
							{file.originalName}
						</div>
					</Tooltip>
					<div
						style={{
							fontSize: 11,
							color: '#999',
							display: 'flex',
							justifyContent: 'space-between',
						}}
					>
						<span>{formatFileSize(file.size)}</span>
						<span>{file.type}</span>
					</div>
				</div>

				{/* 操作按钮 - hover 时显示 */}
				<div
					style={{
						position: 'absolute',
						top: 8,
						right: 8,
						display: 'flex',
						gap: 2,
						opacity: isHovered ? 1 : 0,
						transition: 'opacity 0.2s',
					}}
					onClick={(e) => e.stopPropagation()}
				>
					{isImage(file) && (
						<Tooltip title='Preview'>
							<Button
								type='text'
								size='small'
								icon={<EyeOutlined />}
								style={{ background: 'rgba(255,255,255,0.9)' }}
								onClick={() => setPreviewFile(file)}
							/>
						</Tooltip>
					)}
					<Tooltip title='Details'>
						<Button
							type='text'
							size='small'
							icon={<FileOutlined />}
							style={{ background: 'rgba(255,255,255,0.9)' }}
							onClick={() => setDetailFile(file)}
						/>
					</Tooltip>
					<Tooltip title='Copy URL'>
						<Button
							type='text'
							size='small'
							icon={<CopyOutlined />}
							style={{ background: 'rgba(255,255,255,0.9)' }}
							onClick={() => handleCopyUrl(file.url)}
						/>
					</Tooltip>
					<Popconfirm
						title='Delete this file?'
						description='This will permanently delete the file from storage.'
						onConfirm={() => handleDelete(file)}
						okText='Delete'
						cancelText='Cancel'
						okButtonProps={{ danger: true }}
					>
						<Tooltip title='Delete'>
							<Button
								type='text'
								size='small'
								danger
								icon={<DeleteOutlined />}
								style={{ background: 'rgba(255,255,255,0.9)' }}
							/>
						</Tooltip>
					</Popconfirm>
				</div>
			</div>
		);
	};

	// ============================================
	// 主渲染
	// ============================================

	return (
		<div>
			<Card
				title='Assets Management'
				extra={
					<Upload
						showUploadList={false}
						beforeUpload={handleUpload}
						multiple
					>
						<Button
							type='primary'
							icon={<UploadOutlined />}
							loading={uploading}
						>
							Upload
						</Button>
					</Upload>
				}
			>
				{/* 工具栏 */}
				<div
					style={{
						display: 'flex',
						gap: 12,
						marginBottom: 16,
						flexWrap: 'wrap',
						alignItems: 'center',
					}}
				>
					{/* 全选 */}
					<Checkbox
						checked={files.length > 0 && selectedIds.length === files.length}
						indeterminate={selectedIds.length > 0 && selectedIds.length < files.length}
						onChange={handleSelectAll}
					>
						Select All
					</Checkbox>

					{/* 批量删除 */}
					{selectedIds.length > 0 && (
						<Popconfirm
							title={`Delete ${selectedIds.length} files?`}
							description='This will permanently delete the selected files from storage.'
							onConfirm={handleBatchDelete}
							okText='Delete'
							cancelText='Cancel'
							okButtonProps={{ danger: true }}
						>
							<Button
								danger
								icon={<DeleteOutlined />}
							>
								Delete ({selectedIds.length})
							</Button>
						</Popconfirm>
					)}

					<div style={{ flex: 1 }} />

					{/* 搜索框 */}
					<Space.Compact>
						<Input
							placeholder='Search files...'
							value={search}
							onChange={handleSearchChange}
							onPressEnter={() => handleSearch(search)}
							style={{ width: 200 }}
							allowClear
						/>
						<Button 
							type='primary' 
							icon={<SearchOutlined />}
							onClick={() => handleSearch(search)}
						/>
					</Space.Compact>

					{/* 类型筛选 */}
					<Select
						value={typeFilter}
						onChange={handleTypeFilterChange}
						style={{ width: 120 }}
						options={FILE_TYPE_OPTIONS}
					/>

					{/* 刷新 */}
					<Button
						icon={<ReloadOutlined />}
						onClick={handleRefresh}
						loading={isPending}
					/>

					{/* 统计信息 */}
					<span style={{ color: '#999' }}>Total: {total} files</span>
				</div>

				{/* 文件列表 */}
				<div
					style={{
						minHeight: 300,
						border: '1px solid #f0f0f0',
						borderRadius: 8,
						padding: 16,
					}}
				>
					<Spin spinning={isPending}>
						{files.length === 0 ? (
							<Empty
								description='No files found'
								style={{ padding: '60px 0' }}
							/>
						) : (
							<Row gutter={[12, 12]}>
								{files.map((file) => (
									<Col
										key={getFileId(file)}
										xs={12}
										sm={8}
										md={6}
										lg={4}
										xl={3}
									>
										<FileCard file={file} />
									</Col>
								))}
							</Row>
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
			</Card>

			{/* 图片预览 Modal */}
			<Modal
				open={!!previewFile}
				title={previewFile?.originalName}
				footer={null}
				onCancel={() => setPreviewFile(null)}
				width={800}
				centered
			>
				{previewFile && (
					<div style={{ textAlign: 'center' }}>
						<img
							src={previewFile.url}
							alt={previewFile.originalName}
							style={{ maxWidth: '100%', maxHeight: '70vh' }}
						/>
					</div>
				)}
			</Modal>

			{/* 详情 Modal */}
			<Modal
				open={!!detailFile}
				title='File Details'
				footer={[
					<Button
						key='copy'
						icon={<CopyOutlined />}
						onClick={() => handleCopyUrl(detailFile?.url)}
					>
						Copy URL
					</Button>,
					<Button
						key='close'
						onClick={() => setDetailFile(null)}
					>
						Close
					</Button>,
				]}
				onCancel={() => setDetailFile(null)}
				width={600}
			>
				{detailFile && (
					<Descriptions
						column={1}
						bordered
						size='small'
					>
						<Descriptions.Item label='File Name'>{detailFile.originalName}</Descriptions.Item>
						<Descriptions.Item label='Type'>{detailFile.type}</Descriptions.Item>
						<Descriptions.Item label='MIME Type'>{detailFile.mimeType}</Descriptions.Item>
						<Descriptions.Item label='Size'>{formatFileSize(detailFile.size)}</Descriptions.Item>
						<Descriptions.Item label='Directory'>{detailFile.directory}</Descriptions.Item>
						<Descriptions.Item label='URL'>
							<a
								href={detailFile.url}
								target='_blank'
								rel='noopener noreferrer'
								style={{ wordBreak: 'break-all' }}
							>
								{detailFile.url}
							</a>
						</Descriptions.Item>
						<Descriptions.Item label='Uploaded At'>{formatDate(detailFile.createdAt)}</Descriptions.Item>
						<Descriptions.Item label='User ID'>{detailFile.userId || '-'}</Descriptions.Item>
					</Descriptions>
				)}
			</Modal>
		</div>
	);
}
