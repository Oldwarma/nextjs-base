'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, Modal, App, Popconfirm } from 'antd';
import { PlusOutlined, HolderOutlined, DeleteOutlined, EyeOutlined, LoadingOutlined } from '@ant-design/icons';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import nb from '@/lib/function';

/**
 * 可拖拽的图片项组件
 */
const SortableImageItem = ({ id, url, uploading, deleting, onRemove, onPreview }) => {
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
	
	return (
		<div
			ref={setNodeRef}
			style={{
				...style,
				position: 'relative',
				width: 104,
				height: 104,
				border: '1px solid #d9d9d9',
				borderRadius: 8,
				overflow: 'hidden',
				background: '#fafafa',
			}}
		>
			{uploading ? (
				<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<LoadingOutlined style={{ fontSize: 24 }} />
				</div>
			) : (
				<img
					src={url}
					alt="preview"
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
					}}
				/>
			)}
			{/* 操作遮罩 */}
			{!uploading && (
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: 'rgba(0,0,0,0.5)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 8,
						opacity: 0,
						transition: 'opacity 0.2s',
					}}
					className="image-item-mask"
					onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
					onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
				>
					<EyeOutlined
						style={{ color: '#fff', fontSize: 16, cursor: 'pointer' }}
						onClick={() => onPreview(url)}
					/>
					<Popconfirm
						title="Delete image"
						description="Are you sure you want to delete this image?"
						onConfirm={() => onRemove(id, url)}
						okText="Yes"
						cancelText="No"
						okButtonProps={{ danger: true, loading: deleting }}
					>
						<DeleteOutlined
							style={{ color: '#fff', fontSize: 16, cursor: deleting ? 'wait' : 'pointer' }}
						/>
					</Popconfirm>
					<HolderOutlined
						{...attributes}
						{...listeners}
						style={{ color: '#fff', fontSize: 16, cursor: 'grab' }}
					/>
				</div>
			)}
		</div>
	);
};

/**
 * 多图上传组件
 * 支持拖拽排序、预览、删除
 */
export default function MultiImageUpload({ 
	value, 
	onChange,
	max = 9,
	accept = 'image/*',
	maxSize = 10,
	directory,
	fieldProps = {},
}) {
	const { message } = App.useApp();
	const [fileList, setFileList] = useState([]);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [previewImage, setPreviewImage] = useState('');
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
	
	// 保存 onChange 的引用，避免依赖变化
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;
	
	// 初始化：只在组件首次挂载时从 value 初始化 fileList
	useEffect(() => {
		if (isInitializedRef.current) return;
		isInitializedRef.current = true;
		
		if (nb.pubfn.isArray(value) && value.length > 0) {
			const newFileList = value
				.filter(item => item)
				.map((item, index) => {
					const url = nb.pubfn.isString(item) ? item : (item?.url || '');
					return {
						uid: `existing-${index}-${Date.now()}`,
						url,
						status: 'done',
						name: `image-${index}`,
					};
				})
				.filter(f => f.url);
			setFileList(newFileList);
		}
	}, [value]);
	
	// 当 fileList 变化时，同步到表单
	const prevUrlsRef = useRef('');
	useEffect(() => {
		const urls = fileList
			.filter(f => f.status === 'done' && f.url)
			.map(f => f.url);
		
		const urlsStr = JSON.stringify(urls);
		if (urlsStr !== prevUrlsRef.current) {
			prevUrlsRef.current = urlsStr;
			onChangeRef.current?.(urls);
		}
	}, [fileList]);
	
	// 上传前验证
	const beforeUpload = (file) => {
		const isImage = file.type.startsWith('image/');
		if (!isImage) {
			message.error('You can only upload image files!');
			return Upload.LIST_IGNORE;
		}
		
		const isLtSize = file.size / 1024 / 1024 < maxSize;
		if (!isLtSize) {
			message.error(`Image must be smaller than ${maxSize}MB!`);
			return Upload.LIST_IGNORE;
		}
		
		return true;
	};
	
	// 自定义上传请求
	const customRequest = async ({ file, onSuccess, onError }) => {
		setUploadingCount(prev => prev + 1);
		
		const tempUid = `uploading-${Date.now()}-${Math.random()}`;
		const tempFile = {
			uid: tempUid,
			name: file.name,
			status: 'uploading',
			url: URL.createObjectURL(file),
		};
		
		setFileList(prev => [...prev, tempFile]);
		
		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('type', 'image');
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
	
	// 删除图片（调用 API 删除 R2 和数据库记录）
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
				message.success('Image deleted successfully');
			} else {
				if (result.error === 'File not found') {
					setFileList(prev => prev.filter(f => f.uid !== uid));
					message.info('Image removed');
				} else {
					message.error(result.error || 'Failed to delete image');
				}
			}
		} catch (error) {
			message.error('Failed to delete image: ' + error.message);
		} finally {
			setDeletingUid(null);
		}
	};
	
	// 预览图片
	const handlePreview = (url) => {
		setPreviewImage(url);
		setPreviewOpen(true);
	};
	
	const uploadButton = (
		<div style={{
			width: 104,
			height: 104,
			border: '1px dashed #d9d9d9',
			borderRadius: 8,
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			cursor: 'pointer',
			background: '#fafafa',
		}}>
			{uploadingCount > 0 ? <LoadingOutlined /> : <PlusOutlined />}
			<div style={{ marginTop: 8 }}>{uploadingCount > 0 ? `Uploading (${uploadingCount})` : 'Upload'}</div>
		</div>
	);
	
	return (
		<>
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={fileList.map(f => f.uid)}
					strategy={rectSortingStrategy}
				>
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
						{fileList.map((file) => (
							<SortableImageItem
								key={file.uid}
								id={file.uid}
								url={file.url}
								uploading={file.status === 'uploading'}
								deleting={deletingUid === file.uid}
								onRemove={handleRemove}
								onPreview={handlePreview}
							/>
						))}
						{fileList.length < max && (
							<Upload
								listType="picture-card"
								showUploadList={false}
								multiple={max > 1}
								accept={accept}
								beforeUpload={beforeUpload}
								customRequest={customRequest}
								{...fieldProps}
							>
								{uploadButton}
							</Upload>
						)}
					</div>
				</SortableContext>
			</DndContext>
			<Modal
				open={previewOpen}
				title="Preview"
				footer={null}
				onCancel={() => setPreviewOpen(false)}
			>
				<img alt="preview" style={{ width: '100%' }} src={previewImage} />
			</Modal>
		</>
	);
}

