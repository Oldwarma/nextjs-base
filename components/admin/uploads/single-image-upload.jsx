'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, Modal, App, Popconfirm } from 'antd';
import { PlusOutlined, LoadingOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';

/**
 * 单图上传组件
 * 支持预览、删除确认、尺寸/体积/格式限制
 */
export default function SingleImageUpload({ 
	value, 
	onChange,
	accept = 'image/*',
	maxSize = 10,
	width,
	height,
	directory,
	fieldProps = {},
}) {
	const { message } = App.useApp();
	const [imageUrl, setImageUrl] = useState('');
	const [loading, setLoading] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [previewOpen, setPreviewOpen] = useState(false);
	const isInitializedRef = useRef(false);
	
	// 保存 onChange 的引用
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;
	
	// 初始化
	useEffect(() => {
		if (isInitializedRef.current) return;
		isInitializedRef.current = true;
		
		if (value) {
			setImageUrl(value);
		}
	}, [value]);
	
	// 同步到表单
	const prevUrlRef = useRef('');
	useEffect(() => {
		if (imageUrl !== prevUrlRef.current) {
			prevUrlRef.current = imageUrl;
			onChangeRef.current?.(imageUrl || undefined);
		}
	}, [imageUrl]);
	
	// 上传前验证
	const beforeUpload = (file) => {
		// 检查文件类型
		const isImage = file.type.startsWith('image/');
		if (!isImage) {
			message.error('You can only upload image files!');
			return Upload.LIST_IGNORE;
		}
		
		// 检查文件大小
		const isLtSize = file.size / 1024 / 1024 < maxSize;
		if (!isLtSize) {
			message.error(`Image must be smaller than ${maxSize}MB!`);
			return Upload.LIST_IGNORE;
		}
		
		// 如果需要检查尺寸
		if (width || height) {
			return new Promise((resolve, reject) => {
				const img = new Image();
				img.src = URL.createObjectURL(file);
				img.onload = () => {
					URL.revokeObjectURL(img.src);
					if (width && img.width !== width) {
						message.error(`Image width must be ${width}px!`);
						reject(Upload.LIST_IGNORE);
						return;
					}
					if (height && img.height !== height) {
						message.error(`Image height must be ${height}px!`);
						reject(Upload.LIST_IGNORE);
						return;
					}
					resolve(true);
				};
				img.onerror = () => {
					message.error('Failed to load image!');
					reject(Upload.LIST_IGNORE);
				};
			});
		}
		
		return true;
	};
	
	// 自定义上传
	const customRequest = async ({ file, onSuccess, onError }) => {
		setLoading(true);
		
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
				setImageUrl(result.url);
				onSuccess(result, file);
			} else {
				message.error(result.error || 'Upload failed');
				onError(new Error(result.error));
			}
		} catch (error) {
			message.error('Upload failed: ' + error.message);
			onError(error);
		} finally {
			setLoading(false);
		}
	};
	
	// 删除图片（调用 API 删除 R2 和数据库记录）
	const handleRemove = async () => {
		if (!imageUrl) return;
		
		setDeleting(true);
		try {
			const response = await fetch('/api/upload', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: imageUrl }),
			});
			
			const result = await response.json();
			
			if (result.success) {
				setImageUrl('');
				message.success('Image deleted successfully');
			} else {
				// 如果删除失败（如文件不存在），也清除本地状态
				if (result.error === 'File not found') {
					setImageUrl('');
					message.info('Image removed');
				} else {
					message.error(result.error || 'Failed to delete image');
				}
			}
		} catch (error) {
			message.error('Failed to delete image: ' + error.message);
		} finally {
			setDeleting(false);
		}
	};
	
	// 预览图片
	const handlePreview = () => {
		setPreviewOpen(true);
	};
	
	const uploadButton = (
		<div style={{
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
		}}>
			{loading ? <LoadingOutlined /> : <PlusOutlined />}
			<div style={{ marginTop: 8 }}>{loading ? 'Uploading' : 'Upload'}</div>
		</div>
	);
	
	return (
		<>
			{imageUrl ? (
				<div
					style={{
						position: 'relative',
						width: 104,
						height: 104,
						border: '1px solid #d9d9d9',
						borderRadius: 8,
						overflow: 'hidden',
						background: '#fafafa',
					}}
				>
					<img
						src={imageUrl}
						alt="preview"
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'cover',
						}}
					/>
					{/* 操作遮罩 */}
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
						onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
						onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
					>
					<EyeOutlined
						style={{ color: '#fff', fontSize: 16, cursor: 'pointer' }}
						onClick={handlePreview}
					/>
					<Popconfirm
						title="Delete image"
						description="Are you sure you want to delete this image?"
						onConfirm={handleRemove}
						okText="Yes"
						cancelText="No"
						okButtonProps={{ danger: true, loading: deleting }}
					>
						<DeleteOutlined
							style={{ color: '#fff', fontSize: 16, cursor: deleting ? 'wait' : 'pointer' }}
						/>
					</Popconfirm>
					</div>
				</div>
			) : (
				<Upload
					listType="picture-card"
					showUploadList={false}
					accept={accept}
					beforeUpload={beforeUpload}
					customRequest={customRequest}
					{...fieldProps}
				>
					{uploadButton}
				</Upload>
			)}
			<Modal
				open={previewOpen}
				title="Preview"
				footer={null}
				onCancel={() => setPreviewOpen(false)}
			>
				<img alt="preview" style={{ width: '100%' }} src={imageUrl} />
			</Modal>
		</>
	);
}

