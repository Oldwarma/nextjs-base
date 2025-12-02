/**
 * 字段类型定义
 * 
 * 基于 Ant Design 官方组件标准实现
 * 完全支持 Ant Design 官方 API 和参数配置
 * 
 * 参考: https://ant.design/components/overview-cn/
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
	ProFormList,
} from '@ant-design/pro-components';
import { 
	Tag, 
	Image, 
	Button, 
	Form, 
	Input,
	InputNumber,
	Select,
	Radio,
	Checkbox,
	Switch,
	DatePicker,
	TimePicker,
	Slider,
	Rate,
	ColorPicker,
	Upload,
	Cascader,
	TreeSelect,
	AutoComplete,
} from 'antd';
import { PaperClipOutlined, UploadOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import dynamic from 'next/dynamic';

// 动态导入 Markdown 编辑器
const MarkdownEditor = dynamic(
	() => import('@/components/admin/markdown-editor'),
	{ ssr: false }
);

// 动态导入图标选择器
const IconPicker = dynamic(
	() => import('@/components/admin/icon-picker').then(mod => ({ default: mod.default })),
	{ ssr: false }
);

// 导入图标渲染函数
import { renderIcon } from '@/components/admin/icon-picker';

// 动态导入上传组件
const SingleImageUpload = dynamic(
	() => import('@/components/admin/uploads/single-image-upload'),
	{ ssr: false }
);

const MultiImageUpload = dynamic(
	() => import('@/components/admin/uploads/multi-image-upload'),
	{ ssr: false }
);

const AvatarUpload = dynamic(
	() => import('@/components/admin/uploads/avatar-upload'),
	{ ssr: false }
);

const FileUpload = dynamic(
	() => import('@/components/admin/uploads/file-upload'),
	{ ssr: false }
);

const FileSelect = dynamic(
	() => import('@/components/admin/uploads/file-select'),
	{ ssr: false }
);

// 动态导入 JSON 编辑器
const JsonEditor = dynamic(
	() => import('@/components/admin/json-editor'),
	{ ssr: false }
);

// Icon Picker Button 组件
const IconPickerButton = ({ value, onChange }) => {
	const [open, setOpen] = React.useState(false);
	const IconComponent = value ? renderIcon(value, { style: { fontSize: 20 } }) : null;
	
	return (
		<>
			<Button
				type="default"
				onClick={() => setOpen(true)}
				style={{
					width: '100%',
					height: 40,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 8,
				}}
			>
				{IconComponent || <PaperClipOutlined />}
				<span>{value || 'Select Icon'}</span>
			</Button>
			<IconPicker
				open={open}
				onClose={() => setOpen(false)}
				onSelect={(iconName) => {
					onChange?.(iconName);
					setOpen(false);
				}}
				value={value}
			/>
		</>
	);
};

/**
 * 不支持 allowClear 属性的 Ant Design 组件类型列表
 * 根据 Ant Design 官方文档整理
 */
const COMPONENTS_WITHOUT_ALLOW_CLEAR = [
	'number',      // InputNumber
	'money',       // InputNumber (金额)
	'percentage',  // InputNumber (百分比)
	'switch',      // Switch
	'rate',        // Rate
	'slider',      // Slider
	'image',       // Upload (图片)
	'file',        // Upload (文件)
	'upload',      // Upload (通用)
	'radio',       // Radio.Group
	'checkbox',    // Checkbox.Group
	'markdown',    // Markdown 编辑器
];

/**
 * 获取通用的表单属性
 * 完全支持 Ant Design 官方 API
 * 自动识别组件是否支持 allowClear
 * 
 * @param {Object} config - 字段配置
 * @param {Object} options - 选项
 * @param {Boolean} options.skipAllowClear - 是否跳过 allowClear（手动覆盖）
 * @returns {Object} 通用属性对象
 */
