/**
 * 图标选择器组件
 * 
 * 使用 Ant Design Icons，包含 200+ 精选图标
 * 支持 Outlined 和 Filled 两种风格
 */
'use client';

import React, { useState } from 'react';
import { Modal, Button } from 'antd';
import * as Icons from '@ant-design/icons';

// 预定义常用图标列表（Outlined & Filled）
const COMMON_ICONS = [
	// Outlined - 线框风格（最常用）
	// 基础类
	'HomeOutlined', 'UserOutlined', 'SettingOutlined', 'StarOutlined', 'HeartOutlined',
	'SearchOutlined', 'FileOutlined', 'FolderOutlined', 'SaveOutlined', 'DeleteOutlined',
	'EditOutlined', 'CopyOutlined', 'CheckOutlined', 'CloseOutlined', 'PlusOutlined',
	'MinusOutlined', 'UploadOutlined', 'DownloadOutlined', 'CloudOutlined', 'MailOutlined',
	
	// 用户 & 团队
	'PhoneOutlined', 'TeamOutlined', 'UserAddOutlined', 'UserDeleteOutlined', 'UsergroupAddOutlined',
	'IdcardOutlined', 'ContactsOutlined', 'SolutionOutlined', 'ProfileOutlined',
	
	// 商业 & 购物
	'ShoppingOutlined', 'ShopOutlined', 'ShoppingCartOutlined', 'GiftOutlined', 'DollarOutlined',
	'CreditCardOutlined', 'WalletOutlined', 'PropertySafetyOutlined', 'MoneyCollectOutlined',
	
	// 通知 & 消息
	'AppstoreOutlined', 'BellOutlined', 'MessageOutlined', 'NotificationOutlined', 'CommentOutlined',
	'InboxOutlined', 'SendOutlined',
	
	// 时间 & 日历
	'CalendarOutlined', 'ClockCircleOutlined', 'HistoryOutlined', 'FieldTimeOutlined',
	
	// 媒体 & 文件
	'CameraOutlined', 'PictureOutlined', 'FileTextOutlined', 'FileImageOutlined', 'FilePdfOutlined',
	'FileWordOutlined', 'FileExcelOutlined', 'FilePptOutlined', 'FileZipOutlined', 'FileMarkdownOutlined',
	'FolderOpenOutlined', 'FolderAddOutlined', 'FileAddOutlined',
	
	// 地图 & 位置
	'CarOutlined', 'EnvironmentOutlined', 'CompassOutlined', 'AimOutlined', 'PushpinOutlined',
	
	// 社交 & 分享
	'LikeOutlined', 'DislikeOutlined', 'ShareAltOutlined', 'EyeOutlined', 'EyeInvisibleOutlined',
	
	// 安全 & 权限
	'LockOutlined', 'UnlockOutlined', 'SafetyOutlined', 'SafetyCertificateOutlined', 'SecurityScanOutlined',
	'KeyOutlined', 'AuditOutlined',
	
	// 系统 & 工具
	'CrownOutlined', 'DatabaseOutlined', 'FireOutlined', 'GlobalOutlined', 'RocketOutlined',
	'ToolOutlined', 'TrophyOutlined', 'DashboardOutlined', 'ControlOutlined', 'BuildOutlined',
	
	// 开发 & 代码
	'CodeOutlined', 'ApiOutlined', 'BugOutlined', 'ExperimentOutlined', 'BulbOutlined',
	'CloudServerOutlined', 'ClusterOutlined', 'DeploymentUnitOutlined', 'GatewayOutlined',
	
	// 数据 & 图表
	'LineChartOutlined', 'BarChartOutlined', 'PieChartOutlined', 'DotChartOutlined', 'AreaChartOutlined',
	'FundOutlined', 'StockOutlined', 'RiseOutlined', 'FallOutlined',
	
	// 编辑 & 格式
	'LinkOutlined', 'MenuOutlined', 'FilterOutlined', 'SortAscendingOutlined', 'SortDescendingOutlined',
	'OrderedListOutlined', 'UnorderedListOutlined', 'TableOutlined', 'LayoutOutlined',
	
	// 标签 & 分类
	'TagOutlined', 'TagsOutlined', 'BookOutlined', 'ReadOutlined', 'FormOutlined',
	'ProjectOutlined', 'ScheduleOutlined', 'ReconciliationOutlined',
	
	// 箭头 & 方向
	'ArrowLeftOutlined', 'ArrowRightOutlined', 'ArrowUpOutlined', 'ArrowDownOutlined',
	'LeftOutlined', 'RightOutlined', 'UpOutlined', 'DownOutlined',
	
	// 状态 & 提示
	'ThunderboltOutlined', 'SoundOutlined', 'AlertOutlined', 'WarningOutlined', 'InfoCircleOutlined',
	'QuestionCircleOutlined', 'ExclamationCircleOutlined', 'CheckCircleOutlined', 'CloseCircleOutlined',
	
	// 媒体控制
	'PlayCircleOutlined', 'PauseCircleOutlined', 'StopOutlined', 'ForwardOutlined', 'BackwardOutlined',
	
	// 其他
	'QrcodeOutlined', 'ScanOutlined', 'PrinterOutlined', 'ExportOutlined', 'ImportOutlined',
	'SyncOutlined', 'ReloadOutlined', 'UndoOutlined', 'RedoOutlined',
	
	// Filled - 填充风格
	// 基础类
	'HomeFilled', 'UserFilled', 'SettingFilled', 'StarFilled', 'HeartFilled',
	'FileFilled', 'FolderFilled', 'SaveFilled', 'DeleteFilled', 'EditFilled',
	'CheckCircleFilled', 'CloseCircleFilled', 'PlusCircleFilled', 'MinusCircleFilled',
	
	// 通知 & 消息
	'CloudFilled', 'MailFilled', 'PhoneFilled', 'ShoppingFilled', 'AppstoreFilled',
	'BellFilled', 'MessageFilled', 'NotificationFilled',
	
	// 时间 & 日历
	'CalendarFilled', 'ClockCircleFilled',
	
	// 媒体
	'CameraFilled', 'PictureFilled', 'PlayCircleFilled', 'PauseCircleFilled',
	
	// 位置 & 地图
	'CarFilled', 'EnvironmentFilled', 'CompassFilled', 'PushpinFilled',
	
	// 社交
	'LikeFilled', 'DislikeFilled', 'EyeFilled', 'EyeInvisibleFilled',
	
	// 安全 & 系统
	'LockFilled', 'UnlockFilled', 'SafetyFilled', 'CrownFilled', 'FireFilled',
	'RocketFilled', 'ToolFilled', 'TrophyFilled', 'DashboardFilled',
	
	// 开发 & 数据
	'CodeFilled', 'BugFilled', 'BulbFilled', 'FundFilled', 'PieChartFilled',
	
	// 标签 & 文档
	'TagFilled', 'TagsFilled', 'BookFilled', 'FileTextFilled',
	
	// 状态
	'ThunderboltFilled', 'AlertFilled', 'WarningFilled', 'InfoCircleFilled',
	'QuestionCircleFilled', 'ExclamationCircleFilled',
	
	// 其他
	'GiftFilled', 'WalletFilled', 'ShopFilled',
];

