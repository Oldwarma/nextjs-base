'use client';

import React, { useState, useEffect, useRef } from 'react';
import { App, Modal } from 'antd';
import { 
	PlusOutlined, 
	EyeOutlined, 
	DeleteOutlined, 
	HolderOutlined,
	UserOutlined,
	FileOutlined,
	FilePdfOutlined,
	FileWordOutlined,
	FileExcelOutlined,
	FileZipOutlined,
} from '@ant-design/icons';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import FileSelectModal from './file-select-modal';

/**
 * 获取文件图标
 */
function getFileIcon(mimeType, size = 24) {
	if (!mimeType) return <FileOutlined style={{ fontSize: size }} />;
	
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

// ========== 可拖拽的图片项组件（file-select 模式，移除只是取消选择，不删除文件） ==========
const SortableImageItem = ({ id, url, onRemove, onPreview }) => {
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
			<img
				src={url}
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
					onClick={() => onPreview(url)}
				/>
				{/* 直接移除，不需要确认（只是取消选择，不删除文件） */}
				<DeleteOutlined
					style={{ color: '#fff', fontSize: 16, cursor: 'pointer' }}
					onClick={() => onRemove(id)}
					title="Remove from selection"
				/>
				<HolderOutlined
					{...attributes}
					{...listeners}
					style={{ color: '#fff', fontSize: 16, cursor: 'grab' }}
				/>
			</div>
		</div>
	);
};

// ========== 可拖拽的文件项组件（file-select 模式，移除只是取消选择，不删除文件） ==========
const SortableFileItem = ({ id, file, onRemove }) => {
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
			{getFileIcon(file.mimeType)}
			<span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: 8 }}>
				<a href={fileUrl} target="_blank" rel="noopener noreferrer">
					{fileName}
				</a>
			</span>
			{/* 直接移除，不需要确认（只是取消选择，不删除文件） */}
			<DeleteOutlined
				style={{ color: '#ff4d4f', cursor: 'pointer', marginLeft: 8 }}
				onClick={() => onRemove(id)}
				title="Remove from selection"
			/>
		</div>
	);
};

// ========== 主组件 ==========

/**
 * 文件选择组件
 * 
 * 支持多种显示模式：
 * - mode: 'image' | 'images' | 'avatar' | 'file'
 * 
 * @param {Object} props
 * @param {string|string[]|Object[]} props.value - 当前值
 * @param {Function} props.onChange - 值变化回调
 * @param {string} props.mode - 显示模式 'image' | 'images' | 'avatar' | 'file'
 * @param {number} props.max - 最大数量（仅 images/file 模式）
 * @param {boolean} props.sortable - 是否支持排序（仅 images/file 模式）
 * @param {string} props.accept - 接受的文件类型
 * @param {string} props.fileType - 文件库筛选类型
 */
