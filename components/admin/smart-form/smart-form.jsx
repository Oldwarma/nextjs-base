/**
 * SmartForm - 智能表单组件
 * 
 * 基于 vk-unicloud 万能表单思想，通过 JSON 配置自动生成表单
 * 
 * 特性：
 * - 配置驱动：通过 fieldsConfig 自动生成表单字段
 * - 类型丰富：支持 30+ 种字段类型
 * - 条件渲染：支持 showRule 条件显示
 * - 字段联动：支持 watch 监听其他字段变化
 * - 数据加载：支持 action 自动加载选项数据
 * - 布局灵活：支持单列、多列、分组布局
 * 
 * @example
 * ```jsx
 * <SmartForm
 *   fieldsConfig={[
 *     { key: 'name', title: 'Name', type: 'text', form: { required: true } },
 *     { key: 'email', title: 'Email', type: 'text', form: { required: true } },
 *     { key: 'role', title: 'Role', type: 'select', options: [...] },
 *   ]}
 *   initialValues={{ role: 'user' }}
 *   onFinish={async (values) => {
 *     console.log('Form values:', values);
 *     return true;
 *   }}
 * />
 * ```
 * 
 * @see https://vkdoc.fsq.pub/admin/3/form.html
 */

'use client';

import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { ProForm } from '@ant-design/pro-components';
import { App } from 'antd';
import DynamicFormFields from '../dynamic-form-fields';
import { validateFieldsConfig } from '@/lib/crud/field-generator';

/**
 * 清理表单数据中的空 array 项
 * @param {Object} values - 表单数据
 * @returns {Object} 清理后的数据
 */
function cleanArrayFields(values) {
	const cleaned = { ...values };
	
	Object.keys(cleaned).forEach(key => {
		const value = cleaned[key];
		// 如果是数组，过滤掉空值、空字符串和只有空格的项
		if (Array.isArray(value)) {
			cleaned[key] = value.filter(item => {
				if (item === null || item === undefined) return false;
				if (typeof item === 'string') {
					return item.trim().length > 0;
				}
				return true;
			});
		}
	});
	
	return cleaned;
}

/**
 * SmartForm 组件
 * 
 * @param {Object} props
 * @param {Array} props.fieldsConfig - 字段配置数组（核心配置）
 * @param {Object} props.initialValues - 表单初始值
 * @param {Function} props.onFinish - 表单提交回调，返回 true 表示成功
 * @param {Function} props.onFinishFailed - 表单验证失败回调
 * @param {Function} props.onValuesChange - 表单值变化回调
 * @param {Function} props.beforeSubmit - 提交前数据转换钩子
 * @param {Object} props.actions - Server Actions 对象（用于 action 字段加载数据）
 * @param {Boolean} props.isCreate - 是否是创建表单（影响字段显示）
 * @param {String} props.labelWidth - 标签宽度，如 '120px' 或 'auto'
 * @param {String} props.layout - 布局方式：'horizontal' | 'vertical' | 'inline'
 * @param {Number} props.column - 列数，用于多列布局
 * @param {Boolean} props.loading - 是否显示加载状态
 * @param {Boolean} props.disabled - 是否禁用整个表单
 * @param {Boolean} props.submitter - 是否显示提交按钮，或提交按钮配置
 * @param {Object} props.formProps - 传递给 ProForm 的额外属性
 */
const SmartForm = forwardRef(function SmartForm({
	fieldsConfig = [],
	initialValues = {},
	onFinish,
	onFinishFailed,
	onValuesChange,
	beforeSubmit,
	actions = {},
	isCreate = true,
	labelWidth = 'auto',
	layout = 'horizontal',
	column = 1,
	loading = false,
	disabled = false,
	submitter = true,
	formProps = {},
	children,
}, ref) {
	const { message: messageApi } = App.useApp();
	const formRef = useRef(null);
	
	// 暴露 form 实例给父组件
	useImperativeHandle(ref, () => ({
		// 获取表单实例
		getFormInstance: () => formRef.current,
		// 获取表单值
		getFieldsValue: () => formRef.current?.getFieldsValue(),
		// 设置表单值
		setFieldsValue: (values) => formRef.current?.setFieldsValue(values),
		// 重置表单
		resetFields: () => formRef.current?.resetFields(),
		// 验证表单
		validateFields: () => formRef.current?.validateFields(),
		// 提交表单
		submit: () => formRef.current?.submit(),
	}));
	
	// 验证字段配置
	React.useMemo(() => {
		try {
			validateFieldsConfig(fieldsConfig);
		} catch (error) {
			console.error('Invalid fieldsConfig:', error);
			messageApi.error(`Configuration Error: ${error.message}`);
		}
	}, [fieldsConfig, messageApi]);
	
	// 处理表单提交
	const handleFinish = async (values) => {
		try {
			// 清理空数组项
			let processedValues = cleanArrayFields(values);
			
			// 执行 beforeSubmit 钩子
			if (beforeSubmit) {
				const transformed = await beforeSubmit(processedValues);
				if (transformed === false) {
					return false; // 取消提交
				}
				processedValues = transformed || processedValues;
			}
			
			// 调用 onFinish
			if (onFinish) {
				const result = await onFinish(processedValues);
				return result;
			}
			
			return true;
		} catch (error) {
			console.error('Form submit error:', error);
			messageApi.error(error.message || 'Submit failed');
			return false;
		}
	};
	
	// 计算 labelCol 和 wrapperCol（用于 horizontal 布局）
	const labelCol = layout === 'horizontal' ? {
		style: { width: labelWidth === 'auto' ? undefined : labelWidth },
	} : undefined;
	
	// 构建 grid 配置（多列布局）
	const gridConfig = column > 1 ? {
		grid: true,
		rowProps: { gutter: [16, 0] },
		colProps: { span: 24 / column },
	} : {};
	
	return (
		<ProForm
			formRef={formRef}
			initialValues={initialValues}
			onFinish={handleFinish}
			onFinishFailed={onFinishFailed}
			onValuesChange={onValuesChange}
			layout={layout}
			labelCol={labelCol}
			disabled={disabled}
			loading={loading}
			submitter={submitter}
			{...gridConfig}
			{...formProps}
		>
		{/* DynamicFormFields 会自动从 Form context 获取 form instance */}
		<DynamicFormFields
			fieldsConfig={fieldsConfig}
			isCreate={isCreate}
			actions={actions}
		/>
			{children}
		</ProForm>
	);
});

export default SmartForm;

