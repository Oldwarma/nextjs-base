'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, App, Popconfirm } from 'antd';
import { InboxOutlined, UploadOutlined, HolderOutlined, DeleteOutlined, PaperClipOutlined, LoadingOutlined } from '@ant-design/icons';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * 可拖拽的文件项组件
 */
const SortableFileItem = ({ id, file, deleting, onRemove }) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });
	
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};
	
	const fileName = file.name || (typeof file.url === 'string' ? file.url.split('/').pop() : 'file');
	const fileUrl = file.url;
	const isUploading = file.status === 'uploading';
	
	return (
		<div
			ref={setNodeRef}
			style={{
				...style,
				display: 'flex',
				alignItems: 'center',
				padding: '8px 12px',
				background: '#fafafa',
				border: '1px solid #d9d9d9',
				borderRadius: 6,
				marginBottom: 8,
			}}
		>
			<span
				{...attributes}
				{...listeners}
				style={{ cursor: 'grab', marginRight: 8, color: '#999' }}
			>
				<HolderOutlined />
			</span>
			{isUploading ? (
				<LoadingOutlined style={{ marginRight: 8, color: '#1890ff' }} />
			) : (
				<PaperClipOutlined style={{ marginRight: 8, color: '#1890ff' }} />
			)}
			<span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
				{isUploading ? (
					<span style={{ color: '#999' }}>{fileName} (uploading...)</span>
				) : (
					<a href={fileUrl} target="_blank" rel="noopener noreferrer">
						{fileName}
					</a>
				)}
			</span>
			{!isUploading && (
				<Popconfirm
					title="Delete file"
					description="Are you sure you want to delete this file?"
					onConfirm={() => onRemove(id, fileUrl)}
					okText="Yes"
					cancelText="No"
					okButtonProps={{ danger: true, loading: deleting }}
				>
					<DeleteOutlined
						style={{ color: '#ff4d4f', cursor: deleting ? 'wait' : 'pointer', marginLeft: 8 }}
					/>
				</Popconfirm>
			)}
		</div>
	);
};

/**
 * 文件上传组件
 * 支持拖拽上传、拖拽排序、按钮上传
 */
