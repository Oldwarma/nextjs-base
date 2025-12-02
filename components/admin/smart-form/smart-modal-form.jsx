/**
 * SmartModalForm - 智能模态框表单组件
 * 
 * 基于 SmartForm，封装为模态框形式
 * 
 * 特性：
 * - 继承 SmartForm 所有功能
 * - 支持全屏模式
 * - 支持自定义宽度
 * - 自动处理打开/关闭状态
 * - 支持 loading 状态
 * 
 * @example
 * ```jsx
 * <SmartModalForm
 *   title="Create User"
 *   open={visible}
 *   onOpenChange={setVisible}
 *   fieldsConfig={[
 *     { key: 'name', title: 'Name', type: 'text', form: { required: true } },
 *     { key: 'email', title: 'Email', type: 'text', form: { required: true } },
 *   ]}
 *   onFinish={async (values) => {
 *     const result = await createUserAction(values);
 *     if (result.success) {
 *       message.success('Created successfully');
 *       return true; // 自动关闭
 *     }
 *     message.error(result.error);
 *     return false; // 保持打开
 *   }}
 * />
 * ```
 * 
 * @see https://procomponents.ant.design/components/modal-form
 */

'use client';

import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef, useMemo } from 'react';
import { ModalForm } from '@ant-design/pro-components';
import { Button, App } from 'antd';
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import DynamicFormFields from '../dynamic-form-fields';
import { validateFieldsConfig } from '@/lib/crud/field-generator';
import nb from '@/lib/function';

/**
 * 表单内容包装组件
 * 
 * ModalForm 会通过 React.cloneElement 向子元素传递额外的 props（如 fieldProps、autoFocus 等）
 * 这个包装组件会吸收这些属性，只渲染 children，避免：
 * 1. "React does not recognize the `fieldProps` prop on a DOM element" 错误
 * 2. "Invalid prop `autoFocus` supplied to `React.Fragment`" 错误
 * 
 * 实现原理：
 * - 这是一个 React 函数组件，不是 DOM 元素
 * - 所有传递给它的 props（包括 fieldProps）都会被 React 正常处理
 * - 我们只使用 children，忽略其他所有 props
 * - 这样就不会有任何非标准属性被传递到 DOM 元素上
 */
const FormContentWrapper = React.memo(function FormContentWrapper(props) {
	// 只取 children，完全忽略其他所有属性（包括 fieldProps、autoFocus 等）
	return <>{props.children}</>;
});

/**
 * 清理表单数据中的空 array 项和非法值（如函数）
 */
function cleanArrayFields(values) {
	const cleaned = { ...values };
	
	Object.keys(cleaned).forEach(key => {
		const value = cleaned[key];
		
		// 过滤掉函数类型的值（可能是配置中的动态函数被意外包含）
		if (nb.pubfn.isFunction(value)) {
			delete cleaned[key];
			return;
		}
		
		if (nb.pubfn.isArray(value)) {
			cleaned[key] = value.filter(item => {
				if (item === null || item === undefined) return false;
				if (nb.pubfn.isFunction(item)) return false; // 过滤函数
				if (nb.pubfn.isString(item)) {
					return item.trim().length > 0;
				}
				return true;
			});
		}
	});
	
	return cleaned;
}

/**
 * SmartModalForm 组件
 * 
 * @param {Object} props
 * @param {String} props.title - 模态框标题
 * @param {Boolean} props.open - 是否打开
 * @param {Function} props.onOpenChange - 打开状态变化回调
 * @param {Array} props.fieldsConfig - 字段配置数组
 * @param {Object} props.initialValues - 表单初始值
 * @param {Function} props.onFinish - 表单提交回调，返回 true 表示成功并关闭
 * @param {Function} props.beforeSubmit - 提交前数据转换钩子
 * @param {Object} props.actions - Server Actions 对象
 * @param {Boolean} props.isCreate - 是否是创建表单
 * @param {Number|String} props.width - 模态框宽度，默认 600
 * @param {Boolean} props.enableFullscreen - 是否启用全屏按钮，默认 true
 * @param {Boolean} props.destroyOnHidden - 关闭时销毁内容，默认 true
 * @param {String} props.labelWidth - 标签宽度
 * @param {Object} props.modalProps - 传递给 Modal 的额外属性
 * @param {Object} props.formProps - 传递给 Form 的额外属性
 * @param {React.ReactNode} props.trigger - 触发器元素（可选，用于非受控模式）
 * @param {React.ReactNode} props.children - 额外的表单内容
 */