export default function FileSelect({
	value,
	onChange,
	mode = 'image',
	max = 9,
	sortable = true,
	accept,
	fileType,
}) {
	const { message } = App.useApp();
	const [modalOpen, setModalOpen] = useState(false);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [previewImage, setPreviewImage] = useState('');
	
	// 计算初始文件列表
	const getInitialFileList = () => {
		if (!value) return [];
		
		if (mode === 'image' || mode === 'avatar') {
			if (typeof value === 'string' && value) {
				return [{ uid: `existing-0-${Date.now()}`, url: value, name: value.split('/').pop() }];
			}
			return [];
		}
		
		const arr = Array.isArray(value) ? value : [];
		return arr.filter(item => item).map((item, index) => {
			if (typeof item === 'string') {
				return { uid: `existing-${index}-${Date.now()}`, url: item, name: item.split('/').pop() };
			}
			return { uid: `existing-${index}-${Date.now()}`, ...item };
		});
	};
	
	// 内部文件列表状态
	const [fileList, setFileList] = useState(getInitialFileList);
	
	// 保存 onChange 引用
	const onChangeRef = useRef(onChange);
	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);
	
	// DnD sensors
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 5 },
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);
	
	// 同步值到表单
	const prevValueRef = useRef('');
	useEffect(() => {
		let newValue;
		
		if (mode === 'image' || mode === 'avatar') {
			newValue = fileList.length > 0 ? fileList[0].url : undefined;
		} else if (mode === 'images') {
			newValue = fileList.map(f => f.url);
		} else {
			newValue = fileList.map(f => ({ name: f.name, url: f.url, mimeType: f.mimeType }));
		}
		
		const valueStr = JSON.stringify(newValue);
		if (valueStr !== prevValueRef.current) {
			prevValueRef.current = valueStr;
			onChangeRef.current?.(newValue);
		}
	}, [fileList, mode]);
	
	// 处理从弹窗选择文件
	const handleSelect = (selected) => {
		if (mode === 'image' || mode === 'avatar') {
			// 单选
			const file = Array.isArray(selected) ? selected[0] : selected;
			setFileList([{ uid: `selected-${Date.now()}`, url: file.url, name: file.name, mimeType: file.mimeType }]);
		} else {
			// 多选
			const files = Array.isArray(selected) ? selected : [selected];
			const newFiles = files.map((f, i) => ({
				uid: `selected-${Date.now()}-${i}`,
				url: f.url,
				name: f.name,
				mimeType: f.mimeType,
			}));
			setFileList(prev => [...prev, ...newFiles].slice(0, max));
		}
	};
	
	// 删除文件
	const handleRemove = (uid) => {
		setFileList(prev => prev.filter(f => f.uid !== uid));
	};
	
	// 预览图片
	const handlePreview = (url) => {
		setPreviewImage(url);
		setPreviewOpen(true);
	};
	
	// 拖拽排序
	const handleDragEnd = (event) => {
		const { active, over } = event;
		
		if (active.id !== over?.id) {
			const oldIndex = fileList.findIndex(item => item.uid === active.id);
			const newIndex = fileList.findIndex(item => item.uid === over.id);
			setFileList(arrayMove(fileList, oldIndex, newIndex));
		}
	};
	
	// 渲染选择按钮
	const renderSelectButton = () => {
		if (mode === 'avatar') {
			return (
				<div
					onClick={() => setModalOpen(true)}
					style={{
						width: 104,
						height: 104,
						borderRadius: '50%',
						border: '1px dashed #d9d9d9',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						cursor: 'pointer',
						background: '#fafafa',
					}}
				>
					<UserOutlined style={{ fontSize: 24 }} />
					<div style={{ marginTop: 8, fontSize: 12 }}>Select</div>
				</div>
			);
		}
		
		if (mode === 'image' || mode === 'images') {
			return (
				<div
					onClick={() => setModalOpen(true)}
					style={{
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
					}}
				>
					<PlusOutlined />
					<div style={{ marginTop: 8 }}>Select</div>
				</div>
			);
		}
		
		// file 模式
		return (
			<button
				type="button"
				onClick={() => setModalOpen(true)}
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
				<PlusOutlined />
				Select Files
			</button>
		);
	};
	
	// ========== 渲染不同模式 ==========
	
	// 单图模式
	if (mode === 'image') {
		return (
			<>
				{fileList.length > 0 ? (
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
							src={fileList[0].url}
							alt="preview"
							style={{ width: '100%', height: '100%', objectFit: 'cover' }}
						/>
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
								onClick={() => handlePreview(fileList[0].url)}
							/>
							<PlusOutlined
								style={{ color: '#fff', fontSize: 16, cursor: 'pointer' }}
								onClick={() => setModalOpen(true)}
							/>
							{/* 直接移除，不需要确认（只是取消选择，不删除文件） */}
							<DeleteOutlined 
								style={{ color: '#fff', fontSize: 16, cursor: 'pointer' }} 
								onClick={() => handleRemove(fileList[0].uid)}
								title="Remove from selection"
							/>
						</div>
					</div>
				) : (
					renderSelectButton()
				)}
				
				<FileSelectModal
					open={modalOpen}
					onClose={() => setModalOpen(false)}
					onSelect={handleSelect}
					multiple={false}
					accept={accept || 'image/*'}
					fileType={fileType || 'image'}
					title="Select Image"
				/>
				
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
	
	// 头像模式
	if (mode === 'avatar') {
		return (
			<>
				{fileList.length > 0 ? (
					<div
						style={{
							position: 'relative',
							width: 104,
							height: 104,
							borderRadius: '50%',
							overflow: 'hidden',
							border: '1px solid #d9d9d9',
							background: '#fafafa',
						}}
					>
						<img
							src={fileList[0].url}
							alt="avatar"
							style={{ width: '100%', height: '100%', objectFit: 'cover' }}
						/>
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
								borderRadius: '50%',
							}}
							onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
							onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
						>
							<EyeOutlined
								style={{ color: '#fff', fontSize: 16, cursor: 'pointer' }}
								onClick={() => handlePreview(fileList[0].url)}
							/>
							<PlusOutlined
								style={{ color: '#fff', fontSize: 16, cursor: 'pointer' }}
								onClick={() => setModalOpen(true)}
							/>
							{/* 直接移除，不需要确认（只是取消选择，不删除文件） */}
							<DeleteOutlined 
								style={{ color: '#fff', fontSize: 16, cursor: 'pointer' }} 
								onClick={() => handleRemove(fileList[0].uid)}
								title="Remove from selection"
							/>
						</div>
					</div>
				) : (
					renderSelectButton()
				)}
				
				<FileSelectModal
					open={modalOpen}
					onClose={() => setModalOpen(false)}
					onSelect={handleSelect}
					multiple={false}
					accept={accept || 'image/*'}
					fileType={fileType || 'avatar'}
					title="Select Avatar"
				/>
				
				<Modal
					open={previewOpen}
					title="Preview"
					footer={null}
					onCancel={() => setPreviewOpen(false)}
				>
					<div style={{ display: 'flex', justifyContent: 'center' }}>
						<img alt="preview" style={{ maxWidth: '100%', borderRadius: '50%' }} src={previewImage} />
					</div>
				</Modal>
			</>
		);
	}
	
	// 多图模式
	if (mode === 'images') {
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
									onRemove={handleRemove}
									onPreview={handlePreview}
								/>
							))}
							{fileList.length < max && renderSelectButton()}
						</div>
					</SortableContext>
				</DndContext>
				
				<FileSelectModal
					open={modalOpen}
					onClose={() => setModalOpen(false)}
					onSelect={handleSelect}
					multiple={true}
					maxCount={max - fileList.length}
					accept={accept || 'image/*'}
					fileType={fileType || 'image'}
					title="Select Images"
				/>
				
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
	
	// 文件模式
	return (
		<>
			<div>
				{fileList.length < max && renderSelectButton()}
				
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
										onRemove={handleRemove}
									/>
								))}
							</SortableContext>
						</DndContext>
					</div>
				)}
			</div>
			
			<FileSelectModal
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				onSelect={handleSelect}
				multiple={true}
				maxCount={max - fileList.length}
				accept={accept}
				fileType={fileType || 'file'}
				title="Select Files"
			/>
		</>
	);
}

