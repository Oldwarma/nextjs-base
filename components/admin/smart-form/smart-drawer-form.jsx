/**
 * SmartDrawerForm - 智能抽屉表单组件
 * 
 * 基于 SmartForm，封装为抽屉形式
 * 适用于需要更大空间的表单场景
 * 
 * 特性：
 * - 继承 SmartForm 所有功能
 * - 支持左右两侧打开
 * - 支持自定义宽度
 * - 自动处理打开/关闭状态
 * - 支持 loading 状态
 * 
 * @example
 * ```jsx
 * <SmartDrawerForm
 *   title="Edit Profile"
 *   open={visible}
 *   onOpenChange={setVisible}
 *   placement="right"
 *   fieldsConfig={[
 *     { key: 'name', title: 'Name', type: 'text', form: { required: true } },
 *     { key: 'bio', title: 'Bio', type: 'textarea' },
 *   ]}
 *   initialValues={currentUser}
 *   onFinish={async (values) => {
 *     const result = await updateUserAction(values);
 *     if (result.success) {
 *       message.success('Updated successfully');
 *       return true;
 *     }
 *     message.error(result.error);
 *     return false;
 *   }}
 * />
 * ```
 * 
 * @see https://procomponents.ant.design/components/drawer-form
 */

'use client';

import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef, useMemo } from 'react';
import { DrawerForm } from '@ant-design/pro-components';
import { App } from 'antd';
import DynamicFormFields from '../dynamic-form-fields';
import { validateFieldsConfig } from '@/lib/crud/field-generator';

/**
 * 清理表单数据中的空 array 项和非法值（如函数）
 */
function cleanArrayFields(values) {
	const cleaned = { ...values };
	
	Object.keys(cleaned).forEach(key => {
		const value = cleaned[key];
		
		// 过滤掉函数类型的值（可能是配置中的动态函数被意外包含）
		if (typeof value === 'function') {
			delete cleaned[key];
			return;
		}
		
		if (Array.isArray(value)) {
			cleaned[key] = value.filter(item => {
				if (item === null || item === undefined) return false;
				if (typeof item === 'function') return false;
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
 * SmartDrawerForm 组件
 * 
 * @param {Object} props
 * @param {String} props.title - 抽屉标题
 * @param {Boolean} props.open - 是否打开
 * @param {Function} props.onOpenChange - 打开状态变化回调
 * @param {Array} props.fieldsConfig - 字段配置数组
 * @param {Object} props.initialValues - 表单初始值
 * @param {Function} props.onFinish - 表单提交回调，返回 true 表示成功并关闭
 * @param {Function} props.beforeSubmit - 提交前数据转换钩子
 * @param {Object} props.actions - Server Actions 对象
 * @param {Boolean} props.isCreate - 是否是创建表单
 * @param {Number|String} props.width - 抽屉宽度，默认 600
 * @param {String} props.placement - 抽屉位置：'left' | 'right'，默认 'right'
 * @param {Boolean} props.destroyOnHidden - 关闭时销毁内容，默认 true
 * @param {String} props.labelWidth - 标签宽度
 * @param {Boolean} props.submitter - 是否显示提交按钮，或提交按钮配置
 * @param {Object} props.drawerProps - 传递给 Drawer 的额外属性
 * @param {Object} props.formProps - 传递给 Form 的额外属性
 * @param {React.ReactNode} props.trigger - 触发器元素（可选，用于非受控模式）
 * @param {React.ReactNode} props.extra - 标题栏右侧额外内容
 * @param {React.ReactNode} props.children - 额外的表单内容
 */
const SmartDrawerForm = forwardRef(function SmartDrawerForm({
	title = 'Form',
	open,
	onOpenChange,
	fieldsConfig = [],
	initialValues = {},
	onFinish,
	beforeSubmit,
	actions = {},
	isCreate = true,
	width = 600,
	placement = 'right',
	destroyOnHidden = true,
	labelWidth = 'auto',
	submitter = true,
	drawerProps = {},
	formProps = {},
	trigger,
	extra,
	children,
}, ref) {
	const { message: messageApi } = App.useApp();
	const formRef = useRef(null);
	// 使用 state 存储 form instance，避免在渲染期间访问 ref
	const [formInstance, setFormInstance] = useState(null);
	
	// 当 formRef 准备好时，更新 formInstance state
	useEffect(() => {
		if (formRef.current && !formInstance) {
			setFormInstance(formRef.current);
		}
	}, [formInstance]);
	
	// 暴露方法给父组件
	useImperativeHandle(ref, () => ({
		getFormInstance: () => formRef.current,
		getFieldsValue: () => formRef.current?.getFieldsValue(),
		setFieldsValue: (values) => formRef.current?.setFieldsValue(values),
		resetFields: () => formRef.current?.resetFields(),
		validateFields: () => formRef.current?.validateFields(),
		submit: () => formRef.current?.submit(),
	}));
	
	// 验证字段配置
	useMemo(() => {
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
					return false;
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
	
	// 构建 drawerProps
	const mergedDrawerProps = {
		destroyOnHidden,
		placement,
		extra,
		...drawerProps,
	};
	
	return (
		<DrawerForm
			title={title}
			open={open}
			onOpenChange={onOpenChange}
			initialValues={initialValues}
			onFinish={handleFinish}
			width={width}
			formRef={formRef}
			grid={false}
			drawerProps={mergedDrawerProps}
			trigger={trigger}
			submitter={submitter}
			{...formProps}
		>
		<DynamicFormFields
			fieldsConfig={fieldsConfig}
			formInstance={formInstance}
			isCreate={isCreate}
			actions={actions}
		/>
			{children}
		</DrawerForm>
	);
});

export default SmartDrawerForm;