const SmartModalForm = forwardRef(function SmartModalForm({
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
	enableFullscreen = true,
	destroyOnHidden = true,
	labelWidth = 'auto',
	modalProps = {},
	formProps = {},
	trigger,
	children,
}, ref) {
	const { message: messageApi } = App.useApp();
	const formRef = useRef(null);
	const [isFullscreen, setIsFullscreen] = useState(false);
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
		setFullscreen: (value) => setIsFullscreen(value),
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
	
	// 处理打开状态变化
	const handleOpenChange = (visible) => {
		if (!visible) {
			// 关闭时退出全屏
			setIsFullscreen(false);
		}
		onOpenChange?.(visible);
	};
	
	// 构建标题（包含全屏按钮）
	const renderTitle = () => {
		if (!enableFullscreen) {
			return title;
		}
		
		return (
			<div style={{ 
				display: 'flex', 
				alignItems: 'center', 
				justifyContent: 'space-between', 
				width: '100%', 
				paddingRight: 48 
			}}>
				<span>{title}</span>
				<Button
					type="text"
					size="small"
					icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
					onClick={() => setIsFullscreen(!isFullscreen)}
					style={{ marginRight: -20, marginTop: -5, color: '#666' }}
				/>
			</div>
		);
	};
	
	// 计算实际宽度
	const actualWidth = isFullscreen ? '100vw' : width;
	
	// 构建 modalProps
	const mergedModalProps = {
		centered: !isFullscreen,
		wrapClassName: isFullscreen ? 'fullscreen-modal' : '',
		style: isFullscreen ? {
			top: 0,
			maxWidth: '100vw',
			height: '100vh',
			margin: 0,
			paddingBottom: 0,
		} : {},
		styles: {
			body: {
				maxHeight: isFullscreen ? 'calc(100vh - 110px)' : 'calc(90vh - 110px)',
				overflowY: 'auto',
				overflowX: 'hidden',
				paddingLeft: 32,
				paddingRight: 32,
			},
		},
		destroyOnHidden,
		...modalProps,
	};
	
	// 过滤掉不应传递给 ModalForm 的属性
	// fieldProps 是字段级别的属性，不应该传递给 ModalForm
	const {
		fieldProps: _fieldProps, // 移除 fieldProps，避免传递到 DOM
		...safeFormProps
	} = formProps;
	
	return (
		<ModalForm
			title={renderTitle()}
			open={open}
			onOpenChange={handleOpenChange}
			initialValues={initialValues}
			onFinish={handleFinish}
			width={actualWidth}
			formRef={formRef}
			grid={false}
			modalProps={mergedModalProps}
			trigger={trigger}
			{...safeFormProps}
		>
			{/* 
			 * 使用 FormContentWrapper 包装子组件
			 * ModalForm 会通过 cloneElement 传递 fieldProps、autoFocus 等属性给直接子元素
			 * FormContentWrapper 会吸收这些属性，避免传递到 DOM 或 Fragment
			 */}
			<FormContentWrapper>
				<DynamicFormFields
					fieldsConfig={fieldsConfig}
					formInstance={formInstance}
					isCreate={isCreate}
					actions={actions}
				/>
				{children}
			</FormContentWrapper>
		</ModalForm>
	);
});

export default SmartModalForm;

