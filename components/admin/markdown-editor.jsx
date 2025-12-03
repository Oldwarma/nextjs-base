'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

// 动态导入 MDEditor，禁用 SSR
const MDEditor = dynamic(
	() => import('@uiw/react-md-editor'),
	{ ssr: false }
);

/**
 * Markdown 编辑器组件
 * 
 * 特性:
 * - 支持实时预览
 * - 支持工具栏
 * - 支持暗色模式
 * - 支持全屏编辑
 */
export default function MarkdownEditor({
	value,
	onChange,
	placeholder = 'Enter markdown content...',
	height = 400,
	preview = 'live', // 'live' | 'edit' | 'preview'
	// 过滤掉 ProForm 可能传递的额外属性
	fieldProps: _fieldProps,
	formItemProps: _formItemProps,
	proFieldProps: _proFieldProps,
	// 保留其他属性传递给 MDEditor
	...props
}) {
	const [localValue, setLocalValue] = useState(value || '');

	useEffect(() => {
		setLocalValue(value || '');
	}, [value]);

	const handleChange = (val) => {
		setLocalValue(val);
		if (onChange) {
			onChange(val);
		}
	};

	return (
		<div data-color-mode="light">
			<MDEditor
				value={localValue}
				onChange={handleChange}
				height={height}
				preview={preview}
				textareaProps={{
					placeholder,
				}}
				{...props}
			/>
		</div>
	);
}

