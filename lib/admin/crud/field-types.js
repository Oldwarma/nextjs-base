/**
 * 字段类型定义
 * 
 * 基于 vk-unicloud 的万能表格/表单思想
 * 通过 type 驱动的多组件系统
 */

import React from 'react';
import {
	ProFormText,
	ProFormTextArea,
	ProFormDigit,
	ProFormDatePicker,
	ProFormDateRangePicker,
	ProFormSelect,
	ProFormRadio,
	ProFormCheckbox,
	ProFormSwitch,
	ProFormUploadButton,
} from '@ant-design/pro-components';
import { Tag, Image } from 'antd';
import dayjs from 'dayjs';

/**
 * 字段类型注册表
 * 
 * 每个字段类型包含:
 * - table: 表格渲染函数
 * - form: 表单组件生成函数
 * - search: 搜索组件生成函数 (可选)
 * - detail: 详情渲染函数 (可选,默认使用 table)
 */
export const FIELD_TYPE_REGISTRY = {
	/**
	 * 文本类型
	 */
	text: {
		table: (value, config) => {
			if (!value) return '-';
			return <span>{value}</span>;
		},
		form: (config) => (
			<ProFormText
				name={config.key}
				label={config.title}
				placeholder={config.form?.placeholder || `Enter ${config.title}`}
				rules={generateRules(config)}
				disabled={config.form?.disabled}
				{...config.form?.props}
			/>
		),
		search: (config) => (
			<ProFormText
				name={config.key}
				label={config.title}
				placeholder={`Search by ${config.title}`}
				{...config.search?.props}
			/>
		),
	},

	/**
	 * 多行文本类型
	 */
	textarea: {
		table: (value, config) => {
			if (!value) return '-';
			const maxLength = config.table?.ellipsis ? 50 : 200;
			return (
				<span title={value}>
					{value.length > maxLength ? `${value.substring(0, maxLength)}...` : value}
				</span>
			);
		},
		form: (config) => (
			<ProFormTextArea
				name={config.key}
				label={config.title}
				placeholder={config.form?.placeholder || `Enter ${config.title}`}
				rules={generateRules(config)}
				disabled={config.form?.disabled}
				fieldProps={{
					rows: 4,
					...config.form?.props?.fieldProps,
				}}
				{...config.form?.props}
			/>
		),
	},

	/**
	 * 数字类型
	 */
	number: {
		table: (value, config) => {
			if (value === null || value === undefined) return '-';
			const precision = config.table?.precision ?? 0;
			return <span>{Number(value).toFixed(precision)}</span>;
		},
		form: (config) => (
			<ProFormDigit
				name={config.key}
				label={config.title}
				placeholder={config.form?.placeholder || `Enter ${config.title}`}
				rules={generateRules(config)}
				disabled={config.form?.disabled}
				fieldProps={{
					precision: config.form?.precision ?? 0,
					min: config.form?.min,
					max: config.form?.max,
					...config.form?.props?.fieldProps,
				}}
				{...config.form?.props}
			/>
		),
		search: (config) => (
			<ProFormDigit
				name={config.key}
				label={config.title}
				placeholder={`Search by ${config.title}`}
				fieldProps={{
					precision: config.search?.precision ?? 0,
					...config.search?.props?.fieldProps,
				}}
				{...config.search?.props}
			/>
		),
	},

	/**
	 * 金额类型
	 */
	money: {
		table: (value, config) => {
			if (value === null || value === undefined) return '-';
			const precision = config.table?.precision ?? 2;
			const symbol = config.table?.symbol ?? '$';
			return <span style={{ color: '#f5222d' }}>{symbol}{Number(value).toFixed(precision)}</span>;
		},
		form: (config) => (
			<ProFormDigit
				name={config.key}
				label={config.title}
				placeholder={config.form?.placeholder || `Enter ${config.title}`}
				rules={generateRules(config)}
				disabled={config.form?.disabled}
				fieldProps={{
					precision: config.form?.precision ?? 2,
					min: config.form?.min ?? 0,
					prefix: config.form?.prefix ?? '$',
					...config.form?.props?.fieldProps,
				}}
				{...config.form?.props}
			/>
		),
	},

	/**
	 * 百分比类型
	 */
	percentage: {
		table: (value, config) => {
			if (value === null || value === undefined) return '-';
			const precision = config.table?.precision ?? 2;
			return <span>{Number(value).toFixed(precision)}%</span>;
		},
		form: (config) => (
			<ProFormDigit
				name={config.key}
				label={config.title}
				placeholder={config.form?.placeholder || `Enter ${config.title}`}
				rules={generateRules(config)}
				disabled={config.form?.disabled}
				fieldProps={{
					precision: config.form?.precision ?? 2,
					min: 0,
					max: 100,
					formatter: (value) => `${value}%`,
					parser: (value) => value.replace('%', ''),
					...config.form?.props?.fieldProps,
				}}
				{...config.form?.props}
			/>
		),
	},

	/**
	 * 日期类型
	 */
	date: {
		table: (value, config) => {
			if (!value) return '-';
			const format = config.table?.format || 'YYYY-MM-DD';
			return <span>{dayjs(value).format(format)}</span>;
		},
		form: (config) => (
			<ProFormDatePicker
				name={config.key}
				label={config.title}
				placeholder={config.form?.placeholder || `Select ${config.title}`}
				rules={generateRules(config)}
				disabled={config.form?.disabled}
				fieldProps={{
					format: config.form?.format || 'YYYY-MM-DD',
					...config.form?.props?.fieldProps,
				}}
				{...config.form?.props}
			/>
		),
		search: (config) => (
			<ProFormDatePicker
				name={config.key}
				label={config.title}
				placeholder={`Search by ${config.title}`}
				fieldProps={{
					format: config.search?.format || 'YYYY-MM-DD',
					...config.search?.props?.fieldProps,
				}}
				{...config.search?.props}
			/>
		),
	},

	/**
	 * 日期时间类型
	 */
	datetime: {
		table: (value, config) => {
			if (!value) return '-';
			const format = config.table?.format || 'YYYY-MM-DD HH:mm:ss';
			return <span>{dayjs(value).format(format)}</span>;
		},
		form: (config) => (
			<ProFormDatePicker
				name={config.key}
				label={config.title}
				placeholder={config.form?.placeholder || `Select ${config.title}`}
				rules={generateRules(config)}
				disabled={config.form?.disabled}
				fieldProps={{
					showTime: true,
					format: config.form?.format || 'YYYY-MM-DD HH:mm:ss',
					...config.form?.props?.fieldProps,
				}}
				{...config.form?.props}
			/>
		),
	},

	/**
	 * 日期范围类型
	 */
	daterange: {
		table: null, // 不在表格中显示
		form: null, // 不在表单中显示
		search: (config) => (
			<ProFormDateRangePicker
				name={config.key}
				label={config.title}
				fieldProps={{
					format: config.search?.format || 'YYYY-MM-DD',
					...config.search?.props?.fieldProps,
				}}
				{...config.search?.props}
			/>
		),
	},

	/**
	 * 日期时间范围类型
	 */
	datetimerange: {
		table: null,
		form: null,
		search: (config) => (
			<ProFormDateRangePicker
				name={config.key}
				label={config.title}
				fieldProps={{
					showTime: true,
					format: config.search?.format || 'YYYY-MM-DD HH:mm:ss',
					...config.search?.props?.fieldProps,
				}}
				{...config.search?.props}
			/>
		),
	},

	/**
	 * 下拉选择类型
	 */
	select: {
		table: (value, config) => {
			if (!value && value !== 0) return '-';
			
			// 从 options 或 valueEnum 中查找对应的显示文本
			const options = config.options || [];
			const valueEnum = config.valueEnum || {};
			
			let label = value;
			let color = undefined;
			
			// 尝试从 options 中查找
			const option = options.find(opt => opt.value === value);
			if (option) {
				label = option.label;
				color = option.color;
			} else if (valueEnum[value]) {
				// 尝试从 valueEnum 中查找
				label = valueEnum[value].text || valueEnum[value];
				color = valueEnum[value].color;
			}
			
			return color ? <Tag color={color}>{label}</Tag> : <span>{label}</span>;
		},
		form: (config) => (
			<ProFormSelect
				name={config.key}
				label={config.title}
				placeholder={config.form?.placeholder || `Select ${config.title}`}
				rules={generateRules(config)}
				disabled={config.form?.disabled}
				options={config.options}
				valueEnum={config.valueEnum}
				{...config.form?.props}
			/>
		),
		search: (config) => (
			<ProFormSelect
				name={config.key}
				label={config.title}
				placeholder={`Search by ${config.title}`}
				options={config.options}
				valueEnum={config.valueEnum}
				{...config.search?.props}
			/>
		),
	},

	/**
	 * 单选类型
	 */
	radio: {
		table: (value, config) => {
			// 使用 select 的渲染逻辑
			return FIELD_TYPE_REGISTRY.select.table(value, config);
		},
		form: (config) => (
			<ProFormRadio.Group
				name={config.key}
				label={config.title}
				rules={generateRules(config)}
				disabled={config.form?.disabled}
				options={config.options}
				{...config.form?.props}
			/>
		),
	},

	/**
	 * 多选类型
	 */
	checkbox: {
		table: (value, config) => {
			if (!value || !Array.isArray(value) || value.length === 0) return '-';
			
			const options = config.options || [];
			const labels = value.map(v => {
				const option = options.find(opt => opt.value === v);
				return option ? option.label : v;
			});
			
			return (
				<>
					{labels.map((label, index) => (
						<Tag key={index}>{label}</Tag>
					))}
				</>
			);
		},
		form: (config) => (
			<ProFormCheckbox.Group
				name={config.key}
				label={config.title}
				rules={generateRules(config)}
				disabled={config.form?.disabled}
				options={config.options}
				{...config.form?.props}
			/>
		),
	},

	/**
	 * 开关类型
	 */
	switch: {
		table: (value, config) => {
			const trueText = config.table?.trueText || 'Yes';
			const falseText = config.table?.falseText || 'No';
			const color = value ? 'green' : 'default';
			return <Tag color={color}>{value ? trueText : falseText}</Tag>;
		},
		form: (config) => (
			<ProFormSwitch
				name={config.key}
				label={config.title}
				rules={generateRules(config)}
				disabled={config.form?.disabled}
				{...config.form?.props}
			/>
		),
		search: (config) => (
			<ProFormSelect
				name={config.key}
				label={config.title}
				options={[
					{ label: config.search?.trueText || 'Yes', value: true },
					{ label: config.search?.falseText || 'No', value: false },
				]}
				{...config.search?.props}
			/>
		),
	},

	/**
	 * 图片类型
	 */
	image: {
		table: (value, config) => {
			if (!value) return '-';
			const width = config.table?.width || 50;
			const height = config.table?.height || 50;
			
			// 处理单图和多图
			const images = Array.isArray(value) ? value : [value];
			
			return (
				<>
					{images.map((img, index) => (
						<Image
							key={index}
							src={img}
							width={width}
							height={height}
							alt='image'
							style={{ marginRight: 8, objectFit: 'cover' }}
						/>
					))}
				</>
			);
		},
		form: (config) => (
			<ProFormUploadButton
				name={config.key}
				label={config.title}
				rules={generateRules(config)}
				disabled={config.form?.disabled}
				max={config.form?.max || 1}
				fieldProps={{
					listType: 'picture-card',
					...config.form?.props?.fieldProps,
				}}
				{...config.form?.props}
			/>
		),
	},

	/**
	 * 文件类型
	 */
	file: {
		table: (value, config) => {
			if (!value) return '-';
			const files = Array.isArray(value) ? value : [value];
			return (
				<>
					{files.map((file, index) => (
						<a key={index} href={file} target='_blank' rel='noopener noreferrer'>
							File {index + 1}
						</a>
					))}
				</>
			);
		},
		form: (config) => (
			<ProFormUploadButton
				name={config.key}
				label={config.title}
				rules={generateRules(config)}
				disabled={config.form?.disabled}
				max={config.form?.max || 1}
				{...config.form?.props}
			/>
		),
	},

	/**
	 * JSON 类型
	 */
	json: {
		table: (value, config) => {
			if (!value) return '-';
			return (
				<pre style={{ margin: 0, maxWidth: 200, overflow: 'auto', fontSize: 12 }}>
					{JSON.stringify(value, null, 2)}
				</pre>
			);
		},
		form: (config) => (
			<ProFormTextArea
				name={config.key}
				label={config.title}
				placeholder={config.form?.placeholder || 'Enter JSON'}
				rules={[
					...generateRules(config),
					{
						validator: (_, value) => {
							if (!value) return Promise.resolve();
							try {
								JSON.parse(value);
								return Promise.resolve();
							} catch (e) {
								return Promise.reject(new Error('Invalid JSON format'));
							}
						},
					},
				]}
				disabled={config.form?.disabled}
				fieldProps={{
					rows: 6,
					...config.form?.props?.fieldProps,
				}}
				{...config.form?.props}
			/>
		),
	},
};

