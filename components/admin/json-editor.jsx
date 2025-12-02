'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button, Space, App } from 'antd';
import { FormatPainterOutlined, CopyOutlined } from '@ant-design/icons';
import nb from '@/lib/function';

/**
 * 简单的 JSON 编辑器组件
 * 
 * 特性：
 * - 行号显示
 * - 格式化按钮
 * - 复制按钮
 * - JSON 语法验证
 * - 等宽字体
 * 
 * @param {Object} props
 * @param {string|object} props.value - JSON 值（字符串或对象）
 * @param {Function} props.onChange - 值变化回调
 * @param {number} props.rows - 行数，默认 10
 * @param {string} props.placeholder - 占位符
 * @param {boolean} props.disabled - 是否禁用
 * @param {boolean} props.readOnly - 是否只读
 */
export default function JsonEditor({
	value,
	onChange,
	rows = 10,
	placeholder = 'Enter JSON...',
	disabled = false,
	readOnly = false,
}) {
	const { message } = App.useApp();
	const textareaRef = useRef(null);
	const lineNumbersRef = useRef(null);
	
	// 内部字符串值
	const [textValue, setTextValue] = useState('');
	// 错误状态
	const [error, setError] = useState(null);
	// 行数
	const [lineCount, setLineCount] = useState(1);
	
	// 初始化和同步外部值
	useEffect(() => {
		if (value === undefined || value === null) {
			setTextValue('');
			setLineCount(1);
			return;
		}
		
		let str = '';
		if (nb.pubfn.isString(value)) {
			str = value;
		} else if (nb.pubfn.isObject(value)) {
			try {
				str = JSON.stringify(value, null, 2);
			} catch (e) {
				str = '';
			}
		}
		
		setTextValue(str);
		updateLineCount(str);
		validateJson(str);
	}, [value]);
	
	// 更新行数
	const updateLineCount = (text) => {
		const lines = (text || '').split('\n').length;
		setLineCount(Math.max(lines, 1));
	};
	
	// 验证 JSON
	const validateJson = (text) => {
		if (!text || text.trim() === '') {
			setError(null);
			return true;
		}
		
		try {
			JSON.parse(text);
			setError(null);
			return true;
		} catch (e) {
			setError(e.message);
			return false;
		}
	};
	
	// 处理输入变化
	const handleChange = (e) => {
		const newValue = e.target.value;
		setTextValue(newValue);
		updateLineCount(newValue);
		validateJson(newValue);
		
		// 通知父组件
		onChange?.(newValue);
	};
	
	// 格式化 JSON
	const handleFormat = () => {
		if (!textValue || textValue.trim() === '') {
			message.warning('No content to format');
			return;
		}
		
		try {
			const parsed = JSON.parse(textValue);
			const formatted = JSON.stringify(parsed, null, 2);
			setTextValue(formatted);
			updateLineCount(formatted);
			setError(null);
			onChange?.(formatted);
			message.success('Formatted successfully');
		} catch (e) {
			message.error('Invalid JSON, cannot format');
		}
	};
	
	// 复制到剪贴板
	const handleCopy = async () => {
		if (!textValue) {
			message.warning('No content to copy');
			return;
		}
		
		try {
			await navigator.clipboard.writeText(textValue);
			message.success('Copied to clipboard');
		} catch (e) {
			message.error('Failed to copy');
		}
	};
	
	// 同步滚动
	const handleScroll = () => {
		if (lineNumbersRef.current && textareaRef.current) {
			lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
		}
	};
	
	// 生成行号
	const renderLineNumbers = () => {
		const lines = [];
		for (let i = 1; i <= lineCount; i++) {
			lines.push(
				<div key={i} style={{ height: 20, lineHeight: '20px' }}>
					{i}
				</div>
			);
		}
		return lines;
	};
	
	const lineHeight = 20;
	const height = rows * lineHeight + 16; // 16 是上下 padding
	
	return (
		<div style={{ width: '100%' }}>
			{/* 工具栏 */}
			<div style={{ 
				marginBottom: 8, 
				display: 'flex', 
				justifyContent: 'flex-end',
				gap: 8,
			}}>
				<Space size="small">
					<Button
						type="text"
						size="small"
						icon={<FormatPainterOutlined />}
						onClick={handleFormat}
						disabled={disabled || readOnly}
					>
						Format
					</Button>
					<Button
						type="text"
						size="small"
						icon={<CopyOutlined />}
						onClick={handleCopy}
					>
						Copy
					</Button>
				</Space>
			</div>
			
			{/* 编辑器容器 */}
			<div
				style={{
					display: 'flex',
					border: `1px solid ${error ? '#ff4d4f' : '#d9d9d9'}`,
					borderRadius: 6,
					overflow: 'hidden',
					backgroundColor: disabled ? '#f5f5f5' : '#fff',
					transition: 'border-color 0.3s',
				}}
			>
				{/* 行号区域 */}
				<div
					ref={lineNumbersRef}
					style={{
						width: 40,
						minWidth: 40,
						backgroundColor: '#fafafa',
						borderRight: '1px solid #e8e8e8',
						padding: '8px 0',
						overflow: 'hidden',
						userSelect: 'none',
						fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
						fontSize: 13,
						lineHeight: `${lineHeight}px`,
						textAlign: 'right',
						color: '#999',
						height: height,
					}}
				>
					<div style={{ paddingRight: 8 }}>
						{renderLineNumbers()}
					</div>
				</div>
				
				{/* 文本编辑区域 */}
				<textarea
					ref={textareaRef}
					value={textValue}
					onChange={handleChange}
					onScroll={handleScroll}
					placeholder={placeholder}
					disabled={disabled}
					readOnly={readOnly}
					spellCheck={false}
					style={{
						flex: 1,
						border: 'none',
						outline: 'none',
						resize: 'none',
						padding: 8,
						fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
						fontSize: 13,
						lineHeight: `${lineHeight}px`,
						height: height,
						backgroundColor: disabled ? '#f5f5f5' : '#fff',
						color: '#333',
						overflow: 'auto',
					}}
				/>
			</div>
			
			{/* 错误提示 */}
			{error && (
				<div style={{ 
					color: '#ff4d4f', 
					fontSize: 12, 
					marginTop: 4,
					paddingLeft: 4,
				}}>
					JSON Error: {error}
				</div>
			)}
		</div>
	);
}

