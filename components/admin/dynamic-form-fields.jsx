/**
 * 动态表单字段组件
 * 
 * 支持 showRule 和 disabled 条件渲染
 * 支持 watch 字段监听
 * 支持 action 自动加载数据
 * 支持 group 分组布局
 * 
 * 参考：
 * - ProComponents: https://procomponents.ant.design/components/form
 * 
 * 注意：不使用 ProFormGroup 是因为它内部使用 Space 布局，
 * 无法支持 Row/Col 栅格系统的精确宽度控制。
 * 我们使用自定义分组实现，保持与 ProFormGroup 相似的视觉效果。
 */

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Form, Row, Col, Typography, Divider } from 'antd';
import { evaluateRule } from '@/lib/crud/rule-evaluator';
import { FIELD_TYPE_REGISTRY } from '@/lib/crud/field-types';

const { Title, Text } = Typography;

/**
 * 动态表单字段渲染器
 * 
 * @param {Object} props
 * @param {Array} props.fieldsConfig - 字段配置
 * @param {Object} props.formInstance - antd Form 实例（可选，会自动从 Form context 获取）
 * @param {Boolean} props.isCreate - 是否是创建表单
 * @param {Object} props.actions - Server Actions（用于 action 字符串加载数据）
 */
export default function DynamicFormFields({ fieldsConfig, formInstance: propFormInstance, isCreate = false, actions = {} }) {
	// 从 Form context 获取 form instance
	// Form.useFormInstance 在 antd 4.20+ 可用，在 ProForm 内部会自动提供 context
	const contextFormInstance = Form.useFormInstance();
	
	// 优先使用 props 传入的 formInstance，否则使用 context 中的
	const formInstance = propFormInstance || contextFormInstance;
	
	// 使用 Form.useWatch 监听所有字段变化
	// 传入 formInstance 或 undefined（让 useWatch 使用最近的 Form context）
	const watchedValues = Form.useWatch([], formInstance || undefined) || {};
	
	// 使用 useMemo 稳定 formData 引用，只在值真正变化时更新
	const formData = useMemo(() => {
		return { ...watchedValues };
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [JSON.stringify(watchedValues)]);
	
	// 处理 action 自动加载数据
	const [actionData, setActionData] = useState({});
	const [loadingActions, setLoadingActions] = useState({});

	// 展平所有字段（包括 group 内的字段），用于收集 action
	const flattenFields = useMemo(() => {
		const result = [];
		const flatten = (fields) => {
			fields.forEach(field => {
				if (field.type === 'group' && field.columns) {
					flatten(field.columns);
				} else {
					result.push(field);
				}
			});
		};
		flatten(fieldsConfig);
		return result;
	}, [fieldsConfig]);

	// 收集所有需要通过 action 加载数据的字段
	useEffect(() => {
		const fieldsWithAction = flattenFields.filter(
			field => field.form?.action && typeof field.form.action === 'string'
		);

		if (fieldsWithAction.length === 0) return;

		// 加载所有 action 数据
		fieldsWithAction.forEach(async (field) => {
			const actionName = field.form.action;
			const action = actions[actionName];

			if (!action || typeof action !== 'function') {
				console.warn(`Action "${actionName}" not found for field "${field.key}"`);
				return;
			}

			// 标记加载中
			setLoadingActions(prev => ({ ...prev, [field.key]: true }));

			try {
				const result = await action();
				if (result.success && result.data) {
					setActionData(prev => ({ ...prev, [field.key]: result.data }));
				}
			} catch (error) {
				console.error(`Failed to load action "${actionName}" for field "${field.key}":`, error);
			} finally {
				setLoadingActions(prev => ({ ...prev, [field.key]: false }));
			}
		});
	}, [flattenFields, actions]);
	
	// 渲染单个字段（非 group）
	const renderField = (field, index) => {
		const typeConfig = FIELD_TYPE_REGISTRY[field.type];
		
		// 检查是否应该显示
		if (field.form === false || field.hideInForm) return null;
		
		// 创建表单排除不可创建的字段
		if (isCreate && field.createOnly === false) return null;
		
		// 编辑表单排除不可编辑的字段
		if (!isCreate && field.editOnly === false) return null;
		
		// 评估 showRule
		if (field.showRule) {
			const shouldShow = evaluateRule(field.showRule, formData, field);
			if (!shouldShow) return null;
		}
		
		// 评估 disabled 规则
		let isDisabled = false;
		if (field.disabled) {
			isDisabled = evaluateRule(field.disabled, formData, field);
		}

		// 处理 data 为函数的情况（动态选项）
		let processedField = { ...field };
		
		// 如果 data 是函数，调用它获取实际数据
		if (typeof field.data === 'function') {
			try {
				const computedData = field.data(formData);
				processedField = {
					...processedField,
					data: computedData,
					form: {
						...processedField.form,
						options: computedData,
						data: computedData,
					},
				};
			} catch (error) {
				console.error(`Error computing data for field ${field.key}:`, error);
				processedField = {
					...processedField,
					data: [],
					form: {
						...processedField.form,
						options: [],
						data: [],
					},
				};
			}
		}
		
		// 如果字段配置了 action，注入加载的数据
		if (field.form?.action && actionData[field.key]) {
			processedField = {
				...processedField,
				form: {
					...processedField.form,
					treeData: actionData[field.key], // 为 tree-select 提供数据
					options: actionData[field.key],  // 为 select 提供数据
					data: actionData[field.key],     // 通用数据字段
				},
				data: actionData[field.key], // 也注入到顶层
			};
		}
		
		// 获取字段组件
		let fieldComponent = null;
		
		// 自定义表单组件
		if (processedField.form?.render) {
			fieldComponent = processedField.form.render(processedField);
		}
		// 使用类型对应的表单组件
		else if (typeConfig?.form) {
			fieldComponent = typeConfig.form(processedField);
		}
		
		if (!fieldComponent) return null;
		
		// 如果有 disabled 规则，包装组件并传递 disabled 属性
		if (isDisabled) {
			// 克隆组件并添加 disabled 属性
			fieldComponent = React.cloneElement(fieldComponent, {
				disabled: true,
			});
		}
		
		// 如果有 watch，添加监听逻辑
		// 支持两种格式：
		// 1. watch: (params) => { ... }
		// 2. watch: { handler: (value, helpers) => { ... } }
		const hasWatch = field.watch && (
			typeof field.watch === 'function' || 
			(typeof field.watch === 'object' && typeof field.watch.handler === 'function')
		);
		
		if (hasWatch) {
			// 包装在 Form.Item 中以便访问 form 实例
			return (
				<FieldWithWatch
					key={field.key || `form-field-${index}`}
					field={processedField}
					fieldComponent={fieldComponent}
					formInstance={formInstance}
					formData={formData}
					index={index}
				/>
			);
		}
		
		return (
			<React.Fragment key={field.key || `form-field-${index}`}>
				{fieldComponent}
			</React.Fragment>
		);
	};
	
	// 渲染 group 类型（分组布局）
	// 
	// 为什么不使用 ProFormGroup？
	// ProFormGroup 内部使用 Space 组件布局，无法支持 Row/Col 栅格系统，
	// 导致字段宽度无法精确控制（会变得很窄）。
	// 我们使用自定义实现，保持相似的视觉效果，同时支持栅格布局。
	const renderGroup = (group, index) => {
		const columns = group.columns || [];
		
		return (
			<div key={group.key || `group-${index}`} style={{ marginBottom: 24 }}>
				{/* 分组标题 - 使用 Divider 实现类似 ProFormGroup 的效果 */}
				{group.title && (
					<Divider orientation="left" orientationMargin={0} style={{ marginTop: 0, marginBottom: 16 }}>
						<Title level={5} style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
							{group.title}
						</Title>
					</Divider>
				)}
				
				{/* 分组提示 */}
				{group.tips && (
					<Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
						{group.tips}
					</Text>
				)}
				
				{/* 分组内的字段，使用 Row/Col 栅格布局 */}
				<Row gutter={16}>
					{columns.map((field, fieldIndex) => {
						// 获取栅格配置 (默认 12 = 50%)
						const span = field.col?.span || 12;
						
						// 渲染字段
						const fieldElement = renderField(field, fieldIndex);
						
						if (!fieldElement) return null;
						
						return (
							<Col key={field.key || `field-${fieldIndex}`} span={span}>
								{fieldElement}
							</Col>
						);
					})}
				</Row>
			</div>
		);
	};
	
	// 主渲染逻辑
	const renderItem = (field, index) => {
		// 如果是 group 类型，使用分组渲染
		if (field.type === 'group') {
			return renderGroup(field, index);
		}
		
		// 否则渲染普通字段
		return renderField(field, index);
	};
	
	return (
		<>
			{fieldsConfig.map((field, index) => renderItem(field, index))}
		</>
	);
}

/**
 * 带 watch 功能的字段组件
 * 
 * 支持两种 watch 格式：
 * 1. watch: (params) => { ... }  // 函数形式
 * 2. watch: { handler: (value, helpers) => { ... } }  // 对象形式
 */
function FieldWithWatch({ field, fieldComponent, formInstance, formData, index }) {
	// 使用 ref 存储上一次的值，避免 state 更新导致的循环
	const prevValueRef = useRef(undefined);
	const isInitializedRef = useRef(false);
	
	// 监听当前字段的值
	const currentValue = formData[field.key];
	
	useEffect(() => {
		// 跳过首次渲染时的初始值设置（避免触发 watch）
		if (!isInitializedRef.current) {
			isInitializedRef.current = true;
			prevValueRef.current = currentValue;
			return;
		}
		
		// 只有值真正改变时才触发 watch
		// 使用 JSON.stringify 比较以处理对象/数组类型的值
		const prevValueStr = JSON.stringify(prevValueRef.current);
		const currentValueStr = JSON.stringify(currentValue);
		
		if (currentValueStr !== prevValueStr) {
			try {
				// 获取当前选项数据（如果有）
				const options = Array.isArray(field.data) ? field.data : [];
				const option = options.find(item => item.value === currentValue);
				
				// 创建 setFieldValue 辅助函数
				const setFieldValue = (key, value) => {
					formInstance?.setFieldsValue({ [key]: value });
				};
				
				// 支持两种格式
				if (typeof field.watch === 'function') {
					// 格式 1: watch: (params) => { ... }
					field.watch({
						value: currentValue,
						formData: formData,
						column: field,
						index: index,
						option: option,
						$set: setFieldValue,
						setFieldValue: setFieldValue,
					});
				} else if (typeof field.watch === 'object' && typeof field.watch.handler === 'function') {
					// 格式 2: watch: { handler: (value, helpers) => { ... } }
					field.watch.handler(currentValue, {
						formData: formData,
						column: field,
						index: index,
						option: option,
						$set: setFieldValue,
						setFieldValue: setFieldValue,
					});
				}
			} catch (error) {
				console.error(`Watch error for field ${field.key}:`, error);
			}
			
			// 更新 ref
			prevValueRef.current = currentValue;
		}
	}, [currentValue, field, formData, formInstance, index]);
	
	return (
		<React.Fragment key={field.key || `form-field-${index}`}>
			{fieldComponent}
		</React.Fragment>
	);
}