export default function FileUpload({ 
	value, 
	onChange,
	max = 5,
	accept,
	maxSize = 10,
	dragger = false,
	directory,
	description = 'Click or drag file to this area to upload',
	hint = 'Support for a single or bulk upload.',
	fieldProps = {},
}) {
	const { message } = App.useApp();
	const [fileList, setFileList] = useState([]);
	const [uploadingCount, setUploadingCount] = useState(0);
	const [deletingUid, setDeletingUid] = useState(null);
	const isInitializedRef = useRef(false);
	
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);
	
	// 保存 onChange 的引用
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;
	
	// 初始化
	useEffect(() => {
		if (isInitializedRef.current) return;
		isInitializedRef.current = true;
		
		if (Array.isArray(value) && value.length > 0) {
			const newFileList = value
				.filter(item => item)
				.map((item, index) => {
					if (typeof item === 'string') {
						return {
							uid: `existing-${index}-${Date.now()}`,
							url: item,
							name: item.split('/').pop(),
							status: 'done',
						};
					}
					return {
						uid: `existing-${index}-${Date.now()}`,
						url: item.url,
						name: item.name || item.url?.split('/').pop(),
						status: 'done',
					};
				})
				.filter(f => f.url);
			setFileList(newFileList);
		}
	}, [value]);
	
	// 同步到表单
	const prevValueRef = useRef('');
	useEffect(() => {
		const files = fileList
			.filter(f => f.status === 'done' && f.url)
			.map(f => ({ name: f.name, url: f.url }));
		
		const valueStr = JSON.stringify(files);
		if (valueStr !== prevValueRef.current) {
			prevValueRef.current = valueStr;
			onChangeRef.current?.(files);
		}
	}, [fileList]);
	
	// 上传前验证
	const beforeUpload = (file) => {
		// 检查文件类型
		if (accept) {
			const acceptList = accept.split(',').map(s => s.trim());
			const fileExt = '.' + file.name.split('.').pop().toLowerCase();
			const isAccepted = acceptList.some(a => {
				if (a.startsWith('.')) {
					return fileExt === a.toLowerCase();
				}
				if (a.includes('*')) {
					const [type] = a.split('/');
					return file.type.startsWith(type);
				}
				return file.type === a;
			});
			if (!isAccepted) {
				message.error(`File type not supported! Accepted: ${accept}`);
				return Upload.LIST_IGNORE;
			}
		}
		
		// 检查文件大小
		const isLtSize = file.size / 1024 / 1024 < maxSize;
		if (!isLtSize) {
			message.error(`File must be smaller than ${maxSize}MB!`);
			return Upload.LIST_IGNORE;
		}
		
		return true;
	};
	
	// 自定义上传
	const customRequest = async ({ file, onSuccess, onError }) => {
		setUploadingCount(prev => prev + 1);
		
		const tempUid = `uploading-${Date.now()}-${Math.random()}`;
		const tempFile = {
			uid: tempUid,
			name: file.name,
			status: 'uploading',
			url: '',
		};
		
		setFileList(prev => [...prev, tempFile]);
		
		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('type', 'file');
			if (directory) {
				formData.append('directory', directory);
			}
			
			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData,
			});
			
			const result = await response.json();
			
			if (result.success) {
				setFileList(prev => prev.map(f => {
					if (f.uid === tempUid) {
						return {
							...f,
							uid: `uploaded-${Date.now()}-${Math.random()}`,
							url: result.url,
							status: 'done',
						};
					}
					return f;
				}));
				onSuccess(result, file);
			} else {
				setFileList(prev => prev.filter(f => f.uid !== tempUid));
				message.error(result.error || 'Upload failed');
				onError(new Error(result.error));
			}
		} catch (error) {
			setFileList(prev => prev.filter(f => f.uid !== tempUid));
			message.error('Upload failed: ' + error.message);
			onError(error);
		} finally {
			setUploadingCount(prev => prev - 1);
		}
	};
	
	// 处理拖拽排序
	const handleDragEnd = (event) => {
		const { active, over } = event;
		
		if (active.id !== over?.id) {
			const oldIndex = fileList.findIndex(item => item.uid === active.id);
			const newIndex = fileList.findIndex(item => item.uid === over.id);
			
			const newFileList = arrayMove(fileList, oldIndex, newIndex);
			setFileList(newFileList);
		}
	};
	
	// 删除文件（调用 API 删除 R2 和数据库记录）
	const handleRemove = async (uid, url) => {
		if (!url) {
			setFileList(prev => prev.filter(f => f.uid !== uid));
			return;
		}
		
		setDeletingUid(uid);
		try {
			const response = await fetch('/api/upload', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url }),
			});
			
			const result = await response.json();
			
			if (result.success) {
				setFileList(prev => prev.filter(f => f.uid !== uid));
				message.success('File deleted successfully');
			} else {
				if (result.error === 'File not found') {
					setFileList(prev => prev.filter(f => f.uid !== uid));
					message.info('File removed');
				} else {
					message.error(result.error || 'Failed to delete file');
				}
			}
		} catch (error) {
			message.error('Failed to delete file: ' + error.message);
		} finally {
			setDeletingUid(null);
		}
	};
	
	const uploadProps = {
		multiple: max > 1,
		accept,
		showUploadList: false,
		beforeUpload,
		customRequest,
		...fieldProps,
	};
	
	// 拖拽上传区域样式
	if (dragger) {
		return (
			<div>
				{fileList.length < max && (
					<Upload.Dragger {...uploadProps}>
						<p className="ant-upload-drag-icon">
							<InboxOutlined />
						</p>
						<p className="ant-upload-text">{description}</p>
						<p className="ant-upload-hint">{hint}</p>
					</Upload.Dragger>
				)}
				{fileList.length > 0 && (
					<div style={{ marginTop: 16 }}>
						<DndContext
							sensors={sensors}
							collisionDetection={closestCenter}
							onDragEnd={handleDragEnd}
						>
							<SortableContext
								items={fileList.map(f => f.uid)}
								strategy={verticalListSortingStrategy}
							>
								{fileList.map((file) => (
									<SortableFileItem
										key={file.uid}
										id={file.uid}
										file={file}
										deleting={deletingUid === file.uid}
										onRemove={handleRemove}
									/>
								))}
							</SortableContext>
						</DndContext>
					</div>
				)}
			</div>
		);
	}
	
	// 按钮上传样式
	return (
		<div>
			{fileList.length < max && (
				<Upload {...uploadProps}>
					<button
						type="button"
						style={{
							border: '1px solid #d9d9d9',
							background: '#fff',
							borderRadius: 6,
							padding: '4px 15px',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							gap: 8,
						}}
					>
						{uploadingCount > 0 ? <LoadingOutlined /> : <UploadOutlined />}
						{uploadingCount > 0 ? `Uploading (${uploadingCount})` : 'Upload'}
					</button>
				</Upload>
			)}
			{fileList.length > 0 && (
				<div style={{ marginTop: 12 }}>
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext
							items={fileList.map(f => f.uid)}
							strategy={verticalListSortingStrategy}
						>
							{fileList.map((file) => (
								<SortableFileItem
									key={file.uid}
									id={file.uid}
									file={file}
									deleting={deletingUid === file.uid}
									onRemove={handleRemove}
								/>
							))}
						</SortableContext>
					</DndContext>
				</div>
			)}
		</div>
	);
}

