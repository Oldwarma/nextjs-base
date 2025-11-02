/**
 * 图标选择器组件
 * 
 * 支持 lucide-react 和 react-icons 的图标选择
 * 参考 vk-unicloud 的图标选择器设计
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Modal, Input, Button, Grid } from 'antd';
import { SearchOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import * as LucideIcons from 'lucide-react';
import * as ReactIconsFa from 'react-icons/fa';
import * as ReactIconsFi from 'react-icons/fi';
import * as ReactIconsHi from 'react-icons/hi';
import * as ReactIconsIo from 'react-icons/io';
import * as ReactIconsMd from 'react-icons/md';
import * as ReactIconsAi from 'react-icons/ai';
import * as ReactIconsBs from 'react-icons/bs';
import * as ReactIconsBi from 'react-icons/bi';
import * as ReactIconsRi from 'react-icons/ri';
import * as ReactIconsTb from 'react-icons/tb';

const { useBreakpoint } = Grid;

/**
 * 图标选择器组件
 * 
 * @param {Boolean} open - 是否显示弹窗
 * @param {Function} onClose - 关闭回调
 * @param {Function} onSelect - 选择图标回调 (iconKey, iconComponent, iconLib)
 * @param {String} value - 当前选中的图标值
 */
export default function IconPicker({ open, onClose, onSelect, value }) {
	const [searchText, setSearchText] = useState('');
	const [fullscreen, setFullscreen] = useState(false);
	const screens = useBreakpoint();

	// 收集所有图标
	const allIcons = useMemo(() => {
		const icons = [];

		// Lucide Icons
		Object.keys(LucideIcons).forEach((iconName) => {
			if (iconName !== 'createLucideIcon' && typeof LucideIcons[iconName] === 'function') {
				const IconComponent = LucideIcons[iconName];
				icons.push({
					key: `lucide:${iconName}`,
					name: iconName,
					lib: 'lucide',
					component: IconComponent,
					displayName: formatIconName(iconName),
				});
			}
		});

		// React Icons - Font Awesome
		Object.keys(ReactIconsFa).forEach((iconName) => {
			icons.push({
				key: `fa:${iconName}`,
				name: iconName,
				lib: 'fa',
				component: ReactIconsFa[iconName],
				displayName: formatIconName(iconName),
			});
		});

		// React Icons - Feather Icons
		Object.keys(ReactIconsFi).forEach((iconName) => {
			icons.push({
				key: `fi:${iconName}`,
				name: iconName,
				lib: 'fi',
				component: ReactIconsFi[iconName],
				displayName: formatIconName(iconName),
			});
		});

		// React Icons - Heroicons
		Object.keys(ReactIconsHi).forEach((iconName) => {
			icons.push({
				key: `hi:${iconName}`,
				name: iconName,
				lib: 'hi',
				component: ReactIconsHi[iconName],
				displayName: formatIconName(iconName),
			});
		});

		// React Icons - Ionicons
		Object.keys(ReactIconsIo).forEach((iconName) => {
			icons.push({
				key: `io:${iconName}`,
				name: iconName,
				lib: 'io',
				component: ReactIconsIo[iconName],
				displayName: formatIconName(iconName),
			});
		});

		// React Icons - Material Design
		Object.keys(ReactIconsMd).forEach((iconName) => {
			icons.push({
				key: `md:${iconName}`,
				name: iconName,
				lib: 'md',
				component: ReactIconsMd[iconName],
				displayName: formatIconName(iconName),
			});
		});

		// React Icons - Ant Design Icons
		Object.keys(ReactIconsAi).forEach((iconName) => {
			icons.push({
				key: `ai:${iconName}`,
				name: iconName,
				lib: 'ai',
				component: ReactIconsAi[iconName],
				displayName: formatIconName(iconName),
			});
		});

		// React Icons - Bootstrap Icons
		Object.keys(ReactIconsBs).forEach((iconName) => {
			icons.push({
				key: `bs:${iconName}`,
				name: iconName,
				lib: 'bs',
				component: ReactIconsBs[iconName],
				displayName: formatIconName(iconName),
			});
		});

		// React Icons - Boxicons
		Object.keys(ReactIconsBi).forEach((iconName) => {
			icons.push({
				key: `bi:${iconName}`,
				name: iconName,
				lib: 'bi',
				component: ReactIconsBi[iconName],
				displayName: formatIconName(iconName),
			});
		});

		// React Icons - Remix Icons
		Object.keys(ReactIconsRi).forEach((iconName) => {
			icons.push({
				key: `ri:${iconName}`,
				name: iconName,
				lib: 'ri',
				component: ReactIconsRi[iconName],
				displayName: formatIconName(iconName),
			});
		});

		// React Icons - Tabler Icons
		Object.keys(ReactIconsTb).forEach((iconName) => {
			icons.push({
				key: `tb:${iconName}`,
				name: iconName,
				lib: 'tb',
				component: ReactIconsTb[iconName],
				displayName: formatIconName(iconName),
			});
		});

		return icons;
	}, []);

	// 过滤图标
	const filteredIcons = useMemo(() => {
		if (!searchText.trim()) {
			return allIcons;
		}
		const searchLower = searchText.toLowerCase();
		return allIcons.filter((icon) => {
			return (
				icon.name.toLowerCase().includes(searchLower) ||
				icon.displayName.toLowerCase().includes(searchLower) ||
				icon.key.toLowerCase().includes(searchLower)
			);
		});
	}, [allIcons, searchText]);

	// 计算每行显示的图标数量（响应式）
	const cols = useMemo(() => {
		if (fullscreen) return 8;
		if (screens.xxl) return 6;
		if (screens.xl) return 6;
		if (screens.lg) return 5;
		if (screens.md) return 4;
		return 3;
	}, [fullscreen, screens]);

	// 处理图标选择
	const handleSelect = (icon) => {
		if (onSelect) {
			onSelect(icon.key, icon.component, icon.lib);
		}
		onClose();
	};

	// 处理关闭
	const handleClose = () => {
		setSearchText('');
		setFullscreen(false);
		onClose();
	};

	return (
		<Modal
			title={
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 48 }}>
					<span>请选择图标</span>
					<Button
						type="text"
						size="small"
						icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
						onClick={() => setFullscreen(!fullscreen)}
						style={{ marginRight: -20, marginTop: -5, color: '#666' }}
					/>
				</div>
			}
			open={open}
			onCancel={handleClose}
			footer={
				<Button onClick={handleClose}>关闭</Button>
			}
			width={fullscreen ? '100vw' : 800}
			centered={!fullscreen}
			wrapClassName={fullscreen ? 'fullscreen-modal' : ''}
			style={fullscreen ? {
				top: 0,
				maxWidth: '100vw',
				height: '100vh',
				margin: 0,
				paddingBottom: 0,
			} : {}}
			styles={{
				body: {
					maxHeight: fullscreen ? 'calc(100vh - 110px)' : 'calc(90vh - 110px)',
					overflowY: 'auto',
					padding: 24,
				},
			}}
			destroyOnHidden
		>
			{/* 搜索栏 */}
			<div style={{ marginBottom: 24, display: 'flex', gap: 8 }}>
				<Input
					placeholder="图标搜索"
					prefix={<SearchOutlined />}
					value={searchText}
					onChange={(e) => setSearchText(e.target.value)}
					style={{ flex: 1 }}
					allowClear
				/>
				<Button type="primary" icon={<SearchOutlined />}>
					搜索
				</Button>
			</div>

			{/* 图标网格 */}
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: `repeat(${cols}, 1fr)`,
					gap: 16,
					maxHeight: fullscreen ? 'calc(100vh - 200px)' : 'calc(90vh - 180px)',
					overflowY: 'auto',
				}}
			>
				{filteredIcons.map((icon) => {
					const IconComponent = icon.component;
					const isSelected = value === icon.key;

					return (
						<div
							key={icon.key}
							onClick={() => handleSelect(icon)}
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								padding: '16px 8px',
								border: `1px solid ${isSelected ? '#1890ff' : '#e8e8e8'}`,
								borderRadius: 8,
								cursor: 'pointer',
								transition: 'all 0.2s',
								backgroundColor: isSelected ? '#e6f4ff' : '#fff',
							}}
							onMouseEnter={(e) => {
								if (!isSelected) {
									e.currentTarget.style.borderColor = '#1890ff';
									e.currentTarget.style.backgroundColor = '#f5f5f5';
								}
							}}
							onMouseLeave={(e) => {
								if (!isSelected) {
									e.currentTarget.style.borderColor = '#e8e8e8';
									e.currentTarget.style.backgroundColor = '#fff';
								}
							}}
						>
							<IconComponent
								style={{
									fontSize: 32,
									color: isSelected ? '#1890ff' : '#595959',
									marginBottom: 8,
								}}
							/>
							<div
								style={{
									fontSize: 11,
									color: '#8c8c8c',
									textAlign: 'center',
									wordBreak: 'break-all',
									lineHeight: 1.4,
									maxWidth: '100%',
								}}
							>
								{icon.key}
							</div>
							<div
								style={{
									fontSize: 12,
									color: '#262626',
									textAlign: 'center',
									marginTop: 4,
									wordBreak: 'break-all',
									lineHeight: 1.3,
									maxWidth: '100%',
								}}
							>
								{icon.displayName}
							</div>
						</div>
					);
				})}
			</div>

			{/* 空状态 */}
			{filteredIcons.length === 0 && (
				<div
					style={{
						textAlign: 'center',
						padding: '60px 20px',
						color: '#8c8c8c',
					}}
				>
					没有找到匹配的图标
				</div>
			)}
		</Modal>
	);
}