export default function IconPicker({ open, onClose, onSelect, value }) {
	const [searchText, setSearchText] = useState('');

	const filteredIcons = COMMON_ICONS.filter(name => 
		!searchText || name.toLowerCase().includes(searchText.toLowerCase())
	);

	const handleSelect = (iconName) => {
		onSelect?.(iconName);
		onClose?.();
	};

	return (
		<Modal
			title={`Select Icon (${filteredIcons.length} icons)`}
			open={open}
			onCancel={onClose}
			footer={<Button onClick={onClose}>Close</Button>}
			width={900}
		>
			<input
				type="text"
				placeholder="Search icons..."
				value={searchText}
				onChange={(e) => setSearchText(e.target.value)}
				style={{
					width: '100%',
					padding: '8px 12px',
					marginBottom: 16,
					border: '1px solid #d9d9d9',
					borderRadius: 4,
				}}
			/>
			
			<div style={{
				display: 'grid',
				gridTemplateColumns: 'repeat(8, 1fr)',
				gap: 8,
				maxHeight: 500,
				overflowY: 'auto',
			}}>
				{filteredIcons.map((iconName) => {
					const IconComponent = Icons[iconName];
					const isSelected = value === iconName;
					
					if (!IconComponent) return null;

					return (
						<div
							key={iconName}
							onClick={() => handleSelect(iconName)}
							title={iconName}
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								padding: 12,
								border: `2px solid ${isSelected ? '#1890ff' : '#f0f0f0'}`,
								borderRadius: 6,
								cursor: 'pointer',
								backgroundColor: isSelected ? '#e6f4ff' : '#fff',
								transition: 'all 0.2s',
							}}
							onMouseEnter={(e) => {
								if (!isSelected) {
									e.currentTarget.style.borderColor = '#1890ff';
									e.currentTarget.style.transform = 'translateY(-2px)';
									e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
								}
							}}
							onMouseLeave={(e) => {
								if (!isSelected) {
									e.currentTarget.style.borderColor = '#f0f0f0';
									e.currentTarget.style.transform = 'translateY(0)';
									e.currentTarget.style.boxShadow = 'none';
								}
							}}
						>
							<IconComponent style={{ 
								fontSize: 24,
								color: isSelected ? '#1890ff' : '#595959',
							}} />
							<div style={{ 
								fontSize: 10, 
								marginTop: 4, 
								textAlign: 'center', 
								wordBreak: 'break-all',
								color: '#8c8c8c',
							}}>
								{iconName.replace(/Outlined|Filled/g, '')}
							</div>
							{/* {iconName.includes('Filled') && (
								<div style={{ fontSize: 9, color: '#52c41a', marginTop: 2, fontWeight: 'bold' }}>●</div>
							)} */}
						</div>
					);
				})}
			</div>
		</Modal>
	);
}

/**
 * 根据图标名称渲染图标组件
 * 
 * @param {String} iconName - 图标名称 (如 'HomeOutlined', 'StarFilled')
 * @param {Object} props - 图标属性
 * @returns {React.Component|null}
 */
export function renderIcon(iconName, props = {}) {
	if (!iconName) return null;
	const IconComponent = Icons[iconName];
	return IconComponent ? <IconComponent {...props} /> : null;
}