function getCommonFormProps(config, options = {}) {
	const props = {
		name: config.key,
		label: config.title,
		placeholder: config.form?.placeholder || config.placeholder || `Enter ${config.title}`,
		rules: generateRules(config),
		disabled: config.form?.disabled,
	};
	
	// tooltip - Ant Design 官方支持的 tooltip 属性
	if (config.tips || config.form?.tips) {
		props.tooltip = config.tips || config.form?.tips;
	}
	
	// fieldProps - 用于传递给 Ant Design 组件的所有原生属性
	// 支持官方文档中的所有 API 参数
	const fieldProps = {
		...config.form?.fieldProps, // 优先使用标准的 fieldProps
		...config.form?.props?.fieldProps, // 兼容旧的嵌套方式
	};
	
	// allowClear - Ant Design 官方 API
	// 自动判断当前字段类型是否支持 allowClear
	const shouldSkipAllowClear = options.skipAllowClear || COMPONENTS_WITHOUT_ALLOW_CLEAR.includes(config.type);
	
	if (!shouldSkipAllowClear) {
	if (config.clearable !== undefined) {
		fieldProps.allowClear = config.clearable;
	} else if (config.form?.clearable !== undefined) {
		fieldProps.allowClear = config.form?.clearable;
		} else if (fieldProps.allowClear === undefined) {
			// 默认可清空（符合 Ant Design 官方默认行为）
		fieldProps.allowClear = true;
		}
	}
	
	if (Object.keys(fieldProps).length > 0) {
		props.fieldProps = fieldProps;
	}
	
	// 合并其他自定义 props（支持 Pro Components 的所有属性）
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
 * 获取原生 Ant Design 组件属性
 * 用于直接使用 Ant Design 组件时的属性提取
 * 
 * @param {Object} config - 字段配置
 * @returns {Object} Ant Design 组件原生属性
 */
function getAntdComponentProps(config) {
	// 提取所有 Ant Design 官方支持的属性
	const antdProps = {
		placeholder: config.form?.placeholder || config.placeholder,
		disabled: config.form?.disabled,
		allowClear: true, // Ant Design 默认值
		...config.form?.fieldProps, // 所有官方 API 参数
		...config.form?.componentProps, // 额外的组件特定属性
	};
	
	// 处理 clearable 配置
	if (config.clearable !== undefined) {
		antdProps.allowClear = config.clearable;
	} else if (config.form?.clearable !== undefined) {
		antdProps.allowClear = config.form?.clearable;
	}
	
	return antdProps;
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
	 * 文本输入框 (Input)
	 * Ant Design 官方文档: https://ant.design/components/input-cn
	 * 
	 * 支持的 Ant Design 官方 API:
	 * - prefix/suffix: 前缀/后缀图标或文字
	 * - showCount: 显示字数统计
	 * - maxLength: 最大长度
	 * - allowClear: 是否显示清除按钮
	 * - size: 输入框大小 ('large' | 'middle' | 'small')
	 * - status: 校验状态 ('error' | 'warning')
	 * - variant: 形态变体 ('outlined' | 'borderless' | 'filled')
	 * 以及所有 Input 组件支持的其他官方属性
	 * 
	 * 注意: addonBefore/addonAfter 已废弃，请使用 prefix/suffix 或 Space.Compact
	 */
	text: {
		table: (value, config) => {
			if (!value) return '-';
			return <span>{value}</span>;
		},
		form: (config) => {
			const props = getCommonFormProps(config);
			return <ProFormText {...props} />;
		},
		search: (config) => {
			const props = {
				name: config.key,
				label: config.title,
				placeholder: config.search?.placeholder || `Search by ${config.title}`,
				fieldProps: {
					allowClear: true,
					...config.search?.fieldProps,
				},
				...config.search?.props,
			};
			return <ProFormText {...props} />;
		},
	},

	/**
	 * 多行文本输入框 (Input.TextArea)
	 * Ant Design 官方文档: https://ant.design/components/input-cn#inputtextarea
	 * 
	 * 支持的 Ant Design 官方 API:
	 * - autoSize: 自适应内容高度 (boolean | {minRows, maxRows})
	 * - showCount: 显示字数统计
	 * - maxLength: 最大长度
	 * - rows: 默认行数
	 * - allowClear: 是否显示清除按钮
	 * 以及所有 TextArea 组件支持的其他官方属性
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
			// 默认行数为 4，可通过 fieldProps.rows 覆盖
			const fieldProps = {
				rows: 4,
				...props.fieldProps,
			};
			return (
			<ProFormTextArea
					{...props}
					fieldProps={fieldProps}
				/>
			);
		},
		search: (config) => {
			// textarea 字段在搜索时使用单行文本输入框（更适合搜索场景）
			const props = {
				name: config.key,
				label: config.title,
				placeholder: config.search?.placeholder || `Search by ${config.title}`,
				fieldProps: {
					allowClear: true,
					...config.search?.fieldProps,
				},
				...config.search?.props,
			};
			return <ProFormText {...props} />;
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
			
			// 使用 Form.Item 包裹，确保值能正确绑定到表单
			return (
				<Form.Item
					name={props.name}
					label={props.label}
					rules={props.rules}
					tooltip={props.tooltip}
					required={props.required}
					{...props.formItemProps}
				>
					<MarkdownEditor
						height={height}
						preview={preview}
						placeholder={props.placeholder || `Enter ${props.label || 'content'}...`}
					/>
				</Form.Item>
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
	 * 数字输入框 (InputNumber)
	 * Ant Design 官方文档: https://ant.design/components/input-number-cn
	 * 
	 * 支持的 Ant Design 官方 API:
	 * - min: 最小值
	 * - max: 最大值
	 * - step: 步长
	 * - precision: 数值精度
	 * - formatter: 指定输入框展示值的格式
	 * - parser: 指定从 formatter 里转换回数字的方式
	 * - prefix: 前缀图标或文字
	 * - controls: 是否显示增减按钮
	 * - keyboard: 是否启用键盘快捷行为
	 * - stringMode: 字符串模式(用于高精度小数)
	 * 以及所有 InputNumber 组件支持的其他官方属性
	 * 
	 * 注意: addonBefore/addonAfter 已废弃，请使用 prefix 或 Space.Compact
	 */
	number: {
		table: (value, config) => {
			if (value === null || value === undefined) return '-';
			const precision = config.table?.precision ?? 0;
			const formatter = config.table?.formatter;
			if (formatter && typeof formatter === 'function') {
				return <span>{formatter(value)}</span>;
			}
			return <span>{Number(value).toFixed(precision)}</span>;
		},
		form: (config) => {
			const props = getCommonFormProps(config);
			const fieldProps = {
					precision: config.form?.precision ?? 0,
					min: config.form?.min,
					max: config.form?.max,
				step: config.form?.step,
				...props.fieldProps,
			};
			return (
			<ProFormDigit
					{...props}
					fieldProps={fieldProps}
				/>
			);
		},
		search: (config) => {
			const props = {
				name: config.key,
				label: config.title,
				placeholder: config.search?.placeholder || `Search by ${config.title}`,
				fieldProps: {
					precision: config.search?.precision ?? 0,
					...config.search?.fieldProps,
				},
				...config.search?.props,
			};
			return <ProFormDigit {...props} />;
		},
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
		form: (config) => {
			const props = getCommonFormProps(config);
			const fieldProps = {
					precision: config.form?.precision ?? 2,
					min: config.form?.min ?? 0,
					prefix: config.form?.prefix ?? '$',
				...props.fieldProps,
			};
			return (
				<ProFormDigit
					{...props}
					fieldProps={fieldProps}
			/>
			);
		},
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
		form: (config) => {
			const props = getCommonFormProps(config);
			const fieldProps = {
					precision: config.form?.precision ?? 2,
					min: 0,
					max: 100,
					formatter: (value) => `${value}%`,
					parser: (value) => value.replace('%', ''),
				...props.fieldProps,
			};
			return (
				<ProFormDigit
					{...props}
					fieldProps={fieldProps}
			/>
			);
		},
	},

	/**
	 * 日期选择器 (DatePicker)
	 * Ant Design 官方文档: https://ant.design/components/date-picker-cn
	 * 
	 * 支持的 Ant Design 官方 API:
	 * - format: 日期格式化 (默认: 'YYYY-MM-DD')
	 * - picker: 选择器类型 ('date' | 'week' | 'month' | 'quarter' | 'year')
	 * - showTime: 是否显示时间选择
	 * - disabledDate: 不可选择的日期
	 * - placeholder: 占位符
	 * - allowClear: 是否显示清除按钮
	 * - disabled: 是否禁用
	 * - size: 输入框大小
	 * - presets: 预设时间范围快捷选择
	 * - onChange: 时间发生变化的回调
	 * 以及所有 DatePicker 组件支持的其他官方属性
	 */
	date: {
		table: (value, config) => {
			if (!value) return '-';
			const format = config.table?.format || 'YYYY-MM-DD';
			return <span>{dayjs(value).format(format)}</span>;
		},
		form: (config) => {
			const props = getCommonFormProps(config);
			const fieldProps = {
					format: config.form?.format || 'YYYY-MM-DD',
				...props.fieldProps,
			};
			return (
			<ProFormDatePicker
					{...props}
					fieldProps={fieldProps}
				/>
			);
		},
		search: (config) => {
			const props = {
				name: config.key,
				label: config.title,
				placeholder: config.search?.placeholder || `Search by ${config.title}`,
				fieldProps: {
					format: config.search?.format || 'YYYY-MM-DD',
					allowClear: true,
					...config.search?.fieldProps,
				},
				...config.search?.props,
			};
			return <ProFormDatePicker {...props} />;
		},
	},

	/**
	 * 日期时间选择器 (DatePicker with showTime)
	 * Ant Design 官方文档: https://ant.design/components/date-picker-cn#components-date-picker-demo-time
	 * 
	 * 支持的 Ant Design 官方 API:
	 * - format: 日期时间格式化 (默认: 'YYYY-MM-DD HH:mm:ss')
	 * - showTime: 时间选择器配置 (boolean | Object)
	 * - disabledDate/disabledTime: 不可选择的日期/时间
	 * - 以及 DatePicker 的所有其他官方属性
	 */
	datetime: {
		table: (value, config) => {
			if (!value) return '-';
			const format = config.table?.format || 'YYYY-MM-DD HH:mm:ss';
			return <span>{dayjs(value).format(format)}</span>;
		},
		form: (config) => {
			const props = getCommonFormProps(config);
			const fieldProps = {
				showTime: config.form?.showTime !== undefined ? config.form.showTime : true,
					format: config.form?.format || 'YYYY-MM-DD HH:mm:ss',
				...props.fieldProps,
			};
			return (
				<ProFormDatePicker
					{...props}
					fieldProps={fieldProps}
			/>
			);
		},
	},

	/**
	 * 日期范围选择器 (DatePicker.RangePicker)
	 * Ant Design 官方文档: https://ant.design/components/date-picker-cn#rangepicker
	 * 
	 * 支持的 Ant Design 官方 API:
	 * - format: 日期格式化
	 * - picker: 选择器类型
	 * - disabledDate: 不可选择的日期
	 * - presets: 预设时间范围
	 * - separator: 分隔符
	 * - 以及 RangePicker 的所有其他官方属性
	 */
	daterange: {
		table: null, // 不在表格中显示
		form: null, // 不在表单中显示
		search: (config) => {
			const props = {
				name: config.key,
				label: config.title,
				fieldProps: {
					format: config.search?.format || 'YYYY-MM-DD',
					allowClear: true,
					...config.search?.fieldProps,
				},
				...config.search?.props,
			};
			return <ProFormDateRangePicker {...props} />;
		},
	},

	/**
	 * 日期时间范围选择器 (DatePicker.RangePicker with showTime)
	 * Ant Design 官方文档: https://ant.design/components/date-picker-cn#rangepicker
	 * 
	 * 支持 RangePicker 的所有官方 API，包括 showTime 配置
	 */
	datetimerange: {
		table: null,
		form: null,
		search: (config) => {
			const props = {
				name: config.key,
				label: config.title,
				fieldProps: {
					showTime: config.search?.showTime !== undefined ? config.search.showTime : true,
					format: config.search?.format || 'YYYY-MM-DD HH:mm:ss',
					allowClear: true,
					...config.search?.fieldProps,
				},
				...config.search?.props,
			};
			return <ProFormDateRangePicker {...props} />;
		},
	},

	/**
	 * 下拉选择器 (Select)
	 * Ant Design 官方文档: https://ant.design/components/select-cn
	 * 
	 * 支持的 Ant Design 官方 API:
	 * - options: 选项数据 [{label, value, disabled, ...}]
	 * - mode: 模式 ('multiple' | 'tags')
	 * - allowClear: 是否显示清除按钮
	 * - showSearch: 是否可搜索
	 * - filterOption: 自定义搜索逻辑
	 * - optionFilterProp: 搜索时过滤的字段
	 * - placeholder: 占位符
	 * - disabled: 是否禁用
	 * - loading: 加载状态
	 * - maxTagCount: 最多显示多少个 tag (多选模式)
	 * - fieldNames: 自定义字段名 {label, value, options}
	 * - dropdownRender: 自定义下拉框内容
	 * - onSearch: 搜索回调
	 * - onSelect/onDeselect: 选择/取消选择回调
	 * 以及所有 Select 组件支持的其他官方属性
	 */
	select: {
		table: (value, config) => {
			if (!value && value !== 0) return '-';
			
			// 优先从 table.valueEnum 查找（Ant Design Pro 风格）
			const tableValueEnum = config.table?.valueEnum || config.valueEnum || {};
			let options = config.options || config.data || [];
			// 确保 options 是数组
			if (typeof options === 'function' || !Array.isArray(options)) {
				options = [];
			}
			
			// 状态到颜色的映射（Ant Design Pro 风格）
			const statusColorMap = {
				Success: 'success',
				Error: 'error',
				Default: 'default',
				Processing: 'processing',
				Warning: 'warning',
			};
			
			// 处理多选情况
			if (Array.isArray(value)) {
				return (
					<>
						{value.map((v, index) => {
							let label = v;
							let color = undefined;
							
							// 优先从 table.valueEnum 查找
							if (tableValueEnum[v]) {
								const enumConfig = tableValueEnum[v];
								label = enumConfig.text || enumConfig.label || v;
								// 支持 status 映射
								if (enumConfig.status) {
									color = statusColorMap[enumConfig.status] || enumConfig.status.toLowerCase();
								} else {
									color = enumConfig.color;
								}
							} else {
								// 回退：从 options 查找
							const option = options.find(opt => opt.value === v);
								if (option) {
									label = option.label;
									color = option.color;
								}
							}
							
							return color ? <Tag key={index} color={color}>{label}</Tag> : <Tag key={index}>{label}</Tag>;
						})}
					</>
				);
			}
			
			// 单选情况
			let label = value;
			let color = undefined;
			
			// 优先从 table.valueEnum 查找
			if (tableValueEnum[value]) {
				const enumConfig = tableValueEnum[value];
				label = enumConfig.text || enumConfig.label || value;
				// 支持 status 映射
				if (enumConfig.status) {
					color = statusColorMap[enumConfig.status] || enumConfig.status.toLowerCase();
				} else {
					color = enumConfig.color;
				}
			} else {
				// 回退：从 options 查找
			const option = options.find(opt => opt.value === value);
			if (option) {
				label = option.label;
				color = option.color;
				}
			}
			
			return color ? <Tag color={color}>{label}</Tag> : <span>{label}</span>;
		},
		form: (config) => {
			const props = getCommonFormProps(config);
			// 获取 options，确保是数组而不是函数
			let options = config.options || config.data || config.form?.options || config.form?.data;
			// 如果 options 是函数，说明是动态选项，此时应该已经在 DynamicFormFields 中处理过了
			// 但为了安全起见，如果还是函数就返回空数组
			if (typeof options === 'function') {
				options = [];
			}
			// 确保 options 是数组
			if (!Array.isArray(options)) {
				options = [];
			}
			
			const fieldProps = {
				showSearch: true, // 默认可搜索
				placeholder: config.form?.placeholder || config.placeholder || `Select ${config.title}`, // 确保 placeholder 在 fieldProps 中
				...props.fieldProps,
			};
			
			// 移除顶层的 placeholder（Select 不需要）
			const { placeholder, ...propsWithoutPlaceholder } = props;
			
			return (
			<ProFormSelect
					{...propsWithoutPlaceholder}
					options={options}
				valueEnum={config.valueEnum}
					fieldProps={fieldProps}
			/>
			);
		},
		search: (config) => {
			let options = config.options || config.data || config.search?.options || config.search?.data;
			// 确保 options 是数组
			if (typeof options === 'function' || !Array.isArray(options)) {
				options = [];
			}
			const props = {
				name: config.key,
				label: config.title,
				placeholder: config.search?.placeholder || `Search by ${config.title}`,
				options: options,
				valueEnum: config.valueEnum,
				fieldProps: {
					allowClear: true,
					showSearch: true,
					...config.search?.fieldProps,
				},
				...config.search?.props,
			};
			return <ProFormSelect {...props} />;
		},
	},

	/**
	 * 单选框 (Radio)
	 * Ant Design 官方文档: https://ant.design/components/radio-cn
	 * 
	 * 支持的 Ant Design 官方 API:
	 * - options: 选项数据 [{label, value, disabled, ...}]
	 * - optionType: 样式类型 ('default' | 'button')
	 * - buttonStyle: button 样式 ('outline' | 'solid')
	 * - disabled: 是否禁用
	 * - size: 大小 ('large' | 'middle' | 'small')
	 * - onChange: 变化回调
	 * 以及所有 Radio.Group 组件支持的其他官方属性
	 */
	radio: {
		table: (value, config) => {
			// 使用 select 的渲染逻辑
			return FIELD_TYPE_REGISTRY.select.table(value, config);
		},
	form: (config) => {
		const props = getCommonFormProps(config);
		let options = config.data || config.options || config.form?.data || config.form?.options || [];
		// 确保 options 是数组
		if (typeof options === 'function' || !Array.isArray(options)) {
			options = [];
		}
		
		// Radio.Group 不支持 allowClear 属性，需要从 fieldProps 中移除
		const { fieldProps, ...otherProps } = props;
		const { allowClear, ...cleanFieldProps } = fieldProps || {};
		
		return (
			<ProFormRadio.Group
				{...otherProps}
				fieldProps={cleanFieldProps}
				options={options}
			/>
		);
	},
		search: (config) => {
			let options = config.data || config.options || config.search?.data || config.search?.options || [];
			// 确保 options 是数组
			if (typeof options === 'function' || !Array.isArray(options)) {
				options = [];
			}
			const { allowClear, ...cleanFieldProps } = config.search?.fieldProps || {};
			
			return (
			<ProFormRadio.Group
				name={config.key}
				label={config.title}
					options={options}
					fieldProps={cleanFieldProps}
					{...config.search?.props}
			/>
			);
		},
	},

	/**
	 * 多选框 (Checkbox)
	 * Ant Design 官方文档: https://ant.design/components/checkbox-cn
	 * 
	 * 支持的 Ant Design 官方 API:
	 * - options: 选项数据 [{label, value, disabled, ...}]
	 * - disabled: 是否禁用
	 * - onChange: 变化回调
	 * 以及所有 Checkbox.Group 组件支持的其他官方属性
	 */
	checkbox: {
		table: (value, config) => {
			if (!value || !Array.isArray(value) || value.length === 0) return '-';
			
			let options = config.data || config.options || config.table?.data || config.table?.options || [];
			// 确保 options 是数组
			if (typeof options === 'function' || !Array.isArray(options)) {
				options = [];
			}
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
		let options = config.data || config.options || config.form?.data || config.form?.options || [];
		// 确保 options 是数组
		if (typeof options === 'function' || !Array.isArray(options)) {
			options = [];
		}
		
		// Checkbox.Group 不支持 allowClear 属性，需要从 fieldProps 中移除
		const { fieldProps, ...otherProps } = props;
		const { allowClear, ...cleanFieldProps } = fieldProps || {};
		
		return (
		<ProFormCheckbox.Group
				{...otherProps}
				fieldProps={cleanFieldProps}
				options={options}
		/>
		);
	},
	},

	/**
	 * 标签选择 (Tag Select)
	 * 
	 * 用于选择多个标签，在表格中以 Tag 形式展示
	 * 在表单中使用 Select 组件的 tags 模式，支持自定义输入
	 * 
	 * 配置示例:
	 * {
	 *   key: 'tags',
	 *   title: 'Tags',
	 *   type: 'tag',
	 *   data: [
	 *     { label: 'Hot', value: 'hot', color: 'red' },
	 *     { label: 'New', value: 'new', color: 'green' },
	 *   ],
	 *   form: {
	 *     placeholder: 'Select or input tags',
	 *     maxTagCount: 5,           // 最多显示多少个 tag
	 *     allowCustom: true,        // 是否允许自定义输入（默认 true）
	 *   }
	 * }
	 */
	tag: {
		table: (value, config) => {
			if (!value || !Array.isArray(value) || value.length === 0) return '-';
			
			let options = config.data || config.options || config.table?.data || config.table?.options || [];
			// 确保 options 是数组
			if (typeof options === 'function' || !Array.isArray(options)) {
				options = [];
			}
			
			return (
				<div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
					{value.map((v, index) => {
						const option = options.find(opt => opt.value === v);
						const label = option ? option.label : v;
						const color = option?.color;
						return (
							<Tag key={index} color={color}>{label}</Tag>
						);
					})}
				</div>
			);
		},
		form: (config) => {
			const props = getCommonFormProps(config);
			let options = config.data || config.options || config.form?.data || config.form?.options || [];
			// 确保 options 是数组
			if (typeof options === 'function' || !Array.isArray(options)) {
				options = [];
			}
			
			// 是否允许自定义输入，默认 true
			const allowCustom = config.form?.allowCustom !== false;
			
			return (
				<ProFormSelect
					{...props}
					mode={allowCustom ? 'tags' : 'multiple'}
					options={options}
					fieldProps={{
						...props.fieldProps,
						maxTagCount: config.form?.maxTagCount,
						tokenSeparators: [',', ' '],  // 支持逗号和空格分隔
					}}
				/>
			);
		},
		search: (config) => {
			let options = config.data || config.options || config.search?.data || config.search?.options || [];
			// 确保 options 是数组
			if (typeof options === 'function' || !Array.isArray(options)) {
				options = [];
			}
			
			return {
				valueType: 'select',
				fieldProps: {
					mode: 'multiple',
					options: options,
					placeholder: config.search?.placeholder || `Select ${config.title}`,
				},
			};
		},
		detail: (value, config) => {
			if (!value || !Array.isArray(value) || value.length === 0) return '-';
			
			let options = config.data || config.options || [];
			// 确保 options 是数组
			if (typeof options === 'function' || !Array.isArray(options)) {
				options = [];
			}
			
			return (
				<div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
					{value.map((v, index) => {
						const option = options.find(opt => opt.value === v);
						const label = option ? option.label : v;
						const color = option?.color;
						return (
							<Tag key={index} color={color}>{label}</Tag>
						);
					})}
				</div>
			);
		},
	},

	/**
	 * 开关 (Switch)
	 * Ant Design 官方文档: https://ant.design/components/switch-cn
	 * 
	 * 支持的 Ant Design 官方 API:
	 * - checkedChildren: 选中时的内容
	 * - unCheckedChildren: 非选中时的内容
	 * - disabled: 是否禁用
	 * - loading: 加载状态
	 * - size: 开关大小 ('default' | 'small')
	 * - onChange: 变化回调
	 * 以及所有 Switch 组件支持的其他官方属性
	 */
	switch: {
		table: (value, config) => {
			// 支持activeText/inactiveText
			const activeText = config.table?.activeText || config.table?.trueText || 'Yes';
			const inactiveText = config.table?.inactiveText || config.table?.falseText || 'No';
			
			// 支持自定义颜色
			const activeColor = config.table?.activeColor || 'success';
			const inactiveColor = config.table?.inactiveColor || 'default';
			
			// 支持图标
			const activeIconName = config.table?.activeIcon || config.table?.checkedIcon;
			const inactiveIconName = config.table?.inactiveIcon || config.table?.unCheckedIcon;
			
			const text = value ? activeText : inactiveText;
			const color = value ? activeColor : inactiveColor;
			
			// 动态导入图标
			let icon = null;
			try {
				if (value && activeIconName) {
					const Icons = require('@ant-design/icons');
					const IconComponent = Icons[activeIconName];
					if (IconComponent) {
						icon = React.createElement(IconComponent);
					}
				} else if (!value && inactiveIconName) {
					const Icons = require('@ant-design/icons');
					const IconComponent = Icons[inactiveIconName];
					if (IconComponent) {
						icon = React.createElement(IconComponent);
					}
				}
			} catch (e) {
				// 图标加载失败，忽略
			}
			
			return <Tag color={color} icon={icon}>{text}</Tag>;
		},
		form: (config) => {
			const props = getCommonFormProps(config);
			return (
			<ProFormSwitch
					{...props}
			/>
			);
		},
		search: (config) => {
			const props = {
				name: config.key,
				label: config.title,
				options: [
					{ label: config.search?.trueText || 'Yes', value: true },
					{ label: config.search?.falseText || 'No', value: false },
				],
				fieldProps: {
					allowClear: true,
					...config.search?.fieldProps,
				},
				...config.search?.props,
			};
			return <ProFormSelect {...props} />;
		},
	},

	/**
	 * 单图上传 (image)
	 * Ant Design 官方文档: https://5x.ant.design/components/upload-cn
	 * 
	 * 存储: 单个 URL 字符串
	 * 支持: 按钮上传、照片墙样式
	 * 
	 * 配置示例:
	 * {
	 *   key: 'cover',
	 *   title: 'Cover Image',
	 *   type: 'image',
	 *   form: {
	 *     listType: 'picture-card',  // 'picture-card' | 'picture' | 'text' (默认 picture-card)
	 *     accept: 'image/png,image/jpeg',  // 接受的图片类型
	 *     maxSize: 5,                // 最大文件大小（MB）
	 *     width: 200,                // 图片宽度限制（像素）
	 *     height: 200,               // 图片高度限制（像素）
	 *   }
	 * }
	 */
	image: {
		table: (value, config) => {
			if (!value) return '-';
			const size = config.table?.imageSize || 48;
			return (
				<Image
					src={value}
					width={size}
					height={size}
					alt='image'
					style={{ 
						objectFit: 'cover', 
						borderRadius: 4,
						cursor: 'pointer',
					}}
					preview={{
						mask: <span style={{ fontSize: 12 }}>预览</span>,
					}}
				/>
			);
		},
		form: (config) => {
			const accept = config.form?.accept || 'image/*';
			const maxSize = config.form?.maxSize || 10;
			const width = config.form?.width;
			const height = config.form?.height;
			const directory = config.form?.directory;
			
			return (
				<Form.Item
					name={config.key}
					label={config.title}
					tooltip={config.form?.tips}
					rules={config.form?.required ? [{ required: true, message: `Please upload ${config.title}` }] : []}
				>
					<SingleImageUpload 
						accept={accept}
						maxSize={maxSize}
						width={width}
						height={height}
						directory={directory}
						fieldProps={config.form?.fieldProps}
					/>
				</Form.Item>
			);
		},
		detail: (value, config) => {
			if (!value) return '-';
			return (
				<Image
					src={value}
					width={100}
					height={100}
					alt='image'
					style={{ objectFit: 'cover', borderRadius: 4 }}
				/>
			);
		},
	},

	/**
	 * 多图上传 (images)
	 * Ant Design 官方文档: https://5x.ant.design/components/upload-cn#upload-demo-picture-card
	 * 
	 * 存储: URL 数组
	 * 支持: 照片墙样式、单独删除、拖拽排序
	 * 
	 * 配置示例:
	 * {
	 *   key: 'gallery',
	 *   title: 'Gallery',
	 *   type: 'images',
	 *   form: {
	 *     max: 9,                    // 最大上传数量
	 *     accept: 'image/png,image/jpeg',
	 *     maxSize: 5,                // 单个文件最大大小（MB）
	 *     sortable: true,            // 是否支持拖拽排序（默认 true）
	 *   }
	 * }
	 */
	images: {
		table: (value, config) => {
			if (!value || !Array.isArray(value) || value.length === 0) return '-';
			const maxDisplay = config.table?.maxDisplay || 1;
			const size = config.table?.imageSize || 40;
			const displayImages = value.slice(0, maxDisplay);
			const remaining = value.length - maxDisplay;
			
			return (
				<Image.PreviewGroup
					preview={{
						onChange: (current, prev) => console.log(`current index: ${current}, prev index: ${prev}`),
					}}
				>
					<div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
						{displayImages.map((img, index) => (
							<Image
								key={index}
								src={img}
								width={size}
								height={size}
								alt={`image-${index}`}
								style={{ 
									objectFit: 'cover', 
									borderRadius: 4,
									cursor: 'pointer',
								}}
								preview={{
									mask: <span style={{ fontSize: 10 }}>预览</span>,
								}}
							/>
						))}
						{remaining > 0 && (
							<div 
								style={{ 
									width: size, 
									height: size, 
									borderRadius: 4,
									background: '#f5f5f5',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									color: '#666',
									fontSize: 12,
									fontWeight: 500,
								}}
							>
								+{remaining}
							</div>
						)}
					</div>
				</Image.PreviewGroup>
			);
		},
		form: (config) => {
			const max = config.form?.max || 9;
			const accept = config.form?.accept || 'image/*';
			const maxSize = config.form?.maxSize || 10; // MB
			const directory = config.form?.directory;
			
			return (
				<Form.Item
					name={config.key}
					label={config.title}
					tooltip={config.form?.tips}
					rules={config.form?.required ? [{ required: true, message: `Please upload ${config.title}` }] : []}
				>
					<MultiImageUpload 
						max={max}
						accept={accept}
						maxSize={maxSize}
						directory={directory}
						fieldProps={config.form?.fieldProps}
					/>
				</Form.Item>
			);
		},
		detail: (value, config) => {
			if (!value || !Array.isArray(value) || value.length === 0) return '-';
			
			return (
				<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
					{value.map((img, index) => (
						<Image
							key={index}
							src={img}
							width={80}
							height={80}
							alt={`image-${index}`}
							style={{ objectFit: 'cover', borderRadius: 4 }}
						/>
					))}
				</div>
			);
		},
	},

	/**
	 * 文件上传 (file)
	 * Ant Design 官方文档: https://5x.ant.design/components/upload-cn#upload-demo-drag
	 * 
	 * 存储: 文件对象数组 [{ name, url }]
	 * 支持: 按钮上传、拖拽上传区域、拖拽排序
	 * 
	 * 配置示例:
	 * {
	 *   key: 'attachments',
	 *   title: 'Attachments',
	 *   type: 'file',
	 *   form: {
	 *     max: 5,                    // 最大文件数
	 *     accept: '.pdf,.doc,.docx', // 接受的文件类型
	 *     maxSize: 10,               // 最大文件大小（MB）
	 *     dragger: true,             // 是否使用拖拽上传区域样式
	 *     sortable: true,            // 是否支持拖拽排序（默认 true）
	 *     directory: 'documents',    // 自定义上传目录
	 *     description: 'Support PDF, Word files',  // 描述文字
	 *     hint: 'Strictly prohibited from uploading company data',  // 提示文字
	 *   }
	 * }
	 */
	file: {
		table: (value, config) => {
			if (!value || !Array.isArray(value) || value.length === 0) return '-';
			
			return (
				<div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
					{value.map((file, index) => {
						const fileName = typeof file === 'string' ? file.split('/').pop() : (file.name || 'file');
						const fileUrl = typeof file === 'string' ? file : file.url;
						return (
							<Tag key={index} icon={<PaperClipOutlined />}>
								<a href={fileUrl} target='_blank' rel='noopener noreferrer'>
									{fileName}
								</a>
							</Tag>
						);
					})}
				</div>
			);
		},
		form: (config) => {
			const max = config.form?.max || 5;
			const accept = config.form?.accept;
			const maxSize = config.form?.maxSize || 10;
			const dragger = config.form?.dragger || false;
			const directory = config.form?.directory;
			const description = config.form?.description || 'Click or drag file to this area to upload';
			const hint = config.form?.hint || (max > 1 ? 'Support for a single or bulk upload.' : 'Support for a single upload.');
			
			return (
				<Form.Item
					name={config.key}
					label={config.title}
					tooltip={config.form?.tips}
					rules={config.form?.required ? [{ required: true, message: `Please upload ${config.title}` }] : []}
				>
					<FileUpload 
						max={max}
						accept={accept}
						maxSize={maxSize}
						dragger={dragger}
						directory={directory}
						description={description}
						hint={hint}
						fieldProps={config.form?.fieldProps}
					/>
				</Form.Item>
			);
		},
		detail: (value, config) => {
			if (!value || !Array.isArray(value) || value.length === 0) return '-';
			
			return (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
					{value.map((file, index) => {
						const fileName = typeof file === 'string' ? file.split('/').pop() : (file.name || 'file');
						const fileUrl = typeof file === 'string' ? file : file.url;
						return (
							<a key={index} href={fileUrl} target='_blank' rel='noopener noreferrer'>
								<PaperClipOutlined style={{ marginRight: 8 }} />
								{fileName}
							</a>
						);
					})}
				</div>
			);
		},
	},

	/**
	 * 头像上传 (avatar)
	 * Ant Design 官方文档: https://5x.ant.design/components/upload-cn#upload-demo-avatar
	 * 
	 * 存储: 单个 URL 字符串
	 * 样式: 圆形头像上传，使用 listType="picture-circle"
	 * 
	 * 配置示例:
	 * {
	 *   key: 'avatar',
	 *   title: 'Avatar',
	 *   type: 'avatar',
	 *   form: {
	 *     maxSize: 2,               // 最大文件大小（MB）
	 *     accept: 'image/png,image/jpeg',
	 *   }
	 * }
	 */
	avatar: {
		table: (value, config) => {
			if (!value) return '-';
			const size = config.table?.imageSize || 40;
			return (
				<Image
					src={value}
					width={size}
					height={size}
					alt='avatar'
					style={{ 
						borderRadius: '50%', 
						objectFit: 'cover',
						cursor: 'pointer',
					}}
					preview={{
						mask: <span style={{ fontSize: 10 }}>预览</span>,
					}}
				/>
			);
		},
		form: (config) => {
			const accept = config.form?.accept || 'image/png,image/jpeg,image/gif';
			const maxSize = config.form?.maxSize || 2;
			const directory = config.form?.directory || 'avatars';
			
			return (
				<Form.Item
					name={config.key}
					label={config.title}
					tooltip={config.form?.tips}
					rules={config.form?.required ? [{ required: true, message: `Please upload ${config.title}` }] : []}
				>
					<AvatarUpload 
						accept={accept}
						maxSize={maxSize}
						directory={directory}
						fieldProps={config.form?.fieldProps}
					/>
				</Form.Item>
			);
		},
		detail: (value, config) => {
			if (!value) return '-';
			return (
				<Image
					src={value}
					width={80}
					height={80}
					alt='avatar'
					style={{ borderRadius: '50%', objectFit: 'cover' }}
				/>
			);
		},
	},

	/**
	 * JSON 类型
	 * 
	 * 使用带行号的 JSON 编辑器，支持格式化和复制
	 * 
	 * 配置示例:
	 * {
	 *   key: 'metadata',
	 *   title: 'Metadata',
	 *   type: 'json',
	 *   form: {
	 *     rows: 10,              // 编辑器行数，默认 10
	 *     placeholder: 'Enter JSON...',
	 *     disabled: false,
	 *     required: true,
	 *   }
	 * }
	 */
	json: {
		table: (value, config) => {
			if (!value) return '-';
			const displayValue = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
			return (
				<pre style={{ 
					margin: 0, 
					maxWidth: 200, 
					maxHeight: 100,
					overflow: 'auto', 
					fontSize: 12,
					fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
					backgroundColor: '#f5f5f5',
					padding: 4,
					borderRadius: 4,
				}}>
					{displayValue}
				</pre>
			);
		},
		form: (config) => {
			const rows = config.form?.rows || 10;
			const placeholder = config.form?.placeholder || 'Enter JSON...';
			const disabled = config.form?.disabled || false;
			
			return (
				<Form.Item
					name={config.key}
					label={config.title}
					tooltip={config.form?.tips}
					rules={[
						...generateRules(config),
						{
							validator: (_, value) => {
								if (!value || (typeof value === 'string' && value.trim() === '')) {
									return Promise.resolve();
								}
								try {
									if (typeof value === 'string') {
										JSON.parse(value);
									}
									return Promise.resolve();
								} catch (e) {
									return Promise.reject(new Error('Invalid JSON format'));
								}
							},
						},
					]}
				>
					<JsonEditor
						rows={rows}
						placeholder={placeholder}
						disabled={disabled}
					/>
				</Form.Item>
			);
		},
		detail: (value, config) => {
			if (!value) return '-';
			const displayValue = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
			return (
				<pre style={{ 
					margin: 0, 
					maxWidth: '100%',
					overflow: 'auto', 
					fontSize: 12,
					fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
					backgroundColor: '#f5f5f5',
					padding: 8,
					borderRadius: 4,
					whiteSpace: 'pre-wrap',
					wordBreak: 'break-all',
				}}>
					{displayValue}
				</pre>
			);
		},
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
 * 评分组件 (Rate)
 * Ant Design 官方文档: https://ant.design/components/rate-cn
 * 
 * 支持的 Ant Design 官方 API:
 * - count: star 总数 (默认: 5)
 * - allowHalf: 是否允许半选 (默认: true)
 * - allowClear: 是否允许再次点击后清除
 * - character: 自定义字符
 * - disabled: 是否禁用
 * - tooltips: 自定义每项的提示信息
 * - onChange: 选择时的回调
 * 以及所有 Rate 组件支持的其他官方属性
 */
FIELD_TYPE_REGISTRY.rate = {
	table: (value, config) => {
		if (value === null || value === undefined) return '-';
		const count = config.table?.count || 5;
		return '⭐'.repeat(Math.min(value, count));
	},
	form: (config) => {
		const props = getCommonFormProps(config);
		const fieldProps = {
			count: config.form?.count || 5,
			allowHalf: config.form?.allowHalf !== false,
			allowClear: config.form?.allowClear !== false,
			...props.fieldProps,
		};
		
		return (
			<ProFormRate
				{...props}
				fieldProps={fieldProps}
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
 * 滑动输入条 (Slider)
 * Ant Design 官方文档: https://5x.ant.design/components/slider-cn
 * 
 * 支持的 Ant Design 官方 API:
 * - min: 最小值 (默认: 0)
 * - max: 最大值 (默认: 100)
 * - step: 步长 (默认: 1)
 * - marks: 刻度标记 { number: string | ReactNode | { style, label } }
 * - dots: 是否只能拖拽到刻度上
 * - range: 是否为范围选择 (boolean | { draggableTrack: boolean })
 * - vertical: 是否垂直方向
 * - reverse: 反向坐标轴
 * - included: marks 不为空时，是否包含关系 (默认: true)
 * - tooltip: 设置 Tooltip 相关属性 { open, placement, formatter, getPopupContainer }
 * - disabled: 是否禁用
 * - keyboard: 是否支持键盘操作 (默认: true) (5.2.0+)
 * - onChange: 值改变时触发
 * - onChangeComplete: 与 mouseup/keyup 触发时机一致
 * 以及所有 Slider 组件支持的其他官方属性
 * 
 * 配置示例:
 * {
 *   key: 'progress',
 *   title: 'Progress',
 *   type: 'slider',
 *   form: {
 *     min: 0,
 *     max: 100,
 *     step: 1,
 *     marks: { 0: '0%', 50: '50%', 100: '100%' },
 *     dots: false,
 *     range: false,           // 或 { draggableTrack: true } 用于范围可拖拽
 *     tooltip: {
 *       formatter: (value) => `${value}%`,
 *     },
 *   }
 * }
 */
FIELD_TYPE_REGISTRY.slider = {
	table: (value, config) => {
		if (value === null || value === undefined) return '-';
		const min = config.table?.min || config.form?.min || 0;
		const max = config.table?.max || config.form?.max || 100;
		
		// 处理范围值
		if (Array.isArray(value)) {
			const [start, end] = value;
			const startPercent = ((start - min) / (max - min)) * 100;
			const endPercent = ((end - min) / (max - min)) * 100;
			return (
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<div style={{ 
						width: 100, 
						height: 6, 
						background: '#f0f0f0',
						borderRadius: 3,
						overflow: 'hidden',
						position: 'relative',
					}}>
						<div style={{
							position: 'absolute',
							left: `${startPercent}%`,
							width: `${endPercent - startPercent}%`,
							height: '100%',
							background: '#1677ff',
						}} />
					</div>
					<span style={{ fontSize: 12, color: '#666' }}>{start} - {end}</span>
				</div>
			);
		}
		
		// 单值
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
						background: '#1677ff',
					}} />
				</div>
				<span style={{ fontSize: 12, color: '#666' }}>{value}</span>
			</div>
		);
	},
	form: (config) => {
		const props = getCommonFormProps(config);
		
		// ProFormSlider 的 min/max 需要作为顶级属性传递
		const min = config.form?.min ?? 0;
		const max = config.form?.max ?? 100;
		const step = config.form?.step ?? 1;
		const marks = config.form?.marks;
		const range = config.form?.range;
		
		// fieldProps 用于其他 Slider 组件属性
		const fieldProps = {
			...props.fieldProps,
			dots: config.form?.dots,
			vertical: config.form?.vertical,
			reverse: config.form?.reverse,
			included: config.form?.included,
			tooltip: config.form?.tooltip,
			keyboard: config.form?.keyboard,
		};
		
		return (
			<ProFormSlider
				{...props}
				min={min}
				max={max}
				step={step}
				marks={marks}
				range={range}
				fieldProps={fieldProps}
			/>
		);
	},
	detail: (value, config) => {
		if (value === null || value === undefined) return '-';
		const min = config.form?.min ?? 0;
		const max = config.form?.max ?? 100;
		
		// 处理范围值
		if (Array.isArray(value)) {
			return `${value[0]} - ${value[1]}`;
		}
		
		return (
			<span>
				{value} <span style={{ color: '#999' }}>/ {max}</span>
			</span>
		);
	},
};

/**
 * 颜色选择器 (ColorPicker)
 * Ant Design 官方文档: https://ant.design/components/color-picker-cn
 * 
 * 支持的 Ant Design 官方 API:
 * - format: 颜色格式 ('rgb' | 'hex' | 'hsb')
 * - showText: 显示颜色文本
 * - allowClear: 允许清除选择的颜色
 * - disabled: 是否禁用
 * - size: 组件大小 ('large' | 'middle' | 'small')
 * - presets: 预设颜色
 * - panelRender: 自定义面板
 * - onChange: 颜色变化的回调
 * - onChangeComplete: 颜色选择完成的回调
 * 以及所有 ColorPicker 组件支持的其他官方属性
 */
FIELD_TYPE_REGISTRY.color = {
	table: (value, config) => {
		if (!value) return '-';
		// 处理 Color 对象或字符串
		const colorStr = typeof value === 'string' ? value : (value?.toHexString?.() || String(value));
		return (
			<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
				<div style={{
					width: 24,
					height: 24,
					borderRadius: 4,
					background: colorStr,
					border: '1px solid #d9d9d9',
				}} />
				<span style={{ fontFamily: 'monospace' }}>{colorStr}</span>
			</div>
		);
	},
	form: (config) => {
		const props = getCommonFormProps(config);
		const format = config.form?.format || 'hex';
		
		// ColorPicker 返回的是 Color 对象，需要通过 getValueFromEvent 转换为字符串
		const getValueFromEvent = (color) => {
			if (!color) return color;
			// 如果是 Color 对象，转换为字符串
			if (typeof color === 'object' && color !== null) {
				if (format === 'rgb' && color.toRgbString) {
					return color.toRgbString();
				}
				if (format === 'hsb' && color.toHsbString) {
					return color.toHsbString();
				}
				if (color.toHexString) {
					return color.toHexString();
				}
			}
			return color;
		};
		
		return (
			<Form.Item
				name={props.name}
				label={props.label}
				rules={props.rules}
				tooltip={props.tooltip}
				required={props.required}
				getValueFromEvent={getValueFromEvent}
				{...props.formItemProps}
			>
				<ColorPicker
					showText
					format={format}
					{...props.fieldProps}
				/>
			</Form.Item>
		);
	},
};

// 注意：file 类型已在上面定义，使用 customRequest 实现
// 不要重复定义，否则会覆盖

/**
 * 时间选择器 (TimePicker)
 * Ant Design 官方文档: https://ant.design/components/time-picker-cn
 * 
 * 支持的 Ant Design 官方 API:
 * - format: 时间格式 (默认: 'HH:mm:ss')
 * - hourStep: 小时选项间隔
 * - minuteStep: 分钟选项间隔
 * - secondStep: 秒选项间隔
 * - use12Hours: 12 小时制
 * - disabledTime: 不可选择的时间
 * - hideDisabledOptions: 隐藏禁止选项
 * - showNow: 是否展示"此刻"按钮
 * - placeholder: 占位符
 * - allowClear: 是否显示清除按钮
 * - disabled: 是否禁用
 * - onChange: 时间发生变化的回调
 * 以及所有 TimePicker 组件支持的其他官方属性
 */
FIELD_TYPE_REGISTRY.time = {
	table: (value, config) => {
		if (!value) return '-';
		const format = config.table?.format || 'HH:mm:ss';
		return dayjs(value, format).format(format);
	},
	form: (config) => {
		const props = getCommonFormProps(config);
		const fieldProps = {
			format: config.form?.format || 'HH:mm:ss',
			...props.fieldProps,
		};
		
		return (
			<ProFormTimePicker
				{...props}
				fieldProps={fieldProps}
			/>
		);
	},
	search: (config) => {
		const props = {
			name: config.key,
			label: config.title,
			fieldProps: {
				format: config.search?.format || 'HH:mm:ss',
				allowClear: true,
				...config.search?.fieldProps,
			},
			...config.search?.props,
		};
		return <ProFormTimePicker {...props} />;
	},
};

/**
 * 级联选择器 (Cascader)
 * Ant Design 官方文档: https://ant.design/components/cascader-cn
 * 
 * 支持的 Ant Design 官方 API:
 * - options: 级联选项数据源
 * - changeOnSelect: 是否允许选择非叶子节点
 * - showSearch: 是否支持搜索
 * - expandTrigger: 次级菜单展开方式 ('click' | 'hover')
 * - fieldNames: 自定义字段名 {label, value, children}
 * - multiple: 是否支持多选
 * - displayRender: 选择后展示的渲染函数
 * - loadData: 动态加载选项
 * - placeholder: 占位符
 * - allowClear: 是否显示清除按钮
 * - disabled: 是否禁用
 * - onChange: 值发生变化时的回调
 * 以及所有 Cascader 组件支持的其他官方属性
 */
FIELD_TYPE_REGISTRY.cascader = {
	table: (value, config) => {
		if (!value || !Array.isArray(value) || value.length === 0) return '-';
		return value.join(' / ');
	},
	form: (config) => {
		const props = getCommonFormProps(config);
		let options = config.form?.options || config.data || [];
		// 确保 options 是数组
		if (typeof options === 'function' || !Array.isArray(options)) {
			options = [];
		}
		
		// 直接返回 JSX，不要包装在函数组件中（避免无限循环）
		const cascaderProps = {
			options,
			changeOnSelect: config.form?.changeOnSelect !== false,
			showSearch: config.form?.showSearch !== false,
			style: { width: '100%' },
			placeholder: props.placeholder,
			disabled: props.disabled,
			allowClear: props.fieldProps?.allowClear !== false,
			...props.fieldProps,
		};
		
		return (
			<Form.Item
				name={props.name}
				label={props.label}
				rules={props.rules}
				tooltip={props.tooltip}
			>
				<Cascader {...cascaderProps} />
			</Form.Item>
		);
	},
	search: (config) => {
		let options = config.search?.options || config.data || [];
		// 确保 options 是数组
		if (typeof options === 'function' || !Array.isArray(options)) {
			options = [];
		}
		const props = {
			name: config.key,
			label: config.title,
			fieldProps: {
					options,
					showSearch: true,
				allowClear: true,
				...config.search?.fieldProps,
			},
			...config.search?.props,
		};
		return <ProFormCascader {...props} />;
	},
};

// ============================================
// 阶段 3：中优先级组件
// ============================================

// 注意：json 类型已在上面的 FIELD_TYPE_REGISTRY 对象中定义（使用 JsonEditor 组件）
// 不要在这里重复定义，否则会覆盖

/**
 * 动态数组类型 (array)
 * 参考: 
 * - https://procomponents.ant.design/components/group#proformlist (ProFormList 官方文档)
 * 
 * 使用 ProFormList 实现动态数组
 * 
 * 当前实现：简单值数组（如 ['value1', 'value2']）
 * 未来扩展：支持对象数组（如 [{name: 'a', value: 1}, {name: 'b', value: 2}]）
 * 
 * 配置示例:
 * {
 *   key: 'actions',
 *   type: 'array',
 *   form: {
 *     placeholder: 'Enter value',
 *     addButtonText: 'Add Item',
 *     max: 50,                         // 最大数量
 *     min: 0,                          // 最小数量
 *     tips: 'Some tips',               // 提示信息
 *     showCopy: true,                  // 显示复制按钮
 *     showDelete: true,                // 显示删除按钮
 *     alwaysShowItemLabel: false,      // 总是显示项标签
 *     creatorButtonText: 'Add',        // 添加按钮文本
 *   }
 * }
 */
FIELD_TYPE_REGISTRY.array = {
	table: (value, config) => {
		if (!value || !Array.isArray(value) || value.length === 0) return '-';
		
		const maxDisplay = config.table?.maxDisplay || 3;
		const displayItems = value.slice(0, maxDisplay);
		const remainingCount = value.length - maxDisplay;
		
		return (
			<div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
				{displayItems.map((item, index) => (
					<Tag key={index}>{String(item)}</Tag>
				))}
				{remainingCount > 0 && (
					<Tag color="blue">+{remainingCount} more</Tag>
				)}
			</div>
		);
	},
	form: (config) => {
		const { Form, Input, Button, Space } = require('antd');
		const { PlusOutlined, MinusCircleOutlined, CopyOutlined } = require('@ant-design/icons');
		const props = getCommonFormProps(config);
		const placeholder = config.form?.placeholder || 'Enter value';
		const addButtonText = config.form?.addButtonText || 'Add Item';
		const max = config.form?.max;
		const tips = config.form?.tips;
		const min = config.form?.min || 0;
		const showCopy = config.form?.showCopy !== false;
		
		return (
			<Form.Item
				label={props.label}
				tooltip={props.tooltip}
				required={props.required}
			>
				<Form.List name={props.name}>
					{(fields, { add, remove }, { errors }) => (
						<div>
						{fields.map((field, index) => {
							const { key, ...restField } = field;
							return (
								<Space
									key={key}
									style={{ display: 'flex', marginBottom: 8 }}
									align="baseline"
								>
									<Form.Item
										{...restField}
										validateTrigger={['onChange', 'onBlur']}
										rules={[
											{
												validator: async (_, value) => {
													// 如果值为空或只有空格，自动返回成功（让用户可以删除或填写）
													if (!value || !value.trim()) {
														return Promise.resolve();
													}
													return Promise.resolve();
												},
											},
										]}
										noStyle
									>
										<Input
											placeholder={placeholder}
											style={{ width: 400 }}
										/>
									</Form.Item>
									{fields.length > min && (
										<MinusCircleOutlined
											className="dynamic-delete-button"
											onClick={() => remove(field.name)}
											style={{ fontSize: 16, color: '#999' }}
										/>
									)}
									{showCopy && (
										<CopyOutlined
											onClick={() => {
												const form = Form.useFormInstance?.();
												if (form) {
													const values = form.getFieldValue(props.name) || [];
													const valueToCopy = values[index];
													if (valueToCopy) {
														add(valueToCopy, index + 1);
													}
												}
											}}
											style={{ fontSize: 16, color: '#1890ff', cursor: 'pointer' }}
										/>
									)}
								</Space>
							);
						})}
							{(!max || fields.length < max) && (
								<Form.Item>
									<Button
										type="dashed"
										onClick={() => add()}
										style={{ width: '100%' }}
										icon={<PlusOutlined />}
									>
										{addButtonText}
									</Button>
									<Form.ErrorList errors={errors} />
								</Form.Item>
							)}
							{tips && (
								<div style={{ marginTop: 8, fontSize: 12, color: '#666', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
									{tips}
								</div>
							)}
						</div>
					)}
				</Form.List>
			</Form.Item>
		);
	},
};

/**
 * 树形选择类型 (tree-select)
 */
FIELD_TYPE_REGISTRY['tree-select'] = {
	table: (value, config) => {
		if (!value) return '-';
		// 如果是数组，显示所有值
		if (Array.isArray(value)) {
			return value.join(', ');
		}
		// 尝试从 treeData 中找到对应的 label
		let treeData = config.table?.treeData || config.data || [];
		// 确保 treeData 是数组
		if (typeof treeData === 'function' || !Array.isArray(treeData)) {
			treeData = [];
		}
		const label = findTreeNodeLabel(treeData, value);
		return label || value;
	},
	form: (config) => {
		const props = getCommonFormProps(config);
		let treeData = config.form?.treeData || config.data || [];
		// 确保 treeData 是数组
		if (typeof treeData === 'function' || !Array.isArray(treeData)) {
			treeData = [];
		}
		const multiple = config.form?.multiple || false;
		const treeCheckable = config.form?.treeCheckable || false;
		const showSearch = config.form?.showSearch !== false;
		
		// 提取并转换废弃的属性
		const rawFieldProps = props.fieldProps || {};
		
		// 构建新的 fieldProps，确保移除废弃属性
		const fieldProps = {
			treeData,
			multiple,
			treeCheckable,
			showSearch,
			treeDefaultExpandAll: true,
			placeholder: config.form?.placeholder || config.placeholder || `Select ${config.title}`, // 添加 placeholder
			...rawFieldProps,
		};
		
		// 如果有废弃的 dropdownStyle，转换为 popupStyle
		if (fieldProps.dropdownStyle && !fieldProps.popupStyle) {
			fieldProps.popupStyle = fieldProps.dropdownStyle;
		}
		delete fieldProps.dropdownStyle;
		
		// 如果有废弃的 onDropdownVisibleChange，转换为 onOpenChange
		if (fieldProps.onDropdownVisibleChange && !fieldProps.onOpenChange) {
			fieldProps.onOpenChange = fieldProps.onDropdownVisibleChange;
		}
		delete fieldProps.onDropdownVisibleChange;
		
		// 如果用户没有提供 onOpenChange，提供一个默认的空函数
		if (!fieldProps.onOpenChange) {
			fieldProps.onOpenChange = () => {};
		}
		
		// 准备 TreeSelect 的 props
		const treeSelectProps = {
			...fieldProps,
			style: { width: '100%' },
		};
		
		// 确保使用新 API 而非废弃属性
		delete treeSelectProps.dropdownStyle;
		delete treeSelectProps.onDropdownVisibleChange;
		
		// 直接返回 JSX，不要包装在函数组件中（避免无限循环）
		return (
			<Form.Item
				name={props.name}
				label={props.label}
				rules={props.rules}
				tooltip={props.tooltip}
			>
				<TreeSelect {...treeSelectProps} />
			</Form.Item>
		);
	},
	search: (config) => {
		let treeData = config.search?.treeData || config.data || [];
		// 确保 treeData 是数组
		if (typeof treeData === 'function' || !Array.isArray(treeData)) {
			treeData = [];
		}
		
		// 提取并转换废弃的属性
		const rawFieldProps = config.search?.props?.fieldProps || {};
		
		// 构建新的 fieldProps，确保移除废弃属性
		const fieldProps = {
			treeData,
			showSearch: true,
			treeDefaultExpandAll: true,
			...rawFieldProps,
		};
		
		// 如果有废弃的 onDropdownVisibleChange，转换为 onOpenChange
		if (fieldProps.onDropdownVisibleChange && !fieldProps.onOpenChange) {
			fieldProps.onOpenChange = fieldProps.onDropdownVisibleChange;
		}
		
		// 如果用户没有提供 onOpenChange，提供一个默认的空函数，确保覆盖内部默认值
		if (!fieldProps.onOpenChange) {
			fieldProps.onOpenChange = () => {};
		}
		
		// 明确删除废弃属性
		delete fieldProps.onDropdownVisibleChange;
		
		// 确保没有传递废弃属性到组件
		const { onDropdownVisibleChange: __, ...cleanFieldProps } = fieldProps;
		
		// 提取 search props，但要排除 fieldProps（因为已经在上面处理了）
		const { fieldProps: _, onDropdownVisibleChange: deprecatedProp, ...otherSearchProps } = config.search?.props || {};
		
		// 清理 otherSearchProps 中可能存在的废弃属性
		const { onDropdownVisibleChange: ___, ...cleanOtherProps } = otherSearchProps;
		
		// 如果有废弃属性，转换为新属性
		if (deprecatedProp && !cleanFieldProps.onOpenChange) {
			cleanFieldProps.onOpenChange = deprecatedProp;
		}
		
		// 确保 cleanFieldProps 中明确设置 onOpenChange，覆盖任何可能的内部默认值
		if (!cleanFieldProps.onOpenChange) {
			cleanFieldProps.onOpenChange = () => {};
		}
		
			// 准备 TreeSelect 的 props
			const treeSelectProps = {
				...cleanFieldProps,
				style: { width: '100%' },
			};
		
			// 确保使用 onOpenChange 而非废弃属性
			delete treeSelectProps.onDropdownVisibleChange;
			if (!treeSelectProps.onOpenChange) {
				treeSelectProps.onOpenChange = () => {};
			}
			
		// 直接返回 JSX，不要包装在函数组件中（避免无限循环）
			return (
				<Form.Item
					name={config.key}
					label={config.title}
					rules={[
						{
							required: config.search?.required || false,
							message: `Please select ${config.title}`,
						},
					]}
				>
					<TreeSelect {...treeSelectProps} />
				</Form.Item>
			);
	},
};

/**
 * 图标选择器类型 (icon)
 * 
 * 支持 lucide-react 和 react-icons 的所有图标
 * 使用图标选择器弹窗进行选择
 */
FIELD_TYPE_REGISTRY.icon = {
	table: (value, config) => {
		if (!value) return '-';
		const IconComponent = renderIcon(value, { style: { fontSize: 18 } });
		if (IconComponent) {
			return (
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					{IconComponent}
					<span style={{ fontSize: 12, color: '#8c8c8c' }}>{value}</span>
				</div>
			);
		}
		return <span>{value}</span>;
	},
	form: (config) => {
		// 使用 ProFormText 作为基础，配合自定义渲染
		return (
			<ProFormText
				name={config.key}
				label={config.title}
				tooltip={config.tips || config.form?.tips}
				rules={generateRules(config)}
				renderFormItem={(_, props) => <IconPickerButton {...props} />}
			/>
		);
	},
	detail: (value, config) => {
		if (!value) return '-';
		const IconComponent = renderIcon(value, { style: { fontSize: 20 } });
		if (IconComponent) {
			return (
				<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
					{IconComponent}
					<span>{value}</span>
				</div>
			);
		}
		return <span>{value}</span>;
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
// 文件选择类型（从文件库选择）
// ============================================

/**
 * 单图选择 (image-select)
 * 
 * 与 image 类型不同，image-select 不是直接上传，而是从文件库中选择
 * 点击后打开文件库弹窗，用户可以搜索、筛选、选择已上传的图片
 * 
 * @example
 * {
 *   key: 'cover',
 *   title: 'Cover Image',
 *   type: 'image-select',
 *   form: {
 *     accept: 'image/*',
 *     fileType: 'image',  // 筛选类型
 *   }
 * }
 */
FIELD_TYPE_REGISTRY['image-select'] = {
	table: (value, config) => {
		if (!value) return '-';
		const size = config.table?.imageSize || 60;
		return (
			<Image
				src={value}
				width={size}
				height={size}
				alt="image"
				style={{ objectFit: 'cover', borderRadius: 4 }}
				preview={{ mask: <EyeOutlined /> }}
			/>
		);
	},
	form: (config) => {
		const props = getCommonFormProps(config);
		const accept = config.form?.accept || 'image/*';
		const fileType = config.form?.fileType || 'image';
		
		return (
			<Form.Item {...props}>
				<FileSelect
					mode="image"
					accept={accept}
					fileType={fileType}
				/>
			</Form.Item>
		);
	},
	convertValue: (value) => value,
	detail: (value) => {
		if (!value) return '-';
		return (
			<Image
				src={value}
				width={100}
				height={100}
				alt="image"
				style={{ objectFit: 'cover', borderRadius: 4 }}
			/>
		);
	},
};

/**
 * 多图选择 (images-select)
 * 
 * 从文件库中选择多张图片，支持拖拽排序
 * 
 * @example
 * {
 *   key: 'gallery',
 *   title: 'Gallery',
 *   type: 'images-select',
 *   form: {
 *     max: 9,
 *     accept: 'image/*',
 *     fileType: 'image',
 *   }
 * }
 */
FIELD_TYPE_REGISTRY['images-select'] = {
	table: (value, config) => {
		if (!value || !Array.isArray(value) || value.length === 0) return '-';
		const maxDisplay = config.table?.maxDisplay || 3;
		const size = config.table?.imageSize || 40;
		const displayImages = value.slice(0, maxDisplay);
		const remaining = value.length - maxDisplay;
		
		return (
			<Image.PreviewGroup items={value}>
				<div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
					{displayImages.map((url, index) => (
						<Image
							key={index}
							src={url}
							width={size}
							height={size}
							alt={`image-${index}`}
							style={{ objectFit: 'cover', borderRadius: 4 }}
						/>
					))}
					{remaining > 0 && (
						<span style={{ color: '#999', fontSize: 12 }}>+{remaining}</span>
					)}
				</div>
			</Image.PreviewGroup>
		);
	},
	form: (config) => {
		const props = getCommonFormProps(config);
		const max = config.form?.max || 9;
		const accept = config.form?.accept || 'image/*';
		const fileType = config.form?.fileType || 'image';
		
		return (
			<Form.Item {...props}>
				<FileSelect
					mode="images"
					max={max}
					accept={accept}
					fileType={fileType}
					sortable={true}
				/>
			</Form.Item>
		);
	},
	convertValue: (value) => {
		if (!value) return [];
		if (Array.isArray(value)) return value;
		return [value];
	},
	detail: (value) => {
		if (!value || !Array.isArray(value) || value.length === 0) return '-';
		return (
			<Image.PreviewGroup items={value}>
				<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
					{value.map((url, index) => (
						<Image
							key={index}
							src={url}
							width={60}
							height={60}
							alt={`image-${index}`}
							style={{ objectFit: 'cover', borderRadius: 4 }}
						/>
					))}
				</div>
			</Image.PreviewGroup>
		);
	},
};

/**
 * 头像选择 (avatar-select)
 * 
 * 从文件库中选择头像，圆形显示
 * 
 * @example
 * {
 *   key: 'avatar',
 *   title: 'Avatar',
 *   type: 'avatar-select',
 * }
 */
FIELD_TYPE_REGISTRY['avatar-select'] = {
	table: (value, config) => {
		if (!value) return '-';
		const size = config.table?.imageSize || 40;
		return (
			<Image
				src={value}
				width={size}
				height={size}
				alt="avatar"
				style={{ objectFit: 'cover', borderRadius: '50%' }}
				preview={{ mask: <EyeOutlined /> }}
			/>
		);
	},
	form: (config) => {
		const props = getCommonFormProps(config);
		const accept = config.form?.accept || 'image/*';
		const fileType = config.form?.fileType || 'avatar';
		
		return (
			<Form.Item {...props}>
				<FileSelect
					mode="avatar"
					accept={accept}
					fileType={fileType}
				/>
			</Form.Item>
		);
	},
	convertValue: (value) => value,
	detail: (value) => {
		if (!value) return '-';
		return (
			<Image
				src={value}
				width={80}
				height={80}
				alt="avatar"
				style={{ objectFit: 'cover', borderRadius: '50%' }}
			/>
		);
	},
};

/**
 * 文件选择 (file-select)
 * 
 * 从文件库中选择文件，支持多选和排序
 * 
 * @example
 * {
 *   key: 'attachments',
 *   title: 'Attachments',
 *   type: 'file-select',
 *   form: {
 *     max: 5,
 *     accept: '.pdf,.doc,.docx',
 *     fileType: 'file',
 *   }
 * }
 */
FIELD_TYPE_REGISTRY['file-select'] = {
	table: (value, config) => {
		if (!value || !Array.isArray(value) || value.length === 0) return '-';
		const maxDisplay = config.table?.maxDisplay || 2;
		const displayFiles = value.slice(0, maxDisplay);
		const remaining = value.length - maxDisplay;
		
		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
				{displayFiles.map((file, index) => (
					<a 
						key={index} 
						href={file.url || file} 
						target="_blank" 
						rel="noopener noreferrer"
						style={{ display: 'flex', alignItems: 'center', gap: 4 }}
					>
						<PaperClipOutlined />
						<span style={{ 
							maxWidth: 150, 
							overflow: 'hidden', 
							textOverflow: 'ellipsis', 
							whiteSpace: 'nowrap' 
						}}>
							{file.name || (typeof file === 'string' ? file.split('/').pop() : 'File')}
						</span>
					</a>
				))}
				{remaining > 0 && (
					<span style={{ color: '#999', fontSize: 12 }}>+{remaining} more</span>
				)}
			</div>
		);
	},
	form: (config) => {
		const props = getCommonFormProps(config);
		const max = config.form?.max || 5;
		const accept = config.form?.accept;
		const fileType = config.form?.fileType || 'file';
		
		return (
			<Form.Item {...props}>
				<FileSelect
					mode="file"
					max={max}
					accept={accept}
					fileType={fileType}
					sortable={true}
				/>
			</Form.Item>
		);
	},
	convertValue: (value) => {
		if (!value) return [];
		if (Array.isArray(value)) return value;
		return [value];
	},
	detail: (value) => {
		if (!value || !Array.isArray(value) || value.length === 0) return '-';
		return (
			<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
				{value.map((file, index) => (
					<a 
						key={index} 
						href={file.url || file} 
						target="_blank" 
						rel="noopener noreferrer"
						style={{ display: 'flex', alignItems: 'center', gap: 4 }}
					>
						<PaperClipOutlined />
						{file.name || (typeof file === 'string' ? file.split('/').pop() : 'File')}
					</a>
				))}
			</div>
		);
	},
};

// ============================================
// 布局类型
// ============================================

/**
 * 分组布局类型 (group)
 * 
 * group 是一个容器类型，用于在表单中对字段进行分组显示。
 * 支持的配置：
 * - title: 分组标题
 * - tips: 分组提示文字
 * - columns: 分组内的字段配置
 * - col.span: 每个字段的栅格宽度（1-24）
 * 
 * 为什么不使用 ProFormGroup？
 * ProFormGroup 内部使用 Space 组件布局，无法支持 Row/Col 栅格系统，
 * 导致字段宽度无法精确控制。我们使用自定义实现（Divider + Row/Col），
 * 保持相似的视觉效果，同时支持栅格布局。
 * 
 * 注意: group 内的字段由 DynamicFormFields 递归处理，
 * 这样可以保证 showRule、watch、disabled 等功能正常工作。
 * 
 * @example
 * {
 *   key: 'basic-group',
 *   title: 'Basic Information',
 *   type: 'group',
 *   tips: 'Fill in the basic information',
 *   columns: [
 *     { key: 'name', title: 'Name', type: 'text', col: { span: 12 } },
 *     { key: 'email', title: 'Email', type: 'text', col: { span: 12 } },
 *   ],
 * }
 */
FIELD_TYPE_REGISTRY.group = {
	table: null, // 分组不在表格中显示
	// form 返回 null，由 DynamicFormFields 自定义渲染
	form: () => null,
	// 标记这是一个容器类型
	isContainer: true,
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

