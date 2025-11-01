/**
 * 字段类型定义
 * 
 * 基于 vk-unicloud 的万能表格/表单思想
 * 通过 type 驱动的多组件系统
 * 
 * 参考: https://vkdoc.fsq.pub/admin/components/0%E3%80%81public.html
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
	ProFormRate,
	ProFormSlider,
	ProFormColorPicker,
	ProFormTimePicker,
	ProFormCascader,
	ProFormTreeSelect,
	ProFormGroup,
} from '@ant-design/pro-components';
import { Tag, Image } from 'antd';
import { PaperClipOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import dynamic from 'next/dynamic';

// 动态导入 Markdown 编辑器
const MarkdownEditor = dynamic(
	() => import('@/components/admin/markdown-editor'),
	{ ssr: false }
);

/**
 * 获取通用的表单属性
 * 包括 placeholder, rules, disabled, tips (tooltip), clearable 等
 * 
 * @param {Object} config - 字段配置
 * @returns {Object} 通用属性对象
 */
function getCommonFormProps(config) {
	const props = {
		name: config.key,
		label: config.title,
		placeholder: config.form?.placeholder || config.placeholder || `Enter ${config.title}`,
		rules: generateRules(config),
		disabled: config.form?.disabled,
	};
	
	// tips - 下方的固定提示 (使用 tooltip 属性)
	if (config.tips || config.form?.tips) {
		props.tooltip = config.tips || config.form?.tips;
	}
	
	// fieldProps - 用于传递给内部组件的属性
	const fieldProps = {
		...config.form?.props?.fieldProps,
	};
	
	// clearable - 是否允许清空 (默认 true)
	if (config.clearable !== undefined) {
		fieldProps.allowClear = config.clearable;
	} else if (config.form?.clearable !== undefined) {
		fieldProps.allowClear = config.form?.clearable;
	} else {
		// 默认可清空
		fieldProps.allowClear = true;
	}
	
	if (Object.keys(fieldProps).length > 0) {
		props.fieldProps = fieldProps;
	}
	
	// 合并其他自定义 props
	return {
		...props,
		...config.form?.props,
		fieldProps: {
			...fieldProps,
			...config.form?.props?.fieldProps,
		},
	};
}

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
			<ProFormText {...getCommonFormProps(config)} />
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
		form: (config) => {
			const props = getCommonFormProps(config);
			
			return (
			<ProFormTextArea
					{...props}
				fieldProps={{
					rows: 4,
						...props.fieldProps,
					}}
				/>
			);
		},
	},

	/**
	 * Markdown 编辑器类型 (markdown)
	 * 支持实时预览的 Markdown 编辑
	 */
	markdown: {
		table: (value, config) => {
			if (!value) return '-';
			const maxLength = config.table?.ellipsis ? 50 : 100;
			// 移除 markdown 标记，只显示纯文本预览
			const plainText = value.replace(/[#*_`~\[\]()]/g, '');
			return (
				<span title={plainText}>
					{plainText.length > maxLength ? `${plainText.substring(0, maxLength)}...` : plainText}
				</span>
			);
		},
		form: (config) => {
			const props = getCommonFormProps(config);
			const height = config.form?.height || 400;
			const preview = config.form?.preview || 'live'; // 'live' | 'edit' | 'preview'
			
			return (
				<div style={{ marginBottom: 24 }}>
					<div style={{ marginBottom: 8 }}>
						<label style={{ fontWeight: 500 }}>
							{props.label}
							{props.rules?.some(r => r.required) && (
								<span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
							)}
						</label>
						{props.tooltip && (
							<span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
								ⓘ {props.tooltip}
							</span>
						)}
					</div>
					<MarkdownEditor
						value={undefined} // 由 Form 控制
						height={height}
						preview={preview}
						placeholder={props.placeholder}
					/>
				</div>
			);
		},
		detail: (value, config) => {
			if (!value) return '-';
			// 在详情页显示渲染后的 Markdown
			return (
				<div 
					className="markdown-preview" 
					dangerouslySetInnerHTML={{ 
						__html: value // 实际项目中应使用 markdown 库渲染
					}} 
			/>
			);
		},
	},

	/**
	 * 富文本编辑器类型 (richtext)
	 * 使用 Markdown 编辑器实现
	 */
	richtext: {
		table: (value, config) => {
			return FIELD_TYPE_REGISTRY.markdown.table(value, config);
		},
		form: (config) => {
			return FIELD_TYPE_REGISTRY.markdown.form(config);
		},
		detail: (value, config) => {
			return FIELD_TYPE_REGISTRY.markdown.detail(value, config);
		},
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
		form: (config) => {
			const props = getCommonFormProps(config);
			const options = config.data || config.options || config.form?.data || config.form?.options || [];
			
			return (
				<ProFormRadio.Group
					{...props}
					options={options}
				/>
			);
		},
		search: (config) => {
			const options = config.data || config.options || config.search?.data || config.search?.options || [];
			return (
			<ProFormRadio.Group
				name={config.key}
				label={config.title}
					options={options}
					{...config.search?.props}
			/>
			);
		},
	},

	/**
	 * 多选类型
	 */
	checkbox: {
		table: (value, config) => {
			if (!value || !Array.isArray(value) || value.length === 0) return '-';
			
			const options = config.data || config.options || config.table?.data || config.table?.options || [];
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
		form: (config) => {
			const props = getCommonFormProps(config);
			const options = config.data || config.options || config.form?.data || config.form?.options || [];
			
			return (
			<ProFormCheckbox.Group
					{...props}
					options={options}
			/>
			);
		},
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

// ============================================
// 阶段 2：高优先级组件
// ============================================

/**
 * 评分类型 (rate)
 * 参考: https://vkdoc.fsq.pub/admin/components/16/rate.html
 */
FIELD_TYPE_REGISTRY.rate = {
	table: (value, config) => {
		if (value === null || value === undefined) return '-';
		const count = config.table?.count || 5;
		return '⭐'.repeat(Math.min(value, count));
	},
	form: (config) => {
		const props = getCommonFormProps(config);
		const count = config.form?.count || 5;
		const allowHalf = config.form?.allowHalf !== false;
		
		return (
			<ProFormRate
				{...props}
				fieldProps={{
					count,
					allowHalf,
					...props.fieldProps,
				}}
			/>
		);
	},
	detail: (value, config) => {
		if (value === null || value === undefined) return '-';
		const count = config.detail?.count || config.table?.count || 5;
		return (
			<div>
				{'⭐'.repeat(Math.min(value, count))}
				<span style={{ marginLeft: 8, color: '#666' }}>
					{value} / {count}
				</span>
			</div>
		);
	},
};

/**
 * 滑块类型 (slider)
 * 参考: https://vkdoc.fsq.pub/admin/components/17/slider.html
 */
FIELD_TYPE_REGISTRY.slider = {
	table: (value, config) => {
		if (value === null || value === undefined) return '-';
		const min = config.table?.min || 0;
		const max = config.table?.max || 100;
		return (
			<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
				<div style={{ 
					width: 100, 
					height: 6, 
					background: '#f0f0f0',
					borderRadius: 3,
					overflow: 'hidden',
				}}>
					<div style={{
						width: `${((value - min) / (max - min)) * 100}%`,
						height: '100%',
						background: '#1890ff',
					}} />
				</div>
				<span>{value}</span>
			</div>
		);
	},
	form: (config) => {
		const props = getCommonFormProps(config);
		const min = config.form?.min || 0;
		const max = config.form?.max || 100;
		const step = config.form?.step || 1;
		const marks = config.form?.marks;
		
		return (
			<ProFormSlider
				{...props}
				min={min}
				max={max}
				step={step}
				marks={marks}
				fieldProps={{
					...props.fieldProps,
				}}
			/>
		);
	},
};

/**
 * 颜色选择类型 (color)
 * 参考: https://vkdoc.fsq.pub/admin/components/18/color.html
 */
FIELD_TYPE_REGISTRY.color = {
	table: (value, config) => {
		if (!value) return '-';
		return (
			<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
				<div style={{
					width: 24,
					height: 24,
					borderRadius: 4,
					background: value,
					border: '1px solid #d9d9d9',
				}} />
				<span style={{ fontFamily: 'monospace' }}>{value}</span>
			</div>
		);
	},
	form: (config) => {
		const props = getCommonFormProps(config);
		
		return (
			<ProFormColorPicker
				{...props}
				fieldProps={{
					showText: true,
					...props.fieldProps,
				}}
			/>
		);
	},
};

/**
 * 文件上传类型 (file)
 * 参考: https://vkdoc.fsq.pub/admin/components/19/file.html
 */
FIELD_TYPE_REGISTRY.file = {
	table: (value, config) => {
		if (!value) return '-';
		const files = Array.isArray(value) ? value : [value];
		return (
			<div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
				{files.map((file, index) => {
					const fileName = typeof file === 'string' ? file.split('/').pop() : file.name;
					return (
						<Tag key={index} icon={<PaperClipOutlined />}>
							{fileName}
						</Tag>
					);
				})}
			</div>
		);
	},
	form: (config) => {
		const props = getCommonFormProps(config);
		const max = config.form?.max || 5;
		const accept = config.form?.accept || '*';
		const action = config.form?.action || '/api/upload';
		
		return (
			<ProFormUploadButton
				{...props}
				max={max}
				fieldProps={{
					accept,
					listType: 'text',
					...props.fieldProps,
				}}
				action={action}
			/>
		);
	},
};

/**
 * 时间选择类型 (time)
 * 参考: https://vkdoc.fsq.pub/admin/components/21/time.html
 */
FIELD_TYPE_REGISTRY.time = {
	table: (value, config) => {
		if (!value) return '-';
		const format = config.table?.format || 'HH:mm:ss';
		return dayjs(value, format).format(format);
	},
	form: (config) => {
		const props = getCommonFormProps(config);
		const format = config.form?.format || 'HH:mm:ss';
		
		return (
			<ProFormTimePicker
				{...props}
				fieldProps={{
					format,
					...props.fieldProps,
				}}
			/>
		);
	},
	search: (config) => {
		const format = config.search?.format || 'HH:mm:ss';
		return (
			<ProFormTimePicker
				name={config.key}
				label={config.title}
				fieldProps={{
					format,
					...config.search?.props?.fieldProps,
				}}
				{...config.search?.props}
			/>
		);
	},
};

/**
 * 级联选择类型 (cascader)
 * 参考: https://vkdoc.fsq.pub/admin/components/11/cascader.html
 */
FIELD_TYPE_REGISTRY.cascader = {
	table: (value, config) => {
		if (!value || !Array.isArray(value) || value.length === 0) return '-';
		return value.join(' / ');
	},
	form: (config) => {
		const props = getCommonFormProps(config);
		const options = config.form?.options || config.data || [];
		const changeOnSelect = config.form?.changeOnSelect !== false;
		const showSearch = config.form?.showSearch !== false;
		
		return (
			<ProFormCascader
				{...props}
				fieldProps={{
					options,
					changeOnSelect,
					showSearch,
					...props.fieldProps,
				}}
			/>
		);
	},
	search: (config) => {
		const options = config.search?.options || config.data || [];
		return (
			<ProFormCascader
				name={config.key}
				label={config.title}
				fieldProps={{
					options,
					showSearch: true,
					...config.search?.props?.fieldProps,
				}}
				{...config.search?.props}
			/>
		);
	},
};

// ============================================
// 阶段 3：中优先级组件
// ============================================

/**
 * JSON 编辑器类型 (json)
 * 参考: https://vkdoc.fsq.pub/admin/components/23/json.html
 */
FIELD_TYPE_REGISTRY.json = {
	table: (value, config) => {
		if (!value) return '-';
		try {
			const jsonStr = typeof value === 'string' ? value : JSON.stringify(value);
			const preview = jsonStr.length > 50 ? jsonStr.substring(0, 50) + '...' : jsonStr;
			return (
				<code style={{ 
					background: '#f5f5f5', 
					padding: '2px 6px', 
					borderRadius: 4,
					fontSize: 12,
					fontFamily: 'monospace',
				}}>
					{preview}
				</code>
			);
		} catch (error) {
			return '-';
		}
	},
	form: (config) => {
		const props = getCommonFormProps(config);
		
		return (
			<ProFormTextArea
				{...props}
				fieldProps={{
					rows: 8,
					style: { fontFamily: 'monospace', fontSize: 13 },
					...props.fieldProps,
				}}
				// 添加 JSON 验证
				rules={[
					...props.rules,
					{
						validator: (_, value) => {
							if (!value) return Promise.resolve();
							try {
								JSON.parse(value);
								return Promise.resolve();
							} catch (error) {
								return Promise.reject(new Error('Invalid JSON format'));
							}
						},
					},
				]}
			/>
		);
	},
	detail: (value, config) => {
		if (!value) return '-';
		try {
			const jsonStr = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
			return (
				<pre style={{
					background: '#f5f5f5',
					padding: 12,
					borderRadius: 4,
					fontSize: 13,
					fontFamily: 'monospace',
					maxHeight: 400,
					overflow: 'auto',
				}}>
					{jsonStr}
				</pre>
			);
		} catch (error) {
			return String(value);
		}
	},
};

/**
 * 动态数组类型 (array)
 * 参考: https://vkdoc.fsq.pub/admin/components/24/array.html
 * 
 * 注意: 这是简化版本，使用 textarea 输入（每行一个值）
 * 完整版需要复杂的子表单系统
 */
FIELD_TYPE_REGISTRY.array = {
	table: (value, config) => {
		if (!value || !Array.isArray(value) || value.length === 0) return '-';
		return (
			<div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
				{value.map((item, index) => (
					<Tag key={index}>{String(item)}</Tag>
				))}
			</div>
		);
	},
	form: (config) => {
		const props = getCommonFormProps(config);
		
		return (
			<ProFormTextArea
				{...props}
				fieldProps={{
					rows: 4,
					placeholder: 'Enter one item per line',
					...props.fieldProps,
				}}
				// 转换函数：字符串 → 数组
				transform={(value) => {
					if (!value) return [];
					return value.split('\n').filter(line => line.trim());
				}}
				// 格式化函数：数组 → 字符串
				convertValue={(value) => {
					if (!value || !Array.isArray(value)) return '';
					return value.join('\n');
				}}
			/>
		);
	},
};

/**
 * 树形选择类型 (tree-select)
 * 参考: https://vkdoc.fsq.pub/admin/components/27/tree-select.html
 */
FIELD_TYPE_REGISTRY['tree-select'] = {
	table: (value, config) => {
		if (!value) return '-';
		// 如果是数组，显示所有值
		if (Array.isArray(value)) {
			return value.join(', ');
		}
		// 尝试从 treeData 中找到对应的 label
		const treeData = config.table?.treeData || config.data || [];
		const label = findTreeNodeLabel(treeData, value);
		return label || value;
	},
	form: (config) => {
		const props = getCommonFormProps(config);
		const treeData = config.form?.treeData || config.data || [];
		const multiple = config.form?.multiple || false;
		const treeCheckable = config.form?.treeCheckable || false;
		const showSearch = config.form?.showSearch !== false;
		
		return (
			<ProFormTreeSelect
				{...props}
				fieldProps={{
					treeData,
					multiple,
					treeCheckable,
					showSearch,
					treeDefaultExpandAll: true,
					...props.fieldProps,
				}}
			/>
		);
	},
	search: (config) => {
		const treeData = config.search?.treeData || config.data || [];
		return (
			<ProFormTreeSelect
				name={config.key}
				label={config.title}
				fieldProps={{
					treeData,
					showSearch: true,
					treeDefaultExpandAll: true,
					...config.search?.props?.fieldProps,
				}}
				{...config.search?.props}
			/>
		);
	},
};

/**
 * 图标选择器类型 (icon)
 * 参考: https://vkdoc.fsq.pub/admin/components/26/icon.html
 * 
 * 注意: 这是简化版本，使用 select 选择预定义图标
 * 完整版需要图标选择面板
 */
FIELD_TYPE_REGISTRY.icon = {
	table: (value, config) => {
		if (!value) return '-';
		// 尝试动态导入 Ant Design 图标
		try {
			const IconComponent = require('@ant-design/icons')[value];
			if (IconComponent) {
				return (
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<IconComponent style={{ fontSize: 18 }} />
						<span>{value}</span>
					</div>
				);
			}
		} catch (error) {
			// 如果图标不存在，只显示名称
		}
		return <span>{value}</span>;
	},
	form: (config) => {
		const props = getCommonFormProps(config);
		const icons = config.form?.icons || config.data || getCommonIcons();
		
		return (
			<ProFormSelect
				{...props}
				options={icons.map(icon => ({
					label: icon,
					value: icon,
				}))}
				showSearch
				fieldProps={{
					...props.fieldProps,
				}}
			/>
		);
	},
};

/**
 * 辅助函数：从树形数据中查找节点的 label
 */
function findTreeNodeLabel(treeData, value) {
	for (const node of treeData) {
		if (node.value === value) {
			return node.label || node.title;
		}
		if (node.children) {
			const label = findTreeNodeLabel(node.children, value);
			if (label) return label;
		}
	}
	return null;
}

/**
 * 辅助函数：获取常用图标列表
 */
function getCommonIcons() {
	return [
		'HomeOutlined',
		'UserOutlined',
		'SettingOutlined',
		'SearchOutlined',
		'PlusOutlined',
		'EditOutlined',
		'DeleteOutlined',
		'CheckOutlined',
		'CloseOutlined',
		'HeartOutlined',
		'StarOutlined',
		'LikeOutlined',
		'MessageOutlined',
		'NotificationOutlined',
		'BellOutlined',
		'ShoppingCartOutlined',
		'FileOutlined',
		'FolderOutlined',
		'MailOutlined',
		'PhoneOutlined',
		'PictureOutlined',
		'CameraOutlined',
		'CloudOutlined',
		'DownloadOutlined',
		'UploadOutlined',
	];
}

// ============================================
// 布局类型
// ============================================

/**
 * 分组布局类型 (group)
 * 参考: https://vkdoc.fsq.pub/admin/3/form.html#props
 * 
 * 支持多列布局和栅格系统
 * 
 * 注意: ProFormGroup 内部使用 ant-space 布局，不支持 colProps
 * 需要通过 style 设置每个字段的宽度
 */
FIELD_TYPE_REGISTRY.group = {
	table: null, // 分组不在表格中显示
	form: (config) => {
		const columns = config.columns || [];
		const title = config.title;
		
		// 渲染子字段，并应用宽度样式
		const children = columns.map((field, index) => {
			const typeConfig = FIELD_TYPE_REGISTRY[field.type];
			if (!typeConfig?.form) return null;
			
			// 获取栅格配置 (默认 12 = 50%)
			const span = field.col?.span || 12;
			
			// 获取字段组件
			const fieldComponent = typeConfig.form(field);
			
			// 克隆组件
			// ProFormGroup 内部用 Space 布局，需要通过 CSS 和 data 属性控制宽度
			const cloned = React.cloneElement(fieldComponent, {
				key: field.key || `form-field-${index}`,
			});
			
			// 包装在一个 div 中，添加 data-span 属性供 CSS 使用
			return (
				<div key={field.key || `form-field-${index}`} data-span={span}>
					{cloned}
				</div>
			);
		});
		
		return (
			<ProFormGroup
				key={config.key || `group-${Math.random()}`}
				title={title}
				style={{ width: '100%' }}
			>
				{children}
			</ProFormGroup>
		);
	},
	search: null, // 分组不在搜索中使用
	detail: null, // 分组不在详情中显示
};

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