/**
 * 生成表单验证规则
 */
function generateRules(config) {
	const rules = [];
	
	// 必填规则
	if (config.form?.required) {
		rules.push({
			required: true,
			message: config.form?.requiredMessage || `${config.title} is required`,
		});
	}
	
	// 最小长度
	if (config.form?.minLength) {
		rules.push({
			min: config.form.minLength,
			message: `${config.title} must be at least ${config.form.minLength} characters`,
		});
	}
	
	// 最大长度
	if (config.form?.maxLength) {
		rules.push({
			max: config.form.maxLength,
			message: `${config.title} must not exceed ${config.form.maxLength} characters`,
		});
	}
	
	// 正则验证
	if (config.form?.pattern) {
		rules.push({
			pattern: config.form.pattern,
			message: config.form?.patternMessage || `Invalid ${config.title} format`,
		});
	}
	
	// 自定义验证器
	if (config.form?.validator) {
		rules.push({
			validator: config.form.validator,
		});
	}
	
	// 额外的自定义规则
	if (config.form?.rules) {
		rules.push(...config.form.rules);
	}
	
	return rules;
}

/**
 * 注册自定义字段类型
 */
export function registerFieldType(type, config) {
	FIELD_TYPE_REGISTRY[type] = config;
}

/**
 * 获取字段类型配置
 */
export function getFieldType(type) {
	return FIELD_TYPE_REGISTRY[type];
}