/**
 * 格式化图标名称
 */
function formatIconName(name) {
	// 将驼峰命名转换为空格分隔的中文显示
	return name
		.replace(/([A-Z])/g, ' $1')
		.trim()
		.toLowerCase()
		.replace(/^./, (str) => str.toUpperCase());
}

/**
 * 根据图标 key 渲染图标组件
 * 
 * @param {String} iconKey - 图标 key (格式: lib:name)
 * @param {Object} props - 图标属性
 * @returns {React.Component|null}
 */
export function renderIcon(iconKey, props = {}) {
	if (!iconKey) return null;

	const [lib, name] = iconKey.split(':');
	if (!lib || !name) return null;

	try {
		let IconComponent = null;

		switch (lib) {
			case 'lucide':
				IconComponent = LucideIcons[name];
				break;
			case 'fa':
				IconComponent = ReactIconsFa[name];
				break;
			case 'fi':
				IconComponent = ReactIconsFi[name];
				break;
			case 'hi':
				IconComponent = ReactIconsHi[name];
				break;
			case 'io':
				IconComponent = ReactIconsIo[name];
				break;
			case 'md':
				IconComponent = ReactIconsMd[name];
				break;
			case 'ai':
				IconComponent = ReactIconsAi[name];
				break;
			case 'bs':
				IconComponent = ReactIconsBs[name];
				break;
			case 'bi':
				IconComponent = ReactIconsBi[name];
				break;
			case 'ri':
				IconComponent = ReactIconsRi[name];
				break;
			case 'tb':
				IconComponent = ReactIconsTb[name];
				break;
			default:
				return null;
		}

		if (IconComponent && typeof IconComponent === 'function') {
			return <IconComponent {...props} />;
		}
	} catch (error) {
		console.warn(`Failed to render icon: ${iconKey}`, error);
	}

	return null;
}

